# Session: Randomiser audit, touch wiring, gradients collision fix, EditorButton retirement

**Date:** 2026-08-14 (work ran 2026-08-12 → 14)
**Agent:** Grim (Fable 5)
**Summary:** The mobile randomiser got a full audit-and-fix arc: the entry card became the chrome chooser (kolkrabbi-fxr), CategoryScreen unified both generator sheets, EditorButton retired for the shipped Button's `iconComponent` seam (111 call sites), deps bumped (three 0.169→0.185 broke two GL paths — both root-fixed), the Gradients "Media" wreck root-caused to a preset param shadowing `layer.type`, and touch now reaches every generator. Headless Playwright audit drove all 10 doors clean.

## Changes Made

### Files Modified
- `src/editor/mobile/MobileView.jsx` — entry card = chrome chooser (title `kolkrabbi-fxr`, "Select chrome", Generate/Editor/Labs, borderless, no divider); Insert moved into the generator sheet; Esc closes picker; modal-open pauses playback; tap-to-retrigger on flat 2d loops; `setTool('orbit')` on mount (mobile never mounts CanvasArea — one flip lights up all camera plumbing); picker gate excludes webcam layers
- `src/editor/mobile/CategoryScreen.jsx` (NEW) — THE one generator sheet (both flows render it identically: generators + Insert + Back); [icon text icon] spread rows (`SPREAD` const), icons from labs' GROUP_ICONS; Esc dismiss (overlay flow: Esc closes, Back restarts); mounts = transport pause
- `src/editor/mobile/MobileOverlay.jsx` — inline generator twin DELETED (renders CategoryScreen); header row = title + always-visible **Start over**; collapsed row + **Download**; Transport tab + loop chips (2/4/8/16s); pill shows preset name only; sheet full-bleed/square/solid `--kol-surface-primary`; chevron 12→16; shuffle pool excludes tool presets
- `src/loops/registry.js` — `RESERVED_LAYER_KEYS` guard in `presetParams` (drops preset keys shadowing id/type/x/y/w/h/src, warns); `isToolPreset` + `tool: true` loop flag; `firstPresetPatch` skips tool presets
- `src/loops/gl/catalog.js` + `IridescentEngine.js` — iridescent param `type` → `form` (the collision that turned Gradients layers into "Media")
- `src/loops/math/expression.js` — `tool: true` (Oscilloscope is an instrument; randomiser skips it, labs/desktop unaffected)
- `src/editor/compose/LayerRenderer.jsx` — canvas `key={loopId}`/`key={engine.id}` at all three GL rebuild sites (destroyEngine force-loses the context; three 0.185 dies on a lost context — 0.169 tolerated it)
- `src/loops/gl/host.js` — pointer overlay in `applyParams` (layer-local 0..1 → `engine.setPointer`, rides over setParams so it self-reverts)
- `src/loops/gl/DriftEngine.js` / `IridescentEngine.js` / `SoftFormsEngine.js` — `setPointer`: drift = flow steer + gust surge; iridescent = hue shift + warp boost; softforms = hue shift + bulge
- `src/editor/params/rolls.jsx` — `computeRoll` clamps unrolled in-scope range params into slider range (typed over-range + noRandom = "hectic randoms", penrose)
- `src/editor/labs/LabsSourcePicker.jsx` — third pane **Camera** (`ensureWebcam` → `srcType:'webcam'`); `src/editor/lib/webcam.js` prefers `facingMode:'user'` (front camera, soft constraint)
- `src/editor/labs/LabsNav.jsx` — GROUP_ICONS/MODE_ICONS exported (one map, two consumers)
- 27 files — `EditorButton` → shipped KOL `Button` (111 call sites; 43 icon sites pass `iconComponent={EditorIcon}` through the DS seam); `EditorButton.jsx` retired to `_tmp/2026-08-12-retired-editorbutton/`
- `package.json` — theme **0.38.0** · framework **0.19.0** (component 0.37.0 / icons 0.15.0 current); all other deps latest: three **0.185.1** ⚠, mediabunny 1.53.0, vite 8.2.1, tailwind 4.3.3, react 19.2.8

### Features Added/Removed
- Touch on every generator: orbit (3D Scene/SF3D/cam loops), engine nudges (drift/gradients/softforms), tap-retrigger (flat 2d), penrose native.
- Camera as a source (front-preferred); Esc closes mobile modals; modals pause playback; loop-length chips; collapsed Download; header Start over.
- Removed: MobileOverlay's inline generator list, EditorButton, the entry card's Insert/divider/border, Cancel (Back-to-beginning is the exit).

## Current State

### Working
- Build green (app). Headless audit: all 10 doors + ~25 preset shuffles, zero console errors; Gradients verified on both entry paths; Drift through all four families; Math opens Epicycle (tool exclusion live).
- Glyphs now follow the DS ladder (Button solo 16/20/24, adjacent 14) instead of EditorButton's flat 16.

### Known Issues
- Device-verify owed: webcam pixels on real hardware, SF3D Preset button (stalled only under headless software-GL), brief blank flash on GL family hops (new canvas while engine boots — cosmetic).
- three 0.185: build + drift/gradients/SF3D/scene render clean; the desktop 3D Orbit tool still wants one visual pass.
- kol-component 0.37.0 peer-wants `opentype.js ^1.3.4`; editor runs 2.0.0 deliberately (DS-side range widen owed — lobby material).
- White-band in headless GL screenshots = compositor artifact (pixel-probed benign; user's GPU renders full-bleed).

## Next Steps
1. Color-contrast plan awaiting the user's go: roll contrast floor, Background/Motif roll buttons, settings gear (hex bg, intensity, scope).
2. Device pass: camera layer, SF3D preset shuffle, GL-hop flash, desktop Orbit under three 0.185.
3. Square the 🟢 lobby stubs (remainders all adopted per logs) + watch SegmentedFilledStateFix (🔵) — 0.37 `tonal` may satisfy it, user's call.
