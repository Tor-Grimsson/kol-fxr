# 12 — Completeness critic: what the 11 maps still owe the spec, the grade, the gap audit and the 26 items

Read: maps 01–11, `.kol/llm-plan/22-editor-spec-and-gap-audit.md`, the 15 shots in `.kol/llm-plan/22-assets/`, plus spot reads cited below. Paths repo-relative; `NM/` = `node_modules/@kolkrabbi/`.

## 0. Verdict

1. The maps cover all nine spec areas and give a file:line root cause for every one of the 26 items; one (item 14) pointed at the wrong surface until the screenshot was read — it is the Colour pane's Slider readout (`displayWidth` default 6, `NM/kol-component/src/molecules/Slider.jsx:41,289`), not the Inspector field.
2. No map opened `22-assets/`. The shots settle three things the code cannot: the user runs Firefox (shot 15 chrome) so item 12 will not reproduce in Chromium; both rails are 320 css px (shot 15) so item 13 is rows/inputs, not aside widths; the Affinity reference (shot 21) carries an anchor selector, a shear field, Navigator/History tabs and a status bar — none of which the DS index exports (`NM/kol-component/src/index.js`, grep: only the `useHistory` hook :254).
3. Two map-vs-map contradictions are resolved here against the code: `--kol-sidenav-w`/`--kol-rail-w` ARE defined (`NM/kol-framework/kol-framework.css:46,298,901,905`, imported by `src/index.css:33`), so Map 10 §Contradictions 17–18 and its first open question are wrong; the DS `EditorShell` utility Map 03 cites as "DS rail fallback" (`NM/kol-component/src/utilities/EditorShell.jsx:60,78,160`) is imported nowhere under `src/` (grep 0), so the frame is entirely local CSS (kol-theme has no `.kol-editor-*` rule either, grep 0).
4. For the GRADE the one structural gap is a state × pane binding table (which layer each pane binds to for canvas / multi / locked / photo, and which filters each host is offered). The Colour-pane half is now read (`src/editor/color/useColorTarget.js:68-96`); the other four panes are task T1.
5. Grader traps: placeholders default OFF (`NM/kol-component/src/hooks/usePlaceholders.js:37-42,61-66`; `NM/kol-theme/kol-utilities.css:111-113`) so every `Hint` empty state is invisible unless `Shift+I` was pressed; Linux Chromium draws classic scrollbars and the right rail nests three `scrollbar-gutter: stable` boxes (`src/editor/styles/kol-editor.css:158,375`; `src/editor/shell/panels/SelectionPalettePanel.jsx:95`) that the user's macOS overlay scrollbars never reserve.

## 1. Spec coverage — nine rule areas

| # | Area | Values measured by | KOL deliverer named | Gap / task |
|---|---|---|---|---|
| 1 | Frame: top bar · toolbar · rails · canvas · dock · status | 01 §2–6, 08 §9 | MenuTop/MenuItem, DS ToolPalette, kol-shell NavRail, DS Canvas, local dock | Rails are local CSS (`kol-editor.css:61`), no resize/collapse; DS `EditorShell` + `useDragResize` exist and are unused → **T3** reads them so rule 1 can say "adopt" or NEW. No status bar exists anywhere (grep `statusbar|status-bar` in src/editor: only a meta tag at kol-editor.css:16) → NEW, with shot 21's `<Untitled> @ 130%` as the reference and item 8's name field as its content |
| 2 | Rail contents | 01 §4, 02, 03, 04 | — | complete |
| 3 | Pane: tab strip · header + actions · overflow/delete · scroll · empty state | 02 §1, 03 §7, 04 §0, 08 §4 | TabsRow, Button iconOnly, PopoverPanel, Hint/EmptyState | Which box actually scrolls and whether the tab row stays pinned is inferred, not read end-to-end → **T8**; DS `EmptyState` anatomy unread (34 lines) → **T7**; delete-below-the-layers needs the DS LayerStack footer API → **T6** |
| 4 | Section: heading · divider · spacing | 03 §1, 08 §3–4, 09 §2, 10 §5 | InspectorSection pane / LabeledControlSection / kol-eyebrow | complete (four heading rungs enumerated, 09 §2) |
| 5 | Row: label style/case · label column · row height · alignment | 08 §3, 10 §1, 09 §0 | LabeledControl (48) / SettingsRow (160→112) / FieldRow (192) | complete; row height is derivable (label 10 + gap 8 + ctl 26 = 44 stacked; 26 inline) |
| 6 | Controls: width by chars · one size per breakpoint · swatches · segmented tone · icon buttons | 02 §2, 03 §3–4, 04 §1, 08 §1–2, 08 §6, 10 §2–4 | Input `chars`, SegmentedToggle `tone="sunken"`, Button iconOnly | px width of a `chars=N` box is browser-dependent; Slider readout is `displayWidth` (consumer-settable); DS `PropertyInput`/`Stepper` never evaluated as the numeric-row primitive → **T2** |
| 7 | Words | 09 | — | complete (30 contradictions tabled) |
| 8 | Pointers | 05 §1 | none (no `--kol-cursor-*`, 08 §10) | complete; reason custom cursors were dropped is now quoted (§4 F6) |
| 9 | Icons: set · stroke · size · grouping | 01 §3, 08 §11 | kol-icons Icon, SplitToolButton | per-glyph cut/stroke for the 20 toolbar names not tabled → **T4**; what a DS fold can do (trigger shows last pick? tools + actions mixed?) unread → **T5** |

