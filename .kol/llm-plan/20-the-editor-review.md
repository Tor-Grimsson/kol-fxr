# Plan — The editor review

**Status:** BUILT 2026-10-09 (local, one session, under `/kol-goal` in force mode) — § 9 steps 0–8 done and walked on the built bundle (playbook: `.kol/llm-context/playbook/2026-10-09-plan-20-the-editor-review-built.md`). Rulings taken here: A6 (placeholders ride the DS switch, an EmptyState otherwise) · A7 · C2 · C4/F3 (one dots key, off by the 2026-08-12 ruling) · F2 · #20 (a Fill · Stroke row that opens the colour modal) · #21 (snapping already covered objects + canvas — the label lied) · #29 (password set) · A3 (tour copy from the chromes' own lines) · C3 kept · A4 kept (documented). Tickets: `EditorTransformGlyphs` · `ButtonPrimaryHoverDeeper` · `HubSettingsHeaderAt390` · `HubWalkthroughEscape`; plan 17 holds the two DS gaps (`LayerStack` right-click, the browse columns' empty line). **Left for the user's live pass:** #10 the Scanline list, #11 the transport's rows, the touch gestures, the sign-in flow, § 1's inspector voice as one composition call, and whether the eyedropper glyph draws in the dark theme.
**Was:** OPEN 2026-10-09 (local) — **§ 9 is the build list** (the global audit's 46 findings + §§ 1–8, ordered; plan 21 DONE). Seeded below with everything still outstanding about the editor chrome; the user's live pass over `/editor` re-checks each item in place and appends new findings under § 8, verbatim; then the list is ordered and built here (the editor is this repo's source — no DS round trips, ARCHITECTURE § 2).
**Origin:** user, 2026-10-09: *"lets close this and open the editor review, is there anything parked about the editor? any plan?"* → *"compile whats outstanding from what you found into this new plan"*. Plan 16 had deferred the chrome to "its own plan after this".

## 0. Where the 2026-09-03 review stands (`editor-chrome-review`, sixteen findings)

- **Shipped by the DS** (component 0.205.0 · theme 0.144.0 · design-editor 0.12.0 + 0.13.0): 1 close-button hit areas · 2 `fg-*` → `oq-*` strokes · 5 `AlignmentGrid` as two stateless `SegmentedToggle` strips · 6 dropdown surface · 7 popover tone + `oq-04` border · 8 toolbar icon ladder · 9 the name field's rest affordance · 13 the three rulings (accent teal · guides magenta · selected field white, scoped to `.kol-design-editor`).
- **Closed since, here:** 12 bucket thumbnails (the Assets Images block, 2026-09-30) · 16 Fill/Stroke as two boxes (no Fill/Stroke sections since 2026-09-27 — paint is the left rail's Colour and Stroke panels).
- **Still open — this repo's now:** 3 · 4 · 10 · 11 · 14 · 15, §§ 1–5.

## 0b. THE AUDIT — first, before the thirty are ordered → **plan 21, the global audit** (user, 2026-10-09: *"the entire repo needs an audit, I wanted a global audit!"*). The editor-only scope below is superseded; kept as the seed of plan 21 §§ B–E.

Plan 16's audit was one grep (`<p className="kol-helper-12">`) by a cloud agent; it never read the editor or pressed a tool. Measured 2026-10-09, what it missed: **11 more helper-on-sentence lines in 5 files** (`ParametersPanel` ×6 · `EffectsPanel` ×2 · `MenuTop` · `RuleRow` · `EditorErrorBoundary` — the `<Hint>` wrapper carries `kol-helper-12` by default, so the fix is once, there), **9 helper classes on expression text**, **one bare `<select>`** (`AutoControls.jsx`), and nothing behavioural at all (findings 22 · 24 · 25 · 27 are what a grep never finds).

The real audit, three passes, each on the built bundle and each its own log under `.kol/llm-context/audit/`:
1. **Type conformance** over all of `src/editor` — `/kol-type-conform`: every `kol-helper-*` on text that can wrap → `kol-mono-*`; `Hint`'s default; no freestyle sizing, no foreign families (LayerRenderer's inline fonts are canvas rendering — exempt).
2. **DS assets** past buttons — bare `<select>`/`<input>`/`<textarea>`, hand-rolled popovers and lists, inputs stretching instead of `chars`-sized (finding 18), every panel header's vocabulary.
3. **Behaviour walk** — every tool in the palette and every menu verb, pressed with nothing / a shape / a photo / a locked layer selected; every panel's empty state; drop/paste/keys; at 1600 and 390 touch. A repro note per failure (what, where, state, width). This is where 27's *"multiple items in the tools don't work"* gets names.

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

**2026-10-09, first pass** (three screenshots: the Colour panel's top row · the Parameters tab's empty state · the Opacity row):

17. *"its not possible to sample color, no sample shorcut 'i' for eyedropper, nor is there the eyedropper in the color panel — it should be there, it was there. dont know what happened to it."*
18. *"and is this labelled control? [the Opacity row] I also feel like often times the input is wayy to wide, much wider then it needs to be"*
19. *"editor needs an audit? I still see f.e. helper instead of the correct mono f.e. [the Parameters tab's 'Select a layer to edit its parameters.']"*
20. *"shapes have no color parameters"*
21. *"the snap only has snap to guide, we need snap to object and snap to canvas"*
22. *"click away outside canvas should deselect selection, only way to deselect everything is to select the canvas in layers, and then click below last item. that's a bug."*
23. *"layers have no context right click, look at media context right click, same with other places, often times you'd want certain items in context window on right click."*
24. *"uploaded image, didnt retain in memory when I accidentally lost the browser window"*
25. *"dropping image outside canvas opens image in browser, which resulted in previous listed issue/problem."*
26. *"cropping image and moving doesnt work because there is no difference in handling, it just keeps grab. we should use a and v for selection modes? like figma. or think about crop being an operation you enter and exit. again like figma you I think alt or some combination click to get crop dialog"*
27. *"crop image tool doesnt do anything? I feel like multiple items in the tools don't work?"*
28. *"alt drag on canvas and layer to copy is needed"*
29. *"change password 3341, I dont care if its public its not an issue, its doesnt reveal anything personal, its just a function"*
30. *"media browser in the rail upon login, this might have been solved"*

## 9. From the global audit (plan 21, 2026-10-09) — THE BUILD LIST, ordered

46 findings across seven logs (`.kol/llm-context/audit/2026-10-09-{A-routes,B-tools-and-verbs,C-panels,D-type,E-ds-assets,F-persistence,G-code}.md`), folded with §§ 1–8 and ordered here: data loss and dead tools first, then one-line fixes, then the composition passes, then rulings and tickets. Each item names its log entry; the log carries file:line, state and width.

**0. The two DS returns (first — they are bumps).** kol-component 0.245.0 + kol-theme 0.169.0: swap `MorphTab.jsx`'s `StepList` for the package's and retire the copy (E2, `StepList` receipt); delete `dim()` + the `onChange` guard, pass `options[].disabled` (G4, `SegmentedToggleOptionDisabled` receipt).

**1. Data loss and the browser leaving.** F1 dropped images die with the window (images through `saveClip`, #24) · B7 a drop off the stage navigates the tab (`dragover`/`drop` prevented at the root, #25).

**2. Dead and half-dead tools.** B4 Crop lights and does nothing (`imgW` on every photo insert; never light a mode without its overlay, #27) · B5 two *Crop image* buttons · B3 placing text then typing fires the keymap (text editing on place; keys never reach the keymap from a text field) · B1 click outside the frame keeps the selection (#22) · B6 ⌥-drag duplicates (#28) · B2 + B8 lock is one rule (flip · nudge · rotate · delete · duplicate).

**3. Keys.** A9 the shortcuts sheet closes on Escape · A12 `?` aliases `S` · A8 `I` → eyedropper, the placeholder toggle off the keymap (#17; the glyph in the dark theme still to check live).

**4. Type, in one sweep.** D1 + D2 twelve helper sentences (nine are `<Hint className=…>` overrides of a mono default) · D3 eight freestyle eyebrows → `kol-eyebrow` · D4 the CSS tooltip chip · D5 `--font-sans` on the editor root (#19 = § 0b).

**5. Dialogs and empty states.** A1 + A2 the New File dialog gets a surface and the mono voice (E2) · A4 the search placeholder · A10 the Files crumb · A11 the Files empty state · A14 the phone's browse screen dismisses (Escape, scrim tap) · A5 the Walkthrough closes on Escape (verify by hand first).

**6. Chrome consistency.** E4 five z-indexes onto `--kol-z-*` · E5 `ContextMenu` on the canvas and on layer rows (#23) · C3 *Add effect* defaults to a real category · C1 the Stroke weight field takes `chars` (#18) · E1 the schema rail's range input → `Slider` · G1 `FlipButton` retired · G2 `loopById` / `filterById` copies import the registry, the maths helpers into `loops/lib/util.js` · G3 one expression sandbox · G4 the two stale notes.

**7. Rulings (one line each, the user's).** A6 the Library's 70 placeholder cards → an empty state · A7 no settings gear on `/settings` · A3 the Walkthrough's placeholder copy · C2 the File footer tab repeats the File menu · C4 + F3 modulation dots: one setting, on by default or a visible door · E3 the inspector's 73 size literals vs `useControlSize()` · F2 a build without `VITE_FXR_API` says so · § 1 (findings 3 + 4) the inspector voice · #20 shapes' colour — a Fill · Stroke row in the inspector that opens the Colour panel, or the 2026-09-27 ruling reversed · #21 snap to object + canvas (a feature; the drag math at `CanvasArea.jsx:563–584`) · #26 crop's gesture grammar once B4 lands · #29 the password (`wrangler secret put ADMIN_PASSWORD`, the user said 3341) · #30 Media in the rail — verify live, likely done · C1's property grid (the DS's half-width rule) · A13 the Settings header at 390.

**8. Tickets.** § 2 the six weak glyphs (kol-icons, with a proposal page) · § 3 the primary hover (kol-theme) · A13 `PageHeader`/`HubSettings` at 390 (kol-shell) · E6 the four hand-built popover bodies, after the live read (plan 17 shape).

Not reproduced, left to the live pass: #10 the Scanline list, #11 the transport's two rows (still two rows), the touch gestures (plan 15 § 5), the sign-in flow (F2).

## Order
§ 9 is the order. Steps 0–6 are builds and go in that sequence, each walked on the built bundle; 7 waits on the user's rulings; 8 files when 7 says so.

## Verification
Each item re-checked on the built bundle (`vite preview`) at 1600 and 390 touch, 0 console errors; §§ 2–3 close on a shipped icons / theme version cited here.
