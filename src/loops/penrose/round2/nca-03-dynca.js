// DyNCA — motion-directed dynamic texture CA.
// Architecture: Pajouheshgar, Xu, Süsstrunk CVPR 2023 (arXiv 2211.11417)
// Key feature: externally controllable motion direction. State = 3 appearance
// channels + 2 motion channels. The motion field is injected as a Sobel
// projection aligned to a user-steerable angle, advecting the appearance channels.
// Cells outside the SDF are zeroed; permanent directed flow inside.


import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, rampRGB, roleRGB, stampGrid } from '../common.js'

const PARAMS          = [
  { key: 'res',    type: 'int',   min: 64,   max: 160,  default: 112,  step: 16,  label: 'grid res' },
  { key: 'angle',  type: 'range', min: 0,    max: 360,  default: 45,   step: 5,   label: 'flow angle°' },
  { key: 'speed',  type: 'range', min: 0.05, max: 0.5,  default: 0.15, step: 0.05, label: 'flow speed' },
  { key: 'rate',   type: 'range', min: 0.2,  max: 1.0,  default: 0.5,  step: 0.05, label: 'update rate' },
  { key: 'bright', type: 'range', min: 0.5,  max: 3.0,  default: 2.2,  step: 0.1,  label: 'brightness' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

// Sobel-x and Sobel-y — combine to project along arbitrary direction
const SX = [-0.125, 0, 0.125, -0.25, 0, 0.25, -0.125, 0, 0.125]
const SY = [-0.125, -0.25, -0.125, 0, 0, 0, 0.125, 0.25, 0.125]

export const r2_nca_03_dynca            = {
  id: 'r2-nca-03-dynca',
  name: 'DyNCA',
  repo: 'Pajouheshgar et al CVPR 2023 arXiv 2211.11417',
  summary: 'Motion-directed NCA: 3 appearance + 2 motion channels. Flow angle is live-steerable. Sobel perception projected onto motion vector drives appearance advection. Permanent directed flow.',
  helps: 'Choreographed letterform fill — strokes flow along glyph axes rather than randomly.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const G      = num(params, 'res',    112)
    const NC_A   = 3   // appearance
    const NC_M   = 2   // motion (vx, vy)
    const NC     = NC_A + NC_M
    const N      = G * G

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
          for (let c = 0; c < NC_A; c++) state[i * NC + c] = (rng() - 0.5) * 0.5
          state[i * NC + NC_A + 0] = (rng() - 0.5) * 0.2
          state[i * NC + NC_A + 1] = (rng() - 0.5) * 0.2
        }
      }
    }

    function conv3ch(buf              , x        , y        , ch        , f          )         {
      let s = 0, k = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = Math.max(0, Math.min(G - 1, x + dx))
          const ny = Math.max(0, Math.min(G - 1, y + dy))
          s += f[k++] * buf[(ny * G + nx) * NC + ch]
        }
      }
      return s
    }

    // Bilinear sample of appearance channel at sub-pixel position
    function sampleApp(buf              , fx        , fy        , ch        )         {
      const x0 = Math.floor(fx), y0 = Math.floor(fy)
      const tx = fx - x0, ty = fy - y0
      const x1 = Math.min(G - 1, x0 + 1), y1 = Math.min(G - 1, y0 + 1)
      const xx0 = Math.max(0, x0), yy0 = Math.max(0, y0)
      const v00 = buf[(yy0 * G + xx0) * NC + ch]
      const v10 = buf[(yy0 * G + x1)  * NC + ch]
      const v01 = buf[(y1  * G + xx0) * NC + ch]
      const v11 = buf[(y1  * G + x1)  * NC + ch]
      return v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty) + v01 * (1 - tx) * ty + v11 * tx * ty
    }

    let nIn = 0
    for (let i = 0; i < N; i++) nIn += mask[i]

    // Fresh appearance blob — the same noise statistics as the init seed
    const reseedBlob = (cx        , cy        ) => {
      const br = Math.max(4, Math.round(G * 0.08))
      stampGrid(G, G, { x: cx, y: cy }, br, (i) => {
        if (!mask[i]) return
        for (let c = 0; c < NC_A; c++) state[i * NC + c] = (rng() - 0.5) * 0.5
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

    // Blit target hoisted — was a fresh ImageData + canvas every frame
    const img = ctx.createImageData(G, G)
    const tmp = document.createElement('canvas')
    tmp.width = G; tmp.height = G
    const tc = tmp.getContext('2d')

    let prevDown = false
    let angEff = num(params, 'angle', 45)  // lerped effective flow angle (deg)

    return wrapLoop(() => {
      const authored = num(params, 'angle', 45)
      const spd    = num(params, 'speed', 0.15)
      const rate   = num(params, 'rate',  0.5)
      const bright = num(params, 'bright', 1.6)

      // Pointer: while present, pointer x COMMANDS the flow angle (the sim's
      // natural interact knob) — lerped; idle returns to the authored value.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      const edge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      const angTarget = ptr ? Math.max(0, Math.min(1, ptr.x / sdf.w)) * 360 : authored
      angEff += (angTarget - angEff) * 0.08
      const ang = angEff * (Math.PI / 180)
      const cos = Math.cos(ang), sin = Math.sin(ang)

      // Pointer stamp: brighten the appearance channels at the cursor (scaled
      // by `interact`, 0 = inert) — the advection below carries the mark away.
      // Hover = continuous mark, held = sustained pour, down-EDGE = a big
      // multi-channel FLOOD around the press.
      if (ptr) {
        const gp = { x: (ptr.x / sdf.w) * G, y: (ptr.y / sdf.h) * G }
        const rad = G * 0.06 * (0.5 + params.interact * 0.5)
        stampGrid(G, G, gp, rad, (i, w) => {
          if (!mask[i]) return
          for (let c = 0; c < NC_A; c++)
            state[i * NC + c] = Math.min(1, state[i * NC + c] + w * (ptr.down ? 2 : 1) * params.interact)
        })
        if (edge) {
          stampGrid(G, G, gp, rad * 5, (i, w) => {
            if (!mask[i]) return
            for (let c = 0; c < NC_A; c++)
              state[i * NC + c] += (rng() - 0.5) * 4 * w * (1 + params.interact)
          })
        }
      }

      for (let y = 0; y < G; y++) {
        for (let x = 0; x < G; x++) {
          const i = y * G + x
          if (!mask[i]) { for (let c = 0; c < NC; c++) next[i * NC + c] = 0; continue }
          if (rng() > rate) { for (let c = 0; c < NC; c++) next[i * NC + c] = state[i * NC + c]; continue }

          // Motion perception: project Sobel onto flow direction
          const gx0 = conv3ch(state, x, y, 0, SX), gy0 = conv3ch(state, x, y, 0, SY)
          const gx1 = conv3ch(state, x, y, 1, SX), gy1 = conv3ch(state, x, y, 1, SY)
          const vx = state[i * NC + NC_A + 0], vy = state[i * NC + NC_A + 1]

          // Update motion channels toward external direction
          const mvx = 0.9 * vx + 0.1 * (cos * spd)
          const mvy = 0.9 * vy + 0.1 * (sin * spd)
          next[i * NC + NC_A + 0] = mask[i] ? mvx : 0
          next[i * NC + NC_A + 1] = mask[i] ? mvy : 0

          // Advect appearance channels along motion field
          for (let c = 0; c < NC_A; c++) {
            const gx = c === 0 ? gx0 : c === 1 ? gx1 : conv3ch(state, x, y, 2, SX)
            const gy = c === 0 ? gy0 : c === 1 ? gy1 : conv3ch(state, x, y, 2, SY)
            const adv = sampleApp(state, x - mvx, y - mvy, c)
            next[i * NC + c] = adv + 0.05 * Math.tanh(-gx * cos - gy * sin)
          }
          // enforce SDF mask
          if (!mask[i]) for (let c = 0; c < NC; c++) next[i * NC + c] = 0
        }
      }
      state.set(next)

      // LIFE: the NCA can collapse to black or saturate — both fossilize.
      // Keep mean |appearance| in a band: re-seed fresh noise blobs on
      // collapse; damp the appearance field and re-seed on saturation.
      let act = 0
      for (let i = 0; i < N; i++)
        act += Math.abs(state[i * NC]) + Math.abs(state[i * NC + 1]) + Math.abs(state[i * NC + 2])
      const meanAct = act / Math.max(1, nIn * 3)
      if (meanAct < 0.02) {
        for (let s = 0; s < 4; s++) randomReseed()
      } else if (meanAct > 1.5) {
        for (let i = 0; i < N; i++)
          for (let c = 0; c < NC_A; c++) state[i * NC + c] *= 0.5
        randomReseed()
        randomReseed()
      }

      // render — theme ramp LUT, boosted so the flow texture hits full brightness
      const rampLUT = new Uint8Array(64 * 3)
      for (let k = 0; k < 64; k++) {
        const [rr, gg, bb] = rampRGB(k / 63)
        rampLUT[k * 3] = rr; rampLUT[k * 3 + 1] = gg; rampLUT[k * 3 + 2] = bb
      }
      const [bgR0, bgG0, bgB0] = roleRGB('bg')
      for (let i = 0; i < N; i++) {
        const j = i * 4
        if (!mask[i]) {
          img.data[j] = bgR0; img.data[j + 1] = bgG0; img.data[j + 2] = bgB0; img.data[j + 3] = 255
          continue
        }
        const r = Math.max(0, Math.min(1, state[i * NC + 0] * bright * 0.5 + 0.5))
        const g = Math.max(0, Math.min(1, state[i * NC + 1] * bright * 0.5 + 0.5))
        const b = Math.max(0, Math.min(1, state[i * NC + 2] * bright * 0.5 + 0.5))
        const intensity = (r + g + b) / 3
        const ki = (intensity * 63) | 0
        img.data[j]     = rampLUT[ki * 3]
        img.data[j + 1] = rampLUT[ki * 3 + 1]
        img.data[j + 2] = rampLUT[ki * 3 + 2]
        img.data[j + 3] = 255
      }
      clear(ctx, W, H)
      tc.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(tmp, 0, 0, W, H)
      ctx.imageSmoothingEnabled = true
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)
    })
  },
}