## 2. Grade coverage — pane × selection state

Panes: Inspector (I), Parameters (P), Effects (E), Colour/Stroke (C), Layers (L), Toolbar predicates (T). "map" = answered with file:line; "T1" = still needed.

| State | I | P | E | C | L | T |
|---|---|---|---|---|---|---|
| nothing | map 03 §2 (renders nothing) | map 04 §2 (Hint, hidden by default) | map 04 §3 | **critic §4 F3**: app-level paint only | map 02 §3.2 | T1 |
| canvas | map 03 §6 | T1 (`selectedId==='canvas'` → `findLayerDeep` miss → Hint?) | T1 | critic F3: fill → `setCanvasFill`, stroke app-only | map | T1 |
| rect | map 03 §2–4 | map 04 §2 (Kind only) | map 04 §3 + critic F4 (canvas-only filters) | map 02 | map | map 01 §3 |
| ellipse/polygon/star/triangle | map 03 §2 | map 04 §2 | same | map | map | map |
| path | map 03 §2 (Path pane) | map 04 §2 (bare strip) | critic F4 | map | map | map |
| text | map 03 §5 + 09 §3 | map 04 §2 | critic F4 | map | map | map |
| image (photo) | map 03 §5 | map 04 §2 (Fit) | critic F4 (engine host) | critic F3: app-only writes, silent | map | map (Crop enabled) |
| loop | map 03 §5 | map 04 §2a | critic F4 (engine host unless engine loop) | critic F3 | map | map |
| group | map 03 §5 | map 04 §2 (Hint) | map 04 §3 ("can't host") | critic F3 | map 06 §6 | T1 (`canXform`?) |
| locked | map 03 §8 (writes through) | T1 (any disable?) | T1 | critic F3: writes through (:90,:95) | map 06 §8 | map 01 §3 (Crop/Duplicate off) + T1 |
| multi-select | map 03 §2 | T1 (first id?) | T1 | critic F3: first id (`selectedId`, :68-69) | map 06 §9 | map 01 §3 (`canBool`) + T1 |

## 3. The 26 items — root cause status

