---
title: Camera & Motion
type: reference
status: active
updated: 2026-10-10
description: The viewport-camera motion layer that wraps every 2D loop, the Orbit tool and per-layer camera rig that drive 3D and 2D loops alike, per-layer duration/phase quantization, keyframe + camera-pose authoring, and the transport reset-epoch that governs sims and video.
aliases:
  - camera-motion
  - viewport
  - orbit
tags:
  - project/kol-fxr
  - editor/camera
  - editor/transport
  - domain/animation
covers:
  - the vp* viewport motion layer and its cover-zoom
  - the Orbit tool (viewport mode) and the per-layer camera rig
  - resolveCameraKeys — one rig over 3D and 2D loops
  - per-layer duration → integer cycle phase
  - KeyframeEditor, CameraPoseSlots, the resetCamera host channel
  - transport reset-epoch governance of sims + video
sources:
  - src/loops/lib/viewport.js
  - src/loops/contract.js
  - src/loops/registry.js
  - src/loops/gl/host.js
  - src/loops/gl/phase.js
  - src/editor/compose/LayerRenderer.jsx
  - src/editor/state/tools.jsx
  - src/editor/params/transport.js
related:
  - "[[../00-overview/INDEX|overview]]"
  - "[[../01-hierarchy/INDEX|hierarchy]]"
  - "[[../05-parameters-binding/INDEX|parameters & binding]]"
  - "[[../08-export/INDEX|export]]"
---

# Camera & Motion

Two independent camera systems, plus the clock that reseeds everything under them.

1. **Viewport motion** — a universal 2D *camera transform* (`vp*` params) the host wraps around any shape/pattern loop's own draw, so an opaque loop with no per-element hook still gets Spin/Zoom/Pulse/Wobble.
2. **The camera rig** — an *interactive* orbit: the **Orbit tool** (shortcut **C**) turns the canvas into a camera-drag surface, and a per-layer pointer rig writes yaw/pitch/dist into the layer's own camera params — working over both 3D engines and 2D loops.

Both are **seamless by construction** (every motion returns to its start at `u=1`) and both are driven by the one global [[../05-parameters-binding/INDEX|transport]] clock. A separate concern lives here too: per-layer **duration → phase** quantization, and the transport **reset-epoch** that restarts stateful sims and video.

## Viewport motion layer

`src/loops/lib/viewport.js` is the "Animation" layer for 2D loops. A loop's `draw(ctx, u, w, h, p)` paints the whole frame opaquely — there is no per-element handle to animate — so motion is applied as a **global camera** the host installs on `ctx` *around* the loop's own draw.

The camera splits into the archetype's two motion buckets:

| Bucket | Param | What it does | Range (step) |
|---|---|---|---|
| **Frame** (whole loop moves) | `vpSpin` | Whole-turn rotation — integer turns ⇒ seamless | 0–4 (1) |
| **Frame** | `vpZoom` | Static cover-zoom in | 1–2.5 (0.05) |
| **Form** (loop modulates in place) | `vpPulse` | Zoom "breathe" (sin) | 0–1 (0.05) |
| **Form** | `vpWobble` | Rotation oscillation, degrees (sin) | 0–30 (1) |
| **Form** | `vpRate` | Integer cycle count for pulse/wobble | 1–4 (1) |

`VP_DEFAULTS` is identity (`vpZoom:1`, everything else 0/1), so a loop that carries the params but leaves them alone renders **exactly as before** — `applyViewport` early-returns `false` (no transform) when spin/pulse/wobble are 0 and zoom is 1.

**Cover-zoom (the corner problem).** Rotating the frame would swing the loop's background rect off the canvas corners. The camera computes the worst-case angle it will reach (`π/4` for any spin, else `|wobble|`) and zooms just enough that the rotated frame always blankets the canvas: `cover = cos(maxAngle) + sin(maxAngle)` (≥1, √2 at 45°), and the effective zoom is `max(vpZoom·pulse, cover·1.02)`. No separate background fill is needed.

**The single draw seam.** Every 2D loop frame renders through `drawLoopFrame(ctx, loop, u, w, h, p)` — `save → applyViewport → loop.draw → restore`. That seam is used identically by the live paths (`LoopLayer`, `EffectedLayer`'s loop source, `EngineLoopFilterLayer`'s feed) and by the export path (`build.js`), so live and exported frames carry the same camera.

**Preset dropdowns.** The Frame/Form motion presets (`src/editor/params/motionPresets.js`, six families) are curated `vp*` value sets surfaced as dropdowns in the Animation tab — the same tab that renders the individual `vp*` sliders.

### How the params attach

The `vp*` schema is folded in at the **contract layer** (`src/loops/contract.js`), not edited into each loop:

```js
for (const def of [...SHAPE_LOOPS, patternRules]) {
  if (def?.params && !def.params.some((p) => p.key === 'vpSpin')) {
    def.params = [...def.params, ...VP_PARAMS]
    if (def.defaults) Object.assign(def.defaults, VP_DEFAULTS)
  }
}
```

