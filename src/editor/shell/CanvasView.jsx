/* THE EDITOR'S OWN (plan 37 § 8.10, 2026-10-22): kol-component 0.287.0's `organisms/Canvas.jsx`, taken
   in — the canvas, viewport, rulers and guides are the editor's, edited here, no DS round trip (plan 06). */
import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
/* the zoom context stays the PACKAGE's — the DS's SelectionOverlay and friends read the same one */
import { CanvasZoomContext, Tooltip } from '@kolkrabbi/kol-component'

/**
 * Canvas — the editor's aspect-ratio stage.
 *
 * A letterboxed frame (dashed guide border + mono ratio label) that hosts its
 * children in a **fixed 1080-virtual-pixel coordinate space** and scales the
 * whole layer to fit the viewport via a single CSS `transform`. Because
 * children always render at 1080px-wide logical coords, a `168px` element is
 * always `168/1080` of the frame regardless of zoom or viewport size — the
 * scale seam is the only place real pixels enter. This 1080-virtual contract
 * is the whole point: anything placed inside (SelectionOverlay, boxes, guides)
 * shares it, so a consumer's drag math converts screen deltas to virtual by
 * dividing by the live scale (frameWidth / 1080).
 *
 * Ships from this file: `CanvasZoomContext`, `CanvasFrame` (the bare scale
 * layer), `Canvas` (the letterbox, default export), `PanZoomViewport` (pan +
 * zoom + rulers + guides), `PanViewport` (pan only) and `useFps`.
 *
 * Ported from kol-fxr's editor with three app-couplings dropped (per lobby
 * spec): the static `ASPECTS` table → an `aspects` prop (+ DEFAULT_ASPECTS);
 * the `#0E0E11` dark bg default → `transparent` (let the theme own the stage);
 * and the hardwired `kol-grid-bg` grid → a `backdrop` slot the consumer fills.
 *
 * ZOOM CAME BACK 2026-09-03 (`editor-set-is-behind-its-source`, kol-fxr). The
 * first port took Space-and-drag pan only and left behind wheel zoom, the zoom
 * clamps, `zoomAt`, the rulers, the guides and — load-bearing —
 * `CanvasZoomContext`, which every piece of editing chrome reads to stay
 * screen-constant. fxr bumped to current, ran the adoption and reverted:
 * without the context its `SelectionOverlay` drew 30px handles at 3×. A
 * pan-only viewport is not this component, it is a third of it.
 */

/* The viewport's live zoom factor — editing chrome divides its virtual-px
 * dimensions by it to stay screen-constant. Defined in `hooks/canvasZoom.js`
 * because the atoms consume it and an atom may not import an organism (the
 * taxonomy gate, correctly); re-exported here under the name it has always
 * had, so `import { CanvasZoomContext } from '@kolkrabbi/kol-component'` and
 * every existing deep import keep working. */
export { CanvasZoomContext }

/* Fixed virtual canvas width — children render in this pixel space and the
 * outer rect scales to fit the viewport via CSS transform. Height is derived
 * from the active aspect ratio. Load-bearing: the coordinate contract. */
export const CANVAS_VIRTUAL_W = 1080

/* Sensible DS default ratio table; a consumer passes its own `aspects` to
 * override. Each entry is { id, label, ratio }. */
