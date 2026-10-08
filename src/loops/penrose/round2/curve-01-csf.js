// Curve-Shortening Flow (Gage–Hamilton–Grayson 1986/1987)
// Each vertex moves along the inward normal at speed = curvature κ.
// SDF confines the curves; remeshes to uniform arc-length every 30 steps.
//
// POPULATION REWORK (2026-08-09 — "dead on arrival" fix): one shrinking
// curve reads static, so this is a GROVE of 4 closed curves on a staggered
// lifecycle — each born large (blooming out from a seed), shrinking under
// curvature flow with a glow, dying below the length floor with a soft
// expanding ring while a replacement births elsewhere. Something is always
// mid-collapse. Curves repel each other gently; the pointer bulges nearby
// curves smoothly; press births a new curve at the cursor (the oldest curve
// gracefully collapses if the grove is full).

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sampleInside, sdfGrad, pc, rampRGB } from '../common.js'

const PARAMS          = [
  { key: 'N0',      type: 'int',   min: 20,  max: 300, default: 80,  step: 10,   label: 'seed nodes' },
  { key: 'dt',      type: 'range', min: 0.01, max: 0.5, default: 0.12, step: 0.01, label: 'timestep' },
  { key: 'sdfPull', type: 'range', min: 0,   max: 3,   default: 0.8,  step: 0.05, label: 'sdf pull' },
  { key: 'outward', type: 'boolean', default: false,                               label: 'inflate outward' },
  { key: 'seedR',   type: 'int',   min: 4,   max: 60,  default: 12,  step: 2,    label: 'seed radius' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

function remesh(pts, targetN) {
  const n = pts.length
  if (n < 3) return pts
  // compute total length
  let total = 0
  const lens = []
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n]
    const l = Math.hypot(b.x - a.x, b.y - a.y)
    lens.push(l)
    total += l
  }
  if (total < 1e-6) return pts
  const seg = total / targetN
  const out = []
  let acc = 0
  let idx = 0
  for (let k = 0; k < targetN; k++) {
    const target = k * seg
    while (acc + lens[idx] < target && idx < n - 1) { acc += lens[idx]; idx++ }
    const t = lens[idx] > 1e-9 ? (target - acc) / lens[idx] : 0
    const a = pts[idx], b = pts[(idx + 1) % n]
    out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) })
  }
  return out
}

