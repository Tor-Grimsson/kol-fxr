import { useState } from 'react'
import { LabeledControl, SettingsRow } from '@kolkrabbi/kol-component'
import { NumberField } from '../compose/inspectors/NumberField'
import { mulberry32, randomSeed, randomizeSchema, mergeRoll } from '../lib/rng'
import { presetsInGroup, presetLayerPatch, isToolPreset } from '../../loops/registry'
import { resolvedChain } from '../compose/filterChain'
import { visibleParams } from './schema'
import { useControlSize, RAIL_LABEL_W } from './controlSize'

/**
 * rolls — the scoped, seeded Randomize surface shared by the inspector
 * panels (labs LoopsShell Generate-section model, kol-labs-single
 * LoopsShell.jsx:160-216 + SettingsPanel seed flow).
 *
 * Scopes are SCHEMA FILTERS: Colour = the type:'color' params; every other
 * scope is a distinct `section` present in the layer's visible params.
 * Rolls go through the shared rng lib — randomizeSchema (honours noRandom)
 * seeded with mulberry32, merged via mergeRoll so bound params keep their
 * bindings — and land as ONE layer patch per press.
 *
 * The seed that produced a roll persists on the layer (`_rollSeed`) so it
 * survives save/load; typing a seed into the field reproduces that roll on
 * the next press, after which presses mint fresh seeds again.
 */

/** Sections that hold motion params — "Randomize all" preserves them (labs
 * scanline convention: 'all' rolls the look, never the motion). */
export const MOTION_SECTIONS = new Set(['Motion', 'Frame', 'Form'])

/** Curation keys — picked, never rolled (the theme select + invert are
 * choices, not randomness; labs colour scopes roll hex colors only). */
const NEVER_ROLL = new Set(['theme', 'invert'])

const COLOR_SCOPE = '__color'
const SCOPE_LABELS = { [COLOR_SCOPE]: 'Colour', Frame: 'Motion Frame', Form: 'Motion Form' }

/**
 * Scope buttons for a layer's schema: one per distinct section in schema
 * order; the type-based Colour scope stands in for the color params at their
 * first occurrence (so a pure-color 'Color' section collapses into it).
 * Returns [{ id, label, motion, params }].
 */
export function deriveScopes(schema, layer) {
  const scopes = []
  const byId = new Map()
  for (const p of visibleParams(schema ?? [], layer)) {
    if (NEVER_ROLL.has(p.key)) continue
    const id = p.type === 'color' ? COLOR_SCOPE : p.section
    if (!id) continue
    let scope = byId.get(id)
    if (!scope) {
      scope = { id, label: SCOPE_LABELS[id] ?? id, motion: MOTION_SECTIONS.has(id), params: [] }
      byId.set(id, scope)
      scopes.push(scope)
    }
    scope.params.push(p)
  }
  return scopes
}

/** The "Randomize all" param set: every visible param EXCEPT the motion
 * sections and Camera (framing + motion stay curated) and curation keys.
 * Per-param noRandom is still honoured downstream by randomizeSchema. */
export function allScopeParams(schema, layer) {
  return visibleParams(schema ?? [], layer).filter((p) =>
    !NEVER_ROLL.has(p.key) && !MOTION_SECTIONS.has(p.section) && p.section !== 'Camera')
}

/**
 * Roll `params` with a seeded rng → the layer patch: rolled values merged
 * via mergeRoll (bound params survive) + the seed under `_rollSeed`.
 * `stripNoRandom` is the explicit-motion-press escape hatch: a schema flags
 * its motion params noRandom to keep the all-roll off them, but pressing
 * the motion scope itself must roll them (labs randFrame/randForm).
 */