| # | Item | Root cause (file:line) | Map | Status |
|---|---|---|---|---|
| 1 | Canvas-edge hover/click selects canvas | border is `pointer-events-none` `NM/kol-component/src/organisms/Canvas.jsx:131-137`; grey viewport press → `select(null)` `src/editor/compose/CanvasArea.jsx:908-922`; `'canvas'` only from the Layers row `src/editor/compose/LayerStack.jsx:64` | 05 §2 | nailed (gap: NEW) |
| 2 | Preview/work mode | no state; frame edge + ratio label unconditional `Canvas.jsx:85-99,131-152`; `showRulers` only `Shift+R` `src/editor/state/keymap.js:109` | 05 §6 | nailed (gap: NEW) |
| 3 | V / A on shapes | `A` guard `type === 'path'` `CanvasArea.jsx:1250-1254`, dbl-click :983-985 | 05 §3 | nailed |
| 4 | Pointer never changes | `CURSOR_FOR_TOOL` six CSS keywords `CanvasArea.jsx:26-33`; custom SVG dropped "Vite `?url` + browser SVG-cursor support is fragile" :20-25; `inherit !important` `src/editor/styles/kol-editor.css:114-116` | 05 §1 + §4 F6 | nailed |
| 5 | Pen pointer / close cue / colour | crosshair :31; first anchor filled accent is the only cue :1498-1507, 10px tested on mousedown only :349-354; `color:null, stroke:'palette:dark'` :264-275 beats paint pair `src/editor/compose/state.jsx:846` | 05 §4 | nailed |
| 6 | Expand shape | only `convertShapeToPath` via Parameters › Generate button `src/editor/compose/inspectors/ParametersPanel.jsx:92-98` while default subtab is Style :75; no toolbar/menu/context row `CanvasArea.jsx:1597-1644` (shot 22 confirms) | 05 §5, 04 c16 | nailed |
| 7 | New rect black stroke @ 0 | `paintStroke '#000000'` `state.jsx:581-582` spread by `paintExtras` :832-836; `strokeWidth` absent → 0 `src/editor/compose/LayerRenderer.jsx:1570`; swatch shows black because `showTransparent={!layer.stroke}` `src/editor/compose/inspectors/LayerInspector.jsx:254` | 03 §9, 06 §4 | nailed |
| 8 | Top bar name input | `Input variant="ghost" size="md" width="220px"` `src/editor/shell/MenuTop.jsx:212-222`; shot 21 puts the name in a status bar (NEW) | 01 §2 | nailed |
| 9 | Too many tool icons | 15 cells `src/editor/shell/panels/ToolPalette.jsx:65-90`; duplicates 01 §Contradictions 8; fold capability of the DS unread → T5 | 01 §3 | nailed; T5 for the fix class |
| 10 | Orbit = camera | `src/editor/state/tools.jsx:32`; `shape-torus` at `NM/kol-icons/src/kol-icon-set-signal/shape/shape-torus.svg`, resolvable (`NM/kol-icons/src/Icon.jsx:90-94` CUSTOM→V1→SIGNAL) | 01 §3, 08 §11 | nailed; T4 confirms cut |
| 11 | Rotate icons origin | kol-icons `tools/rotate-left.svg`, `rotate-right.svg` (DS) — shot 20 | 03 §1, 08 §11 | nailed |
| 12 | No eyedropper icon | mounted `src/editor/color/ColourPanel.jsx:113`; DS gate `'EyeDropper' in window` `NM/kol-component/src/molecules/SwatchControls.jsx:110,139-145`; **shot 15 is Firefox → no native API → hidden**, while the editor's sampler never needs it `src/editor/color/canvasEyedropper.js:6-13` | 02 §2.2 c10 + §4 F2 | nailed |
| 13 | Panels differ in width / rows / inputs | asides equal 320 `kol-editor.css:61` (shot 15: both 380 image px); rows differ: left `LabeledControl inline` 48px label + `w-24` field (`src/editor/color/StrokePanel.jsx:101-107`), right glyph-affordance property fields in `grid-cols-2` (`LayerInspector.jsx:222-244`); three row primitives tabled 10 §6 | 02, 03, 10 | nailed; T8 adds the gutter dimension |
| 14 | Opacity too wide, sentence case | **shot 18 = Colour pane**: `LabeledControl inline label="Opacity"` `ColourPanel.jsx:241` (no transform, `NM/kol-component/src/molecules/LabeledControl.jsx:82`) + `Slider` readout `Input chars={displayWidth}` default **6** `Slider.jsx:41,289`, no `displayWidth` passed :242; the Inspector twin is `w-full` in a 140px column `LayerInspector.jsx:226` + `NM/kol-component/src/atoms/Input.jsx:116` | 02 §2.2 (surface), critic §4 F5 (lever) | nailed |
| 15 | Fill/Stroke not clickable | `ColorSwatch hoverable={false}` no `onClick` → `<span aria-hidden>` `LayerInspector.jsx:250-258`; `NM/kol-component/src/molecules/ColorSwatch.jsx:87,142-147` | 03 §4 | nailed |
| 16 | "Colour…" | `Button tone="ghost" quiet size="xs"` (22px, kol-mono-8) `LayerInspector.jsx:256` → opens `PaletteModal` not `ColorModal` (`src/editor/color/PaletteModal.jsx:27,54`); spelling split 09 §1 | 03 §4, 09 §1 | nailed |
| 17 | Headings too big | `.kol-inspector-pane-title` mono 14/18 `NM/kol-theme/kol-components-molecules.css:1025-1033` vs eyebrow 12 / helper-10 elsewhere | 03 §1, 09 §2 | nailed |
| 18 | Gen/Style/Anim strip | `SegmentedToggle variant="filled"` no size → md 32 / mono-14 `ParametersPanel.jsx:84`, `NM/kol-component/src/atoms/SegmentedToggle.jsx:63-64` | 04 §1 | nailed |
| 19 | UI shifts on type/category | no min-height, picker rows 2–4, strip moves `ParametersPanel.jsx:150-155`, `src/editor/compose/inspectors/LoopPicker.jsx:62-96` | 04 §5 | nailed |
| 20 | Booleans in ⋯, trash in header | `SelectionPalettePanel.jsx:84-93,110-166` (shot 25); DS LayerStack footer API unread → T6 | 03 §7 | nailed; T6 for the fix class |
| 21 | Shape params offer nothing | `SHAPE_SCHEMA` `src/editor/params/schemas/shape.js:37-45` (rect/ellipse/triangle → Kind only, shot 19); `radius` only in Inspector `LayerInspector.jsx:193,232-244`; dropped on convert/bool `src/editor/compose/shape-math.js:71-79`, `boolean-ops.js:86` | 04 §2, 06 §3 | nailed |
| 22 | Parameters empty; distressor | labs-only fence `src/loops/taxonomy.js:19-33,48-53`; engine emits pixels `src/loops/distress/engine.js:236-244`; SVG door gated off `src/editor/labs/LabsView.jsx:76` | 07 §1–2 | nailed |
| 23 | Blend / smooth vector effects | `morphOutlines` on recorded canvas calls `src/editor/morph/shape.js:234-239`; no node-model flattener; `smoothNode` only `NM/kol-component/src/hooks/pathMath.js:205-225` | 07 §4, §6 | nailed |
| 24 | Effect slots | one "Add effect" button `src/editor/compose/inspectors/EffectsPanel.jsx:213-228` (ruling 2026-08-12 :82-85) | 04 §3 | nailed |
| 25 | One panel per effect type | Type → Category → Preset rows `EffectsPanel.jsx:231-244`; "Type" binds categories, "Category" binds filters :142-152 | 04 §3, c11 | nailed |
| 26 | Effects tab empty; Pattern in menu | `Hint` hidden by default (§4 F1); Pattern = six referents 07 §7; menu nest `MenuTop.jsx:289-314`; **per-host filtering** `MenuTop.jsx:99-103` + `src/editor/compose/inspectors/effectCategories.js:133-146` explains shot 24 (no CRT, no Lens/Distortion for a shape) | 04 §3b, 07 §7, critic F4 | nailed |

