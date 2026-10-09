# The editor panel spec — a proposal (plan 22 § 1)

**Status:** PROPOSAL 2026-10-10, cloud session. The user rules on every rule marked **ruling**; rules marked **DS** are delivered by an installed KOL component or token as cited; rules marked **NEW** need code this repo does not have. Nothing in `src/` changed.
**Evidence:** the eleven maps and the critic in `2026-10-10-maps/` (every path:line below comes from them; `NM/` = `node_modules/@kolkrabbi/`). The grade (`H`) and the gap matrix (`I`) were NOT run this session — the browser harness that runs them is in `2026-10-10-harness/`.

## Read this first — the spec in plain words

What the editor looks like once every rule holds:

1. **The top bar has only menus and the cog.** The file name and the zoom percentage sit in a thin status bar under the canvas, the way Affinity shows `Untitled @ 130%`.
2. **Both side panels are the same width, and you can drag them narrower or fold them away**, like the navigation rail already does.
3. **The left panel is about the document** (Layers first, then Color / Stroke / Swatches, then Transport / Output / File). **The right panel is about what you selected** (Inspector / Parameters / Effects).
4. **Delete, duplicate, group, lock and hide live in a bar under the layer list.** Booleans live in the toolbar and the Tools menu. No `⋯` menu, no trash in a panel header.
5. **Every panel is built from the same parts:** an underline tab row; inside it, sections with a small UPPERCASE heading; inside those, rows with an UPPERCASE label on the left (112px) and the control on the right. The Transform block is the one exception: short fields in a two-column grid, like Affinity's.
6. **Every control is the same height (26px on desktop).** No 32px strip next to 26px fields.
7. **A number field is only as wide as its number.** Opacity is three digits and `%`, not a 72px box.
8. **Fill and Stroke are real swatches you click** to open the Color panel. The `Colour…` button goes away.
9. **One spelling, one word per thing:** `Color`, `Randomize`, `Delete`, `Animation`, `Frame` for the artboard, `Convert to path`.
10. **Each tool has its own pointer** (pen, rotate, orbit, eyedropper included), and the pen shows a small circle when you are about to close the path.
11. **Ten toolbar cells instead of fifteen**, related tools folded together, no glyph used for two things.

The seven questions you need to answer (yes/no):

1. Does the file name move to a status bar under the canvas? (Otherwise it goes to the browser tab title and the File menu.)
2. Do the side panels take the navigation rail's width token (264px, 320px on wide screens) instead of a fixed 320px?
3. Does Layers go above Color in the left panel?
4. Are empty-state sentences ("Select a layer to edit its parameters") always visible? Today they are hidden unless placeholders are switched on.
5. Do sub-headings like "Motion" and "Elements" become ordinary sections (same heading as everything else)?
6. Does the chrome named `Randomiser` keep its British spelling while every button says `Randomize`?
7. Is this the toolbar: `[Select ▾ Node] [Pen ▾ Line] [Shape ▾] [Text ▾ Kinetic] Pattern [Zoom ▾ Hand Orbit] ‖ [Rotate ▾ Flip] ‖ [Boolean ▾] ‖ Image · Crop · Duplicate`?

Everything below is the same spec with the evidence: each rule's exact value and the file that delivers it.

---

Why a spec: plans 16, 20 and 21 fixed 46+ findings one at a time and the drift survived because nothing said what a row, a heading or a field *should* be. Every rule below has a value. A future finding is "row X fails rule R", never "looks off".

The user's five standing complaints are the spec's test cases, and each is settled by a rule: field widths → R6.1; uppercase labels → R5.2; one panel width → R1.3; one control size per breakpoint → R6.3; `Colour`/`Color` → R7.1.

---

## R1 — The frame

