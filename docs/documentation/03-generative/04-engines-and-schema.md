---
title: Engines, Schema Params & Lifecycle
type: reference
status: active
updated: 2026-07-08
description: 2D draw fns vs GL engines, the lazy gl/host.js lifecycle (dispose / forceContextLoss), per-layer duration, the Wave-B schema-exposed engine params, and the field-loop camera rail.
tags:
  - project/kol-fxr
  - domain/generative
  - editor/engines
aliases:
  - engines-and-schema
  - engine-lifecycle
covers:
  - 2d draw fns vs gl engines and the three drive modes
  - createEngine / applyParams / driveEngine / destroyEngine
  - per-layer duration (phase.js) and seamless cycles
  - the Wave-B schema exposures and `when` gating
  - the field-loop camera rail + camera pose slots + orbit
sources:
  - src/loops/gl/host.js
  - src/loops/gl/phase.js
  - src/loops/gl/catalog.js
  - src/loops/field/camera.js
  - src/editor/compose/inspectors/ParametersPanel.jsx
related:
  - "[[INDEX|generative]]"
  - "[[01-loop-layer|the loop layer]]"
  - "[[03-motion-and-look-presets|motion and look presets]]"
---

# Engines, Schema Params & Lifecycle

Loops render two ways. **2D** loops (`kind: '2d'`) are pure draw functions; **GL** loops (`kind: 'engine'`) wrap a three.js engine. The split is deliberate: the registry stays light and three stays out of the base bundle.

## 2D draw fns vs GL engines

| | 2D loop | GL loop |
|---|---|---|
| `kind` | `'2d'` | `'engine'` |
| Render call | `draw(ctx, u, w, h, params)` — pure fn of `u`, paints the full frame in CSS px | an engine driven per `drive` mode |
| Where the code lives | the loop's own module (`src/loops/<family>/*.js`) | `src/loops/gl/*Engine.js`, imported **only** by `gl/host.js` |
| Bundle | eager (cheap) | **lazy** — `import('gl/host.js')` on first mount drags three into its own chunk |

The GL **catalog** (`src/loops/gl/catalog.js`) is DATA ONLY — groups, defs, presets, editor schemas — so the inspector pickers can read it without loading three. A GL def carries `engine` + one of three **drive modes**:

| `drive` | Semantics | Engines |
|---|---|---|
| `'phase'` | Deterministic `renderAtPhase(u)`. | Drift |
| `'seek'` | `seek(u)` + one externally-driven `frame(0)`; the host owns the playhead (paused false, speed 0) so the orbit camera keeps updating. | 3D Scene, Forms, Environment, Ribbon |
| `'dt'` | Free-running `frame(dt)` while playing; `dt=0` while paused still repaints the held frame (so param edits show). | Iridescent, Soft Forms, Mesh gradient |

## The engine lifecycle (`src/loops/gl/host.js`)

`gl/host.js` is the only module that imports the engines and adapts each native API to one host contract.

