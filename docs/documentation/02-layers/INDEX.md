---
title: The Layer Model
type: reference
status: active
updated: 2026-07-08
description: The layer types, the full-frame-vs-placed creation rule, the DOM compositor, the Figma layers panel, non-destructive booleans/groups, and the layer state store with undo + draft persistence.
aliases:
  - layers
  - layer-model
  - compositor
tags:
  - project/kol-fxr
  - editor/layers
  - editor/compositor
  - editor/persistence
  - domain/rendering
covers:
  - the 11 layer types and what each is
  - the full-frame vs placed creation-defaults rule (and why)
  - the DOM compositor and its per-type render vehicles
  - the Figma container model in the layers panel
  - non-destructive booleans, groups, and reparent
  - the layer state store — history/undo and localStorage draft persistence
sources:
  - src/editor/compose/state.jsx
  - src/editor/compose/LayerRenderer.jsx
  - src/editor/compose/LayerStack.jsx
  - src/editor/compose/build.js
related:
  - "[[01-hierarchy/INDEX|the app hierarchy]]"
  - "[[../11-persistence/INDEX|persistence]]"
---

# The Layer Model

A composition is a **z-stacked array of layers** over a **frame**. The frame is global config — aspect, canvas dimensions, palette, canvas fill, ruler guides — that applies to everything and isn't itself z-stacked (`ComposeStateProvider` in `src/editor/compose/state.jsx`). Layers are the render elements: each is `{ id, type, visible, opacity, blend, ...typeProps }`, first in the array = bottom of the stack.

All positioning happens in a fixed **1080-wide virtual coordinate space** (`CANVAS_W = 1080`; `CANVAS_H` follows the aspect ratio). The `Canvas` component scales that virtual space to the viewport, and export scales the same geometry to real output pixels — so a layer never changes coordinates when the frame resizes (the Figma-equivalent: layers stay put when frame size changes).

## Layer types

Every layer is exactly one `type`. The switch in `LayerRenderer` (runtime DOM) and `layerToSvg` in `build.js` (export) both dispatch on it.

| Type | What it is | How it's born |
|---|---|---|
| **background** | Flat color fill, cover-only (fills the frame, not draggable). **Legacy** — the canvas owns its own fill now (`canvasFill` frame state), so background can't be created fresh; existing background-typed layers in old presets still render. | legacy presets only |
| **pattern** | Full Pattern Lab tile — `shapeId`, cols/rows/gap/padding, rules, scale, color. Rendered as a repeating `background-image` SVG data-URI. | `+` menu / library |
| **photo** | Bitmap or media fill — image, video, or live webcam. `fit` (cover/contain/fill), optional crop window (`imgX/Y/W/H`). | `+` menu / OS file drop |
| **shape** | Vector content by `kind`: `logo` (brand `KolLogo`), `rect`, `ellipse`, `triangle`, `line`, `polygon`, `star`, or `flatten` (baked SVG string from a pattern/text flatten). | `+` menu (kind picker) |
| **text** | Full Type Lab typography — cut/weight/italic/size/tracking/line-height/case/align — rendered live through `<TypeBlock>` (contentEditable). | `+` menu / library |
| **path** | Cubic-bezier vector authored by the pen tool. Nodes are layer-local; may carry `holes` (boolean/flatten output). | pen tool / flatten |
| **bool** | **Non-destructive boolean group** (`op`: unite/subtract/intersect/exclude). `children` render as ONE combined path, recomputed live. | Vector boolean ops |
| **group** | Container. `children` store group-relative coords and transform as a unit. | Group action |
| **loop** | An imported generative loop (`src/loops`). Preset params spread FLAT onto the layer so the binding/timeline machinery treats them like any prop. Rides the loop render vehicle. | Generative menu |
| **kinetic** | A labs TYPE composition on the `KineticType` engine (`src/kinetic`). The composition rides **opaquely** on `layer.comp` — no flat param spread. | Generative menu |
| **misc** | **Para Type** — a generative composition. The placeholder home for rule-driven generators that are neither Generative types nor Effects. Rides the loop render vehicle (`loopGroup: 'paratype'`). | Generative menu |

