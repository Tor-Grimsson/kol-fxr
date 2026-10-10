---
title: The filter chain
type: reference
status: active
updated: 2026-10-10
description: The per-layer post-FX chain data model — layer.filters[], MAX_FILTERS, makeStage, the normalizer, the tier-ordering helpers, tier-aware addFilter, and legacy single-filterId back-compat.
tags:
  - project/kol-fxr
  - domain/effects
  - editor/filter-chain
aliases:
  - filter-chain
covers:
  - the layer.filters stage shape
  - MAX_FILTERS and the one-engine rule
  - normalizeLayerFilters + legacy back-compat
  - the three tier-selecting helpers
sources:
  - src/editor/compose/filterChain.js
  - src/editor/compose/state.jsx
  - src/filters/index.js
related:
  - "[[INDEX|effects]]"
  - "[[02-canvas-tier|canvas tier]]"
  - "[[06-effects-panel|effects panel]]"
  - "[[07-render-export|render & export]]"
---

# The filter chain

Ported from labs `useCanvasFx`. Every effectable layer carries an ordered list of effect **stages** in `layer.filters`. `src/editor/compose/filterChain.js` owns the model: the stage shape, the normalizer that every reader routes through, and the helpers that split a chain into its three render tiers.

## The stage shape

```js
layer.filters = [{ id, key, enabled, params }, …]   // ≤ MAX_FILTERS (8)
```

| Field | Meaning |
|---|---|
| **`id`** | Filter def id in the registry (`src/filters/index.js`). |
| **`key`** | Per-stage uid — React list identity **and** sim-pool identity. Reaction-diffusion (dither) keys its engine pool on it, so a reorder doesn't reseed the sim. |
| **`enabled`** | Per-stage bypass (the eye toggle in the panel). |
| **`params`** | The stage's **own** param values, nested — NOT flat on the layer. Two stages of the same filter, or a filter param sharing a name with a layer prop, can't collide. |

`makeStage(filterId)` mints a fresh stage: params at `schemaDefaults(def.params)`, `enabled: true`, a fresh `key`, and `params.sweeps = []` when the def declares `sweeps` (see [[05-sweeps|sweeps]]).

## Chain rules

Enforced in `state.jsx`'s `addFilter` / `moveFilter`:

- **At most `MAX_FILTERS` (8) stages.**
- **At most one `kind:'engine'` (GL) stage, and it is always LAST.** Labs chained Canvas-2D fx only; a single terminal GL stage matches the `EngineFilterLayer` shape. Canvas and pixi adds insert *before* any engine stage; the panel disables the move arrows that would cross it.

## Tier ordering

The render applies stages in **tier order regardless of their array position**:

```
CANVAS stages (kind absent, Canvas-2D apply)
   → PIXI batch (kind:'pixi', GPU pixi-filters on one persistent app)
      → the single terminal GL ENGINE stage (kind:'engine')
```

Multiple pixi stages are allowed (they batch together); `addFilter` keeps the array in tier order so the panel list reads the way it renders. Three helpers slice a resolved chain by tier — each is what the corresponding renderer consumes:

| Helper | Returns |
|---|---|
| `enabledCanvasStages(layer)` | Enabled stages with `def.kind` neither `engine` nor `pixi`, in chain order. Feeds `runChain` ([[02-canvas-tier\|canvas tier]]). |
| `pixiStages(layer)` | Enabled `kind:'pixi'` stages, in chain order. Feeds `applyPixiStack` ([[03-pixi-tier\|pixi tier]]). |
| `enabledEngineStage(layer)` | The single enabled `kind:'engine'` stage (last one wins), or `null` ([[04-gl-engine-tier\|gl engine tier]]). |

Supporting resolvers: `bareChain(layer)` (normalized stage array, legacy-safe), `resolvedChain(layer)` (each stage `+ def`; stages whose id no longer exists keep `def:null` — the panel shows them, the renderer skips them), `hasEnabledFilters(layer)` (gates the export snapshot — [[07-render-export|render & export]]), and `firstFilterDef(layer)` (the "Effect · X" inspector row label).

## Backward compatibility

`normalizeLayerFilters(layer)` is the **one normalizer every legacy reader routes through**. The old model was a single `layer.filterId` plus that filter's params **flat on the layer** — localStorage drafts, library presets, and settings `.json` all still carry it.

- A layer with a `filters` array → its stages are shape-checked (`normalizeStage` backfills a missing `key`/`enabled`/`params`), `filterId` dropped.
- A legacy `filterId` layer → hydrated into a one-stage chain (`stageFromLegacy`), lifting the flat param values and folding the old single-sweep flat rig (`animate` / `sweepShape` / …) into a `params.sweeps` array via `makeSweep`.
- Old flat keys are **left on the layer untouched** — deleting them could eat a layer-owned prop sharing the name (a pattern layer's `bg` vs fx-ascii's `bg`).

It is **identity-preserving**: an already-normalized layer (or one with no filter at all) returns the *same* object, so render caches keyed on layer identity don't churn at load. `normalizeLayersDeep(list)` walks a layer list (group/bool children included) with the same identity discipline — it's the load-path entry point for drafts, presets, and settings.

> The legacy stage's `key` is **deterministic** (`legacy-<filterId>`), not a fresh uid: `bareChain()` may re-synthesize it every call for a layer that slipped load-normalization, and a churning key would remint React rows and sim-pool identities each render.

## Pinned-first stages and GL loops (2026-10-10, plan 26)

- A def with **`first: true`** (`fx-media`) is inserted at index 0 by `addFilter`, once per chain. Labs reads its page effect as the first stage that is *not* pinned first.
- **GL (engine) loops carry a chain.** The engine's canvas is copied each tick into a read-back source; the canvas tier and the pixi batch run on it into an output canvas placed first in the DOM (export snapshots it), with the GL canvas on top at opacity 0 so the orbit drag still lands. A GL loop never takes a GL engine stage — there is no GL→GL path. Labs generators expose this as **Post-processing** on the Style tab (the canvas tier).
