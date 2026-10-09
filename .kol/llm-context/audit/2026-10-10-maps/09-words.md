# 09 — Words: what the editor says to the user

Scope: `src/editor`, `src/settings`, `src/pages`, `src/AppLayout.jsx`, `src/App.jsx`. KOL sources under `node_modules/@kolkrabbi/`. Every line number was read from the file.

## 0. Casing mechanisms (who decides how a word is cased)

| Element | Source | Rendered class | Transform |
|---|---|---|---|
| `.kol-helper-10/12/14` | kol-theme/kol-type-mono-classes.css:106–128 | mono 10/12/14, w500, tracked | **none** — casing is the string's |
| `.kol-mono-10/12/16` | kol-theme/kol-type-mono-classes.css:27–52 | mono, w400 | none |
| `.kol-eyebrow` | kol-theme/kol-type-roles.css:285–292 | mono 12 w500 0.06em | `text-transform: uppercase` (:291) |
| `.kol-inspector-pane-title` | kol-theme/kol-components-molecules.css:1025–1033 | mono 14/18 w400 fg-emphasis | none; not a helper rung |
| `InspectorSection pane` → `<h3 class="kol-inspector-pane-title">` | kol-component/src/molecules/InspectorSection.jsx:38 | see above | none |
| `InspectorSection` / `Section` (non-pane) label | kol-component/src/molecules/InspectorSection.jsx:53 | `kol-helper-10 tracking-widest text-meta` | none |
| `LabeledControlSection` label | kol-component/src/organisms/SettingsPanel.jsx:158 | `kol-eyebrow text-fg-80` | CSS uppercase |
| `LabeledControl` label (stacked / inline) | kol-component/src/molecules/LabeledControl.jsx:96 / :82 | `kol-helper-10 tracking-widest text-meta` | none |
| `LabeledControl variant="panel"` | LabeledControl.jsx:47 | `kol-helper-8` | inline `textTransform:'uppercase'` |
| `SettingsRow` label | kol-component/src/organisms/SettingsPanel.jsx:122 | → LabeledControl inline | **JS `label.toUpperCase()`** |
| `SettingsPanel` title | SettingsPanel.jsx:65 | `kol-helper-14 uppercase text-emphasis` | Tailwind `uppercase` |
| `PanelHeader` title (labs/mobile sheet) | src/editor/components/PanelHeader.jsx:24 | `kol-helper-12 text-meta` | none |
| `TabsRow` tab labels | kol-component/src/molecules/TabsRow.jsx:57 | `kol-mono-12` | none |
| `EmptyState` eyebrow / title / body | kol-component/src/molecules/EmptyState.jsx:28–30 | `kol-helper-10` / `kol-mono-16` / `kol-sans-body-03` | none |
| Shortcuts overlay section | kol-shell/src/SettingsShortcuts.jsx:47 | `kol-eyebrow text-strong` | CSS uppercase |
| `Hint` (gated prose) | src/editor/components/Hint.jsx:36–37 | `kol-placeholder kol-mono-12 text-meta` | none |
| AutoControls row (editor skin, `inline=false`) | src/editor/params/AutoControls.jsx:226,234,278,292,303,330–332 | `rowInline` always false → `LabeledControl` with `p.label` as authored | none |
| AutoControls row (labs skin, `inline=true`) | AutoControls.jsx:331 / :332 | `SettingsRow` (JS upper) or `String(p.label).toUpperCase()` | **all UPPERCASE** |
| AutoControls schema `section` | AutoControls.jsx:100–102 | `LabeledControlSection` → `kol-eyebrow` | CSS uppercase |
| `ColorField inline` label | src/editor/compose/inspectors/ColorField.jsx:114 | `kol-eyebrow text-meta` | CSS uppercase |
| `DsToolPalette` item `label` | kol-component/src/organisms/ToolPalette.jsx:62–65 | `Tooltip label` + `aria-label` | none |

No `uppercase` Tailwind class, `textTransform`, or `kol-eyebrow`-via-prop appears in the editor's own label strings except the sites listed in §3.

## 1. "Colour" vs "Color" in user-facing text

| Spelling | String | path:line | Surface |
|---|---|---|---|
| **Colour** | `Colour…` (Button, size xs) | src/editor/compose/inspectors/LayerInspector.jsx:256 | Inspector › Fill/Stroke row |
| **Colour** | `Text colour` (ColorField label) | src/editor/compose/inspectors/KineticPanel.jsx:271 | Kinetic panel |
| **colour** | `Eyedropper — sample a colour from the canvas` | src/editor/state/keymap.js:107 | Shortcuts overlay |
| Color | tab label (`id: 'Colour'` → `label: 'Color'`) | src/editor/color/ColorModal.jsx:16 | Color modal tabs Stroke · Color · Swatches |
| Color | `Color` MenuDropdownItem | src/editor/shell/MenuTop.jsx:319 | Tools menu |
| Color | `label="Color"` | src/editor/compose/inspectors/PatternPanel.jsx:173 | Pattern tab |
| Color | default `label = 'Color'` | src/editor/compose/inspectors/ColorField.jsx:23 | ColorField |
| Color | `Color` Button (roll) | src/editor/compose/inspectors/SoftformsLayers.jsx:285 | Softforms › Randomise forms |
| Color | scope label `'Color'` ("the ruling (2026-09-30)") | src/editor/params/rolls.jsx:36 | Randomize scope strips |
| Color | `section: 'Color'` × 2; labels `Tile bg`, `Tile bg color` | src/editor/params/schemas/pattern.js:23–24 | Pattern params |
| Color | `tab:'color'` → section `'Color'` | src/editor/params/schema.js:51 | labs dialect |
| Color | `section: 'Color'` × 6 | src/editor/state/keymap.js:73–77,107 | Shortcuts overlay heading |
| colors | `Swap fill and stroke colors` | src/editor/state/keymap.js:75 | Shortcuts overlay |
| Color | `Color Sweep` (id `colour-sweep`) | src/editor/params/motionPresets.js:58 | Motion presets |
| Color | `Color Adjustments` | src/editor/compose/inspectors/effectCategories.js:32 | Effects menu/panel |
| Color | tab `'Color'` | src/editor/modes/pattern/ColorPicker.jsx:20 | Pattern mode |
| color | `Seed color` | src/editor/modes/palette/pools.js:53 | Palette modal |

Tally: Colour 3 · Color 14+. Comments at LayerInspector.jsx:148,247 and ColorModal.jsx:15 still say "Colour"; the tab id stays `Colour` (ColorModal.jsx:16,18,36).

## 2. Section headings in the rails

