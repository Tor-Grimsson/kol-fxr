# 04 — Right rail: Parameters & Effects tabs

Read-only map. KOL packages: kol-component 0.246.0 (`node_modules/@kolkrabbi/kol-component/package.json`), kol-theme 0.171.0 (`node_modules/@kolkrabbi/kol-theme/package.json:3`).

## 0. Shell the two tabs sit in

| Thing | Value | Where |
|---|---|---|
| Rail tab host | `TabsRow` (underline tabs, `kol-mono-12`, h-10) with `['Inspector','Parameters','Effects']` (+ `'Pattern'` appended only for a pattern layer) | src/editor/shell/panels/SelectionPalettePanel.jsx:12, :41, :75; node_modules/@kolkrabbi/kol-component/src/molecules/TabsRow.jsx:27-60 |
| Effects tab exists only when the effects pack is registered | `pack('effects') ? [...,'Effects'] : [...]` | SelectionPalettePanel.jsx:12, :36 |
| Tab auto-flips to Inspector on every real-layer selection | `useEffect(... setTab('Inspector'), [selectedId])` | SelectionPalettePanel.jsx:51-53 |
| Deep-link events | `kol:open-params`, `kol:open-effects`, `kol:open-pattern` → setTab; `kol:params-subtab` → subtab | SelectionPalettePanel.jsx:55-67; ParametersPanel.jsx:77-81; CanvasArea.jsx:1605-1626; MenuTop.jsx:110 |
| Right rail grid track | `grid-template-columns: 320px minmax(0,1fr) 320px` (editor) | src/editor/styles/kol-editor.css:61 |
| Labs rail track | `--kol-rail-w: var(--kol-sidenav-w)` = 264px (≥1536px: 320px); collapsed 48px | src/editor/styles/kol-labs.css:27-28; node_modules/@kolkrabbi/kol-framework/kol-framework.css:46, :298 |
| Panel skeleton | `div.kol-compose-rail.kol-compose-rail--inspector > div.kol-compose-inspector-body` | ParametersPanel.jsx:60-66; EffectsPanel.jsx:52-59; PatternPanel.jsx:52-59 |
| Body padding / scroll | `padding: 20px 16px; flex: 1; overflow-y: auto; scrollbar-gutter: stable` | kol-editor.css:367-376 |
| Inspector rail inside rail-body | `flex: 1 1 auto; min-height: 0` | kol-editor.css:170-173 |
| Outer scroller | `flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable]` | SelectionPalettePanel.jsx:95 |
| Control size context | `ControlSizeContext` default `'sm'`; only LabsView provides `'md'` | src/editor/params/controlSize.js:26-27; src/editor/labs/LabsView.jsx:509 |
| Rail label column (inline/labs skin only) | `RAIL_LABEL_W = 112` | controlSize.js:44 |
| DS control height ladder | `--kol-ctl-xs/sm/md/lg: 22/26/32/40px`; coarse pointer 32/32/36/40 | node_modules/@kolkrabbi/kol-theme/kol-base-tokens.css:214-217, :221-224 |

## 1. The Generate · Style · Animation strip

| Property | Value | Where |
|---|---|---|
| Component | `SegmentedToggle` from `@kolkrabbi/kol-component` (src/atoms/SegmentedToggle.jsx) | ParametersPanel.jsx:4, :84 |
| Options | `[{generate,'Generate'},{style,'Style'},{anim,'Animation'}]` | ParametersPanel.jsx:45-49 |
| Props | `variant="filled" value={tab} onChange={setTab}` — **no `size`, no `tone`** | ParametersPanel.jsx:84 |
| Resolved size | default `size = 'md'` → 32px (`--kol-ctl-md`), cells `kol-mono-14`, pad 6/16 | SegmentedToggle.jsx:63-64; kol-theme/kol-components-molecules.css:598-613, :624-628 |
| Filled variant chrome | no shell border, `gap: 1px`, transparent cells, active cell `--kol-surface-secondary` + `--kol-fg-emphasis` | kol-components-molecules.css:689-707 |
| Default subtab | `useState('style')` | ParametersPanel.jsx:75 |
| Placement | shape/text/pattern/photo: strip first child of `div.flex.flex-col.gap-4` (ParametersPanel.jsx:150-153); loop/misc/kinetic: strip passed as `tabStrip` prop and rendered INSIDE the panel under the picker stack | ParametersPanel.jsx:131-143; LoopFields.jsx:187; KineticPanel.jsx:242 |
| Effects strip | same `SegmentedToggle variant="filled"` no size, options `Effect · Motion` (`FX_TABS`), default `'effect'` | EffectsPanel.jsx:42-45, :87, :262 |

How it differs from the other segmented controls in the rails:

| Strip | Component / variant / size | Where |
|---|---|---|
| Parameters Generate·Style·Animation | `SegmentedToggle variant="filled"`, size unset → **md 32px / mono-14** | ParametersPanel.jsx:84 |
| Effects Effect·Motion | `SegmentedToggle variant="filled"`, size unset → **md** | EffectsPanel.jsx:262 |
| Kinetic Motion-layers 1·2·3 | `SegmentedToggle variant="filled"`, size unset → **md** | KineticPanel.jsx:502 |
| Inspector Transform cluster | `SegmentedToggle variant="filled" size="sm" value={null}` (stateless) + `[&_.kol-seg-cell]:min-w-0 px-1` | LayerInspector.jsx:79-93 |
| Inspector Resizing | `SegmentedToggle variant="filled" size="sm"` | LayerInspector.jsx:100-111 |
| Typography text/vertical align | `SegmentedToggle variant="filled" size="sm"` (icon labels) | TextPanel.jsx:191-212 |
| Stroke Style | `SegmentedToggle variant="filled" size="sm"`; Cap/Join **no size** (md) | src/editor/color/StrokePanel.jsx:112-114 |
| Alignment panel | `SegmentedToggle variant="filled" size="sm" value={null}` | src/editor/compose/AlignmentPanel.jsx:24-25 |
| Labs Gen·Style·Anim | `SegmentedToggle` **no variant** (default outline strip) `size={cs}` `className={stripClamp(cs)}`; touch labels `Gen·Style·Anim` | LabsParams.jsx:53-66, :400, :435 |
| Labs skin segmented param / Invert | `SegmentedToggle size={cs} className="w-full …stripClamp"` | AutoControls.jsx:255-260; LoopFields.jsx:68 |
| Labs sunken override | `.kol-editor-labs .kol-seg { border-color: transparent }` + active `--kol-surface-sunken` | kol-labs.css:263-270 |
| Editor-skin option pairs | `ViewToggle` (bare buttons, size default `'sm'` → `kol-control-sm kol-mono-12`) not SegmentedToggle | AutoControls.jsx:262-267, :294-299; ViewToggle.jsx:38, :98 |

Net: the Parameters/Effects strips are the only **md (32px)** controls in a rail whose everything else is `'sm'` (26px) — see Contradictions.

## 2. Parameters tab per layer type

Dispatch (`LayerParameters`, keyed `layer.id` so a preset/type change never remounts): ParametersPanel.jsx:64, :89-148.

| layer.type | Generate | Style | Animation | Where |
|---|---|---|---|---|
| none selected | `<Hint>Select a layer to edit its parameters.</Hint>` — `p.kol-placeholder.kol-mono-12.text-meta`, hidden unless `:root[data-kol-placeholders]` | | | ParametersPanel.jsx:65; src/editor/components/Hint.jsx:227-229; kol-theme/kol-utilities.css:110-112 |
| shape (rect/ellipse/triangle/polygon/star/line) | `Button tone="primary" size="sm" w-full` "Convert to path" (Tooltip) | `AutoControls SHAPE_SCHEMA tab="style"` → `Kind` select always; `Sides` (polygon, section Geometry); `Points`+`Inner ratio` (star); `Slope` segmented (line); `Variant` (logo); `Fit` (flatten). **rect / ellipse / triangle: only the Kind dropdown** | `ModulationList` (null unless bound) + `AutoControls tab="anim"` → SHAPE_SCHEMA has no `tab:'anim'` → renders **nothing** (no `emptyHint` passed) | ParametersPanel.jsx:92-106; schemas/shape.js:37-45; AutoControls.jsx:52-57 |
| text | "Apply saved spec" Dropdown (`variant="subtle" size="sm" w-full`, only if library.type non-empty) + Flatten button (disabled unless outline family) | `VariableBlock` (Morph) + AutoControls over `TEXT_SCHEMA` minus `TEXT_TAB_KEYS` → leaves nothing (all 10 keys filtered) | ModulationList + AutoControls anim (none) | ParametersPanel.jsx:245-318, :53; TextPanel.jsx:41-44; schemas/text.js:87-100 |
| pattern | "Apply saved pattern" Dropdown + Flatten | `<Hint>Pattern styling lives in the Pattern tab.</Hint>` | ModulationList + AutoControls anim (PATTERN_SCHEMA has none) | ParametersPanel.jsx:167-234 |
| photo | nothing | AutoControls PHOTO_SCHEMA: `Fit` select; video adds Speed/Trim in/Trim out/Loop/Muted (section Video); webcam `Mirror` (section Camera) | ModulationList + anim (none) | ParametersPanel.jsx:113-125; schemas/photo.js:116-136 |
| loop | LoopFields (generators pack) | | | ParametersPanel.jsx:126-132 |
| misc | LoopFields with `tree={MISC_TREE}` | | | ParametersPanel.jsx:133-137; taxonomy.js:38-40 |
| kinetic | KineticPanel (motion pack) | | | ParametersPanel.jsx:138-143 |
| path | `body = null` → **only the strip renders** | | | ParametersPanel.jsx:144-145 |
| group / bool / other, or pack missing | `<Hint>This layer has no parameters.</Hint>` (returned BEFORE the strip) | | | ParametersPanel.jsx:130, :135, :141, :147 |

### 2a. Loop layer: Type → Category → Preset chain

`LoopPicker` (LoopPicker.jsx:27-106) rendered by LoopFields ABOVE the strip in the editor skin (LoopFields.jsx:183-185); same component also sits in the Inspector's "Preset" pane (LayerInspector.jsx:143-158).

