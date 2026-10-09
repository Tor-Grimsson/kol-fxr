# 08 — KOL as installed (node_modules/@kolkrabbi/)

All paths repo-relative; `NM` = `node_modules/@kolkrabbi`. Every number below is read from the installed source, not from docs.

## Versions

| Package | Version | Entry | Source |
|---|---|---|---|
| kol-component | 0.246.0 | `src/index.js` | `NM/kol-component/package.json:3` (peer `@kolkrabbi/kol-icons >=0.22.0`, dep `@floating-ui/react ^0.27.19` — `:25,:33`) |
| kol-theme | 0.171.0 | `kol-theme.css` (umbrella) / `./core` = `kol-core.css` | `NM/kol-theme/package.json:3,13-15` |
| kol-icons | 0.34.0 | `src/index.js` | `NM/kol-icons/package.json:3,9` |
| kol-shell | 0.63.0 | `src/index.js` | symlink name `NM/kol-shell` |
| kol-framework | 0.49.0 | `src/index.js` + `kol-framework.css` | `NM/kol-framework/` tree |
| kol-brand 0.1.3, kol-media-client 0.4.1 | — | not read (out of area) | `NM/` symlinks |

Cascade: every theme file is `@import … layer(components)` (`NM/kol-theme/kol-theme.css:38-60`); `kol-core.css` is the same list minus chess/workshop/foundry/dashboards/styleguide (`NM/kol-theme/kol-core.css:22-41`). kol-fxr imports `@kolkrabbi/kol-theme/core` (`src/index.css:14`) and `kol-sources.css` (`src/index.css:24`; the `@source` manifest `NM/kol-theme/kol-sources.css:36-61`).

## 1. The size ladder

**The one height token** — `--kol-ctl-xs: 22px · sm 26 · md 32 · lg 40` (`NM/kol-theme/kol-base-tokens.css:213-218`); on `(pointer: coarse)` the ladder becomes `32 · 32 · 36 · 40` (`:219-226`) and every `.kol-btn-*`/`.kol-control-*`/`.kol-seg-cell`/`.kol-menu-btn` types `16px/22px` (`NM/kol-theme/kol-components-atoms.css:1323-1348`), except inside `.kol-hw-panel` (`NM/kol-theme/kol-components-controls.css:44-51`).

Shared padding rungs (text controls derive height = pad + line-height + 1px ring): `xs 4px 8px (radius-xs) · sm 4px 12px · md 6px 16px · lg 8px 20px` — `.kol-control-*` `NM/kol-theme/kol-components-atoms.css:136-139`, `.kol-btn-*` `:326-329`, `.toggle-switch--*` shells `:479-482`, `.kol-seg--* .kol-seg-cell` `NM/kol-theme/kol-components-molecules.css:620-622,629`.

| Component | Size prop (default) | Type class per rung xs/sm/md/lg | Height xs/sm/md/lg | Where |
|---|---|---|---|---|
| Button (text) | `size` (`md`) | `kol-mono-8/12/14/16` | 22/26/32/40 derived (12/16/18/22 lh + pad + ring) | `NM/kol-component/src/atoms/Button.jsx:44,102-108`; `kol-type-mono-classes.css:20-53` |
| Button `iconOnly` | same | none (glyph SOLO 12/16/20/24) | pinned `var(--kol-ctl-*)` square | `atoms/Button.jsx:72,122`; `kol-components-atoms.css:299-302`; `hooks/glyphLadders.js:27` |
| Input | `size` (`md`) | `SIZE_TYPE` `kol-mono-8/12/14/16` | inner `<input>` pinned `h-3/h-4/h-[18px]/h-[22px]` → shell 22/26/32/40 | `atoms/Input.jsx:67,76,111-112,166` |
| Dropdown trigger | `size` (**`sm`**) | `kol-mono-8/12/14/16` on `kol-btn kol-btn-{size}` | `.kol-dd-trigger.kol-btn-* { height: var(--kol-ctl-*) }` | `molecules/Dropdown.jsx:38,151,214-231`; `kol-components-molecules.css:67-70` |
| Dropdown rows | follows trigger | `ROW` = same mono + `px-1/2/3/4` | `h-[var(--kol-ctl-*)]` | `molecules/Dropdown.jsx:45-51,282` |
| SegmentedToggle | `size` (`md`) | `cellType` `kol-mono-8/12/14/16` | `.kol-seg` height `--kol-ctl-md`; `--xs/--sm/--lg` modifiers | `atoms/SegmentedToggle.jsx:63-64,92`; `kol-components-molecules.css:598-622` |
| ViewToggle text | `size` (**`sm`**) | `kol-mono-14` if `md` **else `kol-mono-12`** | `kol-control-{size}` | `atoms/ViewToggle.jsx:38,98-99` |
| ViewToggle icon | — | none; `Icon size={14}` | chip `p-1.5` + 14 glyph = **26px**, well `p-1 -mx-1` = 34px tall | `atoms/ViewToggle.jsx:82,90,118` |
| ViewToggle single | — | fixed `kol-control-sm kol-mono-12` | 26 | `atoms/ViewToggle.jsx:58-59` |
| ToggleSwitch bare (default) | `size` (`md`) | `kol-mono-8/12/14/16` | padding 0; track 12×8 / 16×10 / 20×12 / 24×14; bare gets 24px hit pseudo | `atoms/ToggleSwitch.jsx:19,27-28,44`; `kol-components-atoms.css:442,461-468,485-486,516-521` |
| ToggleSwitch primary/outline | same | same | shell pad → 22/26/32/40 | `kol-components-atoms.css:475-482` |
| Textarea | `size` (`md`) | `kol-mono-8/12/14/16` | rows-driven; inner pad `4px 12px` default, `md 6/16`, `lg 8/20` — **no xs rule** | `atoms/Textarea.jsx:34,40,51-59`; `kol-components-atoms.css:99-103` |
| Stepper | `size` (**`sm`**) | `kol-mono-8/12/14/16`, chevrons 6/8/10/12 | `kol-control--filled kol-control-{size}` | `molecules/Stepper.jsx:30-31,41,93-100` |
| IconFrame | `size` (`md`) | none; glyph SOLO | `.kol-icon-frame-* { width/height: var(--kol-ctl-*) }` | `atoms/IconFrame.jsx:77,82,93`; `kol-components-atoms.css:1184-1187` |
| CloseButton | `size` (`sm`) | — | `Button variant="nav" iconOnly="x"` (or IconFrame when `states={false}`) | `atoms/CloseButton.jsx:52-76` |
| MenuItem trigger | `size` (`md`) | `kol-helper-12 px-3` | inline `height: var(--kol-ctl-*)` | `molecules/MenuItem.jsx:23,42,61-62` |
| MenuDropdownItem row | `size` (`sm`) | xs `kol-mono-8 px-2 h-5`; sm/md/lg **`kol-helper-12 px-3 h-8`** (32) | — | `molecules/MenuItem.jsx:124,128,139` |
| TabChips | `size` (`sm`) | Button `variant="tab"` ladder | 22/26/32/40 | `molecules/TabChips.jsx:27,34-38` |
| ToolPalette / SplitToolButton | `size` (`md`) | Button `tone="ghost" quiet iconOnly`; split = hand-rolled `kol-btn kol-btn-ghost kol-btn-icon kol-btn-{size}` | pinned square | `organisms/ToolPalette.jsx:42,63`; `molecules/SplitToolButton.jsx:85,129,134` |

