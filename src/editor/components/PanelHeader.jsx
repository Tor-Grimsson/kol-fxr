import { useRef } from 'react'
import { Icon } from '@kolkrabbi/kol-icons'
import { Button, useGrabEdge } from '@kolkrabbi/kol-component'

/**
 * THE CONTROL PANEL'S TWO STATES — one structure for labs and the generator (2026-10-05, the
 * user: "they opposite open, and they dont follow the same structure"). Labs hung its controls
 * off a top bar and a right drawer; the generator rose from the bottom. Both chromes now frame
 * their controls the same way per device — a rail on the right at a desk, a sheet from the bottom
 * on a phone — and both wear these two parts, so the frame cannot drift again:
 *
 *   PanelHeader — the panel's first row. The title IS the collapse control (label + chevron,
 *                 left); one optional action sits right.
 *   PanelPills  — collapsed: the row that stands in for the panel, bottom-left. Its first pill
 *                 reopens; the rest are the chrome's own shortcuts.
 *
 * They are the generator's header and pill (MobileOverlay, user rulings 2026-08-12 and
 * 2026-09-01), lifted out unchanged.
 */

export function PanelHeader({ title, onCollapse, action, className = 'px-3' }) {
  return (
    <div className={`flex w-full shrink-0 items-center ${className}`}>
      <button className="kol-helper-12 text-meta flex flex-1 items-center gap-2 py-2.5" onClick={onCollapse}>
        <span>{title}</span>
        {/* Real icon, opaque ink (the icons law — the header's text-meta alpha stays on the TEXT
            only). */}
        <Icon name="chevron-down" size={16} className="text-oq-48" />
      </button>
      {action}
    </div>
  )
}

/* The pill FIRST and the row LEFT-ANCHORED (user, 2026-09-01), `px-3` matching the header's inset,
 * so the label + chevron holds one x in both states. The row WRAPS UPWARD: three `lg` pills are
 * 440px on a 390 screen, and the last one ran off the edge — the pill keeps the bottom line and
 * what does not fit stacks above it. The row itself takes no taps; only its pills do. `tone` is
 * the pill's ground: `primary` over the generator's black stage, `grey` over labs' light one,
 * where a primary fill is the stage's own colour and the pill read as bare text. */
export function PanelPills({ label, onOpen, size = 'lg', tone = 'primary', children }) {
  return (
    /* ONE LINE (plan 18 § 1; the user: "buttons one line"): no wrap — the pill truncates, the
       actions are icons (MobileOverlay) and keep their width */
    <div className="pointer-events-none fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[var(--fxr-rail,0px)] right-0 z-10 flex flex-nowrap items-center gap-2 px-3 [&>*]:pointer-events-auto">
      <Button tone={tone} size={size} onClick={onOpen} className="min-w-0 shrink">
        <span className="flex items-center gap-2 min-w-0">
          <span className="truncate">{label}</span>
          <Icon name="chevron-down" size={16} className="rotate-180 shrink-0" />
        </span>
      </Button>
      {children}
    </div>
  )
}

/* THE SHEET RESTS AT TWO HEIGHTS (2026-10-05, decided on the recommendation for review — Apple's
 * two detents, a grabber that shows it and cycles them on a tap): HALF the display, the default,
 * and TALL (`--kol-sheet-h`: 50dvh · 85dvh). Labs' Style tab is four screens of controls in a
 * half sheet; tall is two. The grabber is the sheet's first row on a phone, above the header; a
 * 24px row for the 24px hit box, the line itself 36×4 in opaque oq ink.
 *
 * …AND IT RESIZES (plan 15 § 1, 2026-10-08; the user: "the fake handle there, that only works on
 * click, draggable to resize height"). The DS gesture, its two variants: `useGrabEdge` wakes the
 * estate's pill on pointer proximity and travels it along the line (`axis: 'x'` — a horizontal
 * edge), and the drag is `useDragResize`'s rule — pointer-up under the slop is a TAP (the detents
 * cycle), past it the sheet follows the finger LIVE through `onResize(px)` (the sheet's height from
 * the display's bottom), and `onResizeEnd(px)` lets the consumer snap or collapse. Pointer capture,
 * so the finger may leave the line. `onDrag(dir)` stays for a consumer that only wants the step. */
export const SHEET_H = { half: '50dvh', tall: '85dvh' }
export const SHEET_MIN = 96   /* released under this, the sheet collapses */
const SLOP = 4
export function SheetGrab({ tall, onToggle, onDrag, onResize, onResizeEnd }) {
  const ref = useRef(null)
  useGrabEdge(ref, { axis: 'x' })
  const drag = useRef({ y: null, h0: 0, moved: false, swallow: false, last: 0 }).current
  const down = (e) => {
    drag.y = e.clientY; drag.moved = false
    /* the sheet's live height: from the grab's own top to the display's bottom */
    drag.h0 = window.innerHeight - e.currentTarget.getBoundingClientRect().top
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const move = (e) => {
    if (drag.y === null) return
    const dy = e.clientY - drag.y
    if (Math.abs(dy) > SLOP) drag.moved = true
    if (drag.moved && onResize) { drag.last = drag.h0 - dy; onResize(drag.last) }
  }
  const up = (e) => {
    if (drag.y === null) return
    const dy = e.clientY - drag.y; drag.y = null
    if (!drag.moved) return
    drag.swallow = true
    if (onResize) onResizeEnd?.(drag.h0 - dy)
    else onDrag?.(dy < 0 ? -1 : 1)
  }
  const click = () => { if (drag.swallow) { drag.swallow = false; return } onToggle?.() }
  return (
    <button
      ref={ref}
      type="button"
      aria-label={tall ? 'Lower the sheet' : 'Raise the sheet'}
      aria-pressed={tall}
      className="kol-sheet-grab relative flex h-6 w-full shrink-0 touch-none items-center justify-center"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => { drag.y = null }}
      onClick={click}
    >
      <span className="h-1 w-9 rounded-full bg-oq-16" />
    </button>
  )
}
