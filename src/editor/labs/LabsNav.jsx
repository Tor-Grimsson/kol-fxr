import { useEffect, useRef } from 'react'
import { setRailExtras, RAIL_EXTRA_PREFIX } from '../../railExtras'
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
 *     persistence. kol-labs.css makes the editor grid's left column follow.
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
export const GROUP_ICONS = {
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

/* Mode-door rows (mode.js MODES) — shipped drawings only: desktop is the
 * compositor chrome, globe the labs output, refresh the randomiser. */
/* SECTION GLYPHS — the collapse rule (user, 2026-08-27): a row that can
 * survive collapse HAS AN ICON; one that cannot is not a row, it is a label.
 * These five were labels, so collapsing took them off the rail entirely and
 * the transition read as two different UIs rather than one narrowing. */
export const SECTION_ICONS = {
  effects: 'filter',
  generative: 'layers',
  composition: 'type',
  modulation: 'frequency',
  mode: 'mode-toggle-01',
}

export const MODE_ICONS = { editor: 'desktop', labs: 'globe', randomiser: 'refresh' }

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

  /* The four method sections accordion — mutually exclusive, clicking the
   * open one collapses it. Boot on the section holding the current layer.
   * The collapsed icon rail ignores the accordion (structure is invisible
   * there — every group's icon stays reachable). */
  /* Follow the selection's section — a pick is already in its section
   * (no-op); a deep link / restored draft seeds AFTER mount, and this is
   * what lands the accordion on the right one. */

  /* Disclosure, collapse, the grab edge and the `:root[data-sidenav]` stamp
   * are ALL SideNav's now (kol-framework 0.30.0) — this file kept its own
   * `useDragResize`, open-key and open-section state while wearing the
   * component's classes, which is precisely the fork the ticket named. */

  /* THE SOURCE OUTLIVES THE LAYER. Picking a generative preset replaces the
   * photo layer outright (setOnly keeps ONE layer), so hopping Effects →
   * Generative → Effects used to drop the media and land you back on the
   * From library | Upload empty state (user, 2026-08-27). Remember the last
   * real source here — a ref, so it survives the swap the layer does not —
   * and re-seed the next photo layer with it.
   *
   * Webcam is deliberately NOT remembered: its stream is stopped when the
   * layer goes, and silently re-opening the camera on a nav click is not a
   * restore, it is a surprise. Re-pick Camera to turn it back on. */
  const lastSourceRef = useRef(null)
  useEffect(() => {
    if (layer?.type === 'photo' && layer.src) {
      lastSourceRef.current = { src: layer.src, srcType: layer.srcType, fit: layer.fit }
    }
  }, [layer?.type, layer?.src, layer?.srcType, layer?.fit])

  /* The source a new photo layer should carry: the live one if we're already
   * on a photo, else whatever we last had. */
  const carriedSource = () => (
    layer?.type === 'photo'
      ? { src: layer.src, srcType: layer.srcType, fit: layer.fit }
      : (lastSourceRef.current ?? {})
  )

  /* Effects: labs applies an effect to a SOURCE. Swap in a photo layer and
   * push the filter onto its chain — a photo with no `src` renders the
   * From library | Upload empty state (see ./LabsSourcePicker), which is
   * exactly labs' behaviour on e.g. /radar/ascii. An existing photo layer
   * keeps its source, so browsing effects doesn't make you re-pick media. */
  const pickEffect = (filterId, patch) => {
    const id = setOnly('photo', { ...carriedSource(), filters: [], fxGroup: null })
    if (id) {
      addFilter(id, filterId)
      if (patch) patchFilter(id, 0, patch)
    }
    window.dispatchEvent(new CustomEvent('kol:open-effects'))
  }

  /* A rack CATEGORY leaf (labs /radar/effects/<group>): an empty effect
   * stack scoped to that category — the rail becomes the rack surface. */
  const pickRackGroup = (groupId) => {
    setOnly('photo', { ...carriedSource(), filters: [], fxGroup: groupId })
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
   * A leaf picks its category's FIRST preset; the rail picks within it.
   *
   * DATA, not JSX (2026-08-27): these feed `SideNav`'s navTree as ACTION
   * LEAVES — `{ label, onSelect, active }` — the seam kol-framework 0.30.0
   * added so a dispatching rail can use the shared geometry. */
  const leafRows = (gid, type = 'loop', groupLabel) => {
    const presets = presetsInGroup(gid)
    const subs = [...new Set(presets.map((p) => p.sub).filter(Boolean))]
    const pick = (p) => (type === 'misc'
      ? () => { setOnly('misc', presetLayerPatch(p, gid)); window.dispatchEvent(new CustomEvent('kol:open-params')) }
      : () => pickGenerative(p, gid))
    if (!subs.length) {
      return [{
        label: groupLabel ?? groupById(gid).label,
        onSelect: pick(presets[0]),
        active: layer?.loopGroup === gid,
      }]
    }
    return subs.map((sub) => ({
      label: sub,
      onSelect: pick(presetsInSub(gid, sub)[0]),
      active: layer?.loopGroup === gid && activePreset?.sub === sub,
    }))
  }

  /* Generative types can span several registry groups (labs' own internal
   * groups — see taxonomy.js); a nested group per registry group when there
   * is more than one — except a category-less group, whose single leaf
   * already carries the group name. */
  const generativeRows = (entry) => entry.groups.flatMap((gid) => {
    const label = entry.labels?.[gid] ?? groupById(gid).label
    const hasSubs = presetsInGroup(gid).some((p) => p.sub)
    const rows = leafRows(gid, 'loop', label)
    return (entry.groups.length > 1 && hasSubs) ? [{ label, children: rows }] : rows
  })

  /* ── THE NAV TREE ──
   * `SideNav` (kol-framework 0.30.0, WorkspaceSidebarGeometry) is the one
   * workspace-rail geometry now; this file builds its tree and nothing else.
   * It used to hand-roll ~350 lines of markup wearing this component's own
   * classes, which is the fork the ticket named.
   *
   * THE SHAPE, per the collapse rule: a SECTION is a bare label — no icon, no
   * route, no action — and the icon categories that follow are its SIBLINGS,
   * not its children. Collapse hides the labels and the icon rows stay, so
   * the rail reads as one thing narrowing. Nesting the categories under the
   * section would take the whole subtree down with the label.
   *
   * Every leaf is an ACTION leaf: labs dispatches (swap the layer) and never
   * routes, so no history is walked — `LabsView.jsx`'s replace-not-push
   * `?preset=` contract is untouched. */
  const navTree = [
    /* The app destinations are NOT here any more: the shell rail renders them
       itself now (one rail), and these rows are appended to its `items`. */
    { id: 'sec:effects', label: 'Effects' },
    ...effectCategories(FILTERS).map((cat) => ({
      id: `fx:${cat.id}`,
      label: cat.label,
      icon: GROUP_ICONS[`fx:${cat.id}`] ?? 'square',
      pages: cat.rack
        /* FX RACK's leaves are its CATEGORIES (labs' sidebar) — the presets
           live in the rack surface's adder. */
        ? FX_RACK_GROUPS.map((g) => ({
          label: g.label,
          onSelect: () => pickRackGroup(g.id),
          active: layer?.fxGroup === g.id,
        }))
        : cat.id === 'pattern'
          ? PATTERN_PAGES.map((sub) => ({
            label: sub,
            onSelect: () => pickGenerative(presetsInSub('optic', sub)[0], 'optic'),
            active: layer?.loopGroup === 'optic' && activePreset?.sub === sub,
          }))
          : cat.id === 'scanline'
            ? SCANLINE_LOOKS.map((lk) => ({
              label: lk.label,
              onSelect: () => pickEffect('scanline', lk.patch),
              active: !layer?.fxGroup && activeFilterId === 'scanline'
                && scanlineLookOf(layer?.filters?.[0]?.params) === lk.label,
            }))
            : cat.filters.map((f) => ({
              label: f.label ?? f.id,
              onSelect: () => pickEffect(f.id),
              active: !layer?.fxGroup && activeFilterId === f.id,
            })),
    })),

    { id: 'sec:generative', label: 'Generative' },
    ...GENERATIVE_TREE.map((entry) => ({
      id: `gen:${entry.label}`,
      label: entry.label,
      icon: GROUP_ICONS[`gen:${entry.label}`] ?? 'square',
      pages: generativeRows(entry),
    })),

    { id: 'sec:composition', label: 'Composition' },
    ...KINETIC_TREE.map((entry) => ({
      id: `kin:${entry.label}`,
      label: entry.label,
      icon: GROUP_ICONS[`kin:${entry.label}`] ?? 'square',
      pages: entry.subs.map((sub) => ({
        label: sub,
        onSelect: () => pickKinetic(KINETIC_PRESETS.find((pr) => pr.sub === sub)),
        active: layer?.type === 'kinetic'
          && KINETIC_PRESETS.some((pr) => pr.sub === sub && pr.id === activePresetId),
      })),
    })),
    ...MISC_TREE.map((entry) => ({
      id: `misc:${entry.label}`,
      label: entry.label,
      icon: GROUP_ICONS[`misc:${entry.label}`] ?? 'square',
      pages: entry.groups.flatMap((gid) => leafRows(gid, 'misc')),
    })),

    /* Modulation has no nav target of its own: every param's bind dot is the
       entry point and the shaping UI is the rail's Motion tab. One hop. */
    { id: 'sec:modulation', label: 'Modulation' },
    {
      id: 'mod:animation',
      label: 'Animation',
      icon: 'frequency',
      onSelect: () => window.dispatchEvent(new CustomEvent('kol:open-params')),
    },

  ]

  /* ── PUBLISH, DON'T RENDER ──
   * This component draws nothing now. It hands the rows to the SHELL rail
   * (`railExtras`), which renders them with kol-shell's `NavRail` — the same
   * component, grab animation and active styling every other route gets.
   *
   * The shape `NavRail` reads is `{ icon, path, label, sub: [{ path, label }] }`
   * and its only callback is `onNavigate(path)`, so each row's path is a
   * sentinel and the dispatch table below is what actually runs on a click.
   *
   * ONE LEVEL IS LOST: `NavRail` has no section-header row, so the bare
   * EFFECTS / GENERATIVE / COMPOSITION / MODULATION labels do not render — the
   * icon rows they grouped all still do, in order. That is the one gap to file
   * at kol-ds-ui; everything else maps exactly. */
  useEffect(() => {
    const dispatch = new Map()
    const items = []

    /* FOLD THE FLAT LIST INTO ITS SECTIONS. `navTree` is a stream — a `sec:`
       marker, then the groups belonging to it, then the next marker. The rail
       wants that nesting made real: the section becomes the L1 row and the
       groups that followed it become its L2. */
    navTree.forEach((entry) => {
      if (entry.id.startsWith('sec:')) {
        const key = entry.id.slice(4)
        items.push({
          icon: SECTION_ICONS[key] ?? 'square',
          path: `${RAIL_EXTRA_PREFIX}${entry.id}`,
          label: entry.label,
          sub: [],
        })
        return
      }
      const path = `${RAIL_EXTRA_PREFIX}${entry.id}`
      const pages = entry.pages ?? []
      /* pressing a group runs its first leaf — the group IS its first category
         when you have not picked one; the rest are the right rail's chips */
      const own = entry.onSelect ?? pages[0]?.onSelect
      if (own) dispatch.set(path, own)
      const section = items[items.length - 1]
      const row = { icon: entry.icon, path, label: entry.label }
      /* a group before any section marker would be an L1 row; none exist today,
         but falling back to that beats dropping it silently */
      if (section?.sub) section.sub.push(row)
      else items.push(row)
    })

    setRailExtras({ items, dispatch: (p) => dispatch.get(p)?.() })
    return () => setRailExtras(null)
  })

  return null
}
