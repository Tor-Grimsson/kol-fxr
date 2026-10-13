import { useState } from 'react'
import { LayerStackBody, LayerActions } from '../../compose/LayerStack'
import AssetsBody from '../../compose/AssetsBody'
import HistoryPanel from '../../compose/HistoryPanel'
import NavigatorPanel from '../NavigatorPanel'
import { useOpenTab } from '../openTab'
import PaneHeader from './PaneHeader'

/* History joins as the third tab (G6) — the undo stack beside the layers it rewinds */
/* Navigator joins beside History (plan 24 § 7, restored by plan 29 § 2 — Affinity groups them) */
const TABS = ['Layers', 'Assets', 'History', 'Navigator']

/**
 * LayersAssetsPanel — left.body. Two tabs (Layers · Assets) sharing one
 * shell. Layers tab shows the live layer stack; Assets tab is a library of
 * draggable / clickable assets (logos for now; templates + layouts later).
 * The add-layer button rides the footer bar with duplicate and delete (Affinity; plan 30 § 8).
 */
export default function LayersAssetsPanel() {
  const [tab, setTab] = useState('Layers')
  useOpenTab(TABS, setTab)

  return (
    <div className="kol-compose-rail border-b border-oq-08">
      <PaneHeader tabs={TABS.map((t) => ({ id: t, label: t }))} value={tab} onChange={setTab} />
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
        {tab === 'Navigator' && <NavigatorPanel />}
      </div>
      {tab === 'Layers' && <LayerActions />}
    </div>
  )
}
