import { LayerStack as DsLayerStack, AddLayerButton as DsAddLayerButton, BLEND_MODES } from '@kolkrabbi/kol-component'
import { useComposeState, layerTypes } from './state'
import { rowLabelForLayer } from './labels'

/**
 * The layer stack — kol-component's `LayerStack` and `AddLayerButton` (lifted from this file,
 * editor-panels-the-held-specs; editor DS sync phase 3c, 2026-09-27 — this file was a 583-line
 * second copy with its own rows, drag and add menu). What is the editor's: the compose store, its
 * layer labels, the add menu's types and shape kinds, and the icon names.
 *
 * `BLEND_MODES` is re-exported for the inspector's Blend dropdown — it is KOL's list now.
 */
export { BLEND_MODES }

const TYPE_ICONS = {
  background: 'square',
  pattern:    'ptrn-dot',
  photo:      'image',
  shape:      'rectangle',
  text:       'type',
  group:      'layers',
  bool:       'layers',
  loop:       'refresh',
  misc:       'refresh',
  kinetic:    'type',
}
const iconFor = (type) => TYPE_ICONS[type] ?? 'rectangle'

/* Line is not here on purpose — a line is drawn with the pen (its endpoints carry direction a
 * default box can't). */
const SHAPE_KINDS = [
  { id: 'logo',     label: 'Logo',      icon: 'rectangle',   extras: {} },
  { id: 'rect',     label: 'Rectangle', icon: 'rectangle',     extras: { kind: 'rect' } },
  { id: 'ellipse',  label: 'Ellipse',   icon: 'circle',  extras: { kind: 'ellipse' } },
  { id: 'triangle', label: 'Triangle',  icon: 'triangle', extras: { kind: 'triangle' } },
  { id: 'polygon',  label: 'Polygon',   icon: 'polygon',  extras: { kind: 'polygon', sides: 5 } },
  { id: 'star',     label: 'Star',      icon: 'star',     extras: { kind: 'star', points: 5, innerRatio: 0.5 } },
]

/** The add menu — lives in the Layers / Assets tab row (LayersAssetsPanel). */
export function AddLayerButton() {
  const { addLayer } = useComposeState()
  return (
    <DsAddLayerButton
      types={layerTypes()}
      nested={{ typeId: 'shape', kinds: SHAPE_KINDS }}
      onAdd={(typeId, extras) => addLayer(typeId, extras)}
      iconFor={iconFor}
    />
  )
}

export function LayerStackBody() {
  const {
    selectedIds, select, selectCanvas, toggleSelection, groupLayers,
    layers, toggleLayer, toggleLayerLock, updateLayer, reparentLayer,
  } = useComposeState()
  return (
    <DsLayerStack
      layers={layers}
      selectedIds={selectedIds}
      canvasId="canvas"
      onSelect={select}
      onToggleSelect={toggleSelection}
      onSelectCanvas={selectCanvas}
      onToggleVisible={toggleLayer}
      onToggleLocked={toggleLayerLock}
      onRename={(id, name) => updateLayer(id, { name })}
      onReorder={reparentLayer}
      onGroup={groupLayers}
      labelFor={rowLabelForLayer}
      iconFor={iconFor}
    />
  )
}

export default function LayerStack() { return <LayerStackBody /> }
