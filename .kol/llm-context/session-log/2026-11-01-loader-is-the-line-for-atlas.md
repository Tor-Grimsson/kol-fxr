# Session: The loader is the line — packaged in KOL for Atlas

**Date:** 2026-11-01
**Agent:** Claude (Opus 5.5) as Grim
**Summary:** fxr's load handoff (loader ground → growing line → chrome fades on the breath) went to KOL as LoaderAppIntro, came back published, and Atlas's swap was filed to kol-atlas.

## Changes Made

### Files Modified
- `kol-ds-ui/lobby/inbox/LoaderAppIntro.md` + its ledger row — the ticket (closed by kol-ds-ui same day)
- `kol-atlas/lobby/inbox/LoaderIsTheLine.md` + its ledger row — Atlas's swap
- `lobby/outbox/LoaderAppIntro.md`, `lobby/outbox/LoaderIsTheLine.md`, `lobby/INDEX.md` — receipts and rows

### Features Added/Removed
- KOL now ships it: `loaderApp({ intro })` (kol-framework 0.69.0), claim/`hideLoaderApp` in kol-component 0.331.0, `GrowthLineStage onIntroBreath`, HubHome chrome fade (kol-shell 0.99.0). No fxr code changed.

## Current State

### Working
- LoaderAppIntro 🟢 closed, verified on studio-hub; fxr owes nothing.

### Known Issues
- Atlas's hexagon intro reads as a blob: a solid shape fills too slowly before growth stops; `params={MARK}` (fxr's `?stage=logo` spacing) gives tentacles after the release. Told kol-atlas: outline hexagon via a shape fn, drop `params` and `cap`. Not measured.

## Next Steps
1. kol-atlas does LoaderIsTheLine (its session, its queue).
2. fxr may later adopt KOL's intro and retire `src/components/intro.js`, the `index.html` stamp and HomeStage's page fade — not asked.
