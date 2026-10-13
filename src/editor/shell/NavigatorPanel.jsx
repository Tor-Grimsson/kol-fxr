import { useEffect, useRef, useState } from 'react'
import { Button, Slider } from '@kolkrabbi/kol-component'
import { useComposeState, resolveColor } from '../compose/state'
import { buildLayersSvg } from '../compose/build'
import { useZoom } from './zoomStore'

/* The visible part of the frame, as fractions of the frame (left, top, width, height). */
function visibleRegion() {
  const frame = document.querySelector('main.kol-editor-canvas [data-canvas-frame]')
  const pane = document.querySelector('main.kol-editor-canvas')
  if (!frame || !pane) return null
  const F = frame.getBoundingClientRect(), M = pane.getBoundingClientRect()
  if (!F.width || !F.height) return null
  return { x: (M.left - F.left) / F.width, y: (M.top - F.top) / F.height, w: M.width / F.width, h: M.height / F.height, fw: F.width }
}

/* zoom by `factor` about the canvas column's centre — the viewport's own `kol:zoom-at` seam */
function zoomBy(factor) {
  const pane = document.querySelector('main.kol-editor-canvas')?.getBoundingClientRect()
  if (!pane || !Number.isFinite(factor) || factor <= 0) return
  window.dispatchEvent(new CustomEvent('kol:zoom-at', { detail: { clientX: pane.left + pane.width / 2, clientY: pane.top + pane.height / 2, factor } }))
}

/**
 * NavigatorPanel — the left rail's Navigator tab (plan 24 § 7, restored by plan 29 § 2; Affinity's
 * Navigator): a zoom row (− · slider · +) over the whole frame as a thumbnail, the visible
 * viewport as a rectangle. Drag the rectangle to pan — as wheel deltas, the Hand tool's way, so
 * there is one pan state, the viewport's own.
 *
 * THE THUMBNAIL (plan 29 § 3): `buildLayersSvg` already snapshots every live layer canvas, so it
 * draws generators and effects; it was missing the CANVAS FILL (a black document read as an empty
 * box) and rebuilt only when `layers` changed (a moving loop froze). The fill is the box's own
 * background now, resolved as CanvasArea resolves it, and the snapshot re-takes at 2 fps while
 * the tab is mounted.
 */
export default function NavigatorPanel() {
  const { layers, palette, aspect, canvasRatio, canvasW, canvasH, canvasFill, canvasFillOpacity } = useComposeState()
  const zoom = useZoom()
  const ratio = canvasW && canvasH ? canvasW / canvasH : 1
  const fillRef = resolveColor(canvasFill, palette)
  const fill = fillRef
    ? (canvasFillOpacity < 1 ? `color-mix(in srgb, ${fillRef} ${Math.round(canvasFillOpacity * 100)}%, transparent)` : fillRef)
    : 'transparent'

  /* the snapshot — immediately on a change, then every 500 ms so a moving layer moves */
  const args = useRef(null)
  args.current = { layers, palette, aspect, customRatio: canvasRatio, canvasW, canvasH }
  const [src, setSrc] = useState(null)
  useEffect(() => {
    const take = () => {
      try { setSrc(`data:image/svg+xml;utf8,${encodeURIComponent(buildLayersSvg(args.current))}`) } catch { /* keep the last frame */ }
    }
    take()
    const id = setInterval(take, 500)
    return () => clearInterval(id)
  }, [layers, palette, aspect, canvasRatio, canvasW, canvasH])

  /* the viewport moves under zoom, wheel and the Hand — poll it while the tab is open */
  const [view, setView] = useState(visibleRegion)
  useEffect(() => {
    const id = setInterval(() => setView(visibleRegion()), 100)
    return () => clearInterval(id)
  }, [])

  const box = useRef(null)
  const drag = useRef(null)
  const onDown = (e) => {
    e.preventDefault()
    drag.current = { x: e.clientX, y: e.clientY }
    const stage = document.querySelector('main.kol-editor-canvas [data-tool]')
    const move = (ev) => {
      const r = visibleRegion()
      const bw = box.current?.getBoundingClientRect().width
      if (!r || !drag.current || !bw) return
      const k = r.fw / bw   /* thumbnail px → screen px of the frame */
      const dx = (ev.clientX - drag.current.x) * k, dy = (ev.clientY - drag.current.y) * k
      drag.current = { x: ev.clientX, y: ev.clientY }
      stage?.dispatchEvent(new WheelEvent('wheel', { deltaX: dx, deltaY: dy, bubbles: true, cancelable: true }))
    }
    const up = () => { drag.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const pct = Math.round(zoom * 100)
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Button tone="ghost" quiet size="sm" iconOnly="minus" aria-label="Zoom out" onClick={() => zoomBy(0.8)} />
        <Slider className="flex-1" min={10} max={800} step={1} value={Math.min(800, Math.max(10, pct))}
          onChange={(next) => zoomBy(next / pct)} formatValue={(v) => `${v}%`} />
        <Button tone="ghost" quiet size="sm" iconOnly="plus" aria-label="Zoom in" onClick={() => zoomBy(1.25)} />
      </div>
      {/* a fixed 200px stage, the frame centred and contained in it (Affinity's Navigator) — a
          full-width portrait thumbnail was taller than the pane and squeezed the Color pane */}
      <div className="flex items-center justify-center h-[200px]">
        <div ref={box} className="relative overflow-hidden rounded border border-oq-08"
          style={{ aspectRatio: ratio, width: `min(100%, ${Math.round(200 * ratio)}px)`, background: fill }}>
          {src && <img src={src} alt="" className="block w-full h-full" draggable={false} />}
        {view && (
          <div
            role="presentation"
            onPointerDown={onDown}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{
              left: `${view.x * 100}%`, top: `${view.y * 100}%`,
              width: `${view.w * 100}%`, height: `${view.h * 100}%`,
              outline: '1.5px solid var(--kol-accent-primary)',
              background: 'color-mix(in srgb, var(--kol-accent-primary) 8%, transparent)',
            }}
          />
        )}
        </div>
      </div>
    </div>
  )
}