| Row | Label | Rendered when | Options | Where |
|---|---|---|---|---|
| 1 | `Type` | `tree.length > 1 \|\| !parent` | `GENERATIVE_TREE` labels: Scanline · Pattern · Loops · Math · Penrose · Drift · Gradients · Soft Forms · Soft Forms 3D · 3D Scene | LoopPicker.jsx:62-72; taxonomy.js:19-33 |
| 1b | (unlabelled, stacked under Type, `flex flex-col gap-1 w-full`) | `parent.groups.length > 1` | Loops → Simple/Field/Pattern Loops (`shape/field/patternloop`); 3D Scene → Primitive/Ribbon/Forms/Environment/Abstract | LoopPicker.jsx:66, :78-84; taxonomy.js:22, :31-32; registry.js:33-46 |
| 1 (legacy) | read-only `span.kol-helper-12.text-meta.px-1` | group not in tree (optic/paratype/distress/modulator) | `LEGACY_GROUP_LABELS` e.g. `'Pattern · Effects'` | LoopPicker.jsx:73-77; taxonomy.js:48-53 |
| 2 | `Category` | `subs.length > 1` (presets' `sub`) | distinct `p.sub` | LoopPicker.jsx:88-96 |
| 3 | `Preset` | always | presets in current sub | LoopPicker.jsx:97-103 |

Row shape: `PickerRow` → editor: `LabeledControl label` (label-above, `kol-helper-10 tracking-widest text-meta`, `flex flex-col gap-2`); labs/inline: `SettingsRow align="fill" labelWidth={RAIL_LABEL_W}` (uppercased, 112px column). Dropdown = `PickerDropdown` = `Dropdown variant="subtle" size={cs} className="w-full"` (`subtle` is a legacy alias → `primary`). TreePicker.jsx:6-26; LabeledControl.jsx:94-96; SettingsPanel.jsx:120-128; Dropdown.jsx:57.

Pick semantics: any level → `applyPreset` = full param reset (`loopGroup, presetId, presetLabel, loopId, _framePreset/_formPreset/_lookPreset:'custom', ...presetParams(preset)`), type/group/category hops land on the first preset. LoopPicker.jsx:37-58.

LoopFields body per subtab (editor skin, `inline=false`): LoopFields.jsx:172-383

| Subtab | Rows (top→bottom) | Where |
|---|---|---|
| Generate | SoftformsLayers (softforms only) · Look dropdown (if look presets) · `grid grid-cols-2 gap-2` of Theme dropdown / Invert `ViewToggle Off·On` / Background `ViewToggle` (if `loopBgToggleable`) / camera hint `p.kol-mono-10.text-meta.col-span-2` · AutoControls `tab="generate"` · "Randomize preset" (if pool) · `flex gap-2`: "Randomize all" (`flex-1`) + `iconOnly="nav-settings"` + `iconOnly="rotate-left"` (Reset) · scope buttons `grid grid-cols-2 gap-2` (+ "Wild" for math-expression) · `SeedField` · RulesEditor (pattern-rules tiles) | LoopFields.jsx:189-317 |
| Style | AutoControls `tab="style"` · OrganicProfileEditor · CurveEditor · Fit/Reset pair (math-expression) | LoopFields.jsx:319-340 |
| Animation | `span.kol-helper-10.text-meta` "Motion" + Frame/Form dropdowns (if motion tables) · ModulationList · AutoControls `tab="anim"` · KeyframeEditor (scene keyframes) · camera AutoControls (`section:'Camera'`) · CameraPoseSlots | LoopFields.jsx:342-377 |

All LoopFields buttons/dropdowns use `size={cs}` (context, `'sm'` in the editor). LoopFields.jsx:73, :197, :220, :260, :269.

## 3. Effects tab

Storage: `layer.filters: [{ id, key, enabled, params }]`, max `MAX_FILTERS = 8`; params NESTED per stage (not flat); legacy `filterId` + flat params normalised to a one-stage chain. filterChain.js:4-12, :42, :47-52, :101-123. Stages stack; render order is tier order canvas → pixi → one terminal `kind:'engine'` GL stage regardless of array position. filterChain.js:19-24, :157-171.

| Action | Handler | Rule | Where |
|---|---|---|---|
| Add | `addFilter(layerId, filterId)` | refuses at 8; engine appended last (one max); pixi inserted before engine; canvas inserted before first pixi/engine | src/editor/compose/state.jsx:901-928 |
| Remove | `removeFilter(layerId, index)` | | state.jsx:930-934 |
| Enable/disable | `toggleFilter(layerId, index)` | | state.jsx:936-942 |
| Reorder | `moveFilter(layerId, from, to)` | rejected if engine not last afterwards | state.jsx:944-957 |
| Replace | `replaceFilter(layerId, index, filterId)` | keeps `key`+`enabled`, params reset to defaults | state.jsx:971-980 |
| Clear all | top bar "None" → `updateLayer(id, { filters: [] })` | | MenuTop.jsx:112-114, :270-272 |

Panel anatomy (`div.flex.flex-col.gap-4`, EffectsPanel.jsx:193):

| Block | Detail | Where |
|---|---|---|
| Not selected | `<Hint>Select a layer to edit its effect.</Hint>` | EffectsPanel.jsx:57 |
| Not effectable | plain `p.kol-mono-12.text-meta` — `"Engine loops can't host effects yet."` / `"This layer can't host an effect."` (NOT Hint-gated) | EffectsPanel.jsx:123-131; effectHost: effectCategories.js:133-144 |
| Chain list | `div.flex.flex-col.gap-1` of `StageRow`: `flex items-center gap-1 px-2 h-8 rounded`, selected `bg-oq-08`, hover `bg-oq-04`; buttons `Button tone="ghost" quiet size="xs" iconOnly` eye-on/eye-off · name `span.kol-helper-12.flex-1.truncate` · `chevron-down` + `rotate-180` (up) · `chevron-down` (down) · `x` | EffectsPanel.jsx:195-212, :356-384 |
| Add effect (chain non-empty) | `Button tone="primary" size="sm" w-full` "Add effect", `onClick → setSelIdx(null)` (add mode), disabled at 8 with tooltip `Chain is full (8 effects)` | EffectsPanel.jsx:213-221 |
| Add effect (empty chain) | same button, `setAdding(true)`; no pickers until pressed (ruling 2026-08-12) | EffectsPanel.jsx:82-85, :224-228 |
| Picker rows | `PickerRow label="Type"` → **categories** (`catOptions`); `PickerRow label="Category"` → **filters** (`fxOptions`, first entry `{ value:'', label:'None' }`); `PickerRow label="Preset"` only when the filter has a preset param | EffectsPanel.jsx:231-244 |
| Type default | `cat` init = `categoryOf(chain[0]?.id) ?? null`; shown value `catId = categories.some(id===cat) ? cat : categories[0].id` → first flat category = **Halftone** on a fresh add | EffectsPanel.jsx:91, :142-144; effectCategories.js:17 |
| Category default | `fxValue = stage && categoryOf(stage.id)===catId ? stage.id : ''` → **'None'** in add mode | EffectsPanel.jsx:146-152 |
| onPick | stage selected: `''` → removeFilter; other id → replaceFilter. Add mode: addFilter; selection follows the new key via `keysRef` effect | EffectsPanel.jsx:154-162, :97-112 |
| Preset row | `presetParam.options`, value `stage.params[key] ?? default`, write `presetPatchFor(def, v)` (key + `def.presetPatches[v]`) | EffectsPanel.jsx:235-242; effectCategories.js:101-119 |
| Crop note | `span.kol-helper-12.text-meta` "Filters don't apply to cropped photos." when `layer.imgW != null` | EffectsPanel.jsx:246-248 |
| Camera drag | `LabeledControl` + `ViewToggle Off·On` for `stage.def.orbit` (gl-scan) | EffectsPanel.jsx:250-258 |
| Effect tab | AutoControls over `def.params` minus anim minus preset param (no `tab` prop) + `StageRolls tab="effect"` | EffectsPanel.jsx:186-190, :265-266 |
| Motion tab | AutoControls `tab="anim"` + `StageRolls tab="anim"` + `SweepStack` (if `def.sweeps`) | EffectsPanel.jsx:269-277 |
| StageRolls | `flex flex-col gap-2`: `SeedField` · `flex gap-2` "Randomize all"/"Randomize motion" (`flex-1 min-w-0`) + `iconOnly="rotate-left"` · scope buttons `grid grid-cols-2 gap-2`; all `size={cs}` | EffectsPanel.jsx:302-353 |
| SweepStack | header `span.kol-helper-10.text-meta` "Motion" · `PickerDropdown` "Add motion…" · per-sweep card `flex flex-col gap-2 p-2 rounded bg-oq-04` with eye button `size="xs"`, shape/target PickerDropdowns, Slider rows in `LabeledControl` · "Add custom sweep" `iconLeft="plus" iconSize={12}` | EffectsPanel.jsx:392-473 |

Stage param plumbing: `paramsView = { ...layer, ...stage.params, id }`; writes rebuild `filters` via `edit.patch` (coalesced history); `cameraDrag` is the one host-level key. EffectsPanel.jsx:170-181.

### 3a. Effect TYPES (effectCategories.js) and their members

Catalog order: `FILTERS = [glass, scanline, dither, ...RADAR_FX, ascii, halftoneDither, bitmap, ...EFFECTS_FX, ...GL_FILTERS, ...PIXI_FILTERS]` src/filters/index.js:174-189.

| Type (nav category) | id | Members (label · id) | Where |
|---|---|---|---|
| Halftone | `halftone` | Dither · fx-halftone-dither; ASCII · fx-ascii; Bitmap · fx-bitmap | effectCategories.js:17; fxHalftoneDither.js:166-167; fxAscii.js:66-67; fxBitmap.js:162-163 |
| Scanline | `scanline` | Scanline · scanline | effectCategories.js:18; scanline.js:58-59 |
| CRT | `crt` | Disco · gl-disco; Slitscan · gl-slitscan; Rutt-Etra · gl-scan; Trails · gl-trails (all `kind:'engine'`) | effectCategories.js:21; gl/catalog.js:34, :63, :99, :116 |
| Refraction | `refraction` | Lens · gl-lens; Distortion · gl-distort (engine); RGB Split · fx-chromatic; Glass · glass | effectCategories.js:23; gl/catalog.js:152, :186; fxRadar.js:241-242; glass.js:251-252 |
| FX rack (stub, `rack:true`, `filters:[]`, spliced at index 4) | `fx-rack` | expanded by `flatCategories` into FX_RACK_GROUPS below | effectCategories.js:68-79, :148-155 |
| Pattern | `pattern` | Dither · dither (reaction-diffusion) | effectCategories.js:25; dither.js:74-75 |
| Other | `other` | any non-pixi filter no category claims | effectCategories.js:76-77 |

FX_RACK_GROUPS (effectCategories.js:31-44): canvas ids + the pixi tier by `group`:

| Rack category | label | canvas filterIds | pixiGroup |
|---|---|---|---|
| color-adjustments | Color Adjustments | fx-hsl, fx-hsv, fx-brightness, fx-contrast, fx-rgb, fx-invert, fx-sepia, fx-grayscale, fx-enhance | color-adjustments |
| blur-sharpen | Blur/Sharpen | fx-blur, fx-sharpen | blur-sharpen |
| distortion | Distortion | — | distortion |
| artistic | Artistic Effects | fx-pixelate, fx-posterize, fx-solarize, fx-emboss, fx-noise | artistic |
| lighting | Lighting | — | lighting |
| stylize | Stylize | — | stylize |
| utility | Utility | fx-threshold | utility |
| post-processing | Post-Processing | fx-rgb, fx-edge, fx-posterize, fx-pixelsort, fx-mirror, fx-kaleido, fx-threshold | — |

Pixi defs (`kind:'pixi'`, 35, src/filters/pixi/defs.js:42-254) e.g. Adjustment, HSL Adjustment (color-adjustments); Radial/Zoom/Motion/Kawase/Backdrop Blur, Tilt Shift (blur-sharpen); Displacement Map, Twist, Bulge/Pinch, Shockwave (distortion); ASCII, Cross Hatch, Dot Screen, CRT, Old Film, Glitch, RGB Split, Simplex Noise (artistic); Bloom, Advanced Bloom, Glow, God Ray, Simple Lightmap (lighting); Bevel, Drop Shadow, Outline, Reflection (stylize); Convolution (utility). Note duplicate labels across tiers: pixi `ASCII`/`RGB Split`/`CRT` vs canvas `ASCII` (fx-ascii), `RGB Split` (fx-chromatic), nav type `CRT` (defs.js:132, :178, :142; fxAscii.js:67; fxRadar.js:242; effectCategories.js:21).

Preset param per filter (hierarchy level 4): fx-halftone-dither→`mode` (Halftone/Inverse halftone/Static (flat)/…, fxHalftoneDither.js:113-120, :172), fx-ascii→`algorithm` (fxAscii.js:72), fx-bitmap→`palette` (Drekker/Sunset/Ice/Mono, fxBitmap.js:38-43, :179), glass→`pattern` (13 patterns + `presetPatches`, glass.js:46-125, :146, :254-256), scanline→`look`, dither→`palette` (dither.js:81), gl-lens→`type` ('Surface', gl/catalog.js:189). effectCategories.js:101-109.

### 3b. Top-bar Effects menu → handlers

| Item | Handler | Where |
|---|---|---|
| (no target) `div.kol-mono-10.text-subtle` "Select a layer to apply an effect" | — | MenuTop.jsx:266-268 |
| None | `clearEffect` → `updateLayer(fxTarget.id, { filters: [] })` | MenuTop.jsx:112-114, :270-272 |
| Nest per `effectCategories(fxOptions)` minus `other`/`pattern`: Halftone, Scanline, CRT, Refraction, **FX rack** | item → `applyEffect(f)` = `addFilter(id, f.id)` + dispatch `kol:open-effects`; check icon if already in chain | MenuTop.jsx:107-111, :274-285 |
| FX rack nest | `c.filters` is `[]` for the rack stub (unflattened `effectCategories`, not `flatCategories`) → **nest renders with zero items** | MenuTop.jsx:27, :274-285; effectCategories.js:75; packs/effects.js:8-11; MenuItem.jsx:167-195 |
| Pattern nest | (a) `pattern` category filters → `applyEffect` (Dither, needs fx target); (b) `FX_PATTERN_CATEGORIES` Moiré / Mesh Gradient / Reaction / Halftone → `presetsInSub(group, sub)` → `addGenerative(p, group)` = `addLayer('loop', {...})` — **inserts a loop layer**, no target needed | MenuTop.jsx:160-167, :289-314, :120-128 |

So "Pattern" in the Effects menu is two things: one filter (reaction-diffusion `dither`) and four generator sub-buckets of the `optic` / `gradients` loop groups (which the loop picker hides: taxonomy.js:14-17, :48-49). Elsewhere "Pattern" is also: a layer type with its own rail tab (SelectionPalettePanel.jsx:41; PatternPanel.jsx), a Generative TYPE (taxonomy.js:21 → group `pattern`), a registry group label (registry.js:35), a left-rail mode (`src/editor/modes/pattern/`), the glass filter's preset param + section (glass.js:256), and a scope "Pattern" in the context menu "Pattern parameters" (CanvasArea.jsx:1621).

## 4. AutoControls row anatomy

Grammar: `type` ∈ range | color | select | segmented | toggle | text; `tab` ∈ generate|style|anim (default style; `tab:'color'` → style + section Color); `section` header; `when`; `animatable` default true for range/color. schema.js:11-25, :45-52.

Grouping: consecutive same-`section` params → one `LabeledControlSection divided` (`flex flex-col gap-3`; eyebrow `p.kol-eyebrow.text-fg-80` 12px/500; rows `flex flex-col gap-2`; sibling hairline `border-top: 1px solid var(--kol-oq-08)`). Header dropped when it equals the first param's label. Sectionless group split after a leading run of selects (the "picking cluster"). AutoControls.jsx:58-81, :99-104; SettingsPanel.jsx:155-162; kol-components-molecules.css:1004-1005.

Row wrapper (editor skin, `inline=false`, cs `'sm'`): `LabeledControl` label-above = `div.flex.flex-col.gap-2` + `span.kol-helper-10.tracking-widest.text-meta` (sentence case; `labelWidth` ignored when not inline). Labs skin (`inline`): `SettingsRow` = `LabeledControl inline` with label `.toUpperCase()`, `labelWidth={RAIL_LABEL_W}` (112), `align` 'fill' (control `inline-flex w-full`) or 'end' (`justify-end`). AutoControls.jsx:330-332; LabeledControl.jsx:79-96; SettingsPanel.jsx:120-128.

| Row kind | Control | Editor-skin layout | Widths / sizes | Where |
|---|---|---|---|---|
| Slider (`range`) | `RangeField`: `div.flex.items-center.gap-3` → DS `Slider readout="none" className="flex-1"` + `Input type="text" variant="filled" size={cs} chars={5} inputClassName="text-center"` | label above (`LabeledControl`); on touch (`cs !== 'sm'`) also label above; `hint` = `p.format(value)` after label | slider `flex-1`; input `size=5` attr (chars→HTML size); bound → slider disabled, box shows expression | AutoControls.jsx:134-200, :228-238, :318; Input.jsx:215 |
| Slider row (`control-slider`) | DS row is `inline-flex … gap-3 height: 24px` | | | Slider.jsx:320-326; kol-components-atoms.css:613-621 |
| Dropdown (`select`) | `Dropdown variant="subtle" size={cs} className="w-full"` | label above (both skins per comment, but code: inline→SettingsRow fill) | full width; trigger height `--kol-ctl-sm` 26 | AutoControls.jsx:239-247; Dropdown.jsx:151 |
| Colour (`color`) | `div.flex.items-end.gap-2` → `div.flex-1.min-w-0` `ColorField` + animate dot | ColorField editor row: `LabeledControl label` + `div.flex.items-center.gap-2` [swatch `ColorSwatch size=32` + `Input variant="filled" size={cs} prefix="#" chars={6}`] | swatch 32px (editor) / 24 (inline) / `control-sm` (paint bar) | AutoControls.jsx:213-221; ColorField.jsx:274, :289-302, :316-324 |
| Toggle (`toggle`, no `labels`) | `ToggleSwitch size={cs}` | `LabeledControl inline labelWidth="auto"` → label left (flex-1 truncating), switch hugs right | switch shell 26 at sm | AutoControls.jsx:275-279, :324-332; ToggleSwitch.jsx:10-11 |
| Toggle with `labels` (e.g. Clip/Visible) | editor: `ViewToggle size={cs}` label above; labs: `SegmentedToggle size={cs} w-full stripClamp` | | | AutoControls.jsx:280-300; schemas/pattern.js:66 |
| Segmented | editor `ViewToggle`; labs `SegmentedToggle w-full` | label above | | AutoControls.jsx:248-268 |
| Text | `Textarea variant="filled" size={cs} rows={p.rows ?? 2} axis="y"` | label above in both skins | | AutoControls.jsx:302-313 |
| Seed | `SeedField`: `NumberField` (= `Input type="number"`) `variant="filled" size={cs} chars={10}`; editor `LabeledControl label="Seed"`, labs `SettingsRow … labelWidth={RAIL_LABEL_W}` | label above | 10 chars | rolls.jsx:177-196; NumberField.jsx:21-33 |
| Animate dot | `renderAnimate(p)` → `BindDot` beside control: `div.flex.items-center.gap-2 > div.flex-1.min-w-0 {control} {dot}`; dot hidden unless modulate mode `M` or bound | | | AutoControls.jsx:107, :319-321; BindDot.jsx:23-36 |

`stripClamp(cs)` = `[&_.kol-seg-cell]:min-w-0 … px-1 … overflow-hidden` only for rungs above `'sm'`. controlSize.js:38-39.

## 5. What shifts when a Type / Category is picked

| Surface | Trigger | What changes | Container / min-height | Where |
|---|---|---|---|---|
| Parameters → loop | any LoopPicker level → `applyPreset` (layer write, same `layer.id`) | `LayerParameters` NOT remounted (key = layer.id) so the subtab persists; `schema = loop.params` swaps → AutoControls rows regenerate; picker row count changes 2–4 (second Type dropdown only for Loops/3D Scene; Category only when `subs.length > 1`) so the strip itself moves | `div.flex.flex-col.gap-4` (ParametersPanel.jsx:151), **no min-height** anywhere; height = content; body scrolls with `scrollbar-gutter: stable` so width does not jump | LoopPicker.jsx:37-58, :62-96; ParametersPanel.jsx:64, :150-155; kol-editor.css:367-376 |
| Parameters → kinetic | TreePicker → `applyPreset` → whole comp replaced | Elements list + knob rows regenerate; strip stays below the Elements block | same gap-4 column | KineticPanel.jsx:122-127, :226-242 |
| Effects → Type | `setCat` (panel state only, no layer write) | only the Category dropdown's options change; shown Category value flips to 'None' if the selected stage lives elsewhere | `div.flex.flex-col.gap-4` (EffectsPanel.jsx:193), no min-height | EffectsPanel.jsx:89-91, :142-152, :233 |
| Effects → Category (add mode) | `addFilter` → chain grows → `keysRef` effect selects new stage + snaps `cat` | a `StageRow` (h-8) appears above, "Add effect" button appears, Preset row may appear, then the Effect·Motion strip + param sections + StageRolls appear below → everything under the pickers pushes down | | EffectsPanel.jsx:97-112, :195-221, :235-279 |
| Effects → Category (stage selected) | `replaceFilter` | param rows swap in place; Preset row appears/disappears | | EffectsPanel.jsx:154-158 |
| Effects → 'None' | `removeFilter` → selection clamps; at 0 stages `adding` stays false → pickers vanish, only "Add effect" remains | | EffectsPanel.jsx:85, :110, :224-228 |
| Labs skin only | picker stack renders only on the Generate tab (inside `LabeledControlSection divided`) | | | LoopFields.jsx:179-185 |

## Contradictions

| # | Topic | Side A | Side B |
|---|---|---|---|
| 1 | Tab-strip size rung in a `'sm'` rail | Parameters/Effects/Kinetic strips: `SegmentedToggle variant="filled"` with **no size → md 32px** (ParametersPanel.jsx:84; EffectsPanel.jsx:262; KineticPanel.jsx:502; SegmentedToggle.jsx:63) | Rail is `'sm'` (controlSize.js:9, :26); every other inspector strip passes `size="sm"` (LayerInspector.jsx:81, :102; TextPanel.jsx:192, :203; AlignmentPanel.jsx:24; StrokePanel.jsx:112) |
| 2 | Strip variant | Editor strips `variant="filled"` (ParametersPanel.jsx:84) | Labs strips for the same three tabs: no variant, `size={cs}` + `stripClamp` (LabsParams.jsx:400, :435) |
| 3 | Label column width | `RAIL_LABEL_W = 112` (controlSize.js:44) | Comments still say 96: AutoControls.jsx:230 "the 96px label column"; LoopFields.jsx:204 "a 96px label column" |
| 4 | Section-header type class | AutoControls sections: `kol-eyebrow text-fg-80` (SettingsPanel.jsx:158; AutoControls.jsx:45-49 says `kol-helper-10 … text-meta` "the estate stopped writing") | Hand-written headers still `span.kol-helper-10.text-meta`: LoopFields.jsx:346 "Motion"; KineticPanel.jsx:229, :309, :317, :499; EffectsPanel.jsx:412; ModulationList ModulationEditor.jsx:279; SoftformsLayers.jsx:195, :263, :283; ParatypeTools.jsx:67; CameraPoseSlots.jsx:44; TextPanel.jsx:334 uses `kol-eyebrow text-meta` |
| 5 | Boolean control | AutoControls: "ONE LOOK FOR A BOOLEAN … ToggleSwitch … in EVERY skin" (AutoControls.jsx:270-279) | Off·On `ViewToggle` pairs: LoopFields.jsx:69 (Invert/Background), LayerInspector.jsx:155 (Background), KineticPanel.jsx:263 (Invert), EffectsPanel.jsx:252 (Camera drag), TextPanel.jsx:346, :226 (Morph, Italic) |
| 6 | Button size literal vs context | `size="sm"` literals: ParametersPanel.jsx:94, :205, :214, :281, :293; EffectsPanel.jsx:215, :225; PatternPanel.jsx:138, :163, :166, :183; SoftformsLayers.jsx:216-290 | `size={cs}` in the same panels: LoopFields.jsx:260-277; EffectsPanel.jsx:332-345, :468; KineticPanel.jsx:236-280 |
| 7 | List-row icon button rung | Effects StageRow `size="xs"` (22px) (EffectsPanel.jsx:360) | Kinetic ElementList `size={cs}` (26) (KineticPanel.jsx:415-420); SoftformsLayers rows `size="sm"` (SoftformsLayers.jsx:216-235) |
| 8 | "Move up" glyph | `iconOnly="chevron-down"` + `className="rotate-180"` (EffectsPanel.jsx:379) | `<Icon name="chevron-down" style={{transform:'rotate(180deg)'}}>` from `@kolkrabbi/kol-icons` directly (KineticPanel.jsx:446); `chevron-up` exists in kol-icons (cuts.json) and is used by neither |
| 9 | Spelling | "Randomize all/preset/motion" (LoopFields.jsx:265, :270; EffectsPanel.jsx:334; PatternPanel.jsx:139); scope label "Color" ruling (rolls.jsx:36) | "Randomise", "Randomise forms", "Text colour" (KineticPanel.jsx:278, :271; SoftformsLayers.jsx:283) |
| 10 | Empty-state mechanism | `Hint` → `.kol-placeholder`, hidden by default (ParametersPanel.jsx:65, :130; EffectsPanel.jsx:57; Hint.jsx:227; kol-utilities.css:110) | Plain always-visible `p.kol-mono-12.text-meta`: EffectsPanel.jsx:125-129; PatternPanel.jsx:57 |
| 11 | Picker row labels vs contents | Effects "Type" row holds `catOptions`, "Category" row holds filters (`fxOptions`) (EffectsPanel.jsx:233-234, :143-149) | LoopPicker "Type" holds tree types, "Category" holds preset `sub`s (LoopPicker.jsx:63, :91) — same words, one level apart in the data they bind |
| 12 | FX rack in two menus | Effects panel Type dropdown lists the 8 rack categories flat via `flatCategories` (EffectsPanel.jsx:142; effectCategories.js:148-155) | Top-bar Effects menu nests "FX rack" with `filters: []` → empty (MenuTop.jsx:274-285; effectCategories.js:75) |
| 13 | CRT membership (docs vs code) | effectCategories.js:19-21 `crt: gl-disco, gl-slitscan, gl-scan, gl-trails` (kaleido/mirror → Post-Processing) | docs/documentation/04-effects/06-effects-panel.md table: CRT includes `fx-kaleido · fx-mirror` |
| 14 | Storage field name (docs vs code) | `layer.filters[]` (filterChain.js:4) | docs/documentation/01-hierarchy/INDEX.md: EFFECT lives in "`filterId` stages on a layer" |
| 15 | Rack labels (docs vs code) | 'Blur/Sharpen', 'Artistic Effects', plus 'Post-Processing' (effectCategories.js:33, :37, :43) | 01-hierarchy/INDEX.md: "Blur & Sharpen · … Artistic …" seven buckets, no Post-Processing |
| 16 | Default subtab | Editor Parameters opens on `'style'` (ParametersPanel.jsx:75) | Labs generative/kinetic and mobile open on `'generate'` (LabsParams.jsx:365, :415; MobileOverlay.jsx:164) |
| 17 | Loop picker lives twice | Inspector "Preset" pane renders `LoopPicker` + Background ViewToggle (LayerInspector.jsx:143-158) | Parameters tab renders the same `LoopPicker` + Background OnOff (LoopFields.jsx:185, :244-248) |
| 18 | Mini-slider label width | VariableBlock cp sliders: `span.kol-helper-10.text-meta` `width: 32` (TextPanel.jsx:318) | Rail label column 112 (controlSize.js:44); MetricRow uses Slider's own `kol-helper-12` label (TextPanel.jsx:449; Slider.jsx:258) |
| 19 | Dropdown `variant="subtle"` | every rail dropdown passes `variant="subtle"` (TreePicker.jsx:8; AutoControls.jsx:242; LoopFields.jsx:197) | Dropdown resolves `subtle → primary` as a legacy alias (Dropdown.jsx:28-30, :57) |
| 20 | Scanline preset param | `PRESET_PARAM.scanline = 'look'` (effectCategories.js:106) and docs 06-effects-panel.md table list `scanline → look` | scanline.js:58-89 defines no `look` param (scanline.js:11 comment: "mirrors the scanline LOOP's param set instead of locking curated looks") → `presetParam` is undefined and the scanline stage never shows a Preset row (EffectsPanel.jsx:186-187, :235) |

## Open questions

- Is the md (32px) tab strip inside a 26px rail deliberate (a "tab" is not a "control") or an omission? No comment in ParametersPanel.jsx:84 or EffectsPanel.jsx:262 says either.
- Does `MenuDropdownNest` with no children intentionally render as a dead row for "FX rack" (MenuTop.jsx:274-285)? Nothing guards it; the mobile sheet was not read.
- Text layer Style tab: `TEXT_PARAMS_SCHEMA` filters out all 10 TEXT_SCHEMA keys (ParametersPanel.jsx:53; TextPanel.jsx:41-44), so only `VariableBlock` remains — is an all-filtered schema intended or stale?
- Shape layers' Animation subtab renders nothing (no `tab:'anim'` params, no `emptyHint`) — is the blank tab accepted or should the strip hide `Animation` for shape/photo/path?
- `path` layer shows a bare strip with `body = null` (ParametersPanel.jsx:144-145) — placeholder for future params or leftover?
- `LabeledControl` `labelWidth` is passed in the editor skin (AutoControls.jsx:332) but ignored unless `inline` (LabeledControl.jsx:69-91) except for `plainBool` — intended?
- Which `kol-icons` cut/size `Button iconOnly` resolves at `size="xs"` vs the hand-rotated `Icon size={12}` (KineticPanel.jsx:446) — rendered pixel sizes not verified here.
- The mobile Effects sheet (src/editor/mobile/MobileOverlay.jsx:366-374) was not mapped; whether it shares the Type/Category defaults above is unverified.