export function computeRoll(layer, params, seed, { stripNoRandom = false, withFilters = false } = {}) {
  const src = stripNoRandom ? params.map((p) => (p.noRandom ? { ...p, noRandom: false } : p)) : params
  const rolled = randomizeSchema(src, mulberry32(seed >>> 0))
  /* A roll must not leave any in-scope range param outside its slider.
   * Typed input may sit beyond the range by design (the input-outranks-
   * slider law), and noRandom params keep it through a roll — which reads
   * as "hectic randoms" (penrose, user 2026-08-12). Clamp the unrolled. */
  for (const p of src) {
    if (p.type !== 'range' || p.key in rolled) continue
    const v = layer[p.key]
    if (typeof v !== 'number') continue
    const min = p.min ?? 0
    const max = p.max ?? 1
    if (v < min) rolled[p.key] = min
    else if (v > max) rolled[p.key] = max
  }
  const current = {}
  for (const k of Object.keys(rolled)) current[k] = layer[k]
  const patch = { ...mergeRoll(current, rolled), _rollSeed: seed }
  /* A WHOLE-LAYER roll rolls the effect chain too. Scope presses don't —
   * "Colour" means the generator's colours, not the chain's. */
  if (withFilters) {
    const filters = computeFilterRoll(layer, seed)
    if (filters) patch.filters = filters
  }
  return patch
}

/**
 * Roll the layer's EFFECT CHAIN → the `filters` array, or null when the
 * layer has no stages. Each stage's own params roll against its filter def
 * (per-param noRandom honoured by randomizeSchema, bindings kept by
 * mergeRoll) — the same contract as the Effects panel's per-stage button,
 * which until now was the ONLY thing that ever rolled a filter.
 *
 * ONE rng walks the whole chain, so two stages of the same filter don't roll
 * to identical values; its seed is offset off the layer roll's so the chain
 * doesn't correlate with the generator params it rolls beside.
 */
export function computeFilterRoll(layer, seed) {
  const chain = resolvedChain(layer)
  if (!chain.length) return null
  const rng = mulberry32((seed + 0x9e3779b9) >>> 0)
  return chain.map(({ def, ...stage }) => (
    def ? { ...stage, params: mergeRoll(stage.params, randomizeSchema(def.params, rng)) } : stage
  ))
}

/**
 * Roll the PRESET itself → the layer patch, or null when the group holds no
 * other preset to move to. Every other roll here rolls a preset's PARAMS;
 * this one rolls which preset you are on, which is the axis the rail had no
 * button for at all. Tool presets (Oscilloscope and friends — instruments,
 * not looks) stay out of the pool, same rule the registry already states.
 *
 * Lifted out of MobileOverlay 2026-08-15 — it was implemented there and
 * nowhere else, so the whole desktop/labs rail was missing the control.
 * Seeded through the same `_rollSeed` flow, and the patch is the registry's
 * canonical one, never a hand-rolled subset.
 */
export function presetRollPool(layer) {
  return presetsInGroup(layer.loopGroup).filter((p) => p.id !== layer.presetId && !isToolPreset(p))
}

export function computePresetRoll(layer, seed) {
  const pool = presetRollPool(layer)
  if (!pool.length) return null
  const p = pool[Math.floor(mulberry32(seed >>> 0)() * pool.length)]
  return { ...presetLayerPatch(p, layer.loopGroup), _rollSeed: seed }
}

/**
 * Seed state for one Randomize surface (labs SettingsPanel.jsx:83-87 flow).
 * `value` shows the manual draft or the layer's persisted seed; `take()`
 * consumes a manually-committed seed exactly once, else mints a fresh one.
 */
export function useRollSeed(layer) {
  const [draft, setDraft] = useState(null)
  const take = () => {
    if (draft != null) {
      setDraft(null)
      return draft
    }
    return randomSeed()
  }
  return { value: draft ?? layer?._rollSeed ?? 0, commit: setDraft, take }
}

/** The editable seed field — commit (Enter/blur) arms the seed for the next
 * roll press. Draft/commit via the shared NumberField idiom. */
export function SeedField({ seed, inline = false }) {
  const cs = useControlSize()
  const field = (
      <NumberField
        variant="filled" size={cs} chars={10}
        value={seed.value}
        onCommit={(raw) => {
          const n = Math.floor(Number(raw))
          if (Number.isFinite(n) && n >= 0) seed.commit(n)
        }}
      />
  )
  /* `inline` (the labs skin) is the DS SettingsRow — the uppercase helper
   * label in the rail's column — the row every other labs control renders.
   * Two branches, not a per-render wrapper component: a new component type
   * each render would remount the field and drop the draft mid-type. */
  return inline
    ? <SettingsRow label="Seed" align="fill" labelWidth={RAIL_LABEL_W}>{field}</SettingsRow>
    : <LabeledControl label="Seed">{field}</LabeledControl>
}
