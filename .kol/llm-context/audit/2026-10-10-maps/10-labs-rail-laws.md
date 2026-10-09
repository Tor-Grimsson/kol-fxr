# 10 — Labs rail laws (one row · one label voice · one strip · one size per breakpoint)

Scope: `src/editor/labs/LabsParams.jsx`, `LabsView.jsx`, `src/editor/styles/kol-labs.css` (there is no `src/editor/labs/*.css`; LabsView imports `../styles/kol-labs.css` at `src/editor/labs/LabsView.jsx:1`), `src/editor/params/AutoControls.jsx`, `controlSize.js`, `src/editor/morph/MorphTab.jsx`, `src/editor/compose/inspectors/LoopFields.jsx`, and the sub-editors they mount. Installed DS: kol-component 0.246.0, kol-theme 0.171.0, kol-shell 0.63.0, kol-framework 0.49.0, kol-icons 0.34.0 (`node_modules/@kolkrabbi/*/package.json`).

The labs skin is the `inline` flag: `AutoControls … inline` (`src/editor/labs/LabsParams.jsx:252`), `LoopFields … inline` (`:405`, `src/editor/morph/MorphTab.jsx:187`), `StageRolls inline` (`LabsParams.jsx:264,283`), `SweepStack … inline` (`:216,288`), `LoopPicker … inline` (`LoopFields.jsx:184`). Everything below is what `inline` selects.

## 1. The row primitive

| Part | Measured value | Where |
|---|---|---|
| Component | `SettingsRow` from `@kolkrabbi/kol-component` | `node_modules/@kolkrabbi/kol-component/src/organisms/SettingsPanel.jsx:120`; export `node_modules/@kolkrabbi/kol-component/src/index.js:187` |
| Signature | `SettingsRow({ label, hint, align = 'end', labelWidth = 160, children })` | `SettingsPanel.jsx:120` |
| Renders | `<LabeledControl inline label={label.toUpperCase()} labelWidth>` → control in `<span className="inline-flex w-full {justify-end unless align==='fill'}">`; `hint` becomes a DS `Tooltip`, not text | `SettingsPanel.jsx:122-125` |
| Casing | **by string**: `typeof label === 'string' ? label.toUpperCase() : label` | `SettingsPanel.jsx:122` |
| Row box | `flex items-center gap-3` | `node_modules/@kolkrabbi/kol-component/src/molecules/LabeledControl.jsx:79` |
| Label cell | `kol-helper-10 tracking-widest text-meta shrink-0`, `style={{ width: labelWidth }}` | `LabeledControl.jsx:82-83` |
| Label type | mono 10px / line-height 1 / weight 500 / letter-spacing 0.10em (`.kol-helper-10`) | `node_modules/@kolkrabbi/kol-theme/kol-type-mono-classes.css:106-112` |
| Control cell | `flex-1 min-w-0` | `LabeledControl.jsx:88` |
| Label column in the labs rail | `RAIL_LABEL_W = 112` ("96 wrapped ORIGINAL COLOR onto two lines (2026-10-06)") | `src/editor/params/controlSize.js:44` |
| Who passes 112 | `INLINE_LABEL_W = RAIL_LABEL_W` → `labelWidth={INLINE_LABEL_W}` | `src/editor/params/AutoControls.jsx:205,331,332` |
| | `Row` → `labelWidth={RAIL_LABEL_W}` | `src/editor/compose/inspectors/LoopFields.jsx:57` |
| | `PickerRow` → `labelWidth={RAIL_LABEL_W}` | `src/editor/compose/inspectors/TreePicker.jsx:24` |
| | `SeedField` → `labelWidth={RAIL_LABEL_W}` | `src/editor/params/rolls.jsx:194` |
| Alignment rule | `align = p.type === 'toggle' && !p.labels ? 'end' : 'fill'` — only a bare switch sits at the right edge | `AutoControls.jsx:324` |
| | LoopFields `Row` default `align = 'fill'`; TreePicker and SeedField hard-code `align="fill"` | `LoopFields.jsx:55`, `TreePicker.jsx:24`, `rolls.jsx:194` |
| Row height | not pinned by the row; `items-center` + the control rung: `--kol-ctl-sm: 26px`, `--kol-ctl-md: 32px`, `--kol-ctl-lg: 40px` | `LabeledControl.jsx:79`; `node_modules/@kolkrabbi/kol-theme/kol-base-tokens.css:214-218` |
| Row stack gap | `LabeledControlSection` rows `flex flex-col gap-2` (`gap-1` when `rowGap === 1`) | `SettingsPanel.jsx:159` |
| Rail body inset | `padding: 20px 16px` on `.kol-compose-inspector-body` | `src/editor/styles/kol-editor.css:367-368` |
| Surface column gap | `flex flex-col gap-5` (Surface), `gap-5` (MorphTab) | `LabsParams.jsx:108`; `MorphTab.jsx:161` |

Row fallbacks inside the labs skin (still "one label voice" by uppercasing the string):

