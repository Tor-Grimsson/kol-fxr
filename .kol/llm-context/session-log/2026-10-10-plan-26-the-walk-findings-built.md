# Session: Plan 26 — the walk findings built

**Date:** 2026-10-10
**Agent:** kol-fxr (local, MBP)
**Summary:** The user's walk of labs became plan 26 (16 items); items 1–14 built under `/kol-goal`, walked on `vite preview` in both themes, 0 console errors. The DS ticket filed and adopted the same session.

## Changes Made

### Files Added
- `src/filters/fxBlocks.js` — `fx-blocks`: block drop · displace · per-block chromatic · channel noise · tear; Rate reshuffles per loop (seamless)
- `src/filters/fxMedia.js` — `fx-media` (pinned first): tile · drift (whole tiles) · spin · zoom · tilt as canvas row/column strips · swing
- `src/filters/sweeps.check.mjs` — every sweep shape × travel closes at u = 1; origin moves the band
- `src/editor/params/QuickMotion.jsx` — Modulate: Off · Breathe · Sweep · Jitter per numeric param (LFO bindings; seeds excluded)
- `src/editor/lib/stillUpload.js` — still uploads → ≤2048px webp data URL in the file
- `lobby/outbox/PrimaryHoverIsTheWell.md` — receipt, closed

### Files Modified (the main ones)
- `filters/sweeps.js` — origin `cx/cy` + Travel (forward · reverse · ping-pong); `scanline.js` + `loops/scanline/engine.js` take the rig as a size multiplier
- `compose/useComposeFile.js` — every raster export inlines still photos as data before the SVG raster (thumb/PNG/batch/webm were blank for unfiltered URL/blob photos)
- `compose/state.jsx` — `first` stages pin to index 0; opening a saved file re-links its clip-store uploads
- `AppLayout.jsx` — Home grid by default, file card thumb, `···` verb menu in grid
- `labs/LabsParams.jsx` — the page effect is the first non-pinned stage; Motion tab: roll divider, Modulate, Media
- `labs/LabsView.jsx` + `LabsCatalogCard.jsx` — Effects door asks for media first, reopens on its groups
- `params/rolls.jsx` — `tidyScopes` (whole-tab scope dropped → per-param buttons), seed only at ≥5 params
- `params/controlSize.js` + `EditorShell.jsx` — label column measured per panel (`--fxr-label-w`); value box sized in `ch`
- `loops/registry.js` — camera fold onto field · penrose · distress · paratype · modulator
- `package.json` — kol-theme 0.173.0

## Current State

### Working
- Walked on `vite preview` (1440, dark + light): media-first door, Scanline Motion tab, fx-media render, fx-blocks render, save → thumb → Home grid card, URL-photo thumb (0–255 contrast), Penrose camera + Breathe binding, primary hover measured against the rail.

### Known Issues
- Plan 26 § 16: the Modulation editor's Range row overflows the rail.
- Modulate is labs-only; the editor inspector is not wired.
- Files saved before 2026-10-09 get a thumb only on their next save.

## Next Steps
1. Plan 26 § 15 (mesh in the 3D scene) — its own session.
2. Plan 26 § 16.
