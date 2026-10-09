# 06 — Shape / layer model (kol-fxr compose)

Scope: `src/editor/compose/{state.jsx, build.js, shape-math.js, path-math.js, boolean-ops.js, helpers.js, labels.js, LayerRenderer.jsx}` + cross-refs into `inspectors/LayerInspector.jsx`, `inspectors/ParametersPanel.jsx`, `CanvasArea.jsx`, `LayerStack.jsx`, `InspectorRail.jsx`, `AlignmentPanel.jsx`, `params/schemas/shape.js`. KOL = `node_modules/@kolkrabbi/kol-component@0.246.0` (`node_modules/@kolkrabbi/kol-component/package.json`).

## 1. Layer envelope (every type)

Created by `addLayer` — `src/editor/compose/state.jsx:839`:
```js
{ id, type, visible: true, opacity: 1, blend: 'normal', ...layerDefaults(type, virtualHRef.current), ...paintExtras, ...extras }
```
- `id` = `${type}-${Date.now().toString(36)}-${8 random base36}` — state.jsx:95.
- Spread order matters: `paintExtras` (app-level paint pair) overrides `layerDefaults`' `color`; `extras` overrides both — state.jsx:832-839.
- Coordinates are virtual px, `CANVAS_W = 1080` (state.jsx:293), live virtual height `1080 / (canvasW/canvasH)` (state.jsx:519). Group/bool children store parent-relative x/y (state.jsx:75-77, locateLayer 210-220).

| Optional field | Set / read at |
|---|---|
| `name` (user rename, verbatim) | labels.js:59; LayerStack.jsx:68 |
| `locked` | state.jsx:987 (toggle only; never set at create) |
| `rotation` (deg, cw) | LayerRenderer.jsx:86; CanvasArea.jsx:561; LayerInspector.jsx:66 |
| `flipX` / `flipY` | state.jsx:1009; LayerRenderer.jsx:87-92; build.js:93-95 |
| `aspectLocked` (ratio number or null) | LayerInspector.jsx:440-450; CanvasArea.jsx:445,628 |
| `filters[]` chain `{ id, key, enabled, params }` | state.jsx:884-885 |
| `fillOpacity` `strokeOpacity` `fillHidden` `strokeHidden` | paint.js:3-4, 9-14 |
| `stroke` `strokeWidth` `strokeDasharray` `strokeLinecap` `strokeLinejoin` | LayerRenderer.jsx:1556-1557, 1569-1571 |
| `radius` (rect + text only) | LayerRenderer.jsx:1624, 1924; build.js:249 |
| `children[]` (group / bool) | state.jsx:75-77 |

`COLOR_LAYER_TYPES = {background, pattern, shape, text, path, bool}` — state.jsx:32. `COVER_TYPES = ['background']` — state.jsx:303. `POSITIONED_TYPES = ['pattern','photo','shape','text','path']` — state.jsx:304 (no consumer: grep finds only the definition).

## 2. Layer types

Add-menu types `ALL_LAYER_TYPES` — state.jsx:417-428: pattern, photo, shape, text, loop, kinetic ('Kinetic type'), misc; loop/misc need the `generators` pack, kinetic the `motion` pack (state.jsx:431-432). `background` is no longer creatable (state.jsx:413-416); `path`, `group`, `bool` are never offered by the menu.

