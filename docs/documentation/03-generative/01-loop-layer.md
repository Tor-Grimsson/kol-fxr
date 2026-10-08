---
title: The Loop Layer
type: reference
status: active
updated: 2026-10-08
description: What a loop layer is, the generative families it can host, the loop-def contract, the registry, the taxonomy, and how LoopPicker applies a preset.
tags:
  - project/kol-fxr
  - domain/generative
  - editor/loops
aliases:
  - loop-layer
covers:
  - the loop layer and its flat-param model
  - every generative family and its registry group
  - the loop-def contract (2d draw vs gl engine)
  - registry helpers (loopById / presetParams / loopBgToggleable)
  - the taxonomy trees and LoopPicker preset apply
sources:
  - src/loops/contract.js
  - src/loops/registry.js
  - src/loops/taxonomy.js
  - src/loops/gl/catalog.js
  - src/editor/compose/inspectors/LoopPicker.jsx
related:
  - "[[INDEX|generative]]"
  - "[[01-hierarchy/INDEX|the app hierarchy]]"
  - "[[02-scoped-randomize|scoped randomize]]"
  - "[[04-engines-and-schema|engines and schema params]]"
---

# The Loop Layer

A **loop layer** (`layer.type === 'loop'`) is a compose layer whose content is one imported *generative loop*. A loop is a **seamless, parameterized motion source that is a pure function of normalized time `u∈[0,1]`** (`src/loops/contract.js`) — deterministic, scrubbable, exportable. The `misc` layer is the same machinery with a different picker tree (Para Type; see *Taxonomy* below).

## The flat-param model

When a preset is picked, its full param object is **spread flat onto the layer** — not stored as a nested preset reference. `LoopPicker.applyPreset` calls `updateLayer(id, { loopId, presetId, ...presetParams(preset) })`, so a scanline's `flow`, a field's `palette`, a scene's `primitive` all become top-level `layer[key]` values.

This is the whole reason the curation stack works uniformly:

- **Bind dots / the timeline** attach to `layer[key]` — any schema param is animatable.
- **Randomize** ([[02-scoped-randomize|scoped randomize]]) reads and writes `layer[key]`.
- **Motion / Look presets** ([[03-motion-and-look-presets|motion and look presets]]) patch `layer[key]`.
- The renderer reads `layer[key]` straight into `draw(...)` or the GL engine.

## The generative families

Each family is a registry **group**; a loop layer's `loopGroup` selects it. Groups map to hierarchy TYPES in [[01-hierarchy/INDEX|the app hierarchy]] — several 2D groups collapse under the "Loops" type, several GL groups under "3D Scene".

| Family | Group id(s) | Runtime | What it makes |
|---|---|---|---|
| **Scanline** | `scanline` | 2D draw | CRT/scanline generator — 6 categories (Spaced · Glyph · Lattice · Vortex · Rings · Spiral). Rings are closed paths: the mark accumulator is pre-rolled once around each ring, so there is no seam at 3 o'clock (2026-10-08). |
| **Pattern** | `pattern` | 2D draw | The `pattern-rules` engine — `tiles` / `field` / `weave` render kinds, rule stacks. |
| **Pattern Loops** | `patternloop` | 2D draw | Presets only, driving the *same* `pattern-rules` engine (labs `/loops` pattern gallery). |
| **Simple** | `shape` | 2D draw | 16 shape loops (blob, spiral, rose, lissajous, radialBars, waveGrid, …). |
| **Field** | `field` | 2D draw | 10 per-pixel scalar fields (plasma, swirl, moiré, contour, interference, halftone, …), each with a **Camera rail**. |
| **Math** | `math` | 2D draw | 7 loop defs: `math-surface` · `math-curves` · `math-field` · `math-waveform` · `math-spinner` · `math-orbits` · `math-threads`. |
| **Penrose** | `penrose` | 2D (free-running sims) | 55 generative-typography prototypes (15 foundations + 40 round-2 territories). |
| **Abstract** | `abstract` | GPU sim | Reaction-Diffusion (`abstract-rd`) + Turing/MSTP (`abstract-mstp`), plus dither variations. |
| **Optic** | `optic` | 2D draw | The 4 labs generator pages (halftone / moiré / reaction / mesh-gradient). Parked under EFFECTS > Pattern. |
| **Para-type** | `paratype` | 2D draw | Glyph loops + 9 style presets, Classic / Skeleton engines. Lives on the **misc** layer. |
| **Drift** | `drift` | GL engine (`phase`) | Air / Water / Cloth shader fields (one loop per family, `family` picks the fragment shader). |
| **Gradients** | `gradients` | GL engine (`dt`) | `iridescent` (cat×type shader) + `meshgradient` (single-tile / grid-of-9). |
| **Soft Forms** | `softforms` | GL engine (`dt`) | 2D SDF metaball scenes (`forms` array carried as an opaque param). |
| **Soft Forms 3D** | `softforms3d` | GL engine (`dt`) | 3D SDF scenes, drag-orbit camera (`camTheta`/`camPhi`/`camDist`). |
| **3D Scene** | `scene` | GL engine (`seek`) | `PrimitiveEngine` — geometry × material × pose, keyframes, orbit. |
| **Forms** | `forms` | GL engine (`seek`) | Point-cloud forms (helix, torus, grid creatures). |
| **Environment** | `environment` | GL engine (`seek`) | Environment scenes (mountain, tunnel, …). |
| **Ribbon** | `ribbon` | GL engine (`seek`) | Swept ribbon geometry (glass / chrome), post FX. |

