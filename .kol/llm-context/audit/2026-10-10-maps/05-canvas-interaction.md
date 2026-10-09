# 05 — Canvas interaction map (kol-fxr @ d9b89a8 "fxr-1011")

Scope: `src/editor/compose/CanvasArea.jsx` (1644 lines, the pointer router), `src/editor/state/keymap.js`, `src/editor/state/useGlobalShortcuts.js`, `src/editor/state/tools.jsx` (the tool store), `src/editor/compose/useLayerEdit.js`, `src/editor/compose/snap.js`, `src/editor/modes/*` (palette / pattern / type data+render only — **no canvas interaction code lives there**), plus the KOL pieces the canvas composes. KOL versions: kol-component 0.246.0, kol-shell 0.63.0, kol-icons 0.34.0 (`node_modules/@kolkrabbi/*/package.json`).

## 0. Files and what each owns

| File | Owns | Cite |
|---|---|---|
| `src/editor/state/tools.jsx` | `TOOLS` list + `TOOL_META` (label, icon, shortcut), `ToolProvider`/`useTool` (one global `tool` string, default `'select'`) | tools.jsx:13-46 |
| `src/editor/state/keymap.js` | `SHORTCUTS` table, `matchAny(event, shortcuts, view)`, `isTyping(e)` | keymap.js:29-123, 211-218, 231-237 |
| `src/editor/state/useGlobalShortcuts.js` | window keydown for `undo, redo, redo-alt, deselect, toggle-grid, toggle-hints` only; mounted by `Editor.jsx:44` and `labs/LabsView.jsx:407` | useGlobalShortcuts.js:18, 36-46 |
| `src/editor/compose/CanvasArea.jsx` | stage mousedown/dblclick router, drag state, pen/line drafts, node-edit / crop / kinetic / softforms modes, local keymap dispatcher, context-menu rows, wrapper cursor | CanvasArea.jsx:68-1592, 1597-1644 |
| `src/editor/compose/useLayerEdit.js` | `patch/setProp/flush` with `history: 'discrete' \| 'coalesce' \| 'transaction'`, `coalesceMs` default 250 | useLayerEdit.js:26-66 |
| `src/editor/compose/snap.js` | `SNAP_THRESHOLD = 6` virtual px; targets = canvas edges+center, every other layer's edges+center, ruler guides | snap.js:9, 15-43, 49-84 |
| `src/editor/compose/state.jsx` | selection (`select`, `selectCanvas`, `toggleSelection`, `selectMany`), history (`past/future`, `beginTransaction/commitTransaction`, `undo/redo`), `addLayer` paint inheritance, `duplicateLayer`, `alignSelected`, `convertShapeToPath`, `flattenSelected`, `showGrid/showRulers/guides/snapEnabled` | state.jsx:611-760, 830-849, 1072-1172, 1338-1383, 533-543, 607-608 |
| `src/editor/shell/Canvas.jsx` | 33-line wrapper over KOL `Canvas`: passes `aspects`, grid backdrop, `rulers`, `onSpaceTap` (motion pack only) | Canvas.jsx:23-31 |
| `src/editor/shell/panels/ToolPalette.jsx` | editor tool bar on KOL `ToolPalette`, `size="md"`, `className="px-3 h-12"` | ToolPalette.jsx:106-107 |
| `src/editor/styles/kol-editor.css` | `[data-tool]:not([data-tool="select"]) [data-layer-id] { cursor: inherit !important }`; `.kol-grid-bg` 32px step, major every 4 | kol-editor.css:114-116, 386-392 |

KOL sources composed by the canvas (all under `node_modules/@kolkrabbi/`):

