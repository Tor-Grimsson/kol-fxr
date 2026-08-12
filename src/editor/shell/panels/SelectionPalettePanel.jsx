import { useEffect, useState } from 'react'
import { Button, MenuDropdownDivider, MenuDropdownItem, PopoverPanel, useModal, usePopover } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { TabsRow } from '../../color/PanelTabs'
import { useComposeState } from '../../compose/state'
import { findLayerDeep } from '../../compose/helpers'
import { labelForLayer } from '../../compose/labels'
import { isBooleanable } from '../../compose/boolean-ops'
import EditorIcon from '../../icons/EditorIcon'
import InspectorRail from '../../compose/InspectorRail'
import ParametersPanel from '../../compose/inspectors/ParametersPanel'
import EffectsPanel from '../../compose/inspectors/EffectsPanel'
import PatternPanel from '../../compose/inspectors/PatternPanel'

const BASE_TABS = ['Inspector', 'Parameters', 'Effects']

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

  /* Same layer resolution as ParametersPanel/EffectsPanel — in multi-select
   * the first selected layer drives the panels, so it gates the tab too. */
  const layer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const tabs = layer?.type === 'pattern' ? [...BASE_TABS, 'Pattern'] : BASE_TABS

  /* One shared header for every tab (title + delete) so switching tabs never
   * swaps the strip — the per-panel headers were removed. Title/trash logic
   * mirrors the old InspectorRail header (canvas / N-layers / layer name);
   * trash is suppressed for the canvas selection (would nuke every layer). */
  const isCanvas     = selectedId === 'canvas'
  const layerOnlyIds = (selectedIds ?? []).filter((id) => id !== 'canvas')
  const headerTitle  = isCanvas ? 'Canvas'
    : layerOnlyIds.length >= 2 ? `${layerOnlyIds.length} layers`
    : layer ? labelForLayer(layer)
    : null /* nothing selected — the rail body says so; no phantom "Canvas" */
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
      <div className="border-b border-fg-08">
        <TabsRow tabs={tabs} active={active} onChange={setTab} />
      </div>
      {/* Shared header — identical across all tabs (title + ⋯ menu + delete,
        * the Figma header row). border-b = THE divider that separates TEXT
        * from POSITION (user note 0 — Figma divides the header from the
        * first section; full-bleed like every section divider). */}
      <div className="flex items-center gap-1 px-4 min-h-[46px] border-b border-fg-08">
        {headerTitle && <span className="kol-helper-12 text-emphasis flex-1 truncate leading-normal">{headerTitle}</span>}
        {layer && (
          <HeaderMoreMenu
            layer={layer}
            layerOnlyIds={layerOnlyIds}
            layers={layers}
            ops={{ booleanSelected, flattenSelected, flattenText, releaseBoolean, updateLayer, prompt: modal.prompt }}
          />
        )}
        {canDelete && (
          <Button iconComponent={EditorIcon}
            variant="primary"
            size="sm"
            animateIcon
            quiet
            iconOnly="trash"
            iconSize={12}
            aria-label="Delete selected"
            title="Delete selected"
            onClick={deleteSelected}
            style={{ padding: 6 }}
          />
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
        {active === 'Inspector'  && <InspectorRail />}
        {active === 'Parameters' && <ParametersPanel />}
        {active === 'Effects'    && <EffectsPanel />}
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
      <button
        type="button"
        ref={popover.refs.setReference}
        {...popover.getReferenceProps()}
        aria-label="More actions"
        data-kol-tip="More actions"
        className={`inline-flex items-center justify-center rounded text-emphasis ${open ? '' : 'kol-btn-quiet'}`}
        style={{ width: 24, height: 24, padding: 5 }}
      >
        <Icon name="more" size={14} />
      </button>
      <PopoverPanel popover={popover} panel={false} focus={false} className="z-[1000] bg-surface-secondary border border-fg-08 rounded shadow-lg py-1" style={{ width: 176 }}>
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