Glyph ladders (`NM/kol-component/src/hooks/glyphLadders.js:27,30,40`): `SOLO {xs 12, sm 16, md 20, lg 24}`, `ADJACENT {10,14,16,18}`, `INDICATOR {8,12,14,16}`.

## 2. Input

| Feature | Prop / class | Implementation | Where |
|---|---|---|---|
| Width-by-content | `chars` (number) | sets HTML `size={chars}` on `<input>`, drops `flex-1` | `NM/kol-component/src/atoms/Input.jsx:42-46,77,94,171,215` |
| Explicit width | `width` | inline `style.width` on the `<label>` shell (number → px) | `:47-48,88,184` |
| Property variant | `variant="property"` | resolves to `filled` chrome + `w-full` shell; inner `<input>` `width: calc(${len}ch + 2px)` where len = `value ?? placeholder` length; needs controlled `value` | `:33-37,104-105,116,154,217` |
| Affordance / unit | `affordance`, `unit` | dim `text-meta` nodes: affordance before (`pr-1.5`), unit immediately after value | `:82-83,198-200,222-224` |
| Prefix / suffix | `prefix`, `suffix` | `text-meta` spans, `aria-hidden`; inner input gets `pr-1`/`pl-1` | `:51-52,175-176,195-197,225-227` |
| Number | `type="number"` | adds `hide-number-spinners` (theme: `NM/kol-theme/kol-utilities.css:84-92`); no Stepper — use `Stepper` molecule for chevrons | `:93,177` |
| Commit idiom | `onCommit(trimmed)` | local draft; blur/Enter commits then re-snaps to `value`; Escape restores | `:19-28,73,127-152,219-220` |
| Slots | `slotLeft`, `slotRight`, `iconLeft`(+`iconSize`, ADJACENT ladder) | leading/trailing nodes inside the shell | `:53-61,100,187-194,228-230` |
| Variants | unset→wrapper tone else filled; `filled`, `outline`, `ghost`→outline | `kol-control kol-control--{variant} kol-control-{size} {mono} cursor-text` | `:9-13,29,105,107-118` |
| Tone | `tone` (`inverse`→`sunken`) | `toneClass()` | `:75,115`; `utilities/tone.js:24-27` |

Shell chrome: `.kol-control` = inline-flex, radius `--kol-radius-sm`, bg `var(--kol-tone-bg, --kol-surface-secondary)`, 1px border `var(--kol-tone-border, transparent)`, `cursor: pointer`, disabled opacity .5 (`NM/kol-theme/kol-components-atoms.css:52-66,143-148`).

## 3. Row primitives

No `PropertyRow`, `FieldRow`-like `InspectorRow` exists; the barrel exports `LabeledControl`, `FieldRow`, `PropertyInput`, `SettingsRow`, `LabeledControlSection`, `InspectorSection` (`NM/kol-component/src/index.js:49,96,121,210,55`).

