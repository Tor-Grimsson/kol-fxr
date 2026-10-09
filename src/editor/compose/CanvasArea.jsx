import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Canvas, { CANVAS_VIRTUAL_W } from '../shell/Canvas'
import { useComposeState, resolveColor, COVER_TYPES, CANVAS_W } from './state'
import LayerRenderer from './LayerRenderer'
import { SelectionOverlay, PathNodeOverlay, CropOverlay, MenuDropdownItem, MenuDropdownDivider, ContextMenu, useContextMenu, useModal } from '@kolkrabbi/kol-component'
import { pathD, normalizePath, normalizePathRings, rotatePathNodes, scalePathNodes, dist, nearestSegmentT, splitSegment } from './path-math'
import { scaleBoolChildren } from './boolean-ops'
import { findLayerDeep } from './helpers'
import KineticElementOverlay from './KineticElementOverlay'
import SoftformsHandleOverlay from './SoftformsHandleOverlay'
import { matchAny, isTyping } from '../state/keymap'
import { useTool } from '../state/tools'
import { useColorTarget } from '../color/useColorTarget'
import { useLayerEdit } from './useLayerEdit'
import { computeSnapTargets, findSnap } from './snap'
import { transport } from '../params/transport'
import { toggleDots } from '../params/dotVisibility'
import { saveClip } from '../lib/clipStore'
import { CURSORS } from './cursors'
import { resolveMasks, canMask } from './masks'
import { CanvasZoomContext } from '../shell/Canvas'
import { setZoom } from '../shell/zoomStore'

/* Per-tool cursor on the canvas stage (spec R8.1–R8.2): every tool sets its own. Shape tools
 * `crosshair` (Photoshop/Figma), `cell` for pattern, the `text` I-beam, `zoom-in` (⌥ zoom-out);
 * the pen and orbit wear drawn glyphs (./cursors — inline `data:` SVG, which needs no asset
 * pipeline; the Vite `?url` import was what failed before). */
const CURSOR_FOR_TOOL = {
  rect:     'crosshair',
  ellipse:  'crosshair',
  triangle: 'crosshair',
  polygon:  'crosshair',
  star:     'crosshair',
  line:     'crosshair',
  pattern:  'cell',
  text:     'text',
  pen:      CURSORS.pen,
  zoom:     'zoom-in',
  hand:     'grab',
  orbit:    CURSORS.orbit,
}

/**
 * CanvasArea — rendered composition + Figma-style pointer router.
 *
 * Mouse routing (mousedown):
 *   • [data-handle] inside the selected overlay  → start a resize drag.
 *   • [data-layer-id] non-cover layer            → select + start a move drag.
 *   • [data-layer-id] cover layer                → select only.
 *   • empty stage                                → deselect.
 *
 * Drag state lives in a ref-backed scratch object so listeners attached to
 * window don't have to rebind on every render. Pixel deltas are divided by
 * the live scale (screen-px / virtual-px) to keep movement 1:1 with the
 * cursor regardless of viewport zoom.
 *
 * Keyboard (when a positioned layer is selected):
 *   • Arrow keys   — nudge ±1 virtual px (±10 with Shift)
 *   • Backspace/Del— remove layer
 *   • Escape       — deselect
 */
const SOCIAL_ASPECTS = ['1:1', '4:5', '9:16']

/* Snap-guide lines — deliberate magenta accent (Figma convention), NOT a
 * theme token: it must pop against any canvas fill in either theme. */
const SNAP_GUIDE_COLOR = '#FF00C8'

/* Fill + alpha (0..1) → CSS color. color-mix so it works for hex AND the
 * themed `var(--kol-*)` fills — the old hex-only rgba() path silently
 * dropped the alpha on the DEFAULT (themed) canvas fill. */
function fillWithAlpha(fill, alpha) {
  if (!fill || typeof fill !== 'string') return fill
  return `color-mix(in srgb, ${fill} ${Math.round(alpha * 100)}%, transparent)`
}

/* the primitives a path can be made from (state.convertShapeToPath / shapeToPathNodes) */
/* Publishes the viewport's zoom for the status bar (it sits outside the DS viewport). */
function ZoomProbe() {
  const z = useContext(CanvasZoomContext)
  useEffect(() => { setZoom(z) }, [z])
  return null
}

/* the band outside the frame that selects the canvas, in screen px */
const FRAME_EDGE = 8
const NO_GUIDES = { h: [], v: [] }

/* The selected path's segment under a virtual point, within `tol` virtual px — the Pen's
 * add-anchor target (Illustrator). ponytail: unrotated paths only; a rotated path is normalised
 * on entering node-edit, so rotate-aware hit testing waits until someone pens onto a rotated one. */
function segmentHit(layer, vx, vy, tol) {
  if (layer?.type !== 'path' || layer.locked || layer.rotation || !Array.isArray(layer.nodes)) return null
  const nodes = layer.nodes
  const lx = vx - layer.x, ly = vy - layer.y
  const segs = nodes.length - 1 + (layer.closed ? 1 : 0)
  let best = null
  for (let i = 0; i < segs; i++) {
    const hit = nearestSegmentT(nodes[i], nodes[(i + 1) % nodes.length], lx, ly)
    if (hit.dist <= tol && (!best || hit.dist < best.dist)) best = { index: i, ...hit }
  }
  return best
}

const CONVERTIBLE_KINDS = new Set(['rect', 'ellipse', 'triangle', 'polygon', 'star', 'line'])