| Case | Rule | Where |
|---|---|---|
| Range on touch | `if (cs !== 'sm') rowInline = false` → label above, slider takes the width | `AutoControls.jsx:234` |
| Textarea (`text`) | `rowInline = false` | `AutoControls.jsx:303` |
| Label-above in labs | `label={inline ? String(p.label).toUpperCase() : p.label}` on `LabeledControl` (non-inline: `flex flex-col gap-2`, label `kol-helper-10 tracking-widest text-meta`) | `AutoControls.jsx:332`; `LabeledControl.jsx:94-96` |
| Plain bool, editor skin | `LabeledControl inline` with `labelWidth 'auto'` | `AutoControls.jsx:329,332` |

Rows in the labs rail that are NOT `SettingsRow` (the row primitive is not universal — see Contradictions):

| Row | What it is | Where |
|---|---|---|
| Color param | own `flex items-center gap-3`: 24px swatch · `<span className="kol-eyebrow text-meta whitespace-nowrap">{label}</span>` · `flex-1` spacer · hex `Input chars={6} prefix="#"` — no 112 column, uppercase by CSS | `src/editor/compose/inspectors/ColorField.jsx:109-120`, `:94-106`, `:78` (`size={inline ? 24 : 32}`) |
| Sweep sliders (Motion tab) | `Row` = `flex items-center gap-3` + `<span className="kol-helper-10 tracking-widest text-meta whitespace-nowrap">` (sentence-case as authored, no width) + `Slider` | `src/editor/compose/inspectors/EffectsPanel.jsx:401-407` |
| Sweep card header | `kol-helper-10 tracking-widest` + `ToggleSwitch size={cs}` | `EffectsPanel.jsx:428-434` |
| Frame / Form / Theme / Look / Invert / Background | `Row inline` → SettingsRow (conforming) | `LoopFields.jsx:210-229,347-362` |
| "Motion" heading in Animation tab | bare `<span className="kol-helper-10 text-meta">Motion</span>` | `LoopFields.jsx:346` |
| Modulation list | heading `kol-helper-10 text-meta`; per-param `kol-helper-12 text-emphasis` + source `kol-helper-10 text-meta`; editor rows `LabeledControl label="Range"` label-above | `src/editor/params/ModulationEditor.jsx:279,284-286,187` |
| Kinetic surface | no `inline` passed at all → `LabeledControl label="Text"`, Theme/Invert in `grid grid-cols-2 gap-2`, `ViewToggle` for Invert, `kol-helper-10 text-meta` headings | `LabsParams.jsx:436-441`; `src/editor/compose/inspectors/KineticPanel.jsx:246,253-268,229,309,317,499` |
| Soft Forms (Generate) | `kol-helper-10 text-meta` headings, `LabeledControl` label-above rows | `src/editor/compose/inspectors/SoftformsLayers.jsx:195,263-277,283` (mounted `LoopFields.jsx:193`) |
| Para Type explore | `kol-helper-10 text-meta` "Explore", `LabeledControl label="X axis"` | `src/editor/compose/inspectors/ParatypeTools.jsx:67-82` (mounted `LoopFields.jsx:381`) |
| Camera pose slots | `kol-helper-10 text-meta` "Camera" | `src/editor/compose/inspectors/CameraPoseSlots.jsx:44` (mounted `LoopFields.jsx:374`) |
| Rules editor | `LabeledControl label={\`Rules · ${n}\`}` | `src/editor/compose/inspectors/RulesEditor.jsx:44` (mounted `LoopFields.jsx:314`) |
| Legacy loop identity | `<span className="kol-helper-12 text-meta px-1">` inside a PickerRow | `src/editor/compose/inspectors/LoopPicker.jsx:70` |

## 2. The control size group

| Fact | Value | Where |
|---|---|---|
| Context | `ControlSizeContext = createContext('sm')`; `useControlSize()` | `src/editor/params/controlSize.js:26-27` |
| Desktop | no provider → `'sm'` (26px, mono-12) | `controlSize.js:8,26` |
| Touch / narrow | `<ControlSizeContext.Provider value="md">` wraps `EditorShell registry={LABS_REGISTRY_TOUCH}` | `src/editor/labs/LabsView.jsx:509-511` |
| Touch predicate | `touch = (isMobileDevice() && !wantsDesktop()) \|\| narrow`; `narrow = useBelow(LABS_BELOW)` (1024) | `LabsView.jsx:345-346` |
| Why md not lg | "md is the one rung where the DS's ladders agree … all 32px on mono-14" | `controlSize.js:15-21` |
| DS ladder | `--kol-ctl-xs/sm/md/lg: 22/26/32/40px`; coarse pointer: `32/32/36/40` | `kol-base-tokens.css:214-218,220-225` |
| Labs touch opt-out | `.kol-editor-labs[data-touch] { --kol-ctl-md: 32px }`; btn-md / control-md / seg-cell / menu-btn `font-size: 14px; line-height: 18px` | `src/editor/styles/kol-labs.css:238-244` |
| Input floor off | `.kol-editor-labs[data-touch] .kol-control input … { font-size: 14px; line-height: 18px }`, `height: 18px` | `kol-labs.css:221-231` |
| iOS zoom closed instead by | `maximum-scale=1` | `index.html:21` |
| Strip clamp | `STRIP_CLAMP = '[&_.kol-seg-cell]:min-w-0 [&_.kol-seg-cell]:px-1 [&_.kol-seg-cell]:overflow-hidden [@media(hover:none)]:[&_.kol-seg-cell:hover:not(.is-active)]:text-[var(--kol-oq-48)]'`; `stripClamp(cs) = cs === 'sm' ? undefined : STRIP_CLAMP` | `controlSize.js:38-39` |
| Touch tab labels | `GEN_TABS_TOUCH` = Gen · Style · Anim, picked by `cs === 'sm' ? GEN_TABS : GEN_TABS_TOUCH` | `LabsParams.jsx:61-65,400,435,468` |

