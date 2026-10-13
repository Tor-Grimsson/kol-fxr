import PaneHeader from '../shell/panels/PaneHeader'
import { useEffect, useState } from 'react'
import { StrokeBody }   from './StrokePanel'
import { ColourBody }   from './ColourPanel'
import { SwatchesBody } from './SwatchesPanel'
import { useColorTarget } from './useColorTarget'

/**
 * ColorModal — combined panel: PaneHeader (plan 30 § 8) + active body in a single shell.
 *
 * Bound to the active color target (canvas fill or selected layer color) via
 * `useColorTarget`. Each body reads/writes through that target so picking a
 * swatch, dragging a hue strip, or adjusting a slider mutates the same value.
 */
/* the id stays `Colour` (callers pass it as defaultTab); the label is the ruling's spelling */
const COLOR_TABS = ['Stroke', 'Colour', 'Swatches'].map((t) => ({ id: t, label: t === 'Colour' ? 'Color' : t }))

export default function ColorModal({ defaultTab = 'Colour', onClose }) {
  const [tab, setTab] = useState(defaultTab)
  const target = useColorTarget()
  /* the inspector's Fill / Stroke swatches open this pane on a tab (spec R6.6) */
  useEffect(() => {
    const on = (e) => setTab(e.detail?.tab ?? 'Colour')
    window.addEventListener('kol:open-color-pane', on)
    return () => window.removeEventListener('kol:open-color-pane', on)
  }, [])

  const onPickSwatch = (hex) => {
    target.onChange(hex ? hex.toUpperCase() : null)  /* the None chip clears */
  }

  return (
    <div
      /* sized to its content (plan 30 § 14): a fixed 320 starved the Hue square to a 64px strip */
      className="bg-surface-primary overflow-hidden border-b border-oq-08 flex flex-col"
    >
      <PaneHeader tabs={COLOR_TABS} value={tab} onChange={setTab} onClose={onClose} />
      <div className="flex flex-col">
        {tab === 'Stroke'   && <StrokeBody />}
        {tab === 'Colour'   && <ColourBody />}
        {tab === 'Swatches' && <SwatchesBody onPick={onPickSwatch} currentHex={target.hex} />}
      </div>
    </div>
  )
}
