import { useEffect, useRef, useState } from 'react'
import { Icon } from '@kolkrabbi/kol-icons'
import { Tooltip } from '@kolkrabbi/kol-component'
import { useDragResize } from '@kolkrabbi/kol-framework'
import { useComposeState } from '../compose/state'
import { useLabsLayer } from './useLabsLayer'
import { GENERATIVE_TREE, MISC_TREE } from '../../loops/taxonomy'
import { groupById, presetsInGroup, presetsInSub, presetLayerPatch } from '../../loops/registry'
import { KINETIC_TREE, KINETIC_PRESETS, presetComp } from '../../kinetic/presets'
import { FILTERS } from '../../filters'
import { effectCategories, categoryOf, FX_RACK_GROUPS } from '../compose/inspectors/effectCategories'

/**
 * LabsNav — labs mode's left rail (plan.md Phase 11.3): the persistent,
 * always-visible, method-grouped category nav from labs.kolkrabbi.io.
 *
 * Chrome + geometry = the DS sidenav contract, framework ≥0.15.1 form: the
 * hop/caret/list BOX lives in kol-framework.css rules (the box-in-rules law
 * — utilities on the same element would outrank the collapsed overrides),
 * so the markup carries classes + type/color utilities only. The DS SideNav
 * COMPONENT stays out (react-router bound; this app is router-free) — labs
 * consumes the class contract with buttons, same rail, action leaves.
 *
 * Adopted from framework 0.17.0 (the SideNavGrabResize arc):
 *   useDragResize — the pill-marked grab edge: drag resizes (live
 *     --kol-sidenav-w), click toggles collapse, snap bands, keyboard,
 *     persistence. labs.css makes the editor grid's left column follow.
 *   collapsed rail — :root[data-sidenav="collapsed"] hides labels/carets/
 *     lists (shipped rules); icon rows get a DS Tooltip and any icon press
 *     expands (the 0.17.0 behaviour).
 *   footer — theme hop + wordmark (the labs reference's bottom-left). The
 *     framework ThemeToggle is NOT used: it runs its own theme store, which
 *     would fight the editor's theme.js — same classes, editor's state.
 *
 * THE HIERARCHY LAW (docs/documentation/01-hierarchy): the nav shows the
 * CATEGORY level — each group's `sub` values, an authored, limited list —
 * never the preset flood. The presets of the active category are the right
 * rail's selector (LabsParams chips). Every pick goes through `setOnly` —
 * labs' one-layer invariant (swap, not stack).
 *
 * Interfaces is deliberately absent: an app-sized composer, accepted
 * out-of-scope in AGENT-CONTEXT's deferred pool.
 */

/* Group-row icons — presentation-layer mapping over the catalogs (same
 * status as effectCategories itself). Labs' real glyph names as of
 * kol-icons 0.14.0 (LabsNavIcons ticket); four labs names were deliberately
 * not minted and map to shipped drawings: target-lock→target,
 * monitor→desktop, phone→mobile, cycle→refresh. Drift renders dith-flow
 * (the rack wave — user call; the labs dash drawing is dith-drift). */
const GROUP_ICONS = {
  'fx:halftone': 'ptrn-dot',
  'fx:scanline': 'grid-horizontal',
  'fx:crt': 'desktop',
  'fx:refraction': 'circle',
  'fx:fx-rack': 'target',
  'fx:pattern': 'ptrn-checker',
  'fx:other': 'more',
  'gen:Scanline': 'grid-horizontal',
  'gen:Pattern': 'ptrn-checker',
  'gen:Loops': 'refresh',
  'gen:Math': 'sum',
  'gen:Penrose': 'a-framed',
  'gen:Drift': 'dith-flow',
  'gen:Gradients': 'circle',
  'gen:Soft Forms': 'paint-drop',
  'gen:Soft Forms 3D': 'ball',
  'gen:3D Scene': 'ball',
  'kin:Type': 'font-01',
  'kin:Kinetic': 'font-01',
  'misc:Para Type': 'aa',
}

/* Section eyebrow — labs' method labels (Effects · Generative · …), the
 * SAME treatment as the right rail's section headers (kol-helper-10
 * text-meta) so the two sidebars read as one system. Clickable: the four
 * sections accordion — one open at a time. Hidden in the collapsed rail by
 * labs.css (`.kol-labs-eyebrow`). */