Files that read the context: `AutoControls.jsx:9`, `LoopFields.jsx:26`, `TreePicker.jsx:2`, `rolls.jsx:9`, `ColorField.jsx:4`, `EffectsPanel.jsx` (StageRolls `:303`, SweepStack `:393`), `KineticPanel.jsx:17`, `LabsParams.jsx:26`, `LabsSourcePicker.jsx:8`, `MorphTab.jsx:11`, `TransportFab.jsx`, `EditorFooter.jsx:16`.

### Size literals under `src/editor` (grep `size="sm|md|lg|xs"`)

"Rail?" = rendered inside the labs right rail (desk) / sheet (touch), inside the editor's right rail, or inside the left-rail colour panels. Labs rail reaches these through `LabsParams → LoopFields/EffectsPanel/…` and `right.footer → EditorFooter` (`LabsView.jsx:317,320`).

| File:line | Literal | Rail? |
|---|---|---|
| `src/editor/labs/LabsParams.jsx:77` | `Tag size="xs"` (para-type pills) | labs rail |
| `src/editor/labs/LabsParams.jsx:317` | `Button … size="xs" iconOnly="x"` (StackCards) | labs rail |
| `src/editor/labs/LabsView.jsx:269` | `Button tone="ghost" quiet size="sm"` "Catalog" | labs TOUCH sheet header — inside the `'md'` provider (`:509`) |
| `src/editor/params/ModulationEditor.jsx:189,195` | `Input … size="sm" chars={5}` | labs rail (Animation tab via `LoopFields.jsx:365`) and editor Parameters tab |
| `src/editor/params/ModulationEditor.jsx:230` | `Input variant="ghost" size="sm"` | same |
| `src/editor/params/ModulationEditor.jsx:249,256` | `Button tone="outline" size="sm"` | same |
| `src/editor/params/AudioInputRow.jsx:61` | `SegmentedToggle variant="filled" … size="sm"` | rail FOOTER (`EditorFooter.jsx:348`), labs `right.footer` |
| `src/editor/shell/panels/EditorFooter.jsx:260` | `Button tone="ghost" size="md" iconOnly` (collapsed fold) | labs rail footer; the open footer uses `size={cs}` (`:300,305,309`) |
| `src/editor/compose/inspectors/SoftformsLayers.jsx:216,223,229,235,246,254,266,285-290` | `size="sm"` buttons / dropdown | labs rail (Generate, softforms) + editor |
| `src/editor/compose/inspectors/ParatypeTools.jsx:33,71,78` | `size="sm"` | labs rail (`LoopFields.jsx:381`) + editor |
| `src/editor/compose/inspectors/CameraPoseSlots.jsx:49,55` | `size="sm"` | labs rail (`LoopFields.jsx:374`) + editor |
| `src/editor/compose/inspectors/RulesEditor.jsx:56,59` | `size="sm"` | labs rail (`LoopFields.jsx:314`) + editor |
| `src/editor/compose/inspectors/EffectsPanel.jsx:360,439,449` | `Button … size="xs" iconOnly` (sweep cards) | labs rail (SweepStack) + editor |
| `src/editor/compose/inspectors/EffectsPanel.jsx:215,225` | `Button … size="sm"` "Add effect" | editor Effects tab only |
| `src/editor/compose/inspectors/ColorField.jsx:153,158` | `Tag size="xs"` (popover) | labs rail + editor |
| `src/editor/compose/inspectors/LayerInspector.jsx:81,101` | `SegmentedToggle variant="filled" size="sm"` | editor inspector |
| `src/editor/compose/inspectors/LayerInspector.jsx:178,256,287,305,372,379,387,495` | `Button size="sm"` / `"xs"` (`:256`) | editor inspector |
| `src/editor/compose/inspectors/LayerInspector.jsx:226,235,409` | `NumberField variant="property" size="sm"` | editor inspector |
| `src/editor/compose/AlignmentPanel.jsx:24,25` | `SegmentedToggle variant="filled" size="sm"` | editor inspector (Transform pane, `LayerInspector.jsx:56`) |
| `src/editor/compose/InspectorRail.jsx:36` | `Button size="sm"` | editor inspector (multi-select) |
| `src/editor/compose/inspectors/ParametersPanel.jsx:94,205,214,281,293` | `size="sm"` | editor Parameters tab |
| `src/editor/compose/inspectors/CanvasInspector.jsx:47,78,106` | `size="sm"` (`:78` `chars={4} suffix="%"`) | editor inspector (canvas) |
| `src/editor/compose/inspectors/TextPanel.jsx:140,150,160,192,203,249,371,385,408,416` | `size="sm"` | editor inspector (Typography pane) |
| `src/editor/color/ColourPanel.jsx:117` | `Dropdown size="sm" className="w-[110px]"` | left rail colour panel |
| `src/editor/color/StrokePanel.jsx:104,112` | `NumberField size="sm"`, `SegmentedToggle variant="filled" size="sm"` | left rail stroke panel |
| `src/editor/color/SwatchesPanel.jsx:71` | `Dropdown size="sm"` | left rail swatches |
| `src/editor/color/PaletteModal.jsx:141-217` | `size="sm"` ×8 | modal, not a rail |
| `src/editor/params/TimelineDock.jsx:123,205,390,397,403,411` | `xs` / `sm` | canvas footer, not a rail |
| `src/editor/params/TransportFab.jsx:25,28` | `md` / `lg` | canvas overlay |
| `src/editor/shell/panels/SelectionPalettePanel.jsx:87,132`; `ToolPalette.jsx:107`; `BatchExportModal.jsx:119`; `MenuTop.jsx:214,465`; `library/FilesDialog.jsx:145-157`; `library/MediaPickerDialog.jsx:52-53`; `modes/pattern/*.jsx`; `mobile/*.jsx`; `Editor.jsx:134-136`; `labs/LabsCatalogCard.jsx:35,48`; `labs/LabsSourcePicker.jsx:141-163` | mixed | not inside a rail body |

