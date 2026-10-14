import { useRef } from 'react'
import { useGrabEdge } from '@kolkrabbi/kol-component'
import PaneHeader from './PaneHeader'
import { setActive, setPaneHeight, tabDef } from '../../state/workspace'

/* ponytail: the floor under a dragged pane is its header plus one row; a per-tab content minimum
   can come when a pane needs one */
const FLOOR = 40

/**
 * Pane — ONE component for every workspace pane (plan 31 § 6): the header with the pane's tabs (those
 * whose `when` holds), the active tab's body in a scrolling column, its footer pinned under that, and
 * the bottom-edge grab (§ 7). Which tabs sit here is the workspace record's; the tab bodies are the
 * registry's.
 */
export default function Pane({ pane, ctx }) {
  const defs = pane.tabs.map(tabDef).filter(Boolean)
  const visible = defs.filter((t) => !t.when || t.when(ctx))
  /* a gated-out active tab (Pattern with no pattern layer) falls back without writing state */
  const active = visible.find((t) => t.tab === pane.active) ?? visible[0]
  const Body = active?.Component
  const Footer = active?.Footer
  return (
    <div className="kol-compose-rail border-b border-oq-08">
      <PaneHeader tabs={visible.map((t) => ({ id: t.tab, label: t.label ?? t.tab }))} value={active?.tab} onChange={(t) => setActive(pane.id, t)} />
      {Body && <div className="flex-1 min-h-0 overflow-y-auto flex flex-col"><Body /></div>}
      {Footer && <Footer />}
      <PaneGrab pane={pane.id} />
    </div>
  )
}

/* THE PANE'S BOTTOM LINE IS A GRAB (plan 31 § 7; the user: "DRAG TO MAKE TALLER"). The estate's pill
 * (`useGrabEdge`, `axis: 'x'` — the pill travels the edge, the drag is y); pointer capture so the
 * pointer may leave the line. The height is written to the wrapper live and to the record on
 * release; a double-click lets the pane size to its content again. */
function PaneGrab({ pane }) {
  const ref = useRef(null)
  useGrabEdge(ref, { axis: 'x' })
  const d = useRef({ y: null, h0: 0, floor: 0, el: null, moved: false }).current
  const wrapper = () => ref.current?.closest('.kol-pane')
  const down = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    d.el = wrapper()
    if (!d.el) return
    d.y = e.clientY
    d.h0 = d.el.getBoundingClientRect().height
    d.floor = (d.el.querySelector('.kol-pane-header')?.offsetHeight ?? 40) + FLOOR
    d.moved = false
    e.currentTarget.setPointerCapture?.(e.pointerId)
    ref.current.classList.add('is-dragging')
  }
  const move = (e) => {
    if (d.y === null) return
    d.moved = true
    d.el.style.height = `${Math.max(d.floor, d.h0 + e.clientY - d.y)}px`
    d.el.style.flex = '0 0 auto'
    d.el.dataset.sized = 'true'
  }
  const up = () => {
    if (d.y === null) return
    d.y = null
    ref.current?.classList.remove('is-dragging')
    if (d.moved) setPaneHeight(pane, d.el.getBoundingClientRect().height)
  }
  const reset = () => {
    const el = wrapper()
    if (!el) return
    el.style.removeProperty('height')
    el.style.removeProperty('flex')
    delete el.dataset.sized
    setPaneHeight(pane, null)
  }
  return (
    <div ref={ref} className="kol-pane-grab" role="separator" aria-orientation="horizontal" aria-label="Resize pane" title="Drag to resize · double-click to reset"
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onDoubleClick={reset} />
  )
}
