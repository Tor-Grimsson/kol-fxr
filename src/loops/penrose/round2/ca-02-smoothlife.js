// SmoothLife — Rafler (2011) generalization of Conway Life to continuous domain.
// Disk (inner) and ring (outer) neighborhoods with sigmoid birth/death thresholds.
// Produces smooth translating gliders in arbitrary directions.
// arXiv:1111.1567



import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, rampRGB, roleRGB, stampGrid } from '../common.js'

const PARAMS          = [
  { key: 'res',  type: 'int',   min: 80,  max: 200, default: 128, step: 16, label: 'grid res' },
  { key: 'ri',   type: 'int',   min: 2,   max: 8,   default: 4,             label: 'inner radius' },
  { key: 'ro',   type: 'int',   min: 5,   max: 18,  default: 12,            label: 'outer radius' },
  { key: 'b1',   type: 'range', min: 0.2, max: 0.4, default: 0.278, step: 0.005, label: 'birth low' },
  { key: 'b2',   type: 'range', min: 0.3, max: 0.6, default: 0.365, step: 0.005, label: 'birth high' },
  { key: 'dt',   type: 'range', min: 0.05, max: 0.4, default: 0.1, step: 0.01,   label: 'timestep' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

// Sigmoid used by SmoothLife for threshold smoothing
function sigma(x        , a        , alpha = 0.028)         {
  return 1 / (1 + Math.exp(-(x - a) * 4 / alpha))
}
function sigmaN(x        , a        , b        )         {
  return sigma(x, a) * (1 - sigma(x, b))
}
// Transition: s(n, m) using standard SmoothLife params (d1=0.267, d2=0.445)
function transition(n        , m        , b1        , b2        )         {
  const d1 = 0.267, d2 = 0.445
  const alive = sigmaN(m, b1, b2) // birth term
  const dead  = sigmaN(m, d1, d2) // survival term
  const sn = 1 / (1 + Math.exp(-(n - 0.5) * 4 / 0.147))
  return sn * dead + (1 - sn) * alive
}

export const r2_ca_02_smoothlife            = {
  id: 'r2-ca-02-smoothlife',
  name: 'SMOOTHLIFE',
  repo: 'Rafler 2011 · arXiv:1111.1567',
  summary: 'Conway Life generalized to continuous floating-point states using disk/ring neighborhoods and sigmoid birth/death thresholds.',
  helps: 'Smooth translating gliders treat the glyph boundary as a wall — clean orbiting blobs inside letterforms.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const G  = num(params, 'res', 128)
    const ri = num(params, 'ri', 4)
    const ro = num(params, 'ro', 12)
    const b1 = num(params, 'b1', 0.278)
    const b2 = num(params, 'b2', 0.365)
    const dt = num(params, 'dt', 0.1)

    const isIn = new Uint8Array(G * G)
    for (let y = 0; y < G; y++)
      for (let x = 0; x < G; x++)
        isIn[y * G + x] = sdf.sample((x / G) * sdf.w, (y / G) * sdf.h) < 0 ? 1 : 0

    // Precompute inner (disk) and outer (ring) kernels
    const kw = 2 * ro + 1
    const kInner = new Float32Array(kw * kw)
    const kOuter = new Float32Array(kw * kw)
    let sumI = 0, sumO = 0
    for (let ky = -ro; ky <= ro; ky++) {
      for (let kx = -ro; kx <= ro; kx++) {
        const r = Math.hypot(kx, ky)
        const ki = kw * (ky + ro) + (kx + ro)
        if (r <= ri) { kInner[ki] = 1; sumI++ }
        else if (r <= ro) { kOuter[ki] = 1; sumO++ }
      }
    }
    for (let i = 0; i < kw * kw; i++) { kInner[i] /= sumI; kOuter[i] /= sumO }

    // Seed random noise inside glyph
    const A = new Float32Array(G * G)
    for (let i = 0; i < G * G; i++)
      if (isIn[i]) A[i] = rng() < 0.4 ? rng() : 0
    let nIn = 0
    for (let i = 0; i < G * G; i++) nIn += isIn[i]

    // Kernel-scaled patch of the same noise statistics as the init seed
    const noiseBlob = (cx        , cy        ) => {
      const br = Math.max(4, Math.round(ro * 1.5))
      stampGrid(G, G, { x: cx, y: cy }, br, (i) => {
        if (isIn[i]) A[i] = Math.max(A[i], rng() < 0.5 ? rng() : 0)
      })
    }
    const randomNoiseBlob = () => {
      let sx        , sy        , tries = 0
      do {
        sx = (rng() * G) | 0
        sy = (rng() * G) | 0
        tries++
      } while (!isIn[sy * G + sx] && tries < 200)
      noiseBlob(sx, sy)
    }
    // Solid disc of live matter — the flood unit for the press event
    const matterBlob = (cx        , cy        ) => {
      const br = Math.max(4, Math.round(ro * 1.2))
      stampGrid(G, G, { x: cx, y: cy }, br, (i, w) => {
        if (isIn[i]) A[i] = Math.min(1, A[i] + w)
      })
    }

    const nInner = new Float32Array(G * G)
    const nOuter = new Float32Array(G * G)
    const img = ctx.createImageData(G, G)
    const offCanvas = document.createElement('canvas')
    offCanvas.width = G; offCanvas.height = G
    const offCtx = offCanvas.getContext('2d')

    let prevDown = false

    return wrapLoop(() => {
      // Pointer: inject live matter at the cursor (scaled by `interact`,
      // 0 = inert), before the convolution so this frame consumes it.
      // Hover = continuous injection, held = sustained pour, down-EDGE =
      // a multi-blob FLOOD of matter around the press.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      const edge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (ptr) {
        const gp = { x: (ptr.x / sdf.w) * G, y: (ptr.y / sdf.h) * G }
        const rad = G * 0.07 * (0.5 + params.interact * 0.5)
        stampGrid(G, G, gp, rad, (i, w) => {
          if (isIn[i]) A[i] = Math.min(1, A[i] + w * (ptr.down ? 1.2 : 0.8) * params.interact)
        })
        if (edge) {
          const spread = rad * 5
          const blobs = 10 + Math.round(4 * params.interact)
          matterBlob(gp.x, gp.y)
          for (let bIdx = 0; bIdx < blobs; bIdx++) {
            const a = rng() * Math.PI * 2
            const d = rng() * spread
            matterBlob(gp.x + Math.cos(a) * d, gp.y + Math.sin(a) * d)
          }
        }
      }

      // Convolve inner & outer separately
      for (let y = 0; y < G; y++) {
        for (let x = 0; x < G; x++) {
          const i = y * G + x
          if (!isIn[i]) { nInner[i] = 0; nOuter[i] = 0; continue }
          let accI = 0, accO = 0
          // hoisted: kernel bounds clamped once per cell — no per-tap branches/index math
          const ky0 = y < ro ? -y : -ro
          const ky1 = y > G - 1 - ro ? G - 1 - y : ro
          const kx0 = x < ro ? -x : -ro
          const kx1 = x > G - 1 - ro ? G - 1 - x : ro
          for (let ky = ky0; ky <= ky1; ky++) {
            const kRow = (ky + ro) * kw + ro
            const aRow = (y + ky) * G + x
            for (let kx = kx0; kx <= kx1; kx++) {
              const val = A[aRow + kx]
              accI += kInner[kRow + kx] * val
              accO += kOuter[kRow + kx] * val
            }
          }
          nInner[i] = accI
          nOuter[i] = accO
        }
      }

      // Update: SmoothLife transition clamped to [0,1]
      for (let i = 0; i < G * G; i++) {
        if (!isIn[i]) { A[i] = 0; continue }
        const s = transition(nInner[i], nOuter[i], b1, b2)
        A[i] = Math.max(0, Math.min(1, A[i] + dt * (2 * s - 1)))
      }

      // LIFE: gliders die out or the field saturates — both fossilize.
      // Keep total mass in a healthy band: on die-out re-seed noise patches
      // (the init statistics); on saturation cull and re-seed structure.
      let massA = 0
      for (let i = 0; i < G * G; i++) massA += A[i]
      if (massA < nIn * 0.02) {
        for (let s = 0; s < 5; s++) randomNoiseBlob()
      } else if (massA > nIn * 0.65) {
        for (let i = 0; i < G * G; i++) A[i] *= 0.5
        randomNoiseBlob()
        randomNoiseBlob()
      }

      // theme ramp LUT — boosted so live gliders hit full brightness
      const rampLUT = new Uint8Array(64 * 3)
      for (let k = 0; k < 64; k++) {
        const [rr, gg, bb] = rampRGB(k / 63)
        rampLUT[k * 3] = rr; rampLUT[k * 3 + 1] = gg; rampLUT[k * 3 + 2] = bb
      }
      const [bgR, bgG, bgB] = roleRGB('bg')
      for (let i = 0; i < G * G; i++) {
        const j = i * 4
        if (!isIn[i]) {
          img.data[j] = bgR; img.data[j + 1] = bgG; img.data[j + 2] = bgB; img.data[j + 3] = 255
          continue
        }
        const v = Math.min(1, Math.max(0, A[i]) * 1.35)
        const ki = (v * 63) | 0
        img.data[j]     = rampLUT[ki * 3]
        img.data[j + 1] = rampLUT[ki * 3 + 1]
        img.data[j + 2] = rampLUT[ki * 3 + 2]
        img.data[j + 3] = 255
      }
      clear(ctx, W, H)
      offCtx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(offCanvas, 0, 0, W, H)
      ctx.imageSmoothingEnabled = true
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)
    })
  },
}