| Primitive | Layout | Label column | Label type class | Casing mechanism | Row height | Where |
|---|---|---|---|---|---|---|
| LabeledControl (stacked) | `flex flex-col gap-2` | — | `kol-helper-10 tracking-widest text-meta` | none in code (docstring says "uppercase") | — | `NM/kol-component/src/molecules/LabeledControl.jsx:16,94-96` |
| LabeledControl `inline` | `flex items-center gap-3` | `labelWidth` default **48px** (`'auto'` = flex-1 truncating, stacks `<sm`) | same `kol-helper-10` | none | content | `:36,69-89` |
| LabeledControl `variant="panel"` | inline-flex row/col | hugs | `labelClass` default `kol-helper-8` + `text-fg-32` | inline `textTransform: 'uppercase'` | — | `:39-57` |
| SettingsRow | `LabeledControl inline` | `labelWidth` default **160** | inherits `kol-helper-10` | **JS `label.toUpperCase()`** | — | `organisms/SettingsPanel.jsx:120-127` |
| LabeledControlSection | `flex flex-col gap-3`, rows `gap-1\|gap-2` | — | `kol-eyebrow text-fg-80` (12px/500/0.06em) | CSS `text-transform: uppercase` on `.kol-eyebrow` | — | `organisms/SettingsPanel.jsx:155-161`; `NM/kol-theme/kol-type-roles.css:285-292` |
| FieldRow | `.kol-field-row` grid `minmax(0,12rem) minmax(0,1fr)` + `gap-x-6 py-3 border-b border-fg-08` | **12rem (192px)** | `kol-mono-12 text-emphasis`; hint `kol-helper-12 text-meta` | none | content + 24px pad | `molecules/FieldRow.jsx:235-241`; `NM/kol-theme/kol-components-molecules.css:413-416` |
| PropertyInput | `flex flex-col gap-2` | — | `Label` + `kol-helper-10` (Label = `text-fg-48`) | none | — | `molecules/PropertyInput.jsx:23-24`; `atoms/Label.jsx:6-10` |
| InspectorSection (default) | `flex flex-col gap-2`, head `flex items-center gap-2 min-h-6` | — | `kol-helper-10 tracking-widest text-meta`; `actions` slot right | none | head 24px min | `molecules/InspectorSection.jsx:47-57` |
| InspectorSection `pane` | `.kol-inspector-pane` → head + body | — | `.kol-inspector-pane-title` mono **14/18 400 fg-emphasis** | none | head `min-height 40px; padding 4px 16px 0`; body `gap 8px; padding 4px 16px 20px`; `pane+pane` border-top `--kol-oq-08` | `:33-44`; `NM/kol-theme/kol-components-molecules.css:1017-1040` |
| `divided` (Section/LCS) | `.kol-section--divided + .kol-section--divided` | — | — | — | `border-top 1px --kol-oq-08; padding-top 20px` | `NM/kol-theme/kol-components-molecules.css:1004-1012` |
| InspectorRail | `.kol-inspector-rail` / `-body` — selection-precedence shell only | — | — | — | **no CSS rule in kol-theme** (grep) | `molecules/InspectorRail.jsx:42-58` |
| ColorInputRow (grid mode) | `grid 24px 1fr 1fr 1fr` | 24px swatch | `kol-helper-12`; token `kol-helper-10` | none | — | `molecules/ColorInputRow.jsx:177,199-211` |

## 4. Section / heading primitives

| Primitive | Type class / size | Notes | Where |
|---|---|---|---|
| SectionLabel | sm `h-4 kol-helper-14` icon 16 · md `h-5 kol-helper-20` icon 24 · lg `h-8 kol-sans-heading-03` icon 40; trailing `arrow-downright` | no transform | `NM/kol-component/src/atoms/SectionLabel.jsx:13-29,48-59` |
| PageHeader | sm `kol-sans-heading-03` 32 · md `kol-sans-display-03` · lg `kol-sans-display-02`; `voice="mono"` → `kol-mono-heading-03/display-03/display-02` (32px/500, lh 110%/100%); subtitle `kol-mono-14` | `--kol-page-header-mb` 40 | `molecules/PageHeader.jsx:28-30,47,55,70`; `NM/kol-theme/kol-type-mono-classes.css:70-89` |
| Divider | horizontal `h-px w-full bg-fg-08`; vertical `1px × height` default **16**, `self-center` | `opacity` prop picks `bg-fg-NN` | `atoms/Divider.jsx:17-19,30-31,38` |
| TabsRow | row `h-10` (40); tab `kol-mono-12 border-b-2`, active `text-emphasis border-fg`, rest `text-meta` | tablist a11y; `CloseButton size="xs"` | `molecules/TabsRow.jsx:38,42,57-60` |
| TabChips | `Button variant="tab"` chips, `size` default sm, `gap-1` | tab bundle: rest `--kol-fg-meta`, pressed `--kol-oq-08` chip | `molecules/TabChips.jsx:27-46`; `NM/kol-theme/kol-components-molecules.css:2169-2189` |
| TabStrip (kol-shell) | `kol-helper-{size}` default **14**; active `text-fg-96`, rest `text-fg-32 hover:text-fg-48`; `tracked` → `letterSpacing: 1` | plain `<span onClick>`, no role | `NM/kol-shell/src/TabStrip.jsx:19-31` |
| Eyebrow classes | `.kol-eyebrow` mono 12/1/500/0.06em **uppercase**; `.kol-doc-eyebrow` mono 10/1/500/0.1em uppercase `--kol-fg-strong` | the only label classes with `text-transform` | `NM/kol-theme/kol-type-roles.css:36-44,285-292` |
| `.kol-sidenav-hop` | `color --kol-fg-80; text-transform: uppercase; letter-spacing .06em` | rail row ink | `NM/kol-theme/kol-components-atoms.css:800-826` |
| No `SectionHeading` / `PanelHeader` / `PaneHeader` components | — | pane header = `InspectorSection pane` | `NM/kol-component/src/index.js` (no such exports) |

## 5. Colour primitives