| # | Rule | Value | Delivered by |
|---|---|---|---|
| R1.1 | The top bar holds the **mode door** (Editor · Labs · Randomiser), the **menus** (Generative · Effects · Tools · File · Canvas · Templates) and the **settings cog**. Nothing else. The frame-name field leaves it (the user's 8). | `h-12`, `MenuItem size="md"` triggers 32px, cog `IconFrame size="md"` 32px (today `sm` 26 beside 32px triggers — `src/editor/shell/MenuTop.jsx:465`) | DS `MenuItem` (`NM/kol-component/src/molecules/MenuItem.jsx:23,61`), `IconFrame` (`atoms/IconFrame.jsx`); name field removal **ruling** |
| R1.2 | The file name lives in a **status bar** under the canvas column: name (click to rename) · zoom % · the tool hint line (crop, pen). Affinity: `<Untitled> @ 130%`; Illustrator: zoom + artboard in the status bar. The floating zoom chip and the crop chip retire into it (three on-canvas label treatments today — map 05 c13). | `h-6`, `kol-helper-10`, `border-t border-oq-08`, `bg-surface-primary`; zoom text replaces `PanZoomViewport`'s chip (`NM/kol-component/src/organisms/Canvas.jsx:636-646`) | **NEW** (`canvas.footer` slot already exists, `src/editor/EditorShell.jsx:115-119`; the DS Canvas needs a `showZoomChip={false}` seam → plan 17) |
| R1.3 | **One rail width.** Left and right rails are the same width and it is the shell rail's open width, so three rails on one screen read as one system (today 48 \| 320 \| 320 and the shell opens to 264 below 1536 — map 01 c3). | `--kol-sidenav-w` (264px; 320 ≥1536, `NM/kol-framework/kol-framework.css:46,298`) for both tracks: `grid-template-columns: var(--kol-sidenav-w) minmax(0,1fr) var(--kol-sidenav-w)` replacing `320px … 320px` (`src/editor/styles/kol-editor.css:61`) | DS token; **ruling** (264 at the user's 1684px window would be 320 — unchanged for him; laptops get 264) |
| R1.4 | Rails **resize** by a grab on their inner edge and **collapse** to the shell's closed width; the state persists per rail. | grab = `.kol-rail-grab` (8px, `col-resize`, `NM/kol-theme/kol-animation.css:342-349`); collapsed = 48px (`--kol-shell-rail-width`); `useDragResize(ref, { token, side })` (`NM/kol-component/src/hooks/useDragResize.js`) as labs already does (`src/editor/labs/LabsView.jsx:163`) | DS hook; wiring **NEW** in `src/editor/EditorShell.jsx` |
| R1.5 | The **toolbar** is one row of `md` icon cells over the canvas, grouped by rule R9.3, with one divider between groups. | `ToolPalette size="md"` 32px cells, `Divider` 20px (`NM/kol-component/src/organisms/ToolPalette.jsx:48-50`) | DS |
| R1.6 | The **timeline dock** opens only when a track exists, is resizable from its top edge, remembers its height, double-click resets. | `DOCK_MIN 56 · DOCK_MAX 480`, `.kol-timeline-grab` (`src/editor/params/TimelineDock.jsx:420-441`) | as built |
| R1.7 | Every hairline in the editor chrome is **one token**: opaque `--kol-oq-08`. The shell rail and DS chips use translucent `fg-08` (map 01 c9) — the editor does not. | `border-oq-08` | DS token |

## R2 — What each rail holds

