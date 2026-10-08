import { useRef } from 'react'
import { Icon } from '@kolkrabbi/kol-icons'
import { Button } from '@kolkrabbi/kol-component'

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
    <div className="pointer-events-none fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[var(--fxr-rail,0px)] right-0 z-10 flex flex-wrap-reverse gap-2 px-3 [&>*]:pointer-events-auto">
      <Button tone={tone} size={size} onClick={onOpen}>
        <span className="flex items-center gap-2">
          {label}
          <Icon name="chevron-down" size={16} className="rotate-180" />
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
 * 24px row for the 24px hit box, the line itself 36×4 in opaque oq ink. Tap only — drag is the
 * upgrade if the tap is not enough (ponytail). */
export const SHEET_H = { half: '50dvh', tall: '85dvh' }
export function SheetGrab({ tall, onToggle, onDrag }) {
  /* …AND IT DRAGS (2026-10-06, the user: "draggable handle is not draggable"): a vertical pull of
     more than 32px fires `onDrag(-1 | 1)` on release, up or down, and the tap is then swallowed;
     a shorter move is a tap. Pointer capture, so the finger may leave the line. */
  const drag = useRef({ y: null, moved: false, swallow: false }).current
  const down = (e) => { drag.y = e.clientY; drag.moved = false; e.currentTarget.setPointerCapture?.(e.pointerId) }
  const move = (e) => { if (drag.y !== null && Math.abs(e.clientY - drag.y) > 32) drag.moved = true }
  const up = (e) => {
    if (drag.y === null) return
    const dy = e.clientY - drag.y; drag.y = null
    if (drag.moved && onDrag) { onDrag(dy < 0 ? -1 : 1); drag.swallow = true }
  }
  const click = () => { if (drag.swallow) { drag.swallow = false; return } onToggle?.() }
  return (
    <button
      type="button"
      aria-label={tall ? 'Lower the sheet' : 'Raise the sheet'}
      aria-pressed={tall}
      className="flex h-6 w-full shrink-0 touch-none items-center justify-center"
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