`LAYER_TYPES` (the `+` add menu) lists only the freshly-creatable types: pattern · photo · shape · text · loop · kinetic · misc. `background`, `group`, `bool`, and `path` are produced by other paths (legacy data, group/boolean actions, the pen tool). `COLOR_LAYER_TYPES` — the set that owns a `color`/`stroke` — is `background · pattern · shape · text · path · bool`.

## Creation defaults — full-frame vs placed

**This is the load-bearing rule for how a new layer enters the canvas.** `layerDefaults(type, vh)` in `state.jsx` builds the initial box, and it uses one of three helpers per type:

| Helper | Shape | Meaning |
|---|---|---|
| `cover(extra)` | `{ ...extra }` — no box | Fills the frame via `inset: 0`, not draggable/resizable. **background** only. |
| `fullCanvas(extra)` | `{ x: 0, y: 0, w: CANVAS_W, h: vh, ...extra }` | A real positioned box that **defaults to filling the whole frame**. Draggable/resizable afterward. |
| `placed(w, h, extra)` | `{ ...boxFromAnchor('C', w, h, vh), w, h, ...extra }` | A fixed-size box **centered** in the frame (via `boxFromAnchor`, `PADDING = 80`). |

The split by intent:

- **Generative + media layers come in filling the frame** (`fullCanvas`): **loop**, **misc/paratype**, **kinetic**, **pattern**, **photo** — plus **background** (`cover`, which also fills). One generator per frame.
- **Content + vector layers come in as placed boxes** you then position: **shape** (`placed(200, 200)`), **text** (`placed(600, 120)`). **path** is a special case — it enters with a degenerate `{ x:0, y:0, w:1, h:1 }` because its real geometry arrives from the pen tool, not `layerDefaults`.

`COVER_TYPES = ['background']` and `POSITIONED_TYPES = ['pattern', 'photo', 'shape', 'text', 'path']` record the two families; generative types (loop/misc/kinetic) are positioned too but default full-frame.

**Why full-frame for generators.** This is **labs parity**, decided this session. In `kol-labs-single`, each generative page renders one generator across the entire export frame — there is no fixed generator box. Bringing that faithfully into the editor means a fresh loop/paratype/kinetic/pattern layer must fill the frame it will export to. The `layerDefaults` comment states it directly: *"Full-frame, matching labs — a generative loop fills the export frame (labs pages render one generator per frame; there is no fixed box). Resizable/movable afterward like any layer."* The earlier arbitrary **480×480** default was a port-time placeholder with no labs meaning; it was removed in favor of `fullCanvas`. `vh` is the **live** virtual height (`CANVAS_W / ratio`, read through `virtualHRef`) so full-frame and centered boxes land correctly on non-square canvases, not against a stale 1080 constant.

## The compositor

`LayerRenderer` (`src/editor/compose/LayerRenderer.jsx`) renders one layer as a positioned DOM element inside the virtual canvas. `build.js` mirrors the same visual semantics into an SVG string for PNG/SVG export, so downloads match what's on screen.

**The common envelope.** Before dispatching, `LayerRenderer` resolves any animated/modulated props: `hasBindings(layer)` decides whether to subscribe to the transport clock — static layers (the whole editor at rest) skip the subscription entirely, so an unbound layer costs nothing per frame. It then builds `layerStyle` shared by every vehicle:

- `opacity` → element opacity
- `blend` → `mixBlendMode` (when not `normal`)
- `rotation` + `flipX`/`flipY` → a `transform` that mirrors-then-rotates about the layer's own center (the same order `build.js` emits for export)

Positioning is uniform: positioned layers set `left/top/width/height` from `layer.x/y/w/h`; cover layers use `inset: 0`. Every interactive element carries `data-layer-id` so the canvas pointer router (`CanvasArea`) can identify the drag/select target via `.closest()`.