Implicit size (no prop) that lands in a rail: `ColourPanel.jsx:202` `SegmentedToggle variant="filled"` → DS default `size = 'md'` (`node_modules/@kolkrabbi/kol-component/src/atoms/SegmentedToggle.jsx:63`); `StrokePanel.jsx:113,114` same; `LayerInspector.jsx:124,155` and `KineticPanel.jsx:263` `ViewToggle` → default `'sm'` (`node_modules/@kolkrabbi/kol-component/src/atoms/ViewToggle.jsx:38`); `ColourPanel.jsx:210,242` `Slider` (no size ladder — `size` is track px, `node_modules/@kolkrabbi/kol-component/src/molecules/Slider.jsx:37`).

## 3. The segmented control

DS default (`SegmentedToggle`, `node_modules/@kolkrabbi/kol-component/src/atoms/SegmentedToggle.jsx`):
- props `variant = 'default', size = 'md', tone = 'default'` (`:63`); classes `kol-seg` + `kol-seg--${size}` when not md + `toneClass(tone)` (`:88-95`); cells `kol-seg-cell` + `{ sm: 'kol-mono-12', md: 'kol-mono-14', lg: 'kol-mono-16' }` + `is-active` (`:64,109`).
- `tone="sunken"` exists in the DS now (`:51-56`).

Theme (`node_modules/@kolkrabbi/kol-theme/kol-components-molecules.css`):
```css
.kol-seg { display: flex; border: 1px solid var(--kol-oq-08); border-radius: var(--kol-radius-sm);
  overflow: hidden; box-sizing: border-box; height: var(--kol-ctl-md); }            /* :598-613 */
.kol-seg--sm { height: var(--kol-ctl-sm); }  .kol-seg--sm .kol-seg-cell { padding: 4px 12px; } /* :618,621 */
.kol-seg-cell { flex: 1; … padding: 6px 16px; white-space: nowrap; color: var(--kol-oq-48);
  background: var(--kol-surface-secondary); }                                        /* :624-646 */
.kol-seg-cell + .kol-seg-cell { border-left: 1px solid var(--kol-oq-08); }           /* :648 */
.kol-seg-cell.is-active { background: transparent; color: var(--kol-fg-emphasis); } /* :667-670 */
```
DS sunken tone (promoted from this repo; `:2296-2300`):
```css
:is(.kol-seg.kol-tone-sunken, .kol-seg.kol-tone-inverse, .kol-tone-sunken .kol-seg):not(.kol-seg--filled) { border-width: 0; }
… .kol-seg-cell.is-active { background: var(--kol-surface-sunken); color: var(--kol-fg-96); }
```
Labs' own copy still shipped (`src/editor/styles/kol-labs.css:263-269`):
```css
.kol-editor-labs .kol-seg { border-color: transparent; }
.kol-editor-labs .kol-seg-cell.is-active { background: var(--kol-surface-sunken); color: var(--kol-fg-96); }
```
with the note "Both go the day it grows the prop in kol-component" (`kol-labs.css:262`).

Where the labs rail uses it:

