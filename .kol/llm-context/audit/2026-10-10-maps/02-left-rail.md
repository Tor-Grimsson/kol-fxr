# 02 — The left rail (Stroke · Color · Swatches / Layers · Assets / Transport · Output · File)

Read-only map, measured from code. Paths repo-relative; KOL sources under `node_modules/@kolkrabbi/`.
Abbrev: `DS/` = `node_modules/@kolkrabbi/kol-component/src/`, `THEME/` = `node_modules/@kolkrabbi/kol-theme/`.

## 0. Container

| Thing | Value | Where |
|---|---|---|
| Rail grid | `grid-template-columns: 320px minmax(0,1fr) 320px` | src/editor/styles/kol-editor.css:61 |
| Left aside | `.kol-editor-left` flex-col, `border-right: 1px solid var(--kol-oq-08)`, no background rule | src/editor/styles/kol-editor.css:67-73 |
| Slot order (Compose) | `left.body` order −1 ColorModal · order 0 LayersAssetsPanel · `left.footer` EditorFooter | src/editor/Compose.jsx:29-31 |
| Rail renderer | `<aside class="kol-editor-{side}">` → `.kol-editor-rail-header` (only if panels) · `.kol-editor-rail-body` · `.kol-editor-rail-footer`; panels mounted as `<Component key={i} />` with NO props | src/editor/EditorShell.jsx:63-84 |
| Valid slots | `SLOTS` 9 names incl. `canvas.overlay` | src/editor/state/panels.js:17 |
| Body scroll | `.kol-editor-rail-body` `flex:1 1 auto; min-height:0; overflow-y:auto; scrollbar-gutter:stable; display:flex; flex-direction:column` | src/editor/styles/kol-editor.css:152-161 |
| Panels in body | `.kol-editor-rail-body .kol-compose-rail { height:auto }` (so LayersAssetsPanel is content-height; its own inner `overflow-y-auto` never engages — the rail body scrolls) | src/editor/styles/kol-editor.css:164; src/editor/shell/panels/LayersAssetsPanel.jsx:26 |
| Footer | `.kol-editor-rail-footer { flex: 0 0 auto }` — pinned outside the scroller | src/editor/styles/kol-editor.css:176 |
| `.kol-compose-rail` | `display:flex; flex-direction:column; height:100%` | src/editor/styles/kol-editor.css:233-237 |
| Collapse | Compose stamps no `data-rail`; only labs' `useDragResize(railRef,{token:'kol-rail',side:'right'})` does | src/editor/labs/LabsView.jsx:163; src/editor/shell/panels/EditorFooter.jsx:65-80 |
| Labs rail width token | `--kol-rail-w: var(--kol-sidenav-w)`; `--kol-rail-w-collapsed: 48px` | src/editor/styles/kol-labs.css:27-28 |
| `--kol-sidenav-w` | 264px; 320px at `min-width:1536px` | node_modules/@kolkrabbi/kol-framework/kol-framework.css:46, 298 |
| Framework rail default | `--kol-rail-w: 256px`, `--kol-rail-w-collapsed: 56px` | node_modules/@kolkrabbi/kol-framework/kol-framework.css:901, 905 |
| Control ladder | `--kol-ctl-xs/sm/md/lg: 22/26/32/40px`; coarse pointer 32/32/36/40 | THEME/kol-base-tokens.css:214-225 |
| Control size ctx | `ControlSizeContext` default `'sm'`; only provider is LabsView (`'md'`) — Compose always `'sm'` | src/editor/params/controlSize.js:26-27; src/editor/labs/LabsView.jsx:509 |

## 1. Tab strips — two different components in one rail

| Group | Component | Height | Type | Active / inactive | Wrapper | Where |
|---|---|---|---|---|---|---|
| Stroke·Color·Swatches | `TabsRow` (DS) | `h-10` = 40px, `gap-4` | `kol-mono-12`, labels verbatim, no text-transform | `text-emphasis border-b-2 border-fg` / `text-meta hover:text-emphasis border-transparent` | `div.border-b.border-oq-08.shrink-0 > div.px-3` | DS/molecules/TabsRow.jsx:38,45,57-60,16; src/editor/color/ColorModal.jsx:31-32 |
| Layers·Assets | `TabsRow` (DS) | 40px | `kol-mono-12` | same | `div.border-b.border-oq-08.flex.items-center.pr-2 > div.flex-1.min-w-0 > div.px-3`; `AddLayerButton` as trailing sibling | src/editor/shell/panels/LayersAssetsPanel.jsx:20-24 |
| Transport·Output·File | `SegmentedToggle` (DS) default variant | `size={cs}` → sm 26px (`h-[26px]` TOGGLE_FIX) | `kol-mono-12` at sm | `.kol-seg-cell.is-active` ground / `oq-48` rest | `flex-1 min-w-0` → cells `flex:1` fill the row | src/editor/shell/panels/EditorFooter.jsx:57,279-285; DS/atoms/SegmentedToggle.jsx:64; THEME/kol-components-molecules.css:618,623-635 |

TabsRow optional chrome: leading `CloseButton size="xs"` and trailing `Icon chevron-down 12` render only when `onClose`/`onMinimise` are passed (DS/molecules/TabsRow.jsx:39-42,69-78). ColorModal forwards them (src/editor/color/ColorModal.jsx:18,32) but the registry mounts it propless (src/editor/Compose.jsx:29; src/editor/EditorShell.jsx:75) → never rendered.