| type | Type-specific fields (factory `layerDefaults`, state.jsx:434-492) | DOM render | SVG export |
|---|---|---|---|
| background | `cover({ color: 'palette:primary' })` — :441; no x/y/w/h | BackgroundLayer LayerRenderer.jsx:571-585 (`inset:0`) | build.js:101-104 |
| pattern | `fullCanvas({ ...PATTERN_DEFAULTS, color: 'palette:secondary' })` — :442; PATTERN_DEFAULTS :367-380 = `shapeId, customSvg:'', cols:4, rows:4, gap:0, padding:0, stretch:false, overflow:false, bgOn:false, bg:'palette:light', rules:[], scale:256`; `fullCanvas` = `{x:0,y:0,w:1080,h:vh}` :439; reads `stroke`/`strokeWidth` too (LayerRenderer.jsx:601-602) | PatternLayer :598-652 (CSS background-repeat tile) | build.js:106-143 (`<pattern>` def) |
| photo | `fullCanvas({ src: null, fit: 'cover' })` — :443; `srcType` image/video/webcam (LayerRenderer.jsx:72,657,664); crop `imgX imgY imgW imgH` (:668); `trimIn trimOut videoLoop videoMuted playbackRate` (:740-771); `mirror` (:856) | PhotoLayer :654-710, VideoPhotoLayer :726, WebcamPhotoLayer :839 | build.js:145-205 |
| shape | `placed(200, 200, { kind:'logo', variant:'logomark', fit:'fill', color:'palette:dark' })` — :444 (`placed` = centered via `boxFromAnchor('C')`, PADDING 80, :309-329) — see §3 | ShapeLayer :1560-1745 | build.js:216-304 |
| text | `placed(600, 120, { ...TEXT_DEFAULTS, text:'New text', color:'palette:dark' })` — :486; TEXT_DEFAULTS :334-360 = `family:'right-grotesk', width:'Tight', weight:600, italic:false, size:96, tracking:-0.01, lineHeight:1.05, case:'original', textAlign:'center', verticalAlign:'middle', resizing:'fixed', axisOn:false, axisMode:'morph', width2:'Spatial', weight2:900, axisBlend:0.5, axisCurve:'flat', curveCp1, curveCp2, randomWidthLock:'', randomWeightLock:''`; `editOnMount` one-shot (CanvasArea.jsx:1074; LayerRenderer.jsx:1933) | TextLayer :1851-2004 | build.js:348-400 |
| path | `{ nodes: [], closed: false, x:0, y:0, w:1, h:1, color: null, stroke:'palette:dark', strokeWidth: 2 }` — :489; `holes[]` rings (boolean-ops.js:9); node = `{x,y,in,out}` layer-local (kol pathMath.js:16-24) | PathLayer :1753-1812 (12px non-scaling hit band :1789-1798) | build.js:310-327 |
| group | `{ id, type:'group', visible:true, opacity:1, blend:'normal', x, y, w, h, children }` — :1233-1241 | GroupLayer :552-569 (`<div>` translate) | build.js:461-470 |
| bool | `{ id, type:'bool', op, visible:true, opacity: base.opacity ?? 1, blend: base.blend ?? 'normal', x,y,w,h, color: base.color ?? 'palette:dark', stroke: base.stroke ?? null, strokeWidth: base.strokeWidth ?? 0, children }` — :1046-1054; `op ∈ BOOLEAN_OPS = ['unite','subtract','intersect','exclude']` boolean-ops.js:22 | BoolLayer :1820-1830 (renders as PathLayer) | build.js:332-336 |
| loop | `fullCanvas({ loopGroup:'shape', presetId, presetLabel, loopId, ...presetParams, themeId })` — :448-461 (params spread FLAT) | :136-150 (LoopLayer / EngineLoopLayer / Effected…) | build.js:406-431 (raster snapshot) |
| misc | same vehicle, `loopGroup:'paratype'`, preset `'paratype-o'` — :463-473 | as loop :136 | as loop :507 |
| kinetic | `fullCanvas({ presetId, presetLabel, comp })` — :478-485 (`comp` opaque) | KineticLayer :163-219 | build.js:441-456 (live SVG serialized) |

Visible-skip: `layer.visible === false` → `null` (LayerRenderer.jsx:79) / `''` (build.js:477); `undefined` ⇒ visible.

## 3. Shape layers — `kind`

Kind catalog (8): `SHAPE_KIND_LABELS` labels.js:26-35 = logo 'Logo', rect 'Rectangle', ellipse 'Ellipse', triangle 'Triangle', line 'Line', polygon 'Polygon', star 'Star', flatten 'Flatten'. Default `kind ?? 'logo'` (labels.js:40; LayerRenderer.jsx:1566; build.js:217).