| Use | Props | Where |
|---|---|---|
| Effect · Motion strip | `size={cs} className={stripClamp(cs)}` | `LabsParams.jsx:193,226,255` |
| Generate · Style · Animation strip | `options={cs === 'sm' ? GEN_TABS : GEN_TABS_TOUCH} size={cs}` | `LabsParams.jsx:400,435` |
| Halftone siblings (ChipsRow) | `value={active ?? null} … size={cs} ariaLabel="Siblings"` | `LabsParams.jsx:89-96` |
| Schema `segmented` (labs) | `size={cs} className="w-full {stripClamp}"` | `AutoControls.jsx:255-260` |
| Schema `toggle` with `labels` (labs) | same strip, options off/on | `AutoControls.jsx:284-289` |
| Invert / Background `OnOff` | `size={cs} className="w-full …"` | `LoopFields.jsx:65-68` |
| Morph mode strip + step edit strip | `size={cs} className={stripClamp(cs)}`; cells carry `disabled`/`tooltip` | `MorphTab.jsx:73-79,163,186` |

The editor skin uses `ViewToggle` instead (`AutoControls.jsx:262-267,294-299`; `LoopFields.jsx:69`; `LayerInspector.jsx:124,155`; `KineticPanel.jsx:263`) and `variant="filled"` strips (`LayerInspector.jsx:81,101`; `AlignmentPanel.jsx:24-25`; `StrokePanel.jsx:112-114`; `ColourPanel.jsx:202`; `AudioInputRow.jsx:61`). Only `MorphTab.jsx:76-78` passes `disabled` cells (`SegmentedToggle.jsx:32-37`).

## 4. Field widths in the labs rail

| Control | Rule | Where |
|---|---|---|
| Range value box | `Input type="text" variant="filled" size={cs} chars={5}` + `inputClassName="text-center"`; comment: "5 chars holds '0.025' and a 4-digit value; 6 was a third of a touch row" | `AutoControls.jsx:183-198` |
| `chars` semantics | HTML `size` attr; the shell hugs (padding + prefix + N chars + suffix + padding); drops `flex-1` | `node_modules/@kolkrabbi/kol-component/src/atoms/Input.jsx:42-46,171,215` |
| Slider beside it | `Slider … readout="none" className="flex-1"`, row `flex items-center gap-3` | `AutoControls.jsx:172-181` |
| Hex | `Input … prefix="#" chars={6}` | `ColorField.jsx:94-99` |
| Seed | `NumberField … chars={10}` | `rolls.jsx:181` |
| Modulation range | `Input … chars={5}` ×2 | `ModulationEditor.jsx:189,195` |
| Dropdown | `variant="subtle" size={cs} className="w-full"` | `AutoControls.jsx:242`; `TreePicker.jsx:8`; `LoopFields.jsx:197,220,236,349,358`; `LabsParams.jsx:203,349` |
| Strip in a row | `w-full` | `AutoControls.jsx:256,285`; `LoopFields.jsx:68` |
| Buttons | `w-full`, or `flex-1 min-w-0` + `shrink-0` icons, or `grid grid-cols-2 gap-2` | `LoopFields.jsx:260,269-277,283`; `EffectsPanel.jsx:332-337,342`; `MorphTab.jsx:196` |
| Textarea | `variant="filled" size={cs} rows={p.rows ?? 2} axis="y"` (label-above) | `AutoControls.jsx:307-313` |
| Rail cannot push the page | `.kol-editor-labs .kol-compose-rail--inspector { overflow: hidden; min-width: 0 }` | `kol-labs.css:89-93` |

So: number fields are **chars-sized** (5 / 6 / 10), every wide control is `w-full`; no fixed px widths in the labs rail. Fixed px live only in the editor/left rail: `w-24 shrink-0` + `chars={4}` (`StrokePanel.jsx:106-107`), `w-[110px]` (`ColourPanel.jsx:121`), property fields `calc(${len}ch + 2px)` (`Input.jsx:154,217`) in `w-full min-w-0` cells (`LayerInspector.jsx:226,235,411`).

## 5. Section anatomy (labs)

`LabeledControlSection` (`node_modules/@kolkrabbi/kol-component/src/organisms/SettingsPanel.jsx:155-162`):

| Part | Value | Where |
|---|---|---|
| Wrapper | `flex flex-col gap-3` + `kol-section--divided` when `divided` | `SettingsPanel.jsx:157` |
| Heading | `<p className="kol-eyebrow text-fg-80">{label}</p>` | `SettingsPanel.jsx:158` |
| `.kol-eyebrow` | mono 12px / lh 1 / weight 500 / ls 0.06em / `text-transform: uppercase` | `node_modules/@kolkrabbi/kol-theme/kol-type-roles.css:285-292` |
| Rows | `flex flex-col gap-2` (or `gap-1`) | `SettingsPanel.jsx:159` |
| Divider | `.kol-section--divided + .kol-section--divided { border-top: 1px solid var(--kol-oq-08); padding-top: 20px; }` | `kol-components-molecules.css:1004-1012` |
| Heading suppressed when it repeats the first param's label | `label={g.section && g.section !== g.params[0].label ? g.section : undefined}` | `AutoControls.jsx:102` |
| Picking-cluster split (sectionless schema) | leading run of `select` params becomes its own group | `AutoControls.jsx:72-81`; effect pages `LabsParams.jsx:238-250` |
| Surface title (desk only) | `<p className="kol-eyebrow text-fg-96">{title}</p>` when `cs === 'sm'` | `LabsParams.jsx:106,112` |
| Sheet title (touch) | `PanelHeader` → `<button className="kol-helper-12 text-meta …">{title}` | `LabsView.jsx:270`; `src/editor/components/PanelHeader.jsx:24` |
| Explicit `<Divider />` atoms also used between sections | | `LabsParams.jsx:200,266,270` |
| Hints | `Hint` default `kol-mono-12 text-meta`; overridden to `kol-mono-10 text-meta` | `src/editor/components/Hint.jsx:36`; `LabsParams.jsx:197`; `LoopFields.jsx:167`; `MorphTab.jsx:180-181,188` (`kol-mono-12`) |