## 2. Stroke · Color · Swatches (ColorModal)

| Shell | Value | Where |
|---|---|---|
| Wrapper | `bg-surface-primary overflow-hidden border-b border-oq-08 flex flex-col`, `style={{height:320}}` | src/editor/color/ColorModal.jsx:27-30 |
| Tabs | `['Stroke','Colour','Swatches']` → id stays `Colour`, label `Color` | src/editor/color/ColorModal.jsx:16 |
| Default tab | `'Colour'` | src/editor/color/ColorModal.jsx:18 |
| Body | `flex-1 min-h-0 flex flex-col` → `StrokeBody` / `ColourBody` / `SwatchesBody onPick` | src/editor/color/ColorModal.jsx:34-38 |
| Header actions | none (no `…`, no `+`, no trash) | src/editor/color/ColorModal.jsx:26-40 |
| Standalone wrappers | `StrokePanel`/`ColourPanel`/`SwatchesPanel` default exports each `style={{width:320}}` `bg-surface-primary border border-oq-08 rounded` — only consumer is a stray import | src/editor/color/StrokePanel.jsx:119-128; ColourPanel.jsx:53-62; SwatchesPanel.jsx:93-102; src/editor/compose/inspectors/LayerInspector.jsx:9 |

### 2.1 Stroke pane (`StrokeBody`)

Wrapper `p-4 flex flex-col gap-4` (src/editor/color/StrokePanel.jsx:100). Every row = `LabeledControl inline` → label `span.kol-helper-10.tracking-widest.text-meta.shrink-0` at `width: 48` (default `labelWidth`), control slot `div.flex-1.min-w-0`, row `flex items-center gap-3` (DS/molecules/LabeledControl.jsx:36,79-88). Label casing: authored Title Case, no transform (`.kol-helper-10` has none — THEME/kol-type-mono-classes.css:106-112).

| # | Label (verbatim) | Control | Package | size | Width | Options / notes | Where |
|---|---|---|---|---|---|---|---|
| 1 | `Weight` | `NumberField` → DS `Input` `variant="filled"` `suffix="pt"` `chars={4}` `type="number"` | editor wrapper over `@kolkrabbi/kol-component` Input | `sm` (26px) | **fixed `w-24` = 96px shell** + `chars=4` HTML `size` on the inner input (chars drops `flex-1`) | clamp 0–64; comment: slot used to fill at 153px | src/editor/color/StrokePanel.jsx:101-111,88; src/editor/compose/inspectors/NumberField.jsx:21-33; DS/atoms/Input.jsx:171,215; THEME/kol-components-atoms.css:137 |
| 2 | `Style` | `SegmentedToggle variant="filled"` | kol-component | `sm` | fills slot (cells `flex:1`) | glyph labels: `LinePreview` 40×2 svg, dash `4 3`, `DotsPreview` 5 dots; `ariaLabel` Solid/Dashed/Dotted | src/editor/color/StrokePanel.jsx:26-48,112 |
| 3 | `Cap` | `SegmentedToggle variant="filled"` | kol-component | **unset → `md` 32px** | fills | `Butt` `Round` `Square` | src/editor/color/StrokePanel.jsx:50-54,113; DS/atoms/SegmentedToggle.jsx:63 |
| 4 | `Join` | `SegmentedToggle variant="filled"` | kol-component | **unset → `md` 32px** | fills | `Miter` `Round` `Bevel` | src/editor/color/StrokePanel.jsx:55-59,114 |

Seg geometry: `.kol-seg--sm` height `var(--kol-ctl-sm)`, sm cell `padding:4px 12px`; md cell `6px 16px` (THEME/kol-components-molecules.css:618-626). Cell type `kol-mono-12` (sm) / `kol-mono-14` (md) (DS/atoms/SegmentedToggle.jsx:64).
No section headings, no dividers, no empty state: with nothing strokeable selected the rows still render live; `setProp` is `NOOP` (src/editor/color/StrokePanel.jsx:67-80).

### 2.2 Colour pane (`ColourBody`)

Wrapper `p-4 flex flex-col gap-3 h-full min-h-0` (src/editor/color/ColourPanel.jsx:41). Order: TopRow → mode body (`flex-1 min-h-0 flex flex-col`) → OpacityRow (:42-48).

**TopRow** `flex items-center gap-3` (src/editor/color/ColourPanel.jsx:105):