| # | Rule | Value |
|---|---|---|
| R2.1 | **Left rail = the document**: Layers · Assets on top, then Color · Stroke · Swatches, then the footer Transport · Output · File. Layers go first because the selection drives everything on the right (Figma, Affinity: layers on the right; here the right is the inspector, so layers lead the left). **ruling** — today Color leads (`src/editor/Compose.jsx:29-31`). | order −1 → `LayersAssetsPanel`, 0 → `ColorModal` |
| R2.2 | **Right rail = the selection**: Inspector · Parameters · Effects (· Pattern). The tab row holds tabs only — no `⋯`, no trash (R3.3). | `SelectionPalettePanel.jsx:70-94` loses the two icon buttons |
| R2.3 | The Layers pane owns the **layer verbs**: add, delete, duplicate, group, lock, hide — in a footer bar under the list (Figma/Affinity put delete under the layers; the user's 20). | `LayerStack` footer (today only the ≥2-selected Group button, `NM/kol-component/src/organisms/LayerStack.jsx:423-436`) → **DS seam** (plan 17): `footerActions` slot |
| R2.4 | Booleans are **toolbar + Object menu** verbs, never an overflow menu. The `⋯` menu's rows (Union… / Flatten / Release / Edit object / Save type) move: booleans to the toolbar fold they already have, Flatten/Release to the Tools menu they already have, Edit object + Save type to the layer's context menu. | `SelectionPalettePanel.jsx:110-166` retires |

## R3 — A pane

| # | Rule | Value | Delivered by |
|---|---|---|---|
| R3.1 | A pane's **tab strip** is the underline `TabsRow`, 40px, labels `kol-mono-12`, verbatim case. Every pane tab in both rails uses it — the footer's Transport · Output · File strip is a SegmentedToggle today (map 02 c6) and becomes a `TabsRow` too. | `NM/kol-component/src/molecules/TabsRow.jsx:38,57` | DS |
| R3.2 | A **mode strip inside a pane** (Generate · Style · Animation, Effect · Motion, Hue · Wheel · Sliders) is a `SegmentedToggle size="sm" tone="sunken"`, full width. Not a tab row, not a dropdown (the Colour mode picker is a dropdown today, `ColourPanel.jsx:114-122`). | `NM/kol-component/src/atoms/SegmentedToggle.jsx:63` (`tone="sunken"` `:51-56`, theme `kol-components-molecules.css:2296-2300`) | DS |
| R3.3 | A pane **header** carries the title and at most two icon actions (`Button tone="ghost" quiet size="sm" iconOnly`) at the right. Overflow and delete never live in a header. | `NM/kol-component/src/molecules/InspectorSection.jsx:33-44` (`actions`) | DS |
| R3.4 | **Scroll**: the pane body scrolls; the tab strip stays pinned. Exactly one `overflow-y: auto` box per rail, one `scrollbar-gutter: stable`. (Today three nest on the right — critic F8.) | `.kol-editor-rail-body` is the scroller; `.kol-compose-rail` and `.kol-compose-inspector-body` lose `overflow` (`src/editor/styles/kol-editor.css:152-172,367-379`; `SelectionPalettePanel.jsx:95`) | local CSS |
| R3.5 | **Empty state**: one sentence, `kol-mono-12 text-meta`, always visible. Not the `Hint` placeholder gate (off by default — nobody sees "Select a layer to edit its parameters"). `Hint` stays for the UI-explainers the user can switch off. | `EmptyState` (`NM/kol-component/src/molecules/EmptyState.jsx:28-30`) or a bare `p` | DS; **ruling** (12 gated sentences, map 09 § 6) |
| R3.6 | Pane body inset is **16px** on every side, 20px bottom. | `padding: 4px 16px 20px` (`kol-components-molecules.css:1035-1039`); left-rail panels drop `p-4`/`px-2`/`20px` mixes (map 02 c7) | DS pane |

## R4 — A section

| # | Rule | Value | Delivered by |
|---|---|---|---|
| R4.1 | A section **heading** is the eyebrow: mono 12 / weight 500 / 0.06em / UPPERCASE / `text-fg-80`. The Inspector's 14px pane titles (the user's 17) retire to it. One heading rung in the whole editor (four today — map 09 § 2). | `.kol-eyebrow` (`NM/kol-theme/kol-type-roles.css:285-292`) via `LabeledControlSection` (`NM/kol-component/src/organisms/SettingsPanel.jsx:155-161`) | DS |
| R4.2 | Sections are **divided** by one hairline with 20px above the next heading; no `<Divider>` atoms between sections. | `.kol-section--divided + .kol-section--divided` (`kol-components-molecules.css:1004-1012`) | DS |
| R4.3 | Rows inside a section stack at **8px**; sections at 12px under the heading. | `gap-2` rows, `gap-3` section (`SettingsPanel.jsx:157-159`) | DS |
| R4.4 | Sub-heads inside a section (Motion, Elements, OpenType…) are not a third rung: they are sections. | — | **ruling** |

