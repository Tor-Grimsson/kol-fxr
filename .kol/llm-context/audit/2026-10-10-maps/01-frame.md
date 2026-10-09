# 01 — THE FRAME (editor chrome): top bar · toolbar · rails · canvas · dock · chips · cog

Read-only map of kol-fxr at HEAD (2026-10-09). Every value below is read from the code; path:line is repo-relative (`node_modules/@kolkrabbi/<pkg>/...` for KOL). KOL versions installed: kol-component 0.246.0, kol-shell 0.63.0, kol-icons 0.34.0, kol-theme 0.171.0, kol-framework 0.49.0 (each `node_modules/@kolkrabbi/<pkg>/package.json`).

## 0. Mount tree (what wraps what)

| Depth | Node | Where |
|---|---|---|
| 0 | `BrowserRouter > RouterBridge > LegacyViewRedirect > Suspense > Routes` | src/App.jsx:100-123 |
| 1 | `<Route element={<AppLayout/>}>` holds `/`, `/library`, `/settings`, `/editor`, `/labs`, `/morph`, `/randomiser`; `/output` sits outside | src/App.jsx:105-118 |
| 1 | `/editor` → lazy `DesignEditor mediaProxyBase="/media/"` from `src/index.jsx` → `src/core.jsx:46` | src/App.jsx:27-30, src/core.jsx:46 |
| 2 | `AppLayout`: `ModalProvider > RailSignIn, NewFileDialog, MediaPickerDialog, AppHub{…}> (ChromeSettingsKey) > RailFrame > <Outlet/>` | src/AppLayout.jsx:340-421 |
| 3 | **`AppHub`** (kol-shell) → **`AppShell`** → **`NavRail`** (default `railComponent`) + content div `marginLeft: var(--kol-shell-rail-width)` | node_modules/@kolkrabbi/kol-shell/src/AppHub.jsx:92, AppShell.jsx:136, AppShell.jsx:369-387 |
| 4 | `RailFrame` publishes `--fxr-rail` = `0px` or `var(--kol-shell-rail-width)` via `useNavHidden` | src/AppLayout.jsx:235-242 |
| 5 | `Editor` → `EditorProviders` (ErrorBoundary > ModalProvider > Library > Tool > Compose > Palette > Pattern > Type > UrlIntents) → `EditorBody` or `NarrowWindowNote` below 1024 | src/editor/Editor.jsx:83-107, :114-121; src/editor/mobile/device.js:20 |
| 6 | `EditorBody`: `Compose + MediaPickSink + PaletteModal + FilesDialogHost` | src/editor/Editor.jsx:59-68 |
| 7 | `Compose` → `EditorShell registry={composeRegistry()}` | src/editor/Compose.jsx:25-40 |
| 8 | `div.kol-editor-shell[data-editor-keep-selection] > Topbar(MenuTop) > div.kol-editor-grid > [aside.kol-editor-left, div.kol-editor-canvas-column > (.kol-editor-canvas-header, main.kol-editor-canvas, .kol-editor-canvas-footer), aside.kol-editor-right] > ShortcutsOverlay > SettingsDrawerHost` | src/editor/EditorShell.jsx:102-128 |

Compose registry slots (src/editor/Compose.jsx:25-35): `canvas: CanvasArea` (:26) · `canvas.header: ToolPalette` (:28) · `left.body: ColorModal order -1` (:29) · `left.body: LayersAssetsPanel` (:30) · `left.footer: EditorFooter` (:31) · `right.body: SelectionPalettePanel` (:32) · `canvas.footer: pack('motion').TimelineDock` only when the motion pack registered (:33). No `topbar` key → `MenuTop` default (src/editor/EditorShell.jsx:91). `canvas.overlay` slot exists (src/editor/EditorShell.jsx:96,115) but Compose declares none.

Stylesheets: `src/index.css` is imports-only — tailwind (:1), `@kolkrabbi/kol-theme/core` (:14), `kol-sources.css` (:24), `kol-brand-color.css` (:28), `kol-framework.css` (:33), rule "THIS FILE IS IMPORTS ONLY" (:35-38). The editor's own CSS is `src/editor/styles/kol-editor.css` imported by src/editor/EditorShell.jsx:3; `kol-labs.css` is imported by src/editor/labs/LabsView.jsx:1 only.

## 1. KOL shell wrappers (question 6)