| Piece | Component | Measured | Where |
|---|---|---|---|
| Paint chips | `SwatchStack` | box `w-11 h-11` (44×44); two `ColorSwatch size={22} radius="full" variant="halo"` at `left-[5px] top-[6px]` (fill) / `left-[15px] top-[16px]` (stroke); active paint rendered second; aria `Fill color` / `Stroke color` | DS/molecules/SwatchControls.jsx:38-39,46-50,79-86 |
| Swap | raw `<button>` `Icon name="swap" size={16}` at `left-[28px] top-0`, aria `Swap colors` | DS/molecules/SwatchControls.jsx:148-158 |
| None marker | raw `<button>` `.kol-swatch-none-marker` `w-2.5 h-2.5 rounded-full` at `left-[1px] top-[32px]`, aria `Clear color`; red `#DC2626` slash, ring `fg-32` | DS/molecules/SwatchControls.jsx:164-172; THEME/kol-components-molecules.css:778-789 |
| **Eyedropper** | `EyedropPick` → raw `<button>` (not `Button`), **`Icon name="eyedrop" size={24}`** from `@kolkrabbi/kol-icons`, aria `Eyedropper`, tooltip `Pick a color from the canvas`; **rendered only if `'EyeDropper' in window`** | DS/molecules/SwatchControls.jsx:105-122,139-145; node_modules/@kolkrabbi/kol-icons/src/cuts.json (`eyedrop`) |
| Sample chip | `ColorSwatch size={16} radius="full" variant="halo"` `mt-1`, title `Sampled color` | DS/molecules/SwatchControls.jsx:123-130 |
| Pick seam | `pickFromCanvas` — rasterizes layers to an offscreen canvas, samples one click; **never calls native EyeDropper** | src/editor/color/ColourPanel.jsx:76-91; src/editor/color/canvasEyedropper.js:6-13,29-111 |
| Key | `I` → `window 'kol:eyedrop'` → same pick | src/editor/color/ColourPanel.jsx:92-99; src/editor/state/keymap.js:107 |
| Mode picker | `Dropdown variant="subtle"` (alias → primary) `size="sm"` in `div.ml-auto`, **`className="w-[110px]"`** | src/editor/color/ColourPanel.jsx:114-122; DS/molecules/Dropdown.jsx:57,151 |
| Mode options | `Hue` `Wheel` `Sliders`; default `'hue'` | src/editor/color/ColourPanel.jsx:15-19,38 |

**Mode bodies:**

| Mode | Rows | Control / measured | Where |
|---|---|---|---|
| Hue | (none labelled) | `HueStrip` height 12, handle 14px; `SBSquare` in `flex-1 min-h-0 rounded-[2px] overflow-hidden` (DS asks for `rounded-[var(--kol-radius-xs)]`; token = 2px) | src/editor/color/ColourPanel.jsx:141-148; DS/organisms/SpectrumControls.jsx:107,121-122,461,499; THEME/kol-design-tokens.css:113 |
| Wheel | (none) | `WheelTriangle` `aspect-square max-h-full max-w-full` | src/editor/color/ColourPanel.jsx:155-165; DS/organisms/SpectrumControls.jsx:394 |
| Sliders | `ModelToggle` + 3 `SliderRow` | `SegmentedToggle variant="filled"` **no size → md 32px**, `HSL`/`RGB`; rows `LabeledControl inline label="R|G|B"` or `"H|S|L"` with `hint` (`255`, `360°`, `100%`) → `Slider min=0 max` | src/editor/color/ColourPanel.jsx:167-213,195-205 |

**Opacity row** (lives at the BOTTOM of the Colour pane, after the mode body — src/editor/color/ColourPanel.jsx:48,215-245):
- `LabeledControl inline label="Opacity"` → label 48px `kol-helper-10 tracking-widest text-meta` (:241; DS/molecules/LabeledControl.jsx:36,82).
- `Slider min={0} max={100}` (:242) → wrapper `control-slider gap-3 shadow-none`; track `input[type=range].slider-black flex-1 w-full min-w-0`; readout (default `readout='input'`) = **DS `Input variant="filled" size="sm" chars={6}` `inputClassName="text-center"`** (DS/molecules/Slider.jsx:277,283-297,322).
- **Readout width = hug: 6 chars (`size=6`) + `.kol-control-sm` padding `4px 12px` + 1px border**; px depends on mono glyph width (THEME/kol-components-atoms.css:52-66,137; DS/atoms/Input.jsx:171,215). Not a Tailwind width.
- Writes: canvas → `setCanvasFillOpacity`, layer → `edit.setProp('opacity')`, nothing selected → local state (slider still moves) (src/editor/color/ColourPanel.jsx:226-238).

### 2.3 Swatches pane (`SwatchesBody`)

| Thing | Value | Where |
|---|---|---|
| Wrapper | `p-4 flex flex-col gap-4 h-full min-h-0` | src/editor/color/SwatchesPanel.jsx:68 |
| Palette picker | `Dropdown variant="subtle" size="sm" className="w-full"` (stretched); options `AC` · `Standard`; default `'ac'` | src/editor/color/SwatchesPanel.jsx:36-39,42,69-76 |
| Grid | `grid grid-cols-8 grid-rows-6 gap-1 flex-1 min-h-0`; `slice(0,48)` | src/editor/color/SwatchesPanel.jsx:63-65,77 |
| Cell | `ColorSwatch size="stretch" radius="tight" frame={false}` → `w-full h-full`, `rounded-[var(--kol-radius-xs)]`, no border | src/editor/color/SwatchesPanel.jsx:79-85; DS/molecules/ColorSwatch.jsx:45-48,56-61 |
| AC bank | 14 `--kol-fg-NN` + 5 `--kol-color-red-NNN` + 5 `--kol-color-cream-NNN` + 10 `--grey-NNN` + `#FFFFFF` + `#000000` = 36 (12 of 48 cells empty) | src/editor/color/SwatchesPanel.jsx:22-25,52-58 |
| Token sources | `--kol-fg-01` THEME/kol-color.css:174; red/cream/grey in `kol-framework/kol-brand-color.css:35-93` via `@import` src/index.css:28 | — |
| Standard bank | 48 literal hexes | src/editor/color/SwatchesPanel.jsx:27-34 |
| Re-resolve | on `window 'kol:theme-change'` | src/editor/color/SwatchesPanel.jsx:45-50 |
| Headings / dividers / empty state | none | — |

