---
title: Formats — PNG, SVG, webm loop
type: reference
status: active
updated: 2026-07-08
description: How each single-output format is produced — PNG rasterization, SVG as true vector (glyph outlines, kinetic subtree, native geometry, raster fallbacks), and the deterministic offline webm loop bake.
tags:
  - project/kol-fxr
  - domain/export
  - editor/export
aliases:
  - formats
covers:
  - PNG rasterization
  - SVG true-vector production per layer type
  - the offline webm loop bake
sources:
  - src/editor/compose/build.js
  - src/editor/compose/useComposeFile.js
  - src/editor/modes/type/textOutline.js
  - src/editor/kinetic/fonts.js
related:
  - "[[INDEX|export]]"
  - "[[01-pipeline|pipeline]]"
  - "[[04-batch-and-record|batch & record]]"
  - "[[05-clocks|the three clocks]]"
---

# Formats — PNG, SVG, webm loop

`build.js` walks the layer stack (`layerToSvg` dispatches per `layer.type`) and emits one SVG string; each single-output format consumes it differently.

| Format | Handler (`useComposeFile.js`) | How it is produced |
|---|---|---|
| **PNG** | `onExportPng(scale)` → `downloadComposePng` | SVG rasterized into an `<img>` and drawn to a canvas at `scale×` its own W/H, then `canvas.toBlob('image/png')`. |
| **SVG** | `onExportSvg` → `downloadComposeSvg` | The raw vector string, saved verbatim. Scale doesn't apply. |
| **webm loop** | `onExportWebm(scale)` | Offline bake of exactly one transport loop, WebCodecs-encoded frame-by-frame (below). |

## SVG — true vector

`build.js` reproduces the DOM render's visual semantics as real SVG geometry, not a screenshot:

- **Text → real glyph outlines.** `textLayerSvg` emits one `<path>` per line via `textOutlinePaths` (`src/editor/modes/type/textOutline.js`), matching the live TypeBlock layout (size / tracking / line-height / align / case / soft-wrap). Requires the cut's Font to be warm — export awaits `warmTextFonts` before the sync build. Cold cache or the `mono` cut (JetBrains Mono ships woff2-only, unparseable by opentype.js) falls back to a `foreignObject` HTML writer, which only renders in browser SVG consumers.
- **Kinetic → live vector subtree.** `kineticLayerSvg` clones the running engine's `<svg>` `<text>` subtree and inlines the used fonts as base64 `@font-face` CSS (warmed at layer mount, `src/editor/kinetic/fonts.js`). Crisp at any `@Nx`.
- **Patterns / shapes / booleans / paths / logos → native SVG.** Patterns become a `<pattern>` def + `<rect>` fill; shapes emit `rect/ellipse/polygon/line`; booleans render the live boolean result as the `<path>` it collapses to; brand logos embed the parsed logo SVG.
- **Loops / filtered layers / video → raster `<image>` snapshots.** Canvas2d draws can't be vectorized — these snapshot the live canvas (engine GL loops, filtered layers) or redraw the current frame (2d loops, video) to a data-URL `<image>`. The effected-layer snapshot mechanics are owned by [[../04-effects/07-render-export|effect render & export]].

## webm loop bake

`onExportWebm` bakes **exactly one seamless transport loop** (`u: 0 → 1`). `N = round(loopSeconds × 30)` frames at 30 fps; per frame it seeks `t = i/N`, rebuilds the resolved SVG, rasterizes it onto a scratch canvas, and encodes that frozen frame as VP9 via Mediabunny's `CanvasSource` (WebCodecs under the hood). Each frame carries an explicit `i/fps`-second timestamp, so the bake is **fully offline** — frames encode as fast as they rasterize, with zero dropped frames. (The old `captureStream(0)` + `track.requestFrame()` path both drifted *and* crashed: `requestFrame` is not a function on the capture track in current Chrome.) A private per-bake EMA smoothing store + one silent warm-up lap keep `smooth` bindings deterministic; a double-`rAF` per frame lets React's seek commit and kinetic/filter repaints flush before capture. Prior transport `t` and play state are restored after. `VideoEncoder`-gated — Safari (no WebCodecs) no-ops until it ships support.

**This is why the bake is deterministic — and why some content freezes.** Because it seeks `t`, only motion that is a pure function of `t` reproduces; free-running layers (engine loops / sim filters not derived from `u`) and video are held at whatever frame they were on. That fault line, and when to reach for Record instead, is [[05-clocks|the three clocks]].
</content>