| kind | Per-kind params stored today | Render (LayerRenderer.jsx) | Export (build.js) | `shapeToPathNodes` (shape-math.js) | Boolean (boolean-ops.js) | Created by |
|---|---|---|---|---|---|---|
| logo | `variant` logomark/wordmark/lockup-hori/lockup-vert (build.js:47-52); `fit` 'contain' → meet (:1592) | :1587-1602 `<KolLogo>` | :285-303 | `null` :103 | not booleanable :25 | menu LayerStack.jsx:32; factory state.jsx:444 |
| rect | `radius` (rx) :1624 | :1609-1633 | :244-251 | :71-79 (**radius ignored**) | `paper.Path.Rectangle` :86 (**radius ignored**) | menu LayerStack.jsx:33; tool R CanvasArea.jsx:1075 |
| ellipse | — | :1634-1654 | :252-258 | :80-91 (4-node, KAPPA 0.5523 :51) | :89 | LayerStack.jsx:34; CanvasArea.jsx:1076 |
| triangle | — (apex top-center) | :1655-1672 | :261 | :92 ← `trianglePoints` :46-48 | :92 | LayerStack.jsx:35; CanvasArea.jsx:1077 |
| line | `slope` `'\\'` or `'/'` (:1677; build.js:275); stroke-only, `strokeWidth` fallback 2 (:1700; build.js:269; shape-math.js:68) | :1673-1706 (12px hit band :1692-1696) | :267-283 | :97-102 → `closed:false` | not booleanable :25 | pen-style two clicks CanvasArea.jsx:364-394 only; **not in add menu** (LayerStack.jsx:29-30) |
| polygon | `sides` clamp 3..12, default 5 (shape-math.js:13; :1715) | :1707-1724 | :262 | :93 | :95 | LayerStack.jsx:36 `extras:{kind:'polygon', sides:5}`; CanvasArea.jsx:1080 |
| star | `points` clamp 3..12 default 5; `innerRatio` default 0.5, clamp 0.1..0.95 (shape-math.js:28,31; :1733) | :1725-1742 | :263 | :94 | :98 | LayerStack.jsx:37 `{points:5, innerRatio:0.5}`; CanvasArea.jsx:1081 |
| flatten | `svg` string; `fit` fill/contain (:1535-1543, 1567; build.js:214) | :1603-1608 `dangerouslySetInnerHTML` | :219-227 nested `<svg>` | `null` :103 | not booleanable | flattenPattern state.jsx:1417-1427; flattenText :1475-1491; addFlattenedFromFrame :1540-1552 |

Not stored on any kind: per-kind rotation (rotation is a universal field, §5), corner radius on polygon/star, absolute inner radius (ratio only), star/polygon rotation offset (first vertex fixed at −90°, shape-math.js:16,35).

Half-stroke inset: every closed kind draws inset by `sw/2` so the stroke stays inside the bbox (LayerRenderer.jsx:1571; build.js:233; shape-math.js:69).

### 3a. Where shape parameters are exposed

| Surface | What | path:line |
|---|---|---|
| Parameters tab (right rail), subtab strip `Generate · Style · Animation` (`SegmentedToggle variant="filled"`), default tab `'style'` | shape → Style: `AutoControls schema={SHAPE_SCHEMA}`; Generate: "Convert to path" `Button tone="primary" size="sm"` for rect/ellipse/triangle/polygon/star/line; Animation: `ModulationList` + anim params | ParametersPanel.jsx:45-49, 75, 89-108 |
| `SHAPE_SCHEMA` | `kind` select (8 options); `variant` select (logo); `fit` segmented (flatten only); `sides` range 3–12 step 1 (polygon, `animatable:false`, section 'Geometry'); `points` range 3–12; `innerRatio` range 0.2–0.9 step 0.05; `slope` segmented ↘/↗ (line) | src/editor/params/schemas/shape.js:38-46 |
| Inspector → Appearance pane | Corner radius `NumberField variant="property" size="sm"` + `Icon corner-radius` `glyphSize('sm')`=14 — **rect shape and text only**; `radius` is not in SHAPE_SCHEMA | LayerInspector.jsx:193, 232-244; glyphLadders.js:30 |
| Inspector → Parameters pane | one `Button tone="primary" size="sm" className="w-full"` labelled `'Shape parameters'` (`PARAMS_LABELS.shape`) that dispatches `kol:open-params` — the inspector itself holds **no** shape params | LayerInspector.jsx:269-275, 278-294 |
| Inspector → Transform pane | rotation `AxisField` (°) + `BindDot` range 0..360; rotate-90-left / flip-h / flip-v `SegmentedToggle variant="filled" size="sm" value={null}` | LayerInspector.jsx:61-95 |
| Inspector → Appearance | opacity `%` NumberField; eye + blend popover (width 160; `BLEND_MODES` from KOL organisms/LayerStack.jsx:26-33 = normal, multiply, screen, overlay, soft-light, difference) | LayerInspector.jsx:201-245 |
| Paint | NOT in inspector (ruling 2026-09-27) — read-only `ColorSwatch size={14}` Fill/Stroke `kol-helper-10 text-meta` + "Colour…" `Button size="xs"` → `kol:open-color-modal`; strokeWidth written by `src/editor/color/StrokePanel.jsx:81,89` | LayerInspector.jsx:147-149, 246-258 |
| Context menu (width 192) | 'Parameters' → `kol:open-params` for shape/loop/kinetic/misc/path | CanvasArea.jsx:1621-1623, 1637 |