## 3. Layers · Assets (LayersAssetsPanel)

| Thing | Value | Where |
|---|---|---|
| Wrapper | `kol-compose-rail border-b border-oq-08` | src/editor/shell/panels/LayersAssetsPanel.jsx:19 |
| Tabs | `['Layers','Assets']`, default `'Layers'` | src/editor/shell/panels/LayersAssetsPanel.jsx:6,16 |
| Header actions | `+` only, Layers tab only, trailing in the tab row; no `…`, no trash | src/editor/shell/panels/LayersAssetsPanel.jsx:24; DS/organisms/LayerStack.jsx:420-422 |
| Delete lives in | keymap `Backspace`/`Delete` "Delete selection"; right rail trash `Button tone="ghost" size="sm" quiet iconOnly="trash"`; right rail `…` `iconOnly="more"` | src/editor/state/keymap.js:35-36; src/editor/shell/panels/SelectionPalettePanel.jsx:84-93,132 |
| Body | `flex-1 min-h-0 overflow-y-auto` | src/editor/shell/panels/LayersAssetsPanel.jsx:26 |

### 3.1 `+` AddLayerButton

| Thing | Value | Where |
|---|---|---|
| Button | DS `Button tone="primary" size="sm" quiet iconOnly="plus"` aria/tooltip `Add layer` → 26px square, glyph SOLO sm 16, rest opacity `--kol-opacity-disabled` 0.5 | DS/organisms/LayerStack.jsx:476-485; THEME/kol-components-atoms.css:300,358-360; DS/hooks/glyphLadders.js:27; THEME/kol-design-tokens.css:150 |
| Menu | `PopoverPanel py-1` width 180; rows `MenuDropdownItem iconLeft <Icon size=12>`; Shape → `MenuDropdownNest` | DS/organisms/LayerStack.jsx:461,487-506 |
| Types (editor) | `Pattern` `Photo` `Shape` `Text` `Loop` `Kinetic type` `Misc` (loop/misc need `generators` pack, kinetic `motion`) | src/editor/compose/state.jsx:417-432; src/editor/compose/LayerStack.jsx:41-50 |
| Shape kinds | `Logo` `Rectangle` `Ellipse` `Triangle` `Polygon` `Star` (no Line — pen) | src/editor/compose/LayerStack.jsx:29-38 |
| Icons | editor `TYPE_ICONS` map → `iconFor`; icon component = DS default `Icon` from `@kolkrabbi/kol-icons` | src/editor/compose/LayerStack.jsx:15-27,48; DS/organisms/LayerStack.jsx:275 |

### 3.2 Layers stack (DS `LayerStack`, editor wiring)

| Row | Label | Type class / casing | Anatomy | Where |
|---|---|---|---|---|
| Panel | — | `kol-layer-stack flex flex-col min-h-[240px]`; list `pb-3 px-2 pt-3` | — | DS/organisms/LayerStack.jsx:397,400 |
| Canvas | `Canvas` | `kol-helper-12 truncate flex-1 text-left` (mono 12 / lh 1 / 500 / 0.06em, no transform) | chevron 16×16 + `Icon maximize 14` in 18px box | DS/organisms/LayerStack.jsx:192-206; THEME/kol-type-mono-classes.css:114-120; THEME/kol-components-organisms.css:747-750,827-833 |
| Layer | `rowLabelForLayer(layer)` (editor labels.js) — user name verbatim, else Title Case type/kind, text layers show their text | `kol-helper-12 truncate flex-1 text-left` | `.kol-layer-stack-row` `padding:4px 60px 4px 8px`, radius 4, `fg-64` ink; type icon 14 in 18px box; eye/lock toggles 28px wide absolute `right:28px`/`0`, icon 12, rest `opacity:0`, pinned when hidden/locked/active | src/editor/compose/labels.js:53-68; src/editor/compose/LayerStack.jsx:71; DS/organisms/LayerStack.jsx:149-183; THEME/kol-components-organisms.css:769-775,839-861 |
| Nested | — | — | `.kol-layer-stack-nest { padding-left:16px }` per depth | THEME/kol-components-organisms.css:767 |
| Rename | — | `Input variant="ghost" size="sm" width="100%"` `inputClassName="kol-helper-12 text-emphasis"` | dbl-click | DS/organisms/LayerStack.jsx:131-146 |
| Group footer | `Group {n}` | `Button tone="primary" size="sm" iconLeft="layers"` in `px-3 h-10 border-t border-fg-08`, only when ≥2 layers selected | — | DS/organisms/LayerStack.jsx:423-436 |
| Empty state | none — Canvas row is always present | — | DS/organisms/LayerStack.jsx:401-409 |
| Hover / active | `:hover` `fg-04`; `.is-active` accent 26%; `.is-tinted` 11% | — | THEME/kol-components-organisms.css:781-794 |

### 3.3 Assets (`AssetsBody`)

