import { EASING_OPTIONS } from '../params/easing.js'

/**
 * buildMorph — tween between N saved presets of ONE generator (plan 05, 2026-10-08).
 *
 * The value model already is the morph: a prop is a raw constant or a
 * `{ bind:'track', keys:[{ t, v, easing }] }` the resolver lerps per frame
 * (numbers and #rrggbb colors; anything else steps at the key; `hold` steps
 * too). So Morph(P1 … PN) is P1's layer with, for every schema param whose
 * value differs across the N, a track whose keys are the N values in order —
 * and a closing key back to P1 so frame(0) === frame(1). Nothing new in the
 * resolver, the clock, the timeline dock or the webm bake: a morph layer is
 * ordinary state after Build (drag its keys, bind a knob on top, Save…, bake).
 *
 * The rule per param, by schema type:
 *   range · int · color   → a track, lerped with `curve`
 *   select · toggle · segmented · text · … → a track with `hold` keys — a CUT at
 *                            each key (Geometry rows→rings cannot tween); the
 *                            dialog names these before Build
 *   seed                  → HELD at P1's value — lerping a seed scrambles the
 *                            noise every frame; `stepSeeds` makes it a cut instead
 *   equal across the N    → untouched, stays a raw value
 *
 * Keys: Loop — t_i = i/N, closing key at 1 = P1. Ping-pong — out and back,
 * 2N−2 segments. Once — t_i = i/(N−1), no closing key; it clamps at PN and is
 * NOT a seamless loop.
 *
 * ponytail: seeds held, colors in the resolver's RGB lerp; OKLCH and a
 * crossfade for presets whose discrete params differ are plan 05 § 3.
 */

export const CYCLES = [
  { value: 'loop', label: 'Loop' },
  { value: 'pingpong', label: 'Ping-pong' },
  { value: 'once', label: 'Once' },
]
export const CURVES = EASING_OPTIONS.filter((o) => o.value !== 'hold')

const TWEENABLE = new Set(['range', 'int', 'color'])
/* the layer keys that name the preset, carried from P1 so labs' chip reads right */
const IDENTITY = ['loopGroup', 'presetId', 'presetLabel']

const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b)

/* the value sequence a cycle plays, then the key for each */
export function keysFor(values, cycle, easing) {
  const seq = cycle === 'loop' ? [...values, values[0]]
    : cycle === 'pingpong' ? [...values, ...values.slice(0, -1).reverse()]
    : values
  const n = seq.length - 1
  return seq.map((v, i) => ({ t: n ? i / n : 0, v, easing }))
}

/* The loop layer a saved preset holds for this generator, or null. A labs
 * preset is one loop layer; an editor document may hold several — the first
 * of this generator is the snapshot. */
export function loopSnapshot(item, loopId) {
  const layers = Array.isArray(item?.layers) ? item.layers : []
  return layers.find((l) => l && l.type === 'loop' && l.loopId === loopId) ?? null
}

/**
 * @param {Object[]} snapshots  N ≥ 2 loop layers of one `loopId`, in morph order
 * @param {Object[]} schema     the generator's `params` (its schema)
 * @returns {{ patch, tweened, stepped, held }} patch = P1's params with tracks
 *          where the N differ; the three lists are the params each rule took
 */
export function buildMorph({ snapshots, schema, curve = 'in-out', cycle = 'loop', stepSeeds = false }) {
  if (!Array.isArray(snapshots) || snapshots.length < 2) throw new Error('buildMorph: two or more snapshots')
  if (!CYCLES.some((c) => c.value === cycle)) throw new Error(`buildMorph: unknown cycle ${cycle}`)
  const base = snapshots[0]
  const patch = {}
  for (const k of IDENTITY) if (base[k] !== undefined) patch[k] = base[k]
  const tweened = [], stepped = [], held = []
  for (const p of schema) {
    const values = snapshots.map((s) => (s[p.key] === undefined ? p.default : s[p.key]))
    if (values.every((v) => same(v, values[0]))) { if (values[0] !== undefined) patch[p.key] = values[0]; continue }
    if (p.key === 'seed' && !stepSeeds) { patch[p.key] = values[0]; held.push(p); continue }
    const discrete = p.key === 'seed' || !TWEENABLE.has(p.type)
    patch[p.key] = { bind: 'track', keys: keysFor(values, cycle, discrete ? 'hold' : curve) }
    ;(discrete ? stepped : tweened).push(p)
  }
  return { patch, tweened, stepped, held }
}