## 4. Facts established by the critic (not in any map)

| # | Fact | Where |
|---|---|---|
| F1 | Placeholders default **OFF**: `localStorage['kol-placeholders'] === 'on'` else false; attribute stamped only when on; so `Hint` (`kol-placeholder`) is `display:none` on a fresh profile. Editor toggle = `Shift+I` (`src/editor/state/keymap.js:108`, hidden) via `src/editor/state/useGlobalShortcuts.js:30,45` | `NM/kol-component/src/hooks/usePlaceholders.js:26-27,37-42,61-66`; `NM/kol-theme/kol-utilities.css:111-113`; `src/editor/components/Hint.jsx:37` |
| F2 | The pipette is mounted (`<EyedropPick sampleColor onPick>`); hidden purely by the DS's `useEyeDropperSupported` (`'EyeDropper' in window`, resolved after mount). Shot 15's browser chrome is Firefox → never shows there; Chromium shows it | `src/editor/color/ColourPanel.jsx:113`; `NM/kol-component/src/molecules/SwatchControls.jsx:105-122,139-145` |
| F3 | Colour/Stroke target per state: binds `selectedId` only (multi → first id); `'canvas'` → fill writes `setCanvasFill`, stroke app-level only; `COLOR_LAYER_TYPES` layer → both write the layer; photo/loop/misc/kinetic/group → app-level paint only (silent); **no `locked` check** on either write | `src/editor/color/useColorTarget.js:68-70,86-97` |
| F4 | Effects offered per host: `effectHost` — effectable = photo · shape/text/pattern/path · non-engine loop/misc; `engineHost` = photo or non-engine loop/misc; top-bar `fxOptions` filters by `fxEngineHost` so a shape sees canvas/pixi tiers only (shot 24: Refraction without Lens/Distortion, no CRT) | `src/editor/compose/inspectors/effectCategories.js:122-146`; `src/editor/shell/MenuTop.jsx:99-103` |
| F5 | DS `Slider` exposes `displayWidth` (chars, default 6) and `readout` `'input'|'value'|'none'`; the Colour pane passes neither, so "100" sits in a 6-char box | `NM/kol-component/src/molecules/Slider.jsx:41,45,72,283-297`; `src/editor/color/ColourPanel.jsx:242` |
| F6 | Verbatim reason for keyword cursors: "Custom SVG cursors were attempted but Vite's `?url` + browser SVG-cursor support is fragile across environments" | `src/editor/compose/CanvasArea.jsx:20-25` |
| F7 | The Inspector's Opacity/Corner-radius have **no visible label** by rule ("the glyph + tooltip name the field (pane rule)"); Map 09 §3's "Opacity:224 Title Case" is the `Tooltip label` | `src/editor/compose/inspectors/LayerInspector.jsx:223-224` |
| F8 | Right-rail scroll chain: `.kol-editor-rail-body` (overflow auto, gutter stable) › `.kol-compose-rail` forced `height:auto` with no `min-height:0`/flex-grow › `div.flex-1.min-h-0.overflow-y-auto.[scrollbar-gutter:stable]` › `.kol-compose-rail--inspector` (`flex:1 1 auto; min-height:0`) › `.kol-compose-inspector-body` (`flex:1; overflow-y:auto; scrollbar-gutter:stable`). Because the second box never clamps, the OUTER rail-body is the scroller and the tab row scrolls away — contradicting the comment "this is the rail's REAL scroller (the panel bodies are height-clamped, not the outer rail-body)". Three nested gutters under classic scrollbars. Inference from CSS; confirm in the browser (T8) | `src/editor/styles/kol-editor.css:152-172,233-237,367-379`; `src/editor/shell/panels/SelectionPalettePanel.jsx:70,95`; `src/editor/compose/inspectors/ParametersPanel.jsx:60-62` |
| F9 | DS exports `EditorShell` (index.js:154) whose header note says it "needs resizable rails" and uses `useDragResize` (index.js:257-259); `src/` never imports it (grep `utilities/EditorShell` → 0); kol-theme defines no `--kol-editor-*` token (grep 0), so its `var(--kol-editor-right-w, 320px)` fallback is the only width | `NM/kol-component/src/index.js:154,257-259`; `NM/kol-component/src/utilities/EditorShell.jsx:60,78,160` |
| F10 | `--kol-sidenav-w: 264px` (:46) → 320 at ≥1536 (:298); `--kol-rail-w: 256px` (:901), `--kol-rail-w-collapsed: 56px` (:905); live drag writes `--kol-sidenav-w` (:292); `src/index.css:33` imports the file → Map 10's "defined nowhere" is a grep over the wrong directories | `NM/kol-framework/kol-framework.css:46,292,298,901,905`; `src/index.css:33` |
| F11 | Shot 21 (Affinity): rows `X:`/`Y:`/`W:`/`H:`/`R:`/`S:` label-left in a 2×3 grid, every field with a `px`/`°` unit, a 9-point anchor selector, a lock chip, tabs `Transform · Navigator · History` with a collapse chevron, status bar `<Untitled> @ 130%`. In src: no anchor field (06 §5), `boxFromAnchor` is create-time only (`src/editor/compose/state.jsx:310,436,1556,1658`), no shear/skew, no navigator/minimap, no history list, no status bar (grep §1 row 1). DS: none of these components (index.js grep) | `.kol/llm-plan/22-assets/21-REFERENCE-affinity-transform-panel.png`; `NM/kol-component/src/index.js` |
| F12 | Shot 15 geometry at scale 1.1875 (380 image px per 320 css rail): NavRail closed 48, both editor rails 320, content inset 16 both sides, no visible gutter (macOS overlay scrollbars), window ≈ 1684 css px (≥1536 → open NavRail would be 320) | shot 15; `kol-editor.css:61`; `kol-framework.css:298` |
| F13 | DS organisms folder also holds a `TimelineDock.jsx` while the editor renders its own `src/editor/params/TimelineDock.jsx` (01 §5 "returned to the app 2026-10-08") — two docks exist | `ls NM/kol-component/src/organisms` |

