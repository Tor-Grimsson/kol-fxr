// FitzHugh-Nagumo excitable medium.
// Two variables: fast activator u, slow recovery v.
// Produces perpetually rotating spiral waves inside the masked glyph.
// Reference: FitzHugh 1961, Nagumo 1962; Murray "Mathematical Biology II" Ch 1–2.



import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, rampRGB, roleRGB, stampGrid } from '../common.js'

const PARAMS          = [
  { key: 'res',    type: 'int',   min: 80,   max: 220, default: 160,  step: 20,   label: 'grid' },
  { key: 'dU',     type: 'range', min: 0.05, max: 2.0, default: 1.0,  step: 0.05, label: 'diffU' },
  { key: 'dV',     type: 'range', min: 0.0,  max: 0.5, default: 0.05, step: 0.01, label: 'diffV' },
  { key: 'eps',    type: 'range', min: 0.005, max: 0.1, default: 0.02, step: 0.005, label: 'epsilon' },
  { key: 'a',      type: 'range', min: -0.5, max: 0.5, default: 0.1,  step: 0.01, label: 'threshold a' },
  { key: 'b',      type: 'range', min: 0.1,  max: 1.5, default: 0.5,  step: 0.05, label: 'recovery b' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

export const r2_rd_01_fhn            = {
  id: 'r2-rd-01-fhn',
  name: 'FITZHUGH-NAGUMO',
  repo: 'FitzHugh 1961 + Nagumo 1962',
  summary: 'Excitable-medium PDE producing perpetual rotating spiral waves confined inside the SDF-masked glyph.',
  helps: 'Continuous motion — never settles. Classic cardiac-tissue dynamics render the letter as living tissue.',
  params: PARAMS,

  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const res  = num(params, 'res',  160)
    const dU   = num(params, 'dU',   1.0)
    const dV   = num(params, 'dV',   0.05)
    const eps  = num(params, 'eps',  0.02)
    const a    = num(params, 'a',    0.1)
    const b    = num(params, 'b',    0.5)
    const dt   = 0.1

    const N = res * res
    const U  = new Float32Array(N)
    const V  = new Float32Array(N)
    const U2 = new Float32Array(N)
    const V2 = new Float32Array(N)
    const isIn = new Uint8Array(N)

    // Build mask
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const sx = (x / res) * sdf.w
        const sy = (y / res) * sdf.h
        isIn[y * res + x] = sdf.sample(sx, sy) < 0 ? 1 : 0
      }
    }

    // Seed: broken wavefront in upper half — nucleates spirals
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const i = y * res + x
        if (!isIn[i]) continue
        if (y < res * 0.5) {
          U[i] = rng() * 0.5 + 0.5
          V[i] = rng() * 0.2
        } else {
          U[i] = rng() * 0.1 - 0.5
          V[i] = rng() * 0.1
        }
      }
    }

    let nIn = 0
    for (let i = 0; i < N; i++) nIn += isIn[i]

    // Nucleate a spiral pair: a short broken wavefront (U band) with a
    // refractory band (V) alongside — the free end curls into spirals.
    const nucleateSpiralPair = () => {
      let cx        , cy        , tries = 0
      do {
        cx = (rng() * res) | 0
        cy = (rng() * res) | 0
        tries++
      } while (!isIn[cy * res + cx] && tries < 200)
      const L = Math.max(6, Math.round(res * 0.15))
      for (let y = cy - 2; y <= cy + 2; y++) {
        for (let x = cx - L; x <= cx; x++) {
          if (x < 0 || x >= res || y < 0 || y >= res) continue
          const i = y * res + x
          if (isIn[i]) U[i] = 1
        }
      }
      for (let y = cy + 3; y <= cy + 7; y++) {
        for (let x = cx - L; x <= cx; x++) {
          if (x < 0 || x >= res || y < 0 || y >= res) continue
          const i = y * res + x
          if (isIn[i]) V[i] = 0.8
        }
      }
    }

    const img = ctx.createImageData(res, res)
    const tmp = document.createElement('canvas')
    tmp.width = res; tmp.height = res
    const tc = tmp.getContext('2d')

    const lap = (buf              , x        , y        )         => {
      const i = y * res + x
      const l = x > 0       ? buf[i - 1]   : buf[i]
      const r = x < res - 1 ? buf[i + 1]   : buf[i]
      const u = y > 0       ? buf[i - res]  : buf[i]
      const d = y < res - 1 ? buf[i + res]  : buf[i]
      return l + r + u + d - 4 * buf[i]
    }

    let prevDown = false

    return wrapLoop(() => {
      // Pointer: excite the activator at the cursor (scaled by `interact`,
      // 0 = inert), before the substeps consume it. Hover/held = a sustained
      // excitation pour; the down-EDGE = an excitation RING — it expands as
      // a circular wave and breaks into spirals at the glyph boundary.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      const edge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (ptr) {
        const gp = { x: (ptr.x / sdf.w) * res, y: (ptr.y / sdf.h) * res }
        const rad = res * 0.06 * (0.5 + params.interact * 0.5)
        stampGrid(res, res, gp, rad, (i) => {
          if (isIn[i]) U[i] = 1
        })
        if (edge) {
          const ringR = rad * 5
          const thick = 5
          const x0 = Math.max(0, Math.floor(gp.x - ringR - thick))
          const x1 = Math.min(res - 1, Math.ceil(gp.x + ringR + thick))
          const y0 = Math.max(0, Math.floor(gp.y - ringR - thick))
          const y1 = Math.min(res - 1, Math.ceil(gp.y + ringR + thick))
          for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
              const d = Math.hypot(x - gp.x, y - gp.y)
              if (Math.abs(d - ringR) > thick) continue
              const i = y * res + x
              if (isIn[i]) U[i] = 1
            }
          }
        }
      }

      // LIFE: spirals can annihilate to the rest state and fossilize. On low
      // total activity, nucleate a fresh random spiral pair.
      let active = 0
      for (let i = 0; i < N; i++) if (isIn[i] && U[i] > 0.2) active++
      if (active < nIn * 0.005) nucleateSpiralPair()

      for (let it = 0; it < 3; it++) {
        for (let y = 0; y < res; y++) {
          for (let x = 0; x < res; x++) {
            const i = y * res + x
            if (!isIn[i]) { U2[i] = U[i]; V2[i] = V[i]; continue }
            const u = U[i], v = V[i]
            const lu = lap(U, x, y)
            const lv = lap(V, x, y)
            // FHN: du/dt = dU∇²u − u³ + u − v
            //      dv/dt = dV∇²v + eps(u − b*v + a)
            // clamped ±4 (normal range ±2) — explicit-Euler cubic blowups decay instead of NaN-ing
            const un = u + dt * (dU * lu - u * u * u + u - v)
            const vn = v + dt * (dV * lv + eps * (u - b * v + a))
            U2[i] = un > 4 ? 4 : un < -4 ? -4 : un
            V2[i] = vn > 4 ? 4 : vn < -4 ? -4 : vn
          }
        }
        U.set(U2)
        V.set(V2)
      }

      // theme ramp LUT over the FULL u range — wavefronts hit peak brightness
      const rampLUT = new Uint8Array(64 * 3)
      for (let k = 0; k < 64; k++) {
        const [rr, gg, bb] = rampRGB(k / 63)
        rampLUT[k * 3] = rr; rampLUT[k * 3 + 1] = gg; rampLUT[k * 3 + 2] = bb
      }
      const [bgR, bgG, bgB] = roleRGB('bg')
      for (let i = 0; i < N; i++) {
        const j = i * 4
        if (!isIn[i]) {
          img.data[j] = bgR; img.data[j + 1] = bgG; img.data[j + 2] = bgB; img.data[j + 3] = 255
          continue
        }
        const v = Math.max(0, Math.min(1, (U[i] + 1) / 2))
        const ki = (v * 63) | 0
        img.data[j]     = rampLUT[ki * 3]
        img.data[j + 1] = rampLUT[ki * 3 + 1]
        img.data[j + 2] = rampLUT[ki * 3 + 2]
        img.data[j + 3] = 255
      }
      clear(ctx, W, H)
      tc.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(tmp, 0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)
    })
  },
}