| Fn | Does |
|---|---|
| `createEngine(def, canvas)` | Builds the engine (`buildEngine` switch on `def.engine`), disables OrbitControls initially (they'd fight move-drag), and registers it in the `LIVE` map keyed by the canvas's `data-layer-id`. |
| `applyParams(def, engine, params)` | Pushes the **flat layer params** into the engine (per-engine mapping), then — for scene-type engines (`def.bgToggle`) — `setClearAlpha(0)` when `bgOn === false`, run *after* the engine update so internal `setClearColor` calls don't win. |
| `driveEngine(def, engine, { u, dt })` | Produces one frame per the drive mode (phase/seek/dt). |
| `destroyEngine(engine)` | Teardown. |
| `hostAction(layerId, action)` / `setCameraDrag(def, engine, on)` | Imperative side channels — panels reach a live engine (e.g. `resetCamera`) or toggle its interactive camera without a ref plumbed through the renderer. |

**Teardown is defensive** — it runs inside React's unmount cleanup, where a throw would blank the whole tree (the delete-a-layer bug):

1. `dispose()` (or `destroy()`) inside a `try/catch` — engines are being discarded anyway, so a failure is logged and swallowed.
2. `renderer.forceContextLoss()` — **releases the WebGL context immediately** instead of at GC. Chrome caps live contexts (~16) and force-loses the *oldest*, which can blank a still-live layer; releasing eagerly avoids that.
3. The engine is removed from the `LIVE` map.

## Per-layer duration (`src/loops/gl/phase.js`)

Some engines expose a `duration` param — how fast the layer's animation cycles relative to the **one** global transport loop. Seamlessness demands an **integer** cycle count (the pose at `u=1` must equal `u=0`), so an arbitrary ratio quantizes:

| Fn | Contract |
|---|---|
| `layerCycles(duration, loopSeconds)` | `max(1, round(loopSeconds / duration))` — a layer runs 1, 2, 3… full cycles per transport loop, never a fraction. Durations longer than the global loop clamp to one cycle. |
| `layerPhase(u, cycles)` | `(u * cycles) % 1` — the layer-local phase from the global playhead. |

`host.js` stores each engine's duration in a `DUR` WeakMap (set by `applyParams`, dies with the engine) and folds it into the `seek` mapping: `su = layerPhase(u, layerCycles(dur, transport.getLoopSeconds()))`. `phase.js` is pure and three-free, so inspector components can import it statically.

## Schema-exposed engine params (Wave-B exposures)

Wave B (2026-07-08) unhid ~30 engine-supported params that the catalog schemas never surfaced. They ride the standard `when` gate (`src/editor/params/schema.js`) so a knob only appears when the engine branch that reads it is active:

| Engine | Exposed | Gate |
|---|---|---|
| **Iridescent** | form sliders `angle` / `freq` / `winds` / `pitch` / `petals` / `mouth`, plus `sheen`/`gloss`/`relief` | per `cat` × `type` (the shader branch the preset pins). |
| **Soft Forms 2D/3D** | shading `rimPow` / `rimShift` / `sss` (+ 2D `bulge`/`relief`, 3D `metaball`) | shared `SOFTFORMS_PARAMS`; 2D-only knobs excluded from the 3D map. |
| **3D Scene** | primitive shape `pWinds` / `qWinds` / `detail` / `rounding` / `tube`, `flatShading`, XYZ-axis overlay | per `primitive`; material knobs per `materialType`; axis knobs `noRandom`. |
| **Ribbon** | `ribbonThickness` (Flatness), `corner`, wireframe fat-line | material-dependent (`ior`/`dispersion` glass-only, `metalness` chrome-only). |

Defaults are set to each engine's uniform fallback so an *ungated* preset renders unchanged.

## The field-loop camera rail (`src/loops/field/camera.js`)

Every **field** loop appends `CAMERA_SCHEMA` to its def as a `camera` array — the viewer's path *through* the 2D field over `u`:

| Key | Meaning |
|---|---|
| `camZoom` | Zoom the sample coordinates (0.25–3). |
| `camFlow` | Whole cycles per loop the field drifts through (integer → seamless). |
| `camAngle` | Rotation of the sample space (0–360°). |

`makeCam(u, p, w, h)` turns these into the per-frame transform (`sample()` maps screen px → field space). `contract.js loopDefaults` folds the camera defaults into a new layer; the field loop's `draw` reads them via `makeCam`.

**In the panel**, the camera rail was schema-present but never rendered until Wave A wired it: `ParametersPanel` re-sections the def's `camera` array under a **Camera** header in the Animation tab and hands it to `AutoControls`.

## Camera pose slots & the orbit tool

Beyond the field rail, `ParametersPanel` surfaces camera controls for engines that have a camera:

- **`CameraPoseSlots`** — save/restore/reset named poses (the layer's camera param values: field rail + any `section: 'Camera'` schema params — scene `fov`/orbit, softforms3d θ/φ/dist).
- **The Orbit tool (C)** — a viewport mode, not a per-layer toggle, so it never fights layer dragging. `resolveCameraKeys(def)` decides what a drag does: 3D scenes orbit; field/pattern loops rotate + zoom; shape loops zoom (`vpZoom`). `hostAction(layerId, 'resetCamera')` and `setCameraDrag` reach the live GL engine.
</content>
