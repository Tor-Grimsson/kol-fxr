import { Icon } from '@kolkrabbi/kol-icons'
import { MenuDropdownItem, MenuDropdownDivider, MenuDropdownNest } from '@kolkrabbi/kol-component'
import { useComposeState } from '../compose/state'
import { findLayerDeep } from '../compose/helpers'
import { bareChain } from '../compose/filterChain'
import { pack } from '../packs'

const fx = () => pack('effects')
const filterById = (id) => fx()?.filterById(id) ?? null
const loopById = (id) => pack('generators')?.loopById(id) ?? null
const check = (on) => (on ? <Icon name="check" size={11} /> : undefined)

/**
 * The selected layer as an effect target (plan 28 § 4b, moved here by plan 32 so the Layer menu and
 * the Layers bar read ONE rule). Engine (GL) filters need a pixel source: photo layers AND 2d loop
 * layers get the full catalog, other positioned layers the canvas set; engine loops take the canvas +
 * pixi tiers but never a GL engine stage. One engine stage max. With no target the whole catalog
 * shows, greyed.
 */
export function useEffectTarget() {
  const { layers, selectedId, addFilter, updateLayer } = useComposeState()
  const layer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const engineLoop = layer?.type === 'loop' && loopById(layer.loopId)?.kind === 'engine'
  const target = layer && ['shape', 'text', 'pattern', 'path', 'loop', 'misc', 'photo'].includes(layer.type) ? layer : null
  const chain = target ? bareChain(target) : []
  const hasEngine = chain.some((s) => filterById(s.id)?.kind === 'engine')
  const engineHost = target && !engineLoop && (target.type === 'photo' || target.type === 'loop' || target.type === 'misc')
  const options = (fx()?.FILTERS ?? []).filter((f) => !target || f.kind !== 'engine' || (engineHost && !hasEngine))
  return {
    target, chain, options,
    inChain: (id) => chain.some((s) => s.id === id),
    apply: (f) => {
      if (!target) return
      addFilter(target.id, f.id)
      window.dispatchEvent(new CustomEvent('kol:open-effects'))
    },
    clear: () => target && updateLayer(target.id, { filters: [] }),
  }
}

/* LIVE FILTERS (plan 32 § 1; Affinity's `New Live Filter Layer ▸`): None, then Blur · Sharpen · Distort ·
   Noise · Lighting · Colors, a divider, the labs families — ✓ on the chain, greyed with no target */
export function LiveFilterRows() {
  const t = useEffectTarget()
  if (!fx()) return null
  return (
    <>
      <MenuDropdownItem onClick={t.clear} disabled={t.chain.length === 0}>None</MenuDropdownItem>
      <MenuDropdownDivider />
      {fx().liveFilterGroups(t.options).map((g, i) => (g.divider ? <MenuDropdownDivider key={`d${i}`} /> : (
        <MenuDropdownNest flyout key={g.label} label={g.label} disabled={!t.target} scroll>
          {g.filters.map((f) => (
            <MenuDropdownItem key={f.id} onClick={() => t.apply(f)} shortcut={check(t.inChain(f.id))}>{fx().liveFilterLabel(f)}…</MenuDropdownItem>
          ))}
        </MenuDropdownNest>
      )))}
    </>
  )
}

/* ADJUSTMENTS (plan 32 § 2b; Affinity's Adjustment button): the colour filters that adjust a picture,
   added to the selected layer. A true adjustment LAYER (one that filters everything below it) is a
   later plan — the compositor has no such layer yet. */
const ADJUSTMENTS = ['filter-adjustment', 'fx-brightness', 'fx-contrast', 'filter-hsl-adjustment', 'fx-hsl', 'fx-hsv', 'fx-rgb', 'fx-invert', 'fx-grayscale', 'fx-sepia', 'fx-posterize', 'fx-threshold', 'filter-color-gradient', 'filter-color-map', 'filter-color-replace']
export function AdjustmentRows() {
  const t = useEffectTarget()
  if (!fx()) return null
  return ADJUSTMENTS.map(filterById).filter((f) => f && t.options.includes(f)).map((f) => (
    <MenuDropdownItem key={f.id} onClick={() => t.apply(f)} disabled={!t.target} shortcut={check(t.inChain(f.id))}>{fx().liveFilterLabel(f)}…</MenuDropdownItem>
  ))
}
