import { useState } from 'react'
import { Button, Tooltip } from '@kolkrabbi/kol-component'
import TransportBar from './TransportBar'
import { useTransport } from './transport'
import { useControlSize } from './controlSize'

/**
 * TransportFab — the transport folded into one floating button on a phone (plan 15 § 2; the user:
 * "a full circle icon container … with the play icon … you dont need it visual all the time").
 *
 * One round button in the canvas's bottom-right corner (`canvas.overlay`): tap = play / pause.
 * The chevron beside it opens the transport sheet — the same fixed bar the footer's ▶ cell used to
 * raise (loop length, stop, rewind) — and the sheet's × closes it. The footer's row is Output ·
 * File only on touch, so the sheet's bottom row is one control shorter. Dragging the button: not
 * now — only if the fixed corner proves to be in the way.
 */
export default function TransportFab() {
  const cs = useControlSize()
  const { playing, play, pause } = useTransport()
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="absolute right-3 bottom-3 z-10 flex items-center gap-2">
        <Tooltip label="Transport">
          <Button tone="ghost" size="md" radius="full" iconOnly="chevron-up" aria-label="Open the transport" aria-expanded={open} onClick={() => setOpen((o) => !o)} />
        </Tooltip>
        <Tooltip label={playing ? 'Pause' : 'Play'} shortcut="Space">
          <Button tone="primary" size="lg" radius="full" iconOnly={playing ? 'pause' : 'play'} aria-label={playing ? 'Pause' : 'Play'} onClick={playing ? pause : play} />
        </Tooltip>
      </div>
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 flex items-center gap-3 border-t border-oq-08 bg-surface-primary px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          /* over the sheet it rises from, UNDER the shell's nav drawer and its scrim (kol-shell:
             the scrim is sticky − 1) */
          style={{ zIndex: 'calc(var(--kol-z-sticky) - 2)' }}
        >
          <div className="flex-1 min-w-0"><TransportBar size={cs} /></div>
          <Tooltip label="Close transport"><Button variant="nav" size={cs} iconOnly="x" aria-label="Close transport" onClick={() => setOpen(false)} /></Tooltip>
        </div>
      )}
    </>
  )
}
