# 03 · The right rail's Inspector tab

Read-only map, 2026-10-09. Every claim is `path:line` (repo-relative; KOL packages under `node_modules/@kolkrabbi/`).

## 1. Host and geometry

| Thing | Measured | Where |
|---|---|---|
| Right rail width | `grid-template-columns: 320px minmax(0,1fr) 320px` | `src/editor/styles/kol-editor.css:61` |
| DS rail fallback | `var(--kol-editor-right-w, 320px)`, `railWidth = 320` | `node_modules/@kolkrabbi/kol-component/src/utilities/EditorShell.jsx:60,78,160` |
| Rail border | `.kol-editor-right { border-left: 1px solid var(--kol-oq-08) }` | `src/editor/styles/kol-editor.css:74-76` |
| Tab host | `SelectionPalettePanel` at slot `right.body`; tabs `['Inspector','Parameters','Effects']` (+`'Pattern'` for pattern layers) | `src/editor/Compose.jsx:33`, `src/editor/shell/panels/SelectionPalettePanel.jsx:12,41` |
| Tab row chrome | `flex items-center gap-1 pl-3 pr-2 border-b border-oq-08`, `TabsRow` | `SelectionPalettePanel.jsx:74-75` |
| Scroller | `flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable]` | `SelectionPalettePanel.jsx:95` |
| Inspector shell | DS `InspectorRail` (`kol-component/src/molecules/InspectorRail.jsx:42-58`) with `className="kol-compose-rail kol-compose-rail--inspector"` | `src/editor/compose/InspectorRail.jsx:20-21` |
| Body padding | `.kol-inspector-rail-body { padding: 0 }` overrides the `20px 16px` default | `src/editor/styles/kol-editor.css:367-379` |
| Pane rule | `.kol-inspector-pane + .kol-inspector-pane { border-top: 1px solid var(--kol-oq-08) }` | `node_modules/@kolkrabbi/kol-theme/kol-components-molecules.css:1017` |
| Pane head | `min-height: 40px; padding: 4px 16px 0; gap: 4px` | `kol-theme/kol-components-molecules.css:1018-1024` |
| Pane title type | `h3.kol-inspector-pane-title`: mono **14px/18px, weight 400, `--kol-fg-emphasis`** | `kol-theme/kol-components-molecules.css:1025-1033` |
| Pane body | `flex-col; gap: 8px; padding: 4px 16px 20px` → content track **288px** (320 − 2×16) | `kol-theme/kol-components-molecules.css:1035-1039` |
| Half-rail track | `grid grid-cols-2 gap-2` → **140px** per column (the file's own number) | `src/editor/compose/inspectors/LayerInspector.jsx:59,78` |
| Control rungs | `--kol-ctl-xs: 22px; --kol-ctl-sm: 26px; --kol-ctl-md: 32px` | `node_modules/@kolkrabbi/kol-theme/kol-base-tokens.css:214-216` |
| `kol-control-sm` | `padding: 4px 12px` (+ `kol-mono-12` 12/16 → 26px shell) | `kol-theme/kol-components-atoms.css:137`, `kol-theme/kol-type-mono-classes.css:34-39` |
| Icon-only `sm` button | `width/height: var(--kol-ctl-sm)` = 26×26 | `kol-theme/kol-components-atoms.css:300` |
| `kol-btn-xs` | `padding: 4px 8px` + `kol-mono-8` → 22px | `kol-theme/kol-components-atoms.css:326`, `kol-component/src/atoms/Button.jsx:104-105` |
| Glyph ladders | `SOLO = {sm:16}`, `ADJACENT = {sm:14}`, `INDICATOR = {sm:12}` | `node_modules/@kolkrabbi/kol-component/src/hooks/glyphLadders.js:27,30,40` |
| Type classes | `kol-helper-10`: mono 10px, lh 1, 500, 0.10em (no `text-transform`) · `kol-helper-12`: 12px, 0.06em · `kol-mono-12`: 12/16 · `kol-eyebrow`: 12px uppercase | `kol-theme/kol-type-mono-classes.css:106-119,34-39`, `kol-theme/kol-type-roles.css:285-292` |
| `text-meta` | `color: var(--kol-fg-meta)` = `var(--kol-fg-48)` | `kol-theme/kol-opacity.css:522,503` |
| Rail control size | `ControlSizeContext` default `'sm'` (desktop; no provider in the editor rail) | `src/editor/params/controlSize.js:27-28` |

Icon source: every glyph in this area is `<Icon>` from `@kolkrabbi/kol-icons` (`LayerInspector.jsx:10`, `AlignmentPanel.jsx:1`) or a DS `Button`/`Dropdown` that renders the same `Icon` (`kol-component/src/atoms/Button.jsx:145`). All names resolve from `kol-icon-set-interface` SVGs: `tools/angle.svg`, `tools/rotate-left.svg`, `tools/flip-horizontal.svg`, `tools/flip-vertical.svg`, `tools/align-horizontal-left.svg` (…6 align), `tools/opacity.svg`, `layout/corner-radius.svg`, `eye-lock/eye-on.svg`, `eye-lock/eye-off.svg`, `tools/paint-drop.svg`, `eye-lock/lock.svg`, `eye-lock/unlock.svg`, `add-remove/check.svg`, `transfer/upload.svg`, `singletons/trash.svg`, `components/component-01.svg`, `layout/resize-fixed.svg`, `layout/resize-auto-w.svg`, `layout/resize-auto-h.svg`, `nav/more.svg`, `tools/crop.svg` (`node_modules/@kolkrabbi/kol-icons/src/kol-icon-set-interface/…`; resolver `kol-icons/src/Icon.jsx:92-96`).

## 2. Routing by selection state

DS `InspectorRail` precedence: canvas id present → `renderers.canvas`; ≥2 non-canvas ids → `multi`; exactly 1 → `single`; else **renders nothing** (`kol-component/src/molecules/InspectorRail.jsx:43-57`). Editor wiring: `src/editor/compose/InspectorRail.jsx:24-45`.

| Selection | What renders | Where |
|---|---|---|
| Nothing | empty `<div class="kol-inspector-rail kol-compose-rail kol-compose-rail--inspector">`, no body; tab row still shows; trash and ⋯ hidden | DS `InspectorRail.jsx:52-57`; `SelectionPalettePanel.jsx:46,76,84` |
| Canvas | `CanvasInspector` (Frame · Background), wins over multi | `InspectorRail.jsx:25`; DS `InspectorRail.jsx:14-18` |
| One layer | `LayerInspector layer={findLayerDeep(layers,id)}` | `InspectorRail.jsx:26-29`, `src/editor/compose/helpers.js:4-13` |
| ≥2 layers | pane (no label): `<p class="kol-mono-12 text-meta">{n} layers selected.</p>` · `AlignmentPanel` · `Button tone="primary" size="sm" w-full iconLeft="component-01"` **"Group selection"** → `groupLayers(ids)` | `InspectorRail.jsx:30-44`; `src/editor/compose/state.jsx:1194` |

`positioned = !COVER_TYPES.includes(layer.type)`; `COVER_TYPES = ['background']` → every type except legacy `background` gets Transform (`LayerInspector.jsx:45`, `state.jsx:303`).

### Sections per single-layer type

| Type | Transform | Appearance rows | Preset | Typography | Image | Path | Parameters pane label | Group | Where |
|---|---|---|---|---|---|---|---|---|---|
| rect (`shape/rect`) | yes | Opacity · Corner radius · Fill/Stroke row | – | – | – | – | "Shape parameters" | – | `LayerInspector.jsx:54,193,232,251,270` |
| ellipse / polygon / star / triangle / line / logo / flatten | yes | Opacity · Fill/Stroke row | – | – | – | – | "Shape parameters" | – | `:193` (radius only `kind==='rect'`) |
| path | yes (W/H rescale nodes) | Opacity · Fill/Stroke row | – | – | – | **Open/Closed** `ViewToggle` | **none** (no `path` key in `PARAMS_LABELS`) | – | `:151-161,269-275,454-464` |
| text | yes + **Resizing** strip (fixed/auto-w/auto-h) | Opacity · Corner radius · Fill/Stroke row | – | `TextSurface` pane "Typography" | – | – | none | – | `:97-111,137,193` ; `src/editor/compose/inspectors/TextPanel.jsx:145` |
| photo | yes (no Crop cell — see §9) | Opacity only (no `color` key) | – | – | pane "Image" → `ImageSource` | – | **none** (no `photo` key) | – | `:139-145,269-275` ; `state.jsx:470` |
| loop / misc | yes | Opacity (+ Fill/Stroke row **iff** the preset spreads a `color` param, e.g. `src/loops/pattern/patternLoop.js:253`) | pane "Preset": `gen.LoopPicker` + "Background" Off/On | – | – | – | "Loop · {presetLabel}" / "Misc · {presetLabel}" | – | `:117-132,272-273` ; `src/loops/registry.js:135-148` |
| kinetic | yes | Opacity only | – | – | – | – | "Kinetic · {presetLabel}" | – | `:274` ; `state.jsx:476-483` |
| pattern | yes | Opacity · Fill/Stroke row | – | – | – | – | "Pattern parameters" → `kol:open-pattern` | – | `:270,276` |
| group | yes | Opacity only (group has no `color`) | – | – | – | – | none | pane "Group": Children count + Ungroup | `:165-169,296-313` ; `state.jsx:1234-1243` |
| bool | yes | Opacity · Fill/Stroke row (`color: base.color ?? 'palette:dark'`) | – | – | – | – | none | – | `state.jsx:1046-1053` |
| background (legacy) | **no** | Opacity · Fill/Stroke row | – | – | – | – | none | – | `:45,115` ; `state.jsx:303,468` |
| locked (any) | identical to unlocked — no `locked` branch anywhere in the Inspector | | | | | | | | see §8 |

## 3. Transform pane (`InspectorSection pane label="Transform"`, `LayerInspector.jsx:55`)

Heading "Transform", `h3.kol-inspector-pane-title` (mono 14/18 emphasis). No row labels; glyph + tooltip name each field (`:47-51,223`).

| Row | Control | Package | Size / width | Where |
|---|---|---|---|---|
| Align H / Align V | 2× `SegmentedToggle variant="filled" size="sm" value={null}` (stateless), `grid grid-cols-2 gap-2` → 140px strips, 26px tall; cells `padding 4px 12px`; icons `align-horizontal-left/center/right`, `align-vertical-top/center/bottom` at literal **16** | `kol-component/src/atoms/SegmentedToggle.jsx`; `kol-icons` | aria `"Horizontal alignment"` / `"Vertical alignment"`; per-cell `ariaLabel` "Align left" … "Align bottom" | `src/editor/compose/AlignmentPanel.jsx:9-26`; `kol-theme/kol-components-molecules.css:621` |
| X · Y | `AxisField` → `NumberField variant="property" size="sm"` affordance `<span class="pr-1">X</span>`, `w-full min-w-0`, `grid grid-cols-2 gap-2` (140px each); input hugs `calc(len ch + 2px)` | `kol-component/src/atoms/Input.jsx:104-118,217` | tooltip "X position"/"Y position"; commit `numOr0` | `LayerInspector.jsx:405-433` |
| W · H + lock | `flex items-center gap-2`: inner `grid grid-cols-2 gap-2 flex-1` (≈123px each after the 26px lock + 8px gap) + `Button tone="ghost" size="sm" iconOnly="lock"\|"unlock" pressed` | `kol-component/src/atoms/Button.jsx` | tooltip "Constrain proportions"/"Unconstrain proportions"; min 8; path W/H scale nodes | `LayerInspector.jsx:436-499` |
| Rotation + bind dot | col 1 of `grid grid-cols-2 gap-2`: `flex items-center gap-1`: `AxisField` affordance `<Icon name="angle" size={glyphSize('sm')}>` = **14**, `unit="°"`, tooltip "Rotation" + `BindDot` | `src/editor/params/BindDot` | mod-360 on commit | `LayerInspector.jsx:59-74` |
| Rotate / Flip H / Flip V | col 2: `SegmentedToggle variant="filled" size="sm" value={null}` ariaLabel "Transform", cells overridden `[&_.kol-seg-cell]:min-w-0 [&_.kol-seg-cell]:px-1`; icons `rotate-left`, `flip-horizontal`, `flip-vertical` at `glyphSize('sm', true)` = **16**; flipped axis tints `color: var(--kol-accent-primary)` | `kol-icons`; token `--kol-accent-primary` = `var(--kol-surface-on-primary)` (`kol-theme/kol-color.css:33`) | 'rot' → `rotation − 90`; 'fh'/'fv' → `flipLayer(id,'h'\|'v')` (`state.jsx:998-1012`) | `LayerInspector.jsx:80-95` |
| Crop | **no cell** — `options` has 3 entries; the `'crop'` branch at `:93` is unreachable | | | `LayerInspector.jsx:84-88,93` |
| Resizing (text only) | `SegmentedToggle variant="filled" size="sm"` value `layer.resizing ?? 'fixed'`, full 288px; icons `resize-fixed/auto-w/auto-h` at 16 | | | `LayerInspector.jsx:100-110` |

## 4. Appearance pane (`AppearanceSection`, `LayerInspector.jsx:187-260`)

Heading "Appearance" (`:202`). Header `actions` (right-aligned, `kol-inspector-pane-head`):

| Action | Control | Where |
|---|---|---|
| Visibility | `SectionIconBtn` → `Tooltip asChild` + `Button tone="ghost" quiet size="sm" iconOnly="eye-on"\|"eye-off" pressed={!visible}` (26×26) → `toggleLayer(id)` | `:175-180,205` ; `state.jsx:982` |
| Blend | same button shape, `iconOnly="paint-drop"`, label `Blend: {label}`, `pressed` when `blend !== 'normal'` or open; opens `PopoverPanel` (`placement 'bottom-end'`, `width: 160`, `bg-surface-secondary border border-oq-08 rounded shadow-lg py-1`) listing `BLEND_MODES` as `MenuDropdownItem` (size sm, `kol-helper-12`), tick `<Icon name="check" size={11}>` | `:189-190,206-218`; `BLEND_MODES` = Normal · Multiply · Screen · Overlay · Soft light · Difference from `kol-component/src/organisms/LayerStack.jsx:26-33`, re-exported `src/editor/compose/LayerStack.jsx:13` |

Body:

| Row | Control | Width | Where |
|---|---|---|---|
| Opacity | `Tooltip label="Opacity" triggerClassName="flex min-w-0"` → `NumberField variant="property" size="sm" unit="%" className="w-full min-w-0"` affordance `<Icon name="opacity" size={14}>`; value `round(opacity×100)`; clamp 0–1 | col 1 of `grid grid-cols-2 gap-2` (140px) | `:222-231` |
| Corner radius (rect, text) | same shape, `<Icon name="corner-radius" size={14}>`, no unit; `hasRadius = (shape && kind==='rect') \|\| text` | col 2 (140px) | `:193,232-244` |
| Fill / Stroke (when `'color' in layer`) | `div.flex items-center gap-2 pt-1`: `ColorSwatch hex size={14} hoverable={false}` (no `onClick` → `<span aria-hidden>`, **not clickable**) · `<span class="kol-helper-10 text-meta">Fill</span>` · `ColorSwatch size={14} showTransparent={!layer.stroke}` · `<span class="kol-helper-10 text-meta">Stroke</span>` · `Button tone="ghost" quiet size="xs" className="ms-auto"` **"Colour…"** | row 288px; button 22px/`kol-mono-8` | `:250-258`; `kol-component/src/molecules/ColorSwatch.jsx:87,142-147` |

"Colour…" dispatches `kol:open-color-modal` (`:256`) → **`PaletteModal`, the palette generator** (`src/editor/color/PaletteModal.jsx:27,52-55`; mounted `src/editor/Editor.jsx:63`, whose comment at `:30` says "NOT color/ColorModal"). The per-layer fill/stroke editor is `ColorModal` (tabs Stroke · Colour→"Color" · Swatches) mounted in the **left** rail at `left.body` order −1 (`src/editor/Compose.jsx:29`, `src/editor/color/ColorModal.jsx:16-19`), bound through `useColorTarget` (`src/editor/color/useColorTarget.js:6-20`). Fill/Stroke sections were removed from the Inspector 2026-09-27 (`LayerInspector.jsx:147-149`). Unused `first` prop is destructured at `:187` and never read.

## 5. Other panes

| Pane | Heading | Rows | Where |
|---|---|---|---|
| Preset (loop/misc) | "Preset" | `gen.LoopPicker layer tree` · `LabeledControl label="Background"` (`kol-helper-10 tracking-widest text-meta`, label above) → `ViewToggle` text sm `Off`/`On` (`kol-control-sm kol-mono-12`), gated by `gen.loopBgToggleable` | `LayerInspector.jsx:117-132`; `kol-component/src/molecules/LabeledControl.jsx:93-99`; `kol-component/src/atoms/ViewToggle.jsx:38,97-99`; `src/loops/registry.js:188` |
| Typography (text) | "Typography", header action `Button tone="ghost" size="sm" iconOnly="slider-01"` "Type settings" → popover `minWidth 240` with `LabeledControl` "Case" (`ViewToggle`) and "Italic" (`ViewToggle variant="single"` Off/On) | family `Dropdown variant="subtle" size="sm" w-full` · `grid grid-cols-[1fr_96px] gap-2`: style `Dropdown` + `SizeCombo` (`NumberField variant="property" size="sm"` + chevron `slotRight` + `BindDot`; presets popover `width 72`) · `grid grid-cols-2 gap-2`: Line height / Letter spacing `MetricInput` (property sm, icons `line-height`/`letter-spacing` at 16, unit `em`) + `BindDot` · `flex gap-2`: `SegmentedToggle filled sm` "Text alignment" (`text-align-*` 16) + "Vertical alignment" (`text-valign-*` 16) | `TextPanel.jsx:137-232,240-299` |
| Image (photo) | "Image" | `LabeledControl label="Source"` → optional 16/9 preview (`rounded overflow-hidden border border-oq-08 mb-2`) · `flex items-center gap-2`: `Button tone="primary" size="sm" iconLeft="upload" iconSize={12} flex-1` "Upload image"/"Replace" · `Button primary sm flex-1` "Library" (→ `MediaPickerDialog accept=['image','video']`) · `Button primary sm iconOnly="trash" iconSize={12}` "Clear image" (only when `src`) · hidden `<input type=file accept="image/*">`; listens `kol:photo-replace` | `LayerInspector.jsx:318-396` |
| Path | "Path" | `ViewToggle` text sm `Open`/`Closed` → `setProp('closed')` | `LayerInspector.jsx:151-161` |
| Parameters | "Parameters" | one `Button tone="primary" size="sm" w-full` with `PARAMS_LABELS[type]` text; `aria-label`/tooltip "Open the Parameters tab" (pattern: "Open the Pattern tab"); dispatches `kol:open-params` or `kol:open-pattern` → `SelectionPalettePanel` flips tab | `LayerInspector.jsx:269-294`; `SelectionPalettePanel.jsx:55-67` |
| Group | "Group" | `LabeledControl label="Children"` → `<span class="kol-helper-12 text-meta">{n} layer(s)</span>` · `Button tone="primary" size="sm" w-full` "Ungroup" → `ungroupLayer` | `LayerInspector.jsx:296-313`; `state.jsx:1252` |

## 6. CanvasInspector (`src/editor/compose/inspectors/CanvasInspector.jsx`)

| Pane | Row | Control | Width | Where |
|---|---|---|---|---|
| "Frame" | preset | `Dropdown variant="subtle" size="sm" className="w-full"` options from `ASPECTS` (`src/editor/shell/aspects`); `subtle` is a legacy alias → `primary` | 288px | `:17,45-52`; `kol-component/src/molecules/Dropdown.jsx:57` |
| | W · H | `SizeField` → `NumberField variant="filled" size="sm" chars={5} prefix="W"\|"H" className="w-full min-w-0"` in `grid grid-cols-2 gap-2`; `chars` sets `size=5` and drops `flex-1` | shell 140px, input hugs 5ch | `:56-59,102-114`; `kol-component/src/atoms/Input.jsx:94,171,215` |
| | Grid | `ToggleSwitch variant="plain" label="Grid"` — `plain` → legacy alias `bare`; **size defaults to `md`** (32px, `kol-mono-14`) | hug | `:62`; `kol-component/src/atoms/ToggleSwitch.jsx:20,28` |
| "Background" | fill | `ColorField label="Background" hideLabel` (not inline): `flex items-center gap-2`: swatch `<button>` wrapping `ColorSwatch size={32} className="border border-oq-08"` + hex `Input variant="filled" size={cs} prefix="#" chars={6} placeholder "–"/"auto"`; swatch click → popover `minWidth 200`, `grid grid-cols-6 gap-1` of `ColorSwatch size="fill"` for `PALETTE_REFS` (Primary · Secondary · Light · Dark · Accent · Background) + `Tag size="xs"` "Theme" (`autoValue="var(--kol-surface-ab-split)"`) and "None"; writes via `useColorTarget().setFill` | hug | `:66-73`; `src/editor/compose/inspectors/ColorField.jsx:7-14,68-106,121-163` |
| | Fill opacity | `LabeledControl label="Fill opacity"` → `NumberField variant="filled" size="sm" chars={4} suffix="%"` | hug ≈4ch | `:74-85` |
| | Infinite | `ColorField label="Infinite"` (label shown above via `LabeledControl`, `kol-helper-10 tracking-widest text-meta`), `autoValue="var(--kol-surface-secondary)"` → `setInfiniteFill` | hug | `:87-93` |

`NumberField` (`src/editor/compose/inspectors/NumberField.jsx:21-33`) wraps DS `Input type="number"` with a local draft; commit on blur/Enter; it does not pass `onCommit`, so the DS's own commit path (`Input.jsx:132-152`) is bypassed.

## 7. Trash · overflow ⋯ · layer name (not in the Inspector body)

| Item | Where it lives | Contents | Where |
|---|---|---|---|
| Delete | tab row, right of ⋯: `Button tone="ghost" size="sm" quiet iconOnly="trash"` "Delete selected" → `deleteSelected` (hidden for canvas) | — | `SelectionPalettePanel.jsx:84-93`; `state.jsx:871-877` |
| Overflow ⋯ | tab row: `Button tone="ghost" size="sm" quiet iconOnly="more"` "More actions"; `PopoverPanel` `width: 176`, `z-[var(--kol-z-tooltip)]` | **Union · Subtract · Intersect · Exclude** (disabled unless ≥2 booleanable) · divider · **Flatten** · **Release boolean** (bool) · divider · **Edit object** · **Save type to library** (text). **No Delete / Duplicate / Lock / Hide** here | `SelectionPalettePanel.jsx:110-166` |
| Canvas context menu | right-click on canvas (DS `ContextMenu` rows) | Morph… / Flatten text (text) · Flatten shape / Release boolean (bool) · Crop image / Replace image (photo) · Pattern parameters · Parameters (shape, loop, kinetic, misc, **path**) · Add effect · divider · Duplicate · Show/Hide · Lock/Unlock · **Delete** | `src/editor/compose/CanvasArea.jsx:1597-1640` |
| Layer name | **not in the Inspector**; inline rename by double-click in DS `LayerStack` (Enter/blur commit, Escape cancel, empty clears) wired `onRename={(id,name)=>updateLayer(id,{name})}` | | `kol-component/src/organisms/LayerStack.jsx:85-97,153`; `src/editor/compose/LayerStack.jsx:68`; `src/editor/compose/labels.js:58-59` |
| Lock toggle | DS `LayerStack` row (`lock`/`unlock` 12px) and context menu | | `kol-component/src/organisms/LayerStack.jsx:174-181`; `CanvasArea.jsx:1630` |

## 8. Locked layers in the Inspector

No `locked` read in `LayerInspector.jsx`, `AlignmentPanel.jsx`, `CanvasInspector.jsx` (grep: only the aspect-lock comment at `LayerInspector.jsx:439`). Consequences, all from `src/editor/compose/state.jsx`: `flipLayer` silently no-ops on locked (`:1001`); `alignSelected` skips locked (`:1343`); `updateLayer → patchLayerDeep` has no lock check (`:103-108, :899-901`) so X/Y/W/H/rotation/opacity/blend/radius **still write** on a locked layer; `kol:enter-crop` ignores a locked photo (`CanvasArea.jsx:880`); ToolPalette disables Crop/Duplicate when locked (`src/editor/shell/panels/ToolPalette.jsx:88-89`).

## 9. New-layer defaults (the factory)

Factory: `addLayer(type, extras)` → `{ id, type, visible: true, opacity: 1, blend: 'normal', ...layerDefaults(type), ...paintExtras, ...extras }` (`state.jsx:830-840`). `paintExtras` for `COLOR_LAYER_TYPES = {background, pattern, shape, text, path, bool}` = `{ color: paintFill, stroke: paintStroke }` (`state.jsx:32,832-835`); initial `paintFill = '#FFFFFF'`, `paintStroke = '#000000'` (`state.jsx:581-582`), re-synced from the selected layer (`state.jsx:802-804`).

| Created how | color (fill) | stroke | strokeWidth | Where |
|---|---|---|---|---|
| rect/ellipse/triangle/polygon/star by draw tool | `'palette:dark'` (extras) | current `paintStroke` (initially `'#000000'`) | **absent** → renderer `?? 0` (no stroke drawn) | `CanvasArea.jsx:1075-1081`; `src/editor/compose/LayerRenderer.jsx:1570`; `src/editor/compose/shape-math.js:68` |
| shape by Add-layer menu (`extras {kind}`) | current `paintFill` (initially `'#FFFFFF'`) | current `paintStroke` | absent → 0 | `src/editor/compose/LayerStack.jsx:31-38,47`; `state.jsx:467` (`kind:'logo', color:'palette:dark'` only for the bare default) |
| path by pen | `null` | `'palette:dark'` | **2** | `CanvasArea.jsx:269-273`; `state.jsx:489` |
| line by pen | `null` | `'palette:dark'` | 2 | `CanvasArea.jsx:383-390` |
| text | `'palette:dark'` | current `paintStroke` | absent → 0 | `state.jsx:487` |
| bool | `base.color ?? 'palette:dark'` | `base.stroke ?? null` | `base.strokeWidth ?? 0` | `state.jsx:1046-1053` |
| group | no key | no key | no key | `state.jsx:1234-1243` |
| photo / kinetic | no key | no key | — | `state.jsx:470,476-483` |

## 10. Dead or orphaned code

| Item | Status | Where |
|---|---|---|
| `FlipButton` | **Gone** — removed in commit `721d5ec` (fxr-1009, 2026-10-09); `git log -S FlipButton` last touches that commit; `.kol` notes still cite it at `LayerInspector.jsx:409` (now `AxisField`) | `.kol/llm-plan/20-the-editor-review.md:46`, `.kol/llm-context/audit/2026-10-09-G-code.md:7`; `_tmp/` is gitignored (`.gitignore:27`) and absent |
| Unused imports in `LayerInspector.jsx` | `Dropdown` (`:3`), `StrokePanel` (`:9`), `firstFilterDef` (`:17`); `palette` destructured `:34` unused; `first` prop `:115/:187` unused | grep: single occurrence each |
| `'crop'` branch | unreachable — no `'crop'` option | `LayerInspector.jsx:93` vs `:84-88` |
| DS `AlignmentGrid` | exists in kol-component, **no importer in `src/`**; the editor keeps its own `AlignmentPanel` | `kol-component/src/molecules/AlignmentGrid.jsx:36-72`; `src/editor/compose/AlignmentPanel.jsx` |
| DS `PropertyInput` | unused by this area (Label + Stepper/Input) | `kol-component/src/molecules/PropertyInput.jsx:12-31` |
| `NumberField` | DS says retired 2026-09-03 in favour of `Input onCommit`; still used by 5 files | `kol-component/src/atoms/Input.jsx:26-28,139-144`; users `LayerInspector.jsx:19`, `CanvasInspector.jsx:6`, `TextPanel.jsx`, `src/editor/color/StrokePanel.jsx:6`, `src/editor/params/rolls.jsx` |
| `ColorField` re-export | `LayerInspector.jsx:505` re-exports for `CanvasInspector.jsx:5` (imports from `./LayerInspector`, not `./ColorField`) | |

## Contradictions

| # | Topic | Side A | Side B |
|---|---|---|---|
| 1 | What "Colour…" opens | comment: "the door to the panel that edits them", i.e. the left-rail Colour/Stroke panels (`LayerInspector.jsx:147-149,246-249`) | dispatches `kol:open-color-modal` → `PaletteModal`, the palette generator, "NOT color/ColorModal" (`LayerInspector.jsx:256`; `Editor.jsx:30,63`; `PaletteModal.jsx:27`); the paint editor `ColorModal` sits at `left.body` (`Compose.jsx:29`) |
| 2 | Spelling | "Colour…" (`LayerInspector.jsx:256`), tab id `'Colour'`, `ColourPanel.jsx` | the ruling's spelling "Color": `ColorModal.jsx:15-16`, `MenuTop.jsx:318-319`, `src/editor/params/rolls.jsx:36` ("color, the ruling (2026-09-30)") |
| 3 | Boolean op labels | `BOOL_OP_LABELS.unite = 'Unite'` (`labels.js:20`) | ⋯ menu `{ id:'unite', label:'Union' }` (`SelectionPalettePanel.jsx:111`) |
| 4 | Crop cell | comment "a photo layer adds Crop … four sm cells" (`LayerInspector.jsx:77-79`) and `'crop'` handler (`:93`) | `options` has 3 cells, none `crop` (`:84-88`); Crop lives in `ToolPalette.jsx:88,100` and the context menu `CanvasArea.jsx:1616` |
| 5 | Blend control | "the inspector's Blend dropdown" (`src/editor/compose/LayerStack.jsx:11`); `Dropdown` imported (`LayerInspector.jsx:3`) | implemented as `PopoverPanel` + `MenuDropdownItem` (`LayerInspector.jsx:212-218`) |
| 6 | Align icon size | `AlignmentPanel.jsx:10-17` literal `size={16}` | DS `AlignmentGrid.jsx:57` `glyphSize(size)` = ADJACENT sm = **14**; transform cluster uses `glyphSize('sm', true)` = 16 (`LayerInspector.jsx:85-87`) |
| 7 | Align strip aria | "Horizontal alignment" / "Vertical alignment" (`AlignmentPanel.jsx:24-25`) | "Align horizontally" / "Align vertically" (`AlignmentGrid.jsx:49`); text pane reuses "Vertical alignment" for text valign (`TextPanel.jsx:204`) |
| 8 | Seg-cell padding, one rail | Align strips: default `4px 12px` (`kol-components-molecules.css:621`) | Transform cluster: `[&_.kol-seg-cell]:px-1` (`LayerInspector.jsx:83`) |
| 9 | Number-field idiom | `variant="property"` + `affordance` + `unit="%"` (`LayerInspector.jsx:225-230,408-414`) | `variant="filled"` + `chars` + `prefix`/`suffix="%"` (`CanvasInspector.jsx:78,104-108`) |
| 10 | Size rungs in one rail | `sm` everywhere (`LayerInspector.jsx:62,81,178`, `CanvasInspector.jsx:47,106`) | `Button size="xs"` "Colour…" (`LayerInspector.jsx:256`); `ToggleSwitch` Grid at default `md` 32px (`CanvasInspector.jsx:62`; `ToggleSwitch.jsx:28`) |
| 11 | Swatch size for "a colour chip" | 14 (`LayerInspector.jsx:252,254`; `ColorField.jsx:154,159`) | 32 non-inline (`ColorField.jsx:78`), 24 inline, `'control-sm'` 26 in the paint bar (`ColorField.jsx:78`; `ColorSwatch.jsx:53`) |
| 12 | Icon size literals vs ladders | `iconSize={12}` upload/trash (`LayerInspector.jsx:372,387`), `check` 11 (`:214`) | ladders ADJACENT sm 14 / SOLO sm 16 (`glyphLadders.js:27,30`) |
| 13 | Same label class, two trackings | `kol-helper-10 tracking-widest text-meta` (`LabeledControl.jsx:96`) | `kol-helper-10 text-meta` Fill/Stroke (`LayerInspector.jsx:253,255`) |
| 14 | LabeledControl "uppercase" | doc says label is uppercase (`LabeledControl.jsx:16`) | `.kol-helper-10` has no `text-transform` (`kol-type-mono-classes.css:106-112`); only `kol-eyebrow` uppercases (`kol-type-roles.css:291`) |
| 15 | Parameters for `path` | context menu offers "Parameters" for path (`CanvasArea.jsx:1621`) | `PARAMS_LABELS` has no `path` → no pane (`LayerInspector.jsx:269-275`) |
| 16 | Photo "effect row" | comment "the photo row IS the effect row" (`LayerInspector.jsx:265-266`) | no `photo` key in `PARAMS_LABELS` (`:269-275`); Effects section removed (`:281-282`) |
| 17 | Default fill of a new rect | draw tool: `'palette:dark'` (`CanvasArea.jsx:1075`) | Add-layer menu: current `paintFill` = `'#FFFFFF'` initially (`LayerStack.jsx:33`; `state.jsx:581,832-838`) |
| 18 | `NumberField` lifecycle | DS: "fxr's NumberField, retired 2026-09-03" (`Input.jsx:26-28,139-144`) | file exists and has 5 importers (`NumberField.jsx:4-7`) |
| 19 | FlipButton | audit/plan notes: alive at `LayerInspector.jsx:409` (`20-the-editor-review.md:46`, `2026-10-09-G-code.md:7`) | removed in `721d5ec`; `:409` is `AxisField` |
| 20 | Opacity labelling | layer: unlabeled, glyph + tooltip (`LayerInspector.jsx:223-231`) | canvas: `LabeledControl "Fill opacity"` (`CanvasInspector.jsx:74`) |
| 21 | Lock semantics | flip/align refuse locked (`state.jsx:1001,1343`) | inspector fields write through `patchLayerDeep` with no check (`state.jsx:103-108`) |
| 22 | Rail "Palette/Inspector tab group" | `Compose.jsx:18-19` | actual tabs Inspector · Parameters · Effects (· Pattern) (`SelectionPalettePanel.jsx:12,41`) |

## Open questions

- Where the generators pack registers `gen.LoopPicker`, `gen.MISC_TREE`, `gen.loopById`, `gen.loopBgToggleable` (`LayerInspector.jsx:35,121-122`): `src/editor/packs.js` has no `LoopPicker` string; the component is `src/editor/compose/inspectors/LoopPicker.jsx`, the predicate `src/loops/registry.js:188`. Registration site not located.
- Effective content width: 288px assumes no reserved scrollbar gutter; `[scrollbar-gutter:stable]` (`SelectionPalettePanel.jsx:95`) and the 1px rail border (`kol-editor.css:76`) reduce it under classic scrollbars — not measurable from code.
- `kol-inspector-rail` (DS root class) has no rule in kol-theme (grep empty); only `-body` is styled by the editor (`kol-editor.css:367-379`). Intentional?
- Which loop/misc presets actually spread a `color` key (and thus show the Fill/Stroke row with a transparent Stroke swatch) — only `patternLoop.js:253` found by grep; others may use different keys.
- Whether `Dropdown variant="subtle"` / `ToggleSwitch variant="plain"` (legacy aliases) emit console warnings in DEV (`Button.jsx:94` warns for its aliases; not checked for Dropdown/ToggleSwitch).
- `tracking-widest` (Tailwind 0.1em) vs `kol-helper-10`'s own 0.10em — visually identical, so whether contradiction 13 is intentional.