## R5 — A row

| # | Rule | Value | Delivered by |
|---|---|---|---|
| R5.1 | **One row primitive**: label left, control right. Label column fixed, control fills. | `SettingsRow labelWidth={RAIL_LABEL_W}` → `LabeledControl inline` (`SettingsPanel.jsx:120-127`; `LabeledControl.jsx:79-88`) — the labs law applied to the editor | DS |
| R5.2 | Labels are **`kol-helper-10`, UPPERCASE**, `text-meta`. Casing is applied by `SettingsRow` (`label.toUpperCase()`), never by CSS, so the string stays authored. The user expects uppercase labeled controls (his 14). | `kol-helper-10 tracking-widest text-meta` (`LabeledControl.jsx:82`) | DS |
| R5.3 | The label column is **112px** in every rail — `RAIL_LABEL_W`. Not 48 (left rail today), not 160 (DS default). | `src/editor/params/controlSize.js:44` | local constant |
| R5.4 | Row height is the control rung: **26px** at `sm`. Nothing taller sits in a row. | `--kol-ctl-sm` (`NM/kol-theme/kol-base-tokens.css:215`) | DS token |
| R5.5 | The one exception is the **property grid** (Affinity's Transform panel — the user's "clean" reference, `22-assets/21`): short fields with a letter affordance (X · Y · W · H · ∠ · %) in a 2-column `gap-2` grid, fields filling their cell, unit inside the field. Used for Transform and for Appearance's Opacity · Radius pair only. | `Input variant="property" size="sm" affordance unit` (`NM/kol-component/src/atoms/Input.jsx:104-118,217`), `grid grid-cols-2 gap-2` (`LayerInspector.jsx:59,78`) | DS |
| R5.6 | A toggle row puts the switch at the row's right edge; everything else fills. | `SettingsRow align="end"` for a bare `ToggleSwitch`, `fill` otherwise (`AutoControls.jsx:324`) | DS |
| R5.7 | Label-above rows exist only where the control cannot share a line: a textarea, a slider on touch, a swatch grid. | `LabeledControl` stacked (`LabeledControl.jsx:94-96`) | DS |

## R6 — Controls