export const r2_curve_01_csf            = {
  id: 'r2-curve-01-csf',
  name: 'CURVE SHORTENING FLOW',
  repo: 'Gage–Hamilton–Grayson',
  summary: 'Closed polyline evolves along its inward normal at rate κ. Outward mode inflates a seed ring until it hits the SDF wall; inward mode erodes complex shapes to smooth ovals.',
  helps: 'Smooth geometric decay / bloom. SDF-bounded shrinking and inflation from a seed.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const cvx = W / sdf.w, cvy = H / sdf.h
    const N0      = num(params, 'N0', 80)
    const dt      = num(params, 'dt', 0.12)
    const sdfPull = num(params, 'sdfPull', 0.8)
    const outward = params['outward'] === true
    const seedR   = num(params, 'seedR', 12)

    const minDim = Math.min(sdf.w, sdf.h)
    const RBIG = minDim * 0.26
    const FLOOR = Math.max(26, seedR * 2)
    const MAXC = 4
    const dir = outward ? -1 : 1  // -1 = outward inflation, +1 = classic shrink

    // hoisted per-vertex step scratch (curves always hold N0 points) + motion cap
    const dxBuf = new Float32Array(N0)
    const dyBuf = new Float32Array(N0)
    const MSTEP = minDim * 0.015 // max per-frame vertex move ~1.5% of dim

    const curves = []   // { pts, age, step, stalled, targetR, doomed, cx, cy, avgR }
    const rings = []    // death/birth pulses { x, y, r, f }
    const pending = []  // frame countdowns to staggered rebirths
    let prevDown = false

    function makeCurve(cx0, cy0, R0, targetR) {
      const pts = []
      for (let i = 0; i < N0; i++) {
        const a = (i / N0) * Math.PI * 2
        pts.push({ x: cx0 + Math.cos(a) * R0, y: cy0 + Math.sin(a) * R0 })
      }
      return { pts, age: 0, step: 0, stalled: 0, targetR, doomed: false, cx: cx0, cy: cy0, avgR: R0 }
    }

    function measure(c) {
      let mx = 0, my = 0
      for (const p of c.pts) { mx += p.x; my += p.y }
      c.cx = mx / c.pts.length
      c.cy = my / c.pts.length
      let mr = 0
      for (const p of c.pts) mr += Math.hypot(p.x - c.cx, p.y - c.cy)
      c.avgR = mr / c.pts.length
    }

    function spawnPoint() {
      let best = null, bestD = -1
      for (let k = 0; k < 6; k++) {
        const [x, y] = sampleInside(sdf, rng)
        if (!curves.length) return [x, y]
        let dmin = Infinity
        for (const c of curves) {
          const d = Math.hypot(x - c.cx, y - c.cy)
          if (d < dmin) dmin = d
        }
        if (dmin > bestD) { bestD = dmin; best = [x, y] }
      }
      return best
    }

    // boot — a full grove at staggered radii, so something is always
    // mid-collapse from the first second
    {
      const stagger = outward
        ? [seedR * 2.2, seedR * 1.6, seedR * 1.2, seedR]
        : [RBIG, RBIG * 0.72, RBIG * 0.5, RBIG * 0.34]
      for (let i = 0; i < MAXC; i++) {
        const [x, y] = spawnPoint()
        const c = makeCurve(x, y, stagger[i], stagger[i]) // target met — no birth bloom at boot
        measure(c)
        curves.push(c)
      }
    }

    return wrapLoop(() => {
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const pReach = minDim * 0.15

      // press = birth at the cursor (blooming from a seed); a full grove
      // gracefully collapses its oldest curve instead of snapping it away
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge && sdf.sample(ptr.x, ptr.y) < -4) {
        if (curves.filter((c) => !c.doomed).length >= MAXC) {
          const old = curves.find((c) => !c.doomed)
          if (old) old.doomed = true
        }
        const R = outward ? seedR : RBIG * (0.85 + rng() * 0.25)
        const c = makeCurve(ptr.x, ptr.y, Math.max(seedR, R * 0.3), R)
        measure(c)
        curves.push(c)
        rings.push({ x: ptr.x, y: ptr.y, r: seedR, f: 1 })
      }

      // gentle pairwise repulsion — centroid springs push overlapping curves apart
      for (const c of curves) { c.pushX = 0; c.pushY = 0 }
      for (let i = 0; i < curves.length; i++) {
        for (let j = i + 1; j < curves.length; j++) {
          const A = curves[i], B = curves[j]
          const dx = B.cx - A.cx, dy = B.cy - A.cy
          const d = Math.hypot(dx, dy) || 1
          const reach = (A.avgR + B.avgR) * 0.85
          if (d >= reach) continue
          const f = 0.35 * (1 - d / reach)
          A.pushX -= (dx / d) * f; A.pushY -= (dy / d) * f
          B.pushX += (dx / d) * f; B.pushY += (dy / d) * f
        }
      }

      // ── flow every curve ──
      for (const c of curves) {
        const pts = c.pts
        const n = pts.length
        c.age++

        // birth bloom — while young and under target, an outward radial
        // force inflates the seed to full size (ease-out as the gap closes)
        const blooming = !outward && c.age < 120 && c.avgR < c.targetR * 0.96
        const bloomF = blooming ? Math.min(1.6, (c.targetR - c.avgR) * 0.045) : 0

        // constant radial drift — pure κ·dt is glacial at large radii, so a
        // steady contraction (or inflation, in outward mode) keeps the
        // lifecycle turning over in seconds, with κ smoothing the shape
        const driftV = dt * 2

        for (let i = 0; i < n; i++) {
          const prev = pts[(i - 1 + n) % n]
          const next = pts[(i + 1) % n]
          const p = pts[i]

          // tangent and normal
          const tx = next.x - prev.x, ty = next.y - prev.y
          const tl = Math.hypot(tx, ty) || 1e-6
          const nx = -ty / tl, ny = tx / tl  // inward normal (left of tangent)

          // discrete curvature: turn angle / mean segment length
          const l1 = Math.hypot(p.x - prev.x, p.y - prev.y) || 1e-9
          const l2 = Math.hypot(next.x - p.x, next.y - p.y) || 1e-9
          const lm = (l1 + l2) * 0.5
          const cross = (p.x - prev.x) * (next.y - p.y) - (p.y - prev.y) * (next.x - p.x)
          const kappa = cross / (l1 * l2 * lm + 1e-9)

          let fx = dir * kappa * nx * dt
          let fy = dir * kappa * ny * dt

          // SDF pull: push away from boundary (inward)
          const sv = sdf.sample(p.x, p.y)
          if (sv > -8) {
            const [gx, gy] = sdfGrad(sdf, p.x, p.y)
            const gm = Math.hypot(gx, gy) || 1
            fx -= (gx / gm) * sdfPull * Math.max(0, sv + 8) * 0.05
            fy -= (gy / gm) * sdfPull * Math.max(0, sv + 8) * 0.05
          }

          // birth bloom / radial drift / grove repulsion / doom-collapse
          {
            const rx = p.x - c.cx, ry = p.y - c.cy
            const rm = Math.hypot(rx, ry) || 1
            const rad = bloomF - (bloomF > 0 ? 0 : dir * driftV)
            fx += (rx / rm) * rad
            fy += (ry / rm) * rad
          }
          fx += c.pushX
          fy += c.pushY
          if (c.doomed) {
            fx += (c.cx - p.x) * 0.018
            fy += (c.cy - p.y) * 0.018
          }

          // pointer bulge — a smooth radial press, restored by the flow
          if (ptr) {
            const dxp = p.x - ptr.x, dyp = p.y - ptr.y
            const d2p = dxp * dxp + dyp * dyp
            if (d2p < pReach * pReach && d2p > 1e-6) {
              const dp = Math.sqrt(d2p)
              const f = (1 - dp / pReach) * 0.45 * interact
              fx += (dxp / dp) * f
              fy += (dyp / dp) * f
            }
          }

          // NaN-guard + step clamp — a blowup decays instead of propagating
          if (!isFinite(fx) || !isFinite(fy)) { fx = 0; fy = 0 }
          const fm = Math.hypot(fx, fy)
          if (fm > MSTEP) { fx *= MSTEP / fm; fy *= MSTEP / fm }
          dxBuf[i] = fx
          dyBuf[i] = fy
        }

        let move = 0
        for (let i = 0; i < n; i++) {
          pts[i].x += dxBuf[i]
          pts[i].y += dyBuf[i]
          move += Math.hypot(dxBuf[i], dyBuf[i])
        }
        c.stalled = move / Math.max(1, n) < 0.01 ? c.stalled + 1 : 0

        c.step++
        if (c.step % 30 === 0) c.pts = remesh(c.pts, N0)
        measure(c)
      }

      // ── lifecycle — deaths ring out, rebirths stagger in ──
      for (let i = curves.length - 1; i >= 0; i--) {
        const c = curves[i]
        let totalLen = 0
        for (let k = 0; k < c.pts.length; k++) {
          const a = c.pts[k], b = c.pts[(k + 1) % c.pts.length]
          totalLen += Math.hypot(b.x - a.x, b.y - a.y)
        }
        if (totalLen < FLOOR || c.stalled > 110) {
          rings.push({ x: c.cx, y: c.cy, r: Math.max(seedR, c.avgR), f: 1 })
          curves.splice(i, 1)
          pending.push(24 + Math.floor(rng() * 70))
        }
      }
      if (curves.length + pending.length < MAXC) pending.push(30 + Math.floor(rng() * 80))
      for (let i = pending.length - 1; i >= 0; i--) {
        if (--pending[i] > 0) continue
        pending.splice(i, 1)
        const [x, y] = spawnPoint()
        const R = outward ? seedR : RBIG * (0.85 + rng() * 0.3)
        const c = makeCurve(x, y, outward ? seedR : Math.max(seedR, R * 0.3), R)
        measure(c)
        curves.push(c)
      }

      // ── render ──
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)

      ctx.lineJoin = 'round'
      const baseLW = Math.max(3, Math.min(W, H) * 0.006)
      for (const c of curves) {
        // young curves glow warm and settle into accent as they age
        const youth = Math.max(0, 1 - c.age / 90)
        const [rr, gg, bb] = rampRGB(0.5 + youth * 0.5) // accent → warm
        ctx.beginPath()
        for (let i = 0; i < c.pts.length; i++) {
          const p = c.pts[i]
          if (i === 0) ctx.moveTo(p.x * cvx, p.y * cvy)
          else ctx.lineTo(p.x * cvx, p.y * cvy)
        }
        ctx.closePath()
        // fake glow — wide low-alpha pass on the same path replaces shadowBlur
        ctx.strokeStyle = pc('accent', 0.3)
        ctx.lineWidth = baseLW * 2.6
        ctx.stroke()
        ctx.strokeStyle = `rgba(${rr},${gg},${bb},1)`
        ctx.lineWidth = baseLW
        ctx.stroke()
      }

      // soft rings — a curve died here (or was born at the cursor)
      for (let i = rings.length - 1; i >= 0; i--) {
        const g = rings[i]
        g.r += minDim * 0.006
        g.f -= 0.022
        if (g.f <= 0) { rings.splice(i, 1); continue }
        ctx.strokeStyle = pc('warm', g.f * 0.7)
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(g.x * cvx, g.y * cvy, g.r * ((cvx + cvy) / 2), 0, Math.PI * 2)
        ctx.stroke()
      }
    })
  },
}