export default function CanvasArea() {
  const {
    aspect, view, layers, palette,
    canvasRatio, showGrid,
    canvasFill, canvasFillOpacity, infiniteFill,
    selectedId, selectedIds, select, selectCanvas, toggleSelection, selectMany,
    addLayer,
    updateLayer, removeLayer, deleteSelected, duplicateLayer, toggleLayer, toggleLayerLock,
    flipSelected, flattenSelected, releaseBoolean, flattenText, convertShapeToPath,
    groupLayers, ungroupLayer,
    insertFromLibrary,
    activePaint, setActivePaint,
    snapEnabled,
    showRulers, toggleRulers,
    guides, setGuides,
    undo, redo, canUndo, canRedo,
    beginTransaction, commitTransaction,
  } = useComposeState()
  const { tool, setTool } = useTool()
  /* Paint shortcuts (D / X / Shift+X / N) write through useColorTarget so
   * the inspector, the picker, and the keymap share one writer. */
  const colorTarget = useColorTarget()
  const strokePaintRef = useRef(null)
  strokePaintRef.current = colorTarget.strokeHex ?? null
  /* Arrow-key nudges write through the shared coalescing editor (same
   * mechanism as the inspector's slider drags) so a burst of keypresses
   * collapses into ONE undo entry. 600ms of quiet commits; a selection
   * change flushes immediately via useLayerEdit's id-change flush, so
   * nudges on different layers never merge. */
  const nudgeEdit = useLayerEdit(selectedId, { history: 'coalesce', coalesceMs: 600 })
  /* Double-0 opacity chord — timestamp of the last bare 0 press. */
  const zeroTapRef = useRef(null)

  const selectedLayer  = layers.find((l) => l.id === selectedId) ?? null
  const isPositionedSel = selectedLayer && !COVER_TYPES.includes(selectedLayer.type)

  /* All selected positioned layers — drives multi-wireframe rendering. */
  const selectedPositionedLayers = selectedIds
    .map((id) => layers.find((l) => l.id === id))
    .filter((l) => l && !COVER_TYPES.includes(l.type))
  const isMultiSel = selectedPositionedLayers.length > 1

  /* Canvas fill is now a frame-level property (was: background-typed layer).
   * Falls back to a legacy background layer's color if present, for in-flight
   * drafts that haven't been migrated. */
  const legacyBg     = layers.find((l) => l.type === 'background' && l.visible)
  const legacyBgHex  = legacyBg ? resolveColor(legacyBg.color, palette) : null
  const fillHex      = resolveColor(canvasFill, palette) ?? legacyBgHex
  const bgColor      = fillHex
    ? (canvasFillOpacity < 1 ? fillWithAlpha(fillHex, canvasFillOpacity) : fillHex)
    : null

  /* Infinite backdrop (area around the frame). `null` = None → transparent,
   * letting the themed `.kol-editor-canvas` surface show through; a var/hex
   * paints it directly. Rendered on the outer wrapper below so it fills the
   * whole stage behind the grid + frame. */
  const infiniteColor = infiniteFill == null ? 'transparent' : (resolveColor(infiniteFill, palette) ?? 'transparent')

  /* masks resolved for drawing (G8): a mask layer hides, its target carries the clip */
  const visibleLayers = useMemo(() => resolveMasks(layers), [layers])

  /* ─── stage ref + on-demand scale ───────────────────────────────────
   * Scale (screen-px / virtual-px) is computed fresh from the stage rect
   * on every coord conversion. Caching it via ResizeObserver was unsafe
   * because RO does NOT fire on CSS-transform changes (CanvasFrame applies
   * `transform: scale()` to a parent), so the cached value went stale on
   * window resize and silently broke drag-create position. */
  const stageRef = useRef(null)

  const getScale = useCallback(() => {
    const node = stageRef.current
    if (!node) return 1
    const w = node.getBoundingClientRect().width
    return w > 0 ? w / CANVAS_VIRTUAL_W : 1
  }, [])

  /* Stage pointer → transport (virtual px) — feeds the 'Pointer over layer'
   * modulation sources. Listener lives on the stage node so rail/panel
   * mouse traffic never notifies bound layers. */
  useEffect(() => {
    const node = stageRef.current
    if (!node) return
    const onMove = (e) => {
      const r = node.getBoundingClientRect()
      if (r.width === 0) return
      const k = CANVAS_VIRTUAL_W / r.width
      transport.setStagePointer((e.clientX - r.left) * k, (e.clientY - r.top) * k)
    }
    const onLeave = () => transport.setStagePointer(null)
    node.addEventListener('mousemove', onMove)
    node.addEventListener('mouseleave', onLeave)
    return () => {
      node.removeEventListener('mousemove', onMove)
      node.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  /* ─── drag state ─── */
  const [drag, setDrag] = useState(null)
  /* drag = { mode: 'move' | 'resize-NW|N|NE|E|SE|S|SW|W',
              layerId, startX, startY, startBox: {x,y,w,h} }
   *  | { mode: 'create', tool, startVX, startVY, vx, vy, vw, vh }
   *  | { mode: 'marquee', additive, startVX, startVY, vx, vy, vw, vh } */

  /* Snap guides — {h, v} positions in virtual px while a move-drag is
   * actively snapping to a target. Cleared on pointerup. */
  const [snapGuides, setSnapGuides] = useState(null)

  /* Group-move drags (mousedown on a member of a multi-selection) record
   * here whether the pointer actually moved past the dead zone — mouseup
   * without movement is a click, which collapses to single-select. */
  const groupMovedRef = useRef(false)

  /* Line tool — pen-style placement. First click sets P1; second click
   * commits a line layer between P1 and P2. linePreview tracks the cursor
   * for the preview line that follows between clicks. Esc cancels.
   * Switching tools also cancels (effect below). */
  const [linePlacement, setLinePlacement] = useState(null) /* { x1, y1 } | null */
  const [linePreview, setLinePreview]     = useState(null) /* { vx, vy } | null */

  /* Pen tool — multi-click bezier authoring. `pen` holds the in-progress
   * node list (virtual coords) + the live cursor for the rubber-band
   * preview; a click places an anchor, click-drag pulls symmetric handles.
   * penDrag tracks the anchor whose handles the current drag is shaping. */
  const [pen, setPen] = useState(null) /* { nodes:[{x,y,in,out}], cursor:{x,y}|null } | null */
  const penDrag       = useRef(null)   /* { index, ax, ay } | null */
  const penRef        = useRef(pen)
  penRef.current      = pen
  const penActive     = pen != null

  /* Node-edit mode — id of the path layer whose nodes/handles are editable.
   * Entered by double-clicking a path; exited on Escape or deselect. */
  const [nodeEditId, setNodeEditId] = useState(null)

  /* Crop mode — id of the photo layer being cropped. Entered by
   * double-clicking a photo; exited on Escape / Enter / deselect. */
  const [cropId, setCropId] = useState(null)

  /* Kinetic element-edit mode — { id, index } of the kinetic layer whose
   * elements are being edited on canvas. Entered from KineticPanel's
   * "Edit on canvas" (kol:kinetic-edit, a toggle); exited on Escape / Enter
   * (inside the overlay) / deselect / tool switch. */
  const [kineticEdit, setKineticEdit] = useState(null)

  /* Soft Forms on-canvas form-edit mode — { id, index } of the softforms
   * (2D) layer whose SDF forms are edited on canvas. Entered from
   * SoftformsLayers' "Edit forms on canvas" (kol:softform-edit, a toggle);
   * exited on Escape / Enter / deselect / tool switch (kinetic precedent). */
  const [softformsEdit, setSoftformsEdit] = useState(null)

  /* Right-click context menu — { x, y, layerId } in client coords, or null.
   * Closed by any action, click-away, Escape, or a new right-click. */
  /* the DS context menu (audit E5): a popover anchored at the pointer — flip, shift, portal,
     Escape and click-away are the DS's; `payload` carries the layer id under the cursor */
  const ctxMenu = useContextMenu()

  /* Enter crop on a photo. First entry initializes the crop window
   * {imgX,imgY,imgW,imgH} (frame-local px) from the layer's current fit —
   * visually a no-op, it just makes the implicit object-fit rect explicit
   * so pan/crop edits have something to write to. Needs the image's
   * natural size, so the init is async on first crop of a given layer. */
  const enterCrop = useCallback((layer) => {
    select(layer.id)
    if (layer.imgW != null) { setCropId(layer.id); return }
    const init = (iw0, ih0) => {
      if (!iw0 || !ih0) return
      const fitK = layer.fit === 'contain' ? Math.min : Math.max
      const k  = fitK(layer.w / iw0, layer.h / ih0)
      const iw = iw0 * k
      const ih = ih0 * k
      updateLayer(layer.id, {
        imgX: (layer.w - iw) / 2, imgY: (layer.h - ih) / 2,
        imgW: iw, imgH: ih,
      })
      setCropId(layer.id)
    }
    /* Video has no naturalWidth — read intrinsic size off a detached
       <video> once metadata loads (same fit math as the image path). */
    if (layer.srcType === 'video') {
      const v = document.createElement('video')
      v.onloadedmetadata = () => init(v.videoWidth, v.videoHeight)
      v.src = layer.src
      return
    }
    const img = new Image()
    img.onload = () => init(img.naturalWidth, img.naturalHeight)
    img.src = layer.src
  }, [select, updateLayer])

  /* Virtual canvas height for the active canvas ratio — sizes the pen/node
   * SVG overlays' viewBox so their coords match the layer coord space (no Y
   * distortion on non-square canvases). Ratio comes from the real pixel
   * dimensions (canvasW/canvasH), so custom sizes work too. */
  const viewH = CANVAS_VIRTUAL_W / (canvasRatio || 1)

  /* Commit the pen draft to a `path` layer. <2 nodes = nothing drawable →
   * just drop back to Select. Nodes are re-origined so the layer's {x,y,w,h}
   * bound the anchors and node coords stay layer-local. Outline by default
   * (no fill, 2px stroke) — the usual expectation for a freshly-penned path. */
  const finishPath = useCallback((nodes, closed) => {
    setPen(null)
    penDrag.current = null
    if (!nodes || nodes.length < 2) { setTool('select'); return }
    const norm = normalizePath(nodes)
    addLayer('path', {
      nodes: norm.nodes, closed,
      x: norm.dx, y: norm.dy, w: norm.w, h: norm.h,
      /* the stroke CARRIES (the user's 5): the paint pair's stroke — which follows the last
         selection — else the palette's dark; an outline, no fill */
      color: null, stroke: strokePaintRef.current ?? 'palette:dark', strokeWidth: 2,
    })
    setTool('select')
  }, [addLayer, setTool])

  /* Convert a clientX/Y point to virtual canvas coords. Scale read fresh
   * each call so the math is self-consistent with the rect we just took. */
  const clientToVirtual = useCallback((clientX, clientY) => {
    const node = stageRef.current
    if (!node) return { vx: 0, vy: 0 }
    const rect = node.getBoundingClientRect()
    const s = (rect.width / CANVAS_VIRTUAL_W) || 1
    return {
      vx: (clientX - rect.left) / s,
      vy: (clientY - rect.top)  / s,
    }
  }, [])

  /* OS file drop → a new photo layer at the drop point. Reuses the File-tab
   * upload semantics: an objectURL blob src + srcType (image | video), created
   * through the shared addLayer('photo') path (not a bespoke insert). Video
   * clips AND images are persisted via clipStore (keyed by the returned layer
   * id) so a dropped file survives reload, exactly like the footer's upload
   * buttons (images joined 2026-10-09, audit F1 — before that a dropped image
   * died with the window). The
   * layer box is sized to the media's intrinsic aspect (probed off the same
   * objectURL), fit within ~60% of the frame, centered on the drop and clamped
   * inside it. */
  const addDroppedFile = useCallback((file, clientX, clientY) => {
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) return
    const url = URL.createObjectURL(file)
    const at = clientToVirtual(clientX, clientY)
    const place = (iw, ih) => {
      const MAX = Math.min(CANVAS_W, viewH) * 0.6
      let w = iw || 480
      let h = ih || 480
      const k = Math.min(1, MAX / Math.max(w, h))
      w = Math.max(8, Math.round(w * k))
      h = Math.max(8, Math.round(h * k))
      const x = Math.max(0, Math.min(CANVAS_W - w, at.vx - w / 2))
      const y = Math.max(0, Math.min(viewH - h, at.vy - h / 2))
      const id = addLayer('photo', { src: url, srcType: isVideo ? 'video' : 'image', fit: 'cover', x, y, w, h })
      if (id) saveClip(id, file)
    }
    if (isVideo) {
      const v = document.createElement('video')
      v.onloadedmetadata = () => place(v.videoWidth, v.videoHeight)
      v.onerror = () => place(0, 0)
      v.src = url
    } else {
      const img = new Image()
      img.onload = () => place(img.naturalWidth, img.naturalHeight)
      img.onerror = () => place(0, 0)
      img.src = url
    }
  }, [addLayer, clientToVirtual, viewH])

  const onStageMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    /* Zoom tool is handled on the OUTER wrapper (covers the backdrop too) —
     * never create/select from the stage while it's armed. Orbit is a 3D
     * viewport mode — the per-layer camera rig (LayerRenderer) owns the
     * pointer over 3D layers; the stage does nothing (no move/create). */
    if (tool === 'zoom' || tool === 'orbit' || tool === 'hand') return
    /* Prevent the document-level click-away listener from clobbering this
     * canvas selection. */
    e.nativeEvent.stopPropagation()

    /* Pen — click places an anchor; click-drag pulls symmetric handles.
     * Clicking the first anchor (within ~10 screen px) with ≥2 nodes closes
     * the path. The handle pull + rubber-band live in the penActive effect. */
    if (tool === 'pen') {
      e.preventDefault()
      const { vx, vy } = clientToVirtual(e.clientX, e.clientY)
      const nodes = penRef.current?.nodes ?? []
      /* ADD ANCHOR (G1 — Illustrator's pen over a selected path): no draft running and the press is
         on a segment of the selected path → split it there, shape-preserving */
      if (nodes.length === 0) {
        const hit = segmentHit(selectedLayer, vx, vy, 8 / getScale())
        if (hit) {
          const cur = selectedLayer.nodes
          const { a, mid, b } = splitSegment(cur[hit.index], cur[(hit.index + 1) % cur.length], hit.t)
          const next = [...cur]
          next[hit.index] = a
          next[(hit.index + 1) % cur.length] = b
          next.splice(hit.index + 1, 0, mid)
          updateLayer(selectedLayer.id, { nodes: next })
          return
        }
      }
      if (nodes.length >= 2) {
        const first = nodes[0]
        if (dist(vx, vy, first.x, first.y) * getScale() < 10) {
          finishPath(nodes, true)
          return
        }
      }
      const idx = nodes.length
      setPen({ nodes: [...nodes, { x: vx, y: vy, in: null, out: null }], cursor: { x: vx, y: vy } })
      penDrag.current = { index: idx, ax: vx, ay: vy }
      return
    }

    /* Line — click-click OR press-drag-release (the walk: a drag drew nothing and left the tool
     * armed). The first press sets P1; a release more than a few px away commits there, else the
     * next click does. */
    if (tool === 'line') {
      e.preventDefault()
      const { vx, vy } = clientToVirtual(e.clientX, e.clientY)
      const commitLine = (x1, y1, x2, y2) => {
        /* Slope picks which bbox diagonal renders. '\\' → ↘ from top-left,
         * '/' → ↙ from bottom-left. Derived from the sign of (P2 - P1). */
        const slope = ((x2 >= x1) === (y2 >= y1)) ? '\\' : '/'
        addLayer('shape', {
          x: Math.min(x1, x2), y: Math.min(y1, y2),
          w: Math.max(1, Math.abs(x2 - x1)), h: Math.max(1, Math.abs(y2 - y1)),
          kind: 'line',
          slope,
          color: null,
          stroke: strokePaintRef.current ?? 'palette:dark',
          strokeWidth: 2,
        })
        setLinePlacement(null)
        setLinePreview(null)
        setTool('select')
      }
      if (!linePlacement) {
        setLinePlacement({ x1: vx, y1: vy })
        setLinePreview({ vx, vy })
        const up = (ev) => {
          window.removeEventListener('mouseup', up)
          const p = clientToVirtual(ev.clientX, ev.clientY)
          if (dist(p.vx, p.vy, vx, vy) * getScale() > 4) commitLine(vx, vy, p.vx, p.vy)
        }
        window.addEventListener('mouseup', up)
        return
      }
      commitLine(linePlacement.x1, linePlacement.y1, vx, vy)
      return
    }

    /* Non-Select tools enter create mode — ignore handles/layers underneath
     * and start drawing transient bounds. */
    if (tool !== 'select') {
      e.preventDefault()
      const { vx, vy } = clientToVirtual(e.clientX, e.clientY)
      setDrag({ mode: 'create', tool, startVX: vx, startVY: vy, vx, vy, vw: 0, vh: 0 })
      return
    }

    const handleEl = e.target.closest('[data-handle]')
    /* Walk up to the OUTERMOST [data-layer-id] so clicking inside a group
     * selects the group itself, not the inner child. */
    let layerEl = e.target.closest('[data-layer-id]')
    while (layerEl?.parentElement) {
      const outer = layerEl.parentElement.closest?.('[data-layer-id]')
      if (!outer) break
      layerEl = outer
    }

    /* Resize / rotate handle wins. Locked layers ignore both. */
    if (handleEl && selectedLayer && !COVER_TYPES.includes(selectedLayer.type) && !selectedLayer.locked) {
      const dir = handleEl.getAttribute('data-handle')
      e.preventDefault()
      beginTransaction()
      if (dir === 'ROT') {
        /* Rotate about the layer center: remember where the pointer angle
         * started so the layer follows the drag as a relative twist. */
        const cx = selectedLayer.x + selectedLayer.w / 2
        const cy = selectedLayer.y + selectedLayer.h / 2
        const { vx, vy } = clientToVirtual(e.clientX, e.clientY)
        setDrag({
          mode: 'rotate',
          layerId: selectedLayer.id,
          cx, cy,
          startAngle: Math.atan2(vy - cy, vx - cx),
          startRot: typeof selectedLayer.rotation === 'number' ? selectedLayer.rotation : 0,
        })
        return
      }
      setDrag({
        mode: `resize-${dir}`,
        layerId: selectedLayer.id,
        startX: e.clientX, startY: e.clientY,
        startBox: {
          x: selectedLayer.x, y: selectedLayer.y, w: selectedLayer.w, h: selectedLayer.h,
          /* Aspect lock snapshot — read once at drag start so the user can
           * toggle it via the inspector mid-drag without breaking the
           * in-flight resize. null/undefined = unlocked. */
          aspectLocked: selectedLayer.aspectLocked,
          rotation: typeof selectedLayer.rotation === 'number' ? selectedLayer.rotation : 0,
          /* Crop rect snapshot (photo layers) — scales with the frame so a
           * cropped photo resizes like an uncropped one. */
          imgX: selectedLayer.imgX, imgY: selectedLayer.imgY,
          imgW: selectedLayer.imgW, imgH: selectedLayer.imgH,
          /* Node snapshot (path layers) — bbox-resize scales the geometry
           * with the box. Nodes are normalized (origin 0,0, bbox = w,h), so
           * plain ratio-scaling keeps them in sync. */
          nodes: selectedLayer.type === 'path' ? selectedLayer.nodes : undefined,
          holes: selectedLayer.type === 'path' ? selectedLayer.holes : undefined,
          /* Children snapshot (bool layers) — resize scales the operands so
           * the computed result tracks the box, path-node style. */
          children: selectedLayer.type === 'bool' ? selectedLayer.children : undefined,
        },
      })
      return
    }

    if (layerEl) {
      const id = layerEl.getAttribute('data-layer-id')
      const layer = layers.find((l) => l.id === id)
      if (!layer) return
      /* Locked layers are canvas-inert: not selectable, not draggable —
       * the click falls through to the stage (marquee / deselect). They
       * remain selectable from the layer panel. */
      if (!layer.locked) {
        if (e.shiftKey) {
          toggleSelection(id)
          return
        }
        /* Mousedown on an already-selected member of a multi-selection
         * KEEPS the selection and arms a group move — every selected
         * unlocked positioned layer rides the same delta, one transaction
         * → one undo entry. Collapse-to-single-select happens on mouseup
         * only when no drag occurred (see onUp). Canvas selection means
         * "everything" — keep its collapse-to-single click as-is. */
        const multiIds = selectedIds.filter((sid) => sid !== 'canvas')
        if (
          !selectedIds.includes('canvas') &&
          multiIds.length > 1 && multiIds.includes(id) &&
          !COVER_TYPES.includes(layer.type)
        ) {
          e.preventDefault()
          const items = multiIds
            .map((sid) => layers.find((l) => l.id === sid))
            /* Locked members stay put; cover / unbounded layers have no
             * position to move (same filters as the single-move path). */
            .filter((l) => l && !l.locked && !COVER_TYPES.includes(l.type)
              && typeof l.x === 'number' && typeof l.y === 'number')
            .map((l) => ({ id: l.id, startBox: { x: l.x, y: l.y } }))
          beginTransaction()
          groupMovedRef.current = false
          setDrag({
            mode: 'move',
            layerId: id,
            items,
            startX: e.clientX, startY: e.clientY,
          })
          return
        }
        if (!COVER_TYPES.includes(layer.type)) {
          e.preventDefault()
          beginTransaction()
          /* ⌥-drag = duplicate, then drag the COPY from the original's spot (audit B6, the
             user's 28). The clone sits in the same transaction as its move → one undo. */
          const moveId = (e.altKey && duplicateLayer(id, { offset: 0 })) || id
          select(moveId)
          setDrag({
            mode: 'move',
            layerId: moveId,
            startX: e.clientX, startY: e.clientY,
            startBox: { x: layer.x, y: layer.y, w: layer.w, h: layer.h },
          })
        } else {
          select(id)
        }
        return
      }
    }

    /* Empty stage with the Select tool — start a marquee. Tiny drags
     * (≤ 4 vpx) commit as a click-deselect on pointerup. Shift-marquee
     * adds to the existing selection. */
    e.preventDefault()
    const { vx, vy } = clientToVirtual(e.clientX, e.clientY)
    setDrag({
      mode: 'marquee',
      additive: e.shiftKey,
      startVX: vx, startVY: vy,
      vx, vy, vw: 0, vh: 0,
    })
  }, [tool, layers, selectedLayer, selectedIds, select, toggleSelection, beginTransaction, clientToVirtual, getScale, finishPath, linePlacement, addLayer, setTool])

  /* Window listeners while dragging. */
  useEffect(() => {
    if (!drag) return
    const onMove = (e) => {
      const s = getScale()

      if (drag.mode === 'create' || drag.mode === 'marquee') {
        const { vx, vy } = clientToVirtual(e.clientX, e.clientY)
        const x = Math.min(drag.startVX, vx)
        const y = Math.min(drag.startVY, vy)
        const w = Math.abs(vx - drag.startVX)
        const h = Math.abs(vy - drag.startVY)
        setDrag((d) => d && (d.mode === 'create' || d.mode === 'marquee') ? { ...d, vx: x, vy: y, vw: w, vh: h } : d)
        return
      }

      if (drag.mode === 'rotate') {
        const { vx, vy } = clientToVirtual(e.clientX, e.clientY)
        const ang = Math.atan2(vy - drag.cy, vx - drag.cx)
        let deg = drag.startRot + ((ang - drag.startAngle) * 180) / Math.PI
        if (e.shiftKey) deg = Math.round(deg / 15) * 15
        deg = ((deg % 360) + 360) % 360
        updateLayer(drag.layerId, { rotation: Math.round(deg * 10) / 10 })
        return
      }

      const dx = (e.clientX - drag.startX) / s
      const dy = (e.clientY - drag.startY) / s
      const { startBox, mode, layerId } = drag

      if (mode === 'move') {
        /* Group move — every member gets the same delta. No snapping (the
         * selection would snap to its own members). A ~3 screen px dead
         * zone (pen-tool precedent) keeps a click-jitter from counting as
         * a drag, so mouseup can still collapse the selection. */
        if (drag.items) {
          if (!groupMovedRef.current) {
            if (Math.abs(e.clientX - drag.startX) < 3 && Math.abs(e.clientY - drag.startY) < 3) return
            groupMovedRef.current = true
          }
          for (const it of drag.items) {
            updateLayer(it.id, { x: it.startBox.x + dx, y: it.startBox.y + dy })
          }
          return
        }
        const cand = { x: startBox.x + dx, y: startBox.y + dy, w: startBox.w, h: startBox.h }
        if (!snapEnabled) {
          updateLayer(layerId, { x: cand.x, y: cand.y })
          return
        }
        const targets = computeSnapTargets(layers, layerId, CANVAS_W, viewH, guides)
        const snap = findSnap(cand, targets)
        updateLayer(layerId, { x: cand.x + snap.dx, y: cand.y + snap.dy })
        setSnapGuides(snap.hGuide != null || snap.vGuide != null ? { h: snap.hGuide, v: snap.vGuide } : null)
        return
      }

      let { x, y, w, h } = startBox
      const dir = mode.slice('resize-'.length)
      /* On a rotated layer the pointer delta must act in the layer's LOCAL
       * frame — rotate the world delta by -rotation before the edge math. */
      const rotRad = ((startBox.rotation ?? 0) * Math.PI) / 180
      const rcos = Math.cos(rotRad)
      const rsin = Math.sin(rotRad)
      const ldx = rotRad ? dx * rcos + dy * rsin : dx
      const ldy = rotRad ? -dx * rsin + dy * rcos : dy
      /* ⌥/Alt = resize from CENTER: the dragged edge and its opposite both
       * move, so each edge delta counts double; the center is pinned below.
       * Familiar Figma/Illustrator modifier, read live off the move event. */
      const fromCenter = e.altKey
      const m = fromCenter ? 2 : 1
      if (dir.includes('E')) w = Math.max(8, startBox.w + m * ldx)
      if (dir.includes('S')) h = Math.max(8, startBox.h + m * ldy)
      if (dir.includes('W')) {
        const nw = Math.max(8, startBox.w - m * ldx)
        x = startBox.x + (startBox.w - nw)
        w = nw
      }
      if (dir.includes('N')) {
        const nh = Math.max(8, startBox.h - m * ldy)
        y = startBox.y + (startBox.h - nh)
        h = nh
      }
      /* Aspect constrain — the inspector's aspect lock (a stored ratio) OR
       * Shift held during the drag. Shift INVERTS the lock (Figma): locked +
       * Shift resizes free, unlocked + Shift constrains to the box's start
       * ratio. Corners pick the driving axis by larger absolute change; edges
       * drive on their own axis. When N/W edges are involved, x/y get
       * re-anchored so the far corner stays put. */
      const lockedAr = Number.isFinite(startBox.aspectLocked) && startBox.aspectLocked > 0 ? startBox.aspectLocked : null
      const constrain = lockedAr ? !e.shiftKey : e.shiftKey
      const ar = constrain ? (lockedAr ?? (startBox.w / startBox.h)) : null
      if (Number.isFinite(ar) && ar > 0) {
        const isCorner = dir.length === 2
        const driveW = isCorner
          ? Math.abs(w - startBox.w) >= Math.abs(h - startBox.h)
          : (dir === 'E' || dir === 'W')
        if (driveW) {
          h = Math.max(8, Math.round(w / ar))
          if (dir.includes('N')) y = startBox.y + startBox.h - h
        } else {
          w = Math.max(8, Math.round(h * ar))
          if (dir.includes('W')) x = startBox.x + startBox.w - w
        }
      }
      if (fromCenter) {
        /* Center pinned — overrides the edge/corner anchoring above (and the
         * rotated re-derivation below); rotation-invariant since the center
         * itself never moves. */
        x = startBox.x + startBox.w / 2 - w / 2
        y = startBox.y + startBox.h / 2 - h / 2
      } else if (rotRad) {
        /* Rotated resize: the unrotated x/y math above drifts because the
         * center moves. Re-derive x/y so the point OPPOSITE the dragged
         * handle stays fixed in world space (Figma behavior). */
        const ax = dir.includes('E') ? -1 : dir.includes('W') ? 1 : 0
        const ay = dir.includes('S') ? -1 : dir.includes('N') ? 1 : 0
        const cx0 = startBox.x + startBox.w / 2
        const cy0 = startBox.y + startBox.h / 2
        const anchorX = cx0 + ((ax * startBox.w) / 2) * rcos - ((ay * startBox.h) / 2) * rsin
        const anchorY = cy0 + ((ax * startBox.w) / 2) * rsin + ((ay * startBox.h) / 2) * rcos
        const cx1 = anchorX - (((ax * w) / 2) * rcos - ((ay * h) / 2) * rsin)
        const cy1 = anchorY - (((ax * w) / 2) * rsin + ((ay * h) / 2) * rcos)
        x = cx1 - w / 2
        y = cy1 - h / 2
      }
      const patch = { x, y, w, h }
      /* Cropped photo: the crop window scales with the frame so resize
       * behaves like an uncropped photo (image scales, framing kept). */
      if (startBox.imgW != null) {
        const kx = w / startBox.w
        const ky = h / startBox.h
        patch.imgX = startBox.imgX * kx
        patch.imgY = startBox.imgY * ky
        patch.imgW = startBox.imgW * kx
        patch.imgH = startBox.imgH * ky
      }
      /* Path: scale nodes (anchors + handles) with the box, holes included. */
      if (startBox.nodes) {
        const kx = w / startBox.w
        const ky = h / startBox.h
        patch.nodes = scalePathNodes(startBox.nodes, kx, ky)
        if (startBox.holes) patch.holes = startBox.holes.map((r) => scalePathNodes(r, kx, ky))
      }
      /* Bool: scale the children (boxes + path geometry) with the box so
       * the recomputed result tracks the resize. */
      if (startBox.children) {
        patch.children = scaleBoolChildren(startBox.children, w / startBox.w, h / startBox.h)
      }
      updateLayer(layerId, patch)
    }
    const onUp = () => {
      if (drag.mode === 'create') {
        commitCreateDrag(drag)
        setDrag(null)
        return
      }
      if (drag.mode === 'marquee') {
        commitMarqueeDrag(drag)
        setDrag(null)
        return
      }
      commitTransaction()
      /* Group-move mousedown that never dragged = a plain click on a
       * member — collapse the multi-selection to that layer. After the
       * commit so the selection change doesn't ride the history entry. */
      if (drag.mode === 'move' && drag.items && !groupMovedRef.current) select(drag.layerId)
      setDrag(null)
      setSnapGuides(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    // commitCreateDrag is closed over below; re-include via deps would force
    // the listener to rebind every render. Stable enough for v1.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, updateLayer, commitTransaction, select, clientToVirtual, getScale])

  /* Pen-tool live preview — tracks the cursor between the two clicks so
   * the user sees a dashed preview line snapping with their pointer. */
  useEffect(() => {
    if (!linePlacement) return
    const onMove = (e) => {
      const { vx, vy } = clientToVirtual(e.clientX, e.clientY)
      setLinePreview({ vx, vy })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [linePlacement, clientToVirtual])

  /* Esc cancels an in-progress line placement. Capture phase so we beat
   * the editor-level deselect handler. */
  useEffect(() => {
    if (!linePlacement) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setLinePlacement(null)
        setLinePreview(null)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [linePlacement])

  /* Switching to a different tool while line placement is in flight
   * cancels the placement. */
  useEffect(() => {
    if (tool !== 'line' && linePlacement) {
      setLinePlacement(null)
      setLinePreview(null)
    }
  }, [tool, linePlacement])

  /* Pen — while a draft is open, track the cursor for the rubber-band and,
   * during a handle pull (penDrag), shape the just-placed anchor's handles
   * symmetrically. Gated on penActive (a boolean) so the listeners bind once
   * per draft, not on every cursor move. */
  useEffect(() => {
    if (!penActive) return
    const onMove = (e) => {
      const { vx, vy } = clientToVirtual(e.clientX, e.clientY)
      const pd = penDrag.current
      setPen((p) => {
        if (!p) return p
        if (pd) {
          /* ~3 screen px dead zone — a micro-twitch between down and up must
           * leave the anchor a true corner (null handles), not a fake-smooth
           * node with zero-length handles. Inside the zone the handles snap
           * back to null, so a retreating drag also restores the corner. */
          const pulled = dist(vx, vy, pd.ax, pd.ay) * getScale() >= 3
          const nodes = p.nodes.map((n, i) => i === pd.index
            ? (pulled
              ? { ...n, out: { x: vx, y: vy }, in: { x: 2 * pd.ax - vx, y: 2 * pd.ay - vy } }
              : { ...n, in: null, out: null })
            : n)
          return { nodes, cursor: { x: vx, y: vy } }
        }
        return { ...p, cursor: { x: vx, y: vy } }
      })
    }
    const onUp = () => { penDrag.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [penActive, clientToVirtual, getScale])

  /* Pen — Enter commits the open path, Escape cancels the draft. Capture
   * phase so we beat the compose-level deselect handler. */
  useEffect(() => {
    if (!penActive) return
    const onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); e.stopPropagation()
        finishPath(penRef.current?.nodes, false)
      } else if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation()
        setPen(null); penDrag.current = null; setTool('select')
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [penActive, finishPath, setTool])

  /* Switching away from the pen mid-draft commits whatever's drawn. */
  useEffect(() => {
    if (tool !== 'pen' && penRef.current) finishPath(penRef.current.nodes, false)
  }, [tool, finishPath])

  /* Exit node-edit / crop when their layer is no longer selected (deselect /
   * marquee / selecting another layer all route through selectedIds). */
  useEffect(() => {
    if (nodeEditId && !selectedIds.includes(nodeEditId)) setNodeEditId(null)
  }, [nodeEditId, selectedIds])
  useEffect(() => {
    if (cropId && !selectedIds.includes(cropId)) setCropId(null)
  }, [cropId, selectedIds])
  useEffect(() => {
    if (kineticEdit && !selectedIds.includes(kineticEdit.id)) setKineticEdit(null)
  }, [kineticEdit, selectedIds])
  useEffect(() => {
    if (softformsEdit && !selectedIds.includes(softformsEdit.id)) setSoftformsEdit(null)
  }, [softformsEdit, selectedIds])

  /* Switching to any create/draw tool exits crop / node-edit / kinetic
   * element-edit — otherwise the mode overlay's full-frame surface
   * (pointerEvents: auto) swallows the create mousedown and dragging a shape
   * pans/moves the mode target instead. Keyed on `tool` alone so entering a
   * mode never bounces straight back out. */
  useEffect(() => {
    if (tool === 'select' || tool === 'zoom') return
    setCropId(null)
    setNodeEditId(null)
    setKineticEdit(null)
    setSoftformsEdit(null)
  }, [tool])

  /* KineticPanel's "Edit on canvas" routes here (the kol:enter-crop idiom) —
   * CanvasArea owns element-edit mode state. Same-layer dispatch toggles the
   * mode off; a different kinetic layer switches the mode over. */
  useEffect(() => {
    const onKineticEdit = (e) => {
      const { id, index } = e.detail || {}
      if (kineticEdit?.id === id) { setKineticEdit(null); return }
      const layer = layers.find((l) => l.id === id && l.type === 'kinetic' && !l.locked)
      if (!layer) return
      select(id)
      setKineticEdit({ id, index: index ?? 0 })
    }
    window.addEventListener('kol:kinetic-edit', onKineticEdit)
    return () => window.removeEventListener('kol:kinetic-edit', onKineticEdit)
  }, [layers, kineticEdit, select])

  /* SoftformsLayers' "Edit forms on canvas" routes here (same idiom as
   * kol:kinetic-edit) — CanvasArea owns form-edit mode state. Same-layer
   * dispatch toggles it off; a different softforms layer switches it over.
   * 2D only — the 3D loop uses its orbit-camera drag, not SDF handles. */
  useEffect(() => {
    const onSoftformEdit = (e) => {
      const { id, index } = e.detail || {}
      if (softformsEdit?.id === id) { setSoftformsEdit(null); return }
      const layer = layers.find((l) => l.id === id && l.type === 'loop' && l.loopId === 'softforms' && !l.locked)
      if (!layer) return
      select(id)
      setSoftformsEdit({ id, index: index ?? 0 })
    }
    window.addEventListener('kol:softform-edit', onSoftformEdit)
    return () => window.removeEventListener('kol:softform-edit', onSoftformEdit)
  }, [layers, softformsEdit, select])

  /* Inspector's crop button routes here (same CustomEvent idiom as
   * kol:show-shortcuts) — CanvasArea owns crop-mode state. */
  useEffect(() => {
    const onCropEvent = (e) => {
      const layer = layers.find((l) => l.id === e.detail && l.type === 'photo' && !l.locked)
      if (layer) enterCrop(layer)
    }
    window.addEventListener('kol:enter-crop', onCropEvent)
    return () => window.removeEventListener('kol:enter-crop', onCropEvent)
  }, [layers, enterCrop])

  /* A file dropped ANYWHERE but the stage used to navigate the tab to the file — the browser's
   * default for an unhandled drop — which is how an uploaded image got lost (audit B7 → F1, the
   * user's 25 → 24). While the editor is mounted the window takes every file drag: dragover
   * prevented so the pointer says copy, and a drop off the stage lands the file at the frame's
   * centre. The stage's own onDrop runs first (React's root) and has already prevented, so this
   * is a no-op there. */
  useEffect(() => {
    const over = (e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault() }
    const drop = (e) => {
      if (e.defaultPrevented) return
      const file = e.dataTransfer?.files && [...e.dataTransfer.files].find((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
      e.preventDefault()
      if (!file) return
      const r = stageRef.current?.getBoundingClientRect()
      if (r) addDroppedFile(file, r.left + r.width / 2, r.top + r.height / 2)
    }
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    return () => { window.removeEventListener('dragover', over); window.removeEventListener('drop', drop) }
  }, [addDroppedFile])

  /* A press on the grey viewport AROUND the frame deselects, the same as a press on empty canvas
   * inside it (audit B1, the user's 22: the only way to clear a selection was the Layers panel).
   * The stage's own mousedown owns everything inside the frame; this catches the rest of the
   * viewport pane and nothing else — not the rails, not a context menu, not an overlay. */
  /* …except a press on the frame's EDGE, which selects the canvas (the user's 1, Figma's frame
   * title/edge): a band FRAME_EDGE px wide just outside the frame, outlined accent on hover. */
  const [edgeHover, setEdgeHover] = useState(false)
  useEffect(() => {
    const onEdge = (e) => {
      const r = stageRef.current?.getBoundingClientRect()
      if (!r) return false
      const out = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
      return out && e.clientX > r.left - FRAME_EDGE && e.clientX < r.right + FRAME_EDGE
        && e.clientY > r.top - FRAME_EDGE && e.clientY < r.bottom + FRAME_EDGE
    }
    const inPane = (e) => {
      const pane = e.target.closest?.('main.kol-editor-canvas')
      if (!pane || stageRef.current?.contains(e.target)) return false
      return !e.target.closest('[data-kol-ctxmenu], .kol-popover, .kol-overlay-scrim, button, input')
    }
    const down = (e) => {
      if (e.button !== 0 || tool !== 'select' || !inPane(e)) return
      if (onEdge(e)) selectCanvas()
      else select(null)
    }
    const move = (e) => setEdgeHover(tool === 'select' && inPane(e) && onEdge(e))
    document.addEventListener('pointerdown', down)
    document.addEventListener('pointermove', move)
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('pointermove', move) }
  }, [tool, select, selectCanvas])

  /* CROP MODE HAS TO LOOK LIKE A MODE (audit B4, the user's 27 "crop image tool doesn't do
   * anything"): a cover-fit photo fills its frame exactly, so the crop window coincides with the
   * selection box, dragging inside has nowhere to pan, and nothing visibly happens. Two things fix
   * that: the wheel over the frame scales the image about the pointer (never below cover fit, so
   * the frame is always full), and a chip names the mode and its gestures (rendered beside the
   * overlay below). Native listener because React's wheel is passive. */
  useEffect(() => {
    if (!cropId) return undefined
    const el = stageRef.current
    if (!el) return undefined
    const wheel = (e) => {
      const layer = layers.find((l) => l.id === cropId)
      if (!layer || layer.imgW == null) return
      e.preventDefault(); e.stopPropagation()
      const k = Math.exp(-e.deltaY * 0.002)
      const minK = Math.max(layer.w / layer.imgW, layer.h / layer.imgH) /* cover fit floor */
      const kk = Math.max(minK, k)
      const { vx, vy } = clientToVirtual(e.clientX, e.clientY)
      const px = vx - layer.x - layer.imgX, py = vy - layer.y - layer.imgY  /* pointer in image px */
      const imgW = layer.imgW * kk, imgH = layer.imgH * kk
      let imgX = layer.imgX - px * (kk - 1), imgY = layer.imgY - py * (kk - 1)
      imgX = Math.min(0, Math.max(layer.w - imgW, imgX)); imgY = Math.min(0, Math.max(layer.h - imgH, imgY))
      updateLayer(cropId, { imgW, imgH, imgX, imgY })
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [cropId, layers, clientToVirtual, updateLayer])

  /* Enter node-edit on a path. Live `rotation` is BAKED into the node
   * geometry first (rotate about the box center, renormalize, zero the
   * prop) — node editing always operates on rotation-free geometry, same
   * philosophy as flip-baking. One discrete history entry for the bake. */
  const enterNodeEdit = useCallback((layer) => {
    const rot = typeof layer.rotation === 'number' ? layer.rotation : 0
    if (rot && Array.isArray(layer.nodes)) {
      const cx = (layer.w ?? 0) / 2
      const cy = (layer.h ?? 0) / 2
      const norm = normalizePathRings(
        rotatePathNodes(layer.nodes, rot, cx, cy),
        layer.holes?.map((r) => rotatePathNodes(r, rot, cx, cy)),
      )
      updateLayer(layer.id, {
        nodes: norm.nodes, holes: norm.holes,
        x: layer.x + norm.dx, y: layer.y + norm.dy,
        w: norm.w, h: norm.h,
        rotation: 0,
      })
    }
    select(layer.id)
    setNodeEditId(layer.id)
  }, [select, updateLayer])

  /* DIRECT SELECTION ON EVERY SHAPE (the user's 3 and 6; spec gap "Expand shape"): A, the
   * toolbar's Node select and a double-click node-edit a path — and a primitive is converted to a
   * path first, silently, as Figma does. The conversion lands next render, so the node-edit waits
   * for the layer to come back a path. */
  const [pendingNodeEdit, setPendingNodeEdit] = useState(null)
  /* HAND: a drag pans the viewport. The DS viewport pans on a plain wheel, so the drag is fed to
   * it as wheel deltas — no second copy of its pan state. */
  const [handDragging, setHandDragging] = useState(false)
  const onHandDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    const target = stageRef.current
    let lx = e.clientX, ly = e.clientY
    setHandDragging(true)
    const move = (ev) => {
      const dx = ev.clientX - lx, dy = ev.clientY - ly
      lx = ev.clientX; ly = ev.clientY
      target?.dispatchEvent(new WheelEvent('wheel', { deltaX: -dx, deltaY: -dy, clientX: ev.clientX, clientY: ev.clientY, bubbles: true, cancelable: true }))
    }
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); setHandDragging(false) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }
  /* the Pen over a selected path's segment shows the add-anchor cursor (G1) */
  const [penAddHover, setPenAddHover] = useState(false)
  useEffect(() => {
    if (tool !== 'pen') { setPenAddHover(false); return }
    const move = (e) => {
      if (penRef.current?.nodes?.length) { setPenAddHover(false); return }
      if (!stageRef.current?.contains(e.target)) { setPenAddHover(false); return }
      const { vx, vy } = clientToVirtual(e.clientX, e.clientY)
      setPenAddHover(!!segmentHit(selectedLayer, vx, vy, 8 / getScale()))
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [tool, selectedLayer, clientToVirtual, getScale])
  /* preview / work display (W) — see the keymap entry */
  const [preview, setPreview] = useState(false)
  /* RIGHT-CLICK ON A LAYER ROW opens this same menu (the user's 23; the DS LayerStack has no
   * onContextMenu — plan 17 #1 — so the Layers pane forwards the event). */
  useEffect(() => {
    const on = (e) => {
      const { id, x, y } = e.detail ?? {}
      if (!id) return
      if (!selectedIds.includes(id)) select(id)
      ctxMenu.openAt({ clientX: x, clientY: y, preventDefault() {}, stopPropagation() {} }, id)
    }
    window.addEventListener('kol:layer-context', on)
    return () => window.removeEventListener('kol:layer-context', on)
  }, [selectedIds, select, ctxMenu])
  /* MASK OPS (G8) — the layer directly below a top-level layer, and the two writes */
  const layerBelow = useCallback((id) => {
    const i = layers.findIndex((l) => l.id === id)
    return i > 0 ? layers[i - 1] : null
  }, [layers])
  const useAsMask = useCallback((id) => {
    const below = layerBelow(id)
    if (!below) return
    beginTransaction()
    updateLayer(id, { isMask: true })
    updateLayer(below.id, { maskedBy: id })
    commitTransaction()
  }, [layerBelow, updateLayer, beginTransaction, commitTransaction])
  const releaseMask = useCallback((id) => {
    beginTransaction()
    updateLayer(id, { isMask: false })
    layers.filter((l) => l.maskedBy === id).forEach((l) => updateLayer(l.id, { maskedBy: null }))
    commitTransaction()
  }, [layers, updateLayer, beginTransaction, commitTransaction])
  /* ⌥ with the Zoom tool shows zoom-out (spec R8.2) */
  const [altHeld, setAltHeld] = useState(false)
  useEffect(() => {
    if (tool !== 'zoom') return
    const on = (e) => setAltHeld(e.altKey)
    window.addEventListener('keydown', on)
    window.addEventListener('keyup', on)
    return () => { window.removeEventListener('keydown', on); window.removeEventListener('keyup', on); setAltHeld(false) }
  }, [tool])
  useEffect(() => {
    if (!pendingNodeEdit) return
    const l = findLayerDeep(layers, pendingNodeEdit)
    if (l?.type === 'path') { setPendingNodeEdit(null); enterNodeEdit(l) }
  }, [layers, pendingNodeEdit]) // eslint-disable-line react-hooks/exhaustive-deps
  const directSelect = useCallback((layer) => {
    if (!layer || layer.locked) return
    if (layer.type === 'path') { setTool('select'); enterNodeEdit(layer); return }
    if (layer.type === 'shape' && CONVERTIBLE_KINDS.has(layer.kind)) {
      setTool('select')
      convertShapeToPath(layer.id)
      setPendingNodeEdit(layer.id)
    }
  }, [setTool, convertShapeToPath, enterNodeEdit])
  useEffect(() => {
    const on = () => directSelect(selectedLayer)
    window.addEventListener('kol:node-edit', on)
    return () => window.removeEventListener('kol:node-edit', on)
  })

  /* Double-click with the Select tool → node-edit (paths) or crop (photos). */
  const onStageDoubleClick = useCallback((e) => {
    if (tool !== 'select') return
    const layerEl = e.target.closest('[data-layer-id]')
    if (!layerEl) return
    const id = layerEl.getAttribute('data-layer-id')
    const layer = layers.find((l) => l.id === id)
    if (layer?.type === 'path' || (layer?.type === 'shape' && CONVERTIBLE_KINDS.has(layer.kind))) {
      e.preventDefault()
      directSelect(layer)
    } else if (layer?.type === 'photo' && !layer.locked) {
      e.preventDefault()
      enterCrop(layer)
    }
  }, [tool, layers, directSelect, enterCrop])

  /* Live pen-preview path: the committed segments plus a rubber-band cubic
   * from the last anchor (honoring its out-handle) to the cursor. */
  const penPreviewD = useMemo(() => {
    if (!pen || pen.nodes.length === 0) return ''
    let d = pathD(pen.nodes, false)
    if (pen.cursor) {
      const last = pen.nodes[pen.nodes.length - 1]
      const c1 = last.out ?? last
      d += ` C ${c1.x} ${c1.y} ${pen.cursor.x} ${pen.cursor.y} ${pen.cursor.x} ${pen.cursor.y}`
    }
    return d
  }, [pen])

  const nodeEditLayer = nodeEditId
    ? (layers.find((l) => l.id === nodeEditId && l.type === 'path') ?? null)
    : null

  const cropLayer = cropId
    ? (layers.find((l) => l.id === cropId && l.type === 'photo' && l.imgW != null) ?? null)
    : null

  const kineticEditLayer = kineticEdit
    ? (layers.find((l) => l.id === kineticEdit.id && l.type === 'kinetic') ?? null)
    : null

  const softformsEditLayer = softformsEdit
    ? (layers.find((l) => l.id === softformsEdit.id && l.type === 'loop' && l.loopId === 'softforms') ?? null)
    : null

  /* Commit a marquee-drag — find every layer whose AABB intersects the
   * marquee rect and select them. Tiny drags (≤ 4 vpx in either axis) fall
   * through as a plain click-deselect (or no-op when shift-additive). */
  const commitMarqueeDrag = useCallback((d) => {
    if (d.mode !== 'marquee') return
    if (d.vw < 4 && d.vh < 4) {
      if (!d.additive) select(null)
      return
    }
    const matched = layers
      .filter((l) => typeof l.x === 'number' && typeof l.y === 'number')
      /* Hidden / locked layers can't be marquee-selected — matching what a
       * direct click can reach (invisible layers render nothing; locked
       * layers shouldn't join a bulk move/delete by accident). */
      .filter((l) => l.visible !== false && l.locked !== true)
      .filter((l) => {
        const lw = l.w ?? 0
        const lh = l.h ?? 0
        return l.x < d.vx + d.vw && l.x + lw > d.vx && l.y < d.vy + d.vh && l.y + lh > d.vy
      })
      .map((l) => l.id)
    selectMany(matched, { additive: d.additive })
  }, [layers, select, selectMany])

  /* Commit a create-drag — instantiate the matching layer at the dragged
   * bounds and revert to the Select tool. Tiny drags (likely a mis-click)
   * fall through to a default-sized insert at the click point. */
  const commitCreateDrag = useCallback((d) => {
    if (d.mode !== 'create') return
    const tooSmall = d.vw < 8 || d.vh < 8
    let x = Math.max(0, Math.min(CANVAS_W - 8, d.vx))
    let y = Math.max(0, Math.min(viewH - 8, d.vy))
    let w = d.vw
    let h = d.vh
    if (tooSmall) {
      /* Default sizes per tool when the user just clicks. */
      const defaults = {
        text:     { w: 600, h: 120 },
        rect:     { w: 240, h: 240 },
        ellipse:  { w: 240, h: 240 },
        triangle: { w: 240, h: 240 },
        polygon:  { w: 240, h: 240 },
        star:     { w: 240, h: 240 },
        pattern:  { w: CANVAS_W, h: viewH },
      }
      const def = defaults[d.tool] ?? { w: 200, h: 200 }
      w = def.w; h = def.h
      x = Math.max(0, Math.min(CANVAS_W - w, d.startVX - w / 2))
      y = Math.max(0, Math.min(viewH - h, d.startVY - h / 2))
    }

    const extras = { x, y, w, h }
    switch (d.tool) {
      case 'text':     addLayer('text',    { ...extras, editOnMount: true }); break /* opens editing with the caret in it (audit B3) */
      case 'rect':     addLayer('shape',   { ...extras, kind: 'rect',     color: 'palette:dark' }); break
      case 'ellipse':  addLayer('shape',   { ...extras, kind: 'ellipse',  color: 'palette:dark' }); break
      case 'triangle': addLayer('shape',   { ...extras, kind: 'triangle', color: 'palette:dark' }); break
      /* line is pen-tool only — never reaches commitCreateDrag (the
       * tool === 'line' branch in onStageMouseDown short-circuits). */
      case 'polygon':  addLayer('shape',   { ...extras, kind: 'polygon',  sides: 5, color: 'palette:dark' }); break
      case 'star':     addLayer('shape',   { ...extras, kind: 'star',     points: 5, innerRatio: 0.5, color: 'palette:dark' }); break
      case 'pattern':  addLayer('pattern', extras); break
      default: return
    }
    setTool('select')
  }, [addLayer, setTool, viewH])

  /* Click-away to deselect.
   *
   *  - When 'canvas' is selected and the click is INSIDE the Layers panel
   *    (`[data-layer-stack]`) but NOT on the Canvas row, deselect. Lets the
   *    user click empty space in the layer stack to drop canvas selection.
   *    Inspector / color wheel / opacity slider / rails outside the stack
   *    keep the selection so canvas properties can be edited.
   *  - Otherwise (regular layer selected), clicks inside any layer row, the
   *    canvas surface, or either rail are kept. Clicks elsewhere deselect. */
  useEffect(() => {
    const onDocDown = (e) => {
      if (e.button !== 0) return

      if (selectedIds.includes('canvas')) {
        const insideStack = e.target.closest?.('[data-layer-stack]')
        if (insideStack) {
          const onCanvasRow  = e.target.closest?.('[data-layer-id="canvas"]')
          const onAnyRow     = e.target.closest?.('.kol-compose-layer-row')
          const onButton     = e.target.closest?.('button')
          /* Buttons inside the stack (Add layer [+], Trash, Group, lock/eye)
           * never deselect canvas on click — they perform actions on the
           * current selection or open menus. The [+] dropdown then commits
           * a new layer via addLayer which replaces selection naturally. */
          if (!onCanvasRow && !onAnyRow && !onButton) select(null)
          return
        }
        /* outside the stack: fall through to default rules — keep selection
         * for inspector / wheel / canvas / rails */
      }

      /* Single attr check — anything inside the editor shell keeps
       * selection. New rails / panels are covered automatically by being
       * mounted inside `<EditorShell data-editor-keep-selection>`. */
      if (e.target.closest?.('[data-editor-keep-selection]')) return
      select(null)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [select, selectedIds])

  /* Keyboard handler — dispatches matched shortcuts from `state/keymap.js`.
   * Skips when typing into an input. */
  useEffect(() => {
    const layerOnlyIds = () => selectedIds.filter((id) => id !== 'canvas')

    const onKey = (e) => {
      if (isTyping(e)) return

      /* Layer opacity digits (Photoshop convention): 1-9 = 10-90%, 0 = 100%,
       * 0 twice within 500ms = 0%. Handled before keymap matching — combos
       * can't express ranges or the double-tap chord. */
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && /^[0-9]$/.test(e.key) && selectedLayer && !selectedLayer.locked) {
        e.preventDefault()
        const digit = Number(e.key)
        const now = performance.now()
        let v
        if (digit === 0) {
          v = zeroTapRef.current != null && now - zeroTapRef.current < 500 ? 0 : 1
          zeroTapRef.current = now
        } else {
          v = digit / 10
          zeroTapRef.current = null
        }
        updateLayer(selectedLayer.id, { opacity: v })
        return
      }

      /* the editor's answer only — `R` is the rectangle here, Reset in labs and the randomiser */
      const shortcut = matchAny(e, undefined, 'editor')
      if (!shortcut) return

      const layer = selectedLayer

      switch (shortcut.id) {
        /* undo / redo / deselect are handled by useGlobalShortcuts at the
         * Editor.jsx level so they work in every mode. Don't double-handle
         * here. */
        case 'undo':
        case 'redo':
        case 'redo-alt':
        case 'deselect':
          return

        case 'duplicate':   if (layer && !layer.locked) { e.preventDefault(); duplicateLayer(layer.id) }; return

        case 'delete-back':
        case 'delete-fwd': {
          /* Canvas selection implicitly includes every top-level layer —
           * deleting here would nuke the whole composition. Same guard as
           * the inspector's trash button. */
          if (selectedIds.includes('canvas')) return
          /* Locked layers survive a keyboard delete. Deep lookup so a
           * locked group child is protected too. */
          const ids = layerOnlyIds()
          const deletable = ids.filter((id) => !findLayerDeep(layers, id)?.locked)
          if (deletable.length === 0) return
          e.preventDefault()
          if (deletable.length === ids.length) { deleteSelected(); return }
          beginTransaction()
          deletable.forEach(removeLayer)
          commitTransaction()
          return
        }

        case 'group': {
          const ids = layerOnlyIds()
          if (ids.length >= 2) { e.preventDefault(); groupLayers(ids) }
          return
        }
        case 'ungroup': {
          if (layer && layer.type === 'group') { e.preventDefault(); ungroupLayer(layer.id) }
          return
        }

        case 'toggle-rulers':     e.preventDefault(); toggleRulers(); return
        case 'view-preview':      e.preventDefault(); setPreview((v) => !v); return
        /* ⌘A — every top-level layer that is neither hidden nor locked (Figma's select all) */
        case 'select-all':
          e.preventDefault()
          selectMany(layers.filter((l) => l.visible !== false && !l.locked && !COVER_TYPES.includes(l.type)).map((l) => l.id))
          return
        case 'convert-path':
          e.preventDefault()
          if (selectedLayer?.locked) return
          if (selectedLayer?.type === 'bool') flattenSelected()
          else if (selectedLayer?.type === 'shape' && CONVERTIBLE_KINDS.has(selectedLayer.kind)) convertShapeToPath(selectedLayer.id)
          return
        case 'toggle-lock':       if (layer) { e.preventDefault(); toggleLayerLock(layer.id) }; return
        case 'toggle-visibility': if (layer) { e.preventDefault(); toggleLayer(layer.id) }; return

        case 'flip-h':
        case 'flip-v': {
          if (layerOnlyIds().length === 0) return
          e.preventDefault()
          flipSelected(shortcut.id === 'flip-h' ? 'h' : 'v')
          return
        }

        case 'nudge-left':
        case 'nudge-right':
        case 'nudge-up':
        case 'nudge-down':
        case 'nudge-left-10':
        case 'nudge-right-10':
        case 'nudge-up-10':
        case 'nudge-down-10': {
          if (!layer || !isPositionedSel || layer.locked) return
          e.preventDefault()
          const step = shortcut.id.endsWith('-10') ? 10 : 1
          const axis = shortcut.id.includes('left') ? [-1, 0]
                     : shortcut.id.includes('right') ? [1, 0]
                     : shortcut.id.includes('up') ? [0, -1]
                     : [0, 1]
          nudgeEdit.patch({ x: layer.x + axis[0] * step, y: layer.y + axis[1] * step })
          return
        }

        case 'show-shortcuts':
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('kol:show-shortcuts'))
          return

        case 'eyedrop': /* `I` — the Colour panel samples the canvas into the focused paint (ColourPanel listens) */
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('kol:eyedrop'))
          return

        case 'toggle-dots':
          e.preventDefault()
          toggleDots()
          return

        case 'tool-select':  e.preventDefault(); setNodeEditId(null); setTool('select'); return
        /* A = direct-select: drop into node-edit on the selected path. */
        case 'node-edit': {
          e.preventDefault()
          directSelect(selectedLayer)
          return
        }
        case 'tool-text':    e.preventDefault(); setTool('text');    return
        case 'tool-pen':     e.preventDefault(); setTool('pen');     return
        case 'tool-rect':    e.preventDefault(); setTool('rect');    return
        case 'tool-ellipse': e.preventDefault(); setTool('ellipse'); return
        case 'tool-pattern': e.preventDefault(); setTool('pattern'); return
        case 'tool-zoom':    e.preventDefault(); setTool('zoom');    return
        case 'tool-orbit':   e.preventDefault(); setTool('orbit');   return

        /* Color shortcuts always fire — no selection-dependent gates.
         * SwatchStack is canonical app-level state; writes propagate to
         * selection when applicable but never depend on it. */
        case 'paint-default': {
          e.preventDefault()
          beginTransaction()
          colorTarget.setFill('#FFFFFF')
          colorTarget.setStroke('#000000')
          commitTransaction()
          return
        }
        case 'paint-toggle': {
          e.preventDefault()
          colorTarget.swap()
          return
        }
        case 'paint-swap': {
          e.preventDefault()
          const f = colorTarget.fillRaw
          const s = colorTarget.strokeRaw
          beginTransaction()
          colorTarget.setFill(s)
          colorTarget.setStroke(f)
          commitTransaction()
          return
        }
        case 'paint-clear': {
          e.preventDefault()
          colorTarget.onChange(null)
          return
        }

        default: return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    selectedLayer, selectedIds, isPositionedSel, layers,
    select, removeLayer, deleteSelected, updateLayer, nudgeEdit, duplicateLayer, toggleLayer, toggleLayerLock,
    flipSelected, enterNodeEdit, directSelect, flattenSelected, convertShapeToPath, selectMany,
    groupLayers, ungroupLayer,
    colorTarget, beginTransaction, commitTransaction,
    undo, redo, canUndo, canRedo, setTool,
  ])

  if (view === 'social') {
    /* Multi-aspect preview — same composition rendered at 1:1 / 4:5 / 9:16
     * side by side. Read-only: drag/resize/select live in single view.
     * Each frame has its own letterbox; they share width by flex-1. */
    return (
      <div className="w-full h-full p-4 flex items-center justify-center gap-3 overflow-auto">
        {SOCIAL_ASPECTS.map((a) => (
          <div key={a} className="flex-1 min-w-0 h-full">
            <Canvas aspect={a} bgColor={bgColor ?? undefined}>
              <div className="relative w-full h-full">
                {visibleLayers.map((layer) => (
                  <LayerRenderer key={layer.id} layer={layer} palette={palette} />
                ))}
              </div>
            </Canvas>
          </div>
        ))}
      </div>
    )
  }

  /* Tool cursor lives on the OUTER wrapper so it covers the dark backdrop
   * around the canvas frame too — not just the bright frame area. Layers
   * inherit via the kol-editor.css rule
   * `[data-tool]:not([data-tool="select"]) [data-layer-id]`, which
   * overrides their inline `cursor: 'move'`. Cursor is an inherited CSS
   * property, so the stage and its descendants pick up the wrapper's
   * declaration without a redundant inline style. */
  /* the pen over its first anchor (≥2 nodes, inside the 10px close radius): the ○ badge says the
     click closes the path (the user's 5) */
  const penCloses = tool === 'pen' && pen?.nodes?.length >= 2 && pen.cursor
    && dist(pen.cursor.x, pen.cursor.y, pen.nodes[0].x, pen.nodes[0].y) * getScale() < 10
  const wrapperCursor =
    drag?.mode === 'move' || handDragging ? 'grabbing'
      : penCloses ? CURSORS.penClose
      : penAddHover ? CURSORS.penAdd
      : tool === 'zoom' && altHeld ? 'zoom-out'
      : tool !== 'select'  ? (CURSOR_FOR_TOOL[tool] ?? 'crosshair')
      : 'default'
  return (
    <div
      className="relative w-full h-full"
      data-view-mode={preview ? 'preview' : undefined}
      style={{ cursor: wrapperCursor, background: infiniteColor, '--kol-cursor-rotate': CURSORS.rotate }}
      /* Zoom tool — click zooms in at the pointer, Alt+click zooms out.
       * Lives on the wrapper so the dark backdrop zooms too; the viewport
       * (PanZoomViewport) applies it via the kol:zoom-at event. */
      onMouseDown={tool === 'zoom' ? (e) => {
        if (e.button !== 0 || e.target.closest('button')) return
        window.dispatchEvent(new CustomEvent('kol:zoom-at', {
          detail: { clientX: e.clientX, clientY: e.clientY, factor: e.altKey ? 0.5 : 2 },
        }))
      } : tool === 'hand' ? onHandDown : undefined}
      /* Right-click → the selection-aware context menu (T7 2026-08-12).
       * The system menu is suppressed over the canvas area ONLY — the rails
       * and menus keep the browser default. A layer under the cursor gets
       * selected first (Figma behavior); empty canvas gets the global ops. */
      onContextMenu={(e) => {
        e.preventDefault()
        const hit = e.target.closest?.('[data-layer-id]')
        const layerId = hit?.dataset?.layerId ?? null
        if (layerId && !selectedIds.includes(layerId)) select(layerId)
        ctxMenu.openAt(e, layerId)
      }}
    >
      <Canvas
        aspect={aspect}
        customRatio={canvasRatio}
        bgColor={bgColor ?? undefined}
        showGrid={showGrid && !preview}
        showRulers={showRulers && !preview}
        /* Ruler guides render at the viewport level (full-viewport span,
         * Figma behavior) — state stays here in compose; the shell viewport
         * gets it as props, same threading as showGrid/showRulers. */
        guides={preview ? NO_GUIDES : guides}
        setGuides={setGuides}
        guidesInteractive={tool === 'select' && !drag}
        panEnabled
      >
        <ZoomProbe />
        <div
          ref={stageRef}
          data-tool={tool}
          className="relative w-full h-full"
          onMouseDown={onStageMouseDown}
          onDoubleClick={onStageDoubleClick}
          onDragOver={(e) => {
            /* Accept both the app's own library drags AND native OS file drags
             * (types includes 'Files'). */
            const types = e.dataTransfer.types
            if (types.includes('application/x-kol-library') || types.includes('Files')) {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }
          }}
          onDrop={(e) => {
            /* Internal library payload wins — the app's own drag. */
            const raw = e.dataTransfer.getData('application/x-kol-library')
            if (raw) {
              e.preventDefault()
              try {
                const { slot, item } = JSON.parse(raw)
                const at = clientToVirtual(e.clientX, e.clientY)
                insertFromLibrary(slot, item, at)
              } catch { /* malformed payload: ignore */ }
              return
            }
            /* Native OS file drop → a photo layer at the drop point. Read files
             * + coords synchronously (the event is recycled after handling). */
            const file = e.dataTransfer.files && [...e.dataTransfer.files]
              .find((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
            if (!file) return
            e.preventDefault()
            addDroppedFile(file, e.clientX, e.clientY)
          }}
        >
          {visibleLayers.map((layer) => (
            <LayerRenderer key={layer.id} layer={layer} palette={palette} />
          ))}
          {selectedPositionedLayers.map((l) => (
            /* The path being node-edited / photo being cropped / kinetic
             * layer in element-edit swaps its box chrome for the mode
             * overlay; paths never get resize handles (edit via nodes). */
            nodeEditId === l.id || cropId === l.id || kineticEdit?.id === l.id || softformsEdit?.id === l.id ? null : (
              <SelectionOverlay
                key={l.id}
                box={l}
                showHandles={!isMultiSel}
                showRotate={!isMultiSel}
                showLabel={!isMultiSel}
              />
            )
          ))}
          {cropLayer && (
            <>
              <CropOverlay
                layer={cropLayer}
                toVirtual={clientToVirtual}
                updateLayer={updateLayer}
                beginTransaction={beginTransaction}
                commitTransaction={commitTransaction}
                onExit={() => setCropId(null)}
              />
              {/* the mode chip — crop is invisible otherwise on a cover-fit photo (audit B4) */}
              <div className="kol-helper-10 text-emphasis bg-surface-secondary border border-oq-08 rounded px-2 py-1 pointer-events-none select-none" style={{ position: 'absolute', left: cropLayer.x, top: Math.max(0, cropLayer.y - 28), transform: `scale(${1 / getScale()})`, transformOrigin: 'left bottom', whiteSpace: 'nowrap' }}>
                Crop · drag to pan · scroll to zoom · handles crop · ⏎ done · esc
              </div>
            </>
          )}
          {kineticEditLayer && (
            <KineticElementOverlay
              layer={kineticEditLayer}
              initialIndex={kineticEdit.index}
              toVirtual={clientToVirtual}
              updateLayer={updateLayer}
              beginTransaction={beginTransaction}
              commitTransaction={commitTransaction}
              onExit={() => setKineticEdit(null)}
            />
          )}
          {softformsEditLayer && (
            <SoftformsHandleOverlay
              layer={softformsEditLayer}
              toVirtual={clientToVirtual}
              updateLayer={updateLayer}
              beginTransaction={beginTransaction}
              commitTransaction={commitTransaction}
              onExit={() => setSoftformsEdit(null)}
            />
          )}
          {nodeEditLayer && (
            <PathNodeOverlay
              layer={nodeEditLayer}
              viewW={CANVAS_VIRTUAL_W}
              viewH={viewH}
              toVirtual={clientToVirtual}
              updateLayer={updateLayer}
              beginTransaction={beginTransaction}
              commitTransaction={commitTransaction}
              onExit={() => setNodeEditId(null)}
            />
          )}
          {/* the frame-edge band is live: the frame outlines accent, a press selects the canvas */}
          {edgeHover && (
            <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ outline: '1px solid var(--kol-accent-primary)', zIndex: 5 }} />
          )}
          {pen && (
            <svg
              width="100%" height="100%"
              viewBox={`0 0 ${CANVAS_VIRTUAL_W} ${viewH}`}
              preserveAspectRatio="none"
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 'calc(var(--kol-z-overlay) + 1)' }} /* one above the edit overlays (audit E4) */
            >
              <path
                d={penPreviewD}
                fill="none"
                stroke="var(--kol-accent-primary)"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pen.nodes.map((n, i) => (
                <rect
                  key={i}
                  x={n.x - 4} y={n.y - 4} width={8} height={8}
                  fill={i === 0 ? 'var(--kol-accent-primary)' : 'white'}
                  stroke="var(--kol-accent-primary)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          )}
          {drag?.mode === 'create' && drag.vw > 0 && drag.vh > 0 && (
            <div
              style={{
                position: 'absolute',
                left: drag.vx, top: drag.vy,
                width: drag.vw, height: drag.vh,
                outline: '1px dashed var(--kol-accent-primary)',
                pointerEvents: 'none',
                background: 'color-mix(in srgb, var(--kol-accent-primary) 12%, transparent)',
              }}
            />
          )}
          {drag?.mode === 'marquee' && drag.vw > 0 && drag.vh > 0 && (
            <div
              style={{
                position: 'absolute',
                left: drag.vx, top: drag.vy,
                width: drag.vw, height: drag.vh,
                outline: '1px solid var(--kol-accent-primary)',
                pointerEvents: 'none',
                background: 'color-mix(in srgb, var(--kol-accent-primary) 8%, transparent)',
              }}
            />
          )}
          {linePlacement && linePreview && (
            <svg
              width="100%" height="100%"
              viewBox={`0 0 ${CANVAS_VIRTUAL_W} ${viewH}`}
              preserveAspectRatio="none"
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            >
              <line
                x1={linePlacement.x1} y1={linePlacement.y1}
                x2={linePreview.vx}   y2={linePreview.vy}
                stroke="var(--kol-accent-primary)"
                strokeWidth={2}
                strokeDasharray="6 4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={linePlacement.x1} cy={linePlacement.y1} r="4" fill="var(--kol-accent-primary)" />
            </svg>
          )}
          {snapGuides?.h != null && (
            <div
              style={{
                position: 'absolute',
                left: snapGuides.h, top: 0,
                width: 1, height: '100%',
                background: SNAP_GUIDE_COLOR,
                pointerEvents: 'none',
              }}
            />
          )}
          {snapGuides?.v != null && (
            <div
              style={{
                position: 'absolute',
                left: 0, top: snapGuides.v,
                width: '100%', height: 1,
                background: SNAP_GUIDE_COLOR,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </Canvas>
      <ContextMenu menu={ctxMenu}>
        {(layerId) => (
          <CanvasMenuItems
            layer={layerId ? findLayerDeep(layers, layerId) : null}
            onClose={ctxMenu.close}
            ops={{
              select, duplicateLayer, removeLayer, toggleLayer, toggleLayerLock, updateLayer,
              flattenSelected, releaseBoolean, flattenText, enterCrop, convertShapeToPath,
              useAsMask, releaseMask, layerBelow,
              undo, redo, canUndo, canRedo,
            }}
          />
        )}
      </ContextMenu>
    </div>
  )
}

/* ── right-click context menu (T7 2026-08-12; onto the DS `ContextMenu` 2026-10-09, audit E5) ──
 * Selection-aware ops for the layer under the cursor; global undo/redo on empty canvas. The
 * positioning, the click-away, Escape and the chrome are the DS popover's — this is the ROWS. */
function CanvasMenuItems({ layer, onClose, ops }) {
  const modal = useModal()
  const run = (fn) => () => { onClose(); fn() }
  const open = (event, detail) => () => { onClose(); window.dispatchEvent(new CustomEvent(event, detail !== undefined ? { detail } : undefined)) }

  const items = []
  if (layer) {
    const t = layer.type
    if (t === 'text') {
      items.push({ label: 'Morph…', act: () => {
        onClose()
        window.dispatchEvent(new CustomEvent('kol:open-params'))
        window.dispatchEvent(new CustomEvent('kol:params-subtab', { detail: { tab: 'style' } }))
      } })
      items.push({ label: 'Flatten text', act: run(() => ops.flattenText(layer.id)) })
      /* from the right rail's retired ⋯ menu (spec R2.4) — the layer's own verbs live on the layer */
      items.push({ label: 'Edit object…', act: async () => {
        onClose()
        const next = await modal.prompt('Edit text', layer.text ?? '')
        if (next != null) ops.updateLayer(layer.id, { text: next })
      } })
      items.push({ label: 'Save type to library', act: open('kol:save-type', layer.id) })
    }
    if (t === 'bool') {
      items.push({ label: 'Convert to path', act: run(() => ops.flattenSelected()) })
      items.push({ label: 'Release boolean', act: run(() => ops.releaseBoolean()) })
    }
    if (t === 'shape' && CONVERTIBLE_KINDS.has(layer.kind)) {
      items.push({ label: 'Convert to path', act: run(() => ops.convertShapeToPath(layer.id)) })
    }
    /* masks (G8): the layer clips the one directly below it */
    if (layer.isMask) items.push({ label: 'Release mask', act: run(() => ops.releaseMask(layer.id)) })
    else if (canMask(layer) && ops.layerBelow(layer.id)) items.push({ label: 'Use as mask', act: run(() => ops.useAsMask(layer.id)) })
    if (t === 'photo') {
      items.push({ label: 'Crop image', act: run(() => ops.enterCrop(layer)) })
      items.push({ label: 'Replace image', act: open('kol:photo-replace', layer.id) })
    }
    if (t === 'pattern') items.push({ label: 'Pattern parameters', act: open('kol:open-pattern') })
    if (['shape', 'loop', 'kinetic', 'misc', 'path'].includes(t)) {
      items.push({ label: 'Parameters', act: open('kol:open-params') })
    }
    if (['shape', 'text', 'pattern', 'path', 'loop', 'photo'].includes(t)) {
      items.push({ label: 'Add effect', act: open('kol:open-effects') })
    }
    items.push({ divider: true })
    /* one lock rule: a locked layer refuses duplicate and delete here as it does on the toolbar */
    items.push({ label: 'Duplicate', act: run(() => ops.duplicateLayer(layer.id)), disabled: !!layer.locked })
    items.push({ label: layer.visible === false ? 'Show' : 'Hide', act: run(() => ops.toggleLayer(layer.id)) })
    items.push({ label: layer.locked ? 'Unlock' : 'Lock', act: run(() => ops.toggleLayerLock(layer.id)) })
    items.push({ label: 'Delete', act: run(() => ops.removeLayer(layer.id)), disabled: !!layer.locked })
  } else {
    items.push({ label: 'Undo', act: run(() => ops.undo()), disabled: !ops.canUndo })
    items.push({ label: 'Redo', act: run(() => ops.redo()), disabled: !ops.canRedo })
  }

  return (
    <div style={{ width: 192 }} onContextMenu={(e) => e.preventDefault()}>
      {items.map((it, i) => it.divider
        ? <MenuDropdownDivider key={`d${i}`} />
        : <MenuDropdownItem key={it.label} disabled={it.disabled} onClick={it.act}>{it.label}</MenuDropdownItem>)}
    </div>
  )
}
