
import { clear, strokeOutline, wrapLoop, sampleInside } from '../common.js'




// Space colonization (Runions 2007). Scatter attractors inside the SDF;
// each branch node grows toward the average direction of attractors within
// a perception radius; attractors die once a branch gets close. Produces
// the venation / root-system / dendrite look.
//
// Reference: jasonwebb/2d-space-colonization-experiments
// Paper: algorithmicbotany.org/papers/colonization.egwnp2007.pdf
export const spaceCol            = {
  id: '03-space-col',
  name: 'SPACE COLONIZATION',
  repo: 'jasonwebb/2d-space-colonization-experiments',
  summary:
    'Runions 2007 venation algorithm. Attractors live inside the glyph; each branch tip advances toward the mean of its visible attractors; attractors die on contact. Output is dendritic — like a root system conforming to the letter.',
  helps:
    'Venation / radial-spoke vocabulary that matches the ref-image cell structure. Multiple trees can co-grow and compete for attractors → natural layer interaction (two layers = two trees that steal each other\'s auxin).',
  params: [
    { key: 'attractorCount', type: 'int', min: 100, max: 2400, step: 50, default: 900, label: 'attractors' },
    { key: 'perception', type: 'int', min: 20, max: 200, default: 80, label: 'perception' },
    { key: 'killDist', type: 'range', min: 2, max: 30, step: 0.5, default: 8, label: 'kill dist' },
    { key: 'stepSize', type: 'range', min: 1, max: 10, step: 0.5, default: 3, label: 'step size' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h

    const { attractorCount, perception, killDist, stepSize } = params

    const attractors              = []
    while (attractors.length < attractorCount) {
      const [x, y] = sampleInside(sdf, rng, 1)
      if (sdf.sample(x, y) < -3) attractors.push({ x, y, alive: true })
    }

    const branches           = []
    // seed: start from a random interior point with no parent
    const [sx0, sy0] = sampleInside(sdf, rng)
    branches.push({ x: sx0, y: sy0, parent: -1, alive: true })

    /* Living system (2026-08-09 — a one-shot growth that fossilizes in
     * seconds is not a generation): food replenishes in a steady trickle,
     * the pointer SPRAYS food the veins chase (the Runions-native
     * interaction — no direction hacks), and an overgrown or stalled tree
     * dissolves and reseeds. Grow → mature → dissolve → regrow, forever. */
    let stall = 0
    let fade = 0                  // > 0 → dissolving, counts down to reseed
    const BRANCH_CAP = 3500       // ponytail: rebirth trigger doubles as the perf bound
    const FADE_FRAMES = 45
    const reseed = (px, py) => {
      branches.length = 0
      const [rx, ry] = px != null && sdf.sample(px, py) < -3 ? [px, py] : sampleInside(sdf, rng)
      branches.push({ x: rx, y: ry, parent: -1, alive: true })
    }
    const reviveAt = (x, y) => {
      if (sdf.sample(x, y) >= -3) return
      const slot = attractors.find((a) => !a.alive)
      if (slot) { slot.x = x; slot.y = y; slot.alive = true }
      else if (attractors.length < attractorCount * 2) attractors.push({ x, y, alive: true })
    }

    /* PERF (2026-08-09): the attractor→branch nearest scan was all-pairs —
     * up to attractors×BRANCH_CAP (~17M) distance checks per frame. Branches
     * now bucket into a spatial grid (cell = perception, so a 3×3 scan covers
     * the search radius exactly); buckets are hoisted and length-reset. */
    const cs = Math.max(8, perception)
    const gw = Math.ceil(sdf.w / cs) + 1
    const gh = Math.ceil(sdf.h / cs) + 1
    const grid = new Array(gw * gh)
    for (let i = 0; i < grid.length; i++) grid[i] = []

    return wrapLoop(() => {
      const perception2 = perception * perception
      const kill2 = killDist * killDist
      const ptr = params.interact > 0 && pointer ? pointer() : null

      // food replenishment — a steady trickle keeps the system foraging
      for (let k = 0; k < Math.ceil(attractorCount / 400); k++) {
        const [x, y] = sampleInside(sdf, rng, 8)
        reviveAt(x, y)
      }
      // pointer sprays food — veins grow to the cursor; hold to pour
      if (ptr) {
        const n = Math.round((ptr.down ? 6 : 2) * params.interact)
        for (let k = 0; k < n; k++) {
          const a = rng() * Math.PI * 2
          const r = rng() * perception * 0.6
          reviveAt(ptr.x + Math.cos(a) * r, ptr.y + Math.sin(a) * r)
        }
      }

      // rebuild the branch grid (branch positions are append-only, but the
      // array grows each frame — a rebuild into hoisted buckets is cheap)
      for (let i = 0; i < grid.length; i++) grid[i].length = 0
      for (let i = 0; i < branches.length; i++) {
        const b = branches[i]
        if (!b.alive) continue
        const gx = Math.max(0, Math.min(gw - 1, Math.floor(b.x / cs)))
        const gy = Math.max(0, Math.min(gh - 1, Math.floor(b.y / cs)))
        grid[gy * gw + gx].push(i)
      }

      // For each live attractor, find nearest live branch within perception
      const pulls = new Map                                               ()
      for (const atr of attractors) {
        if (!atr.alive) continue
        let best = -1
        let bestD2 = perception2
        const agx = Math.floor(atr.x / cs), agy = Math.floor(atr.y / cs)
        for (let j = -1; j <= 1; j++) {
          const yy = agy + j
          if (yy < 0 || yy >= gh) continue
          for (let i2 = -1; i2 <= 1; i2++) {
            const xx = agx + i2
            if (xx < 0 || xx >= gw) continue
            const bucket = grid[yy * gw + xx]
            for (let k = 0; k < bucket.length; k++) {
              const bi = bucket[k]
              const b = branches[bi]
              const dx = atr.x - b.x, dy = atr.y - b.y
              const d2 = dx * dx + dy * dy
              if (d2 < bestD2) { bestD2 = d2; best = bi }
            }
          }
        }
        if (best < 0) continue
        if (bestD2 < kill2) { atr.alive = false; continue }
        const b = branches[best]
        const dx = atr.x - b.x, dy = atr.y - b.y
        const m = Math.hypot(dx, dy) || 1
        const cur = pulls.get(best) ?? { dx: 0, dy: 0, n: 0 }
        cur.dx += dx / m
        cur.dy += dy / m
        cur.n += 1
        pulls.set(best, cur)
      }

      // Grow branches toward mean attractor direction
      const newBranches           = []
      for (const [idx, p] of pulls.entries()) {
        const m = Math.hypot(p.dx, p.dy) || 1
        const b = branches[idx]
        const dx = p.dx / m, dy = p.dy / m
        const nx = b.x + dx * stepSize
        const ny = b.y + dy * stepSize
        if (sdf.sample(nx, ny) < 0) {
          newBranches.push({ x: nx, y: ny, parent: idx, alive: true })
        }
      }
      const base = branches.length
      for (const nb of newBranches) branches.push(nb)

      // Previous tips lose 'alive' if they didn't grow (no pulls)
      for (let i = 0; i < base; i++) {
        if (!pulls.has(i)) { /* still alive, maybe grows next tick */ }
      }

      // lifecycle — dissolve and reseed when overgrown or stalled; a reseed
      // lands under the cursor when one is present
      if (fade > 0) {
        fade--
        if (fade === 0) reseed(ptr?.x, ptr?.y)
      } else {
        stall = newBranches.length === 0 ? stall + 1 : 0
        if (branches.length > BRANCH_CAP || stall > 120) { fade = FADE_FRAMES; stall = 0 }
      }
      const dis = fade > 0 ? fade / FADE_FRAMES : 1

      // Render
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(243, 231, 207, 0.18)', 1)

      // edges
      ctx.strokeStyle = `rgba(210, 215, 235, ${0.7 * dis})`
      ctx.lineWidth = 1.0
      ctx.beginPath()
      for (let i = 0; i < branches.length; i++) {
        const b = branches[i]
        if (b.parent < 0) continue
        const p = branches[b.parent]
        ctx.moveTo(p.x * sx, p.y * sy)
        ctx.lineTo(b.x * sx, b.y * sy)
      }
      ctx.stroke()

      // attractors (dim) — PERF: batched, one path + one fill
      ctx.fillStyle = 'rgba(170, 174, 220, 0.5)'
      ctx.beginPath()
      for (const atr of attractors) {
        if (!atr.alive) continue
        ctx.moveTo(atr.x * sx + 0.9, atr.y * sy)
        ctx.arc(atr.x * sx, atr.y * sy, 0.9, 0, Math.PI * 2)
      }
      ctx.fill()

      // branch nodes — batched
      ctx.fillStyle = `rgba(243, 201, 196, ${dis})`
      ctx.beginPath()
      for (const b of branches) {
        ctx.moveTo(b.x * sx + 1.3, b.y * sy)
        ctx.arc(b.x * sx, b.y * sy, 1.3, 0, Math.PI * 2)
      }
      ctx.fill()
    })
  },
}