(Group list: `GROUPS` in `src/loops/registry.js` + `GL_GROUPS` in `src/loops/gl/catalog.js`. The GL engine mechanics are in [[04-engines-and-schema|engines and schema params]].)

## The loop-def contract

A loop def is a **data module** (`src/loops/contract.js`). Minimum shape:

| Field | Meaning |
|---|---|
| `id` | Unique kebab-case id (`loopById`). |
| `label` | Human name. |
| `group` | Registry group (family). |
| `kind` | `'2d'` \| `'3d'` \| `'engine'` — which runtime drives it. |
| `duration` | Seconds for one loop at tempo 120. |
| `params` | Declarative `ParamSchema[]` (the inspector auto-renders these). |
| `draw(ctx, u, w, h, params)` | **2D only** — paints the full frame in CSS px, a pure fn of `u`. |
| `camera` / `defaults` | Optional: a field loop's Camera rail schema; a complex loop's pre-built defaults object. |

GL defs replace `draw` with `engine` + `drive` (`'phase'` \| `'seek'` \| `'dt'`) — see [[04-engines-and-schema|engines and schema params]].

**Defaults.** `loopDefaults(loop)` builds the initial param object: a `defaults` object is deep-cloned if present (the pattern loop's rules array), otherwise it is assembled from `params[].default` plus `camera[].default`.

**Viewport-camera fold.** At module load, `contract.js` appends the universal 2D viewport params (`VP_PARAMS` — `vpSpin`/`vpZoom`/`vpPulse`/`vpWobble`) to the eligible groups (`shape` + the `pattern-rules` def) so they carry a camera without per-def edits. This is idempotent under HMR.

## The registry

`src/loops/registry.js` is the single source of truth — deliberately light (it imports loop *definitions* only, so the GL engines don't get dragged into the base bundle).

| Helper | Returns |
|---|---|
| `loopById(id)` | The loop def (falls back to the first). |
| `presetsInGroup(group)` / `presetsInSub(group, sub)` | Preset lists (a `sub` is a Category bucket). |
| `presetById(id)` | The preset. |
| `presetParams(preset)` | **The preset's full flat param object**: off-schema keys cleared to `undefined`, overlaid with `loopDefaults`, overlaid with the preset's own `params`. |
| `loopBgToggleable(def)` | Whether the layer's Background on/off toggle applies (false where bg feeds colour math or the loop is a fullscreen-quad GL engine). |
| `loopDrawParams(def, layer)` | Honours `layer.bgOn` by swapping the bg-roled colour to transparent at draw. |
| `resolveCameraKeys(def)` | The Orbit-tool drag map (3D scenes declare `cameraKeys`; 2D field/pattern loops get a synthesized `camAngle`/`camZoom` map). |

**Why `presetParams` clears off-schema keys.** Call sites *merge* the patch into the layer. Without an explicit `undefined` for a key a previous preset set off-schema (e.g. iridescent `freq`/`relief`), that stale value would survive a preset switch and render wrong. `presetParams` computes the union of off-schema keys any preset of the loop sets and nulls the ones the incoming preset doesn't.

## The taxonomy

`src/loops/taxonomy.js` restores the METHOD > TYPE > CATEGORY > PRESET levels over the flat registry (full model in [[01-hierarchy/INDEX|the app hierarchy]]):

| Export | Role |
|---|---|
| `GENERATIVE_TREE` | The GENERATIVE method's TYPES → group ids, in labs sidebar order. Multi-group types (`Loops` → shape/field/patternloop; `3D Scene` → scene/ribbon/forms/environment/abstract) mirror labs' own internal groups. |
| `MISC_TREE` | The misc layer's tree — `Para Type` today. |
| `PICKER_TREE` | `= GENERATIVE_TREE`. The loop layer's picker only offers Generative types. |
| `LEGACY_GROUP_LABELS` | Read-only identity for groups that live outside the tree (`optic` → "Pattern · Effects", `paratype` → "Para Type · Misc") so legacy layers still display. |

## How a preset applies — `LoopPicker`

`src/editor/compose/inspectors/LoopPicker.jsx` is the shared picker (Inspector + Parameters, so they can't drift). It renders up to four dropdowns:

1. **Type** — a `GENERATIVE_TREE` entry.
2. **Group** — a second dropdown *only* when the type spans several registry groups.
3. **Category** — the `sub` buckets of the group (if more than one).
4. **Preset** — plain preset names.

Picking at **any** level applies a preset (a type/group/category hop lands on that target's first preset). The apply is a **full param reset, not a patch** (labs semantic — a preset is a curated starting point):

```
updateLayer(id, {
  loopGroup, presetId, presetLabel, loopId,
  _framePreset: 'custom', _formPreset: 'custom', _lookPreset: 'custom',
  ...presetParams(preset),
})
```

The three `_*Preset: 'custom'` flags reset the motion/look quick-select dropdowns — a fresh preset is no longer described by them (see [[03-motion-and-look-presets|motion and look presets]]).
</content>
