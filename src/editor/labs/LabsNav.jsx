import { useState } from 'react'
import { Icon } from '@kolkrabbi/kol-icons'
import { useComposeState } from '../compose/state'
import { useLabsLayer } from './useLabsLayer'
import { GENERATIVE_TREE, MISC_TREE } from '../../loops/taxonomy'
import { groupById, presetsInGroup, presetsInSub, presetLayerPatch } from '../../loops/registry'
import { KINETIC_TREE, KINETIC_PRESETS, presetComp } from '../../kinetic/presets'
import { FILTERS } from '../../filters'
import { effectCategories, categoryOf } from '../compose/inspectors/effectCategories'

/**
 * LabsNav — labs mode's left rail (plan.md Phase 11.3): the persistent,
 * always-visible, method-grouped category nav from labs.kolkrabbi.io.
 *
 * Chrome + geometry = the DS sidenav contract. `.kol-sidenav-*` classes ship
 * in kol-theme (uppercase/color/transition chrome, the is-active accent icon
 * and link dot) and the row geometry (`py-2 pr-10 pl-6 gap-3`, 16px icon in
 * a 20px slot, 12px caret at top-3 right-3, leaf `py-[4px] pl-14` with the
 * dot at 42px, `gap-[2px]` trees) is the shipped SideNav's own markup,
 * mirrored by apps/brand. The DS SideNav COMPONENT itself is react-router
 * bound (NavLink/useLocation) and this app is deliberately router-free, so
 * labs consumes the class contract with buttons — same rail, action leaves.
 *
 * All of it is existing DATA — `effectCategories` over the filter registry
 * and `GENERATIVE_TREE`/`MISC_TREE`/`KINETIC_TREE` over the loop + kinetic
 * registries. Nothing here duplicates a catalog; this is the labs nav model
 * (a browse tree, always open) instead of the editor's insert menus.
 *
 * Every leaf goes through `setOnly` — labs' one-layer invariant, so picking
 * SWAPS the composition rather than stacking onto it.
 *
 * Interfaces is deliberately absent: an app-sized composer, accepted
 * out-of-scope in AGENT-CONTEXT's deferred pool.
 */

/* Group-row icons — presentation-layer mapping over the catalogs (same
 * status as effectCategories itself), names from the curated kol-icon-set. */
const GROUP_ICONS = {
  'fx:halftone': 'grid',
  'fx:scanline': 'row',
  'fx:crt': 'desktop',
  'fx:refraction': 'dashed-circle',
  'fx:fx-rack': 'slider-01',
  'fx:pattern': 'component-01',
  'fx:pixi-color-adjustments': 'brightness',
  'fx:pixi-blur-sharpen': 'slider-02',
  'fx:pixi-distortion': 'swap',
  'fx:pixi-artistic': 'pen-nib',
  'fx:pixi-lighting': 'bolt',
  'fx:pixi-stylize': 'star',
  'fx:pixi-utility': 'customize',
  'fx:other': 'more',
  'gen:Scanline': 'rows',
  'gen:Pattern': 'overlap',
  'gen:Loops': 'refresh',
  'gen:Math': 'hash-01',
  'gen:Penrose': 'polygon',
  'gen:Drift': 'scribble',
  'gen:Gradients': 'circle',
  'gen:Soft Forms': 'drop',
  'gen:Soft Forms 3D': 'cone',
  'gen:3D Scene': 'diamond',
  'kin:Type': 'type',
  'kin:Kinetic': 'type-02',
  'misc:Para Type': 'italic-a',
}

/* Section heading — labs' method labels (Effects · Generative · …); the DS
 * group primitive carries the vertical rhythm, the hop gutter aligns it. */
function NavSection({ label }) {
  return (
    <li>
      <div className="kol-sidenav-group kol-helper-10 text-subtle pl-6 pt-4">{label}</div>
    </li>
  )
}

/* A collapsible group row — the DS hop: icon slot + label + caret. is-active
 * (the accent icon) marks the group HOLDING the current selection. */
