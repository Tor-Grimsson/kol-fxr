import { createNoise2D } from 'simplex-noise'

import { clear, strokeOutline, wrapLoop, sampleInside, pc } from '../common.js'




// Demonstration of layer interaction: a packed-circles layer (static structure)
// + a flow-field particle layer (live motion) whose particles are REPELLED by
// the circle centers. This is the "layer A influences layer B" contract the
// brief asks for. Here: A is structural, B is motion; later, A could also
// respond to B (e.g. circles that shrink when many particles cross them).
export const layered            = {
  id: '13-layered',
  name: 'LAYERED (PACK × FLOW)',
  repo: 'composition · own code',
  summary:
    'TWO LAYERS live on the same canvas. Layer A: packed circles (dart-throw, SDF-masked). Layer B: flow-field particles (simplex-noise angle field, SDF-respawn). Layer B READS Layer A — each particle is repelled by the nearest circle center within a radius. The brief\'s "additive / subtractive / life-death" rules plug in here as additional cross-layer forces.',
  helps:
    'The actual vision, in miniature. Two layers, one reading the other\'s positions. Everything we need to scale to N layers with named interaction contracts lives in this pattern.',
  params: [
    { key: 'minR', type: 'int', min: 4, max: 24, default: 10, label: 'min radius' },
    { key: 'maxR', type: 'int', min: 20, max: 80, default: 46, label: 'max radius' },
    { key: 'attempts', type: 'int', min: 1000, max: 12000, step: 500, default: 5000, label: 'density' },
    { key: 'particles', type: 'int', min: 100, max: 1500, step: 50, default: 500, label: 'particles' },
    { key: 'noiseScale', type: 'range', min: 0.002, max: 0.04, step: 0.001, default: 0.01, label: 'flow scale' },
    { key: 'repelR', type: 'int', min: 8, max: 60, default: 26, label: 'repel radius' },
    { key: 'repelStrength', type: 'range', min: 0, max: 4, step: 0.1, default: 1.2, label: 'repel strength' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.max(1, Math.min(W, H) / 320) // size unit — marks scale with the canvas

    const { minR, maxR, attempts, particles, repelR, repelStrength } = params

    // ---- Layer A: packed circles (static) ----
    const circles           = []
    const padding = 2
    const cell = Math.max(minR, 2)
    const gw = Math.ceil(sdf.w / cell) + 1
    const gh = Math.ceil(sdf.h / cell) + 1
    const gridA             = new Array(gw * gh)
    for (let i = 0; i < gridA.length; i++) gridA[i] = []
    const gi = (x        , y        ) =>
      Math.max(0, Math.min(gh - 1, Math.floor(y / cell))) * gw +
      Math.max(0, Math.min(gw - 1, Math.floor(x / cell)))
    const collides = (x        , y        , r        )          => {
      const cx = Math.floor(x / cell), cy = Math.floor(y / cell)
      const reach = Math.max(1, Math.ceil((r + maxR) / cell))
      for (let j = -reach; j <= reach; j++) {
        const yy = cy + j
        if (yy < 0 || yy >= gh) continue
        for (let i = -reach; i <= reach; i++) {
          const xx = cx + i
          if (xx < 0 || xx >= gw) continue
          const bucket = gridA[yy * gw + xx]
          for (let k = 0; k < bucket.length; k++) {
            const c = circles[bucket[k]]
            const dx = c.x - x, dy = c.y - y
            const s = c.r + r + padding
            if (dx * dx + dy * dy < s * s) return true
          }
        }
      }
      return false
    }
    for (const [lo, hi] of [[maxR * 0.7, maxR], [maxR * 0.4, maxR * 0.7], [minR, maxR * 0.4]]                      ) {
      for (let i = 0; i < attempts; i++) {
        const x = rng() * sdf.w, y = rng() * sdf.h
        const s = sdf.sample(x, y)
        if (s >= 0) continue
        const maxPoss = Math.min(maxR, -s * 0.85 - padding)
        if (maxPoss < lo) continue
        const r = Math.min(maxPoss, hi)
        if (r < minR || collides(x, y, r)) continue
        const idx = circles.length
        circles.push({ x, y, r })
        gridA[gi(x, y)].push(idx)
      }
    }

    // ---- Layer B: flow-field particles (animated, reads layer A) ----
    const noise2D = createNoise2D(rng)
    const noiseScale = params.noiseScale
    const ps             = []
    const N = particles
    const spawn = ()           => {
      const [x, y] = sampleInside(sdf, rng)
      return { x, y, px: x, py: y, life: (rng() * 160) | 0 }
    }
    for (let i = 0; i < N; i++) ps.push(spawn())

    clear(ctx, W, H)

    const ptrReach = Math.min(sdf.w, sdf.h) * 0.15

    /* Living system (2026-08-09): press = SCATTER BURST. The down-edge arms
     * a few-frame radial impulse on Layer-B particles around the press point
     * — their trails paint the shockwave — then the flow re-gathers them. */
    let prevDown = false
    let burst = null
    const BURST_TTL = 14 // 2× the old event window

    return wrapLoop(() => {
      // Pointer repel — layer B (particles) only; layer A's grid is
      // position-keyed at insert, so circles never move.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      if (ptr?.down && !prevDown) burst = { x: ptr.x, y: ptr.y, ttl: BURST_TTL }
      prevDown = !!(ptr && ptr.down)
      if (burst && --burst.ttl <= 0) burst = null
      ctx.fillStyle = pc('bg', 0.07)
      ctx.fillRect(0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, pc('fg', 0.15), 1.4)

      // Layer A — the pack is quiet dim structure under the accent motion
      // PERF: batched — one stroked path for all rings, one filled for centers
      ctx.strokeStyle = pc('dim', 0.08)
      ctx.lineWidth = 0.7 * U
      const rScale = Math.min(sx, sy)
      ctx.beginPath()
      for (const c of circles) {
        const rr = c.r * rScale
        ctx.moveTo(c.x * sx + rr, c.y * sy)
        ctx.arc(c.x * sx, c.y * sy, rr, 0, Math.PI * 2)
      }
      ctx.stroke()
      ctx.fillStyle = pc('warm', 0.9)
      ctx.beginPath()
      const dotR = 1.8 * U
      for (const c of circles) {
        ctx.moveTo(c.x * sx + dotR, c.y * sy)
        ctx.arc(c.x * sx, c.y * sy, dotR, 0, Math.PI * 2)
      }
      ctx.fill()

      // Layer B — accent-led flow ribbons, repelled by nearest circle center
      ctx.strokeStyle = pc('accent', 0.75)
      ctx.lineWidth = 0.9 * U
      // ANTI-STROBE: cap the per-frame step — the burst impulse could
      // otherwise fling a particle ~8% of the canvas in one frame
      const stepCap = Math.min(sdf.w, sdf.h) * 0.02
      ctx.beginPath()
      for (const p of ps) {
        p.px = p.x
        p.py = p.y
        const ang = noise2D(p.x * noiseScale, p.y * noiseScale) * Math.PI * 2
        let vx = Math.cos(ang) * 1.3
        let vy = Math.sin(ang) * 1.3

        // cross-layer repulsion: find nearest circle within repelR
        const cxg = Math.floor(p.x / cell), cyg = Math.floor(p.y / cell)
        let best = -1, bestD2 = repelR * repelR
        for (let j = -1; j <= 1; j++) {
          const yy = cyg + j
          if (yy < 0 || yy >= gh) continue
          for (let i = -1; i <= 1; i++) {
            const xx = cxg + i
            if (xx < 0 || xx >= gw) continue
            const bucket = gridA[yy * gw + xx]
            for (let k = 0; k < bucket.length; k++) {
              const c = circles[bucket[k]]
              const dx = p.x - c.x, dy = p.y - c.y
              const d2 = dx * dx + dy * dy
              if (d2 < bestD2) { bestD2 = d2; best = bucket[k] }
            }
          }
        }
        if (best >= 0) {
          const c = circles[best]
          const dx = p.x - c.x, dy = p.y - c.y
          const d = Math.sqrt(bestD2) || 1
          const force = (1 - d / repelR) * repelStrength
          vx += (dx / d) * force
          vy += (dy / d) * force
        }

        // pointer repulsion: same falloff shape as the circle repulsion above
        if (ptr) {
          const pdx = p.x - ptr.x, pdy = p.y - ptr.y
          const pd2 = pdx * pdx + pdy * pdy
          if (pd2 < ptrReach * ptrReach && pd2 > 1e-6) {
            const pd = Math.sqrt(pd2)
            const pf = (1 - pd / ptrReach) * 1.2 * params.interact
            vx += (pdx / pd) * pf
            vy += (pdy / pd) * pf
          }
        }
        // scatter burst — decaying radial impulse from the press point; the
        // px→x trail stroke paints the explosion streaks
        if (burst) {
          const bdx = p.x - burst.x, bdy = p.y - burst.y
          const bd = Math.hypot(bdx, bdy)
          const bR = ptrReach * 3
          if (bd < bR && bd > 1e-6) {
            const bf = (burst.ttl / BURST_TTL) * (1 - bd / bR) * Math.min(sdf.w, sdf.h) * 0.08 * params.interact
            vx += (bdx / bd) * bf
            vy += (bdy / bd) * bf
          }
        }

        const vm = Math.hypot(vx, vy)
        if (vm > stepCap) { vx = (vx / vm) * stepCap; vy = (vy / vm) * stepCap }
        p.x += vx
        p.y += vy
        p.life--
        if (p.life <= 0 || sdf.sample(p.x, p.y) >= 0) {
          const n = spawn()
          p.x = n.x; p.y = n.y; p.px = n.x; p.py = n.y; p.life = 160
          continue
        }
        ctx.moveTo(p.px * sx, p.py * sy)
        ctx.lineTo(p.x * sx, p.y * sy)
      }
      ctx.stroke()

      // heads — the ribbons get bodies (batched: one path + one fill)
      ctx.fillStyle = pc('accent', 0.95)
      ctx.beginPath()
      const headR = 1.5 * U
      for (const p of ps) {
        ctx.moveTo(p.x * sx + headR, p.y * sy)
        ctx.arc(p.x * sx, p.y * sy, headR, 0, Math.PI * 2)
      }
      ctx.fill()
    })
  },
}