## 4. Defaults of a freshly created layer (fill / stroke / opacity / blend)

`paintExtras` (state.jsx:832-836): color-types get `{ color: paintFill, stroke: paintStroke }` (background: color only). App paint pair initial `paintFill '#FFFFFF'`, `paintStroke '#000000'` (state.jsx:581-582), and it re-snaps to the selected layer's resolved color on selection (state.jsx:792-805). `strokeWidth` is never set by `addLayer` for shape/text/pattern → `undefined` → rendered as 0 (LayerRenderer.jsx:1570, 602, 1855), so the adopted `stroke` is invisible until StrokePanel sets a width.

| Entry point | color | stroke | strokeWidth | opacity | blend |
|---|---|---|---|---|---|
| shape via add menu (`SHAPE_KINDS` extras carry no color, LayerStack.jsx:32-37) | `paintFill` (overrides `'palette:dark'` of state.jsx:444) | `paintStroke` | undefined→0 | 1 | 'normal' |
| shape via tool drag/click (CanvasArea.jsx:1075-1081 pass `color:'palette:dark'`) | `'palette:dark'` | `paintStroke` | undefined→0 | 1 | 'normal' |
| line (CanvasArea.jsx:383-390) | `null` (no fill) | `'palette:dark'` | 2 | 1 | 'normal' |
| path via pen (CanvasArea.jsx:269-273) | `null` | `'palette:dark'` | 2 | 1 | 'normal' |
| text (state.jsx:486 + paintExtras) | `paintFill` (overrides `'palette:dark'`) | `paintStroke` | undefined→0 | 1 | 'normal' |
| text via library drop (state.jsx:1659-1677) | `item.color ?? 'palette:dark'` | none | none | 1 | 'normal' |
| pattern (state.jsx:442) | `paintFill` (overrides `'palette:secondary'`) | `paintStroke` | undefined→0 | 1 | 'normal' |
| pattern via library (state.jsx:1643-1649) | `spec.color ?? 'palette:secondary'` (patternFromSpec :390-406) | none | none | 1 | 'normal' |
| photo / loop / misc / kinetic | not color types — no color/stroke | — | — | 1 | 'normal' |
| group (state.jsx:1233-1241) | none | none | none | 1 | 'normal' |
| bool (state.jsx:1046-1054) | bottom operand's `color ?? 'palette:dark'` | `base.stroke ?? null` | `base.strokeWidth ?? 0` | `base.opacity ?? 1` | `base.blend ?? 'normal'` |
| flatten shape (state.jsx:1417-1427) | none (pattern) / resolved hex (text :1481) | none | none | 1 | 'normal' |

Tool-click default sizes (CanvasArea.jsx:1057-1066): text 600×120, rect/ellipse/triangle/polygon/star 240×240, pattern full canvas, else 200×200. Menu-add shape is 200×200 (state.jsx:444).

## 5. Transform model

- Box: `x y w h` virtual px (state.jsx:299). Resize min 8 (CanvasArea.jsx:610-619, LayerInspector.jsx:466). Duplicate offset 24 (state.jsx:1156).
- **No anchor/origin field.** Rotation + flip pivot about the bbox center = the default CSS transform-origin: `transform: rotate(Ndeg) scale(±1, ±1)` (LayerRenderer.jsx:81-94; note the string lists rotate first, which with CSS right-to-left application means mirror-in-local-frame then rotate). Export emits `translate(cx cy) rotate(r) scale(sx sy) translate(-cx -cy)` with `cx = x + w/2` (build.js:84-97). paper.js uses the same center (boolean-ops.js:105-107). `composeContainerTransform` composes container rotation/flip into released children (state.jsx:230-277).
- `rotation` writers: rotate handle `data-handle="ROT"` → `atan2` delta from the center, Shift snaps 15°, 0.1° precision, normalized `((deg%360)+360)%360` (CanvasArea.jsx:421-434, 555-563); inspector field integer 0..360 (LayerInspector.jsx:63-67); rotate-90-left (:90); `BindDot` makes it animatable (:69-73) — export uses the base number only (build.js:88).
- Resize on a rotated layer: world delta rotated into the local frame, far point anchored (CanvasArea.jsx:598-664); ⌥ = from center (:608, 644-649); Shift inverts `aspectLocked` (:628-630). Resize also scales path `nodes/holes` (:677-682), bool `children` via `scaleBoolChildren` (:685-687; boolean-ops.js:244-256), photo crop rect (:668-675).
- `flipX/flipY`: `flipLayer` toggles the flag; **paths bake the mirror into nodes** (state.jsx:998-1011); cover types / unboxed layers skipped (:1001, 1008).
- Paths carry transform-free geometry: rotation is baked at node-edit entry (CanvasArea.jsx:952-970 → `rotation: 0`) and at shape→path conversion (state.jsx:1122-1128).
- Create placement anchors `TL TC TR ML C MR BL BC BR` with `PADDING = 80` — `boxFromAnchor` state.jsx:309-329 (create-time only).
- Snap: `SNAP_THRESHOLD = 6` vpx against canvas edges/center, every positioned layer's edges/center, ruler guides (snap.js:9, 21-40); group-move never snaps (CanvasArea.jsx:570-583).