function NavGroup({ id, label, active, open, onToggle, children }) {
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`kol-sidenav-hop kol-helper-12 w-full relative flex items-center gap-3 py-2 pr-10 pl-6 bg-transparent border-0 cursor-pointer text-left${active ? ' is-active' : ''}`}
      >
        <span className="kol-sidenav-hop-icon inline-flex items-center justify-center w-5 h-5 shrink-0" aria-hidden="true">
          <Icon name={GROUP_ICONS[id] ?? 'square'} size={16} />
        </span>
        <span className="kol-sidenav-hop-label flex-1 min-w-0 truncate">{label}</span>
        <Icon
          name="chevron-down"
          size={12}
          className={`kol-sidenav-hop-caret absolute top-3 right-3 transition-transform duration-150${open ? '' : ' -rotate-90'}`}
        />
      </button>
      {open && <ul className="kol-sidenav-list mb-2 flex flex-col gap-[2px]">{children}</ul>}
    </li>
  )
}

/* A pickable leaf — the DS link row (the is-active accent dot ships in
 * kol-theme, positioned by the dot var: 56px indent − 14px, brand's rule). */
function NavLeaf({ label, active, onClick }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        style={{ '--kol-sidenav-dot-left': '42px' }}
        className={`kol-sidenav-link kol-helper-10 w-full relative block py-[4px] pl-14 pr-6 bg-transparent border-0 cursor-pointer text-left truncate transition-colors duration-150${active ? ' is-active' : ' text-strong hover:text-emphasis'}`}
      >
        {label}
      </button>
    </li>
  )
}

/* Sub-group header inside a leaf list (multi-group generative types,
 * kinetic subs) — the DS group node at the leaf gutter. */
function LeafGroupLabel({ label }) {
  return <div className="kol-sidenav-group kol-helper-10 text-subtle pl-14">{label}</div>
}

