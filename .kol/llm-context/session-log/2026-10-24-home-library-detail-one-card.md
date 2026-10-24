# Session: Home live, the shipped Library, on-demand covers

**Date:** 2026-10-24
**Agent:** kol-fxr (local, MBP), phases run from kol-ds-ui (plan-2026-10-24-home-library-detail-one-card)
**Summary:** Home re-reads on every library write and a restored session merges the cloud on load; the Library is what fxr ships (1,137 generated files by chrome) with a detail page per file; every cover is a rendered frame — shipped ones drawn on demand and cached by what is drawn, the user's saves backfilled at idle.

## Changes Made

### Files Modified
- `package.json` — kol-component 0.297.0 · kol-shell 0.78.1 · kol-theme 0.185.0.
- `src/editor/library/LibraryProvider.jsx` — `saveToStorage` dispatches `kol:library`; `subscribeLibrary` · `readLibraryRaw` · `isShippedOp`; validator keeps `shipped` · `group` · `sub`; duplicate drops `shipped`; push and setThumb refuse shipped.
- `src/editor/library/libraryApi.js` — `restoreSession` hydrates and merges into storage (Home was empty on a fresh signed-in load).
- `src/editor/library/libraryOps.js` — `setThumbStored`; shipped never pushed or thumbed. `mergeRemote.js` (+ check) keeps shipped local.
- `src/editor/library/shipped.js` (new) — LABS (every loops + kinetic preset) · RANDOMISER (same, no tool loops) · 10 MORPH · 10 EDITOR, seeded once in `main.jsx` before first render; flag `kol.editor.library.shipped.v1` holds written ids.
- `src/editor/library/FileCover.jsx` (new) — on-demand cover: keys `loop:` / `kinetic:` / `file:`, 240 px, in-memory cache; 2D loops via `drawLoopFrame`, GL · kinetic · editor files via `CoverHost` (one offscreen live frame at a time).
- `src/editor/library/ThumbBackfill.jsx` (new) — `OffscreenFrame` + the idle backfill for user saves without a thumb (Home only, lazy).
- `src/pages/LibraryPage.jsx` — views EDITOR · LABS · RANDOMISER · MORPH (+ Type · Palettes · Patterns under EDITOR's Kind), the one card, `/library/<chrome>/<id>` on `StudioDetail`; reads and writes through its provider only.
- `src/AppLayout.jsx` — Home via `useSyncExternalStore`, filters `!shipped`, `onCover`; mounts ThumbBackfill on `/`.
- `src/App.jsx` — `/library/*`. `src/editor/OutputView.jsx` — `/output?open=<id>`. `FileCard.jsx` — shared `CHROMES`, `chromeOf` knows randomiser. Files dialog + morph StepPicker skip shipped. `state.jsx` exports `TEXT_DEFAULTS`; `StepPicker` exports `stepFromPreset`.

### Features Added/Removed
- The static-cover generator (944 webps + script) retired to `_tmp/2026-10-24-file-thumbs-generator-retired/` — user: "it does not need to make thumbnails for all those"; playwright dep removed.

## Current State

### Working
- Walked on the dev server: signed-in cold load fills Home (12 RECENT · 33 SAVED); every Library view's visible cards pictured; Open lands in all four chromes; detail covers for 2D, kinetic and GL; user saves all got covers; no shipped data URLs; console clean; build green.

### Known Issues
- A 551-card view takes ~3 s to mount (CatalogPage renders every card); covers land ~1.2 s after.
- Cover cache is in memory — a reload redraws what is shown.
- Tags and notes are session-only (the library has no field for them).
- Library subtitle "Everything saved on this device." no longer fits — the user's copy, put to him by kol-ds-ui.

## Next Steps
1. The user's review of Home vs Library (contents, non-clickable slot saves) and the kol-ds-ui pass against the twin.
2. Plan 38: text frames + Character / Paragraph panels.

## Amended — 2026-10-24

- **Library empty / Home without covers in the user's browser** — a near-full localStorage made the seed's write fail silently, then the seed flag marked it done. Shipped files are now BUILT in memory (`listShipped()`), never stored; only removals and renames persist (`kol.editor.library.shipped.v2`); `dropStoredShipped()` strips what the first build wrote. `?open=` resolves via `findFile`; Save on an opened shipped file asks for a name.
- **Covers all on demand** (`FileCover` + lazy `CoverHost`, mounted in AppLayout) — Home included, keys `loop:` / `kinetic:` / `file:<id>:<updatedAt>`, memory + IndexedDB `kol-fxr-covers`; `ThumbBackfill` retired to `_tmp/2026-10-24-thumb-backfill-retired/`. Two StrictMode bugs in the host fixed. `saveToStorage` and `captureThumb` now warn instead of failing silently.
- **Upload image on every file** — a shipped file's upload goes on the IndexedDB shelf (`upload:<id>`), a save's into its `thumb`; Details lists Chrome once.
- **Forty shipped files, ten per chrome** (user: "maintaining 1337 saves is ridiculous") — LABS one per category across Effects · Generative · Vector · Composition, RANDOMISER ten Generative categories; catalogs stay as the chromes' options. The 1,137 generator is in `_tmp/2026-10-24-shipped-1137-generator/`. Cards paint in 8–130 ms (was ~3 s).
- KOL kol-shell 0.78.1. Walked with localStorage filled to quota and a cold cache: Home 12/12, every view 10/10, console clean, build green.
