# Session: Plan 40 — rail mark, Home picks, labs rail review

**Date:** 2026-10-24
**Agent:** kol-fxr (local, MBP)
**Summary:** Lobby squared (stale receipts closed, four outdated tickets retired), KOL bumped, and plan 40 (W1–W8) built, walked and closed.

## Changes Made

### Files Modified
- `package.json` — kol-component 0.298.0 · kol-framework 0.54.0 · kol-theme 0.186.0.
- `lobby/INDEX.md` + outbox stubs — DevSectionHeader · FileCardTitleClearsActions · MenuRowSidePadding closed; library-reader-for-a-hub-home · editor-chrome-review · editor-panels-the-held-specs · SunkenWellEatenByPageWash retired (user ruling).
- `src/AppLayout.jsx` — rail mark `/favicon/favicon.svg`; Home = six `HOME_PICKS` from the shipped Library + own saves (shipped verbs via `renameShipped`/`removeShipped`/`copyStored`); Back restores view + scroll.
- `vite.config.js` — `loaderApp({ size: 128 })`.
- `src/editor/library/mergeRemote.js` (+ check) — `isWalkSave`: walk saves never merge, cloud copies removed. `src/main.jsx` strips them every load (backup key kept).
- `src/editor/library/libraryOps.js` + `core.jsx` — `copyStored`.
- `src/editor/library/returnSpot.js` (new) — save/restore view + scroll on Back. `src/pages/LibraryPage.jsx` uses it.
- `src/editor/labs/catalog.js` · `LabsCatalogCard.jsx` — Modulation › Animation rows gone.
- `src/editor/compose/inspectors/KineticPanel.jsx` — Elements on Generate only, neutral selected row, rolls (preset · all · reset · Color · Type · Motion · All elements), knob BindDots via `kin:<i>:<key>`.
- `src/kinetic/knobs.js` · `packs/motion.js` · `LayerRenderer.jsx` — `randomiseComp(tabs)`, `applyKnobBridges`.
- `src/editor/OutputView.jsx` (`overlay` slot) · `src/editor/labs/LabsView.jsx` — Edit on canvas works in labs.
- `src/editor/compose/inspectors/ParatypeTools.jsx` · `LoopFields.jsx` — XY pad axes get BindDots; camera hint says what C does per loop kind; reset glyph `refresh` (also EffectsPanel, MobileOverlay).
- `src/loops/paratype/glyph.js` — Metrics · Weights · Expressive sections (roll cells).
- 18 files — every `tone="sunken"` dropped (43).

## Current State

### Working
- All plan 40 phases walked at 1600 on a task-scoped dev server; build green, `mergeRemote.check` green, 0 console warnings. Screens in `_tmp/2026-10-24-plan40-walk/`.

### Known Issues
- Home's view is read from a press on its label (HubHome has no `onViewChange`).
- Editor-side Edit on canvas not walked (no shipped kinetic editor file); C + drag checked on one 3D preset only.

## Next Steps
1. Plan 38: text frames + Character / Paragraph panels.