export default function LabsNav() {
  const { addFilter } = useComposeState()
  const { layer, setOnly } = useLabsLayer()
  const [openKey, setOpenKey] = useState('gen:Pattern')
  const toggle = (key) => setOpenKey((k) => (k === key ? null : key))

  /* Effects: labs applies an effect to a SOURCE. Swap in a photo layer and
   * push the filter onto its chain — a photo with no `src` renders the
   * From library | Upload empty state (see ./LabsSourcePicker), which is
   * exactly labs' behaviour on e.g. /radar/ascii. An existing photo layer
   * keeps its source, so browsing effects doesn't make you re-pick media. */
  const pickEffect = (filterId) => {
    const keepSrc = layer?.type === 'photo'
      ? { src: layer.src, srcType: layer.srcType, fit: layer.fit }
      : {}
    const id = setOnly('photo', { ...keepSrc, filters: [] })
    if (id) addFilter(id, filterId)
    window.dispatchEvent(new CustomEvent('kol:open-effects'))
  }

  const pickGenerative = (preset, groupId) => {
    setOnly('loop', presetLayerPatch(preset, groupId))
    window.dispatchEvent(new CustomEvent('kol:open-params'))
  }

  const pickKinetic = (preset) => {
    setOnly('kinetic', {
      presetId: preset.id,
      presetLabel: preset.label,
      comp: presetComp(preset),
    })
    window.dispatchEvent(new CustomEvent('kol:open-params'))
  }

  const activePresetId = layer?.presetId ?? null
  const activeFilterId = layer?.filters?.[0]?.id ?? null
  const activeCatId = activeFilterId ? categoryOf(activeFilterId) : null
  const activePreset = activePresetId
    ? presetsInGroup(layer?.loopGroup).find((p) => p.id === activePresetId) ?? null
    : null

  /* THE HIERARCHY LAW (docs/documentation/01-hierarchy): the nav shows the
   * CATEGORY level — each group's `sub` values, an authored, limited list —
   * never the preset flood. The presets of the active category are the right
   * rail's selector (LabsParams chips). A leaf picks its category's FIRST
   * preset; presets without a sub (legacy groups) stay leaves themselves. */
  const categoryLeaves = (gid, type = 'loop') => {
    const presets = presetsInGroup(gid)
    const subs = [...new Set(presets.map((p) => p.sub).filter(Boolean))]
    const loose = presets.filter((p) => !p.sub)
    const pick = (p) => (type === 'misc'
      ? () => { setOnly('misc', presetLayerPatch(p, gid)); window.dispatchEvent(new CustomEvent('kol:open-params')) }
      : () => pickGenerative(p, gid))
    return (
      <>
        {subs.map((sub) => (
          <NavLeaf
            key={sub}
            label={sub}
            active={layer?.loopGroup === gid && activePreset?.sub === sub}
            onClick={pick(presetsInSub(gid, sub)[0])}
          />
        ))}
        {loose.map((p) => (
          <NavLeaf key={p.id} label={p.label} active={activePresetId === p.id} onClick={pick(p)} />
        ))}
      </>
    )
  }

  /* Generative types can span several registry groups (labs' own internal
   * groups — see taxonomy.js); a header per group when there's more than one. */
  const generativeLeaves = (entry) =>
    entry.groups.map((gid) => (
      <li key={gid}>
        {entry.groups.length > 1 && (
          <LeafGroupLabel label={entry.labels?.[gid] ?? groupById(gid).label} />
        )}
        <ul className="flex flex-col gap-[2px]">{categoryLeaves(gid)}</ul>
      </li>
    ))

  return (
    <nav className="kol-compose-rail overflow-y-auto [scrollbar-gutter:stable] pt-4 pb-4">
      <ul className="kol-sidenav-tree flex flex-col gap-[2px]">
        <NavSection label="Effects" />
        {effectCategories(FILTERS).map((cat) => (
          <NavGroup
            key={cat.id}
            id={`fx:${cat.id}`}
            label={cat.label}
            active={activeCatId === cat.id}
            open={openKey === `fx:${cat.id}`}
            onToggle={() => toggle(`fx:${cat.id}`)}
          >
            {cat.filters.map((f) => (
              <NavLeaf
                key={f.id}
                label={f.label ?? f.id}
                active={activeFilterId === f.id}
                onClick={() => pickEffect(f.id)}
              />
            ))}
          </NavGroup>
        ))}

        <NavSection label="Generative" />
        {GENERATIVE_TREE.map((entry) => (
          <NavGroup
            key={entry.label}
            id={`gen:${entry.label}`}
            label={entry.label}
            active={layer?.type === 'loop' && entry.groups.includes(layer?.loopGroup)}
            open={openKey === `gen:${entry.label}`}
            onToggle={() => toggle(`gen:${entry.label}`)}
          >
            {generativeLeaves(entry)}
          </NavGroup>
        ))}

        <NavSection label="Composition" />
        {KINETIC_TREE.map((entry) => (
          <NavGroup
            key={entry.label}
            id={`kin:${entry.label}`}
            label={entry.label}
            active={layer?.type === 'kinetic' && entry.subs.some((sub) => KINETIC_PRESETS.some((p) => p.sub === sub && p.id === activePresetId))}
            open={openKey === `kin:${entry.label}`}
            onToggle={() => toggle(`kin:${entry.label}`)}
          >
            {entry.subs.map((sub) => (
              <NavLeaf
                key={sub}
                label={sub}
                active={layer?.type === 'kinetic' && KINETIC_PRESETS.some((p) => p.sub === sub && p.id === activePresetId)}
                onClick={() => pickKinetic(KINETIC_PRESETS.find((p) => p.sub === sub))}
              />
            ))}
          </NavGroup>
        ))}
        {MISC_TREE.map((entry) => (
          <NavGroup
            key={entry.label}
            id={`misc:${entry.label}`}
            label={entry.label}
            active={layer?.type === 'misc' && entry.groups.includes(layer?.loopGroup)}
            open={openKey === `misc:${entry.label}`}
            onToggle={() => toggle(`misc:${entry.label}`)}
          >
            {entry.groups.map((gid) => (
              <li key={gid}>
                <ul className="flex flex-col gap-[2px]">{categoryLeaves(gid, 'misc')}</ul>
              </li>
            ))}
          </NavGroup>
        ))}

        {/* Modulation has no nav target of its own: every param's bind dot is
            the entry point, and the shaping UI is the rail's Motion tab. This
            row just takes you there — a hop with no caret. */}
        <NavSection label="Modulation" />
        <li>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('kol:open-params'))}
            className="kol-sidenav-hop kol-helper-12 w-full relative flex items-center gap-3 py-2 pr-10 pl-6 bg-transparent border-0 cursor-pointer text-left"
          >
            <span className="kol-sidenav-hop-icon inline-flex items-center justify-center w-5 h-5 shrink-0" aria-hidden="true">
              <Icon name="frequency" size={16} />
            </span>
            <span className="kol-sidenav-hop-label flex-1 min-w-0 truncate">Animation</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