| Group | Camera | Why |
|---|---|---|
| **shape** (Simple) + **pattern-rules** | Gets `vp*` folded in | The groups labs applied viewport to; `loopDefaults` folds the defaults into every new layer |
| **field** | Keeps its **own** `camera` schema (`camAngle`/`camZoom`) | Field loops carry a real static camera already |
| sims / penrose / optic | Bare | Their frame is accumulated history; a wrapping camera is still valid but un-schema'd |

The fold is idempotent under HMR (guarded on `vpSpin` already present).

## The Orbit tool

Orbit is a **viewport MODE, not a per-layer toggle** — the deliberate design point. A per-layer "orbit on/off" flag would fight the layer's move/marquee gesture; making it a global tool means only one interaction is ever armed.

| Fact | Value | Source |
|---|---|---|
| Tool id | `orbit` (in `TOOLS`) | `src/editor/state/tools.jsx` |
| Shortcut | **C** | `src/editor/state/keymap.js` (`tool-orbit`) |
| Tool-bar icon | `camera` | `TOOL_META.orbit` |
| Stage behavior | **Nothing** | `CanvasArea` `onStageMouseDown`: `if (tool === 'zoom' || tool === 'orbit') return` |

In orbit mode the stage does no select/create/move — the per-layer camera rig (below) owns the pointer over each camera-capable layer. Like Zoom, Orbit is a viewport tool that never commits a layer.

## The camera rig

`useCameraKeysDrag(def, layer, canvasRef)` in `src/editor/compose/LayerRenderer.jsx` is the pointer rig attached to every loop canvas. It is **enabled only when `tool === 'orbit'`** and the loop resolves a camera key map:

```js
const keys = useMemo(() => resolveCameraKeys(def), [def])
const enabled = !!(keys && tool === 'orbit')
```

| Gesture | Writes | Detail |
|---|---|---|
| **Drag horizontal** | `keys.yaw` | Delta scaled by the param's own span/600; wraps if the schema span is 360° or 2π, else clamps |
| **Drag vertical** | `keys.pitch` | Only if the loop declares a pitch axis (3D); clamped to the schema min/max |
| **Wheel** | `keys.dist` | Debounced (400 ms) into one undo step; no-op if the loop has no zoom axis |

The whole drag is one `beginTransaction`/`commitTransaction` pair (one undo step); the gesture snapshots yaw/pitch/dist at pointer-down into its own accumulator because pointer/wheel events outrun React renders. It reads each param's schema from **both** `def.params` (pattern loops) and `def.camera` (field loops), and it writes **only the axes the loop declares** — a 2D loop with only a yaw axis never gets a phantom pitch write. The hook returns `enabled` so the host can set the `grab` cursor.

### One rig, 3D and 2D — `resolveCameraKeys`

`resolveCameraKeys(def)` in `src/loops/registry.js` is what makes the rig universal. It maps a loop def to `{ yaw, pitch, dist }` param keys:

| Loop kind | Camera keys | Interaction |
|---|---|---|
| **3D scene/engine** | Explicit `def.cameraKeys: { yaw, pitch, dist }` declared by the loop | Full orbit: drag rotates, wheel zooms |
| **field / pattern (2D)** | Auto-mapped: `camAngle → yaw`, `camZoom → dist` | Drag rotates, wheel zooms |
| **shape (Simple, 2D)** | No static angle exists; `vpZoom → dist` only | Wheel-zoom only — `vpSpin` is a *rate*, not an angle, so there is nothing to rotate to |

```js
export const resolveCameraKeys = (def) => {
  if (!def) return null
  if (def.cameraKeys) return def.cameraKeys           // 3D: explicit
  const has = (k) => (def.params ?? []).some((p) => p.key === k)
                  || (def.camera ?? []).some((p) => p.key === k)
  const keys = {}
  if (has('camAngle')) keys.yaw = 'camAngle'          // field/pattern rotate
  if (has('camZoom'))  keys.dist = 'camZoom'
  if (!keys.dist && has('vpZoom')) keys.dist = 'vpZoom' // shape: wheel-zoom only
  return keys.yaw || keys.dist ? keys : null
}
```

### Two 3D camera flavors

3D engine loops split by *how* they own their camera — the rig picks the right one:

- **OrbitControls engines** (`def.orbit`) — three.js `OrbitControls` own the pointer. The rig steps aside (`useCameraKeysDrag(def.orbit ? null : def, …)`); instead `EngineLoopLayer` toggles `controls.enabled` via `host.setCameraDrag(…, def.orbit && orbitMode)` and swallows pointer events so `CanvasArea`'s router never sees them. Their pose is drag state no param captures.
- **Param-camera engines** (`def.cameraKeys`, no `OrbitControls`) — pointer orbit writes the camera *params*; the standard rig drives them like a 2D loop.

## Per-layer duration & phase

`src/loops/gl/phase.js` lets each GL loop run at its own speed while the whole composition still loops seamlessly. Seamlessness demands the pose at `u=1` equals `u=0`, so a layer must run an **integer** number of engine cycles per one transport loop:

```js
export function layerCycles(duration, loopSeconds) {
  const d = Number(duration), L = Number(loopSeconds)
  if (!d || d <= 0 || !L || L <= 0) return 1
  return Math.max(1, Math.round(L / d))   // quantized, min 1
}
export function layerPhase(u, cycles) { return (u * cycles) % 1 }
```

A layer's `duration` (seconds) quantizes `loopSeconds/duration` to the nearest integer ≥ 1 — 1, 2, 3… full cycles per transport loop, never a fraction. Durations longer than the global loop clamp to one cycle (a layer can't be slower than the loop without breaking the loop point). The module is pure and three-free so inspector components import it statically.

`host.js` `driveEngine` applies it per `def.drive`:

| `drive` | Mapping |
|---|---|
| `phase` | `engine.renderAtPhase(u)` |
| `seek` | `su = layerPhase(u, layerCycles(DUR, transport.getLoopSeconds()))`, then `engine.seek(su); engine.frame(0)` |
| (else) free-running | `engine.frame(dt)` — advances only by host `dt` (0 while paused, still repaints the held frame) |

## Keyframe & camera-pose authoring

Two panels author camera/pose state on 3D scene loops (`src/editor/compose/inspectors/`):

**`KeyframeEditor.jsx`** — the scene (`scene3d`/PrimitiveEngine) keyframe timeline. The track is the layer's `keyframes` param, an array of `{ t: 0..1, rot:[x,y,z] radians, pos:[x,y,z], scale, ease }` kept sorted by `t`. Rotations are stored radians (engine-native), edited in degrees. Selecting a key pauses the transport and seeks its pose at `kf.t / cycles()` (the first cycle's instance, honoring the layer's phase quantization); **Add @ playhead** captures the layer-local phase `(getT()·cycles) % 1`.

**`CameraPoseSlots.jsx`** — labs CameraPanel's three save/recall slots (`layer._camSlots`) plus **Reset**. A "pose" is the layer's camera param values (`def.camera` rail + any schema params sectioned `Camera`). Click = recall (or save when empty), shift-click = overwrite. **Reset** patches the schema defaults back and — for engine loops — restores the live `OrbitControls` rig (position/target drag state no param captures) through the host action channel.

**The `resetCamera` host channel.** `host.js` keeps a `LIVE` map of engine instances keyed by the canvas `data-layer-id`, so a panel can reach a live engine without threading a ref through `LayerRenderer`. `hostAction(layerId, 'resetCamera')` is a whitelisted verb that calls `engine.resetCamera?.()`; `CameraPoseSlots` reaches it via a dynamic import (keeping three out of the base bundle).

`ParametersPanel.jsx` wires all of this: it renders the camera rail, the pose slots (`showCamSlots`), and a hint line — *"Press C (Orbit tool) to move the camera — {verb}"* — whose verb (`drag to orbit, scroll to zoom` / `drag to rotate, scroll to zoom` / `scroll to zoom`) is chosen from the loop's resolved camera keys.

## Transport governance — the reset-epoch

`src/editor/params/transport.js` carries a monotonic **reset epoch** bumped **only** by `stop()` and `rewind()`, never by `pause()`:

```js
stop()   { playing = false; t = 0; epoch++; notify() }
rewind() { t = 0; epoch++; notify() }
```

Pause must hold every sim exactly where it is, so it leaves the epoch alone; stop/rewind mean "fresh run". Stateful/free-running consumers key their state on `getEpoch()` and include it in their redraw signature (`LoopLayer`'s draw-skip `sig` carries `tctx.epoch`, so a stop at `t=0` still repaints the freshly-reset frame):

| Consumer | On epoch bump | Source |
|---|---|---|
| Optic reaction-diffusion | Reseeds the sim | `src/loops/optic/reaction.js` |
| Penrose protos | Retrigger from scratch | `src/loops/penrose/host.js` |
| Math spinner / orbits | Clear the persistence/trail buffer | `src/loops/math/spinner.js`, `math/orbits.js` |
| Video layers | Snap `currentTime` to `trimIn` | `LayerRenderer` `syncVideoTransport` |

`getCtx()` returns `{ t, mouse, stage, epoch }` — the same context the binding resolver reads each frame — so epoch flows to every subscriber through the normal tick.

## 2026-10-10 additions (plan 26)

- **The camera reaches every 2d generator.** `loops/registry.js` folds the viewport params (Spin · Zoom · Pulse · Wobble · Rate) onto `field`, `penrose`, `distress`, `paratype` and `modulator` too — contract.js's fold still covers shape + pattern-rules. Engines keep their own cameras; the Penrose sims stay off the time warp.
- **The 3D scene takes a model and has lights.** `scene3d`'s **Model** primitive loads an OBJ · GLB · STL (`meshSrc` / `meshType`), merged, centred and scaled into the default camera; the default is the Stanford Bunny in R2 (`kol-media/meshes/stanford-bunny.obj`, Stanford 3D Scanning Repository, Turk & Levoy 1994). A **Lighting** section drives the engine's key · fill · rim · ambient rig (key angle and height), and **Light orbit** turns the key around the subject in whole turns per loop.