export const DEFAULT_ASPECTS = [
  { id: '1:1',  label: '1:1',  ratio: 1 },
  { id: '4:5',  label: '4:5',  ratio: 4 / 5 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '5:4',  label: '5:4',  ratio: 5 / 4 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
]

export const CANVAS_DEFAULTS = {
  guideColor: '#F5F3EF',
}

function resolveAspect(aspect, customRatio, aspects) {
  const table = aspects?.length ? aspects : DEFAULT_ASPECTS
  const found = table.find((x) => x.id === aspect) ?? table[0]
  const ratio = aspect === 'custom' && customRatio ? customRatio : found.ratio
  const label = aspect === 'custom' && customRatio
    ? `Custom · ${Number(customRatio).toFixed(2)}`
    : found.label
  return { ratio, label }
}

/**
 * Bare aspect frame — dashed guide border + label + virtual-pixel scale layer.
 * No outer letterbox. Sizes to its parent (`width: 100%; aspect-ratio: ratio`)
 * so the parent decides the frame's width/height.
 *
 * @param {string}   aspect      aspect id, selects ratio+label from the table
 * @param {number}   customRatio numeric ratio + `Custom · N.NN` label when aspect==='custom'
 * @param {Array}    aspects     [{ id, label, ratio }] ratio table (default DEFAULT_ASPECTS)
 * @param {string}   bgColor     frame background fill (default transparent)
 * @param {string}   guideColor  dashed border (@24%) + label (@70%) color
 * @param {ReactNode} children   rendered in the 1080-virtual scale layer
 */
export function CanvasFrame({
  aspect,
  customRatio,
  aspects,
  bgColor,
  guideColor,
  children,
}) {
  const { ratio, label } = resolveAspect(aspect, customRatio, aspects)
  /* NO guideColor → THEME INK (editor DS sync 2026-09-27, from the design editor's copy, which had
   * it and this lift had not): the border and label follow the theme, so the frame reads on a light
   * page and a dark one. A guideColor (a type frame's own color) still tints both. */
  const borderColor = guideColor ? `color-mix(in srgb, ${guideColor} 24%, transparent)` : 'var(--kol-oq-24)'
  const labelColor = guideColor ? `color-mix(in srgb, ${guideColor} 70%, transparent)` : 'var(--kol-fg-64)'
  const virtualH = CANVAS_VIRTUAL_W / ratio

  const rectRef = useRef(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const node = rectRef.current
    if (!node) return
    const compute = () => {
      const w = node.getBoundingClientRect().width
      if (w > 0) setScale(w / CANVAS_VIRTUAL_W)
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(node)
    return () => ro.disconnect()
  }, [ratio])

  return (
    <div
      ref={rectRef}
      /* The rulers and the guides locate the frame by this attribute and read
       * its on-screen rect, which already folds in the letterbox, the fit
       * scale and the pan/zoom transform — so `screen = left + virtual*pxPer`
       * holds at any zoom with no second coordinate system. */
      data-canvas-frame
      className="relative w-full"
      style={{
        aspectRatio: ratio,
        background:  bgColor ?? 'transparent',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          border:      '1px solid',
          borderColor,
        }}
      />
      <span
        className="z-[2]"
        style={{
          position:      'absolute',
          top:           6,
          left:          8,
          fontSize:      10,
          fontFamily:    'var(--kol-font-family-mono)',
          letterSpacing: '0.1em',
          color:         labelColor,
          pointerEvents: 'none',
        }}
      >
        {label}
      </span>
      {scale > 0 && (
        <div
          className="absolute top-0 left-0 z-[1]"
          style={{
            width:           `${CANVAS_VIRTUAL_W}px`,
            height:          `${virtualH}px`,
            transformOrigin: 'top left',
            transform:       `scale(${scale})`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Canvas — letterboxed stage (default export).
 *
 * The OUTER wrapper letterboxes the inner `<CanvasFrame>` (rect carries the
 * optional `bgColor`, dashed border, label, and virtual-pixel scale layer).
 *
 * `panEnabled` opts into Space-key + drag panning. When held, the cursor
 * flips to grab/grabbing and the frame translates with the cursor; pointer
 * events on the frame are suppressed while Space is held so layer handlers
 * don't fire mid-pan. Decorative chrome (grid bg / dark bg / inset borders)
 * is the consumer's responsibility — pass a `backdrop` node to fill the pan
 * viewport behind the frame.
 *
 * @param {string}    aspect      aspect id (see aspects table)
 * @param {number}    customRatio numeric ratio when aspect==='custom'
 * @param {Array}     aspects     [{ id, label, ratio }] ratio table
 * @param {string}    bgColor     frame background fill
 * @param {string}    guideColor  guide border + label color
 * @param {'center'|'start'} align vertical placement in the letterbox
 * @param {boolean}   panEnabled  wrap in a PanZoomViewport — Space+drag pan, wheel/pinch zoom, rulers, guides
 * @param {ReactNode} backdrop    node placed behind the frame in the pan viewport (e.g. a grid)
 * @param {number}    gutter      px breathing room the letterbox leaves around the frame (default 48)
 * @param {'contain'|'cover'} fit  `cover` overflows the viewport instead of letterboxing — a display-side crop; the composition is untouched
 * @param {boolean}   rulers      draw the virtual-px rulers (default true, `panEnabled` only)
 * @param {{h: number[], v: number[]}} guides ruler-guide positions in VIRTUAL px; with `setGuides`, the guides layer renders and is draggable
 * @param {Function}  setGuides   updater for `guides` — the viewport owns no guide state, the consumer does
 * @param {boolean}   guidesInteractive  let guides be grabbed and created (default true)
 * @param {Function}  onSpaceTap  fires when Space was pressed and released WITHOUT panning — a tap, not a drag. fxr binds its transport play/pause here; unset, a tap does nothing
 * @param {ReactNode} children    rendered in the 1080-virtual scale layer
 */
export default function Canvas({
  aspect,
  customRatio,
  aspects,
  bgColor,
  guideColor,
  align = 'center',
  panEnabled = false,
  backdrop,
  gutter = 48,
  fit = 'contain',
  rulers = true,
  guides,
  setGuides,
  guidesInteractive = true,
  onSpaceTap,
  children,
}) {
  const { ratio } = resolveAspect(aspect, customRatio, aspects)

  /* fit='cover': the frame overflows the viewport instead of letterboxing —
   * a display-side crop (the composition itself is untouched). */
  const letterbox = (
    <div
      className={`flex ${align === 'start' ? 'items-start' : 'items-center'} justify-center w-full h-full ${fit === 'cover' ? 'overflow-hidden' : ''}`}
      style={{ containerType: 'size' }}
    >
      <div
        className="shrink-0"
        style={{
          width: fit === 'cover'
            ? `max(100cqw, calc(100cqh * ${ratio}))`
            : `min(calc(100cqw - ${gutter}px), calc((100cqh - ${gutter}px) * ${ratio}))`,
        }}
      >
        <CanvasFrame
          aspect={aspect}
          customRatio={customRatio}
          aspects={aspects}
          bgColor={bgColor}
          guideColor={guideColor}
        >
          {children}
        </CanvasFrame>
      </div>
    </div>
  )

  if (!panEnabled) return letterbox
  return (
    <PanZoomViewport
      backdrop={backdrop}
      showRulers={rulers}
      guides={guides}
      setGuides={setGuides}
      guidesInteractive={guidesInteractive}
      onSpaceTap={onSpaceTap}
    >
      {letterbox}
    </PanZoomViewport>
  )
}

/**
 * PanViewport — Space + drag pan wrapper. **Pan only, no zoom.**
 *
 * Kept for a consumer composing its own viewport, and because it is what
 * shipped. An editor wants `PanZoomViewport` (below): this one publishes no
 * `CanvasZoomContext`, so editing chrome inside it cannot stay
 * screen-constant, which is the defect kol-fxr measured on 2026-09-03.
 *
 * Hold Space → cursor `grab`. Mousedown while held → drag-pan, cursor
 * `grabbing`. The pan transform applies to the child div that holds the frame;
 * the viewport itself stays fixed. Pointer events on the transform layer
 * disable while Space is held so layer-level mousedowns don't fire mid-pan.
 * At rest the cursor is left unset so a consumer's tool cursor shows through.
 *
 * @param {ReactNode} backdrop  placed behind the frame (grid / dark bg); the
 *                              consumer owns its sizing (oversize it so panning
 *                              never reveals an edge)
 * @param {ReactNode} children  the letterboxed frame
 */
export function PanViewport({ backdrop, children }) {
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [pan, setPan]             = useState({ x: 0, y: 0 })
  const [dragging, setDragging]   = useState(false)
  const dragStart                 = useRef(null)

  useEffect(() => {
    const isInputTarget = (el) =>
      el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !isInputTarget(e.target)) {
        e.preventDefault()
        setSpaceHeld(true)
      }
    }
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        setSpaceHeld(false)
        setDragging(false)
        dragStart.current = null
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      if (!dragStart.current) return
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      })
    }
    const onUp = () => {
      setDragging(false)
      dragStart.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  const onMouseDown = (e) => {
    if (!spaceHeld) return
    e.preventDefault()
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    setDragging(true)
  }

  const cursor = dragging ? 'grabbing' : spaceHeld ? 'grab' : undefined

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={cursor ? { cursor } : undefined}
      onMouseDown={onMouseDown}
    >
      <div
        className="absolute inset-0"
        style={{
          transform:     `translate(${pan.x}px, ${pan.y}px)`,
          transition:    dragging ? 'none' : 'transform 120ms ease-out',
          pointerEvents: spaceHeld ? 'none' : 'auto',
        }}
      >
        {backdrop}
        <div className="relative w-full h-full">{children}</div>
      </div>
    </div>
  )
}

/* ── Pan + zoom ────────────────────────────────────────────────────────────
 * Ported verbatim from kol-fxr `src/editor/shell/Canvas.jsx` (2026-09-03,
 * `editor-set-is-behind-its-source`). Two app couplings became seams: the
 * Space-tap `transport.toggle()` is now `onSpaceTap`, and the hardwired
 * `.kol-grid-bg` div is the `backdrop` node this package already took. The
 * clamps, the anchor math, the wheel handling and the chip layout are the
 * source's — fxr is the reference for this set. */

/* The clamps are in REAL terms — screen px per frame px, `zoom × fit` (CanvasViewCommands, kol-fxr
 * 2026-10-13). They were 0.1–8 relative to the fitted frame, so a 1080 frame fitted at ~0.58 capped
 * at ~464% real and Affinity's 800% could not be reached. */
const ZOOM_MIN_REAL = 0.02
const ZOOM_MAX_REAL = 32
const FIT_MARGIN = 24 /* screen px around a rect fitted by `kol:zoom-fit` */

/* The fit scale: the frame's LAYOUT width (untransformed) over its virtual width. 1 without a frame. */
function fitOf(node) {
  const w = node?.querySelector('[data-canvas-frame]')?.offsetWidth
  return w ? w / CANVAS_VIRTUAL_W : 1
}

const clampZoom = (z, fit) => Math.min(ZOOM_MAX_REAL / fit, Math.max(ZOOM_MIN_REAL / fit, z))

/* Anchor a zoom change at a screen point (sx, sy relative to the viewport
 * top-left) so the content under the cursor stays put. Transform is
 * `translate(x,y) scale(zoom)` with origin 0,0, so screen = p*zoom + pan;
 * inverting for a fixed p gives the new pan below. */
function zoomAt(v, factor, sx, sy, fit = 1) {
  const z2 = clampZoom(v.zoom * factor, fit)
  return {
    zoom: z2,
    x: sx - (sx - v.x) * (z2 / v.zoom),
    y: sy - (sy - v.y) * (z2 / v.zoom),
  }
}

/* useFps(enabled) — live framerate, measured only while `enabled` (the RAF
 * idles when off); returns frames per second, updated twice a second.
 * Exported because a consumer's own stage corner renders the same chip.
 *
 * A plain block comment on purpose: `@param` belongs to a destructured props
 * signature, and the props gate pairs a `/** … *\/` block with the next such
 * export — a JSDoc'd positional hook hands its `@param` to the component
 * below it, which is exactly the false positive it reported on this file. */
export function useFps(enabled) {
  const [fps, setFps] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let raf, frames = 0, last = performance.now()
    const loop = (now) => {
      frames++
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)))
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [enabled])
  return fps
}

function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/**
 * PanZoomViewport — An infinite canvas to pan and zoom. infinite-canvas viewport (pan + zoom), and the one that
 * publishes `CanvasZoomContext`.
 *
 * Pan: hold Space + drag (cursor grab/grabbing), or two-finger trackpad
 * scroll. Zoom: Cmd/Ctrl + wheel or trackpad pinch, anchored at the pointer;
 * Cmd+0 resets, Cmd+= / Cmd+- step-zoom at the viewport center. A single
 * `translate() scale()` on the transform layer carries both, so a consumer's
 * screen→virtual math needs no zoom awareness. Pointer events on the
 * transform layer disable while Space is held so layer mousedowns don't fire
 * mid-pan. `f` toggles an fps chip beside the zoom readout. From outside: `kol:zoom-at`
 * { clientX, clientY, factor } · `kol:zoom-to` { scale } (real, 1 = 100%) · `kol:zoom-fit` { to:
 * 'frame' | 'width' | { x, y, w, h } } — window events. Zoom is clamped at 2%–3200% real. Touch:
 * two fingers pinch-zoom + pan; a one-finger tap fires `onSpaceTap`.
 *
 * @param {ReactNode} backdrop   placed behind the frame (grid / dark bg); the consumer owns its sizing — oversize it so panning never reveals an edge
 * @param {boolean}   showRulers draw the virtual-px rulers (default true)
 * @param {{h: number[], v: number[]}} guides guide positions in VIRTUAL px
 * @param {Function}  setGuides  updater for `guides`; without both, no guides layer renders
 * @param {boolean}   guidesInteractive  allow grab + create (default true)
 * @param {Function}  onSpaceTap fires on a Space press released without panning, or a one-finger touch tap
 * @param {ReactNode} children   the letterboxed frame
 */
export function PanZoomViewport({
  children,
  backdrop,
  showRulers = true,
  guides,
  setGuides,
  guidesInteractive = true,
  onSpaceTap,
}) {
  const containerRef              = useRef(null)
  const [spaceHeld, setSpaceHeld] = useState(false)
  /* Space tap vs Space+drag: the ref records whether a pan drag consumed this
   * Space press (set on pan mousedown), so keyup can tell them apart. */
  const spacePannedRef = useRef(false)
  const [dragging, setDragging]   = useState(false)
  const [view, setView]           = useState({ zoom: 1, x: 0, y: 0 })
  const dragStart                 = useRef(null)
  const [pinching, setPinching]   = useState(false)
  const [showFps, setShowFps]     = useState(false)
  const fps                       = useFps(showFps)
  /* Ref mirror so the keyup listener calls the latest callback without
   * rebinding the window listeners on every consumer re-render. */
  const spaceTapRef = useRef(onSpaceTap)
  spaceTapRef.current = onSpaceTap

  /* Space toggles pan mode; Cmd+0 / Cmd+= / Cmd+- drive zoom from the
   * keyboard (centered on the viewport). Skipped while typing in a field. */
  useEffect(() => {
    const isInputTarget = (el) =>
      el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    const onKeyDown = (e) => {
      if (isInputTarget(e.target)) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!e.repeat) spacePannedRef.current = false
        setSpaceHeld(true)
        return
      }
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '0') {
          e.preventDefault()
          setView({ zoom: 1, x: 0, y: 0 })
        } else if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          const r = containerRef.current?.getBoundingClientRect()
          setView((v) => zoomAt(v, 1.2, (r?.width ?? 0) / 2, (r?.height ?? 0) / 2, fitOf(containerRef.current)))
        } else if (e.key === '-') {
          e.preventDefault()
          const r = containerRef.current?.getBoundingClientRect()
          setView((v) => zoomAt(v, 1 / 1.2, (r?.width ?? 0) / 2, (r?.height ?? 0) / 2, fitOf(containerRef.current)))
        }
      }
    }
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        setSpaceHeld(false)
        setDragging(false)
        dragStart.current = null
        /* No pan happened → this was a tap. fxr binds play/pause here; the
         * same input guard as keydown so typing a space in a field is not a
         * tap. Unset, a tap does nothing. */
        if (!spacePannedRef.current && !isInputTarget(e.target)) spaceTapRef.current?.()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      if (!dragStart.current) return
      const { x: sx, y: sy } = dragStart.current
      setView((v) => ({ ...v, x: e.clientX - sx, y: e.clientY - sy }))
    }
    const onUp = () => {
      setDragging(false)
      dragStart.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  /* Wheel: Cmd/Ctrl+wheel or trackpad pinch (ctrlKey) → zoom at pointer;
   * plain two-finger scroll → pan. Native non-passive listener so we can
   * preventDefault the browser's page-zoom / scroll. */
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const onWheel = (e) => {
      e.preventDefault()
      const rect = node.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      if (e.ctrlKey || e.metaKey) {
        setView((v) => zoomAt(v, Math.exp(-e.deltaY * 0.0015), sx, sy, fitOf(node)))
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      }
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [])

  /* Touch (ViewportTouchGestures, kol-fxr 2026-10-14): two fingers pinch-zoom at their midpoint and
   * the midpoint's travel pans, in one gesture; the transform layer goes deaf while they are down so
   * a consumer's tool never sees the second finger. One finger stays the consumer's, except a TAP
   * (up within TAP_MS and TAP_PX, no second finger joined) fires `onSpaceTap`. Down is caught in the
   * capture phase on the container; move/up on window, so a finger leaving the frame still ends. */
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const TAP_MS = 350, TAP_PX = 12
    const pts = new Map()
    let pinch = null, tap = null
    const pair = () => {
      const [a, b] = [...pts.values()]
      return { mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) || 1 }
    }
    const onDown = (e) => {
      if (e.pointerType !== 'touch') return
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.size === 1) tap = { id: e.pointerId, t: e.timeStamp, x: e.clientX, y: e.clientY }
      else if (pts.size === 2) { tap = null; pinch = pair(); setPinching(true) }
    }
    const onMove = (e) => {
      if (!pts.has(e.pointerId)) return
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > TAP_PX) tap = null
      if (!pinch || pts.size < 2) return
      const prev = pinch, next = pair()
      pinch = next
      const r = node.getBoundingClientRect()
      const fit = fitOf(node)
      setView((v) => {
        const z = zoomAt(v, next.d / prev.d, prev.mx - r.left, prev.my - r.top, fit)
        return { ...z, x: z.x + next.mx - prev.mx, y: z.y + next.my - prev.my }
      })
    }
    const onEnd = (e) => {
      if (!pts.delete(e.pointerId)) return
      if (tap?.id === e.pointerId && e.type === 'pointerup' && e.timeStamp - tap.t < TAP_MS) spaceTapRef.current?.()
      if (tap?.id === e.pointerId) tap = null
      if (pinch && pts.size < 2) { pinch = null; setPinching(false) }
    }
    node.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    return () => {
      node.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
  }, [])

  /* A consumer's zoom TOOL announces clicks as `kol:zoom-at` (client coords +
   * factor) rather than reaching into this state — anchored zoom at the
   * pointer. Same idiom as `kol:guide-drag-start` below. */
  useEffect(() => {
    const onZoomEvt = (e) => {
      const node = containerRef.current
      if (!node) return
      const { clientX, clientY, factor } = e.detail
      const rect = node.getBoundingClientRect()
      setView((v) => zoomAt(v, factor, clientX - rect.left, clientY - rect.top, fitOf(node)))
    }
    /* `kol:zoom-to` { scale } — a REAL scale (1 = 100%: one screen px per frame px), about the
     * viewport centre, so a consumer's 100–800% steps need not measure the fit. */
    const onZoomTo = (e) => {
      const node = containerRef.current
      if (!node) return
      const fit = fitOf(node)
      const r = node.getBoundingClientRect()
      setView((v) => zoomAt(v, e.detail.scale / (v.zoom * fit), r.width / 2, r.height / 2, fit))
    }
    /* `kol:zoom-fit` { to } — `'frame'` (default) is ⌘0's opening view; `'width'` fills the
     * viewport with the frame's width, centred vertically; `{ x, y, w, h }` in frame (virtual) px
     * fills it with that rect, FIT_MARGIN around it, centred. */
    const onZoomFit = (e) => {
      const node = containerRef.current
      const frame = node?.querySelector('[data-canvas-frame]')
      const to = e.detail?.to ?? 'frame'
      if (!frame || to === 'frame') { setView({ zoom: 1, x: 0, y: 0 }); return }
      const fit = fitOf(node)
      const cr = node.getBoundingClientRect()
      const fr = frame.getBoundingClientRect()
      setView((v) => {
        /* the frame's rect at rest (zoom 1, no pan), in viewport px */
        const fx = (fr.left - cr.left - v.x) / v.zoom
        const fy = (fr.top - cr.top - v.y) / v.zoom
        const rect = to === 'width'
          ? { x: fx, y: fy, w: frame.offsetWidth, h: frame.offsetHeight }
          : { x: fx + to.x * fit, y: fy + to.y * fit, w: to.w * fit, h: to.h * fit }
        const zoom = clampZoom(to === 'width'
          ? cr.width / rect.w
          : Math.min((cr.width - 2 * FIT_MARGIN) / rect.w, (cr.height - 2 * FIT_MARGIN) / rect.h), fit)
        return {
          zoom,
          x: cr.width / 2 - (rect.x + rect.w / 2) * zoom,
          y: cr.height / 2 - (rect.y + rect.h / 2) * zoom,
        }
      })
    }
    window.addEventListener('kol:zoom-at', onZoomEvt)
    window.addEventListener('kol:zoom-to', onZoomTo)
    window.addEventListener('kol:zoom-fit', onZoomFit)
    return () => {
      window.removeEventListener('kol:zoom-at', onZoomEvt)
      window.removeEventListener('kol:zoom-to', onZoomTo)
      window.removeEventListener('kol:zoom-fit', onZoomFit)
    }
  }, [])

  /* `f` toggles the fps chip (measured only while shown). Guarded against
   * typing targets so text fields don't flip it. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'f' && e.key !== 'F') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      setShowFps((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onMouseDown = (e) => {
    if (!spaceHeld) return
    e.preventDefault()
    spacePannedRef.current = true
    dragStart.current = { x: e.clientX - view.x, y: e.clientY - view.y }
    setDragging(true)
  }

  /* Only override the cursor while actively panning (Space-held / dragging).
   * At rest, leave it unset so consumers above can apply their own cursor
   * (a tool-driven cursor) and have it visible across the backdrop AND the
   * canvas frame, not just the frame area. */
  const cursor = dragging ? 'grabbing' : spaceHeld ? 'grab' : undefined
  const atRest = view.zoom === 1 && view.x === 0 && view.y === 0

  return (
    <CanvasZoomContext.Provider value={view.zoom}>
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden select-none"
        style={{ cursor, touchAction: 'none' }}
        onMouseDown={onMouseDown}
      >
        {/* No transition on the transform: editing chrome (selection
            wireframe, path nodes) sizes itself by 1/zoom from React state,
            which updates instantly — an eased CSS transform lags behind and
            makes the chrome visibly pop. Instant zoom keeps chrome, rulers and
            stage in the same frame. */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
            transformOrigin: '0 0',
            pointerEvents: spaceHeld || pinching ? 'none' : 'auto',
          }}
        >
          {backdrop}
          <div className="relative w-full h-full">{children}</div>
        </div>

        {/* Ruler guides — viewport-level so each line spans the whole visible
            canvas area (readable against the rulers), under the rulers, above
            the canvas content. */}
        {guides && setGuides && (
          <CanvasGuides
            containerRef={containerRef}
            guides={guides}
            setGuides={setGuides}
            interactive={guidesInteractive && !spaceHeld}
          />
        )}

        {showRulers && <CanvasRuler containerRef={containerRef} disabled={spaceHeld} />}

        {/* Zoom % + fps — matching chips. Zoom (click resets to 100% /
            centered) first, fps to its right, shown while `f` toggles it. */}
        <div className="absolute bottom-3 right-3 z-[3] flex items-center gap-2">
          <Tooltip label="Reset zoom (⌘0)" asChild>
          <button
            type="button"
            onClick={() => setView({ zoom: 1, x: 0, y: 0 })}
            className="px-2 py-1 rounded border border-fg-08 bg-surface-secondary kol-mono-12 text-emphasis tabular-nums"
            style={{ opacity: atRest && !showFps ? 0.55 : 1 }}
          >
            {Math.round(view.zoom * 100)}%
          </button>
          </Tooltip>
          {showFps && (
            <Tooltip label="Framerate — press F to hide" asChild>
            <span
              className="px-2 py-1 rounded border border-fg-08 bg-surface-secondary kol-mono-12 text-emphasis tabular-nums"
            >
              {fps} fps
            </span>
            </Tooltip>
          )}
        </div>
      </div>
    </CanvasZoomContext.Provider>
  )
}