## 6. Groups, bool, flatten, shape → path

| Operation | Function | Rules | Where |
|---|---|---|---|
| Group | `groupLayers(ids)` | ≥2; targets resolved DEEP in document z-order; children re-origined to group bbox; group lands at **top of stack**; selects group | state.jsx:1194-1246 |
| Ungroup | `ungroupLayer(id)` | top-level groups only (`prev.findIndex` :1255); children restored via `composeContainerTransform`; selects children | state.jsx:1252-1266 |
| Boolean group | `booleanGroup(op)` (alias `booleanSelected` :1937) | ≥2 `isBooleanable` **top-level** selected (:1034); z-order bottom-first; lands at **topmost operand's index** (:1057); adopts bottom operand paint; empty result boxed by `jointBbox` (:281-289, 1037) | state.jsx:1032-1064 |
| Eligibility | `hasBooleanGeometry` / `isBooleanable` | closed path ≥3 nodes; shape kind ∈ {rect, ellipse, triangle, polygon, star}; bool with ≥1 child; `isBooleanable` adds `!locked` | boolean-ops.js:25, 31-41 |
| Live geometry | `computeBoolean(children, op)` → `computeBooleanCached` | paper.js `paper-core` headless (:18, 44-49); hidden children dropped (:185), locked still contribute (:27-29); result `{nodes, holes, bounds}` evenodd, largest ring = outer (:151-157); cache `WeakMap` keyed on `children` array identity (:196-205) | boolean-ops.js:184-205 |
| Refit | `refitBoolLayer` | frame hugs result; `REFIT_EPS 0.01`; runs from `patchLayerDeep` / remove / insert / replace when op or children change | boolean-ops.js:209-239; state.jsx:109-118, 148, 172, 199 |
| Release | `releaseBoolean(id)` | top-level only; children back to canvas coords with container transform composed | state.jsx:1274-1288 |
| Flatten (bake) | `flattenSelected()` | one bool → path; ≥2 vector → destructive unite (`booleanCombine(targets,'unite')`); lands at topmost input, bottom input's paint | state.jsx:1072-1105 |
| **Shape → path** | **`shapeToPathNodes(layer)`** (shape-math.js:65-105) — the only shape-to-path function | returns `{nodes, closed}` or null (logo/flatten); reproduces half-stroke inset; **sole caller** `convertShapeToPath` (state.jsx:1114-1150; import :14): bakes flip then rotation, `normalizePath`, keeps `id`/`locked`/opacity/blend; closed kinds keep fill, line → stroke-only (:1137-1144). UI: ParametersPanel.jsx:92-98 "Convert to path" | state.jsx:1114-1150 |
| Pattern → flatten | `flattenPattern(id)` | pattern → `group{ children:[shape{kind:'flatten', svg, fit:'fill'}] }` via `buildPatternSvg`, replaced in place (deep) | state.jsx:1393-1440 |
| Text → flatten | `flattenText(id)` (async) | `computeFrameGlyphs` → group of per-glyph flatten shapes (`fill="currentColor"`) | state.jsx:1447-1504 |
| Paratype → flatten | `flattenParatype(id)` | via generators pack `buildParatypeFlattenGroup` | state.jsx:1509-1520 |
| Reparent (panel drag) | `reparentLayer(id, parentId, index)` | rejects cycles and non-geometry into a bool (:1310) | state.jsx:1299-1328 |
| path-math | re-export only | `pathD, pathBounds, shiftNode, normalizePath, scalePathNodes, normalizePathRings, rotatePathNodes, dist, nearestSegmentT, splitSegment, smoothNode` from KOL `src/hooks/pathMath.js` (peer floor 0.197.0) | path-math.js:1-8; node_modules/@kolkrabbi/kol-component/src/hooks/pathMath.js:1-11, 27 |
| Deep lookup | `findLayerDeep(layers, id)` | | helpers.js:4-13 |