| Export | Source | Used at |
|---|---|---|
| `Canvas`, `CanvasFrame`, `PanZoomViewport`, `CanvasZoomContext`, `CANVAS_VIRTUAL_W = 1080` | `kol-component/src/organisms/Canvas.jsx:47, 85, 200, 441` | Canvas.jsx:1, CanvasArea.jsx:2 |
| `SelectionOverlay` | `kol-component/src/utilities/SelectionOverlay.jsx` | CanvasArea.jsx:1424 |
| `PathNodeOverlay` | `kol-component/src/utilities/PathNodeOverlay.jsx` | CanvasArea.jsx:1471 |
| `CropOverlay` | `kol-component/src/utilities/CropOverlay.jsx` | CanvasArea.jsx:1435 |
| `ContextMenu`, `useContextMenu` | `kol-component/src/molecules/ContextMenu.jsx:29, 70` | CanvasArea.jsx:219, 1577 |
| `MenuDropdownItem`, `MenuDropdownDivider` | `kol-component/src/molecules/MenuItem.jsx` (index.js:120) | CanvasArea.jsx:1640-1641 |
| `ToolPalette` | `kol-component/src/organisms/ToolPalette.jsx` | ToolPalette.jsx:2 |
| `LayerStack` | `kol-component/src/organisms/LayerStack.jsx` | LayerStack.jsx:1 |
| `ShortcutsOverlay` | `kol-component/src/organisms/ShortcutsOverlay.jsx`, re-exported by `kol-shell/src/index.js:29` | ShortcutsOverlay.jsx:2 |
| `usePlaceholders` | `kol-component/src/hooks/usePlaceholders.js` | useGlobalShortcuts.js:2 |
| `Icon` + names | `kol-icons/src/Icon.jsx`, registry `kol-icons/src/cuts.json` (`pointer, type, pen, rectangle, circle, triangle, line, polygon, star, pattern-tool:207, search, camera:59, crop, copy, image, flip-horizontal, rotate-left, boolean-unite` all present) | tools.jsx:16-32 |

## 1. Tools

`TOOLS = ['select','text','pen','rect','ellipse','triangle','line','polygon','star','pattern','zoom','orbit']` (tools.jsx:13). There is **no hand tool, no node/direct-select tool, no crop tool, no image tool** in the store — Space-pan is the KOL viewport's (Canvas.jsx:469-475 in kol-component), `A` is a keymap action that flips into node-edit (CanvasArea.jsx:1250-1254), crop/insert-image are `action` cells in the tool bar (ToolPalette.jsx:87-88).

| Tool id | Label (tools.jsx) | Icon (kol-icons) | `TOOL_META.shortcut` | keymap entry | Cursor (CanvasArea.jsx:26-33, 1337-1340) | Mousedown behaviour |
|---|---|---|---|---|---|---|
| select | Select | pointer | V | `tool-select` V, keymap.js:59 | `default`; `grabbing` while a move drag (1338) | handle → resize/rotate (417-462); layer → select+move (464-524); empty → marquee (526-536) |
| text | Text | type | T | `tool-text` T, :61 | `text` | create-drag; click → 600×120 default, `editOnMount: true` (1058, 1074) |
| pen | Pen | pen | P | `tool-pen` P, :62 | `crosshair` | click places anchor, click-drag pulls handles (345-360) |
| rect | Rectangle | rectangle | R | `tool-rect` R, :63 | `crosshair` | create-drag; click → 240×240 (1059, 1075) |
| ellipse | Ellipse | circle | O | `tool-ellipse` O, :64 | `crosshair` | create-drag; click → 240×240 (1060, 1076) |
| triangle | Triangle | triangle | '' | none | fallback `crosshair` (1339) | create-drag (1061, 1077) |
| line | Line | line | '' | none | fallback `crosshair` | click-click placement, not drag (364-395) |
| polygon | Polygon | polygon | '' | none | fallback `crosshair` | create-drag, `sides: 5` (1080) |
| star | Star | star | '' | none | fallback `crosshair` | create-drag, `points: 5, innerRatio: 0.5` (1081) |
| pattern | Pattern | pattern-tool | '' | none (`case 'tool-pattern'` at CanvasArea.jsx:1259 is unreachable) | `cell` | create-drag; click → full canvas `CANVAS_W × viewH` (1064, 1082) |
| zoom | Zoom | search | Z | `tool-zoom` Z, :65 | `zoom-in` (also while Alt = zoom out) | wrapper-level: dispatches `kol:zoom-at` factor 2, Alt → 0.5 (1348-1353); stage returns early (337) |
| orbit | Orbit | camera | C | `tool-orbit` C, :66 (views editor+labs) | fallback `crosshair`; LayerRenderer's `grab` is overridden by the CSS inherit rule | stage does nothing (337); `useCameraKeysDrag` enabled only when `tool === 'orbit'` (LayerRenderer.jsx:1430-1439), one transaction per orbit gesture (:1482) |

