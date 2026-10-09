import { LayerStack as DsLayerStack, AddLayerButton as DsAddLayerButton, BLEND_MODES, Button, Tooltip } from '@kolkrabbi/kol-component'
import { useComposeState, layerTypes } from './state'
import { findLayerDeep } from './helpers'
import { useControlSize } from '../params/controlSize'
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
  path:       'pen',
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

/* The layer verbs, in a bar under the list (spec R2.3 — the user's 20; Figma and Affinity put
 * delete below the layers). Delete · duplicate · lock · hide act on the selection; the
 * canvas row is never a target; group is the stack's own ≥2-selected button. A footer slot on the DS LayerStack is owed (plan 17) — until then
 * the bar sits under it in the same pane. */
export function LayerActions() {
  const cs = useControlSize()
  const {
    selectedIds, layers, deleteSelected, duplicateLayer, toggleLayer, toggleLayerLock,
  } = useComposeState()
  const ids = (selectedIds ?? []).filter((id) => id !== 'canvas')
  const sel = ids.map((id) => findLayerDeep(layers, id)).filter(Boolean)
  const none = sel.length === 0
  const hidden = !none && sel.every((l) => l.visible === false)
  const locked = !none && sel.every((l) => l.locked)
  const act = (label, icon, onClick, { disabled = none, pressed } = {}) => (
    <Tooltip key={label} label={label}>
      <Button tone="ghost" quiet size={cs} iconOnly={icon} aria-label={label} pressed={pressed} disabled={disabled} onClick={onClick} />
    </Tooltip>
  )
  return (
    <div className="flex items-center gap-1 px-3 py-1 border-t border-oq-08">
      {act(hidden ? 'Show' : 'Hide', hidden ? 'eye-off' : 'eye-on', () => sel.forEach((l) => toggleLayer(l.id)), { pressed: hidden })}
      {act(locked ? 'Unlock' : 'Lock', locked ? 'lock' : 'unlock', () => sel.forEach((l) => toggleLayerLock(l.id)), { pressed: locked })}
      <span className="flex-1" />
      {act('Duplicate', 'copy', () => sel.forEach((l) => duplicateLayer(l.id)))}
      {act('Delete', 'trash', deleteSelected)}
    </div>
  )
}

export default function LayerStack() { return <LayerStackBody /> }
