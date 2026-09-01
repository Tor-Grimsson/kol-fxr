import { useEffect } from 'react'
import { Button } from '@kolkrabbi/kol-component'
import { GENERATIVE_TREE } from '../../loops/taxonomy'
import { GROUP_ICONS } from '../labs/catalog'
import { transport } from '../params/transport'

/* Full-width card row: label pinned left, glyph pinned right (Button centers
 * its content span by default — stretch it and spread). */
export const SPREAD = 'w-full [&>span]:w-full [&>span]:justify-between'

/**
 * Sheet chrome shared by every full-screen mobile picker: Esc closes, and
 * playback pauses while the sheet covers the canvas (resuming only if it was
 * running). Extracted 2026-08-27 when EffectScreen needed the same pair —
 * two copies of the transport dance is one place to forget to resume.
 */
export function useSheetChrome(close) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])
  useEffect(() => {
    const wasPlaying = transport.isPlaying()
    transport.pause()
    return () => { if (wasPlaying) transport.play() }
  }, [])
}

/* The ONE generator list. Entry flow (MobileView) and the live view's
 * category switch (MobileOverlay) render this card IDENTICALLY (user ruling
 * 2026-08-12 — the overlay's inline twin and its Cancel variant are gone):
 * generators, Insert, Back. Callers decide what Insert/Back mean. */
export default function CategoryScreen({ onPick, onInsert, onBack, onDismiss }) {
  /* Esc closes the sheet. onDismiss when closing ≠ Back (the overlay flow:
   * Back restarts, Esc just closes); defaults to onBack. */
  const close = onDismiss ?? onBack
  useSheetChrome(close)
  return (
    <div className="fixed inset-y-0 right-0 left-[var(--fxr-rail,0px)] kol-overlay-scrim flex flex-col items-center overflow-y-auto p-6" style={{ zIndex: 'var(--kol-z-modal)' }}>
      <div
        className="my-auto w-full max-w-sm rounded p-8 flex flex-col gap-6"
        style={{ background: 'var(--kol-surface-primary)' }}
      >
        <div className="kol-eyebrow text-body">Pick a generator</div>
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
          {onBack && <Button variant="grey" size="lg" className={SPREAD} iconLeft="arrow-left" iconRight="arrow-left" onClick={onBack}>Back</Button>}
        </div>
      </div>
    </div>
  )
}