| Thing | Value | Where |
|---|---|---|
| Wrapper | `px-4 py-3 flex flex-col gap-3` | src/editor/compose/AssetsBody.jsx:74 |
| Section heading 1 | `<p class="kol-eyebrow text-meta">Logos</p>` → **renders uppercase `LOGOS`** (`.kol-eyebrow` has `text-transform: uppercase`, mono 12 / 500 / 0.06em) | src/editor/compose/AssetsBody.jsx:76; THEME/kol-type-roles.css:285-292 |
| View toggle | `ViewToggle variant="icon"` options `list`(view-list) / `grid`(grid), labels `List view`/`Grid view`; well `p-1 -mx-1 rounded`, buttons `p-1.5`, glyph 14; default `'list'` | src/editor/compose/AssetsBody.jsx:15-18,64,77-82; DS/atoms/ViewToggle.jsx:82,90,118 |
| List rows | `ContentRow variant="file" title={variant} titleClass="kol-mono-12 text-emphasis truncate" thumb={32} ratio="4 / 3"`; file box pad `8px 0`, gap 12, divider `1px fg-08` | src/editor/compose/AssetsBody.jsx:98-111; DS/molecules/ContentRow.jsx:50; THEME/kol-components-molecules.css:1127-1129 |
| Grid tiles | `AssetGrid cols={2} gap="gap-2"` (= `grid-cols-1 min-[480px]:grid-cols-2`, viewport-keyed) → `MediaTile name={variant}` preview `p-3 text-emphasis`; tile thumb `aspect-ratio:1; padding:10px`, name `.kol-item-name` (mono 12/16) 2-line clamp; each tile carries a `RowMenuButton` `···` top-right | src/editor/compose/AssetsBody.jsx:86-96; DS/utilities/AssetGrid.jsx:18; DS/molecules/MediaTile.jsx:30-32; THEME/kol-components-molecules.css:1509-1546; THEME/kol-type-roles.css:353-357 |
| Section heading 2 | `<p class="kol-eyebrow text-meta">Images</p>` → `IMAGES`; `AssetGrid cols={3} gap="gap-2"` (`md:grid-cols-3`), 12 `MediaTile` with `<img object-cover>` | src/editor/compose/AssetsBody.jsx:26,40-57; DS/utilities/AssetGrid.jsx:19 |
| Loading text | `Loading…` `kol-helper-12 text-meta` | src/editor/compose/AssetsBody.jsx:43 |
| Empty / error | returns `null` (no text) | src/editor/compose/AssetsBody.jsx:38 |
| Dividers | only the file rows' own `kol-row--divided` hairlines | — |

## 4. Footer — Transport · Output · File (EditorFooter)

| Thing | Value | Where |
|---|---|---|
| Wrapper | `relative border-t border-oq-08 flex flex-col gap-3`, **`padding: 16px 20px 24px 20px`** | src/editor/shell/panels/EditorFooter.jsx:269 |
| Tabs | `Transport` `Output` `File` (Title Case, `kol-mono-12`, no transform); touch/no-motion → `Output` `File` | src/editor/shell/panels/EditorFooter.jsx:32-36,44,198 |
| Default tab | `'transport'` if motion pack else `'output'`; touch `null` | src/editor/shell/panels/EditorFooter.jsx:202 |
| Transport source | `pack('motion')?.TransportBar` = `src/editor/params/TransportBar.jsx` | src/editor/shell/panels/EditorFooter.jsx:197; src/packs/motion.js:13,18 |
| Size | `cs = useControlSize()` → `'sm'` in Compose | src/editor/shell/panels/EditorFooter.jsx:190; src/editor/params/controlSize.js:26 |
| Unused imports | `glyphSize`, `Icon` | src/editor/shell/panels/EditorFooter.jsx:2,17 |

### 4.1 Transport tab (`TransportBar size="sm"`, stays mounted `hidden` on other tabs — EditorFooter.jsx:289-293)

Row `flex items-center gap-2` (src/editor/params/TransportBar.jsx:78):

| # | Control | Measured | Where |
|---|---|---|---|
| 1 | `SegmentedToggle ariaLabel="Playback"` `[play|pause]` | glyph `Icon` SOLO sm = 16; cells forced square `w-[var(--kol-ctl-sm)]` 26px `px-0` via `SQUARE.sm`; tooltips `Play (Space)` / `Pause (Space)` | src/editor/params/TransportBar.jsx:59,66-70,79-86; DS/hooks/glyphLadders.js:27 |
| 2 | `LoopField` in `div.flex-1.min-w-0` | `Input variant="property" size="sm" affordance="Loop /" unit="s" chars={3}` `className="justify-center" inputClassName="text-center"`; property → shell `w-full`, inner width `calc(len ch + 2px)` (so `chars` is overridden); tooltip `Loop length`; aria `Loop length in seconds` | src/editor/params/TransportBar.jsx:20-57,87-89; DS/atoms/Input.jsx:116,154,215-217 |
| 3 | `SegmentedToggle ariaLabel="Reset"` `[stop|rewind]` `value={null}` (stateless) | same 26px square cells; aria `Stop`/`Rewind` | src/editor/params/TransportBar.jsx:90-97 |

No labels, headings or dividers.

### 4.2 Output tab (`flex flex-col gap-3` — EditorFooter.jsx:295)

Sections are `LabeledControlSection` → `<p class="kol-eyebrow text-fg-80">` (uppercase) + rows `flex flex-col gap-2`, section `gap-3` (DS/organisms/SettingsPanel.jsx:155-161).