## 7. History

- **Hand-rolled**, not KOL's `useHistory`: `past`/`future` `useState` + mirrored refs (state.jsx:644-660). KOL ships `useHistory(initialValue, limit=100)` → `{ value, set, begin, end, undo, redo, reset, canUndo, canRedo }` at node_modules/@kolkrabbi/kol-component/src/hooks/useHistory.js:37-121 (packaged 0.208.0 per `.kol/llm-context/AGENT-CONTEXT.md:34`); no `useHistory` import anywhere under `src/` (grep).
- Snapshot = `{ layers, selectedIds }` (state.jsx:662); cap 100 (:676, 719, 736, 752).
- Push points: `setLayersTracked` pushes the PRE-state on every discrete call (identity bail `next === prev` :673; :670-684); transactions `beginTransaction` snapshot / `commitTransaction` pushes once only if layers or selection identity changed (:711-725); `undo`/`redo` refuse mid-transaction (:731, 748). Rule: never push inside a setState updater (:664-669).
| Writer | Mode | path:line |
|---|---|---|
| `updateLayer`, `toggleLayer`, `toggleLayerLock`, `moveLayer`, group/ungroup/bool/flatten/convert/reparent/align | discrete | state.jsx:879-881, 982-988, 1802-1816 |
| `useLayerEdit(id, { history })` | `'discrete'` \| `'coalesce'` (250 ms quiet, used by LayerInspector:42 and ParametersPanel:73) \| `'transaction'` | useLayerEdit.js:26-55 |
| canvas move / resize / rotate | transaction (begin :420, 496, 508 → commit :701) | CanvasArea.jsx |
| `deleteSelected`, `flipSelected` | one transaction each | state.jsx:871-877, 1014-1020 |
| camera-orbit drag / wheel | transaction (wheel idle 400 ms) | LayerRenderer.jsx:1482, 1500, 1506-1508 |
- NOT history-tracked: ruler guides (:538-543), aspect/canvas size/palette on preset load (:1582-1588), `canvasFill`, preset tracking (:1177). Autosave draft `kol.editor.draft` 500 ms debounce is separate (:34, 1774-1794).

## 8. Locking & visibility

Fields: `visible` (true at create :839; `undefined ⇒ visible`), `locked` (toggled :986-988). Toggles are **top-level `prev.map`** (state.jsx:983, 987) — not deep.

| Honoured by | `visible === false` | `locked` |
|---|---|---|
| DOM render / SVG export | skip: LayerRenderer.jsx:79; build.js:477 | — |
| Boolean result | hidden operands dropped: boolean-ops.js:185 | locked operands still contribute :27-29; `isBooleanable` excludes locked from selection ops :40 |
| Canvas click | (hidden renders nothing) | canvas-inert → falls through to marquee/deselect: CanvasArea.jsx:468-471; group-move skips locked members :493; handles ignored :417; crop dbl-click :986 |
| Marquee | filtered :1035 | filtered :1035 |
| Snap targets | **not** filtered (snap.js:21-33) | not filtered |
| Keymap | — | opacity digits :1139; duplicate :1171; delete (deep) :1182; nudge :1222 |
| State ops | — | `flipLayer` :1001; `alignSelected` :1343 |
| Layer panel (KOL `LayerStack`) | row class `is-hidden`, eye `Icon size 12` | lock `Icon size 12`; rows stay selectable | organisms/LayerStack.jsx:119, 164-182 |
| Context menu | 'Show'/'Hide' :1629 | 'Lock'/'Unlock' :1630 — but 'Delete' :1631 and 'Duplicate' :1628 do not check lock |
| Inspector | eye in Appearance header :205 | **no lock guard** on X/Y/W/H/rotation/opacity writes (LayerInspector.jsx:429-430, 488-489; `updateLayer` :879) |

## 9. Multi-select

