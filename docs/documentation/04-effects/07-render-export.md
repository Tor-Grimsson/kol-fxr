---
title: Render & export
type: reference
status: active
updated: 2026-07-08
description: How effect chains run at render time — the per-layer-type renderer dispatch in LayerRenderer, retina dpr handling, and export via the live-canvas snapshot in build.js.
tags:
  - project/kol-fxr
  - domain/effects
  - editor/render-export
aliases:
  - render-export
covers:
  - the LayerRenderer effect-host dispatch
  - retina dpr backing
  - the live-canvas snapshot export
sources:
  - src/editor/compose/LayerRenderer.jsx
  - src/editor/compose/build.js
  - src/editor/compose/rasterizeLayer.js
  - src/editor/compose/filterChain.js
related:
  - "[[01-filter-chain|filter chain]]"
  - "[[02-canvas-tier|canvas tier]]"
  - "[[03-pixi-tier|pixi tier]]"
  - "[[04-gl-engine-tier|gl engine tier]]"
---

# Render & export

Effect chains render live on a `<canvas>` per layer, and export is a **snapshot of that live canvas** — the DOM renderer owns the pixels, so export never re-runs the chain.

## Renderer dispatch

`LayerRenderer` switches on `layer.type`, then on whether the layer has an effect chain, to pick a host. It splits the chain into tiers up front (`chainFor` = `enabledCanvasStages`, `pixiFor` = `pixiStages`, plus `enabledEngineStage`) and routes:

| Layer state | Host |
|---|---|
| Photo/video/webcam, canvas and/or pixi stages, no engine | `FilteredPhotoLayer` |
| Photo/video/webcam terminating in a GL engine | `EngineFilterLayer` |
| Loop / pattern / shape / text / path / bool with canvas and/or pixi stages | `EffectedLayer` |
| 2D loop terminating in a GL engine | `EngineLoopFilterLayer` |
| No enabled stages | the plain host (`PhotoLayer` / `LoopLayer` / `ShapeLayer` / …) |

**Sources per host:** photos use a fitted source canvas (`fitSource`, rebuilt on src/fit/size change); 2D loops draw `loop.draw` synchronously into a reused source canvas each frame; SVG types (shape/path/text/pattern) rasterize async via `rasterizeLayer`, cached by `sourceKey` so **filter-param edits never re-raster** (only content edits do). The chain then runs `runChain` → `runPixiPass` → (engine feed), each host wired to the same tier order ([[01-filter-chain|filter chain]]).

**Live vs static subscription:** a host subscribes to the transport only when the chain is animated (`chainAnimated`) or the source is live; still layers skip identical redraws via a signature that includes the layer identity, `t`, dpr, the resolved source, and the pixi result identity — so an async raster or pixi land still repaints, but unrelated re-renders don't.

## Retina / dpr

Every effect canvas is backed at **layer px × dpr**, `dpr = Math.min(2, window.devicePixelRatio || 1)`. The backing store is `w·dpr × h·dpr`; the ctx is `setTransform(dpr, 0, 0, dpr, 0, 0)` so drawing is in CSS px while the chain keeps full retina resolution. Filters size their work off the source's own pixel dims (the source is backed at dpr too), and `ctx` stays in CSS px — the dpr-scaled-source contract holds through the whole chain and through the pooled chain intermediates. GL engine feeds live at CSS px (`fitSource(scale 1)`); the pixi batch runs at the source's backing dims.

## Export — live-canvas snapshot

`build.js` builds the export SVG. Effected layers are gated by `hasEnabledFilters(layer)` and snapshotted from the mounted canvas rather than re-rendered:

```
document.querySelector(`canvas[data-layer-id="${layer.id}"]`)
  → live.toDataURL('image/png')
  → <image href="…" x y width height/>
```

- **Filtered photos** — snapshot the live filter-chain canvas (holds the full chained result incl. any terminal GL stage). Cropped photos (`imgW` set) ignore filters and fall through to the plain photo path.
- **Effected non-photo layers** (shape/text/pattern/path/loop) — same snapshot branch in `layerToSvg` (the `hasEnabledFilters && type !== 'photo'` gate); the group wrap still applies opacity/blend/rotation.
- **Engine loops** — `loopLayerSvg` snapshots the live canvas (engines render with `preserveDrawingBuffer`, so `toDataURL` captures the current frame). Spinning a throwaway engine offscreen per export would drag the whole GL setup along.

Non-effected vector layers export as real SVG; kinetic-type layers export as **vector** (the live engine's SVG subtree is serialized, not rasterized). `snapScale` (default 2) sets the raster snapshot resolution for the canvas-snapshot paths.

> Because export reads the mounted canvas, a layer must be rendered (its host mounted) for its effects to appear in the export — the snapshot branches fall through to the plain paths when no canvas is found.
