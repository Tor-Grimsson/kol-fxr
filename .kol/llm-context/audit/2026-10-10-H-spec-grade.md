# H — the spec grade (plan 22 § 2), run after plan 23 was built

**Run:** 2026-10-09, local, `vite preview` of the built bundle, Chromium 1600×1000 (rails 320 — the ≥1536 rung) and 1280×860 (rails 264). Fresh profile per state (storage cleared). Measured by script over the right rail per tab: every control's height, every `kol-helper-10` label's case, every heading's size, every number field's box width. **0 console errors across every walk.**

Rule key (from `2026-10-10-editor-spec.md`): R1.3 one rail width · R3.5 empty state · R4.1 one heading rung · R5.2 uppercase labels · R6.1 number width by value · R6.2 property grid fills its cell · R6.3 one control rung.

## Pane × state

| State | Inspector | Parameters | Effects |
|---|---|---|---|
| nothing | empty — **ruled** (2026-08-12: nothing selected renders nothing; DS `InspectorRail`) | R3.5 pass — "Select a layer to edit its parameters." visible | R3.5 pass — "Select a layer to edit its effect." visible |
| canvas | R6.3 pass (26) · R4.1 pass (eyebrow) · R6.2 pass (W/H fill the grid) · R6.1 pass (Fill opacity 3 chars, 68px) · R5.2 **fixed in the run** ("Infinite" was sentence case → `ColorField inline`) | n/a (canvas has no parameters) | n/a |
| rect | R6.3 pass · R4.1 pass · R6.2 pass (X Y W H ∠ % fill) · Fill/Stroke swatches clickable (R6.6) | R6.3 pass · R5.2 pass (6 labels) · R6.1 **fixed in the run** (range boxes were a fixed 5 chars → longest end + decimals) | slot stack, R6.3 pass |
| ellipse | as rect | pass — Arc start / Arc end | pass |
| path (A on a rect) | pass | pass — Vector effects only (Offset · Smooth · Zigzag · Distress) | pass |
| text | pass — Typography pane on the eyebrow | pass | pass |
| locked | pass — fields read-only (writes no-op) | pass | pass |
| multi (2 rects) | pass — Transform (count + align) · Appearance (opacity, blend, Group) | pass — first layer's | pass |
| group | pass | R3.5 pass — "This layer has no parameters." | R3.5 pass — "This layer can't host an effect." |

## Frame

| Rule | Result |
|---|---|
| R1.1 top bar = mode door · menus · cog | pass — the name field is gone |
| R1.2 status bar | pass — name under the canvas, click to rename |
| R1.3 one rail width | pass — 320 \| 320 at 1600, 264 \| 264 at 1280 |
| R1.4 resize + fold | pass — grab edge on both rails, own token each |
| R3.1 pane tabs = underline row | pass — Transport · Output · File too (desk) |
| R9.3 toolbar folds | pass — 10 cells |
| R8 pointers | pass — pen (+ close badge), orbit, rotate handle, eyedrop pick, hand grab/grabbing, zoom-in/out |

## Image · loop · kinetic (graded in plan 24 § 9)

| State | Inspector | Parameters | Effects |
|---|---|---|---|
| image (dropped PNG) | R6.3 pass · R5.2 **fixed in the run** ("Source" label-above was sentence case) | pass — Fit | pass — slot stack |
| loop (Layers › Add › Loop) | R5.2 **fixed in the run** (Preset pane pickers were sentence case → pickers default to the rail row) | pass — Generate / Style / Animation, every control 26 | pass |
| kinetic (Text fold › Kinetic type) | pass | R5.2 + R6.3 **fixed in the run** (Type/Category/Preset/Background/Fill sentence case; two 22px reorder buttons → DS icon buttons) | R3.5 pass — "This layer can't host an effect." |

/labs and /randomiser load clean on the same bundle (the picker defaults are shared). Touch (`md`) is the one rung not walked here.
