import { GROUPS, presetsInGroup, isToolPreset } from '../../loops/registry'
import { stepFromPreset } from './StepPicker'
import { resetMorph } from './morphStore'
import { transport } from '../params/transport'
import { navigateTo } from '../mode'

/**
 * MORPH PRESETS (plan 47 W2) — Morph is a METHOD with the full ladder: TYPE = the mode (Shape · Blend · Crossfade),
 * CATEGORY = the generator a run starts from, PRESET = the run (user 2026-10-31: *"a preset matrx. 1>1 1>2 1>3 1>4"*,
 * then *"I truly trust you more to follow your own logic, to find nice transitions, maybe most have 2 some have 3 and
 * few have 4 connections"*). Curated, not a grid:
 *   SHAPE      outline to outline — runs between drawn generators whose outlines share structure (closed curves,
 *              ring fields, line fields). Only canvas-drawn generators have an outline (`hasOutline`, shape.js).
 *   BLEND      one generator's params tweened (one schema) — runs between presets of the same generator.
 *   CROSSFADE  one picture fading into the next — runs chosen for contrast across generators (drawn ones only).
 * A run names generators (loop ids) or, for Blend, one loop id and which of its presets (first · middle · last).
 * Every run was watched playing (2026-10-31); dropped for stalling blank in Shape: Rings field → Stripes and
 * Animate → Epicycle (their outlines do not survive the shape tween).
 * Built from the registry, never stored; a run whose generator has gone is dropped.
 */
export const MORPH_TYPES = [
  { id: 'shape', label: 'Shape', icon: 'line-circle' },
  { id: 'blend', label: 'Blend', icon: 'shaper-scurve' },
  { id: 'crossfade', label: 'Crossfade', icon: 'dashed-circle' },
]

/* [category, steps] — a step is a loop id (its first preset) */
const RUNS = {
  shape: [
    ['Loops', ['morph-circle', 'star-morph']],
    ['Loops', ['square-circle', 'blob', 'lissajous']],
    ['Loops', ['morph-circle', 'star-morph', 'blob', 'spiral']],
    ['Math', ['math-spinner', 'math-threads']],
    ['Field', ['halftone', 'checker-field']],
    ['Flow', ['flow-obstacles', 'flow-voronoi']],
  ],
  crossfade: [
    ['Scanline', ['scanline', 'plasma']],
    ['Scanline', ['scanline', 'flow-charges', 'math-surface']],
    ['Field', ['plasma', 'math-field']],
    ['Field', ['gradient-field', 'optic-moire']],
    ['Penrose', ['penrose-02-diffgrow', 'flow-growth']],
    ['Penrose', ['penrose-01-packing-lloyd', 'optic-reaction', 'abstract-rd', 'flow-voronoi']],
    ['Math', ['math-threads', 'flow-ascii']],
    ['Math', ['math-waveform', 'scanline']],
  ],
  /* [category, loop id, how many presets of it] — spread first → last */
  blend: [
    ['Scanline', 'scanline', 2],
    ['Scanline', 'scanline', 3],
    ['Field', 'plasma', 2],
    ['Math', 'math-curves', 2],
    ['Math', 'math-spinner', 4],
    ['Optic', 'optic-moire', 2],
    ['Flow', 'flow-obstacles', 2],
  ],
}

/* every visual preset of a loop, in registry order, once */
let byLoop = null
function presetsOf(loopId) {
  if (!byLoop) {
    byLoop = new Map()
    const seen = new Set()
    for (const g of GROUPS) for (const p of presetsInGroup(g.id)) {
      if (seen.has(p.id) || isToolPreset(p)) continue
      seen.add(p.id)
      if (!byLoop.has(p.loop)) byLoop.set(p.loop, [])
      byLoop.get(p.loop).push(p)
    }
  }
  return byLoop.get(loopId) ?? []
}
const spread = (list, n) => (list.length < n ? null : Array.from({ length: n }, (_, i) => list[Math.round((i * (list.length - 1)) / (n - 1))]))

let built = null
/** `[{ id, type, typeLabel, category, sub, label, steps: [preset…], morph }]` — `sub` is unique across types (`Shape · Loops`) */
export function morphPresets() {
  if (built) return built
  const out = []
  for (const t of MORPH_TYPES) {
    for (const row of RUNS[t.id]) {
      const [category] = row
      const steps = t.id === 'blend'
        ? spread(presetsOf(row[1]), row[2])
        : row[1].map((loopId) => presetsOf(loopId)[0])
      if (!steps || steps.some((p) => !p) || new Set(steps.map((p) => p.id)).size < steps.length) continue
      const label = steps.map((p) => p.label).join(' → ')
      const id = `ship:morph:${t.id}:${steps.map((p) => p.id).join('--')}`
      out.push({
        id, type: t.id, typeLabel: t.label, category, sub: `${t.label} · ${category}`, label, steps,
        morph: { mode: t.id, loopId: steps[0].loop, steps: steps.map(stepFromPreset), curve: 'in-out', cycle: 'loop', resolution: 0, syncLoop: false, seconds: 2 * steps.length },
      })
    }
  }
  return (built = out)
}

/** the TreePicker tree: one entry per type, its categories as `sub` keys */
export const morphTree = () => MORPH_TYPES.map((t) => ({ label: t.label, subs: [...new Set(morphPresets().filter((p) => p.type === t.id).map((p) => p.sub))] }))
export const firstMorphPreset = (type, category) => morphPresets().find((p) => p.type === type && (!category || p.category === category))
export const morphPresetById = (id) => morphPresets().find((p) => p.id === id)

/** put a Morph preset on the stage: its steps into the morph, Morph's route, still until Play (MorphTab rebuilds the stage
 *  from the steps on mount or on the change) */
export function loadMorphPreset(p) {
  if (!p) return
  resetMorph({ active: true, ...p.morph, fileId: null, fileName: p.label, presetId: p.id })
  transport.setLoopSeconds(p.morph.seconds)
  /* NOTHING AUTO-STARTS (plan 49 10.1, user 2026-10-31: "NEVER AUTO START, just start on play") */
  if (!/\/morph\/?$/.test(window.location.pathname)) navigateTo('/morph')
}