Cursor sources beyond the tool map:
- Layers set inline `cursor: 'move'` (LayerRenderer.jsx:214, 560, 1775 and ~15 more); 3D canvases `camKeys ? 'grab' : 'move'` (:415, :486, :541). All overridden to `inherit !important` whenever `data-tool != select` (kol-editor.css:114-116; stage carries `data-tool={tool}` at CanvasArea.jsx:1382).
- Resize handles: `nwse-resize / ns-resize / nesw-resize / ew-resize` per direction, rotate handle `grab` (SelectionOverlay.jsx:52-61, 125). Crop handles same set (CropOverlay.jsx:34-41), crop pan `grab/grabbing` (:186).
- Node-edit anchors/knobs `cursor: 'move'` (PathNodeOverlay.jsx:264, 274, 287).
- Space-pan: KOL viewport sets `grab` while Space held, `grabbing` while dragging, else unset so the tool cursor shows through (kol-component Canvas.jsx:588-600). Rulers `row-resize` / `col-resize` (:835, :847); guides ±5px slop (:880-881, :911).
- Eyedropper: `stageEl.style.cursor = 'crosshair'` on `[data-tool]` while waiting (canvasEyedropper.js:62-66).
- Custom SVG cursors were tried and dropped (CanvasArea.jsx:20-25).

Tool bar (ToolPalette.jsx:65-90): `select · [Text fold: text, Kinetic type (motion pack)] · pen · [Shape fold: rect, ellipse, triangle, line, polygon, star] · pattern · zoom · orbit | flip-h ⇧H · flip-v ⇧V · rotate-left · rotate-right | [Boolean fold: Unite / Subtract front / Intersect / Exclude] | Insert image · Crop image · Duplicate ⌘D`. KOL rung `md` = 32px square (KOL ToolPalette.jsx:33 "22 · 26 · 32 · 40"), ghost+quiet `Button` with `iconOnly` (:67-70), DS `Tooltip` carries the key as a chip (:66). Shape-fold variants also commit from the Layers `+` menu (LayerStack.jsx:31-38; line excluded on purpose, :29-30).

## 2. Selection

| Gesture | Result | Cite |
|---|---|---|
| Click empty stage (Select tool) | starts a `marquee` drag; on mouseup `vw < 4 && vh < 4` → `select(null)` unless Shift | CanvasArea.jsx:526-536, 1024-1029 |
| Press on grey viewport around the frame | `select(null)` (document `pointerdown`, only when `tool === 'select'`, skipping `[data-kol-ctxmenu], .kol-popover, .kol-overlay-scrim, button, input`) | :908-922 |
| Click frame border / edge | nothing — KOL `CanvasFrame`'s border is a `pointer-events-none` div (`1px solid var(--kol-oq-24)`, `z-[2]`); the click reaches the stage as empty-stage | kol-component Canvas.jsx:131-137, 97 |
| Selecting the Canvas layer | **only** from the Layers panel's Canvas row → `selectCanvas()` = `['canvas', ...everyLayerId]`; nothing on the stage selects `'canvas'` | LayerStack.jsx:64; state.jsx:617-620; KOL LayerStack.jsx:196 |
| Click a layer | walks up to the OUTERMOST `[data-layer-id]` (group wins over child), `select(id)`, arms `move` drag with `beginTransaction()` | :406-414, 506-518 |
| Click a cover-type layer | `select(id)` only, no drag | :519-521 |
| Shift+click layer | `toggleSelection(id)` | :472-475; state.jsx:624-629 |
| Mousedown on a member of a multi-selection | keeps selection, arms group move; mouseup without ≥3px movement collapses to single select | :476-505, 574-578, 702-705 |
| Marquee | AABB intersection on `x/y/w/h`; skips `visible === false` and `locked === true`; Shift = additive via `selectMany(ids, {additive})` | :1030-1042; state.jsx:635-643 |
| Hover highlight | **none** — no hover state, no outline-on-hover in CanvasArea/LayerRenderer/kol-editor.css; the only hover affordance is the inline `cursor: 'move'` | LayerRenderer.jsx:214; grep `hover` in kol-editor.css hits only tooltip/layer-row rules (:123, :284) |
| Locked layer click | "canvas-inert": falls through to the stage (marquee/deselect); handles ignored; selectable from the panel | :468-471, 417 |
| Right-click | selects the hit layer first (if not already in selection) then opens the DS context menu | :1358-1364 |
| Click-away (document mousedown) | anything inside `[data-editor-keep-selection]` (EditorShell.jsx:103) keeps selection; with `'canvas'` selected, empty space inside `[data-layer-stack]` deselects | :1097-1126 |

