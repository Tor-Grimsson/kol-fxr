/**
 * Effect category taxonomy — labs' sidebar model exactly (survey 2026-08-09):
 * SIX nav groups (Halftone · Scanline · CRT · Refraction · FX rack · Pattern),
 * where FX RACK is the one group whose leaves are CATEGORIES, not filters —
 * labs' /radar/effects/<group> pages. Every rack category mixes the canvas
 * tier with its pixi (GPU) siblings, the way labs' effects.config does.
 *
 * A presentation-layer mapping over the filter registry, which stays
 * category-free. Ids are listed defensively: an id with no registered filter
 * simply doesn't render, and any registered filter no category claims lands
 * in 'Other' so future filters never vanish from the picker.
 */
import { filterById } from '../../../filters'
import { loopById } from '../../../loops/registry'

const CATEGORIES = [
  { id: 'halftone',   label: 'Halftone',   filterIds: ['fx-halftone-dither', 'fx-ascii', 'fx-bitmap'] },   /* labs page order: Dither · ASCII · Bitmap */
  { id: 'scanline',   label: 'Scanline',   filterIds: ['scanline'] },
  /* labs CRT = the four synth pages (Disco · Slitscan · Scan · Symmetry);
   * kaleido/mirror belong to the rack's Post-Processing category. */
  { id: 'crt',        label: 'CRT',        filterIds: ['gl-disco', 'gl-slitscan', 'gl-scan', 'gl-trails'] },
  /* glass is a refracting sheet — Refraction, not Pattern. */
  { id: 'refraction', label: 'Refraction', filterIds: ['gl-lens', 'gl-distort', 'fx-chromatic', 'glass'] },
  /* dither is reaction-diffusion — labs Pattern's 'Reaction' bucket. */
  { id: 'pattern',    label: 'Pattern',    filterIds: ['dither'] },
]

/* THE RACK — labs' category list, canvas + pixi mixed per bucket. A rack
 * category is the nav LEAF under FX RACK; its filters populate the rack
 * surface's "Add effect…" list. `pixiGroup` pulls that pixi tier in. */
export const FX_RACK_GROUPS = [
  { id: 'color-adjustments', label: 'Color Adjustments', filterIds: ['fx-hsl', 'fx-hsv', 'fx-brightness', 'fx-contrast', 'fx-rgb', 'fx-invert', 'fx-sepia', 'fx-grayscale', 'fx-enhance'], pixiGroup: 'color-adjustments' },
  { id: 'blur-sharpen',      label: 'Blur/Sharpen',      filterIds: ['fx-blur', 'fx-sharpen'], pixiGroup: 'blur-sharpen' },
  /* labs' lone Displacement category folds into Distortion here — the one
   * pixi displacement def carries group 'distortion' in this registry. */
  { id: 'distortion',        label: 'Distortion',        filterIds: [], pixiGroup: 'distortion' },
  { id: 'artistic',          label: 'Artistic Effects',  filterIds: ['fx-pixelate', 'fx-posterize', 'fx-solarize', 'fx-emboss', 'fx-noise'], pixiGroup: 'artistic' },
  { id: 'lighting',          label: 'Lighting',          filterIds: [], pixiGroup: 'lighting' },
  { id: 'stylize',           label: 'Stylize',           filterIds: [], pixiGroup: 'stylize' },
  { id: 'utility',           label: 'Utility',           filterIds: ['fx-threshold'], pixiGroup: 'utility' },
  /* labs' CANVAS_FX_DEFS — the same list every effect page's Post-Processing
   * block adds from. */
  { id: 'post-processing',   label: 'Post-Processing',   filterIds: ['fx-rgb', 'fx-edge', 'fx-posterize', 'fx-pixelsort', 'fx-mirror', 'fx-kaleido', 'fx-threshold'] },
]

const CLAIMED = new Set([
  ...CATEGORIES.flatMap((c) => c.filterIds),
  ...FX_RACK_GROUPS.flatMap((g) => g.filterIds),
])

/** A rack category's filter list resolved against the allowed catalog —
 * canvas ids first, then its pixi tier (labelled ' · GPU' by the caller). */
export const rackGroupFilters = (group, filters) => [
  ...group.filterIds.map((id) => filters.find((f) => f.id === id)).filter(Boolean),
  ...(group.pixiGroup ? filters.filter((f) => f.kind === 'pixi' && f.group === group.pixiGroup) : []),
]