/* ── Rulers + guides ─────────────────────────────────────────────────────── */

const RULER = 18  /* px thickness of each ruler bar */
const RULER_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000]

/* Smallest 1-2-5 virtual step whose on-screen spacing clears `target` px, so
 * labels never crowd regardless of zoom. */
export function niceStep(pxPer, target = 80) {
  for (const s of RULER_STEPS) if (s * pxPer >= target) return s
  return RULER_STEPS[RULER_STEPS.length - 1]
}

/* Virtual ticks visible across [0, spanScreen], given where virtual-0 sits on
 * screen (originScreen) and the screen-px-per-virtual-px scale. */
export function ticksFor(originScreen, pxPer, spanScreen, step) {
  const vMin = (0 - originScreen) / pxPer
  const vMax = (spanScreen - originScreen) / pxPer
  const first = Math.ceil(vMin / step) * step
  const out = []
  for (let v = first; v <= vMax; v += step) out.push({ v: Math.round(v), s: originScreen + v * pxPer })
  return out
}

/**
 * useFrameGeom — the geometry the rulers and the guides both read.
 *
 * PUBLIC SINCE 2026-09-03 (`rulers-and-guides-are-private`, kol-fxr), with
 * `CanvasRuler`, `CanvasGuides`, `niceStep` and `ticksFor`. They were module
 * -private inside `PanZoomViewport` and **they were never tied to it**: this
 * hook locates `[data-canvas-frame]` and reads its `getBoundingClientRect()`
 * against the container, so it measures the RENDERED RESULT and every
 * transform is already folded in. The filer measured it rather than asserting
 * it — CSS `zoom: 0.5` and `transform: scale(0.5)` on a 1920 element both
 * report a 960 rect, so `pxPer` is identical and no branch is needed. A
 * consumer with a CSS-zoomed stage and no pan-zoom viewport at all (a 1920×1080
 * slide editor, its second consumer on day one) gets rulers by rendering these
 * two layers over a container that holds a `[data-canvas-frame]`.
 *
 * `view` is GONE rather than generalised: it never entered the math, and the
 * effect it keyed on already runs a rAF settle-loop that re-measures until the
 * rect is stable for two frames, plus a `ResizeObserver` on the container. Any
 * change is caught by the rect comparison whatever caused it.
 *
 * THE RULER IS A SIBLING OF THE FRAME, NOT ITS CHILD — and the container needs
 * a gutter for the bars to live in. Satisfying `position: relative` and
 * `[data-canvas-frame]` with the SAME element reads as the obvious move in a
 * single-canvas app and is wrong: the ruler then positions against the very box
 * it is measuring and paints its ticks over the artwork. kol-client-olina lost a
 * cycle to exactly that on 2026-09-04, which is why this paragraph exists:
 *
 *   <div ref={containerRef} style={{ position: 'relative', padding: 18 }}>
 *     <CanvasRuler containerRef={containerRef} virtualWidth={1920} />
 *     <div data-canvas-frame>…the artwork…</div>
 *   </div>
 *
 * @param {React.RefObject<HTMLElement>} containerRef - The POSITIONED box the layers are drawn in; it must CONTAIN a `[data-canvas-frame]` sibling and leave a gutter (18px) for the bars
 * @param {number} [virtualWidth=CANVAS_VIRTUAL_W] - The frame's width in VIRTUAL px — what `pxPer` divides by, and the vertical guide clamp
 * @returns {{left, top, pxPer, vh, cw, ch}|null} frame offsets, screen-px per virtual px, the frame's virtual height, the container's size
 */