Selection chrome: one `SelectionOverlay` per selected positioned layer; `showHandles / showRotate / showLabel = !isMultiSel` (:1419-1432). KOL overlay: dashed `1/zoom px` outline in `var(--kol-accent-primary)`, 8 handles `handleSize 10` virtual px ÷ zoom, rotate circle `ROTATE_OFFSET 22` above the top edge, `W × H` label in `var(--kol-font-family-mono)` 10px on `rgba(0,0,0,0.6)` counter-scaled by `1/zoom` (SelectionOverlay.jsx:65, 71, 97-107, 123-128, 149-170). Overlay `zIndex: 100` (:112); node overlay `zIndex: 120` (PathNodeOverlay.jsx:239); pen preview `calc(var(--kol-z-overlay) + 1)` (CanvasArea.jsx:1487).

## 3. V and A

- `V` → `tool-select`: `setNodeEditId(null); setTool('select')` (CanvasArea.jsx:1248; keymap.js:59 label "Select tool").
- `A` → `node-edit` (keymap.js:60 label "Edit path nodes"): `if (selectedLayer?.type === 'path') { setTool('select'); enterNodeEdit(selectedLayer) }` (CanvasArea.jsx:1250-1254). **The guard is `type === 'path'` only** — `A` is a silent no-op on `shape` (rect/ellipse/triangle/polygon/star/line), `text`, `bool`, `group`. Same guard on double-click (:983-985) and on the overlay lookup `nodeEditLayer` (:1005-1007).
- `enterNodeEdit` bakes live `rotation` into the nodes first (rotate about center, renormalize, `rotation: 0`) as one discrete history entry (:956-974).
- Node-edit gestures (KOL PathNodeOverlay.jsx:11-18, 98-102, 118-123, 140-160, 172): drag anchor moves node+handles; drag handle mirrors the opposite unless Alt; Alt+drag anchor = `extract` handles; click first anchor of an open path with ≥2 nodes → `closed: true`; dbl-click anchor = corner↔smooth; dbl-click segment = insert node (de Casteljau); Delete/Backspace removes selected node (min 2); Escape exits. Hit band `12 / zoom` px (:242-250); `ANCHOR 10`, `KNOB 5` virtual px (:43-44).
- Exits: Escape (overlay), deselect (:817-819), switching to any non-select/zoom tool (:835-841), `V` (:1248).
- The Inspector's Path section exposes an Open/Closed `ViewToggle` and notes "in node-edit, clicking the first anchor also closes" (LayerInspector.jsx:151-160).

## 4. Pen tool

| Step | Mechanism | Cite |
|---|---|---|
| Start | first mousedown with `tool === 'pen'` creates `pen = { nodes:[{x,y,in:null,out:null}], cursor }`, `penDrag = { index, ax, ay }` | CanvasArea.jsx:345-359 |
| Continue | each click appends an anchor; mousemove during the press pulls symmetric `out`/`in` handles once the drag passes a 3 screen-px dead zone (inside it the node snaps back to a corner) | :357-358, 761-791 (773) |
| Rubber band | `penPreviewD` = committed `pathD(nodes,false)` + cubic from last anchor's `out` to the cursor, stroked `var(--kol-accent-primary)` 2px non-scaling | :994-1003, 1489-1497 |
| Node glyphs | 8×8 squares, white fill with accent stroke; **the first anchor is filled accent** — this is the only "close here" cue | :1498-1507 (1502) |
| Close | click within **10 screen px** of the first anchor when `nodes.length >= 2` → `finishPath(nodes, true)`. No hover state, no cursor change, no snap-radius ring is drawn; the radius is only tested on mousedown | :349-354 |
| Commit open | `Enter` (capture phase) → `finishPath(nodes, false)`; switching tool mid-draft also commits | :795-800, 810-813 |
| Cancel | `Escape` (capture) → `setPen(null); setTool('select')` | :801-804 |
| Resulting layer | `<2 nodes` → nothing, back to Select. Else `addLayer('path', { nodes, closed, x,y,w,h, color: null, stroke: 'palette:dark', strokeWidth: 2 })` then `setTool('select')` | :264-275 |