/** The Post-Processing rack category — every effect page's post-FX adder
 * draws from THIS list (labs' CANVAS_FX_DEFS), never the whole catalog. */
export const postProcessingFilters = (filters) =>
  rackGroupFilters(FX_RACK_GROUPS.find((g) => g.id === 'post-processing'), filters)

/**
 * Ordered NAV categories resolved against a filter list: the five page
 * families plus the FX RACK stub (`rack: true`, leaves come from
 * FX_RACK_GROUPS); unclaimed non-pixi filters get an 'Other' bucket.
 */
export function effectCategories(filters) {
  const cats = CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    filters: c.filterIds.map((id) => filters.find((f) => f.id === id)).filter(Boolean),
  }))
  /* FX RACK sits where labs puts it: after Refraction, before Pattern. */
  cats.splice(4, 0, { id: 'fx-rack', label: 'FX rack', rack: true, filters: [] })
  const other = filters.filter((f) => f.kind !== 'pixi' && !CLAIMED.has(f.id))
  if (other.length) cats.push({ id: 'other', label: 'Other', filters: other })
  return cats.filter((c) => c.rack || c.filters.length > 0)
}

/** Category id owning a filter id — a page family for the five families,
 * the granular RACK category id for rack filters (labs' /effects/<group>),
 * 'other' for unclaimed. Null for none. */
export function categoryOf(filterId) {
  if (!filterId) return null
  const hard = CATEGORIES.find((c) => c.filterIds.includes(filterId))
  if (hard) return hard.id
  const def = filterById(filterId)
  if (def?.kind === 'pixi') {
    const g = FX_RACK_GROUPS.find((x) => x.pixiGroup === def.group)
    if (g) return g.id
  }
  const rack = FX_RACK_GROUPS.find((x) => x.filterIds.includes(filterId))
  return rack ? rack.id : 'other'
}

/* The filter param that IS the filter's preset list (hierarchy level 4 —
 * METHOD > TYPE > CATEGORY > PRESET, docs/documentation/01-hierarchy.md).
 * Surfaced above the tab strip in the Effects panel; filters without
 * an entry have no preset level (purely parametric). */
const PRESET_PARAM = {
  'fx-halftone-dither': 'mode',
  'fx-ascii':           'algorithm',
  'fx-bitmap':          'palette',
  glass:                'pattern',
  scanline:             'look',
  dither:               'palette',
  'gl-lens':            'type',
}
export const presetParamOf = (filterId) => PRESET_PARAM[filterId] ?? null

/** The full params patch a preset pick applies: the preset key itself plus
 * any per-value recipe the filter def carries (`presetPatches` — glass ships
 * the labs registry's full look-configs; defs without one patch just the
 * preset key, the old single-key behavior). */
export const presetPatchFor = (def, value) => ({
  [presetParamOf(def.id)]: value,
  ...(def.presetPatches?.[value] ?? {}),
})

/**
 * Which layer types can host an effect, and which can feed a GL engine
 * stage — the ONE rule, read by both the desktop Effects panel and the
 * mobile Effects sheet. It lived inline in EffectsPanel until 2026-08-27,
 * when the mobile sheet needed the same answer; two copies of "can this
 * layer take a filter" is exactly how the two surfaces drift apart.
 *
 * Photo layers (video included — a video is a photo layer with
 * srcType:'video') and 2d loops get everything incl. GL engines, since
 * their live pixels feed the engine source. Other effectable types are
 * canvas-only; engine loops can't host effects at all (no GL source path).
 */
export function effectHost(layer) {
  if (!layer) return { effectable: false, engineHost: false, engineLoop: false }
  const loopLike = layer.type === 'loop' || layer.type === 'misc'
  const engineLoop = loopLike && loopById(layer.loopId)?.kind === 'engine'
  return {
    effectable: layer.type === 'photo'
      || ['shape', 'text', 'pattern', 'path'].includes(layer.type)
      || (loopLike && !engineLoop),
    engineHost: layer.type === 'photo' || (loopLike && !engineLoop),
    engineLoop,
  }
}

/** effectCategories with the FX RACK stub expanded into its granular
 * categories — the flat browse list both effect pickers show. */
export function flatCategories(available) {
  return effectCategories(available).flatMap((c) => (
    c.rack
      ? FX_RACK_GROUPS.map((g) => ({ id: g.id, label: g.label, filters: rackGroupFilters(g, available) }))
        .filter((g) => g.filters.length > 0)
      : [c]
  ))
}