- `selectedIds: string[]` (state.jsx:595); `selectedId = selectedIds[0] ?? null` (:596); magic `'canvas'` id = canvas + every top-level layer (:617-620). Setters `select`, `selectCanvas`, `toggleSelection`, `selectMany(ids,{additive})` (:611-642).
- Sources: Shift-click on canvas (CanvasArea.jsx:472-474) and in the panel (LayerStack.jsx:65 → KOL organisms/LayerStack.jsx:372); marquee ≥4 vpx AABB-intersect, Shift additive (CanvasArea.jsx:1024-1043); mousedown on a selected member arms a group move (:482-505).
- Routing: KOL `InspectorRail` precedence canvas > multi (≥2 non-canvas) > single (node_modules/@kolkrabbi/kol-component/src/molecules/InspectorRail.jsx:46-56); multi renderer = `InspectorSection pane` + `<p className="kol-mono-12 text-meta">{n} layers selected.</p>` + `AlignmentPanel` + `Button tone="primary" size="sm" iconLeft="component-01"` "Group selection" (InspectorRail.jsx:30-44).
- Depth asymmetry: `CanvasArea.selectedLayer = layers.find(top-level)` (CanvasArea.jsx:99) so a panel-selected nested child has no canvas wireframe/handles; `booleanGroup`/`flattenSelected` filter top-level (state.jsx:1034, 1074); `alignSelected`, `deleteSelected`, `duplicateLayer`, `flipLayer` resolve deep (:1342, 863, 1157, 1000).

## 10. Align / distribute

- UI: `AlignmentPanel` = `grid grid-cols-2 gap-2` of two `SegmentedToggle variant="filled" size="sm" value={null}` (26 px rung per node_modules/@kolkrabbi/kol-component/src/atoms/SegmentedToggle.jsx:49-52), cells `Icon` from `@kolkrabbi/kol-icons` `size={16}` named `align-horizontal-left/center/right`, `align-vertical-top/center/bottom` (AlignmentPanel.jsx:1, 9-26). Mounted in the Transform pane (LayerInspector.jsx:56) and the multi summary (InspectorRail.jsx:33).
- Math `alignSelected(axis 'h'|'v', mode 'start'|'center'|'end')` state.jsx:1338-1383: **one** layer aligns to the canvas (`bx=0, by=0, bw=CANVAS_W, bh=virtualH` :1352-1356); **≥2** align to their common bbox of absolute AABBs (:1346-1349, 1353-1356); locked / non-numeric x,y skipped (:1343); `'canvas'` excluded (:1340); writes `x` or `y` only (:1378-1379); rotation ignored (unrotated box).
- **No distribute**: grep `distribute` in `src/editor` hits only type-morph comments (modes/type/buildTypeSvg.js:104, modes/type/morph.js:6).

## Contradictions