function NavSection({ label, open, onToggle }) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="kol-labs-eyebrow w-full flex items-center gap-2 kol-helper-10 text-meta pl-6 pr-3 pt-4 pb-1 bg-transparent border-0 cursor-pointer text-left"
      >
        <span className="flex-1 min-w-0 truncate">{label}</span>
        <Icon
          name="chevron-down"
          size={10}
          className={`shrink-0 transition-transform duration-150${open ? '' : ' -rotate-90'}`}
        />
      </button>
    </li>
  )
}

/* A collapsible group row — the DS hop (box in kol-framework.css rules).
 * is-active (the accent icon) marks the group HOLDING the current selection.
 * Collapsed rail: tooltip names the glyph, any press expands (0.17.0). */
function NavGroup({ id, label, active, open, onToggle, collapsed, onExpandRail, children }) {
  const btn = (
    <button
      type="button"
      onClick={collapsed ? onExpandRail : onToggle}
      aria-expanded={open}
      className={`kol-sidenav-hop kol-helper-12 bg-transparent border-0 cursor-pointer text-left${active ? ' is-active' : ''}`}
    >
      <span className="kol-sidenav-hop-icon inline-flex items-center justify-center w-5 h-5 shrink-0" aria-hidden="true">
        <Icon name={GROUP_ICONS[id] ?? 'square'} size={16} />
      </span>
      <span className="kol-sidenav-hop-label flex-1 min-w-0 truncate">{label}</span>
      <span className="kol-sidenav-hop-caret" aria-hidden="true">
        <Icon
          name="chevron-down"
          size={12}
          className={`transition-transform duration-150${open ? '' : ' -rotate-90'}`}
        />
      </span>
    </button>
  )
  return (
    <li className="relative">
      {collapsed ? <Tooltip label={label} placement="right" triggerClassName="block">{btn}</Tooltip> : btn}
      {open && <ul className="kol-sidenav-list">{children}</ul>}
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

/* Sub-group header inside a leaf list (multi-group generative types) —
 * the DS group node at the leaf gutter, right-rail eyebrow treatment. */
function LeafGroupLabel({ label }) {
  return <div className="kol-sidenav-group kol-helper-10 text-meta pl-14">{label}</div>
}

/* Labs' EFFECTS > Pattern — the four GENERATOR pages (the 'optic' group:
 * Moiré · Mesh Gradient · Reaction · Halftone, labs' sidebar order). Leaves
 * are the group's categories; a click seeds that category's first preset as
 * a loop layer, exactly like a generative leaf. */
const PATTERN_PAGES = ['Moiré', 'Mesh Gradient', 'Reaction', 'Halftone']

/* Labs' EFFECTS > Scanline — authored categories over the ONE scanline
 * filter, reusing the generative scanline's category vocabulary so the two
 * scanline surfaces speak one system. Each leaf = the filter seeded with
 * that look's params (the discriminating geometry/mark keys only). */
const SCANLINE_LOOKS = [
  { label: 'Spaced',  patch: { geometry: 'rows', mark: 'dots' } },
  { label: 'Glyph',   patch: { mark: 'glyph' } },
  { label: 'Lattice', patch: { mark: 'lattice' } },
  { label: 'Vortex',  patch: { geometry: 'radial', swirl: 0.8, rayCount: 220 } },
  { label: 'Rings',   patch: { geometry: 'rings' } },
  { label: 'Spiral',  patch: { geometry: 'spiral' } },
]
/* Which look a scanline stage's params read as — geometry outranks mark
 * (mirrors how the looks discriminate). */
const scanlineLookOf = (p = {}) => {
  const g = p.geometry ?? 'rows'
  if (g === 'radial') return 'Vortex'
  if (g === 'rings') return 'Rings'
  if (g === 'spiral') return 'Spiral'
  return p.mark === 'glyph' ? 'Glyph' : p.mark === 'lattice' ? 'Lattice' : 'Spaced'
}

export default function LabsNav() {
  const { addFilter, patchFilter } = useComposeState()
  const { layer, setOnly } = useLabsLayer()
  const [openKey, setOpenKey] = useState('gen:Pattern')
  const toggle = (key) => setOpenKey((k) => (k === key ? null : key))

  /* The four method sections accordion — mutually exclusive, clicking the
   * open one collapses it. Boot on the section holding the current layer.
   * The collapsed icon rail ignores the accordion (structure is invisible
   * there — every group's icon stays reachable). */
  const [openSection, setOpenSection] = useState('effects')
  const toggleSection = (id) => setOpenSection((s) => (s === id ? null : id))
  /* Follow the selection's section — a pick is already in its section
   * (no-op); a deep link / restored draft seeds AFTER mount, and this is
   * what lands the accordion on the right one. */
  useEffect(() => {
    /* optic loops are labs' EFFECTS > Pattern pages — they live in the
     * Effects section even though they're loop layers. */
    const s = layer?.type === 'loop' ? (layer?.loopGroup === 'optic' ? 'effects' : 'generative')
      : layer?.type === 'kinetic' || layer?.type === 'misc' ? 'composition'
        : layer?.type === 'photo' ? 'effects' : null
    if (s) setOpenSection(s)
  }, [layer?.type, layer?.loopGroup])

  /* The DS grab edge: drag resizes (--kol-sidenav-w live on :root), click
   * toggles the icon rail. labs.css points the editor grid's left column at
   * the same tokens. */
  const asideRef = useRef(null)
  const { collapsed, toggleCollapsed, grabProps } = useDragResize(asideRef)
  const expandRail = () => { if (collapsed) toggleCollapsed() }

  /* Effects: labs applies an effect to a SOURCE. Swap in a photo layer and
   * push the filter onto its chain — a photo with no `src` renders the
   * From library | Upload empty state (see ./LabsSourcePicker), which is
   * exactly labs' behaviour on e.g. /radar/ascii. An existing photo layer
   * keeps its source, so browsing effects doesn't make you re-pick media. */
  const pickEffect = (filterId, patch) => {
    const keepSrc = layer?.type === 'photo'
      ? { src: layer.src, srcType: layer.srcType, fit: layer.fit }
      : {}
    const id = setOnly('photo', { ...keepSrc, filters: [], fxGroup: null })
    if (id) {
      addFilter(id, filterId)
      if (patch) patchFilter(id, 0, patch)
    }
    window.dispatchEvent(new CustomEvent('kol:open-effects'))
  }

  /* A rack CATEGORY leaf (labs /radar/effects/<group>): an empty effect
   * stack scoped to that category — the rail becomes the rack surface. */
  const pickRackGroup = (groupId) => {
    const keepSrc = layer?.type === 'photo'
      ? { src: layer.src, srcType: layer.srcType, fit: layer.fit }
      : {}
    setOnly('photo', { ...keepSrc, filters: [], fxGroup: groupId })
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

  /* Nav leaves = the CATEGORY level (`sub` values) — presets NEVER render
   * here; the right rail owns them (the hierarchy law). A group with no
   * authored categories IS the category: one leaf named after the group.
   * A leaf picks its category's FIRST preset; the rail picks within it. */
  const categoryLeaves = (gid, type = 'loop', groupLabel) => {
    const presets = presetsInGroup(gid)
    const subs = [...new Set(presets.map((p) => p.sub).filter(Boolean))]
    const pick = (p) => (type === 'misc'
      ? () => { setOnly('misc', presetLayerPatch(p, gid)); window.dispatchEvent(new CustomEvent('kol:open-params')) }
      : () => pickGenerative(p, gid))
    if (!subs.length) {
      return (
        <NavLeaf
          label={groupLabel ?? groupById(gid).label}
          active={layer?.loopGroup === gid}
          onClick={pick(presets[0])}
        />
      )
    }
    return subs.map((sub) => (
      <NavLeaf
        key={sub}
        label={sub}
        active={layer?.loopGroup === gid && activePreset?.sub === sub}
        onClick={pick(presetsInSub(gid, sub)[0])}
      />
    ))
  }

  /* Generative types can span several registry groups (labs' own internal
   * groups — see taxonomy.js); a header per group when there's more than
   * one — except a category-less group, whose single leaf already carries
   * the group name (a header above it would just repeat it). */
  const generativeLeaves = (entry) =>
    entry.groups.map((gid) => {
      const label = entry.labels?.[gid] ?? groupById(gid).label
      const hasSubs = presetsInGroup(gid).some((p) => p.sub)
      return (
        <li key={gid}>
          {entry.groups.length > 1 && hasSubs && <LeafGroupLabel label={label} />}
          <ul className="flex flex-col gap-[2px]">{categoryLeaves(gid, 'loop', label)}</ul>
        </li>
      )
    })

  const groupProps = { collapsed, onExpandRail: expandRail }
  /* Collapsed rail shows every group icon regardless of the accordion. */
  const sectionOpen = (id) => collapsed || openSection === id

  return (
    <div ref={asideRef} className="relative h-full min-h-0 flex flex-col">
      <nav className="kol-compose-rail flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] pt-4 pb-4">
        <ul className="kol-sidenav-tree flex flex-col gap-[2px]">
          <NavSection label="Effects" open={openSection === 'effects'} onToggle={() => toggleSection('effects')} />
          {sectionOpen('effects') && effectCategories(FILTERS).map((cat) => (
            <NavGroup
              key={cat.id}
              id={`fx:${cat.id}`}
              label={cat.label}
              active={cat.rack
                ? !!layer?.fxGroup
                : cat.id === 'pattern'
                  ? layer?.type === 'loop' && layer?.loopGroup === 'optic'
                  : !layer?.fxGroup && activeCatId === cat.id}
              open={openKey === `fx:${cat.id}`}
              onToggle={() => toggle(`fx:${cat.id}`)}
              {...groupProps}
            >
              {cat.rack
                /* FX RACK's leaves are its CATEGORIES (labs' sidebar) —
                   the presets live in the rack surface's adder. */
                ? FX_RACK_GROUPS.map((g) => (
                  <NavLeaf
                    key={g.id}
                    label={g.label}
                    active={layer?.fxGroup === g.id}
                    onClick={() => pickRackGroup(g.id)}
                  />
                ))
                : cat.id === 'pattern'
                  ? PATTERN_PAGES.map((sub) => (
                    <NavLeaf
                      key={sub}
                      label={sub}
                      active={layer?.loopGroup === 'optic' && activePreset?.sub === sub}
                      onClick={() => pickGenerative(presetsInSub('optic', sub)[0], 'optic')}
                    />
                  ))
                  : cat.id === 'scanline'
                    ? SCANLINE_LOOKS.map((lk) => (
                      <NavLeaf
                        key={lk.label}
                        label={lk.label}
                        active={!layer?.fxGroup && activeFilterId === 'scanline' && scanlineLookOf(layer?.filters?.[0]?.params) === lk.label}
                        onClick={() => pickEffect('scanline', lk.patch)}
                      />
                    ))
                    : cat.filters.map((f) => (
                      <NavLeaf
                        key={f.id}
                        label={f.label ?? f.id}
                        active={!layer?.fxGroup && activeFilterId === f.id}
                        onClick={() => pickEffect(f.id)}
                      />
                    ))}
            </NavGroup>
          ))}

          <NavSection label="Generative" open={openSection === 'generative'} onToggle={() => toggleSection('generative')} />
          {sectionOpen('generative') && GENERATIVE_TREE.map((entry) => (
            <NavGroup
              key={entry.label}
              id={`gen:${entry.label}`}
              label={entry.label}
              active={layer?.type === 'loop' && entry.groups.includes(layer?.loopGroup)}
              open={openKey === `gen:${entry.label}`}
              onToggle={() => toggle(`gen:${entry.label}`)}
              {...groupProps}
            >
              {generativeLeaves(entry)}
            </NavGroup>
          ))}

          <NavSection label="Composition" open={openSection === 'composition'} onToggle={() => toggleSection('composition')} />
          {sectionOpen('composition') && KINETIC_TREE.map((entry) => (
            <NavGroup
              key={entry.label}
              id={`kin:${entry.label}`}
              label={entry.label}
              active={layer?.type === 'kinetic' && entry.subs.some((sub) => KINETIC_PRESETS.some((p) => p.sub === sub && p.id === activePresetId))}
              open={openKey === `kin:${entry.label}`}
              onToggle={() => toggle(`kin:${entry.label}`)}
              {...groupProps}
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
          {sectionOpen('composition') && MISC_TREE.map((entry) => (
            <NavGroup
              key={entry.label}
              id={`misc:${entry.label}`}
              label={entry.label}
              active={layer?.type === 'misc' && entry.groups.includes(layer?.loopGroup)}
              open={openKey === `misc:${entry.label}`}
              onToggle={() => toggle(`misc:${entry.label}`)}
              {...groupProps}
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
          <NavSection label="Modulation" open={openSection === 'modulation'} onToggle={() => toggleSection('modulation')} />
          {sectionOpen('modulation') && (
            <li>
              <button
                type="button"
                onClick={collapsed ? expandRail : () => window.dispatchEvent(new CustomEvent('kol:open-params'))}
                className="kol-sidenav-hop kol-helper-12 bg-transparent border-0 cursor-pointer text-left"
              >
                <span className="kol-sidenav-hop-icon inline-flex items-center justify-center w-5 h-5 shrink-0" aria-hidden="true">
                  <Icon name="frequency" size={16} />
                </span>
                <span className="kol-sidenav-hop-label flex-1 min-w-0 truncate">Animation</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* The pill-marked grab edge — chrome + gesture ship in the DS
          (kol-framework.css .kol-sidenav-grab + useDragResize). */}
      <div className="kol-sidenav-grab absolute top-0 right-0 bottom-0 z-[1]" {...grabProps} />
    </div>
  )
}
