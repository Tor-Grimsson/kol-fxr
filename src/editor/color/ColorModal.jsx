import { TabsRow } from '@kolkrabbi/kol-component'
import { useEffect, useState } from 'react'
import { StrokeBody }   from './StrokePanel'
import { ColourBody }   from './ColourPanel'
import { SwatchesBody } from './SwatchesPanel'
import { useColorTarget } from './useColorTarget'

/**
 * ColorModal — combined panel: TabsRow + active body in a single shell.
 *
 * Bound to the active color target (canvas fill or selected layer color) via
 * `useColorTarget`. Each body reads/writes through that target so picking a
 * swatch, dragging a hue strip, or adjusting a slider mutates the same value.
 */
/* the id stays `Colour` (callers pass it as defaultTab); the label is the ruling's spelling */
const COLOR_TABS = ['Stroke', 'Colour', 'Swatches'].map((t) => ({ id: t, label: t === 'Colour' ? 'Color' : t }))

export default function ColorModal({ defaultTab = 'Colour', onClose, onMinimise }) {
  const [tab, setTab] = useState(defaultTab)
  const target = useColorTarget()
  /* the inspector's Fill / Stroke swatches open this pane on a tab (spec R6.6) */
  useEffect(() => {
    const on = (e) => setTab(e.detail?.tab ?? 'Colour')
    window.addEventListener('kol:open-color-pane', on)
    return () => window.removeEventListener('kol:open-color-pane', on)
  }, [])

  const onPickSwatch = (hex) => {
    target.onChange(hex.toUpperCase())
  }

  return (
    <div
      className="bg-surface-primary overflow-hidden border-b border-oq-08 flex flex-col"
      style={{ height: 320 }}
    >
      <div className="border-b border-oq-08 shrink-0">
        <div className="px-3"><TabsRow tabs={COLOR_TABS} value={tab} onChange={setTab} onClose={onClose} onMinimise={onMinimise} /></div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        {tab === 'Stroke'   && <StrokeBody />}
        {tab === 'Colour'   && <ColourBody />}
        {tab === 'Swatches' && <SwatchesBody onPick={onPickSwatch} />}
      </div>
    </div>
  )
}
