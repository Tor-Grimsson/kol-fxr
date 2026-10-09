import { useEffect, useState } from 'react'
import { TabsRow } from '@kolkrabbi/kol-component'
import { useComposeState } from '../../compose/state'
import { findLayerDeep } from '../../compose/helpers'
import InspectorRail from '../../compose/InspectorRail'
import ParametersPanel from '../../compose/inspectors/ParametersPanel'
import { pack } from '../../packs'
import PatternPanel from '../../compose/inspectors/PatternPanel'

/* Effects is the effects pack's tab (editor/packs.js) — offered only when it is registered. */
const baseTabs = () => (pack('effects') ? ['Inspector', 'Parameters', 'Effects'] : ['Inspector', 'Parameters'])

/**
 * SelectionPalettePanel — right.body. Three fixed tabs sharing one shell —
 * Inspector (high-level layer surface, default) · Parameters (schema-driven
 * per-type controls) · Effects (category → filter picker + params) — plus a
 * selection-driven fourth: Pattern (pattern layer selected), the harvested
 * mode surface bound to the layer's own props. It appends at the end so the
 * fixed three never shift. Text has no tab — its surface renders inside the
 * Inspector (the 2026-08-12 inspector ruling). Palette editing left the
 * rail (palette modal).
 *
 * Auto-flip: when the user selects a real layer, the active tab flips to
 * Inspector (Canvas-row clicks are skipped — selecting Canvas means frame
 * editing). Inspector pointer rows dispatch `kol:open-params` /
 * `kol:open-effects` / `kol:open-pattern` to flip here.
 */
export default function SelectionPalettePanel() {
  const { selectedId, layers } = useComposeState()
  const [tab, setTab]  = useState('Inspector')
  const EffectsPanel = pack('effects')?.EffectsPanel

  /* Same layer resolution as ParametersPanel/EffectsPanel — in multi-select
   * the first selected layer drives the panels, so it gates the tab too. */
  const layer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const tabs = layer?.type === 'pattern' ? [...baseTabs(), 'Pattern'] : baseTabs()

  /* Selection changes can strand the active tab (Pattern active, then a
   * shape selected / deselect-all) — fall back without writing state. */
  const active = tabs.includes(tab) ? tab : 'Inspector'

  useEffect(() => {
    if (selectedId && selectedId !== 'canvas') setTab('Inspector')
  }, [selectedId])

  useEffect(() => {
    const openParams  = () => setTab('Parameters')
    const openEffects = () => setTab('Effects')
    const openPattern = () => setTab('Pattern')
    window.addEventListener('kol:open-params', openParams)
    window.addEventListener('kol:open-effects', openEffects)
    window.addEventListener('kol:open-pattern', openPattern)
    return () => {
      window.removeEventListener('kol:open-params', openParams)
      window.removeEventListener('kol:open-effects', openEffects)
      window.removeEventListener('kol:open-pattern', openPattern)
    }
  }, [])

  return (
    <div className="kol-compose-rail">
      {/* The tab row holds tabs only (spec R2.2, R3.3 — the user's 20): the ⋯ menu and the trash
        * that rode it moved to the toolbar, the Tools menu, the context menu and the Layers footer. */}
      <div className="pl-3 pr-2 border-b border-oq-08">
        <TabsRow tabs={tabs.map((t) => ({ id: t, label: t }))} value={active} onChange={setTab} />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
        {active === 'Inspector'  && <InspectorRail />}
        {active === 'Parameters' && <ParametersPanel />}
        {active === 'Effects'    && EffectsPanel && <EffectsPanel />}
        {active === 'Pattern'    && <PatternPanel />}
      </div>
    </div>
  )
}
