# Audit — pass E: DS assets over `src/` (plan 21 § E)

**Run:** 2026-10-09, local. Greps over `src/` for hand-built markup doing a kol-component job, each hit read in place: bare form elements, `<ul>/<li>` lists, local popover bodies, arbitrary z-indexes, `fg-*` strokes, `size` literals in rail components, stretched inputs. Plan 19 § 4 already moved 30 bare buttons; this is what is left.

## Findings

**E1 · One bare `<input type="range">`.** `params/AutoControls.jsx:173` — the schema rail's numeric row draws a native range slider beside its value field; the DS `Slider` is what every other rail row uses (the only bare form element in `src/`). *fix.*

**E2 · Two hand-rolled lists.** `components/NewFileDialog.jsx:33` — the four doors as a `<ul>` of `ContentRow`s on a `FullscreenOverlay` with **no panel surface** (A1's cause) and the row's `file` ramp title (A2's cause); `morph/MorphTab.jsx:210` — `StepList`, which kol-component 0.245.0 now ships (the `StepList` receipt: bump and swap). *fix: the dialog onto the DS modal surface; the list onto the package's `StepList`.*

**E3 · 73 `size="…"` literals in rail components, 12 files.** The labs-rail law (AGENT-CONTEXT: *"never write a `size="sm"` literal in a rail component again"* — `ControlSizeContext`, `sm` on desktop / `md` on touch) holds in `params/` and `labs/`; the editor's inspector ignores it: `inspectors/SoftformsLayers.jsx` 12 · `inspectors/LayerInspector.jsx` 12 · `inspectors/TextPanel.jsx` 10 · `mobile/MobileView.jsx` 6 · `params/TimelineDock.jsx` 5 · `params/ModulationEditor.jsx` 5 · `inspectors/ParametersPanel.jsx` 5 · `inspectors/EffectsPanel.jsx` 5 · `labs/LabsSourcePicker.jsx` 4 · `inspectors/PatternPanel.jsx` 4 · `mobile/CategoryScreen.jsx` 3 · `inspectors/ParatypeTools.jsx` 3. On a touch device the inspector would stay `sm` while the labs rail lifts to `md`. *ruling: the inspector adopts `useControlSize()` (one sweep), or the law is scoped to labs in writing.*

**E4 · Five arbitrary z-indexes off the `--kol-z-*` ladder.** `compose/CanvasArea.jsx:1577` the context menu at `zIndex: 1200` (the DS `ContextMenu` would own this) · `:1404` an overlay at 130 · `compose/KineticElementOverlay.jsx:220` and `compose/SoftformsHandleOverlay.jsx:180` at 120 · `labs/LabsView.jsx:141` `z-[3]` · `inspectors/KineticPanel.jsx:558` inline. The ladder shipped with `EditorOverlaysOnFullscreenOverlay` (theme 0.76.0) for exactly this. *fix: tokens.*

**E5 · The canvas context menu is still local.** `CanvasArea.jsx:1570–1600` positions its own fixed panel (rows are `MenuDropdownItem` since plan 19); the DS `ContextMenu` + `useContextMenu` (2026-09-21) is the surface, with flip/shift and the popover chrome. Layers have no context menu at all (the user's 23). *fix: `ContextMenu` on the canvas and on `LayerStack` rows.*

**E6 · Local popover bodies to read on the live pass.** `PopoverPanel` hosts seven bodies: `inspectors/TextPanel.jsx` ×2 (Type settings · size presets) · `shell/panels/SelectionPalettePanel.jsx` · `params/BindDot.jsx` · `inspectors/LayerInspector.jsx` (blend) · `inspectors/KineticPanel.jsx` · `inspectors/ColorField.jsx`. Blend, bind and size presets are DS rows now; Type settings, the selection palette, kinetic and the colour field body are hand markup on a DS panel. *read on plan 20's live pass; file to plan 17 where the DS has no body for them.*

Clean: `border-fg-*` 0 vs `border-oq-*` 49 (the stroke law holds); no `SCRIM` constants; no `w-full` on an `Input`/`NumberField` (C1's width is the Input's default fill, not a class); `<select>`/`<textarea>` none.