Paint inheritance: `addLayer` gives every `COLOR_LAYER_TYPES` layer (`background, pattern, shape, text, path, bool`, state.jsx:32) `color: paintFill, stroke: paintStroke` from the app-level paint pair, **but `extras` win** (state.jsx:830-849, spread order `...paintExtras, ...extras` at :846). The pen's hardcoded `color: null, stroke: 'palette:dark'` therefore **does not inherit the current fill/stroke**; the line tool is the same (`color: null, stroke: 'palette:dark', strokeWidth: 2`, CanvasArea.jsx:383-390). Drag-created shapes pass `color: 'palette:dark'` so they inherit only the stroke (:1075-1081); text passes no paint and inherits both (:1074).

Line tool (click-click): first click `linePlacement = {x1,y1}`, dashed `6 4` preview + 4px accent dot, second click commits a `shape{kind:'line', slope:'\\'|'/'}`; Escape cancels (capture) and switching tool cancels (:364-395, 720-755, 1534-1552).

## 5. Expand / Flatten / Convert to path

| Action | Where | Label | Guard | Cite |
|---|---|---|---|---|
| `convertShapeToPath(layerId)` | Inspector → Parameters panel → **Generate** sub-tab, `Button tone="primary" size="sm" className="w-full"` with `Tooltip` "Convert the shape to an editable bezier path (one-way)" | **"Convert to path"** | `layer.type === 'shape'` and `kind ∈ rect, ellipse, triangle, polygon, star, line` | ParametersPanel.jsx:72, 92-98; state.jsx:1114-1150; shape-math.js:65-97 |
| `flattenSelected()` | top menu **Tools** (MenuTop.jsx:315-328) and context menu on a `bool` layer (CanvasArea.jsx:1613) | **"Flatten shape"** | one selected `bool`, or ≥2 `isBooleanable` layers (destructive unite) | MenuTop.jsx:150-158; state.jsx:1072-1105 |
| `releaseBoolean()` | Tools menu, context menu on `bool` | "Release boolean" | top-level `bool` selected | MenuTop.jsx:325-327; CanvasArea.jsx:1614 |
| `flattenText(id)` | context menu on `text` | "Flatten text" | — | CanvasArea.jsx:1610; state.jsx:1447 |
| `flattenPattern`, `flattenParatype` | state only (not wired on the canvas or its menu) | — | — | state.jsx:1393, 1509 |

So: a rect/ellipse becomes editable only via the Inspector button, which is on the **Generate** tab, not the toolbar, not the context menu, not a keyboard shortcut. Converted paths keep id/opacity/blend/lock, bake flip + rotation into nodes (state.jsx:1114-1131), and keep fill for closed kinds / stroke-only for line (:1140-1145). No action is named "Expand" or "Outline stroke" anywhere in `src/editor` (grep).

## 6. Preview / work mode

There is **no preview/work-mode state**. What exists:

| State | Default | Toggles | Hides | Cite |
|---|---|---|---|---|
| `showGrid` | `false` | `G` (global keymap, useGlobalShortcuts.js:44), Canvas Inspector `ToggleSwitch label="Grid"` (CanvasInspector.jsx:62), settings drawer `SettingsSwitch "Show grid"` (EditorShell.jsx:40) | the `.kol-grid-bg` backdrop only | state.jsx:533-534; Canvas.jsx:27 |
| `showRulers` | `true` | `Shift+R` only (keymap.js:109 → CanvasArea.jsx:1202); no menu/inspector toggle | the 18px KOL rulers (`RULER = 18`, kol-component Canvas.jsx:664) | state.jsx:535-536 |
| `guides {h:[],v:[]}` | empty | drag off a ruler to create, drop back on the ruler to delete; `guidesInteractive = tool === 'select' && !drag` | — (not history-tracked, persisted in the draft) | state.jsx:538-543; CanvasArea.jsx:1375-1377; kol-component Canvas.jsx:946-975 |
| `snapEnabled` | `true` | File menu "Snap to objects, guides and canvas" (MenuTop.jsx:355-360); no key | magenta snap lines | state.jsx:607-608 |
| `view` | `'single'` | Canvas menu → View → Single / Social (MenuTop.jsx:383-399) | Social = read-only 1:1 / 4:5 / 9:16 triptych, no handles, no rulers (not `panEnabled`), frame border + ratio label still drawn | CanvasArea.jsx:54, 1309-1328 |

