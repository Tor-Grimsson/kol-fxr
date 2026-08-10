import { createNoise2D } from 'simplex-noise'

import { clear, strokeOutline, wrapLoop, sampleInside, stampGrid, pc } from '../common.js'



// Flow-field ECOSYSTEM. The simplex angle field still steers everything, but
// the particles are now organisms with energy: they graze a visible food
// field, starve and die when it's mowed, split when they gorge. Food regrows;
// the pointer drops food (hover) and injects a vortex (press). Population
// booms and crashes — Lotka-Volterra with the flow as weather.
//
// Tyler Hobbs' canonical flow-field essay is the reference for the aesthetic.
// https://tylerxhobbs.com/essays/2020/flow-fields
export const flowField            = {
  id: '07-flow-field',
  name: 'FLOW FIELD',
  repo: 'tylerxhobbs.com/essays/2020/flow-fields',
  summary:
    'Simplex noise → angle field, but the particles are ORGANISMS. Each carries energy: grazing the food field (rendered as accent ground) feeds it, moving burns it. Full organisms split — visible birth flashes — starved ones die with a collapse ring. Food regrows; hover pours food, press spins a vortex. The population visibly booms, mows the field bare, crashes, and recovers.',
  helps:
    'The motion layer becomes a life layer: birth, death, food and famine on top of the ribbon aesthetic. Hover feeds a bloom exactly where you point.',
  params: [
    { key: 'count', type: 'int', min: 100, max: 3000, step: 50, default: 700, label: 'max organisms' },
    { key: 'scale', type: 'range', min: 0.001, max: 0.03, step: 0.001, default: 0.008, label: 'noise scale' },
    { key: 'speed', type: 'range', min: 0.3, max: 4, step: 0.1, default: 1.6, label: 'speed' },
    { key: 'life', type: 'int', min: 40, max: 600, step: 10, default: 160, label: 'starve time' },
    { key: 'foodRegrow', type: 'range', min: 0.2, max: 3, step: 0.1, default: 1, label: 'food regrowth' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.max(1, Math.min(W, H) / 320) // size unit — marks scale with the canvas

    const { scale, speed, life: starveTime } = params

    const noise2D = createNoise2D(rng)

    // ── food field — coarse grid over the sim, alive only inside the mask ──
    const cell = 8
    const fw = Math.ceil(sdf.w / cell)
    const fh = Math.ceil(sdf.h / cell)
    const food = new Float32Array(fw * fh)
    const inMask = new Uint8Array(fw * fh)
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        const i = y * fw + x
        if (sdf.sample((x + 0.5) * cell, (y + 0.5) * cell) < 0) {
          inMask[i] = 1
          food[i] = 0.35 + rng() * 0.55
        }
      }
    }
    const regrow = 0.0035 * params.foodRegrow
    const foodAt = (x, y) => {
      const ix = Math.max(0, Math.min(fw - 1, (x / cell) | 0))
      const iy = Math.max(0, Math.min(fh - 1, (y / cell) | 0))
      return food[iy * fw + ix]
    }

    // ── organisms ──
    const cap = params.count
    const orgs = []
    const spawn = (x, y, e) => {
      if (x === undefined) [x, y] = sampleInside(sdf, rng)
      orgs.push({ x, y, px: x, py: y, e: e ?? 0.35 + rng() * 0.3, hunger: 0 })
    }
    for (let i = 0; i < Math.max(40, (cap * 0.25) | 0); i++) spawn()

    // birth / death flashes — the population dynamics must READ
    const events = []

    // PERF: hoisted render buckets — food tiers (single scan instead of 4)
    // and starving-head alpha levels (batched fills instead of per-org)
    const tierIdx = [[], [], [], []]
    const TIER_ALPHA = [0.1, 0.07, 0.04, 0.02]
    const STARVE_BK = 6
    const starveBk = Array.from({ length: STARVE_BK }, () => [])

    // trails accumulate — don't clear between frames, just fade
    clear(ctx, W, H)

    /* Press = VORTEX injection, 2× the old charge. While held the vortex
     * rides the cursor at full strength; on release it decays in place — a
     * swirl event the field then washes away. */
    let vortex = null
    const VORTEX_TTL = 70
    const vortexR = Math.min(sdf.w, sdf.h) * 0.3

    return wrapLoop(() => {
      const ptr = params.interact > 0 && pointer ? pointer() : null
      if (ptr && ptr.down) vortex = { x: ptr.x, y: ptr.y, ttl: VORTEX_TTL }
      else if (vortex && --vortex.ttl <= 0) vortex = null

      // food regrows everywhere inside the mask
      for (let i = 0; i < food.length; i++) {
        if (inMask[i] && food[i] < 1) food[i] = Math.min(1, food[i] + regrow)
      }
      // hover pours food — a visible stamp the herd then swarms
      if (ptr && !ptr.down) {
        stampGrid(fw, fh, { x: ptr.x / cell, y: ptr.y / cell }, (34 / cell) * Math.min(2, params.interact), (i, w) => {
          if (inMask[i]) food[i] = Math.min(1, food[i] + w * 0.3)
        })
      }

      // ── organism step: steer, move, eat, split, starve ──
      // ANTI-STROBE: cap the per-frame step (vortex at high interact could
      // fling an organism several % of the canvas in one frame)
      const stepCap = Math.min(sdf.w, sdf.h) * 0.02
      for (let oi = orgs.length - 1; oi >= 0; oi--) {
        const p = orgs[oi]
        p.px = p.x
        p.py = p.y
        let a = noise2D(p.x * scale, p.y * scale) * Math.PI * 2
        // food whiskers — steer toward the richer side
        const wd = 12
        const fL = foodAt(p.x + Math.cos(a - 0.7) * wd, p.y + Math.sin(a - 0.7) * wd)
        const fR = foodAt(p.x + Math.cos(a + 0.7) * wd, p.y + Math.sin(a + 0.7) * wd)
        a += Math.max(-0.8, Math.min(0.8, (fR - fL) * 1.6))
        const v = speed * (0.6 + 0.8 * p.e)
        let vx = Math.cos(a) * v
        let vy = Math.sin(a) * v
        // hover attracts — they smell the poured food from across the glyph
        if (ptr && !ptr.down) {
          const rdx = ptr.x - p.x, rdy = ptr.y - p.y
          const rd = Math.hypot(rdx, rdy)
          const reach = Math.min(sdf.w, sdf.h) * 0.3
          if (rd < reach && rd > 1e-6) {
            const rf = (1 - rd / reach) * speed * 0.6 * params.interact
            vx += (rdx / rd) * rf
            vy += (rdy / rd) * rf
          }
        }
        // vortex — perpendicular (swirl) term plus suction, 2× the old charge
        if (vortex) {
          const vdx = p.x - vortex.x, vdy = p.y - vortex.y
          const vd = Math.hypot(vdx, vdy)
          if (vd < vortexR && vd > 1e-6) {
            const vs = (vortex.ttl / VORTEX_TTL) * (1 - vd / vortexR) * speed * 4.4 * params.interact
            vx += (-vdy / vd) * vs
            vy += (vdx / vd) * vs
            vx -= (vdx / vd) * vs * 0.25
            vy -= (vdy / vd) * vs * 0.25
          }
        }
        const vm = Math.hypot(vx, vy)
        if (vm > stepCap) { vx = (vx / vm) * stepCap; vy = (vy / vm) * stepCap }
        // move — slide along the boundary instead of dying on it
        if (sdf.sample(p.x + vx, p.y + vy) < -1) { p.x += vx; p.y += vy }
        else if (sdf.sample(p.x + vx, p.y) < -1) { p.x += vx }
        else if (sdf.sample(p.x, p.y + vy) < -1) { p.y += vy }

        // graze
        const fi = Math.max(0, Math.min(fh - 1, (p.y / cell) | 0)) * fw +
                   Math.max(0, Math.min(fw - 1, (p.x / cell) | 0))
        const bite = Math.min(food[fi], 0.035)
        food[fi] -= bite
        p.e += bite * 1.6 - 0.0055 // metabolism
        // split — birth flash
        if (p.e >= 1 && orgs.length < cap) {
          p.e = 0.5
          const ba = rng() * Math.PI * 2
          spawn(p.x + Math.cos(ba) * 4, p.y + Math.sin(ba) * 4, 0.5)
          if (events.length < 200) events.push({ x: p.x, y: p.y, ttl: 18, max: 18, birth: true }) // ≥300ms fade (anti-strobe)
        }
        // starve — death ring
        if (p.e <= 0) {
          p.e = 0
          if (++p.hunger > starveTime) {
            if (events.length < 200) events.push({ x: p.x, y: p.y, ttl: 18, max: 18, birth: false })
            orgs.splice(oi, 1)
            continue
          }
        } else if (p.hunger > 0) p.hunger--
      }
      // total crash → spores blow in; the boom starts over
      if (orgs.length === 0) for (let i = 0; i < 12; i++) spawn()

      // ── render ──
      ctx.fillStyle = pc('bg', 0.1)
      ctx.fillRect(0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, pc('fg', 0.12), 1.4)

      // food field — accent ground in four brightness tiers, visibly mowed.
      // PERF: ONE scan buckets the cells; each tier fills as one batched path
      // (was 4 full-grid scans with a fillRect per matching cell).
      const cw = cell * sx, ch = cell * sy
      for (const t of tierIdx) t.length = 0
      for (let i = 0; i < food.length; i++) {
        const f = food[i]
        if (f >= 0.85) tierIdx[0].push(i)
        else if (f >= 0.6) tierIdx[1].push(i)
        else if (f >= 0.35) tierIdx[2].push(i)
        else if (f >= 0.15) tierIdx[3].push(i)
      }
      for (let t = 0; t < 4; t++) {
        if (!tierIdx[t].length) continue
        ctx.fillStyle = pc('accent', TIER_ALPHA[t])
        ctx.beginPath()
        for (const i of tierIdx[t]) {
          ctx.rect((i % fw) * cw, ((i / fw) | 0) * ch, cw + 1, ch + 1)
        }
        ctx.fill()
      }

      // trails — thick warm ribbons
      ctx.strokeStyle = pc('warm', 0.45)
      ctx.lineWidth = 0.9 * U
      ctx.beginPath()
      for (const p of orgs) {
        ctx.moveTo(p.px * sx, p.py * sy)
        ctx.lineTo(p.x * sx, p.y * sy)
      }
      ctx.stroke()

      // heads — energy-scaled discs; the starving visibly gutter out.
      // PERF: healthy heads batch into one fill; starving heads quantize
      // into STARVE_BK alpha levels (≤0.03 alpha step — invisible) and batch
      // per level instead of a beginPath+fill per organism.
      ctx.fillStyle = pc('warm', 0.95)
      ctx.beginPath()
      for (const bkt of starveBk) bkt.length = 0
      for (const p of orgs) {
        if (p.hunger > 0) {
          const t = Math.min(1, p.hunger / starveTime)
          starveBk[Math.min(STARVE_BK - 1, (t * STARVE_BK) | 0)].push(p)
          continue
        }
        const r = (1.3 + 2.6 * p.e) * U
        ctx.moveTo(p.x * sx + r, p.y * sy)
        ctx.arc(p.x * sx, p.y * sy, r, 0, Math.PI * 2)
      }
      ctx.fill()
      for (let bi = 0; bi < STARVE_BK; bi++) {
        const bkt = starveBk[bi]
        if (!bkt.length) continue
        const t = (bi + 0.5) / STARVE_BK
        ctx.fillStyle = pc('dim', 0.16 * (1 - t) + 0.04)
        ctx.beginPath()
        for (const p of bkt) {
          const r = (1.3 + 2.6 * p.e) * U * 0.7
          ctx.moveTo(p.x * sx + r, p.y * sy)
          ctx.arc(p.x * sx, p.y * sy, r, 0, Math.PI * 2)
        }
        ctx.fill()
      }

      // birth / death flashes
      ctx.lineWidth = 0.8 * U
      for (let i = events.length - 1; i >= 0; i--) {
        const ev = events[i]
        const t = ev.ttl / ev.max
        if (ev.birth) {
          ctx.strokeStyle = pc('warm', 0.8 * t)
          ctx.beginPath()
          ctx.arc(ev.x * sx, ev.y * sy, (2 + (1 - t) * 7) * U, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.strokeStyle = pc('fg', 0.5 * t)
          ctx.beginPath()
          ctx.arc(ev.x * sx, ev.y * sy, (1 + t * 5) * U, 0, Math.PI * 2)
          ctx.stroke()
        }
        if (--ev.ttl <= 0) events.splice(i, 1)
      }
    })
  },
}
