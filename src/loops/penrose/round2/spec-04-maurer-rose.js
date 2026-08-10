

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, rampRGB, pc } from '../common.js'

// Maurer Rose — chord diagram overlaid on a rose curve r=sin(nθ).
// Connect 360 points at angular steps of d degrees; animate d for continuous morphing.
// Ref: Maurer 1987 "A Rose Is a Rose" · AMM 94(7):631–645
//
// LIVING ROSE (2026-08-09 rework — "just strobing" fix): the chord web is a
// POPULATION, not a per-frame rebuild. A drawing head walks the Maurer
// sequence laying one strand per frame; every strand bakes its geometry at
// birth (the d/n/radius of that instant) and lives a few seconds — easing
// in, holding, dying away — so the web churns organically instead of
// flickering. d and n drift slowly through damped lerps; petal-count changes
// crossfade for free because old strands keep the petals they were born
// with. The pointer bends d/n inside a NARROW window through a heavy lerp;
// press = bloom-and-shed (a staggered wave retires the old web while the
// head relays it swollen).

const PARAMS          = [
  { key: 'n', type: 'int', min: 2, max: 9, default: 4, label: 'petals n' },
  { key: 'd', type: 'range', min: 1, max: 179, default: 71, step: 0.5, label: 'chord step d°' },
  { key: 'drift', type: 'range', min: 0, max: 0.5, default: 0.06, step: 0.01, label: 'd drift/s' },
  { key: 'alpha', type: 'range', min: 0.1, max: 1.0, default: 0.55, step: 0.05, label: 'opacity' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

const DEG = Math.PI / 180

export const r2_spec_04_maurer_rose            = {
  id: 'r2-spec-04-maurer-rose',
  name: 'MAURER ROSE',
  repo: 'Maurer 1987 · AMM 94(7):631–645 · en.wikipedia.org/wiki/Maurer_rose',
  summary: 'Chord diagram on rose r=sin(nθ); d drifts per second morphing explosive interference geometries continuously.',
  helps: 'Extreme complexity-to-code ratio — two ints produce wildly different lattice fills inside the glyph.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const R = Math.min(W, H) * 0.44
    const CX = W / 2
    const CY = H / 2

    const MAX_CHORDS = 340
    const LIFE = 300          // frames a strand lives (~5s at 60fps)
    const EASE_IN = 24        // frames easing in
    const EASE_OUT = 60       // frames dying away

    const chords = []         // { x0,y0,x1,y1, hue, age, life } — geometry baked at birth
    let head = 0              // Maurer index k of the drawing head
    let sd = null             // smoothed chord step
    let sn = null             // smoothed petal count (quantized only for NEW strands)
    let bloom = 0             // eased radius swell, 0..~0.4
    let prevDown = false

    // alpha×hue buckets for batched strand strokes (hoisted — no per-frame alloc)
    const AB = 10, HB = 12
    const buckets = Array.from({ length: AB * HB }, () => [])

    const rosePoint = (k, dDeg, nPet, rad) => {
      const theta = k * dDeg * DEG
      const r = rad * Math.sin(nPet * theta)
      return [CX + r * Math.cos(theta), CY + r * Math.sin(theta)]
    }
    const insideAt = (x, y) => sdf.sample((x * sdf.w) / W, (y * sdf.h) / H) < 0

    // boot — the web is already churning on frame one: ~210 strands pre-laid
    // with staggered ages, oldest first, so births and deaths start at once
    {
      const d0 = num(params, 'd', 71)
      const n0 = Math.max(2, Math.round(num(params, 'n', 4)))
      sd = d0
      sn = n0
      for (let i = 0; i < 210; i++) {
        const [x0, y0] = rosePoint(head, d0, n0, R)
        const [x1, y1] = rosePoint(head + 1, d0, n0, R)
        head = (head + 1) % 360
        if (!insideAt(x0, y0) && !insideAt(x1, y1)) continue
        chords.push({
          x0, y0, x1, y1,
          hue: 0.45 + (head / 360) * 0.55,
          age: Math.floor((1 - i / 210) * LIFE * 0.7),
          life: LIFE * (0.85 + rng() * 0.3),
        })
      }
    }

    return wrapLoop(() => {
      const nKnob = num(params, 'n', 4)
      const dBase = num(params, 'd', 71)
      const drift = num(params, 'drift', 0.06)
      const opac = num(params, 'alpha', 0.55)
      const interact = num(params, 'interact', 1)
      const t = clock.nowSeconds()

      const ptr = interact > 0 && pointer ? pointer() : null
      const kB = Math.min(1, interact)

      // slow auto drift ±14° around the knob; the pointer bends d/n inside a
      // NARROW window (±22° / ±1.5 petals) through a heavy lerp — the hand
      // suggests, the web catches up over ~1s. n is never flickered: only
      // newborn strands read the quantized value.
      const autoD = dBase + Math.sin(t * (0.15 + drift * 2)) * 14
      const tgtD = ptr ? autoD + ((ptr.x / sdf.w) - 0.5) * 44 * kB : autoD
      const tgtN = ptr ? nKnob + ((1 - ptr.y / sdf.h) - 0.5) * 3 * kB : nKnob
      sd += (tgtD - sd) * 0.035
      sn += (tgtN - sn) * 0.035

      // press = bloom-and-shed: the swell eases in while held and drains
      // after; the shed assigns each settled strand a staggered near-death,
      // so the old web peels away as a slow wave, then regrows
      const down = !!(ptr && ptr.down)
      if (down && !prevDown) {
        let lag = 0
        for (const c of chords) {
          if (c.life - c.age < 90) continue // already dying — leave it
          c.life = Math.min(c.life, c.age + 26 + lag)
          lag += 0.55
        }
      }
      prevDown = down
      bloom += ((down ? 0.4 : 0) - bloom) * 0.04

      const nQ = Math.max(2, Math.round(sn))
      const RB = R * (1 + bloom * kB)

      // the head lays strands at the CURRENT d/n — geometry bakes at birth,
      // so nothing already drawn ever re-derives (no full-pattern rebuild)
      const lay = down ? 2 : 1
      for (let s = 0; s < lay; s++) {
        const [x0, y0] = rosePoint(head, sd, nQ, RB)
        const [x1, y1] = rosePoint(head + 1, sd, nQ, RB)
        head = (head + 1) % 360
        if (!insideAt(x0, y0) && !insideAt(x1, y1)) continue
        chords.push({
          x0, y0, x1, y1,
          hue: 0.45 + (head / 360) * 0.55,
          age: 0,
          life: LIFE * (0.85 + rng() * 0.3),
        })
        while (chords.length > MAX_CHORDS) chords.shift() // hard population cap
      }

      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)

      // strand population — each eases in, holds, dies away
      // (batched: alpha+hue quantized to buckets → one stroke per bucket
      // instead of one beginPath/stroke per strand)
      for (const b of buckets) b.length = 0
      for (let i = chords.length - 1; i >= 0; i--) {
        const c = chords[i]
        c.age++
        if (c.age >= c.life) { chords.splice(i, 1); continue }
        const ein = Math.min(1, c.age / EASE_IN)
        const eout = Math.min(1, (c.life - c.age) / EASE_OUT)
        const a = opac * ein * eout
        if (a < 0.01) continue
        const ai = Math.max(0, Math.min(AB - 1, Math.floor(a * AB)))
        const hb = Math.max(0, Math.min(HB - 1, Math.floor(((c.hue - 0.45) / 0.55) * HB)))
        buckets[ai * HB + hb].push(c)
      }
      ctx.lineWidth = 2
      for (let bi = 0; bi < buckets.length; bi++) {
        const bset = buckets[bi]
        if (!bset.length) continue
        const a = ((bi / HB | 0) + 0.5) / AB
        const [rr, gg, bb] = rampRGB(0.45 + (((bi % HB) + 0.5) / HB) * 0.55)
        ctx.strokeStyle = `rgba(${rr},${gg},${bb},${a.toFixed(3)})`
        ctx.beginPath()
        for (const c of bset) { ctx.moveTo(c.x0, c.y0); ctx.lineTo(c.x1, c.y1) }
        ctx.stroke()
      }

      // the drawing head — a warm ember laying the next strand
      {
        const [hx, hy] = rosePoint(head, sd, nQ, RB)
        // fake glow — halo fill replaces the shadowBlur pass
        ctx.fillStyle = pc('warm', 0.28)
        ctx.beginPath()
        ctx.arc(hx, hy, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = pc('warm', 0.9)
        ctx.beginPath()
        ctx.arc(hx, hy, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // rose envelope — crossfaded between the two neighbouring petal counts
      // so the rim morphs smoothly while sn glides (never flickers)
      const nLo = Math.max(2, Math.floor(sn))
      const f = Math.max(0, Math.min(1, sn - nLo))
      const drawEnvelope = (nPet, a) => {
        if (a < 0.03) return
        ctx.strokeStyle = pc('warm', a)
        ctx.lineWidth = 1.6
        ctx.beginPath()
        for (let i = 0; i <= 720; i++) {
          const theta = (i / 720) * Math.PI * 2
          const r = RB * Math.sin(nPet * theta)
          const x = CX + r * Math.cos(theta)
          const y = CY + r * Math.sin(theta)
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      drawEnvelope(nLo, (1 - f) * 0.5)
      drawEnvelope(nLo + 1, f * 0.5)
    })
  },
}
