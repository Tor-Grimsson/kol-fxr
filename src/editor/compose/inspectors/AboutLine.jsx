import { useRef } from 'react'
import { Button } from '@kolkrabbi/kol-component'
import { aboutOf } from '../../../loops/about'
import { useControlSize } from '../../params/controlSize'

/** WHAT THIS IS (plan 49 6.1): kind · engine · 2D/3D, then what it is built on — behind an "i" at the end of the
 * picking row, never a block in the rail (user 2026-11-03: *"a simple i for information button with information
 * rather then a manditory field always in view"*). The text opens in a native popover: tap or Esc closes it. */
export default function AboutLine({ def, isFilter = false }) {
  const pop = useRef(null)
  const cs = useControlSize()
  const a = aboutOf(def, isFilter)
  if (!a) return null
  return (
    <>
      <Button size={cs} tone="ghost" iconOnly="info" aria-label="About this preset" onClick={() => pop.current?.togglePopover()} />
      <div ref={pop} popover="auto" className="m-auto w-[min(320px,calc(100vw-32px))] rounded-[var(--kol-radius-sm)] border-0 bg-surface-primary p-4 text-body shadow-[var(--kol-shadow-rail-up)]">
        <p className="kol-eyebrow text-meta">{a.kind} · {a.engine} · {a.dimension}</p>
        {a.basis && <p className="kol-sans-body-03 mt-2">{a.basis}</p>}
      </div>
    </>
  )
}