/* Frame geometry inside the viewport — locates the tagged
 * `[data-canvas-frame]` and reads its on-screen rect (which already folds in
 * the letterbox, fit-scale, and the pan/zoom transform) relative to the
 * container, so `screen = left/top + virtual * pxPer` holds at any zoom with
 * no separate math. `vh` is the frame's height in virtual px (for clamping
 * horizontal guides). Re-measures on every `view` change and on container
 * resize. Shared by CanvasRuler and CanvasGuides so ruler labels and guide
 * lines can never disagree. */
export function useFrameGeom(containerRef, virtualWidth = CANVAS_VIRTUAL_W) {
  const [geom, setGeom] = useState(null)

  const measure = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const frame = el.querySelector('[data-canvas-frame]')
    const crect = el.getBoundingClientRect()
    if (!frame || crect.width === 0) { setGeom(null); return }
    const frect = frame.getBoundingClientRect()
    const pxPer = frect.width / virtualWidth
    setGeom({
      left:  frect.left - crect.left,
      top:   frect.top  - crect.top,
      pxPer,
      vh:    pxPer > 0 ? frect.height / pxPer : 0,
      cw:    crect.width,
      ch:    crect.height,
    })
  }, [containerRef, virtualWidth])

  /* A zoom that ANIMATES its transform (a consumer's eased step-zoom) would
   * have a single measure read the pre-animation rect, and the labels would
   * lag the whole tween. Re-measure per animation frame until the frame rect
   * stops moving (2 stable frames); an instant zoom settles immediately,
   * costing a couple of no-op frames. */
  useLayoutEffect(() => {
    measure()
    let raf
    let prevKey
    let stable = 0
    const tick = () => {
      const frame = containerRef.current?.querySelector('[data-canvas-frame]')
      if (!frame) return
      const r = frame.getBoundingClientRect()
      const key = `${r.left}|${r.top}|${r.width}`
      if (key !== prevKey) {
        prevKey = key
        stable = 0
        measure()
      } else if (++stable >= 2) {
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [measure, containerRef])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, containerRef])

  return geom
}