| Section (renders) | Row | Control | Width | Where |
|---|---|---|---|---|
| `Aspect` → `ASPECT` | aspect | `Dropdown size={cs} variant="subtle" className="w-full"` options from `ASPECTS` (custom only while active) | stretched | src/editor/shell/panels/EditorFooter.jsx:239-243,299-301 |
| `Export` → `EXPORT` | scale + size | `div.flex.items-center.gap-3`: `Dropdown size={cs} variant="subtle" className="flex-1 w-full"` options `@1x · W` `@2x · 2W` `@3x · 3W`; `span.kol-helper-10.text-meta.whitespace-nowrap` `W × H px` | dropdown flex-1 | :246,302-308 |
| | `Export PNG` | `Button tone="primary" size={cs} className="w-full" iconLeft="download" iconSize={12}` | full | :309-311 |
| | `Export loop (webm)` | same, download | full | :312-314 |
| | `Record` / `Stop recording` | `tone={recording?'inverted':'primary'}` `iconLeft={recording?'eye-on':'download'}` | full | :318-320 |
| | `Open output window` | iconLeft `maximize` | full | :323-325 |
| | `Batch export` | iconLeft `copy` → `BatchExportModal` (eyebrow `Batch export`) | full | :328-330,367-373; src/editor/shell/panels/BatchExportModal.jsx:76 |
| Bake overlay | `Baking loop…` `kol-helper-12 text-emphasis`; `done / total` `kol-helper-10 text-meta`; card width 320 pad 20; bar 6px `--kol-oq-08` / `--kol-accent-primary` | `FullscreenOverlay closeButton={false}` | — | :351-366 |

Button sm = 26px, `padding: 4px 12px`, `kol-mono-12` (THEME/kol-components-atoms.css:327).

### 4.3 File tab (EditorFooter.jsx:334-350)

| Mode | Rows (verbatim) | Control | Where |
|---|---|---|---|
| default (`SettingsFileTab`, `flex flex-col gap-2`) | `Save to file` (download) · `Load from file` (upload) · error `span.kol-mono-10.text-ui-error` | `Button tone="primary" size={cs} className="w-full" iconSize={12}` | src/editor/shell/panels/EditorFooter.jsx:160-187 |
| photo layer selected (`PhotoFileTab`) | `Upload image` (upload) · `Upload video` (upload) · `From library` (image) · `Webcam` (camera) · `Clear image` (trash, only with src/webcam) | same Buttons; `MediaPickerDialog` | :88-156 |
| both | `AudioInputRow`: `div.flex.flex-col.gap-1.mt-3` → row `flex items-center gap-2`: `span.kol-helper-10.text-meta.shrink-0` **`Audio`** (bare span, no 48px column) + `SegmentedToggle variant="filled" size="sm" className="flex-1"` `Off` `Mic` `File`; error `kol-mono-10 text-fg-64` | — | :348; src/editor/params/AudioInputRow.jsx:12-16,58-65 |

`text-ui-error` has no rule in kol-theme or src CSS (token `--ui-error` exists: THEME/kol-color.css:59,125) — the Load error text is uncoloured.
Dividers: none in the footer (the "divider keeps the lanes distinct" comment at :158-159 describes code that left on 2026-10-09, :182-184).

### 4.4 Collapsed dock (`:root[data-rail="collapsed"]`)

`div.flex.flex-col.px-2.pb-4` → rule `self-stretch -mx-2 border-t border-oq-08 mb-2` → `Button tone="ghost" size="md" iconOnly={play|pause}` (32px square, glyph 20) `self-center`, tooltip `Play`/`Pause` + `Space` (src/editor/shell/panels/EditorFooter.jsx:254-266; THEME/kol-components-atoms.css:301; DS/hooks/glyphLadders.js:27). Only reachable in Compose through a stale attribute left by labs (src/editor/labs/LabsView.jsx:163,347-350).

## 5. Type classes measured

| Class | font / size / lh / weight / tracking / transform | Where |
|---|---|---|
| `kol-mono-12` | mono 12 / 16 / 400 / — / none | THEME/kol-type-mono-classes.css:34-39 |
| `kol-mono-10` | mono 10 / 14 / 400 | THEME/kol-type-mono-classes.css:27-32 |
| `kol-helper-10` | mono 10 / 1 / 500 / 0.10em / none | THEME/kol-type-mono-classes.css:106-112 |
| `kol-helper-12` | mono 12 / 1 / 500 / 0.06em / none | THEME/kol-type-mono-classes.css:114-120 |
| `kol-eyebrow` | mono 12 / 1 / 500 / 0.06em / **uppercase** | THEME/kol-type-roles.css:285-292 |
| `kol-item-name` | mono 12 / 16 | THEME/kol-type-roles.css:353-357 |
| `text-meta` / `text-emphasis` | `--kol-fg-meta` / `--kol-fg-emphasis` | THEME/kol-opacity.css:522,528 |

## 6. Literal `Colour` / `Color` strings (UI-visible or identifiers)

