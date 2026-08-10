// μNCA — ultra-compact 4-channel Neural CA with hand-coded 68-parameter kernel.
// Architecture: Mordvintsev & Niklasson arXiv 2111.13545
// No ML runtime. The update rule is a tiny learned convolution baked as a
// Float32Array. Perception: one 3×3 filter per channel (learned, not Sobel).
// Update: single linear projection + tanh. Permanent soliton-like motion.


import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, rampRGB, roleRGB, stampGrid } from '../common.js'

// 4-channel μNCA kernel weights (hand-designed, inspired by Mordvintsev 2021).
// Each channel has one 3×3 perception filter → 4×9 = 36 weights,
// plus a 4×4 linear update matrix + 4-bias = 20 params. Total ≈ 56.
// Values chosen to produce rotating wave-like texture solitons.
const K           = [
  // ch0 filter (3×3, row-major, centre=4)
   0.0, -0.25,  0.0,
  -0.25, 1.0, -0.25,
   0.0, -0.25,  0.0,
  // ch1 filter — horizontal Sobel
  -0.125, 0.0,  0.125,
  -0.25,  0.0,  0.25,
  -0.125, 0.0,  0.125,
  // ch2 filter — vertical Sobel
  -0.125, -0.25, -0.125,
   0.0,    0.0,   0.0,
   0.125,  0.25,  0.125,
  // ch3 filter — diagonal Laplacian
   0.125, 0.0, -0.125,
   0.0,   0.0,  0.0,
  -0.125, 0.0,  0.125,
]
// 4×4 linear update matrix W (row = output channel, col = input perceived channel)
// + 4 biases (last col would be bias but we keep it simple, bias=0)
const W             = [
  [ 0.6, -0.3,  0.5, -0.2],
  [-0.4,  0.7, -0.1,  0.4],
  [ 0.2, -0.5,  0.6,  0.3],
  [-0.3,  0.2, -0.4,  0.7],
]