## 5. Map-vs-map contradictions

| # | Topic | Side A | Side B | Resolution |
|---|---|---|---|---|
| 1 | `--kol-sidenav-w` / `--kol-rail-w` existence | 01 §8, 02 §0, 08 §9: `kol-framework.css:46,298,901,905` | 10 c17, c18, OQ1: "defined by no installed CSS/JS" | **A is right** (F10); 10 grepped kol-theme/kol-framework/src/kol-shell/src only |
| 2 | DS `EditorShell` as the rail-width source | 03 §1 "DS rail fallback … railWidth = 320" | 01 §0 mount tree: `src/editor/EditorShell.jsx` only | both true of different files; the DS one is unused (F9) → T3 decides adopt/NEW |
| 3 | AddLayerButton rung | 01 OQ "not read" | 02 §3.1: `Button tone="primary" size="sm" quiet iconOnly="plus"` 26px | B resolves A |
| 4 | ColorModal inline vs overlay | 01 OQ | 02 §2: inline, `style={{height:320}}` in `left.body` | B resolves A |
| 5 | `kol:open-params/effects/pattern` listeners | 05 OQ "outside this area" | 04 §0: `SelectionPalettePanel.jsx:55-67` | B resolves A |
| 6 | Inspector Opacity label | 09 §3 counts "Opacity:224" as a Title-Case label | 03 §4: unlabeled, glyph + tooltip | B is right (F7); 09's row is the tooltip string |
| 7 | Compose registry line for `right.body` | 01 §0: `Compose.jsx:32` | 03 §1, 04: `:33` | trivial; 01 lists `:33` as the dock |
| 8 | What "Pattern" is | 04 §3b (menu: filter + four generator buckets) | 07 §7 (six referents) | not a contradiction — 07 supersets 04 |
| 9 | Which rail scrolls | 02 §0: rail-body scrolls, inner never engages (left) | kol-editor.css:370-373 comment: inspector body is "the REAL scroller" (right) | code says 02's reading applies to the right rail too (F8); browser-confirm in T8 |
| 10 | Opacity "too wide" surface | 03 §4 / 10 §4 discuss the Inspector `w-full` field | 02 §2.2 discusses the Colour-pane readout | shot 18 = Colour pane (F5); both are findings, 14 is the Colour one |

