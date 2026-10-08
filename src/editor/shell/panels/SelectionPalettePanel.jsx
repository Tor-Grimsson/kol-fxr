import { useEffect, useState } from 'react'
import { Button, MenuDropdownDivider, MenuDropdownItem, PopoverPanel, useModal, usePopover, TabsRow, Tooltip } from '@kolkrabbi/kol-component'
import { useComposeState } from '../../compose/state'
import { findLayerDeep } from '../../compose/helpers'
import { isBooleanable } from '../../compose/boolean-ops'
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
  const {
    selectedId, selectedIds, layers, deleteSelected,
    booleanSelected, flattenSelected, flattenText, releaseBoolean, updateLayer,
  } = useComposeState()
  const modal = useModal()
  const [tab, setTab]  = useState('Inspector')
  const EffectsPanel = pack('effects')?.EffectsPanel

  /* Same layer resolution as ParametersPanel/EffectsPanel — in multi-select
   * the first selected layer drives the panels, so it gates the tab too. */
  const layer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const tabs = layer?.type === 'pattern' ? [...baseTabs(), 'Pattern'] : baseTabs()

  /* Trash is suppressed for the canvas selection (would nuke every layer). */
  const isCanvas     = selectedId === 'canvas'
  const layerOnlyIds = (selectedIds ?? []).filter((id) => id !== 'canvas')
  const canDelete = !isCanvas && layerOnlyIds.length > 0
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
      {/* The tab row carries the selection's actions (⋯ + delete). The header row that repeated the
        * selected layer's type ("TEXT") is gone — the layers panel already says what is selected
        * (inspector rebuild 2026-09-27, user: "there literally is no reason to say TEXT"). */}
      <div className="flex items-center gap-1 pl-3 pr-2 border-b border-oq-08">
        <div className="flex-1 min-w-0"><TabsRow tabs={tabs.map((t) => ({ id: t, label: t }))} value={active} onChange={setTab} /></div>
        {layer && (
          <HeaderMoreMenu
            layer={layer}
            layerOnlyIds={layerOnlyIds}
            layers={layers}
            ops={{ booleanSelected, flattenSelected, flattenText, releaseBoolean, updateLayer, prompt: modal.prompt }}
          />
        )}
        {canDelete && (
          <Tooltip label="Delete selected"><Button
            tone="ghost"
            size="sm"
            quiet
            iconOnly="trash"
            aria-label="Delete selected"
            onClick={deleteSelected}
          /></Tooltip>
        )}
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

/* HeaderMoreMenu — the Figma […] next to the trash: booleans / flatten /
 * edit. Booleans need ≥2 booleanable layers selected (same gate as the
 * toolbar dropdown); Edit opens the text string in a prompt dialog.
 * "Use as mask" is deliberately absent — the engine has no mask support
 * yet (flagged, not faked). */
const BOOL_OPS = [
  { id: 'unite',     label: 'Union' },
  { id: 'subtract',  label: 'Subtract' },
  { id: 'intersect', label: 'Intersect' },
  { id: 'exclude',   label: 'Exclude' },
]

function HeaderMoreMenu({ layer, layerOnlyIds, layers, ops }) {
  const [open, setOpen] = useState(false)
  const popover = usePopover({ open, onOpenChange: setOpen, placement: 'bottom-end', offset: 4, role: 'menu' })
  const canBool = layers.filter((l) => layerOnlyIds.includes(l.id) && isBooleanable(l)).length >= 2
  const canFlatten = layer.type === 'text' || layer.type === 'bool' || (canBool && layerOnlyIds.length >= 2)
  const run = (fn) => () => { setOpen(false); fn() }
  const onEdit = async () => {
    setOpen(false)
    const next = await ops.prompt('Edit text', layer.text ?? '')
    if (next != null) ops.updateLayer(layer.id, { text: next })
  }
  return (
    <>
      <Tooltip label="More actions">
        <span ref={popover.refs.setReference} {...popover.getReferenceProps()} className="inline-flex">
          <Button tone="ghost" size="sm" quiet iconOnly="more" aria-label="More actions" pressed={open} />
        </span>
      </Tooltip>
      <PopoverPanel popover={popover} panel={false} focus={false} className="z-[var(--kol-z-tooltip)] bg-surface-secondary border border-oq-08 rounded shadow-lg py-1" style={{ width: 176 }}>
        {BOOL_OPS.map((b) => (
          <MenuDropdownItem key={b.id} disabled={!canBool} onClick={run(() => ops.booleanSelected(b.id))}>
            {b.label}
          </MenuDropdownItem>
        ))}
        <MenuDropdownDivider />
        <MenuDropdownItem
          disabled={!canFlatten}
          onClick={run(() => (layer.type === 'text' ? ops.flattenText(layer.id) : ops.flattenSelected()))}
        >
          Flatten
        </MenuDropdownItem>
        {layer.type === 'bool' && (
          <MenuDropdownItem onClick={run(() => ops.releaseBoolean())}>
            Release boolean
          </MenuDropdownItem>
        )}
        {layer.type === 'text' && (
          <>
            <MenuDropdownDivider />
            <MenuDropdownItem onClick={onEdit}>
              Edit object
            </MenuDropdownItem>
            <MenuDropdownItem onClick={run(() => window.dispatchEvent(new CustomEvent('kol:save-type', { detail: layer.id })))}>
              Save type to library
            </MenuDropdownItem>
          </>
        )}
      </PopoverPanel>
    </>
  )
}