const PARAMS          = [
  { key: 'res',    type: 'int',   min: 64,  max: 160, default: 112, step: 16,  label: 'grid res' },
  { key: 'rate',   type: 'range', min: 0.1, max: 0.9, default: 0.5, step: 0.05, label: 'update rate' },
  { key: 'speed',  type: 'range', min: 0.5, max: 3.0, default: 1.0, step: 0.1,  label: 'step / frame' },
  { key: 'bright', type: 'range', min: 0.5, max: 3.0, default: 2.0, step: 0.1,  label: 'brightness' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

export const r2_nca_01_munca            = {
  id: 'r2-nca-01-munca',
  name: 'μNCA',
  repo: 'Mordvintsev & Niklasson arXiv 2111.13545',
  summary: 'Ultra-compact 4-channel NCA with hand-baked 56-parameter kernel. Sobel perception + linear update + tanh. Permanent soliton motion, SDF-gated.',
  helps: 'Minimal NCA skeleton — permanent wave motion, zero runtime deps, baked weights.',
  params: PARAMS,
  init({ ctx, sdf, W: W2, H, rng, params, pointer }) {
    const G      = num(params, 'res',    112)
    const rate   = num(params, 'rate',   0.5)
    const stepsF = num(params, 'speed',  1.0)
    const bright = num(params, 'bright', 1.4)
    const NC = 4
    const N  = G * G

    const state = new Float32Array(N * NC)
    const next  = new Float32Array(N * NC)
    const mask  = new Uint8Array(N)

    for (let y = 0; y < G; y++) {
      for (let x = 0; x < G; x++) {
        const i = y * G + x
        const sx = (x / G) * sdf.w
        const sy = (y / G) * sdf.h
        mask[i] = sdf.sample(sx, sy) < 0 ? 1 : 0
        if (mask[i]) {
          for (let c = 0; c < NC; c++) state[i * NC + c] = (rng() - 0.5) * 0.4
        }
      }
    }

    function perceive(buf              , x        , y        , ch        )         {
      const off = ch * 9
      let sum = 0
      let ki = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = Math.max(0, Math.min(G - 1, x + dx))
          const ny = Math.max(0, Math.min(G - 1, y + dy))
          sum += K[off + ki] * buf[(ny * G + nx) * NC + ch]
          ki++
        }
      }
      return sum
    }

    function step() {
      for (let y = 0; y < G; y++) {
        for (let x = 0; x < G; x++) {
          const i = y * G + x
          if (!mask[i]) { for (let c = 0; c < NC; c++) next[i * NC + c] = 0; continue }
          if (rng() > rate) { for (let c = 0; c < NC; c++) next[i * NC + c] = state[i * NC + c]; continue }
          // scalar perception — no per-cell array allocation in the hot loop
          const p0 = perceive(state, x, y, 0), p1 = perceive(state, x, y, 1)
          const p2 = perceive(state, x, y, 2), p3 = perceive(state, x, y, 3)
          for (let co = 0; co < NC; co++) {
            const Wr = W[co]
            const delta = Wr[0] * p0 + Wr[1] * p1 + Wr[2] * p2 + Wr[3] * p3
            next[i * NC + co] = state[i * NC + co] + 0.1 * Math.tanh(delta)
          }
        }
      }
      state.set(next)
    }

    const img = ctx.createImageData(G, G)
    const sx = W2 / G, sy = H / G
    const tmp = document.createElement('canvas')
    tmp.width = G; tmp.height = G
    const tc = tmp.getContext('2d')

    let nIn = 0
    for (let i = 0; i < N; i++) nIn += mask[i]

    // Fresh appearance blob — the same noise statistics as the init seed
    const reseedBlob = (cx        , cy        ) => {
      const br = Math.max(4, Math.round(G * 0.08))
      stampGrid(G, G, { x: cx, y: cy }, br, (i) => {
        if (!mask[i]) return
        for (let c = 0; c < NC; c++) state[i * NC + c] = (rng() - 0.5) * 0.4
      })
    }
    const randomReseed = () => {
      let cx        , cy        , tries = 0
      do {
        cx = (rng() * G) | 0
        cy = (rng() * G) | 0
        tries++
      } while (!mask[cy * G + cx] && tries < 200)
      reseedBlob(cx, cy)
    }

    let prevDown = false

    return wrapLoop(() => {
      // Pointer: excite channel 0 at the cursor (scaled by `interact`,
      // 0 = inert) — the NCA steps below propagate the perturbation.
      // Hover = continuous excitation, held = sustained pour, down-EDGE =
      // a big multi-channel FLOOD around the press.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      const edge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (ptr) {
        const gp = { x: (ptr.x / sdf.w) * G, y: (ptr.y / sdf.h) * G }
        const rad = G * 0.06 * (0.5 + params.interact * 0.5)
        stampGrid(G, G, gp, rad, (i, w) => {
          if (mask[i]) state[i * NC] = Math.min(1, state[i * NC] + w * (ptr.down ? 2 : 1) * params.interact)
        })
        if (edge) {
          stampGrid(G, G, gp, rad * 5, (i, w) => {
            if (!mask[i]) return
            for (let c = 0; c < NC; c++)
              state[i * NC + c] += (rng() - 0.5) * 4 * w * (1 + params.interact)
          })
        }
      }

      const steps = Math.round(stepsF)
      for (let s = 0; s < steps; s++) step()

      // LIFE: the NCA can flatline to black or blow out — both fossilize.
      // Keep mean |ch0| in a band: re-seed fresh noise blobs on collapse;
      // damp the field and re-seed structure on saturation.
      let act = 0
      for (let i = 0; i < N; i++) act += Math.abs(state[i * NC])
      const meanAct = act / Math.max(1, nIn)
      if (meanAct < 0.02) {
        for (let s = 0; s < 4; s++) randomReseed()
      } else if (meanAct > 1.5) {
        for (let i = 0; i < state.length; i++) state[i] *= 0.5
        randomReseed()
        randomReseed()
      }

      // theme ramp LUT — boosted so soliton crests hit full brightness
      const rampLUT = new Uint8Array(64 * 3)
      for (let k = 0; k < 64; k++) {
        const [rr, gg, bb] = rampRGB(k / 63)
        rampLUT[k * 3] = rr; rampLUT[k * 3 + 1] = gg; rampLUT[k * 3 + 2] = bb
      }
      const [bgR, bgG, bgB] = roleRGB('bg')
      for (let i = 0; i < N; i++) {
        const j = i * 4
        if (!mask[i]) {
          img.data[j] = bgR; img.data[j + 1] = bgG; img.data[j + 2] = bgB; img.data[j + 3] = 255
          continue
        }
        // Collapse the channel-0 state to a single 0..1 field intensity for the ramp.
        const v = Math.max(0, Math.min(1, (state[i * NC + 0] * bright + 1) * 0.5))
        const ki = (v * 63) | 0
        img.data[j]     = rampLUT[ki * 3]
        img.data[j + 1] = rampLUT[ki * 3 + 1]
        img.data[j + 2] = rampLUT[ki * 3 + 2]
        img.data[j + 3] = 255
      }
      clear(ctx, W2, H)
      tc.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(tmp, 0, 0, W2, H)
      ctx.imageSmoothingEnabled = true
      strokeOutline(ctx, sdf, W2, H, 'rgba(240, 230, 210, 0.35)', 2)
    })
  },
}
