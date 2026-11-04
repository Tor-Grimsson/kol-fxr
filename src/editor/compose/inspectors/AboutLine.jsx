import { useId } from 'react'
import { Button } from '@kolkrabbi/kol-component'
import { aboutOf } from '../../../loops/about'
import { useControlSize } from '../../params/controlSize'

/** WHAT THIS IS (plan 49 6.1): kind · engine · 2D/3D, then what it is built on — behind an "i" at the end of the
 * picking row, never a block in the rail (user 2026-11-03: *"a simple i for information button with information
 * rather then a manditory field always in view"*). The button wears its row's frame (the ‹ › beside it) and is the
 * popover's native invoker (`popoverTarget`), so a click toggles it — an `onClick` toggle lost to light dismiss,
 * which closed it on pointerdown and reopened it on click. Tap outside or Esc closes it too. */
export default function AboutLine({ def, isFilter = false }) {
  const id = useId()
  const cs = useControlSize()
  const a = aboutOf(def, isFilter)
  if (!a) return null
  return (
    <>
      <Button size={cs} iconOnly="info" aria-label="About this preset" popoverTarget={id} />
      <div id={id} popover="auto" className="m-auto w-[min(320px,calc(100vw-32px))] rounded-[var(--kol-radius-sm)] border-0 bg-surface-primary p-4 text-body shadow-[var(--kol-shadow-rail-up)]">
        <p className="kol-eyebrow text-meta">{a.kind} · {a.engine} · {a.dimension}</p>
        {a.basis && <p className="kol-sans-body-03 mt-2">{a.basis}</p>}
      </div>
    </>
  )
}
