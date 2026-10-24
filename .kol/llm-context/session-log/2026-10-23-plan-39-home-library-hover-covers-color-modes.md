# Session: Plan 39 — Home vs Library, card hover, covers, Color Modes tool

**Date:** 2026-10-23
**Agent:** kol-fxr (local, MBP)
**Summary:** Home is the user's (New File + your files), Library is the chrome saves; the DS app card lost its hover fill and its wrap/download bugs by bump; old files get a cover on open; Color Modes is a tool window, the old PaletteModal retired, palettes roll in OKLCH.

## Changes Made

### Files Modified
- `src/AppLayout.jsx` — Home: RECENT = New File card + newest 12 files, SAVED = all files, signed in or not; `preset: 'app'` + `rowVariant: 'app'`; chrome cards gone.
- `src/pages/LibraryPage.jsx` — Type · Palettes · Patterns only (no `preset` slot), no card onClick; palette cover = its colours, type cover = its text in its face.
- `src/editor/library/UrlIntents.jsx` + `LibraryProvider.jsx` (`setThumb`) + `compose/useComposeFile.js` (exports `captureThumb`) — a cover-less file gets its cover 1.5 s after it opens.
- `src/editor/color/ColorModesWindow.jsx` (new) — scrim window around `PaletteBody`; Tools · Edit · Window › Color Modes open it; `PaletteBody` gains Apply to document.
- `src/editor/color/palette.js` + `palette.check.mjs` — roll in OKLCH (`oklchToHex`, `okL`), check covers 60 seeds × 7 relations.
- `src/editor/shell/MenuTop.jsx` · `shell/panels/tabs.jsx` · `Editor.jsx` · `Compose.jsx` · `src/index.lib.css` — Palette tab gone, window mounted.
- Docs: `11-persistence/03-saved-library.md`, `03-generative/02-scoped-randomize.md`, `00-overview/INDEX.md`.
- Plan: `.kol/llm-plan/39-home-library-and-the-leftovers.md` (all phases built). Playbook: `playbook/2026-10-23-plan-39-home-library-and-the-leftovers.md`.
- KOL: kol-component 0.291.0 → 0.295.0.

### Features Added/Removed
- `PaletteModal` + `PalettePreview` → `_tmp/2026-10-23-palette-modal-retired/`.
- Lobby: filed + adopted `AppCardNoHoverFill` (0.293.0). Wrap (`AppCardDateSizeWrap`) and download-bubble (`AppCardDownloadClickBubbles`) fixed in 0.294–0.295 via mirror/monitor tickets; fxr's download stopgap added then removed.

## Current State

### Working
- Walked on the dev server at 1280: Home cards, no hover fill, date/size whole, download without opening, Library covers, cover backfill equal to a save's cover, Color Modes window + Apply to document; 0 console errors; `palette.check` green.

### Known Issues
- An old file's cover appears only once it has been opened (generators need a live canvas).
- Not walked on `vite preview` of the built bundle.

## Next Steps
1. Plan 38: text frames + Character / Paragraph panels.

## Amended — 2026-10-23

- 0.295.0 walked on Home at 1280: date · size whole, cover download no longer opens the file, 0 console errors (`_tmp/2026-10-23-bump-0295-walk/`).
- **Dev page restored** — `src/pages/DevCards.jsx` back from `_tmp/2026-10-22-dev-page-retired/` on the DS `app` card, `/dev` route in `App.jsx`, `dev={{ tabs }}` on `AppHub`. It is the user's and stays even empty — never retire it (memory `dev-tab-is-permanent`).
- Icons audited: fxr has no local icon set (all 15 imports are `@kolkrabbi/kol-icons`), every name used exists there, no DS duplicate-drawing pair is used as two things. The duplicate-icons issue is mirror's local `components/icons/svg/`.