/**
 * CanvasRuler — Rulers along the canvas edges. top + left rulers in virtual-canvas px, mapped through the
 * measured frame geometry (see useFrameGeom).
 *
 * Dragging off a ruler starts a new guide: the ruler only ANNOUNCES the
 * gesture via a `kol:guide-drag-start` CustomEvent (same idiom as
 * `kol:zoom-at`) — CanvasGuides owns the guide drag, and the positions live in
 * the consumer's state. Canvases without a guides layer no-op. `disabled`
 * (Space-held pan) lets the pointerdown bubble to the pan handler instead.
 *
 * The two layers do not import each other — that event is the whole seam, so a
 * consumer may render either alone.
 *
 * @param {React.RefObject<HTMLElement>} containerRef - The positioned box the bars sit in
 * @param {number} [virtualWidth=CANVAS_VIRTUAL_W] - The frame's virtual width, forwarded to `useFrameGeom`
 * @param {boolean} [disabled=false] - Let a pointerdown bubble instead of starting a guide (a pan gesture is holding the surface)
 */
export function CanvasRuler({ containerRef, virtualWidth = CANVAS_VIRTUAL_W, disabled = false }) {
  const geom = useFrameGeom(containerRef, virtualWidth)
  const hPointer = useRef(null)
  const vPointer = useRef(null)

  /* The pointer line on each ruler follows the container's own pointermove — written straight
   * to the two <line>s, so a mouse move never re-renders a few hundred ticks. */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      hPointer.current?.setAttribute('transform', `translate(${e.clientX - r.left} 0)`)
      vPointer.current?.setAttribute('transform', `translate(0 ${e.clientY - r.top})`)
      hPointer.current?.setAttribute('visibility', 'visible')
      vPointer.current?.setAttribute('visibility', 'visible')
    }
    const leave = () => {
      hPointer.current?.setAttribute('visibility', 'hidden')
      vPointer.current?.setAttribute('visibility', 'hidden')
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [containerRef])

  const startGuideDrag = (axis) => (e) => {
    if (disabled || e.button !== 0) return
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('kol:guide-drag-start', {
      detail: { axis, clientX: e.clientX, clientY: e.clientY },
    }))
  }

  if (!geom || geom.pxPer <= 0) return null
  /* Three ranks (CanvasRulerGraduated, kol-fxr 2026-10-13): the major at `niceStep`, the medium
   * at half of it, the minor at a tenth — counted by index `k`, not by value, so a 25 step's
   * 2.5 minors never round onto each other. */
  const step  = niceStep(geom.pxPer)
  const minor = step / 10
  const graduate = (origin, span) => {
    const out = []
    const last = Math.floor((span - origin) / geom.pxPer / minor)
    for (let k = Math.ceil(-origin / geom.pxPer / minor); k <= last; k++) {
      out.push({ k, s: origin + k * minor * geom.pxPer, rank: k % 10 === 0 ? 0 : k % 5 === 0 ? 1 : 2 })
    }
    return out
  }
  const hTicks = graduate(geom.left, geom.cw)
  const vTicks = graduate(geom.top, geom.ch)

  /* No band: the bar is transparent and the pasteboard shows through, one hairline at the inner
   * edge. Ink rides the themed fg ramp so it flips with light/dark. */
  const LEN         = [RULER, 9, 4]
  const tickColor   = ['var(--kol-fg-48)', 'var(--kol-fg-24)', 'var(--kol-fg-24)']
  const textColor   = 'var(--kol-fg-64)'
  const borderColor = 'var(--kol-oq-16)'
  const labelStyle  = { fontFamily: 'var(--kol-font-family-sans)', fontSize: 10 }
  const label = (k) => Math.round(k * minor)

  return (
    <>
      <svg width="100%" height={RULER}
        onPointerDown={startGuideDrag('h')}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 4, cursor: 'row-resize' }}>
        {hTicks.map(({ k, s, rank }) => (
          <g key={k}>
            <line x1={s} y1={RULER - LEN[rank]} x2={s} y2={RULER} stroke={tickColor[rank]} strokeWidth={1} />
            {rank === 0 && <text x={s + 3} y={10} fill={textColor} style={labelStyle}>{label(k)}</text>}
          </g>
        ))}
        <line x1={0} y1={RULER - 0.5} x2="100%" y2={RULER - 0.5} stroke={borderColor} strokeWidth={1} />
        <line ref={hPointer} x1={0.5} y1={0} x2={0.5} y2={RULER} stroke={textColor} strokeWidth={1} visibility="hidden" />
      </svg>
      <svg width={RULER} height="100%"
        onPointerDown={startGuideDrag('v')}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 4, cursor: 'col-resize' }}>
        {vTicks.map(({ k, s, rank }) => (
          <g key={k}>
            <line x1={RULER - LEN[rank]} y1={s} x2={RULER} y2={s} stroke={tickColor[rank]} strokeWidth={1} />
            {rank === 0 && <text x={10} y={s - 3} fill={textColor} style={labelStyle}
              transform={`rotate(-90 10 ${s - 3})`}>{label(k)}</text>}
          </g>
        ))}
        <line x1={RULER - 0.5} y1={0} x2={RULER - 0.5} y2="100%" stroke={borderColor} strokeWidth={1} />
        <line ref={vPointer} x1={0} y1={0.5} x2={RULER} y2={0.5} stroke={textColor} strokeWidth={1} visibility="hidden" />
      </svg>
      {/* the corner square, empty — no unit label (plan 37 § 8.10, the user: "this doesnt need to say px? just remove it") */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: RULER, height: RULER, borderRight: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, zIndex: 4, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor, ...labelStyle }} />
    </>
  )
}

