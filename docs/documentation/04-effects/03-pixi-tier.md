---
title: Pixi GPU tier
type: reference
status: active
updated: 2026-07-08
description: Tier 2 — the ~35-effect Pixi GPU batch. The data-only defs, the adapter mapping, the one persistent Pixi Application, the lazy code-split chunk, and the async supersede pattern that composites the result onto the layer canvas.
tags:
  - project/kol-fxr
  - domain/effects
  - editor/effects
aliases:
  - pixi-tier
covers:
  - the kind:'pixi' def grammar
  - the persistent Pixi Application
  - the lazy dynamic-import chunk
  - the supersede compositing pattern
sources:
  - src/filters/pixi/defs.js
  - src/filters/pixi/adapter.js
  - src/filters/pixi/pipeline.js
  - src/editor/compose/LayerRenderer.jsx
related:
  - "[[01-filter-chain|filter chain]]"
  - "[[02-canvas-tier|canvas tier]]"
  - "[[07-render-export|render & export]]"
---

# Pixi GPU tier

Tier 2 — a GPU batch of ~35 `pixi-filters` effects, ported from labs. It runs **after** the synchronous Canvas-2D chain and **before** any terminal GL engine. Added in the 2026-07-08 Wave F parity work; it's the one tier that is **async** (a Promise) and the one where **multiple stages batch** on a single GPU pass.

Three files, one per concern:

| File | Role |
|---|---|
| `pixi/defs.js` | DATA ONLY — the 35 `{ id, label, kind:'pixi', group, params }` defs. No pixi import, so it stays in the main chunk (consumed eagerly by the registry + picker). |
| `pixi/adapter.js` | The `{ type, params } → pixi-filters instance` switch. Statically imports `pixi.js` + `pixi-filters`. |
| `pipeline.js` | Drives the adapter on one persistent Pixi Application; exports `applyPixiStack`. Reached ONLY via dynamic `import()`. |

## Lazy code-split

`adapter.js` and `pipeline.js` are the only modules that import `pixi.js` / `pixi-filters`, and they are reached **only** through a dynamic `import('../../filters/pixi/pipeline.js')` in `LayerRenderer`. So pixi code-splits into its own lazy chunk (~414 KB, loaded on first use of a pixi'd layer) and adds ~zero to the main bundle. `defs.js` stays static because the picker needs the catalog eagerly — hence the strict data/engine split.

## The persistent Application

`pipeline.js` holds **one** Pixi `Application`, init'd lazily and reused across renders (`getApp()` memoizes a promise; a create-app-per-render pattern leaks GL contexts). Each `applyPixiStack` call:

1. resizes the renderer to the source dims and clears the stage;
2. builds throwaway textures/sprites from the source canvas (`CanvasSource`, synchronous — no `Assets.load`);
3. chains the filter instances natively via `sprite.filters = [...]`;
4. extracts at a **fixed `w × h` frame** (`extract.canvas`) so bounds-expanding filters (glow / shadow / bloom) clip at the edge like a fixed-size canvas rather than growing the container;
5. tears down every filter/sprite/texture — the app + GL context persist.

After the one-time `await` on app init the body runs synchronously to completion, so concurrent layer calls never interleave on the shared `app.stage`. The displacement filter is special-cased: a multi-octave grayscale noise canvas is built (`makeNoiseCanvas`) and its sprite added *behind* the main sprite.

Param keys are **verbatim from labs** — the adapter spreads them straight into the `pixi-filters` constructors. A few are flattened in the defs and re-nested in the adapter: displacement `scaleX/scaleY`, rgb-split `redX/blueX`, drop-shadow `offsetX/offsetY`, centre `centerX/centerY` (normalized 0–1, scaled to px per-filter), multi-color-replace `fromN/toN`.

## The supersede compositing pattern

The pixi pass is async but the render effect is synchronous, so `LayerRenderer`'s `runPixiPass` mirrors the `rasterizeLayer` supersede pattern. A ref holds `{ key, canvas }` (a landed result) or `{ pending }`:

- **Cache hit** (`ref.key === key`) → blit the cached result onto the layer canvas synchronously.
- **Cache miss** → snapshot the **pre-pixi** canvas output NOW (before any stale blit overwrites it) as the stable pixi source; set `{ pending: key }`; dynamic-import the pipeline and run `applyPixiStack`. A `pending` token drops superseded results; `forceDraw` bumps state when the fresh result lands, and the caller keys its redraw signature on the *result canvas identity* so the land actually re-runs the effect. While pending, the last good result (or the pre-pixi output) stays on screen — no pre-FX flash during a param drag.

The cache signature (`pixiSig`) is `upstream source token + enabled canvas/pixi stage id+params + dims`. It **deliberately excludes x/y** — dragging a pixi'd layer must not re-run the GPU pass; the layer canvas is repainted and the cached pixi result re-blitted.

## Catalog (7 groups)

The `group` field buckets the picker (`effectCategories.js` maps `group → pixi-<group>` category — see [[06-effects-panel|effects panel]]).

| Group | Effects |
|---|---|
| `color-adjustments` | Adjustment · HSL Adjustment · Color Gradient · Color Map · Color Overlay · Color Replace · Multi Color Replace |
| `blur-sharpen` | Radial Blur · Zoom Blur · Motion Blur · Kawase Blur · Tilt Shift · Backdrop Blur |
| `distortion` | Displacement Map · Twist · Bulge/Pinch · Shockwave |
| `artistic` | ASCII · Cross Hatch · Dot Screen · CRT · Old Film · Glitch · RGB Split · Simplex Noise |
| `lighting` | Bloom · Advanced Bloom · Glow · God Ray · Simple Lightmap |
| `stylize` | Bevel · Drop Shadow · Outline · Reflection |
| `utility` | Convolution |

### Caveats (labs parity)

- `color-map` / `color-gradient` / `simple-lightmap` / `cross-hatch` / `backdrop-blur` / `convolution` construct with default/empty params (`color-map` may want a runtime `colorMap` texture).
- The `webcam → pixi → engine` 3-way stack caches at the first frame (no per-frame token on that path); `webcam → pixi` alone is per-frame correct.