The frame border (`1px solid var(--kol-oq-24)`) and the ratio label (mono 10px, `letter-spacing 0.1em`, `top 6 / left 8`, `var(--kol-fg-64)`) are rendered unconditionally by KOL `CanvasFrame` with no prop to hide them (kol-component Canvas.jsx:85-99, 131-152). Zoom chip `bottom-3 right-3 … kol-mono-12`, click resets (:636-645); `F` toggles an fps chip (:567, keymap.js:113 passive). Zoom clamps `0.1 … 8` (:371-372); `⌘0 / ⌘= / ⌘-` and `⌘/Ctrl+wheel` (`exp(-deltaY*0.0015)`) live in the KOL viewport (:469-493, 524-541).

## 7. Canvas context menu (CanvasArea.jsx:1597-1644)

DS `ContextMenu` popover (`placement: 'right-start'`, `offset: 2`, class `kol-dd-list min-w-44`, any click inside closes — ContextMenu.jsx:44-50, 86-87); rows wrapped in a `width: 192` div (CanvasArea.jsx:1638). The hit layer is selected on right-click (:1360-1363).

| Layer type | Rows (in order) | Cite |
|---|---|---|
| text | Morph… (opens params, subtab `style`), Flatten text | :1604-1611 |
| bool | Flatten shape, Release boolean | :1612-1615 |
| photo | Crop image, Replace image (`kol:photo-replace`) | :1616-1619 |
| pattern | Pattern parameters (`kol:open-pattern`) | :1620 |
| shape · loop · kinetic · misc · path | Parameters (`kol:open-params`) | :1621-1623 |
| shape · text · pattern · path · loop · photo | Add effect (`kol:open-effects`) | :1624-1626 |
| any layer (after a divider) | Duplicate, Show/Hide, Lock/Unlock, Delete | :1627-1631 |
| empty canvas | Undo, Redo (disabled by `canUndo/canRedo`) | :1632-1635 |

No "Convert to path", "Group", "Bring forward/back", "Select all" or alignment rows.

## 8. Transforms, modifiers, history, eyedropper