| Component | Measured | Where |
|---|---|---|
| ColorSwatch | default `size` **24**; `'control-sm'` → 26 inline px; `'fill'`/`'stretch'` classes; `radius` sm(4)/tight(`--kol-radius-xs` 2)/none/full; selected `border-2 border-fg-64`; `variant="halo"` shadow `0 0 0 1px --kol-surface-primary, 0 0 0 2px --kol-fg-32`; `showTransparent` → `TransparentX` | `NM/kol-component/src/molecules/ColorSwatch.jsx:45-61,70,75-76,110,117-122` |
| ColorInputRow (= the "ColorField") | swatch 24 (or `h-6 w-6` lock cell); hex `Input variant="filled" size={size} prefix="#" chars={6} maxLength={6}` default size **sm**; label `kol-helper-12 … text-emphasis`; popover `bg-surface-secondary border border-fg-08 rounded p-2 … minWidth 200`, refs `grid-cols-6 gap-1`, Theme/None chips `kol-helper-12 h-6 border border-fg-08` | `molecules/ColorInputRow.jsx:77,150,158,177,179-193,220-275` |
| SwatchControls / SwatchStack / EyedropPick | stack `w-11 h-11` (44); paint chips `size={22} radius="full" variant="halo"` at `left-[5px] top-[6px]` / `left-[15px] top-[16px]`; swap `Icon swap 16` at `left-[28px]`; none marker `w-2.5 h-2.5` (`.kol-swatch-none-marker` red slash `#DC2626`); eyedrop button `Icon eyedrop 24`, sample chip 16; button hidden unless `window.EyeDropper` | `molecules/SwatchControls.jsx:38-39,48-50,86,117-129,154-157,170`; `NM/kol-theme/kol-components-molecules.css:778-786` |
| useEyedropper / pickFromCanvasElement | native `new window.EyeDropper().open()` → upper hex; fallback sampler sets `canvas.style.cursor = 'crosshair'`, reads `getImageData` | `hooks/useEyedropper.js:46-47,96-118` |
| SpectrumControls (the picker) | `HueStrip` 12px tall, `HANDLE_R` 7; `SBSquare`; `WheelTriangle`; exported with `HueStrip, SBSquare, WheelTriangle` | `organisms/SpectrumControls.jsx:38,51,106-107`; `index.js:135` |
| Also exported | `ColorRamp`, `PaletteHarmonyWheel`, `TransparentX`, colour math (`hexToHsl…`) | `index.js:98-99,119,70,236-240` |
| Not present by name | `ColorField`, `ColorPicker`, `Eyedropper`, `Swatch` | `index.js` (none) |

## 6. SegmentedToggle

Props: `value, onChange, options=[{value,label,ariaLabel?,tooltip?,disabled?}], variant='default'|'filled'|'tonal', size='md', tone='default', ariaLabel, className` (`NM/kol-component/src/atoms/SegmentedToggle.jsx:63`). `value == null` → stateless `role="group"` action strip (`:65,85`); `disabled` cells `aria-disabled`, skipped by arrows (`:32-37,74-78,106-108`); non-string labels get a DS `Tooltip` (`:100`). Classes: `kol-seg [kol-seg--filled] [kol-seg--tonal] [kol-seg--{size}] {toneClass}` (`:88-95`); cell `kol-seg-cell {mono} [is-active]` (`:109`).

CSS (`NM/kol-theme/kol-components-molecules.css`): `.kol-seg` border `1px --kol-oq-08`, radius sm, pinned `height: var(--kol-ctl-md)` (`:598-613`); cell rest `color --kol-oq-48; background --kol-surface-secondary` (`:637,643`), divider `border-left 1px --kol-oq-08` (`:648`), hover `--kol-oq-64` (`:654`), disabled `--kol-oq-24; cursor default` (`:660-665`), active `background transparent; color --kol-fg-emphasis` (`:667-670`); `:active` momentary press `--kol-oq-08` (`kol-components-atoms.css:1369-1371`). `--filled`: no border, `gap 1px`, cells transparent + radius, active `--kol-surface-secondary` (`:689-706`); `--tonal` active `--kol-surface-tertiary` (`:710-713`).