/* A ruler guide — 1px accent line spanning the full viewport (guides read
 * against the rulers, not just the frame). Pointer events live on a slop
 * wrapper around the line so the grab zone stays ~5px; everything is screen px
 * at the viewport level, so no zoom compensation is needed here. */
function GuideLine({ axis, screenPos, interactive, onGrab }) {
  const slop = 5
  const h = axis === 'h'
  return (
    <div
      onPointerDown={interactive ? onGrab : undefined}
      /* Stop the compat mousedown from reaching handlers underneath (pan /
       * click-away) in browsers that fire it despite the canceled
       * pointerdown. */
      onMouseDown={interactive ? (e) => e.stopPropagation() : undefined}
      style={{
        position: 'absolute',
        ...(h
          ? { left: 0, top: screenPos - slop, width: '100%', height: slop * 2 + 1, cursor: 'row-resize' }
          : { left: screenPos - slop, top: 0, width: slop * 2 + 1, height: '100%', cursor: 'col-resize' }),
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          ...(h
            ? { left: 0, top: slop, width: '100%', height: 1 }
            : { left: slop, top: 0, width: 1, height: '100%' }),
          /* GUIDES ARE NOT THE ACCENT (editor-chrome-review, kol-fxr
             2026-09-03 — ruled magenta, deliberately separated so a guide and
             a selection never read as the same thing). Falls back to the
             accent, so a consumer that binds nothing is unchanged. */
          background: 'var(--kol-canvas-guide, var(--kol-accent-primary))',
        }}
      />
    </div>
  )
}

