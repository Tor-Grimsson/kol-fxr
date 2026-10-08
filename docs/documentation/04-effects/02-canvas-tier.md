---
title: Canvas-2D tier
type: reference
status: active
updated: 2026-07-08
description: Tier 1 — the Canvas-2D effect set. fxCore.runChain / runFx, the per-source ImageData cache, the dry/wet Amount contract, and the full catalog (glass, scanline, dither, radar FX, ASCII, halftone, bitmap, FX-rack).
tags:
  - project/kol-fxr
  - domain/effects
  - editor/effects
aliases:
  - canvas-tier
covers:
  - the Canvas-2D filter def contract
  - runChain / runFx / buffersFor caching
  - the Amount dry/wet mix
  - the full canvas filter catalog
sources:
  - src/filters/fxCore.js
  - src/filters/index.js
  - src/filters/glass.js
  - src/filters/scanline.js
  - src/filters/dither.js
  - src/filters/fxRadar.js
  - src/filters/fxAscii.js
  - src/filters/fxHalftoneDither.js
  - src/filters/fxBitmap.js
  - src/filters/fxEffects.js
related:
  - "[[01-filter-chain|filter chain]]"
  - "[[05-sweeps|sweeps]]"
  - "[[03-pixi-tier|pixi tier]]"
---

# Canvas-2D tier

Tier 1 of the chain — synchronous Canvas-2D filters, each a full `apply` pass over a source `<canvas>`. This tier runs first; its output feeds the pixi batch, then any terminal GL engine ([[01-filter-chain|filter chain]]).

## The filter def contract

```js
{
  id:       string,          // unique, kebab-case
  label:    string,          // inspector dropdown label
  animated: bool,            // false = never subscribes to the transport
  params:   ParamSchema[],   // same grammar as loops / editor schemas
  apply(ctx, src, w, h, p, u)
}
```

- **`src`** — a canvas holding the FITTED source image at `w × h` CSS px. The host rebuilds it as a NEW canvas when the image / fit / size changes, so filters key their per-source caches on canvas **identity**.
- **`ctx`** — the destination, already dpr-transformed so 1 unit = 1 CSS px. A filter may draw `src` and distort it, or read its pixels directly.
- **`p`** — the resolved stage params (`+ id`, a stable per-layer+stage identity injected by the renderer so sim-pooled filters never share state).
- **`u`** — transport time ∈ [0,1].

## Shared plumbing — `fxCore.js`

| Export | Role |
|---|---|
| `runChain(ctx, src, w, h, stages, u)` | The chain runner. Stage *i*'s output feeds stage *i+1*: the last stage draws into `ctx`; earlier stages render into pooled intermediates at the source's own backing size (the dpr-scaled source contract holds through the whole chain). Each intermediate is `invalidateSource`'d after every write so identity-keyed pixel caches re-read it. Empty chain → straight `drawImage(src)`. |
| `runFx(ctx, src, w, h, processor, params, amount)` | Buffer-filter helper. Runs a labs `(srcData, outData, w, h, params)` processor over cached ImageData, applies the Amount mix, and blits through a transform-aware scratch canvas (`putImageData` ignores the ctx dpr transform). |
| `buffersFor(src)` | Per-source ImageData cache (WeakMap on canvas identity): base pixels read once, out buffer reused every frame — no per-frame `getImageData`/allocation. Shared with glass (displacement) and halftone-dither. |
| `invalidateSource(src)` / `registerSourceCache` | Every identity-keyed cache registers here so a source whose *pixels* changed under a *stable* identity (chain intermediates, in-place loop redraws) can be dropped. |
| `sinHash2` / `intHash2` | The two deterministic 2D hashes used across filters. |
| `mixSourceOver(ctx, src, w, h, amount)` | Amount for DRAW-based filters (the halftone trio paints glyphs, not buffers): paints the fitted source back over the effect at `1 − amount`. |

**Amount** (`AMOUNT_PARAM`, key `amount`, 0–100, default 100) is the labs dry/wet mix: how much of the processed result blends back over the original. It's flagged `noRandom` — it's a blend dial, not a look param, so a seeded Randomize won't thrash it.

## Catalog

Assembled in `src/filters/index.js`. All are Canvas-2D (`kind` absent) except where a tier is noted.

**Standalone (`glass.js`, `scanline.js`, `dither.js`)**

| id | label | Notes |
|---|---|---|
| `glass` | Glass | 10-pattern displacement (refracting sheet). Preset param `pattern`; carries source alpha. |
| `scanline` | Scanline | Src luma drives mark density (160px downscaled luma sampler cached). Preset param `look` (Photo / Lines / Mesh / Ascii). |
| `dither` | Dither | Gray-Scott reaction-diffusion seeded from src luma; per-layer sim pool keyed on `p.id`; free-running. Preset param `palette`. |

**Radar FX (`fxRadar.js` — `RADAR_FX`)**

| id | label |
|---|---|
| `fx-chromatic` | RGB Split |
| `fx-edge` | Edge Detect |
| `fx-posterize` | Posterize (2–32 levels) |
| `fx-pixelsort` | Pixel Sort |
| `fx-mirror` | Mirror |
| `fx-kaleido` | Kaleidoscope |
| `fx-threshold` | Threshold |

**Halftone trio (`fxAscii.js`, `fxHalftoneDither.js`, `fxBitmap.js`)** — cell-grid filters, each `sweeps: true` (see [[05-sweeps|sweeps]]).

| id | label | Preset param |
|---|---|---|
| `fx-ascii` | ASCII | `algorithm` |
| `fx-halftone-dither` | Dither | `mode` |
| `fx-bitmap` | Bitmap | `palette` |

**FX rack (`fxEffects.js` — `EFFECTS_FX`)** — the Canvas-2D imagefilters set, each carrying its own `amount`.

`fx-hsl` · `fx-hsv` · `fx-brightness` · `fx-contrast` · `fx-rgb` · `fx-invert` · `fx-sepia` · `fx-grayscale` · `fx-enhance` · `fx-blur` · `fx-pixelate` · `fx-solarize` · `fx-emboss` · `fx-noise`

`fx-noise` is the only animated one: the labs pass rolled `Math.random()` per frame (never seamless), so it's replaced by a deterministic per-pixel hash whose seed steps `floor(u·flicker) mod flicker` — an integer number of frames per loop, `frame(0) === frame(1)` exactly.

> The categories the panel groups these under (Halftone / Scanline / CRT / Refraction / FX rack / Pattern) live in `effectCategories.js`, not the registry — see [[06-effects-panel|effects panel]]. That list carries a few ids **defensively** (e.g. `fx-sharpen`) with no registered filter; an unregistered id simply doesn't render.