| # | Topic | Side A | Side B |
|---|---|---|---|
| 1 | Shape default fill | `layerDefaults` shape `color: 'palette:dark'` state.jsx:444 | `addLayer` spreads `paintExtras` after it → `paintFill` ('#FFFFFF' :581) wins state.jsx:839; tool-created shapes re-add `'palette:dark'` CanvasArea.jsx:1075-1081, menu-created (LayerStack.jsx:32-37) don't → two fills for one kind |
| 2 | Shape default size | menu-add 200×200 state.jsx:444 | tool-click 240×240 CanvasArea.jsx:1059-1063 |
| 3 | Star `innerRatio` range | schema 0.2–0.9 step 0.05 params/schemas/shape.js:44 | `starPoints` clamp 0.1–0.95 shape-math.js:28 |
| 4 | Rect `radius` | rendered LayerRenderer.jsx:1624, exported build.js:249, editable LayerInspector.jsx:232-244 | dropped by `shapeToPathNodes` shape-math.js:71-79 and by `paper.Path.Rectangle` boolean-ops.js:86 → convert-to-path / bool silently un-rounds |
| 5 | Polygon/triangle/star stroke join | DOM default `strokeLinejoin='round'` LayerRenderer.jsx:1669, 1721, 1739 | export emits `stroke-linejoin` only when set build.js:238-243 → miter in SVG |
| 6 | Cover types | `COVER_TYPES = ['background']` state.jsx:303 | header "Cover types (background / pattern / photo)" LayerRenderer.jsx:45-46 |
| 7 | Shape model doc | header `shape { kind, variant, color, x, y, w, h } (kind:'logo' for now)` state.jsx:72 | 8 kinds labels.js:26-35; ShapeLayer LayerRenderer.jsx:1545-1554 |
| 8 | Export types doc | "Layer types handled: background / pattern / photo / shape / text" build.js:8 | switch handles 11 types build.js:493-509 |
| 9 | `POSITIONED_TYPES` | 5 types state.jsx:304 | group/bool/loop/misc/kinetic also carry x/y/w/h state.jsx:453, 480, 1049, 1239; constant has no consumer |
| 10 | Kinetic label | `TYPE_LABELS.kinetic = 'Kinetic type'` labels.js:15; menu 'Kinetic type' state.jsx:423 | `Kinetic · ${presetLabel}` labels.js:49; `Kinetic · …` LayerInspector.jsx:274 |
| 11 | Shape-kind lists (3 copies of the same labels) | add menu 6 kinds, no line/flatten LayerStack.jsx:31-38 | `KIND_OPTIONS` 8 params/schemas/shape.js:10-19; `SHAPE_KIND_LABELS` 8 labels.js:26-35 — Kind dropdown can switch any shape to 'flatten' (renders nothing without `svg`, LayerRenderer.jsx:1603) |
| 12 | Type-icon map duplicated | `TYPE_ICONS` LayerStack.jsx:15-26 | identical `DEFAULT_TYPE_ICONS` node_modules/@kolkrabbi/kol-component/src/organisms/LayerStack.jsx:11-22; group and bool share `'layers'` in both |
| 13 | Lock enforcement | keyboard delete/duplicate skip locked CanvasArea.jsx:1171, 1182 | context-menu Delete/Duplicate don't :1628, 1631; inspector fields write regardless LayerInspector.jsx:429-430 |
| 14 | Nested eye/lock | KOL `LayerStack` wires eye/lock on nested rows organisms/LayerStack.jsx:373-374, 383-387 | `toggleLayer`/`toggleLayerLock` map top-level only state.jsx:983, 987 → no-op on children; AppearanceSection eye (LayerInspector.jsx:205) same path |
| 15 | New-container z-placement | group lands at top of stack state.jsx:1243 | bool lands at topmost operand's index state.jsx:1057; flatten likewise :1098 |
| 16 | Text factories | `TEXT_DEFAULTS` with family/verticalAlign/resizing/axis fields state.jsx:334-360, 486 | library insert builds text without those, family fallback `'jetbrains-mono'`/`'right-grotesk'` state.jsx:1659-1677 |
| 17 | Pattern default color | factory `'palette:secondary'` state.jsx:442 | `paintExtras` overrides with `paintFill` state.jsx:839; library insert keeps `'palette:secondary'` :1648 |
| 18 | History implementation | KOL `useHistory` packaged, AGENT-CONTEXT.md:34; kol-component/src/hooks/useHistory.js:37 | state.jsx:644-762 hand-rolls the same stack; no import |
| 19 | Visibility on hidden layers | render/export/marquee/bool skip :79, build.js:477, CanvasArea.jsx:1035, boolean-ops.js:185 | snap targets include hidden and locked layers snap.js:21-33 |
| 20 | Meta-text type class in inspector | `kol-mono-12 text-meta` InspectorRail.jsx:32 | `kol-helper-12 text-meta` LayerInspector.jsx:301; `kol-helper-10 text-meta` :253, 255 |
| 21 | Glyph size spelling | literal `size={16}` AlignmentPanel.jsx:10-17 | `glyphSize('sm', true)` (=16, glyphLadders.js:27) LayerInspector.jsx:85-87 |

## Open questions

- Should locked layers be write-protected in the inspector / context menu, or is lock a canvas-only concept (state.jsx:986-988 has no consumer-side guard)?
- Is dropping `radius` on convert-to-path / boolean (shape-math.js:71, boolean-ops.js:86) accepted, or is a rounded-rect node generator intended?
- Is `POSITIONED_TYPES` (state.jsx:304) dead code or a planned gate?
- Should `toggleLayer`/`toggleLayerLock` go deep (state.jsx:983, 987) now that the KOL stack renders nested eye/lock (organisms/LayerStack.jsx:373-374, 383-387)?
- Logo `fit` (`'contain'` honoured at LayerRenderer.jsx:1592) is only exposed for flatten in the schema (params/schemas/shape.js:41) — hidden on purpose?
- Does `AlignmentPanel` intentionally align rotated layers by their unrotated AABB (state.jsx:1346-1349)?
- Which `useHistory` should win — adopt KOL's (hooks/useHistory.js) or keep state.jsx:644-762?
- Should hidden/locked layers stop being snap targets (snap.js:21-33)?
- `kol-theme` tokens cited by state: `--kol-surface-ab-split` (#ffffff / #000000, kol-base-tokens.css:102, 133) and `--kol-surface-secondary` (#f2f2f2 / #19191d, :50, 113) are the canvas/infinite defaults (state.jsx:559, 563) — is the themed `var()` fill meant to survive export (build.js has no var() resolver)?