| Heading string | path:line | Component | Rendered class |
|---|---|---|---|
| Transform | src/editor/compose/inspectors/LayerInspector.jsx:55 | InspectorSection pane | `.kol-inspector-pane-title` |
| Preset | LayerInspector.jsx:118 | pane | same |
| Image | LayerInspector.jsx:140 | pane | same |
| Path | LayerInspector.jsx:152 | pane | same |
| Group | LayerInspector.jsx:166 | pane | same |
| Appearance | LayerInspector.jsx:202 | pane (+ actions Hide layer / Blend) | same |
| Parameters | LayerInspector.jsx:285 | pane | same |
| Frame | src/editor/compose/inspectors/CanvasInspector.jsx:43 | pane | same |
| Background | CanvasInspector.jsx:65 | pane | same |
| Typography | src/editor/compose/inspectors/TextPanel.jsx:145 | pane (+ "Type settings" trigger :138) | same |
| (none) `{n} layers selected.` | src/editor/compose/InspectorRail.jsx:31–32 | pane, no label | `kol-mono-12 text-meta` |
| Aspect / Export | src/editor/shell/panels/EditorFooter.jsx:299 / :302 | LabeledControlSection | `kol-eyebrow text-fg-80` |
| Canvas | src/editor/EditorShell.jsx:38 | LabeledControlSection | same |
| Display / Defaults / Transport | src/settings/AppSettings.jsx:56 / :71 / :119 (→ :179) | LabeledControlSection | same |
| Effect Stack / Post-Processing | src/editor/labs/LabsParams.jsx:196 / :342 | LabeledControlSection | same |
| Step N | src/editor/morph/MorphTab.jsx:185 | LabeledControlSection | same |
| Geometry · Font · Layout · Video · Camera · Grid · Tile · Color | schemas/shape.js:41–44, text.js:19–29, photo.js:23–35, pattern.js:16–24 → AutoControls.jsx:100–102 | LabeledControlSection | same |
| N · Offset · Row N · Row offset · Expression · Group W · Group H · Opacity | src/editor/modes/pattern/RuleRow.jsx:147,150,158,161,168,181,184,208 | `Section` (non-pane) | `kol-helper-10 tracking-widest text-meta` |
| Fill / Stroke | LayerInspector.jsx:253 / :255 | bare `<span>` | `kol-helper-10 text-meta` |
| Elements / OpenType / `{k.section}` / Motion layers | src/editor/compose/inspectors/KineticPanel.jsx:229 / :309 / :317 / :499 | bare span | `kol-helper-10 text-meta` |
| Motion | src/editor/compose/inspectors/LoopFields.jsx:346; EffectsPanel.jsx:412 | bare span | `kol-helper-10 text-meta` |
| Modulation | src/editor/params/ModulationEditor.jsx:279 | bare span | `kol-helper-10 text-meta` |
| Explore | src/editor/compose/inspectors/ParatypeTools.jsx:67 | bare span | `kol-helper-10 text-meta` |
| Randomise forms | SoftformsLayers.jsx:283 | bare span | `kol-helper-10 text-meta` |
| Camera / Audio | CameraPoseSlots.jsx:44 / src/editor/params/AudioInputRow.jsx:60 | bare span | `kol-helper-10 text-meta` |
| Aspects / Scale | src/editor/shell/panels/BatchExportModal.jsx:81 / :96 | bare span | `kol-helper-10 text-meta` |
| Morph | TextPanel.jsx:334, :345 | bare span | `kol-eyebrow text-meta` |
| Images / Logos | src/editor/compose/AssetsBody.jsx:41 / :76 | bare `<p>` | `kol-eyebrow text-meta` |
| Swatches / BG | src/editor/color/PaletteModal.jsx:173 / :175 | bare span | `kol-eyebrow text-meta` |
| Palette | PaletteModal.jsx:138 | bare span | `kol-helper-12 text-emphasis` |
| Randomize all rolls / Batch export | src/editor/params/RollScopesDialog.jsx:24 / BatchExportModal.jsx:76 | bare `<p>` | `kol-eyebrow text-fg-96` |
| labs sheet title (`Morph` · `Labs` · `Group · Preset` · fx label · `Media`) | src/editor/labs/sheetLabels.js:8–18 → LabsView.jsx:270 | PanelHeader | `kol-helper-12 text-meta` |
| labs rail title | LabsParams.jsx:112 | bare `<p>` | `kol-eyebrow text-fg-96` |
| Generative sub-group `{p.sub}` | src/editor/shell/MenuTop.jsx:137 | menu divider row | `kol-helper-10 text-subtle` |
| Display settings (drawer) | AppSettings.jsx:224 | SettingsPanel title | `kol-helper-14 uppercase` |
| Shortcut sections Edit · Selection · Layer · Tools · View · Color · Labs | keymap.js:31–122 | SettingsShortcuts | `kol-eyebrow text-strong` |

Tab strips (all `kol-mono-12` via TabsRow unless noted): Layers · Assets (LayersAssetsPanel.jsx:6); Inspector · Parameters · Effects [· Pattern] (SelectionPalettePanel.jsx:12, :41); Generate · Style · Animation (ParametersPanel.jsx:46–48; LabsParams.jsx:54–56); Gen · Style · Anim (LabsParams.jsx:62–64); Effect · Motion (EffectsPanel.jsx:43–44; LabsParams.jsx:48–49); Transport · Output · File (EditorFooter.jsx:33–35); Generate · Effects · Transport · Output [· Morph] (MobileOverlay.jsx:48–51, :262); Stroke · Color · Swatches (ColorModal.jsx:16).

Four heading rungs coexist in one rail: pane-title 14/400 (Inspector), `kol-eyebrow` 12/500 UPPER (footer, settings, labs, schema sections), `kol-helper-10` tracked (hand-written sub-heads, RuleRow), `kol-helper-12` (sheet header, Palette).

## 3. Label casing per rail

