

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, pc } from '../common.js'

// Damped Harmonograph — two-pendulum Bowditch/Blackburn curve with exponential decay.
// Each axis gets two sinusoidal components so cross-contamination produces the rotary effect.
// Ref: https://paulbourke.net/geometry/harmonograph/

const PARAMS          = [
  { key: 'f1', type: 'range', min: 1, max: 7, default: 3, step: 0.05, label: 'freq 1' },
  { key: 'f2', type: 'range', min: 1, max: 7, default: 4, step: 0.05, label: 'freq 2' },
  { key: 'phi', type: 'range', min: 0, max: 6.28, default: 1.57, step: 0.05, label: 'phase' },
  { key: 'damp', type: 'range', min: 0, max: 0.15, default: 0.018, step: 0.001 },
  { key: 'trail', type: 'int', min: 200, max: 4000, default: 1800, step: 100 },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

const TWO_PI = Math.PI * 2

export const r2_spec_01_harmonograph            = {
  id: 'r2-spec-01-harmonograph',
  name: 'DAMPED HARMONOGRAPH',
  repo: 'Bowditch 1815 · Blackburn 1844 · paulbourke.net/geometry/harmonograph',
  summary: 'Two pendulums trace a Bowditch curve with exponential damping — quasi-periodic figures spiral inward, reset on loop.',
  helps: 'Classic time-traced analog apparatus; the spiral-in maps the letterform to a breathing-out motion.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    // Random phase seeds per run, held constant across param changes for
    // stability — but re-rolled on press (the morph event)
    let p1 = rng() * TWO_PI
    let p2 = rng() * TWO_PI
    let p3 = rng() * TWO_PI
    let p4 = rng() * TWO_PI

    const R = Math.min(W, H) * 0.42
    const CX = W / 2
    const CY = H / 2
    // How many seconds before decay brings amplitude below 5 % — controls loop period
    const PERIOD = 22

    /* Law 2 (2026-08-09): pointer x/y command the two pendulum frequencies
     * (lerped, never snapped); idle eases back to the knob values so the
     * unattended figure keeps breathing. Press = re-randomize the phase set. */
    let sf1 = null
    let sf2 = null
    let prevDown = false

    return wrapLoop(() => {
      const f1k = num(params, 'f1', 3)
      const f2k = num(params, 'f2', 4)
      const phi = num(params, 'phi', 1.57)
      const damp = num(params, 'damp', 0.018)
      const trail = num(params, 'trail', 1800)

      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const kB = Math.min(1, interact)
      if (sf1 == null) { sf1 = f1k; sf2 = f2k }
      const tf1 = ptr ? f1k + ((1 + (ptr.x / sdf.w) * 6) - f1k) * kB : f1k
      const tf2 = ptr ? f2k + ((1 + (1 - ptr.y / sdf.h) * 6) - f2k) * kB : f2k
      sf1 += (tf1 - sf1) * 0.06
      sf2 += (tf2 - sf2) * 0.06
      const f1 = sf1
      const f2 = sf2

      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) {
        p1 = rng() * TWO_PI
        p2 = rng() * TWO_PI
        p3 = rng() * TWO_PI
        p4 = rng() * TWO_PI
      }

      // t cycles 0..PERIOD, driving the full decay arc each period
      const raw = clock.nowSeconds()
      const t0 = raw % PERIOD

      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)

      const dt = PERIOD / trail
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'

      // Batched trail: each point computed once (was twice), alpha quantized
      // to 32 buckets so contiguous same-styled runs share one stroke call
      // (was one beginPath/stroke per segment — up to 4000/frame).
      const sw = sdf.w / W
      const sh = sdf.h / H
      let runKey = -1
      let runOpen = false
      let px = 0, py = 0, pea = 1, pin = false
      for (let i = 0; i < trail; i++) {
        const ta = t0 - i * dt
        if (ta < 0) break

        const ea = Math.exp(-damp * ta)
        // Two-component Bowditch per axis
        const x = CX + R * (0.6 * Math.sin(f1 * ta + p1) + 0.4 * Math.sin(f2 * ta + p2)) * ea
        const y = CY + R * (0.6 * Math.sin(f2 * ta + phi + p3) + 0.4 * Math.sin(f1 * ta + p4)) * ea

        // Clip to SDF interior (segment drawn iff its newer endpoint is inside)
        if (i > 0 && pin) {
          const age = (i - 1) / trail
          const alpha = (1 - age) * 0.95 * pea
          // accent-led curve; the freshest stretch flashes warm behind the pen
          const warm = age < 0.12
          const key = ((alpha * 31) | 0) * 2 + (warm ? 1 : 0)
          if (key !== runKey || !runOpen) {
            if (runOpen) ctx.stroke()
            ctx.strokeStyle = warm ? pc('warm', alpha) : pc('accent', alpha)
            ctx.beginPath()
            ctx.moveTo(px, py)
            runKey = key
            runOpen = true
          }
          ctx.lineTo(x, y)
        } else if (runOpen) {
          ctx.stroke()
          runOpen = false
          runKey = -1
        }

        px = x; py = y; pea = ea
        pin = sdf.sample(x * sw, y * sh) <= 2
      }
      if (runOpen) ctx.stroke()

      // pen head — glowing warm disc at the live point
      const e0 = Math.exp(-damp * t0)
      const hx = CX + R * (0.6 * Math.sin(f1 * t0 + p1) * e0 + 0.4 * Math.sin(f2 * t0 + p2) * e0)
      const hy = CY + R * (0.6 * Math.sin(f2 * t0 + phi + p3) * e0 + 0.4 * Math.sin(f1 * t0 + p4) * e0)
      // fake glow: wide low-alpha halo + solid core (no shadowBlur pass)
      ctx.fillStyle = pc('warm', 0.2)
      ctx.beginPath()
      ctx.arc(hx, hy, 14, 0, TWO_PI)
      ctx.fill()
      ctx.fillStyle = pc('warm', 0.95)
      ctx.beginPath()
      ctx.arc(hx, hy, 6, 0, TWO_PI)
      ctx.fill()
    })
  },
}