Uses of `LabeledControlSection … divided`: `AutoControls.jsx:100-104`, `LabsParams.jsx:196,201,262,342`, `LoopFields.jsx:184,208`, `MorphTab.jsx:165,185,195`, `EditorFooter.jsx:302`.

## 6. Rail-by-rail comparison

| Rail | Row primitive | Label class | Label casing | Control size | Field width rule | Heading class |
|---|---|---|---|---|---|---|
| Labs rail, desk (`LabsParams`, `LoopFields inline`, `TreePicker inline`, `rolls inline`) | `SettingsRow` (`SettingsPanel.jsx:120`) → `LabeledControl inline` (`LabeledControl.jsx:69-91`) | `kol-helper-10 tracking-widest text-meta` (`LabeledControl.jsx:82`) | UPPER via `.toUpperCase()` string (`SettingsPanel.jsx:122`; fallback `AutoControls.jsx:332`) | `'sm'` from context, 26px (`controlSize.js:26`; `kol-base-tokens.css:215`) | label col 112 (`controlSize.js:44`), control `flex-1`; numbers `chars` 5/6/10, wide controls `w-full` (§4) | `kol-eyebrow text-fg-80` (`SettingsPanel.jsx:158`), hairline = pair rule (`molecules.css:1004`); title `kol-eyebrow text-fg-96` (`LabsParams.jsx:112`) |
| Labs sheet, touch (same tree) | same, but range rows label-above (`AutoControls.jsx:234`) | same | same | `'md'` (`LabsView.jsx:509`), pinned 32px / 14-18 type (`kol-labs.css:238-244`) | same; strips `px-1 min-w-0` (`controlSize.js:38`) | same sections; title = sheet header `kol-helper-12 text-meta` (`PanelHeader.jsx:24`) |
| Morph rail (`MorphTab`) | `SettingsRow` via `AutoControls … inline` (`MorphTab.jsx:192`) + `LoopFields … inline` (`:187`) | same | same | `cs` (`MorphTab.jsx:51,163,173,186,196`) | dropdowns `w-full`, Resolution slider `chars={5}` (via AutoControls) | `LabeledControlSection divided` (`MorphTab.jsx:165,185,195`), `Step N` eyebrow (`:185`); strip replaces the title (`:163`) |
| Editor Parameters tab (`ParametersPanel` → `AutoControls` non-inline, `LoopFields` non-inline) | `LabeledControl` label-above (`AutoControls.jsx:332`; `LoopFields.jsx:58`; `TreePicker.jsx:25`) | `kol-helper-10 tracking-widest text-meta` (`LabeledControl.jsx:96`) | sentence-case as authored (`AutoControls.jsx:332` `p.label`) | `cs` = `'sm'` (no provider) | numbers `chars={5}` (`AutoControls.jsx:187`); Theme/Invert 2-up grid (`LoopFields.jsx:234`); `ViewToggle` bare chips (`AutoControls.jsx:262`) | `kol-eyebrow text-fg-80` via `LabeledControlSection` (`AutoControls.jsx:100`); `kol-helper-10 text-meta` spans (`LoopFields.jsx:346`) |
| Editor Inspector (`LayerInspector`) | `InspectorSection pane` (`LayerInspector.jsx:55,118,140,152,166,201,285`); rows = unlabeled glyph+tooltip fields (`:223-243`) or `LabeledControl` label-above (`:123,300,344`) | `kol-helper-10 tracking-widest text-meta` (`LabeledControl.jsx:96`); `kol-helper-10 text-meta` Fill/Stroke (`LayerInspector.jsx:253,255`) | sentence-case | literal `"sm"` ×15 (`LayerInspector.jsx:81…495`), no context read | property fields hug `${len}ch + 2px` (`Input.jsx:217`) in `grid grid-cols-2 gap-2` (`LayerInspector.jsx:428,487`); `w-full min-w-0` (`:226,235,411`) | `kol-inspector-pane-title` mono 14/18 weight 400 `fg-emphasis` (`molecules.css:1025-1033`), head `min-height: 40px; padding: 4px 16px 0` (`:1018-1024`), rule `.kol-inspector-pane + .kol-inspector-pane` (`:1017`) |
| Left rail colour / stroke / swatches | `LabeledControl inline` with DEFAULT `labelWidth = 48` (`ColourPanel.jsx:209,241`; `StrokePanel.jsx:101,112-114`; `LabeledControl.jsx:36`) | `kol-helper-10 tracking-widest text-meta` (`LabeledControl.jsx:82`) | sentence-case ("Weight", "Opacity", "R") | mixed: `sm` dropdown (`ColourPanel.jsx:117`), strip default `md` (`ColourPanel.jsx:202`; `StrokePanel.jsx:113-114`), strip `sm` (`StrokePanel.jsx:112`), field `sm` (`StrokePanel.jsx:104`) | fixed px: `w-24` + `chars={4}` (`StrokePanel.jsx:106-107`), `w-[110px]` (`ColourPanel.jsx:121`); panel `width: 320`, `p-4` (`ColourPanel.jsx:41,57`; `StrokePanel.jsx:100,123`; `SwatchesPanel.jsx:68,97`) | none (mode is a `Dropdown`, `ColourPanel.jsx:115-122`) |