## 6. Claims with a missing or misleading cite

| Map | Claim | Problem |
|---|---|---|
| 03 §1 | "DS rail fallback `var(--kol-editor-right-w, 320px)`" cited as if governing the editor | the DS `EditorShell` is not mounted (F9); the governing line is `kol-editor.css:61` |
| 03 §1, §3 | 140px / ≈123px column widths | derived, not read (288 − 8)/2 and (288 − 26 − 16)/2 — fine, but the grade should measure, not cite |
| 09 §3 | Inspector `Opacity:224`, `Rotation:71` as Title-Case labels | tooltips/aria, not rendered labels (F7); the Inspector has no row labels except `Children`, `Source`, `Background` |
| 10 c17/c18, OQ1 | tokens "defined nowhere" | wrong (F10) |
| 10 c16 | "touch rail is a full-width sheet since 2026-10-05" | cites `kol-labs.css:165-175` for a date — the date is a comment claim, acceptable |
| 02 §2.2 | "Readout width = hug … px depends on mono glyph width" | correct but misses the lever: `displayWidth` (F5) |
| 11 §1 risks | "Safari behaviour unverified" etc. | reasoning, flagged as such — fine |
| 05 §1 | "Hover highlight — none" | grep-based; the grade's "canvas-edge hover" row should re-check `LayerRenderer.jsx` `:hover` CSS, none found in `kol-editor.css:114-116` either |

## 7. Grader traps (browser and profile dependent)

