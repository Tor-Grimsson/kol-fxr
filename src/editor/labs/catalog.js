import { GENERATIVE_TREE, MISC_TREE } from '../../loops/taxonomy'
import { groupById, presetsInGroup, presetsInSub, presetLayerPatch } from '../../loops/registry'
import { KINETIC_TREE, KINETIC_PRESETS, presetComp } from '../../kinetic/presets'
import { FILTERS } from '../../filters'
import { effectCategories, FX_RACK_GROUPS } from '../compose/inspectors/effectCategories'

/**
 * The labs CATALOG — the section/group/category tree and its pick semantics,
 * as data. Extracted from LabsNav (2026-09-01, plan 02-labs-mobile-and-vector
 * step 1) so more than one chrome can offer labs' content: LabsNav folds this
 * stream into the shell rail today; the mobile labs chrome consumes the same
 * builder in step 5, and the VECTOR section lands here once (step 4) for both.
 *
 * THE HIERARCHY LAW (docs/documentation/01-hierarchy): the catalog's leaves
 * are the CATEGORY level — each group's `sub` values, an authored, limited
 * list — never the preset flood. The presets of the active category are the
 * params rail's selector (LabsParams chips). Every pick goes through
 * `setOnly` — labs' one-layer invariant (swap, not stack).
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
  'vec:Distressor': 'scribble',
  'vec:Modulator': 'dashed-circle',
}

/* SECTION GLYPHS — the collapse rule (user, 2026-08-27): a row that can
 * survive collapse HAS AN ICON; one that cannot is not a row, it is a label.
 * These five were labels, so collapsing took them off the rail entirely and
 * the transition read as two different UIs rather than one narrowing. */
export const SECTION_ICONS = {
  effects: 'filter',
  generative: 'layers',
  vector: 'pen-nib',
  composition: 'type',
  modulation: 'frequency',
  mode: 'mode-toggle-01',
}

/* Mode-door rows (mode.js MODES) — shipped drawings only: desktop is the
 * compositor chrome, globe the labs output, refresh the randomiser. */
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

/**
 * Build the catalog STREAM: `{ id: 'sec:…', label }` markers, each followed by
 * the group entries belonging to it — `{ id, label, icon, pages }` where pages
 * are ACTION leaves `{ label, onSelect, active }` (kol-framework 0.30.0's
 * seam). The consumer decides the rendering: LabsNav folds it into NavRail
 * items; a mobile chrome can list it directly.
 *
 * ctx:
 *   layer                — the one labs layer (active flags read it)
 *   setOnly              — useLabsLayer's swap-not-stack setter
 *   addFilter, patchFilter — compose actions (effects picks)
 *   carriedSource        — () => the media source a new photo layer carries
 *                          (the chrome owns the remember-the-source policy)
 */
export function buildLabsCatalog({ layer, setOnly, addFilter, patchFilter, carriedSource }) {
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
  const activePreset = activePresetId
    ? presetsInGroup(layer?.loopGroup).find((p) => p.id === activePresetId) ?? null
    : null

  /* Catalog leaves = the CATEGORY level (`sub` values) — presets NEVER render
   * here; the params rail owns them (the hierarchy law). A group with no
   * authored categories IS the category: one leaf named after the group.
   * A leaf picks its category's FIRST preset; the rail picks within it. */
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

  return [
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

    /* VECTOR — the ported kol-apps instruments (plan 02 step 4): tools that
       make or eat PATHS, neither pixel effects nor generative fields. Leaves
       are their preset categories per the hierarchy law. */
    { id: 'sec:vector', label: 'Vector' },
    {
      id: 'vec:Distressor',
      label: 'Distressor',
      icon: GROUP_ICONS['vec:Distressor'] ?? 'square',
      pages: leafRows('distress'),
    },
    {
      id: 'vec:Modulator',
      label: 'Modulator',
      icon: GROUP_ICONS['vec:Modulator'] ?? 'square',
      pages: leafRows('modulator'),
    },

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
}