/**
 * CanvasGuides — Guide lines across the whole canvas. ruler guides rendered at the viewport level so each line
 * spans the entire visible canvas area instead of clipping to the letterbox
 * frame. Positions are stored in virtual canvas px and threaded down as props
 * — the viewport is chrome and owns no guide state; the screen mapping is the
 * same frame-rect geometry the rulers use: screen = frameLeft/Top + virtual *
 * pxPer.
 *
 * Interaction:
 *   • grab a line (±5px slop) to move it — row/col-resize cursors
 *   • drag off a ruler to create (CanvasRuler announces the gesture via the
 *     `kol:guide-drag-start` CustomEvent; this layer owns the drag)
 *   • release at virtual pos < 0 (back over the source ruler, or past the
 *     frame edge toward it) deletes instead of committing
 *
 * Drags use window-level POINTER events — the ruler cancels its pointerdown,
 * which suppresses the whole compatibility mouse-event stream for the
 * interaction, so mousemove/mouseup would never fire.
 *
 * @param {React.RefObject<HTMLElement>} containerRef - The positioned box the lines span
 * @param {number} [virtualWidth=CANVAS_VIRTUAL_W] - The frame's virtual width — also the vertical guides' clamp
 * @param {{h: number[], v: number[]}} guides - Positions in VIRTUAL px; the consumer's state
 * @param {Function} setGuides - Updater, called with the next `{h, v}`
 * @param {boolean} interactive - Allow grab and create; false renders the lines inert
 */