Rail widths: editor grid `320px minmax(0,1fr) 320px` (`kol-editor.css:61`); labs `--kol-rail-w: var(--kol-sidenav-w)`, `--kol-rail-w-collapsed: 48px` (`kol-labs.css:26-29`), track `var(--_rail-track)` (`:60-70`); touch sheet `grid-template-rows: minmax(0,1fr) auto`, `max-height: var(--kol-sheet-h, 50dvh)` (`:171-186`), `SHEET_H = { half: '50dvh', tall: '85dvh' }` (`PanelHeader.jsx:70`).

## Contradictions

| # | Topic | Side A | Side B |
|---|---|---|---|
| 1 | Casing policy vs practice | "NO text-transform lives here … casing is authored, not transformed" (`kol-labs.css:4-11`) | the rail's labels ARE transformed: `label.toUpperCase()` (`SettingsPanel.jsx:122`), `String(p.label).toUpperCase()` (`AutoControls.jsx:332`), and `kol-eyebrow`'s CSS `text-transform: uppercase` on ColorField rows (`ColorField.jsx:115`; `kol-type-roles.css:291`) |
| 2 | Two uppercase mechanisms, two sizes, in one rail | SettingsRow label: helper-10, uppercased by string (`LabeledControl.jsx:82`; `SettingsPanel.jsx:122`) | ColorField label: `kol-eyebrow` 12px, uppercased by CSS, no 112 column (`ColorField.jsx:113-116`) |
| 3 | Label voice in the Motion tab | SettingsRow uppercase helper-10 (`LoopFields.jsx:57`) | SweepStack rows: `kol-helper-10 tracking-widest text-meta` sentence-case, no width (`EffectsPanel.jsx:401-405`); "Motion" heading `kol-helper-10 text-meta` (`EffectsPanel.jsx:412`; `LoopFields.jsx:346`) instead of a `kol-eyebrow` section |
| 4 | Row primitive in the labs rail | `SettingsRow` everywhere `inline` reaches (`AutoControls.jsx:331`; `LoopFields.jsx:57`; `TreePicker.jsx:24`; `rolls.jsx:194`) | Kinetic surface never passes `inline` → label-above `LabeledControl`, 2-up grid, `ViewToggle` (`LabsParams.jsx:436-441`; `KineticPanel.jsx:246-268`); Soft Forms / Para Type / Camera / Rules / Modulation rows are `LabeledControl` label-above with `kol-helper-10 text-meta` headings (`SoftformsLayers.jsx:195,264`; `ParatypeTools.jsx:67-69`; `CameraPoseSlots.jsx:44`; `RulesEditor.jsx:44`; `ModulationEditor.jsx:187,279`) |
| 5 | One size group in the sheet | `ControlSizeContext.Provider value="md"` — "ONE SIZE GROUP IN THE SHEET" (`LabsView.jsx:507-511`) | sheet header `Button … size="sm"` (`LabsView.jsx:269`); collapsed `PanelPills` default `size = 'lg'` (`PanelHeader.jsx:38`, used `LabsView.jsx:512`); rail sub-editors write `size="sm"` (`ModulationEditor.jsx:189-256`; `SoftformsLayers.jsx:266,285-290`; `ParatypeTools.jsx:33,71,78`; `CameraPoseSlots.jsx:49,55`; `RulesEditor.jsx:56,59`; `AudioInputRow.jsx:61`; `EditorFooter.jsx:260`) |
| 6 | Sunken strip: DS vs local copy | DS `tone="sunken"` (`SegmentedToggle.jsx:51-56`; `molecules.css:2296-2300`) | labs still carries the three lines "until it grows the prop" (`kol-labs.css:254-269`) and passes no `tone` (`LabsParams.jsx:193,255,400`) |
| 7 | STRIP_CLAMP duplicated with a different hover selector | `[&_.kol-seg-cell:hover:not(.is-active)]` (`controlSize.js:38`) | `[&_.kol-seg-cell:hover]` (`src/editor/mobile/MobileOverlay.jsx:74`), and a third `px-2` variant (`:335`) |
| 8 | Two hairline mechanisms in one surface | DS pair rule `.kol-section--divided + .kol-section--divided` (`molecules.css:1004`), relied on by `AutoControls.jsx:103` | explicit `<Divider />` atoms between divided sections (`LabsParams.jsx:200,266,270`) |
| 9 | Eyebrow ink | section eyebrow `text-fg-80` (`SettingsPanel.jsx:158`) | surface title "wears the SAME eyebrow as the sections" but is `text-fg-96` (`LabsParams.jsx:109-112`) |
| 10 | Title voice by breakpoint | desk: `kol-eyebrow text-fg-96` uppercase (`LabsParams.jsx:112`) | touch: `kol-helper-12 text-meta` sentence-case (`PanelHeader.jsx:24`) |
| 11 | Hint size | `Hint` default `kol-mono-12 text-meta` (`Hint.jsx:36`; `MorphTab.jsx:180`) | `kol-mono-10 text-meta` (`LabsParams.jsx:197`; `LoopFields.jsx:167`) |
| 12 | Label column width across rails | labs 112 (`controlSize.js:44`) | DS SettingsRow default 160 (`SettingsPanel.jsx:120`); LabeledControl default 48 used by the colour panel (`LabeledControl.jsx:36`; `ColourPanel.jsx:209,241`; `StrokePanel.jsx:101-114`) |
| 13 | Two size rungs in one left-rail panel | `SegmentedToggle variant="filled" size="sm"` (`StrokePanel.jsx:112`) | `SegmentedToggle variant="filled"` with no size → `md` (`StrokePanel.jsx:113-114`; default `SegmentedToggle.jsx:63`); `ColourPanel.jsx:117` sm dropdown beside `:202` md strip |
| 14 | Two heading classes in the editor right rail | Inspector `kol-inspector-pane-title` mono-14 sentence-case (`LayerInspector.jsx:55`; `molecules.css:1025`) | Parameters tab `kol-eyebrow` uppercase (`AutoControls.jsx:100`, non-inline from `ParametersPanel.jsx:100-121`) |
| 15 | Chips row comment vs render | "BARE kol-helper-12 text links, authored case" (`LabsParams.jsx:67-69`) | renders a `SegmentedToggle` (`:89-96`); the pills variant is `Tag size="xs"` (`:77`) — three picker looks against "ONE STRIP STYLE" (`:84-87`) |
| 16 | Touch tab shortening rationale | "the touch rail's 264 gives three cells ~77px each" (`LabsParams.jsx:58-60`) | the touch rail is a full-width sheet (`kol-labs.css:165-175`) since 2026-10-05 |
| 17 | Where `--kol-rail-w` ships from | "kol-framework 0.21.1 ships `--kol-rail-w: 256px` on :root" (`kol-labs.css:45-46`) | "ship on :root from kol-theme 0.43.0" (`LabsView.jsx:159-161`); neither installed package defines it (grep of `node_modules/@kolkrabbi/kol-theme/*.css`, `kol-framework/src`, `kol-shell/src` — only `--kol-shell-rail-width: 48px`, `kol-components-shell.css:19`); `kol-labs.css:27` sets it itself |
| 18 | Open rail width | "`--kol-sidenav-w` (264, 320 from 1536)" (`kol-labs.css:19`; `NavRail.jsx:81`) | `w-[var(--kol-sidenav-w,320px)]` (`MobileOverlay.jsx:296`) vs "264 less the 16px insets" (`MobileOverlay.jsx:85`); NavRail falls back to 264 (`NavRail.jsx:86`); the token is defined in no installed stylesheet |
| 19 | LabeledControl doc vs render | "label — small label text (uppercase, kol-helper-10)" (`LabeledControl.jsx:16`) | no transform in the render (`:82,96`); uppercase arrives only from `SettingsRow` (`SettingsPanel.jsx:122`) |
| 20 | Dropdown `sm` rung claim | "at 'sm' it is 28 against 26" (`controlSize.js:18-19`) | `.kol-dd-trigger.kol-btn-sm { height: var(--kol-ctl-sm) }` = 26 (`molecules.css:68`; `kol-base-tokens.css:215`) |

