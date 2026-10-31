import { presetsInGroup, presetParams, isToolPreset } from '../../loops/registry'
import { FILTERS } from '../../filters'
import { effectCategories, categoryOf, FX_RACK_GROUPS, rackGroupFilters, presetParamOf } from '../compose/inspectors/effectCategories'

/**
 * PREVIOUS / NEXT (plan 49 2.3, user 2026-10-31: "arrow left and right buttons for next and previosu pattern , it could also
 * be mapped to shortcuts? f.e. hjkl"). One place for the step, shared by LoopPicker's ‹ › and Labs' keys:
 *   level 'preset'   — the next preset in the layer's category, wrapping
 *   level 'category' — the first preset of the next category in the type, wrapping
 * Returns the layer patch (the same full reset LoopPicker's applyPreset writes), or null when there is nowhere to go.
 */
export function presetPatch(preset, group) {
  return {
    loopGroup: group, presetId: preset.id, presetLabel: preset.label, loopId: preset.loop,
    _framePreset: 'custom', _formPreset: 'custom', _lookPreset: 'custom',
    ...presetParams(preset),
  }
}

export function stepPreset(layer, dir, level = 'preset') {
  if (!layer?.loopGroup) return null
  const group = layer.loopGroup
  const presets = presetsInGroup(group)
  if (!presets.length) return null
  const cur = presets.find((p) => p.id === layer.presetId) ?? presets[0]
  const wrap = (i, n) => ((i % n) + n) % n
  if (level === 'category') {
    const subs = [...new Set(presets.map((p) => p.sub).filter(Boolean))]
    if (subs.length < 2) return null
    const next = subs[wrap(subs.indexOf(cur.sub) + dir, subs.length)]
    return presetPatch(presets.find((p) => p.sub === next), group)
  }
  const inSub = cur.sub ? presets.filter((p) => p.sub === cur.sub) : presets
  if (inSub.length < 2) return null
  return presetPatch(inSub[wrap(inSub.indexOf(cur) + dir, inSub.length)], group)
}

/* h/l (←/→) previous/next preset · k/j (↑/↓) previous/next category — Labs only (the editor's H, L and arrows are
   visibility, lock and nudge) */
export const STEP_KEYS = {
  h: ['preset', -1], ArrowLeft: ['preset', -1], l: ['preset', 1], ArrowRight: ['preset', 1],
  k: ['category', -1], ArrowUp: ['category', -1], j: ['category', 1], ArrowDown: ['category', 1],
}

/**
 * RANDOMISE AT FOUR LEVELS (plan 49 2.2, user 2026-10-31: "randomise: Type/CAtegory/Preset/Settings … randomise type is
 * the wides random, category level below that, randomise preset is just like swapping a bit, settings is gonna be same
 * but slightly differnet"). `rand` is a 0–1 generator (seeded by the caller). Returns a layer patch, or null.
 *   type      a preset of another generative type (any category)
 *   category  a preset of another category in this type
 *   preset    another preset in this category
 * (Settings is a nudge over the layer's own params — `nudgeSettings` below.)
 */
/** whether `randomPresetPatch` has anywhere to go at this level — a level that cannot act is not drawn (plan 51 3.1) */
export function canRandomLevel(layer, level, groups) {
  const group = layer?.loopGroup
  if (!group) return false
  const visual = presetsInGroup(group).filter((p) => !isToolPreset(p))
  const cur = visual.find((p) => p.id === layer.presetId) ?? visual[0]
  if (level === 'type') return groups.some((g) => g !== group && presetsInGroup(g).some((p) => !isToolPreset(p)))
  if (level === 'category') return new Set(visual.map((p) => p.sub).filter((x) => x && x !== cur?.sub)).size > 0
  return visual.some((p) => p.id !== cur?.id && (!cur?.sub || p.sub === cur.sub))
}

export function randomPresetPatch(layer, level, rand, groups) {
  const group = layer?.loopGroup
  if (!group) return null
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const visual = (g) => presetsInGroup(g).filter((p) => !isToolPreset(p))
  if (level === 'type') {
    const others = groups.filter((g) => g !== group && visual(g).length)
    if (!others.length) return null
    const g = pick(others)
    return presetPatch(pick(visual(g)), g)
  }
  const presets = visual(group)
  const cur = presets.find((p) => p.id === layer.presetId) ?? presets[0]
  if (level === 'category') {
    const subs = [...new Set(presets.map((p) => p.sub).filter((s) => s && s !== cur?.sub))]
    if (!subs.length) return null
    const s = pick(subs)
    return presetPatch(pick(presets.filter((p) => p.sub === s)), group)
  }
  const inSub = presets.filter((p) => p.id !== cur?.id && (!cur?.sub || p.sub === cur.sub))
  return inSub.length ? presetPatch(pick(inSub), group) : null
}

/** SETTINGS: every rollable range moves a little — ±15% of its span around where it is, clamped (never a structural
 *  `noRandom` one, never a bound one) */
export function nudgeSettings(layer, params, rand) {
  const out = {}
  for (const p of params) {
    if (p.type !== 'range' || p.noRandom || p.min == null || p.max == null) continue
    const v = layer[p.key]
    if (v != null && typeof v === 'object') continue
    const cur = Number(v ?? p.default ?? p.min)
    const span = p.max - p.min
    let n = cur + (rand() - 0.5) * 0.3 * span
    n = Math.min(p.max, Math.max(p.min, n))
    if (p.step) n = Math.round((n - p.min) / p.step) * p.step + p.min
    out[p.key] = +n.toFixed(6)
  }
  return out
}

/**
 * THE SAME FOUR LEVELS ON EFFECT PAGES (plan 51 3.2): Type = another effect family, Category = another effect in this
 * family, Preset = another value of the effect's preset list, Settings = the nudge above. A family is a page family
 * (Halftone, CRT, Refraction…) or a rack category (Color adjustments, Blur/Sharpen…), the nav's own grouping.
 */
let FAMILIES = null
const families = () => (FAMILIES ??= [
  ...effectCategories(FILTERS).filter((c) => !c.rack).map((c) => ({ id: c.id, filters: c.filters })),
  ...FX_RACK_GROUPS.map((g) => ({ id: g.id, filters: rackGroupFilters(g, FILTERS) })),
].filter((f) => f.filters.length))

/** the next effect id at `type` / `category` level, or null */
export function randomEffectId(stageId, level, rand) {
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const cur = categoryOf(stageId)
  if (level === 'type') {
    const others = families().filter((f) => f.id !== cur)
    return others.length ? pick(pick(others).filters).id : null
  }
  const mine = families().find((f) => f.id === cur)?.filters.filter((f) => f.id !== stageId) ?? []
  return mine.length ? pick(mine).id : null
}

/** another value of the effect's preset list, or null when it has none */
export function randomEffectPreset(def, view, rand) {
  const key = presetParamOf(def?.id)
  const opts = (def?.params.find((p) => p.key === key)?.options ?? []).map((o) => (typeof o === 'object' ? o.value : o)).filter((v) => v !== view[key])
  return opts.length ? opts[Math.floor(rand() * opts.length)] : null
}

export function canEffectLevel(def, level) {
  if (!def) return false
  if (level === 'type') return families().length > 1
  if (level === 'category') return (families().find((f) => f.id === categoryOf(def.id))?.filters.length ?? 0) > 1
  if (level === 'preset') return !!presetParamOf(def.id)
  return true
}
