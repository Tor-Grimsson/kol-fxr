# Session: Labs on touch — the DS drawer, one size group, one segmented control

**Date:** 2026-09-02
**Agent:** Grim (Opus 5)
**Summary:** The phone's Labs door now opens the real labs chrome: the shell rail as the DS drawer, the params rail as a right drawer, and the whole rail conformed to ONE size group and ONE row/segmented vocabulary — plus a KOL bump to component 0.152.0 · shell 0.35.0 · theme 0.121.0.

## Changes Made

### Files Modified
- `src/AppLayout.jsx` — `touch="bare"` → **`touch="drawer"`** (kol-shell 0.31.0): under 768px the shell rail is off-canvas with the DS hamburger top-right, and labs' catalog rows ride it as L1/L2 exactly as on desktop. `onNavigate` clicks the DS scrim after a rail-extra **pick** (a pick is not a route change, so the drawer would not close itself); `railExtras.dispatch` returns whether the path was a pick, so a section press still just expands.
- `src/editor/labs/LabsView.jsx` — touch branch: a top bar carrying the params toggle (left; the shell trigger owns the right corner), `LABS_REGISTRY_TOUCH` swapping `LabsRail` for a grab-less `LabsTouchRail`, and a `ControlSizeContext` provider at **`md`**.
- `src/editor/params/controlSize.js` — **NEW.** `ControlSizeContext` (default `sm`, so the editor needs no provider) + `useControlSize`, the shared `RAIL_LABEL_W` (96) and `stripClamp(cs)`. 63 `size="sm"` literals across LabsParams · AutoControls · TreePicker · ParametersPanel · EffectsPanel · ColorField · LabsSourcePicker · EditorFooter · KineticPanel now read the context.
- `src/editor/params/AutoControls.jsx` — range rows go label-above off `sm` (the slider was 32px between a 96px label column and the box); range box `chars` 6 → 5; `segmented`/`toggle` rows render the DS `SegmentedToggle` in the labs skin; the label-above fallback uppercases there so the rail has one label voice.
- `src/editor/compose/inspectors/{TreePicker,LoopPicker}.jsx` — `PickerRow` takes `inline`: TYPE · CATEGORY · PRESET are `SettingsRow`s in the labs skin (they were the sentence-case exceptions). The Type stack is `w-full`.
- `src/editor/compose/inspectors/ParametersPanel.jsx` — `LoopFields` gains `Row` + `OnOff`; the picker stack and Look/Theme/Invert/Background sit in unnamed `LabeledControlSection`s (8px rhythm + hairlines) in the labs skin; Invert/Background span the control column instead of parking at the row edge; the camera hint hoisted to one `cameraHint`.
- `src/editor/params/rolls.jsx` — `SeedField` takes `inline` (SettingsRow) and the group size.
- `src/editor/params/TransportBar.jsx` — cells are **square on the button ladder** (26/32/40, the DS icon-only geometry) and the loop field holds 3 chars, so ▶❚❚ · Loop / N s · ■◀◀ is ONE LINE at every rail width — the desktop 264 included, where it had always wrapped.
- `src/editor/shell/panels/EditorFooter.jsx` — on touch the transport **folds into one ▶ glyph** beside an Output · File strip; tapping it opens the full bar as a viewport-wide sheet along the bottom. Aspect/Export moved off `Section` onto `LabeledControlSection`.
- `src/editor/labs/LabsParams.jsx` — `GEN_TABS_TOUCH` (Gen · Style · Anim) so three cells fit 264.
- `src/editor/labs/LabsNav.jsx` — on touch a pick starts the clock (a phone has no Space and its ▶ is in a closed drawer).
- `src/editor/mobile/MobileView.jsx` — the phone's Labs door routes to `/labs` like the tablet's; `LabsBrowseScreen` retired to `_tmp/2026-09-01-labsbrowsescreen-unused/`.
- `src/editor/mobile/MobileOverlay.jsx` — Effects tab reshaped to Generate's order (actions on top, scope strips under their stage); the sticky-`:hover` "selected" cell killed under `@media (hover: none)`.
- `src/editor/styles/kol-labs.css` — the touch params drawer (fixed, off the grid, `--kol-sidenav-w` = 264 wide, sliding under the bar); the DS coarse-pointer 16px input floor switched OFF inside the rail; the segmented strip's sunken tone.
- `index.html` — `maximum-scale=1` (the app-level answer to iOS focus-zoom, now that the rail runs 14px fields).
- `package.json` · `pnpm-workspace.yaml` — **component 0.142.0 → 0.152.0 · shell 0.30.0 → 0.35.0 · theme 0.111.0 → 0.121.0** (framework/icons/brand/media-client already latest).

### Features Added/Removed
- **Labs is usable on a phone.** Both rails present as drawers, the real params surface (sliders, chips, Effect/Motion tabs, footer), the catalog as the shell rail's own L1/L2.
- **One size group per rail** (`md` on touch, `sm` on desktop) and **one segmented control** — the DS `SegmentedToggle`, group radius + dividers, wearing ControlToneSunken's three lines.
- The transport as a folded glyph + bottom sheet on touch.

## Current State

### Working — measured in a browser (390×844 touch-emulated + 1280×720)
| | |
|---|---|
| drawer | 264 = `--kol-sidenav-w`, the desktop rail's width |
| size group | dropdown · input box · toggle · buttons all 32px on 14px mono (`md`); desktop all 26–28 on 12 |
| rows | TYPE·CATEGORY·PRESET·THEME·INVERT uppercase `SettingsRow`s, 8px rhythm, dividers between sections; Invert's left edge and width equal the dropdowns' |
| segmented | one group radius (4), cell radius 0, 1px dividers, shell transparent, selected cell `--kol-surface-sunken` on `--kol-fg-96`, rest on the primary button's fill |
| transport | one line at 264 / 320 / lg; on touch a ▶ glyph opening a 390-wide sheet, ✕ closes |
| flow | hamburger → section chevron → leaf: drawer closes, stage animates, params drawer opens under the bar with the trigger tappable on top |
| console | 0 errors across generative · effect · kinetic surfaces, both viewports |

### Known Issues
- **Verified under touch EMULATION only** — no real-hardware pass. Finger drags on the rail's sliders are the untested part.
- **`SegmentedToggle` has no `tone` prop** — ControlToneSunken covers Dropdown · Input · Button · IconFrame · ThemeToggle · ViewToggle(icon) and stops one component short, so three lines live in `kol-labs.css` scoped to the labs rail. **Owed to kol-ds-ui, not yet filed.**
- The DS drawer's section **name** does nothing — only the chevron expands. Deliberate upstream (a section row press opens the collapsed desktop rail), surprising on touch.
- The DS coarse-pointer 16px input floor is overridden inside the labs rail; every other surface still takes it.
- kol-shell 0.35.0 ships `touch="drawer"`'s trigger fixed top-right in both states — it sits over the stage on `/labs`, not over the params toggle, but the two are 300px apart and untested on hardware.

## Next Steps
1. **Real-device pass** — the whole touch chrome is emulation-verified only.
2. **File `SegmentedToggleTone` at kol-ds-ui** — `tone="sunken"` on SegmentedToggle; the local CSS names its own exit.
3. Decide whether the editor chrome (`/editor`) wants the same touch treatment, or stays tablet-and-up.
4. Still outstanding from before: real VECTOR glyphs at kol-icons if the section settles; the distressor's SVG re-sourcing on mobile.
