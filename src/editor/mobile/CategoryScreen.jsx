import { useEffect } from 'react'
import { Button } from '@kolkrabbi/kol-component'
import { GENERATIVE_TREE } from '../../loops/taxonomy'
import { GROUP_ICONS } from '../labs/LabsNav'
import { transport } from '../params/transport'

/* Full-width card row: label pinned left, glyph pinned right (Button centers
 * its content span by default — stretch it and spread). */
export const SPREAD = 'w-full [&>span]:w-full [&>span]:justify-between'

/* The ONE generator list. Entry flow (MobileView) and the live view's
 * category switch (MobileOverlay) render this card IDENTICALLY (user ruling
 * 2026-08-12 — the overlay's inline twin and its Cancel variant are gone):
 * generators, Insert, Back. Callers decide what Insert/Back mean. */
export default function CategoryScreen({ onPick, onInsert, onBack, onDismiss }) {
  /* Esc closes the sheet. onDismiss when closing ≠ Back (the overlay flow:
   * Back restarts, Esc just closes); defaults to onBack. */
  const close = onDismiss ?? onBack
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])
  /* Playback stops while the sheet is open; resumes on close if it was
   * running (user 2026-08-12). */
  useEffect(() => {
    const wasPlaying = transport.isPlaying()
    transport.pause()
    return () => { if (wasPlaying) transport.play() }
  }, [])
  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center overflow-y-auto bg-black/60 p-6 backdrop-blur-sm">
      <div
        className="my-auto w-full max-w-sm rounded p-8 flex flex-col gap-6"
        style={{ background: 'var(--kol-surface-primary)' }}
      >
        <div className="kol-helper-12 text-meta">Pick a generator</div>
        <div className="flex flex-col gap-2">
          {GENERATIVE_TREE.map((entry) => {
            const icon = GROUP_ICONS[`gen:${entry.label}`] ?? 'square'
            return (
              <Button
                key={entry.label}
                variant="primary"
                size="lg"
                className={SPREAD}
                iconLeft={icon}
                iconRight={icon}
                onClick={() => onPick(entry)}
              >
                {entry.label}
              </Button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2">
          {onInsert && (
            <Button variant="grey" size="lg" className={SPREAD} iconLeft="image" iconRight="image" onClick={onInsert}>
              Insert image or video
            </Button>
          )}
          <Button variant="grey" size="lg" className={SPREAD} iconLeft="arrow-left" iconRight="arrow-left" onClick={onBack}>Back</Button>
        </div>
      </div>
    </div>
  )
}