| Feature | Behaviour | Cite |
|---|---|---|
| Alt-drag duplicate | `duplicateLayer(id, { offset: 0 })` inside the move transaction, then the COPY is dragged; one undo entry | CanvasArea.jsx:509-518; state.jsx:1156-1172 |
| ⌘D duplicate | `duplicateLayer(id)` → +24/+24 px offset; locked → ignored | CanvasArea.jsx:1171; state.jsx:1156 |
| Nudge | Arrows ±1, Shift+Arrows ±10 virtual px; via `useLayerEdit(selectedId, { history: 'coalesce', coalesceMs: 600 })` so a burst = one undo; refused on locked / non-positioned | CanvasArea.jsx:95, 1214-1231; keymap.js:48-55 |
| Rotation origin | always the box center `(x + w/2, y + h/2)`; drag relative to start angle; Shift snaps to 15°; stored to 0.1°. No anchor/origin setting exists (Inspector has only a Rotation number field + 90° buttons, LayerInspector.jsx:63-71, 80-95; ToolPalette.jsx:39-42, 82-83) | CanvasArea.jsx:421-434, 555-562 |
| Resize modifiers | min 8px; Alt = from center; Shift = aspect constrain, inverted when `aspectLocked` is set; rotated layers keep the opposite corner fixed | :605-664; aspect lock from LayerInspector.jsx:440-448 |
| Resize propagates | photo crop window, path nodes+holes, bool children scale with the box | :666-687 |
| Snap during move | single-layer move only (group moves never snap); 6 vpx threshold; magenta `#FF00C8` 1px lines | :585-592, 1553-1574; snap.js:9 |
| Align | `AlignmentPanel`: two `SegmentedToggle variant="filled" size="sm"` strips (left/center/right, top/middle/bottom); 1 layer aligns to the canvas, ≥2 to their common bbox; locked and `'canvas'` skipped. **No distribute** anywhere (grep) | AlignmentPanel.jsx:10-25; state.jsx:1338-1383 |
| Flip | `Shift+H / Shift+V`, tool bar, Inspector | keymap.js:46-47; CanvasArea.jsx:1206-1212 |
| Opacity digits | 1-9 → 10-90 %, 0 → 100 %, 00 within 500 ms → 0 % | CanvasArea.jsx:1136-1153 |
| History | `past/future` of `{layers, selectedIds}` snapshots capped at 100; `setLayersTracked` pushes when no transaction is open; `beginTransaction` snapshots once, `commitTransaction` pushes only if layers/selection changed; `undo/redo` bail mid-transaction | state.jsx:644-760 (668-682, 706-725, 727-760) |
| Undo/redo wiring | `Mod+Z`, `Mod+Shift+Z`, `Mod+Y` in `useGlobalShortcuts` (CanvasArea's handler returns early for these); File menu rows; empty-canvas context menu | useGlobalShortcuts.js:40-42; CanvasArea.jsx:1165-1169; MenuTop.jsx:369-370 |
| Eyedropper `I` | keymap `eyedrop` (editor view) → `window.dispatchEvent('kol:eyedrop')` → `ColourPanel.TopRow` runs `pickFromCanvas(...)` which rasterises `buildLayersSvg` to an offscreen canvas, sets the stage cursor to `crosshair`, waits for one capture-phase mousedown **on the stage only** (outside click or Escape cancels), and writes the hex into the focused paint (`target.onChange`) | keymap.js:107; CanvasArea.jsx:1238-1241; ColourPanel.jsx:75-98; canvasEyedropper.js:30-111 |
| Paint keys | `D` white fill/black stroke, `X` toggle focus, `Shift+X` swap, `N` or `/` clear — through `useColorTarget` | keymap.js:73-77; CanvasArea.jsx:1266-1293 |
| Escape layering | pen/line/node/crop overlays intercept in capture phase; otherwise `deselect` in `useGlobalShortcuts`; ShortcutsOverlay closes on a window listener | CanvasArea.jsx:734-746, 795-808; PathNodeOverlay.jsx:140; useGlobalShortcuts.js:43; ShortcutsOverlay.jsx:46 |

Editor keymap not covered above (keymap.js): `Backspace/Delete` delete (refuses when `'canvas'` selected; locked skipped, CanvasArea.jsx:1173-1190), `Mod+G / Mod+Shift+G` group/ungroup (:1192-1200), `L` lock, `H` visibility (:1203-1204), `\` rail, `S`/`?` shortcuts sheet (:1233-1236), `Mod+O` files, `,` settings drawer, `M` modulation dots (:1243-1246), `Shift+I` placeholders, `Space` play/pause + pan (passive; KOL viewport binds it), `F` fps (passive). Dispatch: CanvasArea uses `matchAny(e, undefined, 'editor')` (:1156); `isTyping` lets range/checkbox inputs pass non-control keys (keymap.js:229-237).

## Contradictions

| # | A | B |
|---|---|---|
| 1 | `case 'tool-pattern'` dispatches `setTool('pattern')` — CanvasArea.jsx:1259 | No `tool-pattern` entry in `SHORTCUTS` (keymap.js:59-66) and `TOOL_META.pattern.shortcut = ''` (tools.jsx:25) → dead branch |
| 2 | Comment "paths never get resize handles (edit via nodes)" — CanvasArea.jsx:1420-1422; KOL doc "a path hides the resize handles" — SelectionOverlay.jsx:45 | `showHandles={!isMultiSel}` with no type check (CanvasArea.jsx:1427) and the resize code scales path nodes (:451-455, 677-682) → paths DO get handles |
| 3 | Double-click photo → crop requires `!layer.locked` — CanvasArea.jsx:986; kinetic/softforms edit require `!l.locked` (:850, :867); mousedown on locked is "canvas-inert" (:468-471) | Double-click path → `enterNodeEdit` has no lock check (:983-985) and `A` has none (:1252) → a locked path (selectable from the panel) can be node-edited |
| 4 | Click-away checks `.kol-compose-layer-row` — CanvasArea.jsx:1105; CSS still styles it (kol-editor.css:284, 299-300) | DS rows are `kol-layer-stack-row` (kol-component LayerStack.jsx:196) → `onAnyRow` is always false |
| 5 | Viewport-deselect skips `[data-kol-ctxmenu]` — CanvasArea.jsx:917 | KOL `ContextMenu` emits no such attribute; it renders a `PopoverPanel` (`.kol-popover`, ContextMenu.jsx:86) → only the `.kol-popover` half of the selector works |
| 6 | Snap guides hardcoded `#FF00C8` "deliberate magenta, NOT a theme token" — CanvasArea.jsx:56-58, 1559 | Ruler guides `var(--kol-canvas-guide, var(--kol-accent-primary))` — kol-component Canvas.jsx:895 (`--kol-canvas-guide` undefined in kol-theme → accent) → two colours for two kinds of guide line |
| 7 | Zoom tool cursor `zoom-in` always — CanvasArea.jsx:32 | Alt+click zooms OUT (factor 0.5) — :1351; no `zoom-out` cursor |
| 8 | 3D layers set `cursor: camKeys ? 'grab' : 'move'` in orbit — LayerRenderer.jsx:415, 486, 541 | `[data-tool]:not([data-tool="select"]) [data-layer-id] { cursor: inherit !important }` (kol-editor.css:114-116) + no `orbit` in `CURSOR_FOR_TOOL` (CanvasArea.jsx:26-33) → orbit shows `crosshair` over the very layers it orbits |
| 9 | Tool bar shortcut chips hand-typed `'⇧H'`, `'⇧V'`, `'⌘D'` — ToolPalette.jsx:80-81, 89 | keymap.js:46-47, 34 is the declared source of truth and `comboLabel` renders them (keymap.js:221-223); tool cells use `TOOL_META.shortcut` (tools.jsx) — three places spell one shortcut |
| 10 | `useGlobalShortcuts` calls `matchAny(e)` with no view — useGlobalShortcuts.js:36 | keymap.js:205-210 says an unscoped lookup "is a wrong answer waiting for its second caller"; CanvasArea passes `'editor'` (:1156) |
| 11 | `addLayer` doc: "New layers adopt the current app-level paint pair" — state.jsx:819-824 | Pen (`stroke: 'palette:dark', color: null`, CanvasArea.jsx:272), line (:388-389) and drag-shapes (`color: 'palette:dark'`, :1075-1081) override it via `extras` (state.jsx:846); only text inherits (:1074) |
| 12 | `showGrid` state default `false` — state.jsx:533 | Shell `Canvas` prop default `showGrid = true, showRulers = true` — Canvas.jsx:23 (the Social view at CanvasArea.jsx:1317 passes neither) |
| 13 | On-canvas label chrome: crop chip `kol-helper-10 text-emphasis bg-surface-secondary border border-oq-08 rounded px-2 py-1` — CanvasArea.jsx:1444 | Selection W×H label inline `fontFamily var(--kol-font-family-mono) fontSize 10` on `rgba(0,0,0,0.6)` — SelectionOverlay.jsx:155-165; zoom chip `kol-mono-12 … border-fg-08 bg-surface-secondary` — kol-component Canvas.jsx:641 → three label treatments, two border tokens (`oq-08` vs `fg-08`) |
| 14 | Keymap says `C` = "Orbit tool (3D camera)" in `editor` AND `labs` — keymap.js:66 | Only CanvasArea (editor) dispatches `tool-orbit` (:1261); labs has no canvas tools per keymap.js:57-58 comment |
| 15 | `delete-fwd` (Delete) is `hidden: true` while `delete-back` (Backspace) shows — keymap.js:35-36 | KEY_LABELS maps `Delete: 'Del'` for display (keymap.js:136) — label prepared for an entry that never renders |

## Open questions

- Does any listener exist for `kol:open-params`, `kol:open-effects`, `kol:open-pattern`, `kol:photo-replace`, `kol:open-settings` (dispatched by the context menu / tool bar)? Outside this area's files.
- How is text edit mode entered on canvas (double-click? the `editOnMount` flag at LayerRenderer.jsx:1932 covers creation only); `onStageDoubleClick` handles only `path` and `photo` (CanvasArea.jsx:977-990).
- Does `useCameraKeysDrag` stop propagation so the orbit drag never reaches the stage's document-level deselect (`pointerdown`, CanvasArea.jsx:912-922 returns early for `tool !== 'select'`, so probably moot)?
- `--kol-canvas-guide` is referenced by KOL (Canvas.jsx:895) but not defined in `kol-theme/src` — intentional seam or missing token?
- Is the hidden `Shift+I` placeholder toggle (keymap.js:108) still meant to ship, given `I` moved to the eyedropper on 2026-10-09 (:105-107)?
- No `Select all` (`Mod+A`) exists anywhere in `src/editor` — by design or missing?
- Pen handle pull reads `e.altKey`? No — the pen draft never breaks tangents (CanvasArea.jsx:774-777); only the node-edit overlay does (PathNodeOverlay.jsx:98-102). Intended?
- `visibleLayers = layers` (CanvasArea.jsx:124) — hidden layers are filtered inside `LayerRenderer` (:79) but still appear in `selectedPositionedLayers` chrome (:103-105); can a hidden layer keep a selection box?