| String | Role | Where |
|---|---|---|
| `'Colour'` id → label `'Color'` | tab | src/editor/color/ColorModal.jsx:16 |
| `defaultTab = 'Colour'` | prop | src/editor/color/ColorModal.jsx:18 |
| `ColourPanel` / `ColourBody` / `ColourPanelRef` | component names, comment | src/editor/color/ColourPanel.jsx:22,29,53,152 |
| `ColorModal` / `color/` dir | component, folder | src/editor/color/ColorModal.jsx:18 |
| `Color` | Tools menu item (opens PaletteModal) | src/editor/shell/MenuTop.jsx:318-320 |
| `Colour…` | inspector button (opens PaletteModal) | src/editor/compose/inspectors/LayerInspector.jsx:256 |
| `Fill color` / `Stroke color` / `Swap colors` / `Clear color` / `Pick a color from the canvas` / `Sampled color` | aria/tooltips | DS/molecules/SwatchControls.jsx:79-80,111,128,153,169 |
| `Eyedropper — sample a colour from the canvas` | keymap label | src/editor/state/keymap.js:107 |
| `section: 'Color'` ×5 | keymap section | src/editor/state/keymap.js:72-77,107 |
| `'Color'` scope label, comment "color, the ruling (2026-09-30); the cell read Colour beside a Color section" | rolls | src/editor/params/rolls.jsx:36 |
| `label="Color"` | pattern panel row | src/editor/compose/inspectors/PatternPanel.jsx:173 |
| `label = 'Color'` | ColorField default | src/editor/compose/inspectors/ColorField.jsx:23 |
| `'kol:open-color-modal'` | event that opens **PaletteModal** | src/editor/color/PaletteModal.jsx:27,54; src/editor/shell/MenuTop.jsx:71 |

## Contradictions

| # | Disagreement | Side A | Side B |
|---|---|---|---|
| 1 | Rail width | 320px grid (src/editor/styles/kol-editor.css:61); standalone panels 320 (src/editor/color/StrokePanel.jsx:123, ColourPanel.jsx:57, SwatchesPanel.jsx:97) | "desktop rail's 264" (src/editor/shell/panels/EditorFooter.jsx:43; src/editor/mobile/MobileView.jsx:93); labs `--kol-sidenav-w` 264/320 (src/editor/styles/kol-labs.css:27; kol-framework.css:46,298); framework `--kol-rail-w: 256px` (kol-framework.css:901) |
| 2 | Collapsed rail width | 48px (src/editor/styles/kol-labs.css:28; EditorFooter.jsx:64) | 56px (node_modules/@kolkrabbi/kol-framework/kol-framework.css:905) |
| 3 | Spelling Colour/Color | tab label `Color`, menu `Color` (ColorModal.jsx:16; MenuTop.jsx:319); ruling comment "color" (rolls.jsx:36) | tab id `Colour`, `ColourPanel`, button `Colour…`, keymap "colour" (ColorModal.jsx:16,18; ColourPanel.jsx:29; LayerInspector.jsx:256; keymap.js:107) |
| 4 | Two size rungs in the Stroke pane | Weight `sm`, Style `sm` (StrokePanel.jsx:104,112) | Cap, Join unset → `md` 32px (StrokePanel.jsx:113-114; DS/atoms/SegmentedToggle.jsx:63) |
| 5 | Two size rungs in the Colour pane | mode Dropdown `sm`, slider readouts `sm` (ColourPanel.jsx:117; DS/molecules/Slider.jsx:288) | `ModelToggle` HSL/RGB unset → `md` (ColourPanel.jsx:202) |
| 6 | Two tab-strip components in one rail | `TabsRow` 40px underline (ColorModal.jsx:32; LayersAssetsPanel.jsx:22; DS/molecules/TabsRow.jsx:38) | `SegmentedToggle` 26px tiles (EditorFooter.jsx:279-285) |
| 7 | Horizontal padding | 16 (`p-4` StrokePanel.jsx:100, ColourPanel.jsx:41, SwatchesPanel.jsx:68; `px-4` AssetsBody.jsx:74); 12 (`px-3` tab rows ColorModal.jsx:32, LayersAssetsPanel.jsx:22) | 8 (`px-2` DS/organisms/LayerStack.jsx:400); 20 (EditorFooter.jsx:269) |
| 8 | Label column | 48px `LabeledControl inline` (DS/molecules/LabeledControl.jsx:36; StrokePanel.jsx:101; ColourPanel.jsx:241) | none — bare `kol-helper-10` span `Audio` (src/editor/params/AudioInputRow.jsx:60); labs `RAIL_LABEL_W = 112` (src/editor/params/controlSize.js:44) |
| 9 | Label casing | row labels authored Title Case, no transform (`Weight`, `Opacity`, `Audio`; THEME/kol-type-mono-classes.css:106-112) and `LabeledControl` doc says "uppercase" (DS/molecules/LabeledControl.jsx:16) | section eyebrows forced uppercase `LOGOS` `IMAGES` `ASPECT` `EXPORT` (AssetsBody.jsx:41,76; DS/organisms/SettingsPanel.jsx:158; THEME/kol-type-roles.css:291) vs labs' "casing is authored, not transformed" (src/editor/styles/kol-labs.css:5-11) |
| 10 | Eyedropper gating vs implementation | button renders only when native `window.EyeDropper` exists (DS/molecules/SwatchControls.jsx:110,142) | pick never uses the native API, works in every browser (src/editor/color/canvasEyedropper.js:6-8; ColourPanel.jsx:83) → pipette hidden in Firefox/Safari while `I` still works (ColourPanel.jsx:95-99) |
| 11 | Eyedrop glyph size | `eyedrop` 24 (DS/molecules/SwatchControls.jsx:119) = lg SOLO rung (DS/hooks/glyphLadders.js:27) | neighbours `swap` 16, chips 22/16 (SwatchControls.jsx:48,126,156); pane is `sm` |
| 12 | Two icon maps | editor `TYPE_ICONS` (src/editor/compose/LayerStack.jsx:15-26) | identical DS `DEFAULT_TYPE_ICONS` (DS/organisms/LayerStack.jsx:11-22) |
| 13 | Two row-label sources | editor `rowLabelForLayer` (src/editor/compose/labels.js:58-68) | identical DS `rowLabelForLayer` (DS/hooks/layerTree.js:68-78) |
| 14 | Dead vs live layer CSS | editor `.kol-compose-layer-row:hover { background: var(--kol-oq-04) }` (src/editor/styles/kol-editor.css:272-287) | DS rows are `.kol-layer-stack-row`, hover `fg-04` (DS/organisms/LayerStack.jsx:117; THEME/kol-components-organisms.css:769-783) |
| 15 | Stale selector | click-away checks `.kol-compose-layer-row` (src/editor/compose/CanvasArea.jsx:1105) | rows render `.kol-layer-stack-row` (DS/organisms/LayerStack.jsx:117) → `onAnyRow` is always null |
| 16 | SBSquare corner | editor `rounded-[2px]` literal (ColourPanel.jsx:144) | DS asks `rounded-[var(--kol-radius-xs)]` (DS/organisms/SpectrumControls.jsx:121-122,499) (token = 2px, THEME/kol-design-tokens.css:113) |
| 17 | Stale comments | "SwatchStack… live in `./SwatchControls.jsx`", "HueStrip… `./SpectrumControls.jsx`" (ColourPanel.jsx:128-130,247-249) | imported from `@kolkrabbi/kol-component` (ColourPanel.jsx:7-8) |
| 18 | NumberField "retired" | DS says fxr's `NumberField` retired 2026-09-03 (DS/atoms/Input.jsx:28,140-145) | still exists and feeds Weight (src/editor/compose/inspectors/NumberField.jsx:21; StrokePanel.jsx:6,102) |
| 19 | `kol:open-color-modal` target | `Colour…` button's comment: "the door to the panel that edits them" = left rail Colour/Stroke (LayerInspector.jsx:247-256) | the event opens `PaletteModal` (palette generator), not `ColorModal` (src/editor/color/PaletteModal.jsx:27,54; src/editor/Editor.jsx:30,63) |
| 20 | ColorModal header actions | accepts/forwards `onClose`, `onMinimise` (ColorModal.jsx:18,32) | mounted propless (Compose.jsx:29; EditorShell.jsx:75) |
| 21 | Footer slot | `left.footer` (src/editor/Compose.jsx:31; EditorFooter.jsx:23) | `right.footer` in labs (src/editor/labs/LabsView.jsx:320) |
| 22 | Group label | `Group {n}` (DS/organisms/LayerStack.jsx:433) | `Group selection` (src/editor/compose/InspectorRail.jsx:41) |
| 23 | Loop field width | `chars={3}` (src/editor/params/TransportBar.jsx:40) | property variant sets inline `width: calc(len ch + 2px)` which overrides the `size` attr (DS/atoms/Input.jsx:215-217) |
| 24 | File-tab divider | comment "a divider keeps the lanes distinct" (EditorFooter.jsx:158-159) | no divider rendered; lanes removed (EditorFooter.jsx:173-186) |