| Rail / file | Mechanism | Sentence case | Title Case | UPPERCASE | lowercase | Examples |
|---|---|---|---|---|---|---|
| Inspector — LayerInspector.jsx | pane titles + LabeledControl (no transform) | 3 (`Corner radius`:233, `Clear image`:386, `Hide layer`:205) | 11 single-word (Transform, Rotation:71, Opacity:224, Source:344, Children:300…) | abbreviations X Y W H (:429–430,:488–489); Fill/Stroke are string-case | — | pane titles read as Title because single words |
| Inspector — TextPanel.jsx | LabeledControl | `Line height`:173, `Letter spacing`:179, `Size presets`:275, `Lock width`:406, `Lock weight`:414, `Type settings`:138, `Style B`:367 | Case:216, Italic:223, Mode:354, Curve:383 | `Morph` via kol-eyebrow :334/:345; `{p.label}` via kol-eyebrow :443 | `animated` :243/:444 | mixed in one pane |
| Inspector — CanvasInspector.jsx | pane + LabeledControl | `Fill opacity`:74 | Frame, Background, Grid:62, Infinite:88 | W/H :57–58 | — | |
| Parameters — schemas/*.js via AutoControls (editor) | LabeledControl, authored case | `Inner ratio` shape.js:43, `Morph blend` text.js:29, `Trim in/out` photo.js:27–28, `Custom SVG` pattern.js:14, `Tile size`:22, `Tile bg`:23, `Tile bg color`:24 | Kind, Variant, Fit, Sides, Points, Slope, Content, Cut, Weight, Case, Italic, Align, Size, Tracking, Leading, Speed, Loop, Muted, Mirror, Shape, Cols, Rows, Gap, Padding, Stretch, Overflow | section eyebrows Geometry/Font/Layout/Video/Camera/Grid/Tile/Color (CSS) | — | 7 sentence vs 27 single-word |
| Parameters — same schemas in labs (`inline`) | SettingsRow / `.toUpperCase()` AutoControls.jsx:331–332 | 0 | 0 | **all** | — | "INNER RATIO", "TILE BG COLOR" |
| Parameters — ParametersPanel.jsx | LabeledControl | `Apply saved pattern`:203, `Apply saved spec`:279, `Convert to path`:93 | Flatten:216 | — | `— pick spec`:172, `— free-form`:252 | |
| Parameters — LoopFields.jsx / LoopPicker.jsx | LabeledControl + bare spans | `Randomize all`:270, `Randomize preset`:260 | Look:195/:210, Theme:219, Invert:222, Background:226, Frame:347, Form:355, Wild:294, Fit:331, Reset:334; Type/Category/Preset LoopPicker.jsx:63/:91/:99 | — | — | `Motion` sub-head :346 helper-10 |
| Parameters — KineticPanel.jsx | LabeledControl + bare spans | `Morph blend`:58, `Text colour`:271, `Edit on canvas`:234, `Add element`:439, `All elements`:280 | Text:246, Theme:254, Invert:262, Randomise:278, Group:431, Ungroup:434 | — | `grp {tag}`:413, `animated`:659 | sub-heads `Elements`:229 `OpenType`:309 `Motion layers`:499 |
| Parameters — SoftformsLayers.jsx | LabeledControl + bare | `Position X`:48, `Scale X`:50, `Add form`, `Edit forms on canvas`:253, `Randomise forms`:283 | Teardrop…Capsule:33–43, Rotation, Hue, Type:264, Color/Transform/Scale/Animation/Rearrange:285–290 | — | — | |
| Effects — EffectsPanel.jsx | LabeledControl + bare | `Camera drag`:251, `Add effect`:225, `Add motion…`:414, `Add custom sweep`, `Speed · cycles`:458, `Randomize motion`/`all`:334, `Remove sweep`:449 | Effect/Motion:43–44, None:147, Type:233, Category:234, Preset:237, Amount:456, Width:459, Angle:461 | `{label}` :403 is `kol-helper-10 tracking-widest` (no transform) | — | `Filters don't apply to cropped photos.` :247 helper-12 |
| Pattern tab — PatternPanel.jsx / RulesEditor.jsx | LabeledControl / Section | `Randomize all`:138, `Add rule`:163, `Save pattern to library`:182, `Rules · N`:151 | Columns:38, Rows:39, Bg:40, Color:173, Randomize:166 | — | — | |
| Pattern mode — RuleRow.jsx | `Section` → helper-10 | `Row N`:158, `Row offset`:161, `Group W`:181, `Group H`:184, `All cells`:20, `Every Nth col`:21, `Nth col × Nth row`:23 | N:147, Offset:150, Expression:168, Opacity:208, Checker:25 | — | hint `matches when > 0`:168, `vars: i, col, row…`:176 | |
| Color modal — ColourPanel/StrokePanel/SwatchesPanel | LabeledControl inline | — | Hue/Wheel/Sliders ColourPanel.jsx:16–18, Opacity:241, Weight StrokePanel.jsx:101, Style:112, Cap:113, Join:114, Butt/Round/Square/Miter/Bevel:51–58, Standard SwatchesPanel.jsx:38 | R G B H S L HSL RGB ColourPanel.jsx:177–197, AC SwatchesPanel.jsx:37 | — | tab labels Stroke/Color/Swatches ColorModal.jsx:16 |
| Palette modal — PaletteModal.jsx | LabeledControl + bare | `Save palette to library`:215 | Harmony:150, Pool:163, Mode:166, Layout:201, Randomize:208, Reset:211, Off/On:178 | Swatches/BG via kol-eyebrow :173/:175 | — | `Palette` helper-12 :138 |
| Modulation — ModulationEditor.jsx / BindDot.jsx / TimelineDock.jsx | LabeledControl + bare | `Rate · cycles` ModulationEditor.jsx:218, `Move a knob…`:250, `Time / loop length` TimelineDock.jsx:109, `Delete key`:409, `Sync loop — …`:122 | Range:186, Invert:202, Smooth:209, Curve:213, Phase:221, Expression:228, Learn:250, Custom:370, Close:412 | — | `to`:193, `key @ … s`:387 | sub-head `Modulation` :279 |
| Footer — EditorFooter.jsx | LabeledControlSection + Buttons | `Upload image`:136, `Upload video`:139, `From library`:142, `Clear image`:149, `Save to file`:175, `Load from file`:178, `Export PNG`:310, `Export loop (webm)`:313, `Stop recording`/`Record`:319, `Open output window`:324, `Batch export`:329 | Transport/Output/File:33–35, Webcam:145 | Aspect/Export eyebrows :299/:302 (CSS) | — | |
| Display settings — AppSettings.jsx / EditorShell.jsx | SettingsRow (JS upper) | authored sentence: `Default aspect`:74, `Loop theme`:89, `Clip to frame`:103, `Modulation dots`:113, `Loop length`:132, `Dark mode`:157, `Show grid` EditorShell.jsx:39 | Theme:60, Autoplay:122 | **rendered UPPER** (SettingsPanel.jsx:122); sections Display/Defaults/Transport UPPER (CSS) | — | |
| Labs — LabsParams.jsx / LabsSourcePicker.jsx | SettingsRow + eyebrows | `Add effect…`:186, `Add FX...`:338, `Remove effect`:316, `From library` LabsSourcePicker.jsx:141, `Pick the media it works on.`:160 | Effect Stack:196, Post-Processing:342, Gen/Style/Anim:62–64, Library/Upload/Camera:125–127, Catalog LabsView.jsx:269 | rows UPPER (AutoControls.jsx:331–332); titles UPPER (CSS :112) | — | |
| Mobile — MobileOverlay.jsx / MobileView.jsx / CategoryScreen.jsx / EffectScreen.jsx | Buttons + PanelHeader | `Randomize all`:347, `Hide UI`:436, `Start over`:437, `Add effect`, `Insert image or video` CategoryScreen.jsx:66, `Pick a generator`:45, `Pick an effect` EffectScreen.jsx:37, `Select chrome` MobileView.jsx:53 | Preset:342, Generator:343, Randomize:375, Download:435, Generate/Effects MobileView.jsx:60–61, Morph:74, Back:309 | eyebrows `Pick a generator`/`Pick an effect`/`Select chrome` via kol-eyebrow | — | |
| Toolbar — tools.jsx / ToolPalette.jsx | Tooltip + aria | `Subtract front`:21, `Kinetic type`:70, `Flip horizontal`:80, `Flip vertical`:81, `Rotate 90° left/right`:82–83, `Insert image`:87, `Crop image`:88 | Select…Orbit tools.jsx:16–32, Unite/Intersect/Exclude:20–23, Text:67, Shape:73, Boolean:85, Duplicate:89 | — | — | |
| Menus — MenuTop.jsx | MenuItem / MenuDropdownItem | `Flatten shape`:323, `Release boolean`:326, `Save as…`:344, `Snap to objects, guides and canvas`:359, `Export SVG/PNG`:363/366, `Display settings`:462 | Editor:226, Generative:245, Effects:261, Pattern:293, Tools:316, File:331, New:334, Save:338, Files…:349, Clear:352, Undo/Redo:369–370, Canvas:374, Aspect:376, View:387, Single:392, Social:398, Templates:404, Color:319, None:271 | — | `empty`:424 | `Starters · N`:406 |
| Layer labels — labels.js | string | `Kinetic type`:15 (contradicts :3 "Title Case everywhere") | Background…Misc:6–17, Unite…Exclude:19–24, Logo…Flatten:26–35, `Shape · Rectangle`:41 | — | — | |
| Effect categories — effectCategories.js | string | `FX rack`:75, `Blur/Sharpen`:33 | `Color Adjustments`:32, `Artistic Effects`:37, `Post-Processing`:43, Halftone…Utility:17–40, Other:77 | — | — | two casings in one list |
| Shortcuts — keymap.js | string | all 55 labels sentence (`Duplicate selection`:33, `Show/hide grid`:69, `Show / hide rail`:70, `Orbit tool (3D camera)`:66, `Reset to defaults`:117, `Fit the stage`:121, `Reroll`:122) | — | section eyebrows UPPER (CSS) | — | |

Convention as practised: **editor rails = sentence case, no transform**; **labs/settings rows = UPPERCASE by JS**; **section eyebrows = UPPERCASE by CSS**; **Inspector pane titles = single Title-case words at 14/400**; menus/tools/layer types = Title Case for single words, sentence for phrases. `labels.js:3` is the only written convention ("Title Case everywhere") and its own list breaks it (:15).

## 4. Button copy (Button / MenuDropdownItem / context menu)

| Label | path:line | Ellipsis | Opens dialog/picker? |
|---|---|---|---|
| `Save…` / `Save` (has id) | src/editor/shell/MenuTop.jsx:338; MobileOverlay.jsx:434; src/editor/morph/MorphTab.jsx:196 | … | yes |
| `Save as…` | MenuTop.jsx:344 | … | yes |
| `Files…` | MenuTop.jsx:349 | … | yes |
| `Colour…` | LayerInspector.jsx:256 | … | modal |
| `Morph…` | src/editor/compose/CanvasArea.jsx:1605 | … | navigates |
| `Add motion…` (dropdown placeholder) | EffectsPanel.jsx:414 | … | no |
| `Add effect…` | LabsParams.jsx:186 | … | no (dropdown) |
| `Add FX...` | LabsParams.jsx:338 | `...` three dots | no (dropdown) |
| `Custom SVG…` / `Expression…` | src/editor/modes/pattern/shapes.js:25 / RuleRow.jsx:26 | … | reveals field |
| `Library` | LayerInspector.jsx:378 | none | opens MediaPicker |
| `From library` | EditorFooter.jsx:142; LabsSourcePicker.jsx:141 | none | opens picker |
| `Batch export` | EditorFooter.jsx:329 | none | opens modal |
| `Upload image` / `Upload video` / `Replace` / `Import` / `Load from file` / `Insert image` | EditorFooter.jsx:136/139; LayerInspector.jsx:376; FilesDialog.jsx:145; EditorFooter.jsx:178; ToolPalette.jsx:87 | none | OS file dialog |
| `Edit object` | SelectionPalettePanel.jsx:157 | none | prompt |
| `Save palette to library` / `Save pattern to library` / `Save type to library` / `Save current` / `Save to file` / `Save pose` | PaletteModal.jsx:215; PatternPanel.jsx:182; SelectionPalettePanel.jsx:160; FilesDialog.jsx:153; EditorFooter.jsx:175; CameraPoseSlots.jsx:47 | none | immediate |
| `Add effect` | EffectsPanel.jsx:225 (:214 variant); MobileOverlay.jsx:374; CanvasArea.jsx:1625 | none | reveals picker |
| `Add rule` / `Add element` / `Add form` / `Add point` / `Add custom sweep` / `Add layer` | PatternPanel.jsx:163; RulesEditor.jsx:56; KineticPanel.jsx:439; SoftformsLayers.jsx:249; KineticPanel.jsx:636; EffectsPanel.jsx:469; KOL LayerStack.jsx:476 | none | immediate |
| `Randomize` | PaletteModal.jsx:208; PatternPanel.jsx:166; RulesEditor.jsx:59; MobileOverlay.jsx:375 | none | |
| `Randomize all` | LoopFields.jsx:270; PatternPanel.jsx:138; EffectsPanel.jsx:334; MobileOverlay.jsx:347 | none | |
| `Randomize motion` / `Randomize preset` | EffectsPanel.jsx:334 / LoopFields.jsx:260 | none | |
| `Randomise` / `All elements` | KineticPanel.jsx:278 / :280 | none | |
| `Reset` | PaletteModal.jsx:211; LoopFields.jsx:334; CameraPoseSlots.jsx:55; ColorPicker.jsx:105 | none | |
| `Reset to defaults` (aria) / `Reset to defaults (R)` (tooltip) | EffectsPanel.jsx:337; LoopFields.jsx:277; MobileOverlay.jsx:351 | none | |
| `Wild` / `Fit` / `Rearrange` / `Re-trigger` | LoopFields.jsx:294/:331; SoftformsLayers.jsx:290; MobileOverlay.jsx:360 | none | |
| `Flatten` | ParametersPanel.jsx:216, :291–295; SelectionPalettePanel.jsx:146 | none | one-way |
| `Flatten shape` / `Flatten text` / `Flatten to vector` / `Convert to path` | MenuTop.jsx:323 + CanvasArea.jsx:1613 / CanvasArea.jsx:1610 / ParatypeTools.jsx:32 / ParametersPanel.jsx:93 | none | one-way |
| `Release boolean` | MenuTop.jsx:326; SelectionPalettePanel.jsx:150; CanvasArea.jsx:1614 | none | |
| `Group selection` / `Group` / `Ungroup` | InspectorRail.jsx:41 / KineticPanel.jsx:431 / LayerInspector.jsx:303, KineticPanel.jsx:434 | none | |
| `Duplicate` / `Delete` / `Undo` / `Redo` | CanvasArea.jsx:1628/1631/1633/1634; MenuTop.jsx:369–370 | none | |
| `Delete key` / `Close` / `Done` | TimelineDock.jsx:409/:412; RollScopesDialog.jsx:36 | none | |
| `Cancel` / `Use` / `Open` / `Back` | MediaPickerDialog.jsx:52/:53; FilesDialog.jsx:157; LabsSourcePicker.jsx:163, LabsCatalogCard.jsx:48, CategoryScreen.jsx:70, EffectScreen.jsx:55, MobileView.jsx:309 | none | |
| `Export PNG` / `Export SVG` / `Export loop (webm)` / `Export all` / `Download` | EditorFooter.jsx:310, MenuTop.jsx:366 / :363 / EditorFooter.jsx:313 / BatchExportModal.jsx:117 / MobileOverlay.jsx:253,435 | none | |
| `Record` / `Stop recording` / `Open output window` / `Webcam` / `Clear image` | EditorFooter.jsx:319/:324/:145/:149 | none | |
| `Edit on canvas` / `Edit forms on canvas` | KineticPanel.jsx:234 / SoftformsLayers.jsx:253 | none | mode |
| `Preset` / `Generator` / `Hide UI` / `Start over` / `Generate` / `Effects` / `Morph` | MobileOverlay.jsx:342/343/436/437; MobileView.jsx:60/61/74 | none | |
| `Copy CSS` / `Catalog` / `Upload` / `Camera` | ColorPicker.jsx:102; LabsView.jsx:269; LabsSourcePicker.jsx:142/144 | none | |
| `Open Editor` / `New File` / `Open the editor anyway` | src/AppLayout.jsx:171, :382; LibraryPage.jsx:146; src/editor/Editor.jsx:136 | none | Title Case |
| Menu: `New` `Clear` `Snap to objects, guides and canvas` `None` `Single` `Social` | MenuTop.jsx:334/352/359/271/392/398 | none | |
| Context menu: `Crop image` `Replace image` `Pattern parameters` `Parameters` | CanvasArea.jsx:1617/1618/1620/1622 | none | |
| Jump buttons: `Shape parameters` · `Pattern parameters` · `Loop · {preset}` · `Misc · …` · `Kinetic · …` | LayerInspector.jsx:270–274 (rendered :290) | none | switches tab |

Ellipsis rule as practised: `…` only on File-menu items and `Colour…`/`Morph…`; every other dialog-opening button (Library, From library, Batch export, Edit object, Import, Replace) has none. `Add FX...` is the one ASCII three-dot.

## 5. Tooltip / title / aria strings on toolbar and tool-like controls

| String | path:line | Prop |
|---|---|---|
| Select (V) · Text (T) · Pen (P) · Rectangle (R) · Ellipse (O) · Triangle · Line · Polygon · Star · Pattern · Zoom (Z) · Orbit (C) | src/editor/state/tools.jsx:16–32 → ToolPalette.jsx:16–17 | Tooltip + aria via KOL ToolPalette.jsx:62–65 |
| Text (fold) · Kinetic type · Shape (fold) · Boolean (fold) | ToolPalette.jsx:67, :70, :73, :85 | label |
| Unite · Subtract front · Intersect · Exclude | ToolPalette.jsx:20–23 | label |
| Flip horizontal (⇧H) · Flip vertical (⇧V) · Rotate 90° left · Rotate 90° right | ToolPalette.jsx:80–83 | label+shortcut |
| Insert image · Crop image · Duplicate (⌘D) | ToolPalette.jsx:87–89 | label |
| Rename (title) / Frame name (aria) / `Untitled` (placeholder) | MenuTop.jsx:219 / :220 / :217 | Input |
| Display settings | MenuTop.jsx:462 (Tooltip), :467 (aria) | IconFrame `settings-01` |
| Play · Pause · Stop · Rewind; groups Playback · Reset | src/editor/params/TransportBar.jsx:83–84, :94–95; :80, :91 | ariaLabel |
| Loop length (label) / Loop length in seconds (aria) | TransportBar.jsx:32 / :41 | |
| Open the transport / Close transport | src/editor/params/TransportFab.jsx:25 / :39 | aria |
| Delete selected · More actions | SelectionPalettePanel.jsx:85,90 / :130,132 | Tooltip+aria |
| Hide / Show · Lock / Unlock · Add layer · `Group ${n} selected layers` | KOL kol-component/src/organisms/LayerStack.jsx:164 / :174 / :476,483 / :425 | Tooltip |
| Hide layer / Show layer · `Blend: {mode}` | LayerInspector.jsx:205 / :207 | SectionIconBtn label |
| Transform (group) · Rotate 90° left · Flip horizontal · Flip vertical | LayerInspector.jsx:82–87 | ariaLabel |
| Resizing · Fixed size · Auto width · Auto height | LayerInspector.jsx:102–108 | ariaLabel |
| Video preview · Image preview · Clear image | LayerInspector.jsx:354 / :366 / :386,388 | aria |
| Open the Pattern tab / Open the Parameters tab | LayerInspector.jsx:286 | Tooltip+aria |
| Align left · Align horizontal center · Align right · Align top · Align vertical center · Align bottom; groups Horizontal alignment · Vertical alignment | src/editor/compose/AlignmentPanel.jsx:10–17; :24–25 | ariaLabel |
| Align text left · Center text · Align text right · Align top · Align middle · Align bottom; groups Text alignment · Vertical alignment | TextPanel.jsx:196–198, :207–209; :193, :204 | ariaLabel |
| Type settings · Size presets | TextPanel.jsx:138,140 / :275,280 | aria |
| Reset to defaults (R) [tooltip] vs Reset to defaults [aria] | EffectsPanel.jsx:337; LoopFields.jsx:277; MobileOverlay.jsx:351 | |
| What Randomize all rolls | LoopFields.jsx:273; MobileOverlay.jsx:350 | aria |
| Randomize all · Download · Hide UI · Back to the frame / Fill the screen · Show controls | MobileOverlay.jsx:251 / :253 / :254 / :255–256 / :205 | Tooltip+aria |
| Randomize scope · Loop length · Aspect · Aspect (landscape) and fill | MobileOverlay.jsx:115 / :132 / :430 / :431 | ariaLabel |
| Edit elements on the canvas (click to select, drag to move, corners to scale) | KineticPanel.jsx:234 | aria |
| Duplicate element · Remove element · Move element up/down | KineticPanel.jsx:414–416 / :419–421 / :441–443, :448–450 | Tooltip+aria |
| Add motion layer · Remove motion layer (the primary can only be set to None) [tooltip] / Remove motion layer [aria] | KineticPanel.jsx:504–506 / :508 / :510 | |
| Move form up/down · Duplicate form · Delete form · Edit forms on the canvas (… knob to rotate) | SoftformsLayers.jsx:215–217, :222–224 / :228–230 / :234–236 / :253 | Tooltip+aria |
| Convert the shape to an editable bezier path (one-way) | ParametersPanel.jsx:93 | Tooltip+aria |
| Flatten the pattern to static SVG shapes (one-way) | ParametersPanel.jsx:214 | |
| Flatten the text to glyph-outline shapes (one-way) / Flatten needs an outline font — switch the Family to Right Grotesk | ParametersPanel.jsx:289–293 | |
| Flatten the glyph(s) to vector shape layers (one-way) | ParatypeTools.jsx:32 | |
| Save current pattern params to the shared library | PatternPanel.jsx:182 | |
| Remove sweep · Remove effect | EffectsPanel.jsx:449 / :381; LabsParams.jsx:316–317 | |
| Recall pose (shift-click = overwrite) / Save pose | CameraPoseSlots.jsx:47 | Tooltip+aria |
| Flip horizontal · Flip vertical · Hide cell | RuleRow.jsx:197 / :200 / :203 | `title=` (native) |
| Re-randomize this rule [tooltip] / Re-randomize rule [aria] · Remove rule | RuleRow.jsx:123 / :129 / :133,139 | |
| `${hex} · alt+click for transparent` | ColorPicker.jsx:85 | `title=` |
| Number sets a constant · an expression like sin(t) binds it | src/editor/params/AutoControls.jsx:189 | `title=` |
| `Modulate ${label}` · Expression plot over one loop | src/editor/params/BindDot.jsx:79 / ModulationEditor.jsx:139 | aria |
| Sync loop — the end takes the start's values, so the loop is seamless [label] / Sync loop [aria] · `Edit step {name}` · Resize the timeline | TimelineDock.jsx:122 / :123 / :245 / :433 | |
| Framerate — press F to hide · Siblings · Source · Effects (scopes) | LabsView.jsx:142; LabsParams.jsx:94; LabsSourcePicker.jsx:116; RollScopesDialog.jsx:31–32 | |
| Lower the sheet / Raise the sheet | src/editor/components/PanelHeader.jsx:102 | aria |
| Rename · Duplicate · Delete (file rows) · Open a chrome | src/AppLayout.jsx:225–227 / :398 | aria |
| Palette · Default aspect · Loop theme · Loop length | PaletteModal.jsx:134; AppSettings.jsx:83 / :98 / :145 | aria |

Tooltip ↔ aria pairs differ in 5 places (Reset to defaults (R) / Reset to defaults; Re-randomize this rule / Re-randomize rule; Sync loop — … / Sync loop; Remove motion layer (…) / Remove motion layer; `Edit elements on the canvas (…)` has no short aria).

## 6. Empty-state and placeholder strings

| String | path:line | Component / class | Gated by `kol-placeholder`? |
|---|---|---|---|
| Select a layer to edit its effect. | EffectsPanel.jsx:57 | Hint `kol-mono-12 text-meta` | yes |
| Select a layer to edit its parameters. | ParametersPanel.jsx:65 | Hint | yes |
| This layer has no parameters. (×4) | ParametersPanel.jsx:130, :135, :141, :147 | Hint | yes |
| Pattern styling lives in the Pattern tab. | ParametersPanel.jsx:223 | Hint | yes |
| No effects yet — add one below. | LabsParams.jsx:197 | Hint `kol-mono-10` | yes |
| Pick an effect from the nav. / Pick an effect or generator from the nav. / This layer has no labs surface. | LabsParams.jsx:227 (emptyHint) / :469 / :474 | Hint | yes |
| Select a pattern layer to edit it. | PatternPanel.jsx:57 | bare `<p kol-mono-12 text-meta>` | **no** |
| `{n} layers selected.` | InspectorRail.jsx:32 | `<p kol-mono-12 text-meta>` | no |
| Select a layer to apply an effect | MenuTop.jsx:267 | `kol-mono-10 text-subtle` (no period) | no |
| empty | MenuTop.jsx:424 | `kol-helper-10 text-subtle` | no |
| Select a file | FilesDialog.jsx:156; MediaPickerDialog.jsx:51 | `kol-mono-12 text-fg-48` | no |
| Pick the media it works on. | LabsSourcePicker.jsx:160 | `kol-mono-12 text-meta` | no |
| Pick a generator / Pick an effect / Select chrome | CategoryScreen.jsx:45 / EffectScreen.jsx:37 / MobileView.jsx:53 | `kol-eyebrow text-body` | no |
| Nothing saved yet (eyebrow `Library`, body `Save… in any chrome keeps a file here. Signed in, it syncs to the cloud library.`) | src/pages/LibraryPage.jsx:151 | KOL EmptyState (EmptyState.jsx:28–30) | no (`gated` not passed) |
| Cloud sync is not configured — files stay on this device. | FilesDialog.jsx:143 | `kol-mono-12 text-meta` | no |
| Filters don't apply to cropped photos. | EffectsPanel.jsx:247 | `kol-helper-12 text-meta` | no |
| Morph needs an outline font — switch the Family to Right Grotesk. | TextPanel.jsx:335 | `kol-mono-12 text-meta` | no |
| Two steps or more and the stage plays the morph. | MorphTab.jsx:180 | `kol-mono-12 text-meta` | no |
| A scope switched off still rolls from its own button. | RollScopesDialog.jsx:35 | `kol-mono-12 text-meta` | no |
| Loading… / Baking loop… / `Exporting n/m…` | AssetsBody.jsx:43 / EditorFooter.jsx:358 / BatchExportModal.jsx:114 | helper-12 | no |
| Needs a window at least N wide / Labs and the randomiser work at this size. | Editor.jsx:131 / :134 | `kol-mono-16` / `kol-mono-12` | no |
| Untitled (placeholder) · Untitled preset · Name · Search presets and files · Search files | MenuTop.jsx:217 · AppLayout.jsx:152,219 · FilesDialog.jsx:151 · StepPicker.jsx:92 · FilesDialog.jsx:129 | placeholder | — |
| Discard the current canvas? Unsaved changes will be lost. | MenuTop.jsx:175 | confirm | — |
| `Delete “{name}”?` (ok `Delete`) · Sign out of the library sync? Saves stay on this device only. (ok `Sign out`) | AppLayout.jsx:219 / :191 | confirm | — |
| Crop · drag to pan · scroll to zoom · handles crop · ⏎ done · esc | CanvasArea.jsx:1444 | `kol-helper-10 text-emphasis` | no |

Hint.jsx:9 says "If it is a sentence explaining the UI, it goes through here"; 12 of the sentences above do not.

## 7. Same thing, two (or more) names

| Concept | Name A | Name B / C |
|---|---|---|
| App settings | `Settings` nav (AppLayout.jsx:281); `Show / hide settings` (keymap.js:99) | `Display settings` (MenuTop.jsx:462,467; AppSettings.jsx:224); `Type settings` (TextPanel.jsx:138) — no "Preferences" anywhere |
| Destroy | `Delete` (CanvasArea.jsx:1631; SelectionPalettePanel.jsx:85 `Delete selected`; SoftformsLayers.jsx:234 `Delete form`; TimelineDock.jsx:409 `Delete key`; keymap.js:34 `Delete selection`; AppLayout.jsx:219,227) | `Remove` (KineticPanel.jsx:419 `Remove element`, :508 `Remove motion layer`, :639 `Remove point`; RuleRow.jsx:133 `Remove rule`; EffectsPanel.jsx:381 `Remove effect`, :449 `Remove sweep`; LabsParams.jsx:316); `Clear` (MenuTop.jsx:352; EditorFooter.jsx:149 `Clear image`) |
| Thing on the canvas | `layer` (labels.js:6–17; LayerInspector.jsx:205 `Hide layer`; InspectorRail.jsx:32; keymap.js section `Layer` :44–55) | `object` (SelectionPalettePanel.jsx:157 `Edit object`; MenuTop.jsx:359 `Snap to objects, guides and canvas`); `element` (KineticPanel.jsx:229,414–450); `form` (SoftformsLayers.jsx:215–236) |
| The composition | `Canvas` (MenuTop.jsx:374 menu, :175 confirm; EditorShell.jsx:38; useColorTarget.js:111; KineticPanel.jsx:234 "on the canvas") | `Frame` (CanvasInspector.jsx:43 pane; MenuTop.jsx:220 `Frame name`; AppSettings.jsx:103 `Clip to frame`; MobileOverlay.jsx:255 `Back to the frame`); `stage` (keymap.js:119–121 `Zoom the stage in`, `Fit the stage`; MorphTab.jsx:180); `screen` (MobileOverlay.jsx:255 `Fill the screen`). No "Artboard". |
| Transparency | `Opacity` only (ColourPanel.jsx:241; LayerInspector.jsx:224; RuleRow.jsx:208; CanvasInspector.jsx:74 `Fill opacity`; keymap.js:82–84 `Layer opacity`) | no "Alpha" |
| Stroke thickness | `Weight` with suffix `pt` (StrokePanel.jsx:101,105) | prop `strokeWidth` (compose/state.jsx:489); sweep `Width` (EffectsPanel.jsx:459); type axis `Cut` for key `width` (schemas/text.js:19) beside `Lock width` (TextPanel.jsx:406) |
| Shuffle | `Randomize` ×27 incl. `Randomize all` (LoopFields.jsx:270; PatternPanel.jsx:138; EffectsPanel.jsx:334; MobileOverlay.jsx:347), `Randomize motion` (EffectsPanel.jsx:334), `Randomize preset` (LoopFields.jsx:260), `Re-randomize this rule` (RuleRow.jsx:123) | `Randomise` (KineticPanel.jsx:278), `Randomise forms` (SoftformsLayers.jsx:283), `Randomiser` mode (mode.js:23 — whose blurb says "randomize"), `Reroll` (keymap.js:122), `Re-trigger` (MobileOverlay.jsx:360), `Wild` (LoopFields.jsx:294), `All elements` (KineticPanel.jsx:280) |
| Effects | `Effects` (MenuTop.jsx:261; SelectionPalettePanel.jsx:12; MobileOverlay.jsx:49), `Add effect` (EffectsPanel.jsx:225; CanvasArea.jsx:1625), `Add effect…` (LabsParams.jsx:186), `Effect Stack` (LabsParams.jsx:196) | `Add FX...` (LabsParams.jsx:338), `FX rack` (effectCategories.js:75), `Filters don't apply…` (EffectsPanel.jsx:247), `sweep` (EffectsPanel.jsx:449) |
| Boolean union | `Unite` (ToolPalette.jsx:20; labels.js:20) | `Union` (SelectionPalettePanel.jsx:111) |
| Boolean subtract | `Subtract` (labels.js:21; SelectionPalettePanel.jsx:112) | `Subtract front` (ToolPalette.jsx:21) |
| Bake to path | `Flatten shape` (MenuTop.jsx:323; CanvasArea.jsx:1613) | `Flatten` (SelectionPalettePanel.jsx:146; ParametersPanel.jsx:216), `Flatten text` (CanvasArea.jsx:1610), `Flatten to vector` (ParatypeTools.jsx:32), `Convert to path` (ParametersPanel.jsx:93) |
| Raster layer | `Photo` type (labels.js:9) | `Image` pane (LayerInspector.jsx:140), `Insert image` (ToolPalette.jsx:87), `Upload image` (EditorFooter.jsx:136; LayerInspector.jsx:376), `Replace` (LayerInspector.jsx:376) vs `Replace image` (CanvasArea.jsx:1618), `Media` (MediaPickerDialog.jsx:43; sheetLabels.js:14), `Insert image or video` (CategoryScreen.jsx:66) |
| Saved files | `Files…` → dialog `Files` (MenuTop.jsx:349; FilesDialog.jsx:128), bucket `Library` (FilesDialog.jsx:44) | `Library` page (LibraryPage.jsx:123), `Templates` menu listing the same slots (MenuTop.jsx:404), `Library` / `From library` buttons (LayerInspector.jsx:378; EditorFooter.jsx:142), tab `Library` vs button `From library` in one file (LabsSourcePicker.jsx:125 / :141) |
| Export | `Export PNG/SVG` (MenuTop.jsx:363–366; EditorFooter.jsx:310), `Export loop (webm)` (:313), `Export all` (BatchExportModal.jsx:117) | `Download` (MobileOverlay.jsx:253, :435), `Save to file` = settings JSON (EditorFooter.jsx:175) |
| Grid | `Show/hide grid` (keymap.js:69) | `Show grid` (EditorShell.jsx:39), `Grid` toggle (CanvasInspector.jsx:62), `Grid` pattern section (pattern.js:16–19), `Grid view` (AssetsBody.jsx:17) |
| Anim tab | `Motion` (EffectsPanel.jsx:44; LabsParams.jsx:49; sub-heads LoopFields.jsx:346, EffectsPanel.jsx:412) | `Animation` (ParametersPanel.jsx:48; LabsParams.jsx:56; SoftformsLayers.jsx:288), `Anim` (LabsParams.jsx:64) |
| Grid counts | `Cols` / `Rows` (pattern.js:16–17) | `Columns` / `Rows` (PatternPanel.jsx:38–39) |
| Type metrics | `Leading` / `Tracking` (schemas/text.js:26 / :25) | `Line height` / `Letter spacing` (TextPanel.jsx:173 / :179) |
| Background colour | `Background` (ColorPicker.jsx:21; LoopFields.jsx:226; LayerInspector.jsx:123; CanvasInspector.jsx:65) | `Bg` (PatternPanel.jsx:40), `Tile bg` / `Tile bg color` (pattern.js:23–24), `BG` (PaletteModal.jsx:175) |
| Group | `Group selection` (InspectorRail.jsx:41; keymap.js:40) | `Group` (KineticPanel.jsx:431), `Group ${n} selected layers` (KOL LayerStack.jsx:425) |
| Text | tool `Text` (tools.jsx:17), layer `Text` (labels.js:11), pane `Typography` (TextPanel.jsx:145) | `Type settings` (TextPanel.jsx:138), `Types` slot (MenuTop.jsx:49), `Save type to library` (SelectionPalettePanel.jsx:160), `Kinetic type` (labels.js:15); `Type` also = category dropdown (LoopPicker.jsx:63; TreePicker.jsx:53; EffectsPanel.jsx:233; SoftformsLayers.jsx:264) |
| Mode of the app | `chrome` (`Select chrome` MobileView.jsx:53; `Open a chrome` AppLayout.jsx:133,398; `Pick a chrome` :116,169) | menu titled `Editor` listing Editor · Labs · Randomiser (MenuTop.jsx:226; mode.js:15–23) |
| Align centre | `Align horizontal center` / `Align vertical center` (AlignmentPanel.jsx:11 / :16) | `Center text` / `Align middle` (TextPanel.jsx:197 / :208) |
| Centre spelling | `Center` (schemas/text.js:13; AlignmentPanel.jsx:11) | — (no "Centre"; British only survives in `Colour`, `Randomise`, `randomiser`) |

## Contradictions

| # | Topic | Side A | Side B |
|---|---|---|---|
| 1 | Colour spelling | `Colour…` LayerInspector.jsx:256; `Text colour` KineticPanel.jsx:271; keymap.js:107 | `Color` tab ColorModal.jsx:16 ("the ruling's spelling"), rolls.jsx:36, MenuTop.jsx:319, PatternPanel.jsx:173, ColorField.jsx:23 |
| 2 | Same file, both spellings | keymap.js:75 `Swap fill and stroke colors` | keymap.js:107 `sample a colour` |
| 3 | Randomise/Randomize | KineticPanel.jsx:278, SoftformsLayers.jsx:283 | 27× `Randomize` (PaletteModal.jsx:208, LoopFields.jsx:270 …); mode.js:23 has `Randomiser` and `randomize` on one line |
| 4 | Ellipsis glyph | `Add effect…` LabsParams.jsx:186 | `Add FX...` LabsParams.jsx:338 |
| 5 | Ellipsis convention | `Save…` `Save as…` `Files…` `Colour…` open dialogs (MenuTop.jsx:338–349; LayerInspector.jsx:256) | `Library`, `From library`, `Batch export`, `Edit object`, `Import` open dialogs without … (LayerInspector.jsx:378; EditorFooter.jsx:142,329; SelectionPalettePanel.jsx:157; FilesDialog.jsx:145) |
| 6 | Written casing rule | labels.js:3 "Convention: Title Case everywhere" | labels.js:15 `Kinetic type`; ToolPalette.jsx:70 `Kinetic type` |
| 7 | Effect category casing | effectCategories.js:32 `Color Adjustments`, :37 `Artistic Effects`, :43 `Post-Processing` | effectCategories.js:75 `FX rack`, :33 `Blur/Sharpen` |
| 8 | Boolean op names | ToolPalette.jsx:20–21 `Unite`, `Subtract front` | SelectionPalettePanel.jsx:111–112 `Union`, `Subtract`; labels.js:20–21 `Unite`, `Subtract` |
| 9 | Anim tab label | EffectsPanel.jsx:44 / LabsParams.jsx:49 `Motion` | ParametersPanel.jsx:48 / LabsParams.jsx:56 `Animation`; LabsParams.jsx:64 `Anim` |
| 10 | Pattern grid labels | schemas/pattern.js:16 `Cols` | PatternPanel.jsx:38 `Columns` |
| 11 | Type metric labels | schemas/text.js:25–26 `Tracking`, `Leading` | TextPanel.jsx:179,173 `Letter spacing`, `Line height` |
| 12 | Canvas vs Frame | MenuTop.jsx:374 `Canvas`, :175 "current canvas"; EditorShell.jsx:38 | CanvasInspector.jsx:43 `Frame`; MenuTop.jsx:220 `Frame name`; AppSettings.jsx:103 `Clip to frame` |
| 13 | Layer vs object | labels.js, LayerInspector.jsx:205, keymap.js:44–55 | SelectionPalettePanel.jsx:157 `Edit object`; MenuTop.jsx:359 `Snap to objects` |
| 14 | Delete vs Remove for the same gesture (trash icon on a row) | SoftformsLayers.jsx:234 `Delete form` | KineticPanel.jsx:419 `Remove element`; RuleRow.jsx:133 `Remove rule` |
| 15 | Stroke thickness | StrokePanel.jsx:101 `Weight` (+ `pt` :105) | compose/state.jsx:489 `strokeWidth`; ColorModal tab `Stroke` |
| 16 | Shortcut label spacing | keymap.js:69 `Show/hide grid` | keymap.js:70,87,99,100,108,109 `Show / hide …` |
| 17 | Section heading rung in one rail | Inspector panes `.kol-inspector-pane-title` 14/400 (LayerInspector.jsx:55…) | sub-heads `kol-helper-10` (LayerInspector.jsx:253,255); `Morph` as `kol-eyebrow` (TextPanel.jsx:334) inside the Typography pane |
| 18 | Section heading rung across rails | Footer/settings/labs `kol-eyebrow` UPPER (EditorFooter.jsx:299; LabsParams.jsx:196) | RuleRow `Section` → `kol-helper-10` (RuleRow.jsx:147); AutoControls.jsx:47–49 says the helper-10 label "the estate stopped writing" |
| 19 | Row label case, same schema | editor: `Inner ratio` as authored (AutoControls.jsx:332, `inline=false`) | labs: `INNER RATIO` (AutoControls.jsx:331–332; SettingsPanel.jsx:122) |
| 20 | Gated hints | Hint.jsx:9 "If it is a sentence explaining the UI, it goes through here" | PatternPanel.jsx:57, InspectorRail.jsx:32, MenuTop.jsx:267, LabsSourcePicker.jsx:160, EffectsPanel.jsx:247, TextPanel.jsx:335, MorphTab.jsx:180, RollScopesDialog.jsx:35 are bare `<p>` |
| 21 | Empty-state punctuation | `Select a layer to edit its effect.` EffectsPanel.jsx:57 | `Select a layer to apply an effect` MenuTop.jsx:267 (no period) |
| 22 | Tooltip vs aria text | EffectsPanel.jsx:337 `Reset to defaults (R)` | same element aria `Reset to defaults`; RuleRow.jsx:123/:129; TimelineDock.jsx:122/:123; KineticPanel.jsx:508/:510 |
| 23 | Align-centre wording | AlignmentPanel.jsx:11,16 `Align horizontal center`, `Align vertical center` | TextPanel.jsx:197,208 `Center text`, `Align middle` |
| 24 | Library vs From library, one file | LabsSourcePicker.jsx:125 tab `Library` | LabsSourcePicker.jsx:141 button `From library` |
| 25 | Replace vs Replace image | LayerInspector.jsx:376 `Replace` | CanvasArea.jsx:1618 `Replace image` |
| 26 | Group button copy | InspectorRail.jsx:41 `Group selection` | KineticPanel.jsx:431 `Group`; KOL LayerStack.jsx:425 `Group N selected layers` |
| 27 | Background abbreviation | PatternPanel.jsx:40 `Bg`; pattern.js:23 `Tile bg` | PaletteModal.jsx:175 `BG`; ColorPicker.jsx:21 `Background` |
| 28 | Mode menu title | MenuTop.jsx:226 menu labelled `Editor` (= current chrome) | MobileView.jsx:53 `Select chrome`; AppLayout.jsx:133 `Open a chrome` |
| 29 | Theme row | AppSettings.jsx:60 row label `Theme` | its switch is aria `Dark mode` (AppSettings.jsx:157) |
| 30 | Transport reset group | TransportBar.jsx:91 group `Reset` | contains `Stop` and `Rewind` (:94–95), while `Reset to defaults` means params elsewhere |

## Open questions

- Which spelling is the ruling for *labels* (not tab ids)? ColorModal.jsx:15 and rolls.jsx:36 cite a 2026-09-30 ruling for "Color"; LayerInspector.jsx:148,247 cite 2026-09-27 as "Colour". The three surviving `Colour` strings may be deliberate or missed.
- Is `Randomiser` (mode.js:23, routes `/randomiser` mode.js:87) a product name that keeps British spelling on purpose while buttons say `Randomize`?
- `Subtract front` (ToolPalette.jsx:21) vs `Subtract` — is "front" a semantic difference (Figma's "Subtract selection") or drift?
- Whether the `.kol-inspector-pane-title` rung (14/400, not a helper class) is a KOL-approved heading role or a kol-fxr-only pane style; no other rail in scope uses it.
- Which of `Motion` / `Animation` / `Anim` is canonical for the `anim` tab — LabsParams.jsx:59–61 justifies `Anim` by a 264px touch rail, not by a naming rule.
- Does `TabsRow` (`kol-mono-12`, TabsRow.jsx:57) intend tab labels to read lighter than pane titles (`kol-inspector-pane-title` 14/400) and heavier than row labels (`kol-helper-10` 500)? Not stated in either package.
- Whether the Hint gate (`kol-placeholder`, Hint.jsx:11–17) is meant to cover status sentences (`Cloud sync is not configured…`, `Filters don't apply…`) or only true empty states — Hint.jsx:7 says the distinction was abolished, but the code keeps it.
- The `Tooltip label` vs `aria-label` divergence (#22) — is the parenthetical shortcut `(R)` supposed to be in the accessible name?
- `labels.js:1–4` claims to be "single source of truth" for layer labels, but tool labels (tools.jsx:16–32), add-menu labels (LayerStack.jsx:32–37) and boolean names (ToolPalette.jsx:20–23, SelectionPalettePanel.jsx:110–115) each hold their own copies.