| Component | Package source | What it does here | Props from AppLayout |
|---|---|---|---|
| `AppHub` | kol-shell/src/AppHub.jsx:49-120 | Renders `HubHome` at `/`, `HubSettings` at `/settings`, else `children` (:83-86); pins a Settings row `{icon:'nav-settings'}` (:47,:87); passes `railToggleKey='\\'` (:103), `settingsKey=','` (:105), `touch="bar"` default (:110), `pageWash` (:112); `shell` spread last (:113); mounts kol-component `ShortcutsOverlay` on `S` (:5,:68-80,:114) | `touch:'drawer'`, `railSections:'enter'`, `navKeys:false`, `settingsKey` off on chrome, `bottomItems` (src/AppLayout.jsx:408-414); `shortcutsKey` null on chrome (:407) |
| `AppShell` | kol-shell/src/AppShell.jsx:325-392 | `div.kol-app-shell` (:333); zeroes `--kol-shell-rail-width` when `navHidden`/drawer/bar (:340); drawer trigger `Button variant="nav" iconOnly hamburger/x` (:346-355); scrim button (:363); `Rail` (:369-381); content `div.bg-surface-primary.min-w-0 style={marginLeft: var(--kol-shell-rail-width)}` (:387). `drawerBelow=768` (:146) | — |
| `NavRail` | kol-shell/src/NavRail.jsx | `div.kol-shell-rail bg-surface-primary fixed inset-y-0 left-0 … pt-4 pb-4 px-2 gap-2 border-r border-fg-08` (:321), `style.width = var(--kol-shell-rail-width)` (:324); `CLOSED = 48` (:79); open width = `--kol-sidenav-w` fallback 264 (:83-87); gsap sets 48 on mount (:114), drag clamps 48..open (:139), release snaps (:145-147); grab = `button.kol-rail-grab` (:341-347); logomark 20px in `w-8` box (:357-360); bottom rule `-mx-2 border-t border-fg-08` (:375) | `items` NAV_ITEMS (src/AppLayout.jsx:86-94: `nav-library`, `desktop`, `globe`, `swap`, `refresh`), `bottomItems` (`image` Media, `cloud`/`user` Sign in, `nav-settings` Settings — :277-282), logomark `@kolkrabbi/kol-brand/svg/favicon-01.svg?url` (:6) |
| `useNavHidden` | kol-shell/src/navHidden.js (export kol-shell/src/index.js:14) | `RailFrame` reads it for `--fxr-rail` | src/AppLayout.jsx:3,236 |
| `ShortcutsOverlay` | kol-component/src/organisms/ShortcutsOverlay.jsx (re-export kol-shell/src/index.js:29; kol-component/src/index.js:129) | the editor's cheat sheet | src/editor/shell/ShortcutsOverlay.jsx:2,64 |
| `ThemeToggle` | kol-framework | Hub settings page toggle `fill="none" tone="sunken" label={false} size="sm"` | src/AppLayout.jsx:5,406 |

Shell-rail tokens: `--kol-shell-rail-width: 48px` (kol-theme/kol-components-shell.css:19); `.kol-shell-rail { z-index: var(--kol-z-sticky) }` (= 20, kol-components-shell.css:107; kol-design-tokens.css:141); `--kol-sidenav-w: 264px` (kol-framework/kol-framework.css:46) → `320px` at `min-width:1536px` (:298); `--kol-sidenav-w-collapsed: 56px` (:65). `.kol-rail-grab` = `position:absolute; top:0; bottom:0; right:-3.5px; width:8px; cursor:col-resize` (kol-theme/kol-animation.css:342-349), pill `0.125rem × 4.5rem` (:351-362), coarse pointer 24px wide (kol-components-shell.css:272-276).