| Trap | Effect on the grade | Where |
|---|---|---|
| Firefox (user) vs Chromium (grader) | item 12 reproduces only without `window.EyeDropper`; in Chromium the 24px pipette appears | F2 |
| Overlay (macOS) vs classic (Linux) scrollbars | right rail content narrows by up to 3 gutters in Chromium on Linux; left by 1; the user never sees any | F8, F12 |
| `localStorage['kol-placeholders']` | with it `on`, every Hint renders and the "empty pane" findings vanish; fresh profile = off | F1 |
| `localStorage['kol-fxr:dock-h']`, `['kol-rail']`, `data-rail="collapsed"` left by labs | dock height and footer collapse differ by profile | 01 §5, c5 |
| Window ≥1536 | NavRail open width 320 = rail width; below, 264 | F10, F12 |
| `Shift+R` rulers off, `G` grid on | ruler 18px shifts the stage; grid changes the canvas look | 05 §6 |

## 8. Follow-up read tasks (highest value first)

| # | Task (output map) | Files | Question |
|---|---|---|---|
| T1 | 13-per-state-binding.md | `src/editor/shell/panels/SelectionPalettePanel.jsx:25-67`; `src/editor/compose/inspectors/ParametersPanel.jsx:30-58`; `src/editor/compose/inspectors/EffectsPanel.jsx:30-50,115-160`; `src/editor/shell/panels/ToolPalette.jsx:30-105`; `src/editor/color/StrokePanel.jsx:60-95`; `src/editor/compose/inspectors/effectCategories.js:120-155`; `src/editor/compose/state.jsx:595-643` | For each state (nothing · canvas · rect · ellipse/polygon/star/triangle · path · text · photo · loop · group · bool · locked · multi): which id each pane binds to (`selectedId` vs `selectedIds`, deep lookup, `'canvas'` miss), what renders / is disabled / silently no-ops, which filter tiers the Effects tab offers (engine vs canvas vs pixi), which toolbar cells `canXform`/`canBool`/crop/duplicate enable, and what the tab row shows (`canDelete`, ⋯ rows). One table state × {I, P, E, Stroke, Toolbar, tab-row} |
| T2 | 14-field-widths.md | `NM/kol-component/src/atoms/Input.jsx:30-60,150-230`; `NM/kol-component/src/molecules/Slider.jsx:30-80,255-330`; `NM/kol-component/src/molecules/PropertyInput.jsx`; `NM/kol-component/src/molecules/Stepper.jsx:1-60`; `NM/kol-theme/kol-components-atoms.css:50-70,130-150`; `src/editor/params/AutoControls.jsx:180-200`; the rail number fields listed in 10 §4 | What sets the rendered box width for each rail number field (`chars`→HTML `size`, `width`, `variant="property"` `calc(len ch + 2px)` in a `w-full` shell, Slider `displayWidth`), which widths are hard-coded px (`w-24`, `w-[110px]`), whether `PropertyInput`/`Stepper` are the DS's numeric-row primitive and what width rule they use; propose the one `chars = digits + unit` rule and the DS prop per field; note which need a DS change (→ plan 17) |
| T3 | 15-ds-editor-shell.md | `NM/kol-component/src/utilities/EditorShell.jsx` (181 lines); `NM/kol-component/src/hooks/useDragResize.js:1-120`; `NM/kol-component/src/index.js:150-160,250-262`; `src/editor/EditorShell.jsx:40-130` | What the DS EditorShell provides (slots, `--kol-editor-left-w/right-w` tokens, resize/collapse via useDragResize, min/max/snap, persistence key, header/footer/status slots) vs the local `src/editor/EditorShell.jsx`; whether rule 1 (frame) can cite "adopt DS EditorShell" or must be NEW; what the resize/collapse contract would be |
| T4 | 16-toolbar-icons.md | `NM/kol-icons/src/cuts.json`; the SVGs under `NM/kol-icons/src/kol-icon-set-interface/` and `kol-icon-set-signal/shape/` for: pointer, type, pen, pen-nib, rectangle, circle, triangle, line, polygon, star, pattern-tool, search, maximize, camera, shape-torus, shape-sphere, flip-horizontal, flip-vertical, rotate-left, rotate-right, boolean-unite/subtract/intersect/exclude, image, crop, copy, plus, more, trash, eye-on, eye-off, lock, unlock, eyedrop, swap, opacity, corner-radius, angle, settings-01, nav-settings, target, drag-handle, space-evenly-horizontal; `NM/kol-icons/src/Icon.jsx:85-125` | Per glyph: path, `stroke|solid` cut, `stroke-width`, viewBox; which toolbar groups mix cuts; which candidates exist for node-select, hand, zoom, orbit; confirm signal-set names resolve in the editor and at what size the `Icon` rewrites `width/height` |
| T5 | 17-tool-fold.md | `NM/kol-component/src/molecules/SplitToolButton.jsx` (169 lines); `NM/kol-component/src/organisms/ToolPalette.jsx:1-80`; `src/editor/shell/panels/ToolPalette.jsx:1-65` | Does a fold's trigger show the last-picked variant's icon or a fixed one; can a fold mix `tool` and `action` items (pen + node-select, zoom + orbit, rotate + flip); is there an `activeWhen`/`pressed` seam; what the `fold-indicator` and row anatomy are; does DS ToolPalette accept `size="sm"`; keyboard access to fold rows. Needed for rule 9 to say DS-delivered vs NEW |
| T6 | 18-layers-footer.md | `NM/kol-component/src/organisms/LayerStack.jsx:380-509`; `src/editor/compose/LayerStack.jsx` (whole); `src/editor/shell/panels/LayersAssetsPanel.jsx` | Does DS LayerStack expose a footer/actions slot or `onDelete`/`onDuplicate` props so delete/duplicate/group can sit below the layers (Figma/Affinity); AddLayerButton's API; what the ≥2-selected Group footer is built from (`:423-436`); what moving ⋯/trash out of the right-rail tab row would need (DS prop vs NEW) |
| T7 | 19-empty-state.md | `NM/kol-component/src/molecules/EmptyState.jsx` (34 lines); `src/editor/components/Hint.jsx:1-40`; grep `usePlaceholders|placeholders|toggle-hints` in `src/settings`, `src/AppLayout.jsx`, `src/editor/shell/ShortcutsOverlay.jsx`, `NM/kol-shell/src/SettingsShortcuts.jsx` | DS EmptyState anatomy and props (`eyebrow/title/body/action/gated`), its classes; whether any settings row or visible shortcut exposes the placeholder switch besides hidden `Shift+I`; which of the 12 ungated sentences (09 §6) should be `EmptyState gated` vs status text; so rule 3 can state the empty-state anatomy and its gate |
| T8 | 20-rail-scroll.md | `src/editor/styles/kol-editor.css:140-180,230-237,360-380`; `src/editor/EditorShell.jsx:60-90`; `src/editor/shell/panels/SelectionPalettePanel.jsx:68-100`; `src/editor/shell/panels/LayersAssetsPanel.jsx:15-30`; `src/editor/color/ColorModal.jsx:25-40`; `src/editor/compose/inspectors/ParametersPanel.jsx:58-68`; `src/editor/compose/InspectorRail.jsx:15-25` | Per rail: which box is the scroller when content overflows, whether the tab row / header stays pinned, how many nested `overflow:auto` + `scrollbar-gutter: stable` boxes exist and the resulting content width under classic (15px) vs overlay scrollbars; whether the fixed `height:320` ColorModal + `min-h-[240px]` LayerStack push the footer; state the pane scroll rule and flag what the browser step must confirm |

## Open questions

- Which `TimelineDock` is canonical — `NM/kol-component/src/organisms/TimelineDock.jsx` or `src/editor/params/TimelineDock.jsx` (F13)?
- Is the ⋯/trash tab-row placement a ruling (`SelectionPalettePanel.jsx:71-73` cites 2026-09-27 for removing the header, not for the icons)?
- The Affinity status bar `<Untitled> @ 130%` — is the user's item 8 asking for the name to move there (NEW status bar) or to a document-title/menu? The shot suggests the former; the plan text does not say.
- Whether `Slider displayWidth` is the intended consumer lever or a Knob-era leftover (its doc at Slider.jsx:39-41 mentions Knob) — T2.
- Mesh Gradient / FX rack empty nests in the Effects menu (07 c2, 04 c12) — known or not; neither is in the 26 items but both appear in shot 24's menu.
