import { useState } from 'react'
import { Button } from '@kolkrabbi/kol-component'
import { useRailExtras } from '../../railExtras'
import { SPREAD, useSheetChrome } from '../mobile/CategoryScreen'

/**
 * THE WAY IN (2026-10-05/06, decided on the recommendation for review; the user: "what is the
 * user doing in here, he has to start by opening the left modal"). Labs opens on this card over
 * the stage — the randomiser's entry card, with labs' catalog in it: the SAME rows LabsNav
 * publishes to the shell rail (`railExtras`), so there is one catalog, read twice. Sections first,
 * a section's groups after a tap, Back between; a pick runs the row's action and the card goes.
 * Effects and Vector then ask for their media (LabsSourceCard). Modulation is not a door — its one
 * row only opens the params, because modulation lives on every parameter's bind dot — so it is
 * left out here and stays on the rail.
 */
export default function LabsCatalogCard({ onPicked, onClose }) {
  const { items, dispatch } = useRailExtras()
  const [open, setOpen] = useState(null)
  useSheetChrome(onClose)
  const doors = items.filter((i) => i.path !== '#rail/sec:modulation')
  const section = doors.find((i) => i.path === open) ?? null
  const rows = section ? section.sub : doors
  return (
    /* On a phone the card starts UNDER the top bar (`top-12`), so the hamburger stays reachable;
       a tap on the scrim closes it (audit A14 — the card trapped the phone: nav, sheet and
       transport all under its scrim, no way out but a pick). */
    <div className="fixed bottom-0 top-12 md:top-0 right-0 left-[var(--fxr-rail,0px)] kol-overlay-scrim flex flex-col items-center overflow-y-auto p-6" style={{ zIndex: 'var(--kol-z-modal)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="my-auto w-full max-w-sm rounded p-8 flex flex-col gap-6" style={{ background: 'var(--kol-surface-primary)' }}>
        <span className="kol-eyebrow text-body">{section ? section.label : 'Labs'}</span>
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <Button
              key={row.path}
              tone="primary"
              size="lg"
              className={SPREAD}
              iconLeft={row.icon}
              iconRight={row.icon}
              onClick={() => {
                if (!section && row.sub?.length) { setOpen(row.path); return }
                if (dispatch?.(row.path)) onPicked?.()
              }}
            >
              {row.label}
            </Button>
          ))}
          {section && (
            <Button tone="grey" size="lg" className={SPREAD} iconLeft="arrow-left" iconRight="arrow-left" onClick={() => setOpen(null)}>
              Back
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
