import { useEffect } from 'react'
import { LayerStackBody, LayerActions } from '../../compose/LayerStack'
import AssetsBody from '../../compose/AssetsBody'
import HistoryPanel from '../../compose/HistoryPanel'
import NavigatorPanel from '../NavigatorPanel'
import { StrokeBody } from '../../color/StrokePanel'
import { ColourBody } from '../../color/ColourPanel'
import { SwatchesBody } from '../../color/SwatchesPanel'
import { useColorTarget } from '../../color/useColorTarget'
import InspectorRail from '../../compose/InspectorRail'
import ParametersPanel from '../../compose/inspectors/ParametersPanel'
import PatternPanel from '../../compose/inspectors/PatternPanel'
import { useComposeState } from '../../compose/state'
import { findLayerDeep } from '../../compose/helpers'
import { pack } from '../../packs'
import { openTab } from '../../state/workspace'

/**
 * THE COMPOSE TABS (plan 31 § 4, § 6) — every tab the editor's rails can show, each a body and a
 * default pane. The workspace record decides where each one sits; `Pane` renders whatever sits
 * together. The three panel components that owned these tabs (LayersAssetsPanel · ColorModal ·
 * SelectionPalettePanel) retired to `_tmp/2026-10-13-plan-31/`.
 */
export const composePanes = [
  { id: 'color',     side: 'left',  order: -1, active: 'Colour' },
  { id: 'layers',    side: 'left',  order: 0 },
  { id: 'selection', side: 'right', order: 0 },
]

/* a row's right-click opens the canvas's layer menu (CanvasArea listens) */
function LayersTab() {
  return (
    <div onContextMenu={(e) => {
      const id = e.target.closest?.('[data-layer-id]')?.dataset?.layerId
      if (!id || id === 'canvas') return
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('kol:layer-context', { detail: { id, x: e.clientX, y: e.clientY } }))
    }}>
      <LayerStackBody />
    </div>
  )
}

/* bound to the active color target (canvas fill or the selected layer's paint); the None chip clears */
function SwatchesTab() {
  const target = useColorTarget()
  return <SwatchesBody onPick={(hex) => target.onChange(hex ? hex.toUpperCase() : null)} currentHex={target.hex} />
}

/* Effects is the effects pack's tab (editor/packs.js) — registered only when the pack is */
function EffectsTab() {
  const EffectsPanel = pack('effects')?.EffectsPanel
  return EffectsPanel ? <EffectsPanel /> : null
}

/* built at first render, not at import — packs register as their modules load */
/* the id stays `Colour` (every opener passes it); the label is the ruling's spelling */
export const composeTabs = () => [
  { tab: 'Layers',     label: 'Layers',     pane: 'layers',    order: 0, Component: LayersTab, Footer: LayerActions },
  { tab: 'Assets',     label: 'Assets',     pane: 'layers',    order: 1, Component: AssetsBody },
  { tab: 'History',    label: 'History',    pane: 'layers',    order: 2, Component: HistoryPanel },
  { tab: 'Navigator',  label: 'Navigator',  pane: 'layers',    order: 3, Component: NavigatorPanel },
  { tab: 'Stroke',     label: 'Stroke',     pane: 'color',     order: 0, Component: StrokeBody },
  { tab: 'Colour',     label: 'Color',      pane: 'color',     order: 1, Component: ColourBody },
  { tab: 'Swatches',   label: 'Swatches',   pane: 'color',     order: 2, Component: SwatchesTab },
  /* Color Modes is a tool window now, not a tab here (plan 39 § 4.1 — `color/ColorModesWindow`) */
  { tab: 'Inspector',  label: 'Inspector',  pane: 'selection', order: 0, Component: InspectorRail },
  { tab: 'Parameters', label: 'Parameters', pane: 'selection', order: 1, Component: ParametersPanel },
  ...(pack('effects') ? [{ tab: 'Effects', label: 'Effects', pane: 'selection', order: 2, Component: EffectsTab }] : []),
  /* the selection-driven tab: a pattern layer's own mode surface, offered only while one is selected */
  { tab: 'Pattern',    label: 'Pattern',    pane: 'selection', order: 3, Component: PatternPanel, when: ({ layer }) => layer?.type === 'pattern' },
]

/* what a tab's `when` reads — the shell calls this once per rail render */
export function useTabContext() {
  const { selectedId, layers } = useComposeState()
  const layer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  return { layer }
}

/**
 * The openers, store-side, so a tab works wherever it was dropped: `kol:open-tab` (Window › …),
 * `kol:open-color-pane` (the inspector's Fill / Stroke swatches, spec R6.6), `kol:open-params` /
 * `-effects` / `-pattern` (the inspector's pointer rows), and the auto-flip — selecting a real layer
 * shows Inspector (Canvas-row clicks are skipped — selecting Canvas means frame editing).
 */
export function WorkspaceEffects() {
  const { selectedId } = useComposeState()
  useEffect(() => {
    if (selectedId && selectedId !== 'canvas') openTab('Inspector')
  }, [selectedId])
  useEffect(() => {
    const onTab = (e) => openTab(e.detail?.tab)
    const onColor = (e) => openTab(e.detail?.tab ?? 'Colour')
    const onParams = () => openTab('Parameters')
    const onEffects = () => openTab('Effects')
    const onPattern = () => openTab('Pattern')
    window.addEventListener('kol:open-tab', onTab)
    window.addEventListener('kol:open-color-pane', onColor)
    window.addEventListener('kol:open-params', onParams)
    window.addEventListener('kol:open-effects', onEffects)
    window.addEventListener('kol:open-pattern', onPattern)
    return () => {
      window.removeEventListener('kol:open-tab', onTab)
      window.removeEventListener('kol:open-color-pane', onColor)
      window.removeEventListener('kol:open-params', onParams)
      window.removeEventListener('kol:open-effects', onEffects)
      window.removeEventListener('kol:open-pattern', onPattern)
    }
  }, [])
  return null
}
