import { useEffect, useMemo, useRef, useState } from 'react'
import { useComposeState } from '../compose/state'
import { buildLayersSvg } from '../compose/build'

const THUMB_W = 200

/* The visible part of the frame, as fractions of the frame (left, top, width, height). */
function visibleRegion() {
  const frame = document.querySelector('main.kol-editor-canvas [data-canvas-frame]')
  const pane = document.querySelector('main.kol-editor-canvas')
  if (!frame || !pane) return null
  const F = frame.getBoundingClientRect(), M = pane.getBoundingClientRect()
  if (!F.width || !F.height) return null
  return { x: (M.left - F.left) / F.width, y: (M.top - F.top) / F.height, w: M.width / F.width, h: M.height / F.height, fw: F.width }
}

/**
 * NavigatorPanel — the whole frame as a thumbnail with the visible viewport as a rectangle (G7 —
 * Affinity's Navigator). Drag the rectangle to pan. The pan goes to the DS viewport the way the
 * Hand tool's does — as wheel deltas — so there is one pan state, the viewport's own.
 */
export default function NavigatorPanel() {
  const { layers, palette, aspect, canvasRatio, canvasW, canvasH } = useComposeState()
  const ratio = canvasW && canvasH ? canvasW / canvasH : 1
  const thumbH = Math.round(THUMB_W / ratio)
  const src = useMemo(() => {
    try {
      const svg = buildLayersSvg({ layers, palette, aspect, customRatio: canvasRatio, canvasW, canvasH })
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    } catch { return null }
  }, [layers, palette, aspect, canvasRatio, canvasW, canvasH])

  /* the viewport moves under zoom, wheel and the Hand — poll it while the panel is open */
  const [view, setView] = useState(visibleRegion)
  useEffect(() => {
    const id = setInterval(() => setView(visibleRegion()), 100)
    return () => clearInterval(id)
  }, [])

  const drag = useRef(null)
  const onDown = (e) => {
    e.preventDefault()
    drag.current = { x: e.clientX, y: e.clientY }
    const stage = document.querySelector('main.kol-editor-canvas [data-tool]')
    const move = (ev) => {
      const r = visibleRegion()
      if (!r || !drag.current) return
      const k = r.fw / THUMB_W   /* thumbnail px → screen px of the frame */
      const dx = (ev.clientX - drag.current.x) * k, dy = (ev.clientY - drag.current.y) * k
      drag.current = { x: ev.clientX, y: ev.clientY }
      stage?.dispatchEvent(new WheelEvent('wheel', { deltaX: dx, deltaY: dy, bubbles: true, cancelable: true }))
    }
    const up = () => { drag.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div className="relative overflow-hidden rounded border border-oq-08 bg-surface-secondary" style={{ width: THUMB_W, height: thumbH }}>
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
  )
}