**Render vehicles** (one per type, chosen in the dispatch switch):

| Vehicle | Types | Mechanism |
|---|---|---|
| `BackgroundLayer` | background | `<div inset:0>` with a resolved background color |
| `PatternLayer` | pattern | `<div>` with a `background-image` SVG data-URI tile (`buildPatternSvg`), `background-repeat`, memoized by params |
| `PhotoLayer` / `VideoPhotoLayer` / `WebcamPhotoLayer` | photo | `<img>` / transport-governed `<video>` / live-stream `<video>`, `objectFit`, optional crop frame |
| `ShapeLayer` | shape | `<div>` hosting `KolLogo`, an inlined flatten SVG, or an inline `<svg>` primitive (rect/ellipse/triangle/line/polygon/star) |
| `PathLayer` | path | `<svg>` with a single `<path>` in layer-local coords; painted-geometry hit-testing (`pointerEvents: visiblePainted`) so open strokes don't steal their bbox |
| `BoolLayer` | bool | `computeBooleanCached(layer)` → renders the result **as** a `PathLayer` |
| `TextLayer` | text | flex-centered `<div>` wrapping `<TypeBlock>` (contentEditable, commits via `updateLayer`) |
| `GroupLayer` | group | positioned `<div>` translating to `x/y`, recursively rendering `children` at their group-relative coords |
| `LoopLayer` / `EngineLoopLayer` / `KineticLayer` | loop, misc, kinetic | `<canvas>` (2d loop via `drawLoopFrame`, or lazy-imported GL engine) / kinetic engine host div rendering live SVG `<text>`, all transport-driven |

**The filter tier.** Any positioned layer carrying an effect chain (`layer.filters[]`) routes through `EffectedLayer` / `FilteredPhotoLayer` / `EngineFilterLayer` instead of its plain vehicle. The layer's own render is the chain source (SVG types rasterized via `rasterizeLayer`; loops/video drawn per frame). Chain tier order is **canvas stages → pixi GPU batch → terminal GL engine**.

## The layers panel

`LayerStack` (`src/editor/compose/LayerStack.jsx`) is the left rail. It follows the **Figma container model**:

- **Canvas is the root container.** `CanvasRow` sits at the top, always present, can't be deleted. Every top-level layer nests one 16px step inside it; group/bool children nest one step further. Selecting Canvas selects every top-level layer (it's the parent of all).
- **The stack renders reversed** (`[...layers].reverse()`) so the top of the panel is the top of the z-stack.
- **Row anatomy** is `[chevron] [type icon] [name] … [eye] [lock]`. The eye/lock toggles are hover-revealed (always shown when off/locked). Double-clicking a name renames inline (stored on `layer.name`, undo-safe via `updateLayer`; emptying it falls back to the type label).
- **Containers nest recursively.** `group` and `bool` rows get a collapse chevron; `renderChildren` walks the tree, so collapse, selection, and drag work identically **at any depth** (16px indent compounds per level).
- **Drag-to-reorder and reparent at any depth.** `onDragStart/Over/Drop` compute a drop position (above/below the target) and call `reparentLayer(draggedId, targetParentId, index)` — one path handles same-container reorder, child → top level, and top level → into a group/bool. Dragging a container into its own subtree is refused (`isIntoOwnSubtree` cycle guard) and the UI withholds the drop line.

The `+` add button (`AddLayerButton`) lives in the Layers/Assets tab row, not the stack footer; its Shape entry expands to a kind picker. The footer only appears while ≥2 layers are selected — it holds the **Group** button. Delete is `Del`/`Backspace` (no trash button).

## Non-destructive booleans, groups, reparent