## Open questions

- `--kol-sidenav-w` is read by `kol-labs.css:27` and `NavRail.jsx:84` but defined by no installed CSS/JS (grep over `node_modules/@kolkrabbi`); `useDragResize` writes it only for `token: 'kol-sidenav'` (`node_modules/@kolkrabbi/kol-component/src/hooks/useDragResize.js:68-71,94-96`), which labs does not mount (it mounts `token: 'kol-rail'`, `LabsView.jsx:163`). What the labs rail's open width resolves to at runtime (and whether `--_rail-track` is valid) could not be determined from code.
- The actual rendered row height of a range row (Slider track height) was not measured — `Slider` has no size rung (`Slider.jsx:37`).
- `StepList size={cs}` (`MorphTab.jsx:173`) — its ladder was not read.
- Whether `ToggleSwitch` md is lifted on coarse pointer: the atoms rule lists btn/control/seg/menu-btn only (`kol-components-atoms.css:1332-1337`), and `kol-labs.css:241` likewise; the switch's own class is `toggle-switch--md` (`ToggleSwitch.jsx:46`) — not verified either way.
- `LabeledControlSection rowGap` is never passed in this repo; every labs stack is `gap-2`.
- `KineticSurface` not passing `inline` (`LabsParams.jsx:436`) — deliberate or omission is not stated in the code.
