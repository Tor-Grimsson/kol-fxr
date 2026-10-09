# Plan — The editor review

**Status:** OPEN 2026-10-09 (local). Seeded below with everything still outstanding about the editor chrome; the user's live pass over `/editor` re-checks each item in place and appends new findings under § 8, verbatim; then the list is ordered and built here (the editor is this repo's source — no DS round trips, ARCHITECTURE § 2).
**Origin:** user, 2026-10-09: *"lets close this and open the editor review, is there anything parked about the editor? any plan?"* → *"compile whats outstanding from what you found into this new plan"*. Plan 16 had deferred the chrome to "its own plan after this".

## 0. Where the 2026-09-03 review stands (`editor-chrome-review`, sixteen findings)

- **Shipped by the DS** (component 0.205.0 · theme 0.144.0 · design-editor 0.12.0 + 0.13.0): 1 close-button hit areas · 2 `fg-*` → `oq-*` strokes · 5 `AlignmentGrid` as two stateless `SegmentedToggle` strips · 6 dropdown surface · 7 popover tone + `oq-04` border · 8 toolbar icon ladder · 9 the name field's rest affordance · 13 the three rulings (accent teal · guides magenta · selected field white, scoped to `.kol-design-editor`).
- **Closed since, here:** 12 bucket thumbnails (the Assets Images block, 2026-09-30) · 16 Fill/Stroke as two boxes (no Fill/Stroke sections since 2026-09-27 — paint is the left rail's Colour and Stroke panels).
- **Still open — this repo's now:** 3 · 4 · 10 · 11 · 14 · 15, §§ 1–5.

## 1. The inspector's vocabulary and consistency (findings 3 + 4) — RE-CHECK, then one pass

- **Then:** *"we are missing many oppertunities for uppercase eyebrows section styles, labelled control, labelledcontrolSection, etc."* · *"alot of tone issues, and size mismatch.. ugly dropdown and unneccesary popover everwhere"*. Position / Layout / Appearance / Typography were sentence-case headers with bare sub-labels.
- **Now:** the inspector rides `InspectorSection` ×26 (Transform · Typography · Parameters · Path · Image · Frame · Group · Preset · Background), `LabeledControl` ×80, `LabeledControlSection` ×6 — the DS vocabulary is in, whether every section reads as one voice is the live pass's call.
- **Do, if it still reads wrong:** one composition pass over `LayerInspector.jsx` + the inspectors folder onto the labs-rail laws (AGENT-CONTEXT § control vocabulary: one segmented control, one row, one label voice) — never piecemeal. The DS held this one back as *"a composition call … I would rather he looked at than have me guess"*.

## 2. Six weak glyphs (finding 14)

*"alignement is not great nor roation flip side flip up"* — the six align marks and the rotate / flip-horizontal / flip-vertical trio, read at 16px in the inspector. Icon drawing work: a proposal page or drawings, then a `kol-icons` ticket — not improvised here. Live pass: are they still the same drawings at icons 0.33.1?

## 3. The primary hover (finding 15)

*"this button tone primary, has werid hover state ... should not grey - should go deeper?"* — the full-width **Shape parameters** row (`LayerInspector.jsx:275`, still `tone="primary"`). Hover should go deeper, not flatter: a stronger primary, tertiary, or an `oq-ab-*` step. The hover is the DS `Button`'s (theme 0.168.0) — if it still greys, the ruling picks the candidate and it goes to kol-theme as a ticket; the row itself may just want a different tone.

## 4. The transport bar (finding 11)

*"so transport is wrong here"* — the Transport / Output / File tab row directly above play · pause · `Loop / 4s` · stop · rewind read as two control families (still so on 2026-10-09's screenshots). App-tier by ruling, so it is ours. He never said what "wrong" means — the live pass does.

## 5. The Generative → Scanline list (finding 10)

*"very buggy"* — the long grouped picker list. Never reproduced from a screenshot. Live pass: what, where, at which width.

## 6. From plan 19's walk (2026-10-09)

- `FlipButton` in `LayerInspector.jsx:409` has no caller — dead. Retire to `_tmp/` or wire it; the Transform section's flip buttons come from elsewhere.
- `ContentRow`'s `file` ramp titles in `kol-sans-heading-05`; the Assets rail overrides with `titleClass="kol-mono-12"`. A rail-voiced row is a DS gap candidate (plan 17 shape) — only if a second rail needs it.
- Not eyeballed after the swap (same DS atoms, build green, 0 console errors): the timeline dock's Delete key / Close, the Animation tab's Learn ×2 (`tone="outline"`), the blend / bind-source / size-preset menus (`MenuDropdownItem`), EffectsPanel's xs icon buttons.

## 7. The held specs — nothing owed

`editor-panels-the-held-specs` (seventeen hand-rolled panels, 2026-09-03): A1 LayerStack · A3 ToolPalette · A4 CurveEditor · A5 KeyframeEditor · A6 XYPad · A7 InspectorRail · A8 NumberField · B2 overlays — **adopted, the app imports them from kol-component today** (verified 2026-10-09). B1 the parameter rail + A2 TextPanel — **ruled to stay with the engine** (2026-09-25). B3 the timeline — shipped by the DS, then **taken back by ruling** (plan 14: the timeline is this repo's). The DS receipt still reads 🟠 "closes on fxr adopting it"; adoption is done — the DS's ledger to close, not ours. The one ruling left is the DS's: the fate of `packages/design-editor` now that the editor is source here (ARCHITECTURE § 2).

## 8. Added — the live pass
_(the user's findings, verbatim, numbered from 17)_

## Order
After the live pass. Default: § 6 bullets 1 (a retire) first; § 1 as one pass; §§ 2–3 as tickets with a proposal; §§ 4–5 once named.

## Verification
Each item re-checked on the built bundle (`vite preview`) at 1600 and 390 touch, 0 console errors; §§ 2–3 close on a shipped icons / theme version cited here.