export function CanvasGuides({ containerRef, virtualWidth = CANVAS_VIRTUAL_W, guides, setGuides, interactive }) {
  const geom = useFrameGeom(containerRef, virtualWidth)
  /* Ref mirror so the drag listeners read fresh geometry without rebinding. */
  const geomRef = useRef(null)
  geomRef.current = geom
  const [guideDrag, setGuideDrag] = useState(null) /* { axis:'h'|'v', index:number|null, pos:number } | null */

  /* client coords → virtual canvas px, via the measured frame geometry. */
  const toVirtual = useCallback((clientX, clientY) => {
    const el = containerRef.current
    const g = geomRef.current
    if (!el || !g || g.pxPer <= 0) return { vx: 0, vy: 0 }
    const crect = el.getBoundingClientRect()
    return {
      vx: (clientX - crect.left - g.left) / g.pxPer,
      vy: (clientY - crect.top  - g.top)  / g.pxPer,
    }
  }, [containerRef])

  /* A pointerdown on a ruler dispatches kol:guide-drag-start (see
   * CanvasRuler); this opens a new-guide drag at the pointer. */
  useEffect(() => {
    const onStart = (e) => {
      const { axis, clientX, clientY } = e.detail
      const { vx, vy } = toVirtual(clientX, clientY)
      setGuideDrag({ axis, index: null, pos: Math.round(axis === 'h' ? vy : vx) })
    }
    window.addEventListener('kol:guide-drag-start', onStart)
    return () => window.removeEventListener('kol:guide-drag-start', onStart)
  }, [toVirtual])

  /* Window-level listeners while a guide drag is live. Commit on pointerup:
   * append (new) or move (existing); pos < 0 deletes / discards. Positions
   * clamp to the far canvas edge and round to whole virtual px. */
  useEffect(() => {
    if (!guideDrag) return
    const posFrom = (e) => {
      const { vx, vy } = toVirtual(e.clientX, e.clientY)
      return Math.round(guideDrag.axis === 'h' ? vy : vx)
    }
    const onMove = (e) => setGuideDrag((d) => d && { ...d, pos: posFrom(e) })
    const onUp = (e) => {
      const pos = posFrom(e)
      const { axis, index } = guideDrag
      const max = axis === 'h' ? Math.round(geomRef.current?.vh ?? 0) : virtualWidth
      setGuides((g) => {
        const arr = [...g[axis]]
        if (pos < 0) {
          if (index != null) arr.splice(index, 1)   /* dropped on the ruler → delete */
        } else if (index == null) {
          arr.push(Math.min(pos, max))
        } else {
          arr[index] = Math.min(pos, max)
        }
        return { ...g, [axis]: arr }
      })
      setGuideDrag(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [guideDrag, toVirtual, setGuides, virtualWidth])

  if (!geom || geom.pxPer <= 0) return null
  const screenFor = (axis, pos) =>
    axis === 'h' ? geom.top + pos * geom.pxPer : geom.left + pos * geom.pxPer
  const canGrab = interactive && !guideDrag
  const grab = (axis, index, pos) => (e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    setGuideDrag({ axis, index, pos })
  }

  return (
    /* z-[3]: under the rulers (zIndex 4), above the transform layer (canvas
       content). pointer-events-none wrapper — only the slop zones re-enable. */
    <div className="absolute inset-0 pointer-events-none z-[3]">
      {guides.h.map((y, i) => (
        guideDrag?.axis === 'h' && guideDrag.index === i ? null : (
          <GuideLine
            key={`gh-${i}`} axis="h" screenPos={screenFor('h', y)}
            interactive={canGrab} onGrab={grab('h', i, y)}
          />
        )
      ))}
      {guides.v.map((x, i) => (
        guideDrag?.axis === 'v' && guideDrag.index === i ? null : (
          <GuideLine
            key={`gv-${i}`} axis="v" screenPos={screenFor('v', x)}
            interactive={canGrab} onGrab={grab('v', i, x)}
          />
        )
      ))}
      {guideDrag && (
        <>
          <GuideLine
            axis={guideDrag.axis}
            screenPos={screenFor(guideDrag.axis, guideDrag.pos)}
            interactive={false}
          />
          {/* Full-viewport cursor shield — keeps the row/col-resize cursor
              while the pointer roams outside the dragged line's slop zone. */}
          <div
            className="absolute inset-0"
            style={{
              cursor: guideDrag.axis === 'h' ? 'row-resize' : 'col-resize',
              pointerEvents: 'auto',
            }}
          />
        </>
      )}
    </div>
  )
}
