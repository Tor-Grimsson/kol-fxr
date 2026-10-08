---
title: Export pipeline
type: reference
status: active
updated: 2026-07-08
description: How a click becomes a file — the no-live-canvas model, the six-step PNG flow, the build.js SVG builder (per-type dispatch, glyph outlines, kinetic subtree, raster snapshots), and the shared download helper.
tags:
  - project/kol-fxr
  - domain/export
  - editor/export
aliases:
  - export-pipeline
  - export-flow
covers:
  - the no-live-canvas model
  - the six-step click-to-file PNG flow
  - the build.js SVG builder and per-layer dispatch
  - lib/download.js
sources:
  - src/editor/compose/useComposeFile.js
  - src/editor/compose/build.js
  - src/editor/lib/download.js
  - src/editor/params/resolve.js
related:
  - "[[INDEX|export]]"
  - "[[03-formats|formats]]"
  - "[[05-clocks|the three clocks]]"
  - "[[../04-effects/07-render-export|effect render & export]]"
---

# Export pipeline

**The one fact everything follows from: there is no single live canvas to screenshot.** Layers are separate DOM and `<canvas>` elements, so an export cannot grab the page — it **rebuilds the whole document from scratch as one SVG string**, then either saves that string (SVG) or paints it onto a throwaway canvas and reads the pixels back (PNG / webm).

## The six steps

Click **Export PNG** → file, in order (`useComposeFile.js` → `build.js` → `lib/download.js`):

1. **`onExportPng(k)`** — the footer button fires with the `@Nx` scale `k ∈ {1,2,3}` (guarded — an event-object caller falls back to `1`). See [[02-sizing|sizing]].
2. **`buildArgs()`** — freeze the current frame: `resolveLayersDeep(layers, transport.getCtx())` resolves every animated/bound prop at the transport's current `t`, and grabs `palette`, `aspect`, `canvasW/H`. Transport time is resolved *inside* the handler, not in the hook body — see [[06-parity|parity]].
3. **`warmExportFonts()`** — `await` font parsing *before* the synchronous build: text needs its TTF parsed into glyph outlines, kinetic needs its faces as base64 `@font-face`. A cold cache falls back to system fonts (or `foreignObject` for text).
4. **`buildLayersSvg()`** — walk the stack; emit **one `<svg>` string** (see below).
5. **`svgToPngBlob()`** — load the string into `new Image()`, draw it onto a `<canvas>` at `k×`, `canvas.toBlob('image/png')`.
6. **`downloadBlob()`** — objectURL + `<a download>` click + revoke → the file lands in Downloads.

## The `build.js` SVG builder

`buildLayersSvg({ layers, palette, aspect, canvasW, canvasH, rasterScale })` produces the export SVG. It emits an outer `<svg width={outW} height={outH} viewBox="0 0 vw vh">` and maps each layer through **`layerToSvg`**, which dispatches on `layer.type`:

| Layer type | Becomes |
|---|---|
| text · shape · pattern · path · bool · logo | **real SVG geometry** (outlines, `rect/ellipse/polygon`, `<pattern>` def, collapsed boolean `<path>`, inlined logo) |
| loop · filtered layer · video | **raster `<image>` snapshot** of the live canvas (Canvas2D draws can't be vectorized) |
| group | a `<g>` recursing back into `layerToSvg` per child |

The per-format *production* detail (how each of these is actually built, and the true-vector guarantees) lives in [[03-formats|formats]]. The **effected-layer** snapshot mechanics — how a filtered/GL layer's live canvas is captured, and why a layer must be mounted to export its effects — are owned by [[../04-effects/07-render-export|effect render & export]]; this doc does not repeat them.

## Downloads

Every browser download funnels through **`src/editor/lib/download.js` → `downloadBlob(blob, filename)`** (objectURL + anchor `.download` + click + revoke). PNG/SVG/webm/zip all end here.

## Every other format is a variation on step 4

| Format | How it differs from the PNG path |
|---|---|
| **SVG** | Stop after step 4 — the string *is* the file (`downloadComposeSvg`). No canvas, no raster; `@Nx` is irrelevant. See [[03-formats|formats]]. |
| **webm loop** | Seek + rasterize one transport loop frame-by-frame (step 4), encoding each frozen frame as VP9 via Mediabunny's `CanvasSource` (WebCodecs under the hood). See [[03-formats|formats]]. |
| **batch zip** | Run steps 2–5 once per aspect×scale combo (`renderComposePngBlob`), then bundle every PNG with `makeZip`. See [[04-batch-and-record|batch & record]]. |
| **live record** | Not seek-driven — samples the *live* transport per `rAF`. See [[04-batch-and-record|batch & record]] and [[05-clocks|the three clocks]]. |
| **project `.json`** | Not this path at all — `onSaveSettings` serializes the frame *spec* (not pixels) to `kol-fxr.json`, and `onLoadSettings` reads it back via `loadPreset`. Documented under [[../11-persistence/02-project-files|project files]]. |
</content>
