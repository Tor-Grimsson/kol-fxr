# Session: Labs mode built (11.1–11.6) + DS-drift fallout fixes

**Date:** 2026-08-09 (session started 2026-08-08)
**Agent:** Grim (Fable 5 / Opus 5)
**Summary:** Built all six Labs-mode phases from plan.md Phase 11, then spent the back half firefighting what the KOL 24-minor bump broke — dropdown chrome gone DS-side, doubled param headers, wrong boot behaviour. **Honest state: the mode WORKS but is miles off the labs reference visually** — the user compared screenshots and the gap is real.

## Changes Made

### Files Modified
- `src/App.jsx` — `?view=labs` branch + three-way mode boot (chooser / persisted pick / touch default).
- `src/editor/labs/` **new** — `LabsView.jsx` (registry chrome, deep links, Space transport, no autoplay/autoselect), `LabsNav.jsx` (category nav), `LabsMenuTop.jsx` (reduced topbar), `LabsSourcePicker.jsx` (From library | Upload), `useLabsLayer.js` (one-layer swap), `labs.css` (scoped uppercase labels).
- `src/editor/mode.js` **new** + `src/editor/ModeChooser.jsx` **new** (buttons only, per user) — mode registry, persistence, `withView` (moved from `mobile/device.js`).
- `src/editor/EditorShell.jsx` — `registry.topbar` seam (defaults `MenuTop`).
- `src/editor/compose/state.jsx` + `src/editor/Editor.jsx` — `draftKey` prop; labs autosaves to `kol.editor.labs-draft`.
- `src/editor/OutputView.jsx` — `OutputStage` split into `OutputCanvas` (bare) + `OutputStage` (black fixed backdrop).
- `src/loops/registry.js` — `presetLayerPatch` / `firstPresetPatch` (hoisted from MobileView) / `groupOfPreset` (deep-link reverse lookup).
- `src/editor/params/AutoControls.jsx` — section header drops when it duplicates its first param's label (the Geometry/Geometry fix, editor-wide).
- `src/editor/styles/kol-editor.css` — **§6 DS shims**: `.kol-dd-*` dropdown chrome (verbatim theme 0.6.0, rem-stated spacing) + shim-authored `.kol-dd-list` column-flex (inline-flex rows made the panel's intrinsic width ~860px → floating-ui shifted it off its trigger).
- `package.json` / `pnpm-lock.yaml` — all four KOL packages → actual latest (component 0.24.0 · theme 0.30.1 · framework 0.13.0 · icons 0.10.0), peer ranges finally matched.

### Features Added/Removed
- **Labs mode** (`?view=labs`) — labs-shaped chrome over the editor engine: one permanently-selected layer, category nav, Parameters·Effects rail, EditorFooter + TimelineDock, own draft slot, `?view=labs&preset=&cat=` deep links, Space play/pause (labs parity; the editor's binding lives in PanZoomViewport which labs doesn't mount).
- **Mode chooser** — first visit picks Editor / Labs / Randomiser; persisted; `?view=` overrides; standalone-app only.

## Current State

### Working (browser-verified)
- Deep link boots the right preset; params drive the layer; dedup header fix live; dropdown panel aligned + styled (playwright-measured); labs draft restore prompts on its own key.

### Known Issues
- **⚠ MILES OFF THE REFERENCE (user verdict, screenshots compared).** Labs mode is architecturally right but visually far from labs.kolkrabbi.io: no nav group icons (labs' icon set isn't here), Type/Category/Preset dropdown stack instead of labs' preset chips, `Generate·Style·Animation` tabs instead of `Effect·Motion`, spacing/density off throughout. Closing this = a real reskin pass of the shared panels, not tweaks.
- **DS drift fallout, only partly patched.** kol-theme lost ALL `.kol-dd-*` dropdown chrome after 0.6.0 while kol-component 0.24.0 still emits it — shimmed locally (kol-editor.css §6), **kol-ds-ui fix owed + `/lobby-ds` ticket not yet filed**. Also from the bump, unfixed: `stop`/`rewind` icons missing from kol-icons 0.10.0 (transport warns), a DS `uppercase` prop leaking to the DOM (React warning), `JetBrainsMono-Variable.woff2` fails to decode (corrupt file, mono falls back).
- Effect pick = two undo steps (`setOnly` commits before `addFilter`).
- `kol-helper-11` → `kol-helper-12` swap (`ParametersPanel.jsx:305`) still awaiting the user's go.
- Editor chrome itself unverified visually on the new DS beyond dropdowns.

## Next Steps
1. **The reskin pass** — close the visual gap to labs (chips, tab naming, density, nav icons via `/lobby-icon` or ports).
2. File the kol-ds-ui ticket for the dropped `.kol-dd-*` chrome (+ missing transport icons).
3. Fix the corrupt `JetBrainsMono-Variable.woff2` in `public/fonts/`.
