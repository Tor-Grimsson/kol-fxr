

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, rampRGB, roleRGB, stampGrid } from '../common.js'

// Bak-Tang-Wiesenfeld abelian sandpile. Grains dropped randomly inside the
// glyph; sites topple when grain count >= threshold (default 4), distributing
// to 4-connected neighbors. SDF >= 0 pixels are sinks — grains that topple
// there are absorbed. The glyph silhouette sculpts avalanche shape.
//
// Reference: Bak, Tang, Wiesenfeld (1987) PRL 59:381.

const PARAMS          = [
  { key: 'res',           type: 'int',   min: 80,  max: 220, default: 150, step: 10 },
  { key: 'dropsPerFrame', type: 'int',   min: 1,   max: 120, default: 30,  step: 1  },
  { key: 'threshold',     type: 'int',   min: 2,   max: 8,   default: 4,   step: 1  },
  { key: 'maxRelax',      type: 'int',   min: 50,  max: 2000,default: 400, step: 50 },
  { key: 'brightness',    type: 'range', min: 0.5, max: 2.0, default: 1.3, step: 0.05 },
  { key: 'interact',      type: 'range', min: 0,   max: 3,   default: 1,   step: 0.1, label: 'interaction' },
]

export const r2_soc_01_btw            = {
  id: 'r2-soc-01-btw',
  name: 'BTW SANDPILE',
  repo: 'Bak-Tang-Wiesenfeld 1987',
  summary: 'Sand grains dropped randomly inside the glyph; cells with height >= threshold topple to neighbors; dramatic power-law avalanches shaped by the letterform.',
  helps: 'Long quiescence punctuated by cascading avalanches — pure self-organized criticality. Narrow strokes create bottlenecks; counters form isolated basins.',

  params: PARAMS,

  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const G      = num(params, 'res', 150)
    const thresh = num(params, 'threshold', 4)
    const drops  = num(params, 'dropsPerFrame', 30)
    // capped at 60 full-grid sweeps/frame — grid persists, so an avalanche the cap
    // interrupts simply continues next frame (the visible multi-frame cascade);
    // 400–2000 sweeps × G² in one frame was a guaranteed hitch.
    const maxRel = Math.min(60, num(params, 'maxRelax', 400))
    const bright = num(params, 'brightness', 1.0)

    const N = G * G
    const grid   = new Int32Array(N)
    const isIn   = new Uint8Array(N)   // 1 = interior (active), 0 = sink

    for (let y = 0; y < G; y++) {
      for (let x = 0; x < G; x++) {
        const sx = (x / G) * sdf.w
        const sy = (y / G) * sdf.h
        isIn[y * G + x] = sdf.sample(sx, sy) < 0 ? 1 : 0
      }
    }

    // Collect interior indices for fast random drop targeting
    const interior           = []
    for (let i = 0; i < N; i++) if (isIn[i]) interior.push(i)

    const img = ctx.createImageData(G, G)
    const tmp = document.createElement('canvas')
    tmp.width = G; tmp.height = G
    const tc  = tmp.getContext('2d')

    let prevDown = false

    return wrapLoop(() => {
      // Drop grains
      for (let d = 0; d < drops; d++) {
        const idx = interior[(rng() * interior.length) | 0]
        grid[idx]++
      }

      // Pointer drops grains: extra sand rains under the cursor (scaled by
      // `interact`, 0 = inert) — relaxation below absorbs it into avalanches.
      // Down-EDGE = dump a PILE: one huge falloff-weighted load whose
      // relaxation cascades into a visible multi-frame avalanche.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      const edge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (ptr) {
        const gp = { x: (ptr.x / sdf.w) * G, y: (ptr.y / sdf.h) * G }
        const rad = G * 0.06 * (0.5 + params.interact * 0.5)
        const grains = Math.round(1 + 2 * params.interact)
        stampGrid(G, G, gp, rad, (i, w) => {
          if (w > 0.5 && isIn[i]) grid[i] += grains
        })
        if (edge) {
          const pileR = rad * 5
          stampGrid(G, G, gp, pileR, (i, w) => {
            if (isIn[i]) grid[i] += Math.round(w * w * (12 + 16 * params.interact))
          })
        }
      }

      // Relax (sequential toppling, bounded)
      for (let iter = 0; iter < maxRel; iter++) {
        let toppled = false
        for (let y = 0; y < G; y++) {
          for (let x = 0; x < G; x++) {
            const i = y * G + x
            if (!isIn[i] || grid[i] < thresh) continue
            toppled = true
            grid[i] -= thresh
            // inlined 4-neighbor topple — no per-topple array allocation;
            // grains to sinks or out-of-bounds are simply lost
            if (x > 0     && isIn[i - 1]) grid[i - 1]++
            if (x < G - 1 && isIn[i + 1]) grid[i + 1]++
            if (y > 0     && isIn[i - G]) grid[i - G]++
            if (y < G - 1 && isIn[i + G]) grid[i + G]++
          }
        }
        if (!toppled) break
      }

      // Render — theme ramp LUT, tall piles hit full brightness
      const rampLUT = new Uint8Array(64 * 3)
      for (let k = 0; k < 64; k++) {
        const [rr, gg, bb] = rampRGB(k / 63)
        rampLUT[k * 3] = rr; rampLUT[k * 3 + 1] = gg; rampLUT[k * 3 + 2] = bb
      }
      const [bgR0, bgG0, bgB0] = roleRGB('bg')
      for (let i = 0; i < N; i++) {
        const j = i * 4
        if (!isIn[i]) {
          img.data[j] = bgR0; img.data[j + 1] = bgG0; img.data[j + 2] = bgB0; img.data[j + 3] = 255
          continue
        }
        const v = Math.min(1, (Math.min(grid[i], 3) / 3) * bright)
        const ki = (v * 63) | 0
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