**Booleans stay live.** `booleanGroup(op)` wraps ≥2 selected booleanable layers (closed paths, basic shape kinds, other bools — `isBooleanable`) into a single `bool` layer. The operands become `children` in **document z-order, bottom-first** (so subtract = bottom minus the layers above it, Figma semantics), stored in group-relative coords. The group lands at the topmost operand's z-position and adopts the bottom operand's paint; its box is the computed result bounds (or `jointBbox` fallback when the result is empty, e.g. a disjoint intersect — the group still wraps and stays manipulable).

The geometry never bakes. `BoolLayer` calls `computeBooleanCached(layer)`, keyed on the `children` array identity — a static frame pays nothing, and any child edit swaps the array and recomputes. The deep-mutation helpers (`patchLayerDeep`, `removeLayerDeep`, `insertLayerDeep`) **refit bool ancestors bottom-up** (`refitBoolLayer`) after any change so the frame keeps hugging the result, deepest bool first.

**Vector menu operations:**

- **Flatten** (`flattenSelected`) bakes to a real `path` layer — one selected bool → its computed path; ≥2 loose vectors → a destructive unite (Figma ⌘E). One-way; tracked through history.
- **Release** (`releaseBoolean`) is the un-boolean: the bool is replaced in place by its children at their canvas-absolute positions, original z-order preserved.

`reparentLayer` refuses non-boolean geometry into a bool (only contributing geometry is allowed, since bool children don't render individually).

**Groups** work the same way. `groupLayers(ids)` wraps ≥2 layers (resolved deep — nested children are pulled out of their parents, groups can nest into groups) into a `group`, children ordered by document z-order and stored group-relative. `ungroupLayer` restores children to absolute coords, and both ungroup and release **compose the container's rotation/flip into each child** (`composeContainerTransform`) so the operation is visually a no-op.

## State and persistence

`ComposeStateProvider` owns everything, exposed through `useComposeState()`. Two surfaces: **FRAME** (aspect, `canvasW/H`, palette, `canvasFill`, guides — raw setters, not undoable) and **LAYERS** (the z-stacked array). Selection is `selectedIds` (an array; multi-select via shift-click / marquee), with `selectedId` a first-entry getter for single-select consumers.

**History (undo/redo).** `past`/`future` are stacks of `{ layers, selectedIds }` snapshots — selection rides with layers so undoing a delete restores both. All layer writes go through `setLayersTracked`, which pushes the pre-state to `past` for a discrete action or defers to an open transaction. `beginTransaction`/`commitTransaction` collapse a drag/resize flood (60 updates) into a single history entry. History writes happen at the **top level** of the callbacks (never inside a `setState` updater) — `pastRef`/`futureRef` + an eager `layersRef` keep same-tick sequences consistent and make it StrictMode-safe against double-invoked updaters. Stacks cap at 100; `undo`/`redo` bail while a transaction is open. Only layers are tracked — aspect, canvas size, and palette are raw setters and are not undone.

**Draft persistence.** A debounced (500ms) effect writes the live composition to `localStorage` under `kol.editor.draft` — layers, aspect, canvas dims, palette, canvas fill, guides, paint pair — and clears the slot when the canvas empties. On first mount, if a usable draft exists, `modal.confirm` prompts to restore. Autosave stays gated (`restoreResolvedRef`) until the prompt resolves, so a mount-time `layers=[]` can't delete the stored draft before the user answers. Restore runs `normalizeLayersDeep` (migrating legacy `filterId` + flat params into the `filters[]` chain) and `hydrateVideoClips`, which re-mints uploaded-video object URLs from the IndexedDB clip store (`lib/clipStore.js`) before the layers mount. `loadPreset`/`insertFromLibrary` re-id every layer on load (`reidLayers`) so a loaded preset never collides with what's already on the canvas. The full draft lifecycle — the restore prompt, the three clear paths, and the sibling `.json`/preset stores — is owned by [[../11-persistence/01-draft-autosave|persistence → draft autosave]].

## Related

- [[01-hierarchy/INDEX|the app hierarchy]] — the METHOD > TYPE > CATEGORY > PRESET model that populates the loop/kinetic/misc layer content.