## Open questions

1. Is the Compose left rail meant to resize/collapse? No `useDragResize` outside labs (src/editor/labs/LabsView.jsx:163); the footer's collapsed dock (EditorFooter.jsx:254-266) can fire only on a stale `data-rail`.
2. Rendered px width of the Opacity readout: `6ch` of `--kol-font-family-mono` at 12px + 26px chrome — depends on font metrics, not derivable from code (DS/molecules/Slider.jsx:289; THEME/kol-components-atoms.css:137).
3. `text-ui-error` (EditorFooter.jsx:181): no rule found in kol-theme or src CSS; is a Tailwind theme colour meant to exist?
4. Is the 48-slot Swatches grid with 36 AC swatches (12 blank cells) intended, or should the AC bank be 48 (src/editor/color/SwatchesPanel.jsx:22-25,65)?
5. Should Cap/Join and HSL/RGB toggles be `sm` like every other control in the colour group (StrokePanel.jsx:113-114; ColourPanel.jsx:202)?
6. `AssetGrid` columns key on the viewport (`min-[480px]`, `md:`), not the 320px rail (DS/utilities/AssetGrid.jsx:17-21) — intended for a rail?
7. `MediaTile` always renders a `···` `RowMenuButton` (DS/molecules/MediaTile.jsx:32) while AssetsBody passes no `onContextMenu` (AssetsBody.jsx:49-54,89-94) — dead menu affordance?
8. Should the pipette render regardless of native `EyeDropper` support, given the canvas sampler (contradiction 10)?
9. Which spelling rules: tab `Color` (ColorModal.jsx:16) or button `Colour…` (LayerInspector.jsx:256)? And should `Colour…` open `ColorModal` (already mounted in the rail) rather than `PaletteModal`?
10. Are the standalone 320px wrappers (`StrokePanel`/`ColourPanel`/`SwatchesPanel` defaults) still wanted, given the only reference is an unused import (LayerInspector.jsx:9)?
11. Does the `TOGGLE_FIX = 'h-[26px]'` still matter now that `.kol-seg--sm` sets `height: var(--kol-ctl-sm)` in kol-theme (EditorFooter.jsx:57; THEME/kol-components-molecules.css:618)?
