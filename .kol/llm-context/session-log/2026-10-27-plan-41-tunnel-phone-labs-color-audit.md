# Session: Plan 41 — tunnel, phone Labs on PhoneNav, Color in Labs, the rail audit

**Date:** 2026-10-27
**Agent:** kol-fxr (local, MBP)
**Summary:** Built plan 41 end to end except W5 (normalising: audited, rule proposed); two DS tickets filed and adopted the same day.

## Changes Made

### Files Modified
- `src/loops/gl/IridescentEngine.js` · `catalog.js` · `gradEnums.js` — Gradients › Tunnel (Tunnel, Halo, Horizon), Violet palette, shape select (circle, rounded square, polygon, star), Grab (`grabKeys`); Soft forms categories show labels.
- `src/editor/compose/LayerRenderer.jsx` — `useGrabKeysDrag` beside the Orbit hook.
- `src/editor/labs/LabsView.jsx` — `LabsPhoneChrome`: PhoneNav top + TransportPill (kol-shell 0.83.0); sheet header and TransportFab retired.
- `src/editor/shell/panels/EditorFooter.jsx` — touch: no strip, `openTab` toggles, no empty foot.
- `src/editor/styles/kol-labs.css` — touch: canvas clears the nav, sheet shadow, pill clearance.
- `src/editor/compose/inspectors/LoopFields.jsx` · `EffectsPanel.jsx` · `LabsParams.jsx` · `AutoControls.jsx` · `MorphTab.jsx` · `LabsSourcePicker.jsx` — sunken toggles, Roll primary, divider, 3 per row, one value-box width per section.
- `src/editor/compose/inspectors/ColorField.jsx` — real picker (SBSquare + HueStrip), Theme/None as Buttons.
- `src/editor/color/*` · `src/editor/Editor.jsx` — Color in Labs: base colour + harmony + 2–8, lock/edit/delete, roles by meaning; window mounted in EditorProviders.
- `src/loops/flow/asciiField.js` (new) · `flow/presets.js` · `filters/fxAscii.js` — generative ASCII field.
- `src/loops/taxonomy.js` — Pattern = Rules/Pattern Loops/Field; Loops = Simple; Soft Forms 3D under 3D Scene.
- Preset files — 70 labels without "·"; 10 switch presets retired.
- `src/AppLayout.jsx` · `src/editor/mobile/MobileView.jsx` — phone Home doors (Generate, Effects, Labs, Morph); Dev › FX changelog tab (`src/pages/FxChangelog.jsx`, `fxChangelogRows.js`).
- `package.json` — component 0.304.0, shell 0.83.0, icons 0.47.0, theme 0.191.0, framework 0.57.0.

### Features Added/Removed
- Added: Tunnel, ASCII field, Color in Labs, phone Labs layout, FX changelog, phone Home doors.
- Retired to `_tmp/`: TransportFab, LabsSheetHeader, PaletteBody five-slot, 10 switch presets.

## Current State

### Working
- Every item walked in a browser (desktop + 390 touch emulation), console clean.
- Lobby: PhoneNavTopAndFold + TransportPill filed, returned, adopted.

### Known Issues
- Not built: Speed scrub beside the loop sheet (4.5); Glyph vortex onto the shared ASCII renderer (7.8).
- Desktop/editor footer and transport bar not sunken (shared with the editor).
- Colour picker drags push one undo entry per step.

## Next Steps
1. Plan 41 W5: apply the normalising rule (≤12 visible knobs, roll the look not the structure with curated rMin/rMax, colours through roles), Penrose first.
2. Plan 38: text frames + Character / Paragraph panels.
