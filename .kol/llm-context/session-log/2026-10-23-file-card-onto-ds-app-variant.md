# Session: File card onto the DS `app` variant

**Date:** 2026-10-23
**Agent:** kol-fxr (local, MBP)
**Summary:** The approved file card went to the DS as an `app` card/row variant + `CatalogPage preset="app"` (one ticket answering fxr, mirror, monitor); it shipped, and fxr's Library and Home now run on it.

## Changes Made

### Files Modified
- `package.json` — kol-component 0.291.0 · kol-shell 0.75.0 (exact).
- `src/pages/LibraryPage.jsx` — `preset="app"`; `toCard` returns `verbs` · `download` · `date` ms · `size` bytes · `media` src; no menu element, no `useContextMenu`.
- `src/AppLayout.jsx` — Home file cards `variant: 'app'`, same keys; `fileMenu` / `<FileMenu>` gone.
- `src/components/FileCard.jsx` — keeps `storedVerbs` · `chromeOf` · `downloadFile` · `bytesOf` only.
- `docs/documentation/11-persistence/03-saved-library.md` — the `app` card.
- Lobby: `outbox/CatalogAppVariant.md` filed + adopted; `FxrLibraryOnAppPreset` closed → `done/`; ledger rows.

### Features Added/Removed
- `FileThumb` · `FilePlate` · `FileMenu` · `FILE_TONE` · `fileDate` retired to `_tmp/2026-10-23-filecard-app-variant/` (with the walk screenshots).

## Current State

### Working
- Build green. Walked on `vite preview`: `/library` (card, right-click Duplicate, cog menu, trash confirm, 0 console messages) and Home signed in (throwaway build, fake session — card draws, Duplicate lands).

### Known Issues
- None from this work. Mirror and monitor adopt from the DS resolution in their own repos.

## Next Steps
1. Color Modes as an overlay window tool replacing the tab and `PaletteModal` (carried from plan 37).
2. Plan 38: text frames + Character / Paragraph panels.