| # | Rule | Value | Delivered by |
|---|---|---|---|
| R6.1 | A **number field is as wide as its longest value plus its unit** — `chars = max digits + unit`, never `w-full`, never `flex-1`, never a px width. Opacity = `3` + `%`; stroke weight = `4` + `pt`; seed = `10`; hex = `6` + `#`. The Colour pane's Opacity readout is 6 chars today (`Slider displayWidth` default 6, `NM/kol-component/src/molecules/Slider.jsx:41,289`) — the user's 14, four times asked. | `Input chars` (`Input.jsx:42-46,171,215`); `Slider displayWidth` | DS props |
| R6.2 | Inside the property grid (R5.5) a field fills its cell; outside it, R6.1. | — | — |
| R6.3 | **One size rung per breakpoint for every control**: `sm` on desktop, `md` on touch, read from `ControlSizeContext`; no `size="…"` literal in a rail component, no missing `size` (the DS default is `md`). Today's violations: Generate · Style · Animation strip (`ParametersPanel.jsx:84`, the user's 18), Effect · Motion (`EffectsPanel.jsx:262`), Cap · Join (`StrokePanel.jsx:113-114`), HSL · RGB (`ColourPanel.jsx:202`), Grid switch (`CanvasInspector.jsx:62`), `Colour…` xs (`LayerInspector.jsx:256`), effect-row xs buttons (`EffectsPanel.jsx:360`), ~40 `size="sm"` literals (map 10 § 2). | `useControlSize()` (`controlSize.js:26-27`) | local context |
| R6.4 | **Dropdowns** fill the row (`w-full`), `variant="subtle"`, rows 26px. | `NM/kol-component/src/molecules/Dropdown.jsx:151` | DS |
| R6.5 | **Segmented** controls: the DS `SegmentedToggle` with `tone="sunken"`, `size` from context, full width. `ViewToggle` leaves the rails (two looks for one choice today — map 04 c5). | `SegmentedToggle.jsx:51-56` | DS; the labs copy in `kol-labs.css:263-269` retires |
| R6.6 | A **swatch** is 14px inline in a label row, 24px in a colour row, and **clickable** when it edits something: it opens the Color pane (the user's 15). The Fill · Stroke row becomes two `ColorSwatch` buttons + the labels, no `Colour…` button (his 16). | `ColorSwatch onClick` (`NM/kol-component/src/molecules/ColorSwatch.jsx:87,142-147`) | DS |
| R6.7 | **Icon buttons** in rails are `Button tone="ghost" quiet size={cs} iconOnly`; glyphs come from the SOLO ladder (16 at `sm`), never a literal size. | `NM/kol-component/src/hooks/glyphLadders.js:27` | DS |
| R6.8 | **Buttons** that run a verb are `tone="primary" size={cs}`, full width when alone in a row, `flex-1` + `shrink-0` icon when paired. | `LoopFields.jsx:268-278` precedent | DS |
| R6.9 | The **eyedropper** is a visible icon button in the Color pane in every browser (the picker samples the canvas itself and never needs `window.EyeDropper` — `src/editor/color/canvasEyedropper.js:6-13`; the DS hides it in Firefox, `NM/kol-component/src/molecules/SwatchControls.jsx:110,139-145` — the user's 12). | `eyedrop` glyph at 16 (today 24) | DS seam → plan 17 (`EyedropPick always`) |

## R7 — Words

| # | Rule | Value |
|---|---|---|
| R7.1 | **American spelling**, as ruled 2026-09-30: `Color`, `Randomize`, `Center`. Three `Colour` strings (`LayerInspector.jsx:256`, `KineticPanel.jsx:271`, `keymap.js:107`) and two `Randomise` (`KineticPanel.jsx:278`, `SoftformsLayers.jsx:283`) change; `Randomiser` the chrome name is the user's call (**ruling**). |
| R7.2 | **Sentence case** for every label, button, menu row and tooltip (`Corner radius`, `Flip horizontal`, `Add effect`). Title Case only for proper names (preset names, `Right Grotesk`). Row labels are uppercased by `SettingsRow` at render, so the string is still sentence case. `labels.js:3` ("Title Case everywhere") is rewritten. |
| R7.3 | **One name per thing**: `layer` (not object/element/form) · `Frame` for the artboard, `Canvas` for the infinite surface · `Delete` for a destructive verb (not Remove/Clear) · `Animation` for the tab (not Motion/Anim) · `Opacity` · `Weight` for stroke · `Unite · Subtract · Intersect · Exclude` (not Union, not Subtract front) · `Convert to path` (not Flatten shape) · `Flatten` only for text/pattern/paratype bakes · `Library` for saved files, `Media` for the buckets. |
| R7.4 | **Ellipsis** on every verb that opens a dialog or picker (`Save…`, `Library…`, `Batch export…`, `Edit object…`) and on none that acts at once. The glyph is `…` (U+2026), never `...`. |
| R7.5 | Tooltip = the aria label; a shortcut rides as the DS key chip, never in parentheses in the text (`Reset to defaults (R)` → chip). |

## R8 — Pointers

| # | Rule | Value | Delivered by |
|---|---|---|---|
| R8.1 | Every tool sets **its own cursor** on the stage, and layers do not override it. | `CURSOR_FOR_TOOL` (`src/editor/compose/CanvasArea.jsx:26-33`) extended | local |
| R8.2 | Select `default`; over a layer `move`; over a handle the resize cursors; rotate handle **custom rotate** glyph; Node select `default` + a small square badge; Pen **pen** glyph, with a `○` badge over the first anchor (close) and `+` over a segment (insert); Shape tools `crosshair`; Text `text`; Zoom `zoom-in`, `zoom-out` with ⌥; Hand (Space) `grab`/`grabbing`; Orbit **orbit** glyph; Eyedropper **eyedrop** glyph. (Figma/Illustrator conventions.) | CSS keywords where they exist; the four glyph cursors as **inline `data:` SVG cursors** (`cursor: url("data:image/svg+xml;…") 2 2, crosshair`) — the 2026 attempt failed on Vite `?url` (`CanvasArea.jsx:20-25`), not on SVG cursors | **NEW** (one `cursors.js` with four strings) |
| R8.3 | The `cursor: inherit !important` rule stays (it is what makes R8.1 true for non-select tools). | `src/editor/styles/kol-editor.css:114-116` | local |

## R9 — Icons

| # | Rule | Value | Delivered by |
|---|---|---|---|
| R9.1 | One set: **kol-icons interface**, 24-box, 1.5 stroke; a toolbar glyph is 20 (SOLO md), a rail glyph 16 (SOLO sm). No literal icon sizes. | `NM/kol-icons/src/Icon.jsx`, `cuts.json` | DS |
| R9.2 | **No glyph means two things** on one screen: `camera` is the webcam, so Orbit gets `shape-torus` (signal set, resolvable — the user's 10) or a new `orbit` cut; `type` is the Text tool, so Kinetic type gets `type-02`; `copy` is Duplicate, so Batch export gets `layers`; `image` is Insert image, so the rail's Media row gets `nav-library`. | names present in `cuts.json` (map 08 § 11) | DS names; `orbit`/`node-select`/`hand` cuts → plan 17 |
| R9.3 | The toolbar **folds** related tools (the user's 9): `[Select ▾ Node]` · `[Pen ▾ Line]` · `[Shape ▾ Rect Ellipse Triangle Polygon Star]` · `[Text ▾ Kinetic]` · `Pattern` · `[Zoom ▾ Hand Orbit]` ‖ `[Rotate ▾ Rotate left · right · Flip h · v]` ‖ `[Boolean ▾]` ‖ `Image` · `Crop` · `Duplicate`. 10 cells, 15 today. A fold's trigger shows the **last-picked** variant. | `SplitToolButton` (`NM/kol-component/src/molecules/SplitToolButton.jsx`) — whether a fold may mix tools and actions, and show the last pick, is the open read T5 (critic § 8) | DS; gaps → plan 17 |
| R9.4 | Shortcut chips come from `keymap.js` only; `TOOL_META.shortcut` and the hand-typed `'⇧H'` strings (`ToolPalette.jsx:80-89`) go. | `comboLabel` (`keymap.js:221-223`) | local |

---

## The rulings this spec needs

1. R1.2 — the name moves to a status bar (vs the document title only).
2. R1.3 — rails take `--kol-sidenav-w` (264/320) instead of a flat 320.
3. R2.1 — Layers above Color in the left rail.
4. R3.5 — empty states always visible; `Hint` only for explainers.
5. R4.4 — sub-heads become sections.
6. R7.1 — `Randomiser` as a product name keeps its spelling, or not.
7. R9.3 — the fold list.

## What goes to plan 17 (KOL)

`LayerStack` footer-actions slot (R2.3) · `Canvas showZoomChip` (R1.2) · `EyedropPick` without the native gate (R6.9) · `orbit` / `node-select` / `hand` cuts (R9.2) · `SplitToolButton` last-pick + mixed items if T5 says no (R9.3) · `.kol-inspector-pane-title` can retire once no consumer remains (R4.1).
