import { LayerStack as DsLayerStack, AddLayerButton as DsAddLayerButton, BLEND_MODES, Button, Divider, MenuItem, Tooltip } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { canMask } from './masks'
import { AdjustmentRows, LiveFilterRows } from '../shell/LiveFilterRows'
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

/* THE LAYERS BAR (plan 32 § 2b; Affinity's, the user's reference 2026-10-13) — two groups like
 * Affinity's: ADD (+ Layer · Group) and APPLY-TO-THIS-LAYER (FX · Mask · Adjustment ▾ · Live Filter ▾),
 * then Duplicate · Delete. Eye and lock left the bar: each row carries its own eye, and lock is a Layer
 * menu verb with a key. Affinity's Edit All Layers has no counterpart (one selection model) and its
 * Pixel Layer waits on painting (plan 32 § N). The canvas row is never a target. */
const BAR_MENU = 'kol-editor-menu z-[var(--kol-z-tooltip)]'
export function LayerActions() {
  const cs = useControlSize()
  const {
    selectedIds, layers, deleteSelected, duplicateLayer, groupLayers, addLayer, updateLayer,
    beginTransaction, commitTransaction,
  } = useComposeState()
  const ids = (selectedIds ?? []).filter((id) => id !== 'canvas')
  const sel = ids.map((id) => findLayerDeep(layers, id)).filter(Boolean)
  const none = sel.length === 0
  const one = sel.length === 1 ? sel[0] : null
  const act = (label, icon, onClick, { disabled = none } = {}) => (
    <Tooltip key={label} label={label}>
      <Button tone="ghost" quiet size={cs} iconOnly={icon} aria-label={label} disabled={disabled} onClick={onClick} />
    </Tooltip>
  )
  /* MASK (masks.js, G8): two selected → the upper clips the lower (Affinity's drag-onto); one → a rect
     the layer's size, set as its mask, to edit from there */
  const top = sel.length === 2
    ? [...sel].sort((a, b) => layers.findIndex((l) => l.id === b.id) - layers.findIndex((l) => l.id === a.id))
    : null
  const canMaskPair = !!top && top.every((l) => layers.some((x) => x.id === l.id)) && canMask(top[0]) && !top[1].isMask
  const canMaskOne = !!one && !one.isMask && !one.maskedBy && layers.some((x) => x.id === one.id) && one.w != null
  const onMask = () => {
    beginTransaction()
    if (canMaskPair) {
      updateLayer(top[0].id, { isMask: true })
      updateLayer(top[1].id, { maskedBy: top[0].id })
    } else if (canMaskOne) {
      const m = addLayer('shape', { kind: 'rect', x: one.x ?? 0, y: one.y ?? 0, w: one.w, h: one.h, isMask: true, name: 'Mask' })
      if (m) updateLayer(one.id, { maskedBy: m })
    }
    commitTransaction()
  }
  const menu = (label, icon, children, disabled) => (
    <Tooltip key={label} label={label}>
      <span className={disabled ? 'pointer-events-none opacity-40' : undefined} aria-label={label}>
        <MenuItem label={<Icon name={icon} size={16} />} size={cs} caret={false} buttonClassName="!px-1.5" panelClassName={BAR_MENU}>
          <div className="py-1 w-[220px]">{children}</div>
        </MenuItem>
      </span>
    </Tooltip>
  )
  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-t border-oq-08">
      <AddLayerButton />
      {act('Group', 'folder', () => groupLayers(ids), { disabled: sel.length < 2 })}
      <Divider variant="vertical" height={16} className="mx-1" />
      <Tooltip label="Layer Effects">
        <Button tone="ghost" quiet size={cs} aria-label="Layer Effects" disabled={!one} className="!px-1.5 font-bold tracking-tight"
          onClick={() => window.dispatchEvent(new CustomEvent('kol:open-layer-effects'))}>FX</Button>
      </Tooltip>
      {act('Mask Layer', 'mask', onMask, { disabled: !(canMaskPair || canMaskOne) })}
      {menu('Adjustment', 'brightness', <AdjustmentRows />, none)}
      {menu('Live Filter', 'filter', <LiveFilterRows />, none)}
      <span className="flex-1" />
      {act('Duplicate', 'copy', () => sel.forEach((l) => duplicateLayer(l.id)))}
      {act('Delete', 'trash', deleteSelected)}
    </div>
  )
}

export default function LayerStack() { return <LayerStackBody /> }
