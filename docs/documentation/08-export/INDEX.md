---
title: Export
type: index
status: active
updated: 2026-07-08
description: The compose-frame export system — how a click becomes a file, aspect/@Nx sizing, the PNG/SVG/webm formats, batch zip + live record, the three clocks that decide what animates, and render/export parity.
tags:
  - project/kol-fxr
  - domain/export
  - editor/export
aliases:
  - export
  - export-pipeline
related:
  - "[[../01-hierarchy/INDEX|hierarchy]]"
  - "[[../06-camera-motion/INDEX|camera & motion]]"
  - "[[../09-media/INDEX|media]]"
  - "[[01-pipeline|pipeline]]"
  - "[[05-clocks|the three clocks]]"
---

# Export

Everything a user takes *out* of the editor: a still (PNG/SVG), a seamless loop (webm), a whole preset-and-scale batch (zip), or the document itself (`.json`).

## The one-line model

**There is no single live canvas to screenshot.** Layers are separate DOM/`<canvas>` elements, so every export **rebuilds the whole document from scratch as one SVG string** (`build.js`), then either saves that string (SVG) or paints it onto a throwaway canvas and reads the pixels back (PNG/webm) — through one hook (`useComposeFile.js`) and one download helper (`lib/download.js`).

The offline path is deterministic: it *seeks* the transport clock frame by frame, so it can only reproduce motion that is a pure function of that clock. That single fact ([[05-clocks|the three clocks]]) decides what bakes and what freezes.

## Sections

| Doc | What it covers |
|---|---|
| [[01-pipeline\|pipeline]] | The click-to-file flow — the no-live-canvas model, the 6 steps, the `build.js` SVG builder (per-type dispatch, glyph outlines, kinetic subtree, raster snapshots), and `lib/download.js`. |
| [[02-sizing\|sizing]] | The aspect / `@Nx` model — the 7 fixed ratios (short side 1080) + `custom`, the Figma-style `@1/2/3x` scale, and the shared `export-specs` convention. |
| [[03-formats\|formats]] | PNG, SVG (true vector — glyph outlines / kinetic subtree / native geometry / raster fallbacks), and the offline webm loop bake. |
| [[04-batch-and-record\|batch & record]] | Batch multi-size zip export (the preset×scale matrix + the store-only zip writer) and live real-time webm record. |
| [[05-clocks\|the three clocks]] | What animates vs. what freezes — transport `t` vs `epoch`, timeline / loops / sims / video, and the Export-loop-vs-Record decision rule. |
| [[06-parity\|render / export parity]] | The fix-wave rules that make a download match the retina canvas — `@Nx` raster scaling, dpr, exact viewBox, pattern anchoring, font warming, transport time. |

## Where it surfaces

The rail footer's **Output** tab (`src/editor/shell/panels/EditorFooter.jsx`): Aspect dropdown, `@Nx` scale dropdown, then Export PNG / Export loop (webm) / Record / Batch export. The document `.json` save/open lives in the File menu — its format is documented under [[../11-persistence/INDEX|persistence]], not here (it emits the frame *spec*, not pixels).
</content>
</invoke>