**Sunken tone** — `tone="sunken"` (alias `inverse`) via `toneClass` (`utilities/tone.js:24-27`). Rule: `:is(.kol-seg.kol-tone-sunken, .kol-seg.kol-tone-inverse, .kol-tone-sunken .kol-seg):not(.kol-seg--filled) { border-width: 0 }` and `… .kol-seg-cell.is-active { background: var(--kol-surface-sunken); color: var(--kol-fg-96) }` (`NM/kol-theme/kol-components-molecules.css:2296-2300`, comment `:2289-2295` "segmented-toggle-sunken-tone … fxr's kol-labs.css:220-226"). The identifier `SegmentedSunkenNoBorder` does **not** appear anywhere in kol-theme 0.171.0 or kol-component (grep). Tone bundle: `.kol-tone-sunken, .kol-tone-inverse { --kol-tone-bg: var(--kol-surface-sunken); --kol-tone-fg: var(--kol-fg-96); … }` (`:2127-2145`). `--kol-surface-sunken` = `--kol-oq-ab-100` (#fff) light / `--kol-oq-ab-96` dark (`NM/kol-theme/kol-base-tokens.css:89,118,166`).

## 7. Menus, tooltip, icon buttons

| Thing | Measured | Where |
|---|---|---|
| ContextMenu + useContextMenu | popover `placement 'right-start', offset 2, role 'menu'`, virtual point reference; panel `kol-dd-list min-w-44` (176px) `flex-col`, `focus={false}`; pushes the Escape layer | `NM/kol-component/src/molecules/ContextMenu.jsx:39-46,58-60,71,79,86` |
| MenuItem (trigger+panel) | trigger `kol-menu-btn kol-helper-12 px-3 … rounded text-body`, height `var(--kol-ctl-{size})` default md; caret `Icon chevron-down 10`; panel `w-max bg-surface-secondary rounded` (no border), `offset 4` | `molecules/MenuItem.jsx:23,42-50,61-71,79` |
| MenuDropdownItem | `kol-menu-btn w-full {rowClass ?? ROW_BY_SIZE[size]} inline-flex gap-2 text-body hover:text-emphasis`; `iconLeft` 16px column; `shortcut` `kol-helper-10 text-emphasis`; `hover={false}` for Dropdown | `molecules/MenuItem.jsx:124,128-150` |
| MenuDropdownDivider | `border-t border-oq-08 my-1` | `:153-155` |
| MenuPopover | deprecated alias of MenuItem | `molecules/MenuPopover.jsx:4,19-21` |
| Dropdown panel | `.kol-dd-panel` radius `0 0 sm sm`, flex column; `.kol-dd-div` `border-top --kol-fg-08`; `.kol-dd-list` `padding --kol-spacing-1`, `max-height: rows × var(--kol-dd-row-h, 2rem) + 8px`; trigger caret `INDICATOR` size, rotates 180° open; `iconOnly` trigger = pinned square; options `icon`/`shortcut`/`divider`/`heading` | `NM/kol-theme/kol-components-molecules.css:113-117,123,128-158`; `molecules/Dropdown.jsx:105,196-201,227,265,293-333` |
| Popover (usePopover/PopoverPanel) | `@floating-ui/react`; defaults `placement bottom-start, offset 6, flip, shift 8`; `.kol-popover` bg `var(--kol-tone-bg, surface-secondary)`, border `1px --kol-oq-04`, radius sm, shadow, `z --kol-z-tooltip 300`; `.kol-popover-float` `z-index 210; max-width calc(100vw - 16px)`; panel carries `data-editor-keep-selection` | `utilities/Popover.jsx:49-65,282-296`; `NM/kol-theme/kol-components-molecules.css:21-29,163-177` |
| Tooltip | `hover: true, focus: true, click: false`, delay `{open 400, close 100}`, `mouseOnly`; `asChild` clones the child; `.kol-tooltip` mono **11px/1**, `padding 4px 8px`, border `1px --kol-oq-08`, bg `var(--kol-tone-panel-bg, surface-secondary)`, `pointer-events none`, `z 300`; `.kol-tooltip-key` 16px tall, 10px type, bg `--kol-fg-08`, radius **3px** | `utilities/Popover.jsx:60,127,161-245`; `NM/kol-theme/kol-components-molecules.css:192-227` |
| "IconButton" | no component of that name; two idioms: `Button iconOnly` (states, `.kol-btn-icon` pinned square, `flex: none`) and `IconFrame` (no states; `onClick` → `<button>`) | `atoms/Button.jsx:22,122`; `NM/kol-theme/kol-components-atoms.css:275-302`; `atoms/IconFrame.jsx:62-73,104-122` |
| ToolPalette row ink | `.kol-tool-palette .kol-btn { --kol-tone-fg: --kol-oq-64; hover-bg --kol-oq-08; pressed-bg --kol-surface-sunken }`; pressed `inset 0 0 0 1px --kol-oq-16`; `:active scale(.92)`; quiet opacity forced 1 | `NM/kol-theme/kol-components-organisms.css:953-969` |

## 8. Type classes (kol-theme)

Font: `--kol-font-family-mono: 'JetBrains Mono', monospace` + variable `@font-face` at `/fonts/jetbrains-mono/JetBrainsMono-Variable.woff2` (`NM/kol-theme/kol-typography-mono.css:36-62`). Classes in `NM/kol-theme/kol-type-mono-classes.css`:

| Class | size | line-height | weight | letter-spacing | text-transform | Line |
|---|---|---|---|---|---|---|
| kol-mono-8 | 8px | 12px | 400 | — | none | 20-25 |
| kol-mono-10 | 10px | 14px | 400 | — | none | 27-32 |
| kol-mono-12 | 12px | 16px | 400 | — | none | 34-39 |
| kol-mono-14 | 14px | 18px | 400 | — | none | 41-46 |
| kol-mono-16 | 16px | 22px | 400 | — | none | 48-53 |
| kol-mono-20 | 20px | 26px | 400 | — | none | 55-60 |
| kol-mono-heading-03 | `--kol-text-heading-03` (32px) | 110% | 500 | — | none | 70-75 |
| kol-mono-display-03 / -02 | 36→48 / 44→64 (bp-scaled tokens) | 100% | 500 | — | none | 77-89 |
| kol-helper-8 | 8px | 1 | 500 | 0.10em | none | 98-104 |
| kol-helper-10 | 10px | 1 | 500 | 0.10em | none | 106-112 |
| kol-helper-12 | 12px | 1 | 500 | 0.06em | none | 114-120 |
| kol-helper-14 | 14px | 1 | 500 | 0.06em | none | 122-128 |
| kol-helper-16 | 16px | 1 | 500 | 0.06em | none | 130-136 |
| kol-helper-20 | 20px | 1 | 500 | 0.06em | none | 138-144 |

Roles with transform (`NM/kol-theme/kol-type-roles.css`): `.kol-eyebrow` 12/1/500/0.06em **uppercase** (`:285-292`); `.kol-doc-eyebrow` 10/1/500/0.1em uppercase `--kol-fg-strong` (`:36-44`); `.kol-card-tag` 10/1/500/0.1em uppercase (`:335-343`); `.kol-card-meta` 12/1/500/0.06em no transform `--kol-fg-48` (`:305-312`); `.kol-item-name` mono 12/16 (`:353-357`); `.kol-doc-caption` 12/16/400/0.02em (`:241-249`). Sans tokens: `--kol-text-heading-03: 32px`, `-04: 24`, `-05: 20`, `-06: 16`, `body-01 16`, `-02 14`, `-03 12` (`NM/kol-theme/kol-typography.css:750-760`).

## 9. Tokens relevant to rails

| Token / class | Value | Where |
|---|---|---|
| `--kol-ctl-xs/sm/md/lg` | 22/26/32/40 (touch 32/32/36/40) | `NM/kol-theme/kol-base-tokens.css:213-226` |
| `--kol-sidenav-w` | 264px; **320px @ ≥1536** | `NM/kol-framework/kol-framework.css:46,298` |
| `--kol-sidenav-w-collapsed` | 56px | `NM/kol-framework/kol-framework.css:65` |
| `--kol-sidenav-grab-w / -snap / -step / -snap-default` | `--kol-spacing-2` / 12rem / `--kol-spacing-4` / step | `:61-64` |
| `--kol-shell-nav-w`, `--kol-shell-toc-w` | 256px each (workshop rails) | `:75-76` |
| `--kol-shell-rail-width` | 48px closed (NavRail live width) | `NM/kol-theme/kol-components-shell.css:19`; `NM/kol-shell/src/NavRail.jsx:78-79` |
| `--kol-shell-drawer-width` | 240px default (NavRail drawer mode) | `NM/kol-shell/src/NavRail.jsx:71,324` |
| EditorShell `railWidth` | 320 default via `var(--kol-editor-{left|right}-w, 320px)` | `NM/kol-component/src/utilities/EditorShell.jsx:60,78,160` |
| `--kol-shell-page-pad` | `var(--kol-pad-section-x, clamp(20px,5vw,48px))`; section-x = 20/32@768/48@1024 | `NM/kol-theme/kol-components-shell.css:32`; `kol-framework.css:116,126,137` |
| `--kol-pad-rail-row-y` / `-x` | 0.375rem / 1.25rem | `NM/kol-theme/kol-design-tokens.css:39,44` |
| `--kol-spacing-1…24` | 4·8·12·16·20·24·32·40·48·64·80·96 (rem); registered as Tailwind `--spacing-*` | `NM/kol-theme/kol-design-tokens.css:12-23,234-245` |
| `--kol-gap-wall-grid / -list` | 24px / 8px | `:65-66` |
| `--kol-radius-xs/sm/md…2xl/full` | 2 / 4 / 4 / 4 / 4 / 4 / 9999px | `:113-123` |
| `--kol-z-*` | base 1 · dropdown 10 · sticky 20 · overlay 50 · modal 100 · toast 200 · tooltip 300 · nav 1000 (popover-float hardcodes 210) | `:139-146`; `kol-components-molecules.css:24` |
| Hairline / border | ruled control border `--kol-oq-08` (opaque); `--kol-border-default` = 8% alpha of on-primary; `--kol-focus-ring` = accent; `--kol-focus-ring-quiet` = `--kol-fg-32` | `kol-components-atoms.css:37,61`; `kol-color.css:92,119-121` |
| `--kol-oq-NN` | `color-mix(on-primary NN%, surface-primary)` opaque ladder (04/08/12/16/24/48/64/96 …) | `NM/kol-theme/kol-opaque.css:42-54` |
| `--kol-fg-NN` | alpha ladder 01…96 | `NM/kol-theme/kol-opacity.css:42-65` |
| fg roles | subtle 24 · meta 48 · body 64 · lede 72 · strong 80 · shout 88 · scream 96 · emphasis = on-primary; classes `.text-meta` etc. | `NM/kol-theme/kol-opacity.css:499-531` |
| Surfaces | light primary #fafafa / secondary #f2f2f2 / tertiary #fff / sunken `oq-ab-100`; dark #121215 / #19191d / #0e0e11 / `oq-ab-96` | `NM/kol-theme/kol-base-tokens.css:47-54,89,110-118` |
| Tone bundles | `.kol-tone-primary` (bg surface-secondary, hover `rgb(from … -8)`, active -16) · `secondary` (page) · `inverted` (on-primary fill) · `outline` (border oq-08, panel border 1px) · `ghost` (fg oq-48, hover oq-04) · `grey` (oq-12) · `sunken` | `NM/kol-theme/kol-components-molecules.css:1978-2145` |
| `--kol-content-*` | canvas 87.5rem · shell 1800 · panel 960 · column 768 · measure 65ch | `NM/kol-theme/kol-design-tokens.css:101-105` |

## 10. Cursors

No `--kol-cursor-*` token and no `.kol-cursor-*` class exists in kol-theme (grep). Cursors appear only inside component rules: `.kol-control`/`.kol-btn` `cursor: pointer` (`NM/kol-theme/kol-components-atoms.css:65,240`); `.kol-textarea-resize-icon` `nwse-resize` (`:113`); `.kol-slider-dual-playhead` `grab`/`grabbing` (`:733-735`); layer rows `grab`/`grabbing` (`kol-components-organisms.css:778,796-797`); rail grab `col-resize` (`kol-animation.css:348`; `kol-components-molecules.css:1769`), `row-resize` (`:1779`), `nwse-resize` (`:1422`); disabled seg cell `cursor: default` (`:664`); `.kol-btn:disabled` `not-allowed` (`atoms.css:347`). JSX: Input shell `cursor-text` (`atoms/Input.jsx:113`); eyedropper fallback sets `canvas.style.cursor='crosshair'` (`hooks/useEyedropper.js:46-47`). `AsciiCursor` is a JS custom-cursor utility, not CSS (`NM/kol-component/src/index.js:155`).

## 11. kol-icons

Mechanism: `<Icon name size={16} className style>` (`NM/kol-icons/src/Icon.jsx:123-129`); registry = raw SVG strings via `import.meta.glob` (`iconData.js:14,21`), lazy-loaded chunk (`Icon.jsx:27-40`); resolution `CUSTOM → V1 (interface) → SIGNAL` (`:90-94`); `registerIcons(globMap)` for app SVGs (`:75-80`); size applied by rewriting root `<svg width/height>` (`:110-121`); wrapper `pointer-events: none` (`:189`). Names are filenames. Exports: `Icon, registerIcons, KOL_ICON_SET_INTERFACE(_NAMES/_META), KOL_ICON_SET_SIGNAL*, KOL_ICON_META, getCut, getSet, ICONS, ALL_ICONS, hasIcon, getCategory` (`index.js:24-97`). Conventions (measured): interface set 241 files, 240 of them `viewBox="0 0 24 24"` (`fold-indicator` is `0 0 4 4`); `stroke-width="1.5"` ×426, `2` ×21, `3` ×2; signal set 101 files all 24-box, 1.5 stroke (×108), 6 ×3. `cuts.json` marks each `stroke|solid` (`index.js:58-66`). Vite-only; needs `@source` and `optimizeDeps.exclude` (`README.md:5,43-64`).

| Need | Present? | Name → path (`NM/kol-icons/src/kol-icon-set-interface/…`) | Cut |
|---|---|---|---|
| select / arrow tool | yes | `pointer` → `tools/pointer.svg` (also `arrow-up/down/left/right` in `arrow/`) | stroke |
| node / direct-select | **no** | nearest: `target` (`tools/target.svg`, solid), `drag-handle` | — |
| pen | yes | `pen` → `tools/pen.svg` (stroke-width 2); `pen-nib` → `editing/pen-nib.svg` (solid) | stroke |
| rectangle | yes | `rectangle` → `shape-primitives/rectangle.svg`; also `square` | stroke |
| ellipse | **no** | `circle` → `shape-primitives/circle.svg` | stroke |
| polygon | yes | `polygon` → `shape-primitives/polygon.svg` (hexagon) | stroke |
| star | yes | `star` → `shape-primitives/star.svg`; `star-solid` | stroke |
| text | yes (as `type`) | `type` → `typography/type.svg` (solid), `type-02`, `aa`, `a-framed` | solid |
| zoom | **no** | `search` (`singletons/search.svg`), `maximize` (`layout/`) | — |
| hand | **no** | `drag-handle` (`tools/drag-handle.svg`) | — |
| orbit / 3d | **no** | signal: `shape-cube/-sphere/-ico/…` (`kol-icon-set-signal/shape/`) | — |
| torus | yes | `shape-torus` → `kol-icon-set-signal/shape/shape-torus.svg` | stroke |
| camera | yes | `camera` → `device/camera.svg` | stroke |
| crop | yes | `crop` → `tools/crop.svg` | stroke |
| rotate cw / ccw | yes (as left/right) | `rotate-right` / `rotate-left` → `tools/rotate-*.svg` | stroke |
| flip h / v | yes | `flip-horizontal` / `flip-vertical` → `tools/flip-*.svg` | solid (one half filled) |
| eyedropper / pipette | yes (as `eyedrop`) | `eyedrop` → `tools/eyedrop.svg` | solid |
| trash | yes | `trash` → `singletons/trash.svg` | stroke |
| more / ellipsis | yes (as `more`) | `more` → `nav/more.svg` | solid |
| plus | yes | `plus` → `add-remove/plus.svg` (+ `minus`, `x`, `check`) | stroke |
| lock | yes | `lock` / `unlock` → `eye-lock/` | stroke |
| eye | yes (as `eye-on`/`eye-off`) | `eye-lock/eye-on.svg`, `eye-off.svg` | stroke |
| align-* | yes | `align-horizontal-left/center/right`, `align-vertical-top/center/bottom` → `tools/` | stroke (bars filled) |
| distribute-* | **no** by that name | `space-evenly-horizontal` / `space-evenly-vertical` → `tools/` | stroke |
| extra editor glyphs present | — | `boolean-unite/subtract/intersect/exclude`, `mask`, `opacity`, `corner-radius`, `layers`, `swap`, `fold-indicator`, `resize-grip`, `angle`, `line`, `triangle`, `diamond` | mixed |

## Contradictions

1. **Collapsed rail width**: `--kol-shell-rail-width: 48px` (`NM/kol-theme/kol-components-shell.css:19`; `NM/kol-shell/src/NavRail.jsx:79`) vs `--kol-sidenav-w-collapsed: 56px` (`NM/kol-framework/kol-framework.css:65`); SideNav's own docstring records "fxr measured 48 vs 56 wide" (`NM/kol-framework/src/SideNav.jsx:72`).
2. **Open rail width**: `--kol-sidenav-w` 264/320 (`kol-framework.css:46,298`) vs `--kol-shell-nav-w` 256 (`:75`) vs EditorShell default 320 (`utilities/EditorShell.jsx:78`) vs ShellDrawer 240 (`NavRail.jsx:71`) vs SettingsPanel 380 (`organisms/SettingsPanel.jsx:50`).
3. **Menu row height**: `MenuDropdownItem` sm/md/lg rows `h-8` (32) in `kol-helper-12` (`molecules/MenuItem.jsx:124`) vs Dropdown rows `h-[var(--kol-ctl-sm)]` (26) in `kol-mono-12` (`molecules/Dropdown.jsx:45-51`) — same component, two row ladders; ContextMenu inherits the 32 (`ContextMenu.jsx:79`).
4. **Tool-menu rows**: SplitToolButton hand-rolls `kol-helper-12 px-3 h-8` + `Icon size={14}` (`molecules/SplitToolButton.jsx:152-155`) while Dropdown's option rows use the mono face + `glyphSize` (`Dropdown.jsx:295,329`); SplitToolButton's docstring claims the duplication is closed (`:33-47`).
5. **ViewToggle rung**: `lg` maps to `kol-mono-12` (`atoms/ViewToggle.jsx:98-99`) whereas every other control maps lg→`kol-mono-16` (`atoms/Button.jsx:106-107`, `Input.jsx:67`); icon chip is `p-1.5` + 14px glyph = 26 not on `--kol-ctl-*` and 14 is ADJACENT-sm, not SOLO (`ViewToggle.jsx:90,118`; `hooks/glyphLadders.js:27,30`).
6. **Textarea xs**: `SIZE_TYPE.xs` exists (`atoms/Textarea.jsx:34`) but theme has only default/md/lg textarea paddings (`kol-components-atoms.css:99-103`), so xs = mono-8 in sm padding.
7. **Label casing, five mechanisms** vs the "no auto-casing" law (`atoms/ToggleSwitch.jsx:15-16`; `kol-components-atoms.css:227-228`; `NM/kol-shell/src/TabStrip.jsx:6-8`): JS `toUpperCase()` (`SettingsPanel.jsx:122`), inline `textTransform` (`LabeledControl.jsx:47`), CSS on `.kol-eyebrow` (`kol-type-roles.css:291`), CSS on `.kol-sidenav-hop` (`kol-components-atoms.css:802`), and `uppercase` utility (`SettingsPanel.jsx:65`); LabeledControl's docstring says "uppercase" with no transform in code (`LabeledControl.jsx:16,82`).
8. **Label column widths**: 48 (`LabeledControl.jsx:36`) · 160 (`SettingsPanel.jsx:120`) · 12rem (`kol-components-molecules.css:415`) · 24px swatch column (`ColorInputRow.jsx:202`).
9. **Row label type**: `kol-helper-10` (`LabeledControl.jsx:82`, `InspectorSection.jsx:53`, `PropertyInput.jsx:24`) vs `kol-mono-12 text-emphasis` (`FieldRow.jsx:236`) vs `kol-helper-12` (`ColorInputRow.jsx:177`) vs `kol-eyebrow` 12 (`SettingsPanel.jsx:158`) vs pane title mono 14/18 (`kol-components-molecules.css:1030`).
10. **Stale pinned-square comment**: molecules.css says `.kol-btn-icon.kol-btn-sm` is 28×28 (`NM/kol-theme/kol-components-molecules.css:47`) while the rule is `--kol-ctl-sm` = 26 (`kol-components-atoms.css:300`).
11. **Off-ladder glyph sizes**: Dropdown check `11` (`Dropdown.jsx:321`), MenuItem caret `10` (`MenuItem.jsx:67`), StatusChip chevron `10` (`FieldRow.jsx:78`), TabsRow chevron `12` (`TabsRow.jsx:77`), Textarea grip `12` (`Textarea.jsx:117`) vs `INDICATOR {8,12,14,16}` (`glyphLadders.js:40`); tooltip type `11px` (`kol-components-molecules.css:208`) is off the mono ladder.
12. **Hairline ink**: Divider default `bg-fg-08` alpha (`atoms/Divider.jsx:17-19`) vs ViewToggle in-well divider `bg-oq-16` opaque, `h-4` (`ViewToggle.jsx:134`) vs ToolPalette divider height 20 (`ToolPalette.jsx:48`) vs Divider vertical default 16 (`Divider.jsx:17`); the theme's own rule says chrome borders are opaque `oq-08` (`kol-components-atoms.css:37`).
13. **Floating panel edges**: `.kol-popover` border `--kol-oq-04` (`kol-components-molecules.css:171`) vs `.kol-tooltip` `--kol-oq-08` (`:204`) vs ColorInputRow popover `border-fg-08` (`ColorInputRow.jsx:224`) vs SplitToolButton `border-oq-08` (`SplitToolButton.jsx:143`) vs MenuItem panel no border (`MenuItem.jsx:79`).
14. **Border token spelling**: `--kol-border-default` is alpha 8% (`kol-color.css:119`) and QuantityInput uses it (`molecules/QuantityInput.jsx:90,109`) while every ruled control uses opaque `--kol-oq-08` (`kol-components-atoms.css:37`; `kol-components-molecules.css:602`).
15. **`inverse` vs `inverted`**: `inverse` = sunken alias, `inverted` = text-as-fill (`utilities/tone.js:24-27`); ViewToggle and Input docstrings still advertise `tone="inverse"` as "the dark chip" (`ViewToggle.jsx:25-35`; `Input.jsx:14-15`).
16. **Dropdown list ceiling**: `.kol-dd-list` fallback row `2rem` (`kol-components-molecules.css:158`) vs rows actually `--kol-ctl-sm` 26 (`Dropdown.jsx:50,282`).
17. **Icon count / README**: README says "341-icon registry" and documents `SVG_ENTRIES` + categories `rack, navigation, actions` (`NM/kol-icons/README.md:3,21-24`); disk has 342 (241 + 101), `index.js` exports no `SVG_ENTRIES`, groups are folder names (`index.js:29-41`).
18. **Textarea grip ink `--kol-oq-48`** (`kol-components-atoms.css:112`) vs Stepper chevrons `text-oq-48` but inline-variant `text-oq-40` (`Stepper.jsx:82,126`) — two rest inks for the same affordance.

## Open questions

- `.kol-inspector-rail` / `-body` are emitted (`NM/kol-component/src/molecules/InspectorRail.jsx:55-56`) but no rule exists in any kol-theme file — consumer hook by design, or a missing rule?
- `SegmentedSunkenNoBorder` is not a string in 0.171.0; the sunken strip rule is `kol-components-molecules.css:2296-2300`. Is the name from a kol-fxr ticket rather than the theme?
- `--kol-tone-ground` is only ever set for `.kol-hw-panel.bg-surface-secondary` (`NM/kol-theme/kol-components-controls.css:58-60`); outline/ghost panels fall back to `--kol-surface-primary` (`kol-components-molecules.css:2085`). Does kol-fxr set it on its rails?
- Whether kol-fxr ships `/fonts/jetbrains-mono/JetBrainsMono-Variable.woff2` (the `@font-face` URL at `kol-typography-mono.css:38`) — outside this area.
- kol-fxr calls `registerIcons` nowhere under `src/` (grep), so the missing editor glyphs (node, ellipse, zoom, hand, orbit, distribute) must come from somewhere else — inline SVG, a local component, or an `iconComponent` seam (`atoms/Button.jsx:36`; `organisms/ToolPalette.jsx:32`). Which one is the other maps' question.
- Tailwind utilities inside package JSX (`p-1.5`, `h-[18px]`, `min-w-44`, `-mx-1`) only generate if `kol-sources.css` is imported; kol-fxr imports it in both entries (`src/index.css:24`; `src/index.lib.css:42`) and excludes all six packages from prebundling (`vite.config.js:50-57`). Whether the lib build (`index.lib.css:25`, the umbrella) is meant to carry the five domain packs that `core` omits is not answered by the code.
- ViewToggle's `lg` rung and Textarea's `xs` rung behave as noted above — intended or unfinished?
