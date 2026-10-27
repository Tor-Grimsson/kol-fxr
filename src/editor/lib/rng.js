// rng — seeded PRNG + schema-driven param randomiser, ported from labs
// (kol-labs-single/src/lib/rng.js). One shared implementation for every
// Randomise surface: scoped rolls filter the schema, then merge the result
// over current params without touching binding objects.

/** Deterministic 0..1 PRNG seeded by an integer. Same seed → same sequence. */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A random integer seed for the seed input / Randomise button. */
export function randomSeed() {
  return Math.floor(Math.random() * 1e9)
}

import { rollPalette } from '../color/palette.js'

/**
 * Roll a value object from a declarative param schema using `rng`.
 * Honours param bounds; SKIPS params flagged `noRandom` (structural — counts,
 * resolution, steps — that would thrash geometry or size arrays).
 *
 * Schema entries: { key, type, min, max, step, options, noRandom }
 *   type 'range'            → min..max snapped to step
 *   type 'select'           → one of options (value or {value})
 *   type 'toggle'|'boolean' → true/false
 *   type 'color'            → a colour of ONE palette rolled for the whole call (plan 37 § 5.5): a
 *                             `role` takes that role, an un-roled colour the palette's colours in turn —
 *                             N related colours, not N random hexes
 * Anything else is left out (caller keeps its current value).
 */
export function randomizeSchema(params, rng) {
  const out = {}
  if (!Array.isArray(params)) return out
  let palette = null
  let turn = 0
  for (const p of params) {
    if (!p || p.noRandom) continue
    /* Schema-authored roll — a param that can't be rolled from its type
     * (e.g. a text expression) supplies its own seeded generator. */
    if (p.roll) { out[p.key] = p.roll(rng); continue }
    if (p.type === 'range') {
      /* `rMin`/`rMax` keep a roll inside the musical span of a slider whose hand range is wider —
         kinetic knobs' convention (knobs.js), schema-wide since plan 27 § 7. A range that names no
         span rolls inside the middle half of its slider (plan 42 § 4.2): never to the ends. */
      const lo = p.min ?? 0, hi = p.max ?? 1
      const min = p.rMin ?? lo + (hi - lo) * 0.25
      const max = p.rMax ?? lo + (hi - lo) * 0.75
      const step = p.step || 0.01
      const v = min + rng() * (max - min)
      out[p.key] = step >= 1 ? Math.round(v) : Math.round(v / step) * step
    } else if (p.type === 'select') {
      const opts = p.options || []
      if (!opts.length) continue
      const o = opts[Math.floor(rng() * opts.length)]
      out[p.key] = o && typeof o === 'object' ? o.value : o
    } else if (p.type === 'toggle' || p.type === 'boolean') {
      out[p.key] = rng() > 0.5
    } else if (p.type === 'color') {
      palette ??= rollPalette(rng)
      out[p.key] = (p.role && palette.roles[p.role]) || palette.colors[turn++ % palette.colors.length]
    }
  }
  return out
}

/**
 * Merge a rolled patch over current params WITHOUT clobbering bound values:
 * any current value that is a binding object (non-null object with a `source`
 * or `expr` marker, or an array of keyframes) keeps the binding — the roll
 * only replaces plain values. Mirrors labs' mergeRoll contract.
 */
export function mergeRoll(current, rolled) {
  const out = { ...current }
  for (const [k, v] of Object.entries(rolled)) {
    const cur = current?.[k]
    const isBound =
      (cur && typeof cur === 'object' && !Array.isArray(cur)) ||
      (Array.isArray(cur) && cur.length && typeof cur[0] === 'object')
    if (!isBound) out[k] = v
  }
  return out
}
