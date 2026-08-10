// Plummer Sphere — Core Collapse, SUPERNOVAE & Star Formation
// N stars with a Salpeter-ish mass spread seeded in a 2D Plummer profile
// inside the glyph SDF. Direct O(N²) gravity. Stars are sized by mass with
// a core glow. When the core density spikes, the most central star goes
// SUPERNOVA: an expanding shockwave ring kicks nearby stars outward and new
// stars twinkle in out in the halo (visible star formation). Hover repels,
// HOLD grips the cluster to the cursor (accretion streaks drawn), press
// slams. Evaporation reseed keeps it perpetual.

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sampleInside, sdfGrad, pc } from '../common.js'

const PARAMS = [
  { key: 'N',       type: 'int',   min: 20,  max: 150, default: 90,   step: 5,    label: 'stars' },
  { key: 'G',       type: 'range', min: 0.05, max: 3,  default: 0.6,  step: 0.05, label: 'G' },
  { key: 'dt',      type: 'range', min: 0.002, max: 0.05, default: 0.01, step: 0.001, label: 'timestep' },
  { key: 'eps',     type: 'range', min: 0.5, max: 10,  default: 3,    step: 0.5,  label: 'softening' },
  { key: 'wall',    type: 'range', min: 0,   max: 2,   default: 0.6,  step: 0.1,  label: 'wall strength' },
  { key: 'trail',   type: 'range', min: 0,   max: 1,   default: 0.7,  step: 0.05, label: 'trail' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

// Sample 2D Plummer profile via inverse CDF: r ~ a·√(u^(-2/3) − 1)
function plummerSample(rng, cx, cy, a) {
  const u = rng()
  const r = a * Math.sqrt(Math.pow(u, -2 / 3) - 1)
  const angle = rng() * Math.PI * 2
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
}

export const r2_nbody_05_plummer = {
  id: 'r2-nbody-05-plummer',
  name: 'PLUMMER CORE COLLAPSE',
  repo: 'Plummer 1911; Hénon 1961; Aarseth 1999',
  summary: 'Globular cluster in direct O(N²) gravity, stars sized by mass with core glow. Core-density spikes detonate SUPERNOVAE — shockwave rings kick the neighborhood while new stars twinkle in out in the halo. Hold grips the cluster, press slams.',
  helps: 'Core-collapse drama made visible: collapse → detonation → re-expansion → star formation, cycling forever inside the glyph.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const cx = sdf.w / 2, cy = sdf.h / 2
    const U = Math.min(sdf.w, sdf.h)
    const Um = Math.min(W, H)
    const K = Um / 640
    const plummerA = U * 0.32 // cluster 2× bigger in frame

    let N = num(params, 'N', 90) | 0
    const particles = []
    const shocks = []
    let axArr = new Float64Array(N + 32) // hoisted — were allocated per frame
    let ayArr = new Float64Array(N + 32)

    // Sample Plummer positions, Salpeter-ish masses, virial velocities
    function init() {
      particles.length = 0
      const G = num(params, 'G', 0.6)
      const masses = []
      let totalM = 0
      for (let i = 0; i < N; i++) {
        const m = 0.4 + 2.6 * Math.pow(rng(), 2.2)
        masses.push(m)
        totalM += m
      }
      const vScale = Math.sqrt(G * totalM / (2 * plummerA)) * 0.5
      for (let i = 0; i < N; i++) {
        let px = cx, py = cy
        for (let t = 0; t < 32; t++) {
          const [tx, ty] = plummerSample(rng, cx, cy, plummerA)
          if (sdf.sample(tx, ty) < 0) { px = tx; py = ty; break }
        }
        const va = rng() * Math.PI * 2
        const vr = vScale * Math.sqrt(-2 * Math.log(rng() + 1e-9))
        particles.push({
          x: px, y: py,
          vx: vr * Math.cos(va),
          vy: vr * Math.sin(va),
          m: masses[i],
          birth: 0,
        })
      }
    }
    init()

    let prevDown = false
    let fade = 0
    let pinned = 0
    let cooldown = 240 // frames before the first supernova can fire
    let holdF = 0
    const FADE_FRAMES = 45

    return wrapLoop(() => {
      const newN = num(params, 'N', 90) | 0
      if (newN !== N) {
        N = newN
        init()
        return
      }

      const G    = num(params, 'G', 0.6)
      const dt   = num(params, 'dt', 0.01)
      const eps2 = Math.pow(num(params, 'eps', 3), 2)
      const wallStr = num(params, 'wall', 0.6)
      const Np = particles.length

      if (axArr.length < Np) { axArr = new Float64Array(Np + 32); ayArr = new Float64Array(Np + 32) }
      axArr.fill(0, 0, Np)
      ayArr.fill(0, 0, Np)

      // O(N²) pairwise gravity
      for (let i = 0; i < Np; i++) {
        for (let j = i + 1; j < Np; j++) {
          const dx = particles[j].x - particles[i].x
          const dy = particles[j].y - particles[i].y
          const r2 = dx * dx + dy * dy + eps2
          const r3 = r2 * Math.sqrt(r2)
          const fg = G * particles[i].m * particles[j].m / r3
          axArr[i] += fg * dx; ayArr[i] += fg * dy
          axArr[j] -= fg * dx; ayArr[j] -= fg * dy
        }
      }

      // SDF boundary wall
      for (let i = 0; i < Np; i++) {
        const p = particles[i]
        const s = sdf.sample(p.x, p.y)
        if (s > -3) {
          const [gx, gy] = sdfGrad(sdf, p.x, p.y)
          const gm = Math.hypot(gx, gy) || 1
          const push = Math.max(0, s + 3) * wallStr
          axArr[i] -= (gx / gm) * push
          ayArr[i] -= (gy / gm) * push
        }
      }

      // Pointer — hover repels, HOLD grips (2× strength), press SLAMS (2×)
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      holdF = ptr && ptr.down ? holdF + 1 : 0
      if (downEdge) {
        const reach = U * 0.6
        for (const p of particles) {
          const dx = ptr.x - p.x, dy = ptr.y - p.y
          const d2 = dx * dx + dy * dy
          if (d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const kick = 5 * interact * Math.max(0, 1 - d / reach) + 1
          p.vx += (dx / d) * kick
          p.vy += (dy / d) * kick
        }
        shocks.push({ x: ptr.x, y: ptr.y, r: U * 0.02, life: 1, role: 'accent' })
      }
      if (ptr) {
        const amp = U * interact * 2
        const sign = ptr.down ? -1 : 1
        for (let i = 0; i < Np; i++) {
          const dx = particles[i].x - ptr.x
          const dy = particles[i].y - ptr.y
          const d2 = dx * dx + dy * dy
          if (d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const acc = Math.min(60, amp / (d + 2)) * sign
          axArr[i] += (dx / d) * acc
          ayArr[i] += (dy / d) * acc
        }
      }

      // Leapfrog (kick-drift-kick)
      const halfDt = dt * 0.5
      for (let i = 0; i < Np; i++) {
        const p = particles[i]
        const im = 1 / p.m
        p.vx += axArr[i] * im * halfDt
        p.vy += ayArr[i] * im * halfDt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx += axArr[i] * im * halfDt
        p.vy += ayArr[i] * im * halfDt
        const vmax = U * 0.4
        const v = Math.hypot(p.vx, p.vy)
        if (v > vmax) { p.vx *= vmax / v; p.vy *= vmax / v }
      }

      // center of mass + core density
      let mx = 0, my = 0, mm = 0
      for (const p of particles) { mx += p.x * p.m; my += p.y * p.m; mm += p.m }
      mx /= mm || 1
      my /= mm || 1
      const coreR = plummerA * 0.28
      let coreCount = 0
      for (const p of particles) if (Math.hypot(p.x - mx, p.y - my) < coreR) coreCount++

      // SUPERNOVA — core-density spike detonates the most central star
      if (cooldown > 0) cooldown--
      if (fade === 0 && cooldown === 0 && particles.length > 12 &&
          coreCount >= Math.max(8, particles.length * 0.3)) {
        let bi = 0, bd = Infinity
        for (let i = 0; i < particles.length; i++) {
          const d = Math.hypot(particles[i].x - mx, particles[i].y - my)
          if (d < bd) { bd = d; bi = i }
        }
        const bx = particles[bi].x, by = particles[bi].y, bm = particles[bi].m
        const reach = plummerA * 1.7
        for (let i = 0; i < particles.length; i++) {
          if (i === bi) continue
          const p = particles[i]
          const dx = p.x - bx, dy = p.y - by
          const d = Math.hypot(dx, dy)
          if (d < 1e-6 || d > reach) continue
          const kick = (1 - d / reach) * 7 + 1
          p.vx += (dx / d) * kick
          p.vy += (dy / d) * kick
        }
        shocks.push({ x: bx, y: by, r: coreR * 0.15, life: 1, role: 'warm' })
        particles.splice(bi, 1)
        // star formation — re-birth in the halo, twinkling in
        const vt = Math.sqrt(G * mm / (2 * plummerA)) * 0.3
        for (let k = 0; k < 3; k++) {
          const a = rng() * Math.PI * 2
          const rr = plummerA * (1.1 + rng() * 0.9)
          let nx = mx + Math.cos(a) * rr
          let ny = my + Math.sin(a) * rr
          if (sdf.sample(nx, ny) >= -3) { [nx, ny] = sampleInside(sdf, rng) }
          particles.push({
            x: nx, y: ny,
            vx: -Math.sin(a) * vt, vy: Math.cos(a) * vt,
            m: Math.max(0.4, bm / 3),
            birth: 70,
          })
        }
        cooldown = 480
      }

      // lifecycle — evaporation check: cluster pinned to the wall dissolves
      // and the Plummer sphere reseeds
      if (fade > 0) {
        fade--
        if (fade === 0) { init(); pinned = 0; cooldown = 240 }
      } else {
        let nearWall = 0
        for (const p of particles) if (sdf.sample(p.x, p.y) > -5) nearWall++
        if (particles.length > 0 && nearWall / particles.length > 0.55) pinned++
        else pinned = Math.max(0, pinned - 2)
        if (pinned > 90) { fade = FADE_FRAMES; pinned = 0 }
      }
      const dis = fade > 0 ? fade / FADE_FRAMES : 1

      // --- Render ---
      const trailA = 1 - num(params, 'trail', 0.7) * 0.92
      ctx.fillStyle = pc('bg', trailA)
      ctx.fillRect(0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, pc('dim', 0.03), 1)

      // grip accretion — streaks pulled toward the hold point
      if (ptr && ptr.down) {
        const reach = U * 0.4
        ctx.lineWidth = Math.max(1, K * 1.1)
        for (const p of particles) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y
          const d = Math.hypot(dx, dy)
          if (d > reach || d < 1e-6) continue
          ctx.strokeStyle = pc('accent', 0.4 * (1 - d / reach) * dis)
          ctx.beginPath()
          ctx.moveTo(p.x * sx, p.y * sy)
          ctx.lineTo(ptr.x * sx, ptr.y * sy)
          ctx.stroke()
        }
        const gr = K * (10 + Math.min(30, holdF * 0.4))
        ctx.fillStyle = pc('accent', 0.12)
        ctx.beginPath()
        ctx.arc(ptr.x * sx, ptr.y * sy, gr * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = pc('accent', 0.3)
        ctx.beginPath()
        ctx.arc(ptr.x * sx, ptr.y * sy, gr, 0, Math.PI * 2)
        ctx.fill()
      }

      // stars — sized by mass, glow halo + bright core; newborns twinkle in
      for (const p of particles) {
        if (p.birth > 0) p.birth--
        const r = Math.hypot(p.x - mx, p.y - my)
        const hot = Math.min(1, Math.hypot(p.vx, p.vy) / 8)
        const inCore = r < coreR
        const bornT = p.birth > 0 ? 1 - p.birth / 70 : 1
        const rad = K * (2.4 + 2.2 * Math.sqrt(p.m)) * (0.4 + 0.6 * bornT)
        const alpha = (inCore ? 0.95 : Math.max(0.35, 0.75 - r / (U * 0.9))) * dis * (0.3 + 0.7 * bornT)
        const role = p.birth > 0 ? 'accent' : (hot > 0.6 ? 'warm' : 'fg')
        ctx.fillStyle = pc(role, alpha * 0.16)
        ctx.beginPath()
        ctx.arc(p.x * sx, p.y * sy, rad * 2.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = pc(role, alpha)
        ctx.beginPath()
        ctx.arc(p.x * sx, p.y * sy, rad, 0, Math.PI * 2)
        ctx.fill()
      }

      // core glow at the center of mass
      if (coreCount > 3) {
        const glowAlpha = Math.min(0.5, coreCount * 0.03) * dis
        const grd = ctx.createRadialGradient(mx * sx, my * sy, 0, mx * sx, my * sy, coreR * sx * 2)
        grd.addColorStop(0, pc('fg', glowAlpha))
        grd.addColorStop(1, pc('fg', 0))
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(mx * sx, my * sy, coreR * sx * 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // shockwaves — expanding rings with an initial flash
      for (let i = shocks.length - 1; i >= 0; i--) {
        const s2 = shocks[i]
        s2.r += U * 0.014
        s2.life -= 1 / 70
        if (s2.life <= 0) { shocks.splice(i, 1); continue }
        ctx.strokeStyle = pc(s2.role, 0.85 * s2.life)
        ctx.lineWidth = Math.max(2, K * 6 * s2.life)
        ctx.beginPath()
        ctx.arc(s2.x * sx, s2.y * sy, s2.r * sx, 0, Math.PI * 2)
        ctx.stroke()
        if (s2.life > 0.72) { // flash fade widened to ~320ms (anti-strobe)
          ctx.fillStyle = pc('fg', (s2.life - 0.72) * 3)
          ctx.beginPath()
          ctx.arc(s2.x * sx, s2.y * sy, K * 14 * (s2.life - 0.72) * 3.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    })
  },
}
