# Session: Sync loop toggle, sunken strips, Morph on Home

**Date:** 2026-10-09
**Agent:** kol-fxr (local, MBP)
**Summary:** The user's walk of the morph/labs chrome — Sync loop became a Morph setting, every desktop strip went onto the DS sunken tone, Morph got a Home card and moved in the rail, and three morph bugs fixed.

## Changes Made

### Files Modified
- `package.json` — kol-component 0.249.0 · kol-icons 0.35.0 · kol-media-client 0.5.0 (exact)
- `src/editor/params/resolve.js` — `syncLoopKeys` moved here; a track resolves synced when `layer.morph.syncLoop` (read-time, so Off is the keys untouched)
- `src/editor/params/TimelineDock.jsx` — the ruler's Sync loop button gone; an empty read-only Morph lane while the Morph rail is active
- `src/editor/morph/MorphTab.jsx` — `Sync loop` toggle under Cycle (one section with Curve/Cycle); `syncLoop` carried on the layer + saved spec; under two steps the morph comes off the stage (one step → its generator, last removed → stage empties, only on a removal)
- `src/editor/morph/morphStore.js` — `syncLoop: false`
- `src/editor/params/AutoControls.jsx` — bare switch rows centred and pinned to the rung height (`ROW_H`)
- `src/editor/shell/panels/EditorFooter.jsx` — Transport · Output · File back to `SegmentedToggle` (plan 23's TabsRow reverted); export dropdown reads `@1x · W × H`, side label gone
- Seven files — `tone="sunken"` on every desktop `SegmentedToggle` lacking it (labs rail, Morph, footer, TransportBar, AutoControls, LoopFields, LabsSourcePicker)
- `src/editor/styles/kol-labs.css` — the fake-sunken `.kol-seg` block retired to `_tmp/2026-10-09-labs-seg-sunken-shim/`
- `src/AppLayout.jsx` — Morph card on Home (`public/previews/chromes/morph.png`); Morph below Randomiser in the rail (⌥5 Randomiser, ⌥6 Morph)
- `src/editor/labs/LabsView.jsx` — stops writing `view=labs` (a refreshed `/morph` redirected to `/labs`)

## Current State

### Working
- Sync loop row measured centred on the label (Playwright, dev server); the rest is unwalked.

### Known Issues
- Morph steps are module state — a refresh empties the slots unless a morph file was opened.
- `morph.png` is 1280×720; the other three previews are 1440×900.
- Mobile overlay strips left on the default tone.

## Next Steps
1. Walk today's surfaces in the browser (Morph rail, strips, footer, Home card).
2. File plan 17's open DS gaps (#4–#15) into the kol-ds-ui lobby.