Keys owned at the shell tier: `⌥1…⌥7` local in AppLayout (src/AppLayout.jsx:319-331, KEY_ORDER :109); `\` hides the rail (AppHub.jsx:103); `,` on chrome routes → `ChromeSettingsKey` dispatches `kol:open-settings` (src/AppLayout.jsx:247-258, :416).

## 2. Top bar — `MenuTop` (question 1)

Container: `div.kol-editor-topbar flex items-center gap-3 px-4 h-12 border-b border-oq-08` (src/editor/shell/MenuTop.jsx:209). 48px tall. Rendered as `Topbar` by src/editor/EditorShell.jsx:104.

| # | Element (left→right) | Component (source) | Measured |
|---|---|---|---|
| 1 | Frame name field, placeholder "Untitled", `aria-label="Frame name"`, `title="Rename"` | `Input` — kol-component/src/atoms/Input.jsx (export index.js:47) | `variant="ghost"` (→ outline, Input.jsx:105) `size="md"` `width="220px"` `inputClassName="kol-helper-12 text-emphasis"` (MenuTop.jsx:212-222); class `kol-control kol-control--outline kol-control-md` (Input.jsx:108-112); comment: `md` chosen because "at `sm` it stood 26 beside seven 32px menu triggers" (MenuTop.jsx:210-211) |
| 2 | Mode door, label **"Editor"** → rows from `MODES` (Editor · Labs · Randomiser) with `check` icon size 11 on current | `MenuItem` + `MenuDropdownItem` — kol-component/src/molecules/MenuItem.jsx (export index.js:120) | panel `py-1 w-[200px]`, `panelClassName="z-[var(--kol-z-tooltip)]"` (MenuTop.jsx:226-238); MODES src/editor/mode.js:14-23 |
| — | spacer `div.flex.items-center.gap-1.ml-auto` wraps 3–9 | — | MenuTop.jsx:239 |
| 3 | **Generative** (only if `pack('generators')`) | `MenuItem` + `MenuDropdownNest` | `w-[260px]`, `panelStyle maxHeight 70vh` (:245-259) |
| 4 | **Effects** (only if `pack('effects')`) | `MenuItem` + `MenuDropdownNest/Item/Divider` | `w-[260px]`, 70vh (:261-314); hint row `kol-mono-10 text-subtle` "Select a layer to apply an effect" (:267) |
| 5 | **Tools**: Color · ─ · Flatten shape · Release boolean | `MenuItem` | `w-[220px]` (:316-329) |
| 6 | **File**: New · ─ · Save/Save… · Save as… · Files… · Clear · ─ · Snap to objects, guides and canvas (check) · ─ · Export SVG · Export PNG · ─ · Undo `⌘Z` · Redo `⇧⌘Z` | `MenuItem` | `w-[220px]` (:331-372) |
| 7 | **Canvas**: Aspect ▸ (ASPECTS) · View ▸ Single/Social | `MenuItem` + `MenuDropdownNest` | `w-[220px]` (:374-402); ASPECTS src/editor/shell/aspects.js:1-10 |
| 8 | **Templates** (`align="end"`): Starters · N ▸, Palettes · N ▸, Patterns · N ▸, Types · N ▸, Presets · N ▸ | `MenuItem` + `MenuDropdownNest` | `w-[220px]`, 70vh (:404-454); empty row `kol-helper-10 text-subtle` "empty" (:424); palette swatches 8×14px (:435) |
| 9 | **Cog** — `Tooltip label="Display settings"` around `IconFrame name="settings-01" variant="primary" size="sm"`, onClick dispatches `kol:open-settings` | `IconFrame` — kol-component/src/atoms/IconFrame.jsx (export index.js:37); `Tooltip` kol-component/src/utilities/Popover.jsx:161 | (MenuTop.jsx:462-468); `.kol-icon-frame-sm { width/height: var(--kol-ctl-sm) }` = **26px** (kol-theme/kol-components-atoms.css:1185; kol-base-tokens.css:215); comment: NOT `nav-settings`, which the rail's Settings row wears (MenuTop.jsx:458-461) |

Menu trigger geometry: `button.kol-menu-btn.kol-helper-12.px-3 … gap-2 rounded text-body hover:text-emphasis` with `style.height = TRIGGER_H[size]` (MenuItem.jsx:61-62), `TRIGGER_H.md = var(--kol-ctl-md)` = **32px** (MenuItem.jsx:23; kol-base-tokens.css:216), chevron `chevron-down` (MenuItem.jsx:66-67). Row items `kol-helper-12 px-3 h-8` (MenuItem.jsx:124). Icons in the bar: `Icon` from `@kolkrabbi/kol-icons` (MenuTop.jsx:1); IconFrame's glyph also kol-icons (IconFrame.jsx:1,97).

Settings dropdown was removed 2026-08-28 (MenuTop.jsx:37-42). "Show grid" lives only in the drawer's host slot (src/editor/EditorShell.jsx:38-42).

## 3. Toolbar — `ToolPalette` (question 2)

Host: `canvas.header` slot (src/editor/Compose.jsx:28) → `div.kol-editor-canvas-header` (`flex:0 0 auto; border-bottom:1px solid var(--kol-oq-08); background: var(--kol-surface-primary)`, src/editor/styles/kol-editor.css:92-96). Renders KOL `ToolPalette` with `size="md" className="px-3 h-12"` (src/editor/shell/panels/ToolPalette.jsx:106-107) + hidden `<input type=file accept=image/*>` (:108). DS source: kol-component/src/organisms/ToolPalette.jsx (export index.js:134); row class `kol-tool-palette flex items-center gap-1 min-w-0 overflow-x-auto` (:48); every cell is `Button tone="ghost" size={size} quiet iconOnly` inside `Tooltip label shortcut` (:67-71); dividers `Divider variant="vertical" height={20} className="mx-1.5"` (:50); split cells are `SplitToolButton` (:53-57).

Rung: `.kol-btn-icon.kol-btn-md { width/height: var(--kol-ctl-md) }` = **32×32** (kol-theme/kol-components-atoms.css:301; kol-base-tokens.css:216); icon-only glyph = SOLO ladder `md: 20` (kol-component/src/hooks/glyphLadders.js SOLO; Button.jsx:72). Split trigger = `kol-btn kol-btn-ghost kol-btn-icon kol-btn-md` + `fold-indicator` size 4 (SplitToolButton.jsx:129, :74-75). Theme: `.kol-tool-palette .kol-btn` tone vars, pressed = sunken + `inset 0 0 0 1px var(--kol-oq-16)`, `:active scale(0.92)` (kol-theme/kol-components-organisms.css:953-969).

**Icon source, all cells:** `@kolkrabbi/kol-icons` `Icon` — DS ToolPalette.jsx:1 (default `iconComponent = Icon`, :45), SplitToolButton.jsx:2. Names resolve from kol-icons/src/cuts.json via lazy `iconData.js` (kol-icons/src/Icon.jsx:19-29). No local SVG/JSX icon in any frame file (the only `<svg>` under the shell is the curve graph in src/editor/params/TimelineDock.jsx). Every name below exists in cuts.json (checked).

Tool definitions: `TOOL_META` src/editor/state/tools.jsx:15-33; items array src/editor/shell/panels/ToolPalette.jsx:65-90; keymap src/editor/state/keymap.js:59-66.

| # | Cell (kind) | id | Icon (kol-icons) | Shortcut | Tooltip text | Disabled when | Source |
|---|---|---|---|---|---|---|---|
| 1 | tool | `select` | `pointer` | `V` | Select | — | tools.jsx:16; keymap.js:59 |
| 2 | split (tool fold) "Text" | `text-fold` → `text`; + `kinetic` (action, motion pack only) | `type` / `type` | `T` / — | "Text (T)" via trigger title; rows Text · Kinetic type | — | ToolPalette.jsx:67-71; tools.jsx:17 |
| 3 | tool | `pen` | `pen` | `P` | Pen | — | tools.jsx:18 |
| 4 | split (tool fold) "Shape" | `shape-fold` → rect, ellipse, triangle, line, polygon, star | `rectangle`, `circle`, `triangle`, `line`, `polygon`, `star` | `R`, `O`, —, —, —, — | "Rectangle (R)" etc. | — | ToolPalette.jsx:18,73; tools.jsx:19-24 |
| 5 | tool | `pattern` | `pattern-tool` | — | Pattern | — | tools.jsx:25 |
| 6 | tool | `zoom` | `search` | `Z` | Zoom | — | tools.jsx:28 (cursor `zoom-in`, src/editor/compose/CanvasArea.jsx:32) |
| 7 | tool | `orbit` | `camera` | `C` | Orbit | — | tools.jsx:32 |
| — | divider | | | | | | ToolPalette.jsx:77 |
| 8 | action | `flip-horizontal` | `flip-horizontal` | `⇧H` | Flip horizontal | `!canXform` | ToolPalette.jsx:80 |
| 9 | action | `flip-vertical` | `flip-vertical` | `⇧V` | Flip vertical | `!canXform` | :81 |
| 10 | action | `rotate-left` | `rotate-left` | — | Rotate 90° left | `!canXform` | :82 |
| 11 | action | `rotate-right` | `rotate-right` | — | Rotate 90° right | `!canXform` | :83 |
| — | divider | | | | | | :84 |
| 12 | split (action fold) "Boolean" | `boolean-fold` → unite, subtract, intersect, exclude | `boolean-unite`, `boolean-subtract`, `boolean-intersect`, `boolean-exclude` | — | rows Unite · Subtract front · Intersect · Exclude | `!canBool` (<2 booleanable) | :19-24, :85 |
| — | divider | | | | | | :86 |
| 13 | action | `image` | `image` | — | Insert image | — | :87 |
| 14 | action | `crop` | `crop` | — | Crop image | not photo or locked | :88 |
| 15 | action | `duplicate` | `copy` | `⌘D` | Duplicate | no selection or locked | :89 |

Tooltip chrome: `.kol-tooltip` mono 11px, `border:1px solid var(--kol-oq-08)`, `z-index: var(--kol-z-tooltip,300)` (kol-theme/kol-components-molecules.css:192-212); the key chip `.kol-tooltip-key` 16px tall, `bg: var(--kol-fg-08)`, 10px (:215-225). Single cells pass `shortcut` → chip (DS ToolPalette.jsx:67; Popover.jsx:241); split triggers build `"${label} (${shortcut})"` as the label string (SplitToolButton.jsx:106,124) — no chip.

Duplicates / near-duplicates (see Contradictions 6–8): `type` glyph = Text tool and Kinetic type; `camera` = Orbit tool and Webcam button (src/editor/shell/panels/EditorFooter.jsx:144); `copy` = Duplicate, Batch export (EditorFooter.jsx:328), file Duplicate (src/AppLayout.jsx:226); `image` = Insert image, rail Media row (src/AppLayout.jsx:278), "From library" (EditorFooter.jsx:141); booleans + flatten/release exist 3× (toolbar fold; Tools menu MenuTop.jsx:322-327; `HeaderMoreMenu` src/editor/shell/panels/SelectionPalettePanel.jsx:110-151). `node-edit` `A` (keymap.js:60) has no toolbar cell.

## 4. Rails — widths, resize, collapse (question 3)

| Property | Left rail | Right rail | Where |
|---|---|---|---|
| Element | `aside.kol-editor-left` | `aside.kol-editor-right` | src/editor/EditorShell.jsx:68 |
| Grid track | **320px** | **320px** | `grid-template-columns: 320px minmax(0, 1fr) 320px` src/editor/styles/kol-editor.css:61 |
| Hairline | `border-right: 1px solid var(--kol-oq-08)` | `border-left: 1px solid var(--kol-oq-08)` | kol-editor.css:69, :76 |
| min / max | none declared | none declared | kol-editor.css:59-80 |
| Resizable | **no** — no `useDragResize`/grab in Compose, EditorShell, LayersAssetsPanel, SelectionPalettePanel, InspectorRail (grep: the only call is src/editor/labs/LabsView.jsx:163) | **no** (same) | — |
| Collapse | none; only the **footer** has a collapsed branch keyed on `html[data-rail="collapsed"]` (EditorFooter.jsx:65-80, :254-266) | none | — |
| Body | `.kol-editor-rail-body { flex:1 1 auto; overflow-y:auto; scrollbar-gutter:stable }` | same | kol-editor.css:152-161 |
| Content | `ColorModal` (left.body −1) + `LayersAssetsPanel` `div.kol-compose-rail.border-b.border-oq-08` → `TabsRow` Layers/Assets in `px-3` + `AddLayerButton` (src/editor/shell/panels/LayersAssetsPanel.jsx:19-24) · footer `EditorFooter` `padding: 16px 20px 24px 20px` (EditorFooter.jsx:269) with `SegmentedToggle` Transport/Output/File `size={cs}` (`'sm'` at the desk, src/editor/params/controlSize.js:26) + `TOGGLE_FIX = 'h-[26px]'` (EditorFooter.jsx:57,284) | `SelectionPalettePanel` `div.kol-compose-rail` → tab row `flex items-center gap-1 pl-3 pr-2 border-b border-oq-08` with `TabsRow` Inspector/Parameters/Effects(+Pattern) + `Button tone=ghost size=sm quiet iconOnly="more"` + `iconOnly="trash"` (SelectionPalettePanel.jsx:70-94) → `DsInspectorRail className="kol-compose-rail kol-compose-rail--inspector"` (src/editor/compose/InspectorRail.jsx:21) | `TabsRow` = `flex items-stretch gap-4 h-10`, tabs `kol-mono-12 … border-b-2` (kol-component/src/molecules/TabsRow.jsx:38,57) |

Equal? **Yes in the editor** — one declaration, both 320 (kol-editor.css:61); the docblock in src/editor/Editor.jsx:110 ("Its two 320px panels left an 80px stage at 768") agrees. The *labs* chrome re-targets the same grid: `.kol-editor-labs .kol-editor-grid { grid-template-columns: 0px minmax(0,1fr) var(--kol-rail-w) }` (src/editor/styles/kol-labs.css:60-65), `--kol-rail-w: var(--kol-sidenav-w)` = 264 / 320 ≥1536, `--kol-rail-w-collapsed: 48px` (kol-labs.css:26-29; kol-framework.css:46,298), collapsed via `:root[data-rail="collapsed"]` (kol-labs.css:68-70), grab mirrored `left:-3.5px` (:124-127), left rail `border-right: 0` (:144). Labs' right rail uses `useDragResize(railRef, { token:'kol-rail', side:'right' })` (LabsView.jsx:163) which stamps `data-rail` on `:root` (`buildNames`: `collapsedAttr = data-${token minus 'kol-'}`, kol-component/src/hooks/useDragResize.js:64-70, :90-91) and persists `localStorage['kol-rail']` (:173).

Collapsed-footer branch (EditorFooter.jsx:254-266): `div.flex.flex-col.px-2.pb-4` + rule `self-stretch -mx-2 border-t border-oq-08 mb-2` + `Button tone=ghost size=md iconOnly play|pause` — mirrors NavRail's pinned row shape (comment :59-64, :251-253).

Third geometry on the same screen: shell `NavRail` 48 closed / 264|320 open (NavRail.jsx:79,83-87). So on `/editor` the three rails read 48|264|320 · 320 · 320.

## 5. Timeline dock (question 4)

| Property | Value | Where |
|---|---|---|
| Registered | motion pack `TimelineDock` in `canvas.footer` | src/packs/motion.js:11,18,21; src/packs/index.js (imports `./motion`); src/index.jsx:8 `import './packs'`; src/editor/Compose.jsx:33 |
| Host | `div.kol-editor-canvas-footer` `{ flex:0 0 auto; background: var(--kol-surface-primary) }` | src/editor/EditorShell.jsx:117-121; kol-editor.css:179-182 |
| Opens | **automatically**: `if (tracks.length === 0) return null` — any layer prop with `{bind:'track'}` (or a morph) creates a track; no toggle, no button, no key | src/editor/params/TimelineDock.jsx:454, `collectTracks` :59-77 |
| Container | `div.kol-timeline-dock relative border-t border-oq-08 px-4 py-2 flex flex-col gap-1 select-none`, `background: var(--kol-surface-primary)`, `height: dockH ?? auto`, `maxHeight: DOCK_MAX` when auto | TimelineDock.jsx:471 |
| Height | `DOCK_MIN = 56`, `DOCK_MAX = 480` (:421); stored `localStorage['kol-fxr:dock-h']` (:420,:422,:452); `null` = as tall as lanes (:450); drag base fallback `120` (:473); double-click resets to `null` (:438-439,:475) | |
| Resize | top-edge `DockGrab` `role=separator aria-label="Resize the timeline"`, `useGrabEdge(ref, { axis:'x' })`, pointer capture, `dy = startY − clientY` (:424-441) | kol-component `useGrabEdge` (index.js:213) |
| Grab CSS | `.kol-timeline-grab { position:absolute; left:0; right:0; top:0; height:8px; cursor:row-resize }`, pill `4.5rem × 0.125rem`, `--kol-rail-grab-x` | kol-editor.css:188-211 |
| Rows | `ScrubRuler` → `TrackRow`s (scroll inside `overflow-y-auto`) → `GraphLane` → `SelectedKeyEditor` (`Input ghost sm chars=7`, `Dropdown subtle sm`, `Button ghost quiet sm`) | TimelineDock.jsx:477-490, :385-416 |

Labs registers the same `TimelineDock` directly (LabsView.jsx:16,316). The dock's atoms come from kol-component (TimelineDock.jsx:2); the dock itself returned to the app on 2026-10-08 (:21-27).

## 6. Canvas, zoom chip, ratio label (question 5)

Host: `main.kol-editor-canvas { flex:1 1 auto; min-height:0; min-width:0; background: var(--kol-surface-secondary) }` (kol-editor.css:98-106) → `CanvasArea` (src/editor/Compose.jsx:26). CanvasArea's wrapper `div.relative.w-full.h-full` with `cursor` and `background: infiniteColor` (src/editor/compose/CanvasArea.jsx:1342-1344); zoom tool click dispatches `kol:zoom-at` factor 2 / alt 0.5 (:1348-1353); then `<Canvas aspect customRatio bgColor showGrid showRulers guides setGuides panEnabled>` (:1366-1379); stage `div[data-tool]` (:1380-1383).

`src/editor/shell/Canvas.jsx` wraps KOL `Canvas` (import :1; export index.js:149): `aspects={ASPECTS}`, `backdrop={GRID}` (`div.kol-grid-bg.absolute` 500% — :21), `rulers`, `onSpaceTap` only with motion pack (:23-32). `.kol-grid-bg` step 32px, major every 4 (kol-editor.css:386-401).

| Chip | Markup | Where |
|---|---|---|
| Zoom % | `div.absolute.bottom-3.right-3.z-[3].flex.items-center.gap-2 > button.px-2.py-1.rounded.border.border-fg-08.bg-surface-secondary.kol-mono-12.text-emphasis.tabular-nums` text `${Math.round(zoom*100)}%`, `opacity 0.55` at rest, click resets, `Tooltip "Reset zoom (⌘0)"` | kol-component/src/organisms/Canvas.jsx:636-646 (`PanZoomViewport`, mounted by `panEnabled` :250-259) |
| fps | same classes, `<span>{fps} fps</span>`, shown while `f` toggles (:567-574), `Tooltip "Framerate — press F to hide"` | Canvas.jsx:647-655 |
| Ratio label | `span` `position:absolute; top:6; left:8; fontSize:10; fontFamily: var(--kol-font-family-mono); letterSpacing:0.1em; color: labelColor` (`var(--kol-fg-64)` without guideColor) — inline, no `kol-*` type class; text = aspect label or `Custom · N.NN` | Canvas.jsx:138-151, `resolveAspect` :63-71, `labelColor` :98 |
| Frame edge | `1px solid var(--kol-oq-24)` | Canvas.jsx:97,:132-136 |
| Crop mode chip (editor) | `kol-helper-10 text-emphasis bg-surface-secondary border border-oq-08 rounded px-2 py-1` "Crop · drag to pan · scroll to zoom · handles crop · ⏎ done · esc" | src/editor/compose/CanvasArea.jsx:1444-1445 |
| Labs fps chip | `chipCls = 'px-2 py-1 rounded border border-oq-08 bg-surface-secondary kol-mono-12 text-emphasis tabular-nums'`; zoom chips removed 2026-10-06, keys `-`/`+`/`0` instead | src/editor/labs/LabsView.jsx:71,:115-119,:140-144 |

Zoom keys live in the DS viewport: `⌘0` reset, `⌘=`/`⌘-` step 1.2 (Canvas.jsx:465-489), wheel/pinch `exp(-ΔY·0.0015)` (:531-543). Rulers `RULER = 18` px (:664). Canvas virtual width 1080 (`CANVAS_W/H` src/editor/compose/state.jsx:293-294). Legacy pure-CSS tooltip `[data-kol-tip]` (mono 10px, 400ms delay) still declared (kol-editor.css:122-143).

## 7. Settings cog, drawer, shortcuts sheet

- Cog (MenuTop.jsx:462-468) → `window.dispatchEvent('kol:open-settings')` → `SettingsDrawerHost` listener toggles (src/editor/EditorShell.jsx:28-32) → `DisplaySettingsDrawer` (src/settings/AppSettings.jsx:215-232) = `SettingsPanel variant="drawer" title="Display settings" footer={SettingsFooter reset}` with `AppSettingsSections` + host children (`LabeledControlSection "Canvas" > SettingsRow "Show grid" > SettingsSwitch`, EditorShell.jsx:38-42). `SettingsPanel` default `width = 380` (kol-component/src/organisms/SettingsPanel.jsx:50) → `ShellDrawer side="right"` (:103). Export index.js:187.
- `,` is declared `passive` in keymap (src/editor/state/keymap.js:99) and bound by AppLayout's `ChromeSettingsKey` (src/AppLayout.jsx:247-258); EditorShell binds no key (EditorShell.jsx:25-27).
- Rail Settings row: `nav-settings` (src/AppLayout.jsx:281; AppHub.jsx:47). Hub gear drawer `drawer: pathname !== '/settings'` applies to Hub pages only (src/AppLayout.jsx:390).
- Shortcuts sheet: `S` (keymap.js:87; `?` hidden alias :88) → `kol:show-shortcuts` → local `ShortcutsOverlay` state (src/editor/shell/ShortcutsOverlay.jsx:37-55) → kol-shell `ShortcutsOverlay` (:2,:64). Hub's `S` disabled on chrome (src/AppLayout.jsx:407).

## 8. Measured tokens & type classes used by the frame

| Token / class | Value | Where |
|---|---|---|
| `--kol-ctl-xs/sm/md/lg` | 22 / 26 / 32 / 40 px; coarse 32 / 32 / 36 / 40 | kol-theme/kol-base-tokens.css:214-217, :222-224 |
| `--kol-shell-rail-width` | 48px (rail's live width) | kol-theme/kol-components-shell.css:19 |
| `--kol-sidenav-w` / `-collapsed` | 264px (320 ≥1536) / 56px | kol-framework/kol-framework.css:46,298 / :65 |
| `--kol-rail-w` / `-collapsed` (DS) | 256px / 56px | kol-framework.css:901 / :905 |
| `--kol-rail-w` / `-collapsed` (app override, unscoped `:root`) | `var(--kol-sidenav-w)` / 48px | src/editor/styles/kol-labs.css:26-29 |
| z ladder | base 1 · dropdown 10 · sticky 20 · overlay 50 · modal 100 · toast 200 · tooltip 300 · nav 1000 | kol-theme/kol-design-tokens.css:139-146 |
| `--kol-oq-08` | opaque mix 8% on-primary over surface-primary | kol-theme/kol-opaque.css:43; `.border-oq-08` :228 |
| `--kol-fg-08` | translucent 8% on-primary | kol-theme/kol-opacity.css:45; `.border-fg-08` :398 |
| `kol-helper-12` / `kol-helper-10` | mono 12/1 · 10/1 | kol-theme/kol-type-mono-classes.css:114-117 / :106-109 |
| `kol-mono-12` / `kol-mono-10` / `kol-mono-16` | mono 12/16 · 10/14 · 16/22 | :34-37 / :27-30 / :48-51 |
| SOLO glyph ladder | xs 12 · sm 16 · md 20 · lg 24 | kol-component/src/hooks/glyphLadders.js |
| `.kol-btn-icon.kol-btn-{sm,md}` | 26×26 · 32×32 | kol-theme/kol-components-atoms.css:300-301 |
| `.kol-icon-frame-{sm,md}` | 26 · 32 | kol-components-atoms.css:1185-1186 |
| `.kol-editor-shell` | flex column, `height: 100dvh`, `background: var(--kol-surface-primary)`, `user-select:none` | kol-editor.css:26-33 |
| `EDITOR_BELOW` | 1024 (editor stands down below it) | src/editor/mobile/device.js:20; src/editor/Editor.jsx:114-121 |

## Contradictions

1. **Top bar docblocks vs code.** EditorShell's ASCII art shows `Frame title · File ▼ Canvas ▼ Templates ▼` (src/editor/EditorShell.jsx:50-52) and MenuTop's shows `[Frame title] [Tools ▼] [File ▼] [Canvas ▼] [Templates ▼] [⚙]` (src/editor/shell/MenuTop.jsx:32); the render is Input · Editor · Generative · Effects · Tools · File · Canvas · Templates · cog (MenuTop.jsx:212-468).
2. **Two rungs in one 48px bar.** The name field is `md` *because* the menu triggers are 32px (MenuTop.jsx:210-215; MenuItem.jsx:23,62 → `--kol-ctl-md` 32, kol-base-tokens.css:216) but the cog is `IconFrame size="sm"` = 26px (MenuTop.jsx:465; kol-components-atoms.css:1185; kol-base-tokens.css:215).
3. **Three rail widths on one screen.** Editor rails fixed 320 / 320 (kol-editor.css:61) · shell NavRail 48 closed / 264 or 320 open (NavRail.jsx:79, :83-87; kol-framework.css:46,298) · labs right rail `--kol-rail-w` = sidenav ladder, left track 0 (kol-labs.css:60-65). Editor rails equal the shell's open rail only at ≥1536.
4. **Collapsed width 48 vs 56.** App sets `--kol-rail-w-collapsed: 48px` (kol-labs.css:28), NavRail `CLOSED = 48` (NavRail.jsx:79), shell token 48 (kol-components-shell.css:19); kol-framework ships `--kol-rail-w-collapsed: 56px` (kol-framework.css:905) and `--kol-sidenav-w-collapsed: 56px` (:65). Acknowledged in kol-labs.css:19-21.
5. **Footer collapse with no collapser.** `EditorFooter` renders a 48px-style collapsed dock when `html[data-rail="collapsed"]` (EditorFooter.jsx:66,254-266), yet on `/editor` nothing stamps that attribute — only labs' `useDragResize({token:'kol-rail'})` (LabsView.jsx:163; useDragResize.js:64-70,90-91) — and the editor grid stays 320 (kol-editor.css:61). LabsView itself calls the stamp "stale" and strips it in places (LabsView.jsx:347-350, :370-384).
6. **Boolean/flatten labels.** Toolbar fold: `Unite`, `Subtract front`, `Intersect`, `Exclude` (ToolPalette.jsx:20-23); more-menu: `Union`, `Subtract`, `Intersect`, `Exclude` (SelectionPalettePanel.jsx:111-114); Tools menu `Flatten shape` (MenuTop.jsx:323) vs more-menu `Flatten` (SelectionPalettePanel.jsx:146).
7. **Two tooltip formats for shortcuts in one row.** Plain cells: shortcut as `.kol-tooltip-key` chip (DS ToolPalette.jsx:67; Popover.jsx:241; kol-components-molecules.css:215). Split triggers: `"${label} (${shortcut})"` inline text (SplitToolButton.jsx:106,124).
8. **One glyph, two meanings.** `camera` = Orbit tool (tools.jsx:32) and Webcam (EditorFooter.jsx:144); `type` = Text tool (tools.jsx:17) and Kinetic type action (ToolPalette.jsx:70); `copy` = Duplicate (ToolPalette.jsx:89), Batch export (EditorFooter.jsx:328), file Duplicate (src/AppLayout.jsx:226); `image` = Insert image (ToolPalette.jsx:87), rail Media (src/AppLayout.jsx:278), From library (EditorFooter.jsx:141); `search` = Zoom tool (tools.jsx:28) with cursor `zoom-in` (CanvasArea.jsx:32). (`settings-01` vs `nav-settings` is the one *deliberate* split, MenuTop.jsx:458-461.)
9. **Two hairline tokens.** Editor chrome uses `oq-08` (MenuTop.jsx:209; kol-editor.css:69,76,94,147; EditorFooter.jsx:257,269; LayersAssetsPanel.jsx:19-20); the shell rail and the DS zoom/fps chips use `fg-08` (NavRail.jsx:321,375; Canvas.jsx:641,649); the labs chip copy uses `oq-08` (LabsView.jsx:71). `fg-08` is translucent (kol-opacity.css:398), `oq-08` opaque (kol-opaque.css:228).
10. **Chip type class.** DS zoom/fps chip `kol-mono-12` (Canvas.jsx:641); labs chip `kol-mono-12` (LabsView.jsx:71); editor crop chip `kol-helper-10` (CanvasArea.jsx:1444); ratio label inline `fontSize:10` mono with no class (Canvas.jsx:143-146).
11. **"Scoped" labs CSS leaks.** kol-labs.css says everything is scoped under `.kol-editor-labs` (:2-3) but its `:root { --kol-rail-w…; --kol-rail-w-collapsed: 48px }` is global (:26-29); once LabsView has loaded (import LabsView.jsx:1) the override persists on `/editor`.
12. **Who binds `,`.** keymap.js says "Bound in `EditorShell.jsx`, where the drawer lives" (src/editor/state/keymap.js:92-98); EditorShell says "NO KEY IS BOUND HERE. AppLayout owns `,`" (src/editor/EditorShell.jsx:25-27; src/AppLayout.jsx:247-258).
13. **Dock default height.** Drag base fallback `120` (TimelineDock.jsx:473) vs reset-to-`null` auto (:475) vs `DOCK_MIN = 56` (:421).
14. **Zoom keys not in the keymap.** The DS viewport binds `⌘0`/`⌘=`/`⌘-` and the chip tooltip says "Reset zoom (⌘0)" (Canvas.jsx:465-489, :637), but keymap.js carries only labs' `-`/`+`/`0` (keymap.js:119-121) and Space (:110) — the editor's cheat sheet never lists zoom.
15. **kol-editor.css header promises a section 6 "DS shims"** (kol-editor.css:13) — the file ends after section 5 (:382-401).

## Open questions

- Can `data-rail="collapsed"` actually be left on `:root` when navigating labs → editor at a desk? LabsView strips it on pick / Morph arrival (LabsView.jsx:370-384) and on touch (:350), but no desk-unmount cleanup was found; the footer's collapsed branch is reachable only if it persists (or via `localStorage['kol-rail']` on the next labs mount).
- `IconFrame`'s glyph map `GLYPH[size]` (IconFrame.jsx:93) — the file imports only `SOLO` (:2); assumed `GLYPH === SOLO` (16px at `sm`), not verified.
- `AddLayerButton` (DS, kol-component/src/organisms/LayerStack.jsx via src/editor/compose/LayerStack.jsx:41-50) — its rung in the Layers tab row was not read.
- `ColorModal` in `left.body` order −1 (src/editor/Compose.jsx:29) — whether it renders inline in the rail or as an overlay was not read.
- `[data-kol-tip]` CSS tooltip (kol-editor.css:122-143): no consumer found in the frame files read; possibly dead.
- The shell rail's open width on a ≥1536 window is 320 by token (kol-framework.css:298), which would make it visually equal to the 320 editor rails; not verified in a rendered build.
- `TransportFab` (motion pack `canvas.overlay`, src/packs/motion.js:18) — registered by labs/mobile only (LabsView.jsx:17); Compose declares no overlay; whether mobile does was not read.
- `HubSettings`' masthead picker (`Dropdown w-48 tone="sunken"`, src/AppLayout.jsx:392-399) and the Hub gear: live only on `/settings`; their geometry is outside this area.
