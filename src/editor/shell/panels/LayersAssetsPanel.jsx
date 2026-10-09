import { TabsRow } from '@kolkrabbi/kol-component'
import { useState } from 'react'
import { LayerStackBody, AddLayerButton, LayerActions } from '../../compose/LayerStack'
import AssetsBody from '../../compose/AssetsBody'
import HistoryPanel from '../../compose/HistoryPanel'

/* History joins as the third tab (G6) — the undo stack beside the layers it rewinds */
const TABS = ['Layers', 'Assets', 'History']

/**
 * LayersAssetsPanel — left.body. Two tabs (Layers · Assets) sharing one
 * shell. Layers tab shows the live layer stack; Assets tab is a library of
 * draggable / clickable assets (logos for now; templates + layouts later).
 * The add-layer button rides the tab row (Framer model) — the stack itself
 * carries no chrome buttons.
 */
export default function LayersAssetsPanel() {
  const [tab, setTab] = useState('Layers')

  return (
    <div className="kol-compose-rail border-b border-oq-08">
      <div className="border-b border-oq-08 flex items-center pr-2">
        <div className="flex-1 min-w-0">
          <div className="px-3"><TabsRow tabs={TABS.map((t) => ({ id: t, label: t }))} value={tab} onChange={setTab} /></div>
        </div>
        {tab === 'Layers' && <AddLayerButton />}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* a row's right-click opens the canvas's layer menu (CanvasArea listens) */}
        {tab === 'Layers' && (
          <div onContextMenu={(e) => {
            const id = e.target.closest?.('[data-layer-id]')?.dataset?.layerId
            if (!id || id === 'canvas') return
            e.preventDefault()
            window.dispatchEvent(new CustomEvent('kol:layer-context', { detail: { id, x: e.clientX, y: e.clientY } }))
          }}>
            <LayerStackBody />
          </div>
        )}
        {tab === 'Assets' && <AssetsBody />}
        {tab === 'History' && <HistoryPanel />}
      </div>
      {tab === 'Layers' && <LayerActions />}
    </div>
  )
}
