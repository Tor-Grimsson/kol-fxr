
import { clear, strokeOutline, wrapLoop, sampleInside, pc, rampRGB } from '../common.js'

// Diffusion-limited aggregation. Random walkers wander until they touch the
// growing aggregate; they stick and new walkers spawn. Classic branching
// fractal, well-suited to SDF-bounded domains.
//
// Reference: jasonwebb/2d-diffusion-limited-aggregation-experiments
//
// THEATRICAL REWORK (2026-08-09 — "boring blue cluster" fix): growth reads
// as HEAT. Every stick event fires a warm flash ring and the new node is
// born blazing, cooling over ~1s into the lattice; the whole dendrite
// carries a temperature gradient (newest warm and thick, oldest deep dim
// and thin) so you can read the crystal's history at a glance. Walkers are
// a visible drifting mist; pruned leaves die as warm embers. Press bursts
// the walker pool onto the cursor and the aggregate erupts there.
export const dla            = {
  id: '06-dla',
  name: 'DIFFUSION-LIMITED AGGREGATION',
  repo: 'jasonwebb/2d-diffusion-limited-aggregation-experiments',
  summary:
    'Random walkers step until they touch a stuck particle and join the aggregate. The boundary shape (SDF) bounces walkers inward. Output is organic dendritic branching — crystal-like fingers growing from a seed.',
  helps:
    'Slow, crystalline growth — most "fractal vector" of the candidates. Matches the "fractal vector points" language from the brief literally. Strong candidate for a triggered growth spell.',
  params: [
    { key: 'nWalkers', type: 'int', min: 50, max: 800, step: 10, default: 200, label: 'walkers' },
    { key: 'stickDist', type: 'range', min: 1, max: 12, step: 0.5, default: 3, label: 'stick dist' },
    { key: 'step', type: 'range', min: 0.5, max: 6, step: 0.1, default: 2, label: 'step' },
    { key: 'maxStuck', type: 'int', min: 500, max: 8000, step: 100, default: 4000, label: 'max stuck' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.max(1, Math.min(W, H) / 320) // size unit — marks scale with the canvas

    const { nWalkers, stickDist, step, maxStuck } = params

    const stuck = []
    const walkers = []
    const flashes = []  // stick-event pulses { x, y, f }

    const COOL = 70     // frames a fresh node blazes before settling (~1.2s)
    const AGE = 1200    // frames from settled to deep-dim old growth
    const FADE_FRAMES = 70
    const PRUNE_FADE = 40

    // seed: one particle at a random interior point
    const [sx0, sy0] = sampleInside(sdf, rng)
    stuck.push({ x: sx0, y: sy0, parent: -1, kids: 0, dead: false, dis: 0, born: 0 })

    const spawnWalker = () => {
      const [x, y] = sampleInside(sdf, rng)
      return { x, y, alive: true }
    }
    for (let i = 0; i < nWalkers; i++) walkers.push(spawnWalker())

    /* Living system: the aggregate no longer fossilizes at maxStuck — when
     * full it dissolves and reseeds (under the cursor when present) and
     * regrows with the same walkers. Below the cap it breathes: the oldest
     * LEAF nodes are pruned slowly, dying as embers, so branch tips retreat
     * while walkers extend others. */
    let fade = 0
    let aliveStuck = 1
    let tick = 0
    let prevDown = false
    let burstIdx = 0

    // PERF: temperature buckets hoisted — reallocating 2×8 arrays per frame
    // was churn; they length-reset each render pass instead
    const BK = 8
    const edgeBk = Array.from({ length: BK }, () => [])
    const tipBk = Array.from({ length: BK }, () => [])

    // spatial grid of stuck particles for O(1) neighbor checks
    const cs = 12
    const gw = Math.ceil(sdf.w / cs) + 1
    const gh = Math.ceil(sdf.h / cs) + 1
    const grid = new Array(gw * gh)
    for (let i = 0; i < grid.length; i++) grid[i] = []
    const gi = (x, y) =>
      Math.max(0, Math.min(gh - 1, Math.floor(y / cs))) * gw +
      Math.max(0, Math.min(gw - 1, Math.floor(x / cs)))
    grid[gi(stuck[0].x, stuck[0].y)].push(0)

    return wrapLoop(() => {
      tick++
      // Pointer attract — walkers drift toward the cursor so the aggregate
      // grows in that direction. Stuck particles never move (grid-keyed).
      const ptr = params.interact > 0 && pointer ? pointer() : null

      // press = walker BURST — relocate the rotating walker pool onto a ring
      // at the cursor; the aggregate erupts there
      if (ptr && ptr.down && !prevDown) {
        const nb = Math.round(walkers.length * Math.min(1, params.interact))
        for (let k = 0; k < nb; k++) {
          const w = walkers[burstIdx++ % walkers.length]
          const a = (k / nb) * Math.PI * 2
          const r = stickDist * (4 + rng() * 4)
          const bx = ptr.x + Math.cos(a) * r
          const by = ptr.y + Math.sin(a) * r
          if (sdf.sample(bx, by) < 0) { w.x = bx; w.y = by }
        }
      }
      prevDown = !!(ptr && ptr.down)

      // lifecycle — dissolve at the cap, reseed when the fade lands
      if (fade > 0) {
        fade--
        if (fade === 0) {
          stuck.length = 0
          for (let i = 0; i < grid.length; i++) grid[i].length = 0
          const [rx, ry] = ptr && sdf.sample(ptr.x, ptr.y) < -3
            ? [ptr.x, ptr.y]
            : sampleInside(sdf, rng)
          stuck.push({ x: rx, y: ry, parent: -1, kids: 0, dead: false, dis: 0, born: tick })
          grid[gi(rx, ry)].push(0)
          aliveStuck = 1
        }
      } else if (stuck.length >= maxStuck) {
        fade = FADE_FRAMES
      }

      // slow leaf pruning — oldest live leaf dies as an ember; its parent
      // becomes a leaf in turn, so old branches retreat from the tip inward
      if (fade === 0 && aliveStuck > 60 && tick % 2 === 0) {
        for (let i = 1; i < stuck.length; i++) {
          const s = stuck[i]
          if (s.dead || s.kids > 0) continue
          s.dead = true
          s.dis = PRUNE_FADE
          aliveStuck--
          if (s.parent >= 0) stuck[s.parent].kids--
          const bucket = grid[gi(s.x, s.y)]
          const bi = bucket.indexOf(i)
          if (bi >= 0) bucket.splice(bi, 1)
          break
        }
      }
      for (const s of stuck) if (s.dead && s.dis > 0) s.dis--

      for (const w of walkers) {
        if (!w.alive) continue
        // random walk — pointer bias: add a small to-cursor vector, renormalize
        const ang = rng() * Math.PI * 2
        let dx = Math.cos(ang), dy = Math.sin(ang)
        if (ptr) {
          const pdx = ptr.x - w.x, pdy = ptr.y - w.y
          const pm = Math.hypot(pdx, pdy) || 1
          dx += (pdx / pm) * 0.25 * params.interact
          dy += (pdy / pm) * 0.25 * params.interact
          const bm = Math.hypot(dx, dy) || 1
          dx /= bm; dy /= bm
        }
        const nx = w.x + dx * step
        const ny = w.y + dy * step
        if (sdf.sample(nx, ny) >= 0) continue // reflect: skip this step (bounce at boundary)
        w.x = nx; w.y = ny

        // collision check against stuck in nearby cells
        const gx = Math.floor(w.x / cs), gy = Math.floor(w.y / cs)
        let hit = -1
        outer: for (let j = -1; j <= 1; j++) {
          const yy = gy + j
          if (yy < 0 || yy >= gh) continue
          for (let i2 = -1; i2 <= 1; i2++) {
            const xx = gx + i2
            if (xx < 0 || xx >= gw) continue
            const bucket = grid[yy * gw + xx]
            for (let k = 0; k < bucket.length; k++) {
              const idx = bucket[k]
              const s = stuck[idx]
              const ddx = s.x - w.x, ddy = s.y - w.y
              if (ddx * ddx + ddy * ddy < stickDist * stickDist) { hit = idx; break outer }
            }
          }
        }
        if (hit >= 0 && fade === 0) { // nothing sticks to a dissolving aggregate
          const idx = stuck.length
          stuck.push({ x: w.x, y: w.y, parent: hit, kids: 0, dead: false, dis: 0, born: tick })
          stuck[hit].kids++
          aliveStuck++
          grid[gi(w.x, w.y)].push(idx)
          // the stick event flashes — growth reads
          flashes.push({ x: w.x, y: w.y, f: 1 })
          if (flashes.length > 80) flashes.shift()
          // respawn walker elsewhere
          const nw = spawnWalker()
          w.x = nw.x; w.y = nw.y
        }
      }

      // ── Render — accent+warm crystal with a temperature history ──
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, pc('fg', 0.18), 1.4)

      const dis = fade > 0 ? fade / FADE_FRAMES : 1

      // walkers — the drifting mist the crystal feeds on (PERF: one batched
      // path + one fill instead of a fill per walker)
      ctx.fillStyle = pc('dim', 0.15)
      ctx.beginPath()
      const wR = 1.9 * U
      for (const w of walkers) {
        if (!w.alive) continue
        ctx.moveTo(w.x * sx + wR, w.y * sy)
        ctx.arc(w.x * sx, w.y * sy, wR, 0, Math.PI * 2)
      }
      ctx.fill()

      // temperature buckets — tv 1 = just stuck (warm, thick, glowing),
      // tv 0 = old growth (deep dim, thin). Edges and tips batch per bucket.
      for (let bk = 0; bk < BK; bk++) { edgeBk[bk].length = 0; tipBk[bk].length = 0 }
      for (let i = 1; i < stuck.length; i++) {
        const s = stuck[i]
        if (s.dead) continue
        const heat = Math.max(0, 1 - (tick - s.born) / COOL)
        const aged = Math.min(1, (tick - s.born) / AGE)
        const tv = Math.max(heat, (1 - aged) * 0.75)
        const bk = Math.min(BK - 1, Math.round(tv * (BK - 1)))
        if (s.parent >= 0) edgeBk[bk].push(i)
        if (s.kids === 0) tipBk[bk].push(i)
      }
      // PERF: shadowBlur is gone — the hottest bucket glows via a wide
      // low-alpha under-stroke (edges) and oversized low-alpha discs (tips),
      // each one extra batched draw instead of a per-draw blur pass.
      for (let bk = 0; bk < BK; bk++) {
        const g = bk / (BK - 1)
        const [rr, gg, bb] = rampRGB(0.25 + g * 0.75) // dim → accent → warm
        if (edgeBk[bk].length) {
          ctx.beginPath()
          for (const i of edgeBk[bk]) {
            const s = stuck[i]
            const p = stuck[s.parent]
            ctx.moveTo(p.x * sx, p.y * sy)
            ctx.lineTo(s.x * sx, s.y * sy)
          }
          if (bk === BK - 1) {
            ctx.strokeStyle = pc('warm', 0.28 * dis)
            ctx.lineWidth = (1.1 + 1.3 * g) * U * 2.6
            ctx.stroke()
          }
          ctx.strokeStyle = `rgba(${rr},${gg},${bb},${((0.3 + 0.6 * g) * dis).toFixed(3)})`
          ctx.lineWidth = (1.1 + 1.3 * g) * U
          ctx.stroke()
        }
        if (tipBk[bk].length) {
          const tR = (1.4 + 1.6 * g) * U
          if (bk === BK - 1) {
            ctx.fillStyle = pc('warm', 0.3 * dis)
            ctx.beginPath()
            for (const i of tipBk[bk]) {
              const s = stuck[i]
              ctx.moveTo(s.x * sx + tR * 2.2, s.y * sy)
              ctx.arc(s.x * sx, s.y * sy, tR * 2.2, 0, Math.PI * 2)
            }
            ctx.fill()
          }
          ctx.fillStyle = `rgba(${rr},${gg},${bb},${((0.5 + 0.5 * g) * dis).toFixed(3)})`
          ctx.beginPath()
          for (const i of tipBk[bk]) {
            const s = stuck[i]
            ctx.moveTo(s.x * sx + tR, s.y * sy)
            ctx.arc(s.x * sx, s.y * sy, tR, 0, Math.PI * 2)
          }
          ctx.fill()
        }
      }

      // pruned leaves die as embers — edge fades, warm coal shrinks out
      ctx.lineWidth = 0.9 * U
      for (const s of stuck) {
        if (!s.dead || s.dis <= 0) continue
        const a = (s.dis / PRUNE_FADE) * dis
        if (s.parent >= 0) {
          const p = stuck[s.parent]
          ctx.strokeStyle = pc('accent', 0.6 * a)
          ctx.beginPath()
          ctx.moveTo(p.x * sx, p.y * sy)
          ctx.lineTo(s.x * sx, s.y * sy)
          ctx.stroke()
        }
        ctx.fillStyle = pc('warm', a)
        ctx.beginPath()
        ctx.arc(s.x * sx, s.y * sy, (0.8 + 1.8 * a) * U, 0, Math.PI * 2)
        ctx.fill()
      }

      // stick-event flash rings — a bright pulse cooling out over ~1s
      for (let i = flashes.length - 1; i >= 0; i--) {
        const fl = flashes[i]
        fl.f -= 0.025
        if (fl.f <= 0) { flashes.splice(i, 1); continue }
        ctx.strokeStyle = pc('warm', fl.f * 0.85 * dis)
        ctx.lineWidth = 1.6 * U
        ctx.beginPath()
        ctx.arc(fl.x * sx, fl.y * sy, ((1 - fl.f) * 14 + 2) * U, 0, Math.PI * 2)
        ctx.stroke()
      }
    })
  },
}
