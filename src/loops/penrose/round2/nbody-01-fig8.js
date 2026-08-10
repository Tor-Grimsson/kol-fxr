// Figure-8 Three-Body Choreography (Chenciner & Montgomery 2000)
// Three equal-mass bodies trace the same closed figure-8 curve with T/3 phase offset.
// Initial conditions from Chenciner-Montgomery; leapfrog integration.
// Perturb knob adds velocity kick — watch the choreography decay into chaos.



import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, pc } from '../common.js'

const PARAMS          = [
  { key: 'G',       type: 'range', min: 0.1,  max: 5,    default: 1,    step: 0.1,  label: 'G' },
  { key: 'dt',      type: 'range', min: 0.001, max: 0.02, default: 0.005, step: 0.001, label: 'timestep' },
  { key: 'substeps',type: 'int',   min: 1,    max: 20,   default: 8,    step: 1,    label: 'sub-steps' },
  { key: 'perturb', type: 'range', min: 0,    max: 0.5,  default: 0,    step: 0.01, label: 'kick' },
  { key: 'trail',   type: 'range', min: 0,    max: 1,    default: 0.6,  step: 0.05, label: 'trail' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

// Chenciner-Montgomery figure-8 initial conditions (normalised period T≈6.3259)
// Positions and velocities from Moore 1993 / Chenciner-Montgomery 2000.
const IC_POS                     = [
  [ 0.97000436, -0.24308753],
  [-0.97000436,  0.24308753],
  [ 0,           0         ],
]
const IC_VEL                     = [
  [ 0.93240737/2,  0.86473146/2],
  [ 0.93240737/2,  0.86473146/2],
  [-0.93240737,   -0.86473146  ],
]



export const r2_nbody_01_fig8            = {
  id: 'r2-nbody-01-fig8',
  name: 'FIGURE-8 CHOREOGRAPHY',
  repo: 'Chenciner & Montgomery 2000; Moore 1993',
  summary: 'Three equal-mass bodies on the Chenciner-Montgomery figure-8 orbit. Leapfrog integration; perturb knob kicks velocities to watch the choreography shatter.',
  helps: 'Pure mathematical perpetual motion — the 8-curve maps naturally to letterforms with two enclosed bowls.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const cx = sdf.w / 2, cy = sdf.h / 2
    // Scale the orbit to ~40% of the smaller glyph dimension
    const scale = Math.min(sdf.w, sdf.h) * 0.38

    const kick0 = num(params, 'perturb', 0)
    const bodies         = []
    // (re)seed the Chenciner-Montgomery choreography, with the optional
    // one-time random kick scaled by the perturb knob
    function seed() {
      bodies.length = 0
      for (let i = 0; i < IC_POS.length; i++) {
        bodies.push({
          x: cx + IC_POS[i][0] * scale,
          y: cy + IC_POS[i][1] * scale,
          vx: IC_VEL[i][0],
          vy: IC_VEL[i][1],
          m: 1,
        })
      }
      if (kick0 > 0) {
        for (const b of bodies) {
          b.vx += (rng() - 0.5) * kick0
          b.vy += (rng() - 0.5) * kick0
        }
      }
    }
    seed()

    /* Living system (2026-08-09): once perturbed, the choreography shatters
     * into chaos and STAYS chaotic — fossilized disorder. When the bodies
     * stray far from the home orbit for a sustained stretch (or blow up),
     * the trio fades out and the figure-8 reseeds. */
    let fade = 0
    let diverged = 0
    const FADE_FRAMES = 45

    const sx = W / sdf.w, sy = H / sdf.h
    const N = bodies.length

    // hoisted accel scratch — no per-substep array-of-arrays alloc
    const axBuf = new Float64Array(N)
    const ayBuf = new Float64Array(N)

    const roles = ['accent', 'fg', 'warm']
    // Trail canvas for motion blur effect — paint trails directly on ctx
    const trailAlpha = () => 1 - num(params, 'trail', 0.6) * 0.88

    function accel(bs        )                     {
      const G = num(params, 'G', 1)
      const eps2 = 1 // softening²
      axBuf.fill(0); ayBuf.fill(0)
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = bs[j].x - bs[i].x
          const dy = bs[j].y - bs[i].y
          const r2 = dx * dx + dy * dy + eps2
          const r3 = r2 * Math.sqrt(r2)
          const f = G * bs[i].m * bs[j].m / r3
          axBuf[i] += f * dx; ayBuf[i] += f * dy
          axBuf[j] -= f * dx; ayBuf[j] -= f * dy
        }
      }
    }

    return wrapLoop(() => {
      const dt = num(params, 'dt', 0.005)
      const substeps = num(params, 'substeps', 8) | 0

      // Pointer interaction — same capped inverse-falloff kick as the plummer
      // proto but ×0.3: perturbation IS the point here — any touch sends the
      // choreography into permanent chaos (same effect as the `perturb` knob).
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const pAmp = Math.min(sdf.w, sdf.h) * interact * 0.6

      // Leapfrog (kick-drift-kick) substeps
      for (let s = 0; s < substeps; s++) {
        accel(bodies)
        for (let i = 0; i < N; i++) {
          bodies[i].vx += axBuf[i] * dt * 0.5
          bodies[i].vy += ayBuf[i] * dt * 0.5
        }
        for (let i = 0; i < N; i++) {
          bodies[i].x += bodies[i].vx * dt
          bodies[i].y += bodies[i].vy * dt
        }
        accel(bodies)
        for (let i = 0; i < N; i++) {
          bodies[i].vx += axBuf[i] * dt * 0.5
          bodies[i].vy += ayBuf[i] * dt * 0.5
        }
        if (ptr) {
          for (const b of bodies) {
            const dx = b.x - ptr.x, dy = b.y - ptr.y
            const d2 = dx * dx + dy * dy
            if (d2 < 1e-6) continue
            const d = Math.sqrt(d2)
            const acc = Math.min(60, pAmp / (d + 2))
            b.vx += (dx / d) * acc * dt
            b.vy += (dy / d) * acc * dt
          }
        }
      }

      // velocity cap — a blowup decays into the reseed fade instead of
      // teleporting bodies across the canvas (~1.5% of dim per frame max)
      const vmax = Math.min(sdf.w, sdf.h) * 0.015 / Math.max(1e-6, dt * substeps)
      for (const b of bodies) {
        if (!isFinite(b.vx) || !isFinite(b.vy)) { b.vx = 0; b.vy = 0; continue }
        const sp = Math.hypot(b.vx, b.vy)
        if (sp > vmax) { b.vx *= vmax / sp; b.vy *= vmax / sp }
      }

      // lifecycle — divergence detection: bodies far off the home orbit for
      // a sustained stretch (or numerically blown up) → fade → reseed
      let maxR = 0
      let finite = true
      for (const b of bodies) {
        if (!isFinite(b.x + b.y + b.vx + b.vy)) { finite = false; break }
        maxR = Math.max(maxR, Math.hypot(b.x - cx, b.y - cy))
      }
      if (fade > 0) {
        fade--
        if (fade === 0) { seed(); diverged = 0 }
      } else {
        if (!finite) fade = FADE_FRAMES
        else {
          diverged = maxR > scale * 2.6 ? diverged + 1 : 0
          if (diverged > 45) { fade = FADE_FRAMES; diverged = 0 }
        }
      }
      const dis = fade > 0 ? fade / FADE_FRAMES : 1

      // Trail fade
      ctx.fillStyle = `rgba(10,11,20,${trailAlpha().toFixed(3)})`
      ctx.fillRect(0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(243,231,207,0.25)', 1.8)

      // Draw bodies and connecting lines (lines batched into one stroke)
      ctx.lineWidth = 1.8
      ctx.strokeStyle = pc('dim', 0.55 * dis)
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          ctx.moveTo(bodies[i].x * sx, bodies[i].y * sy)
          ctx.lineTo(bodies[j].x * sx, bodies[j].y * sy)
        }
      }
      ctx.stroke()

      ctx.globalAlpha = dis
      const rBody = Math.max(9, Math.min(W, H) * 0.02)
      for (let i = 0; i < N; i++) {
        const bx = bodies[i].x * sx, by = bodies[i].y * sy
        // fake glow — halo fill replaces the per-body shadowBlur pass
        ctx.fillStyle = pc(roles[i], 0.3)
        ctx.beginPath()
        ctx.arc(bx, by, rBody * 1.9, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = pc(roles[i], 1)
        ctx.beginPath()
        ctx.arc(bx, by, rBody, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    })
  },
}
