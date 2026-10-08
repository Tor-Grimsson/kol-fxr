---
title: Render / export parity
type: reference
status: active
updated: 2026-07-08
description: The fix-wave rules that make a download match what the user sees on the retina canvas — @Nx raster scaling, dpr backing, the exact viewBox quotient, pattern-tile anchoring, font warming, and click-time transport resolution.
tags:
  - project/kol-fxr
  - domain/export
  - editor/export
aliases:
  - parity
  - render-export-parity
covers:
  - "@Nx raster snapshot scaling"
  - retina dpr
  - the exact viewBox quotient
  - pattern-tile anchoring
  - font warming before raster
  - click-time transport resolution
sources:
  - src/editor/compose/build.js
  - src/editor/compose/useComposeFile.js
related:
  - "[[INDEX|export]]"
  - "[[01-pipeline|pipeline]]"
  - "[[02-sizing|sizing]]"
---

# Render / export parity

The fix-wave work (2026-07-07 audit + Wave 1/2 parity, cited in the session logs) that makes a download match what the user sees on the retina canvas. All rules live in `build.js` + `useComposeFile.js`.

| Rule | What it does |
|---|---|
| **@Nx raster snapshot scaling** | `buildLayersSvg` threads `rasterScale` into internal snapshots — 2d loops / video frames bake at `k×` so they stay crisp when the whole SVG scales. `snapScale = clamp(2, 4, (outW/vw) × rasterScale)`. |
| **Retina dpr** | Filtered layers are dpr-backed (fixes retina half-res); filter params (blur / pixelate / halftone cell / ascii cell / chromatic offset) normalized by `src.width` so they read identically across densities. Live-canvas engine/filtered snapshots stay at backing store (capped ~2×). |
| **Exact viewBox quotient** | `vh = CANVAS_W × (canvasH / canvasW)` is kept exact (not rounded) so the viewBox ratio matches the output ratio — rounding painted ~1px transparent gutters under `meet` scaling. viewBox stays the 1080-wide virtual space; `width`/`height` carry the real output px. |
| **Pattern-tile anchoring** | The `<pattern>` def is anchored at the layer origin (`x=lx y=ly`), matching the DOM renderer's `background-position: 0 0` on the layer box — fixes the export tile-phase shift two auditors flagged. |
| **Fonts warm before raster** | `warmExportFonts` awaits `warmTextFonts` (+ `warmFontCss` when kinetic layers are present) BEFORE the sync `buildLayersSvg`, so text exports as outlines and kinetic in its real faces, not system fallbacks. |
| **Transport time resolved at click** | `buildArgs` deep-resolves bound (animated/modulated) props against `transport.getCtx()` INSIDE each export handler — export buttons don't re-render on transport ticks, so resolving in the hook body would freeze `t` while loop layers sample live, mixing two times in one file. |

The `@Nx` axis these rules protect is [[02-sizing|sizing]]; the flow they run inside is [[01-pipeline|pipeline]].
</content>
