// Meinhardt Sea-Shell Growth-Front Model.
// 1D RD (activator-inhibitor) run scanline-by-scanline through the glyph,
// each row's output feeding the next as initial condition.
// Produces diagonal stripes, chevrons, and zigzag patterns — like woodcut engraving.
// Reference: Meinhardt "The Algorithmic Beauty of Sea Shells" (Springer, 2009).



import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, rampRGB, roleRGB } from '../common.js'

const PARAMS          = [
  { key: 'res',   type: 'int',   min: 80,   max: 220, default: 180,  step: 20,   label: 'grid' },
  { key: 'dA',    type: 'range', min: 0.0,  max: 0.2, default: 0.02, step: 0.005, label: 'diffA' },
  { key: 'dB',    type: 'range', min: 0.1,  max: 2.0, default: 0.4,  step: 0.05, label: 'diffB' },
  { key: 'c',     type: 'range', min: 0.01, max: 0.2, default: 0.06, step: 0.005, label: 'autocatalysis c' },
  { key: 'mu',    type: 'range', min: 0.01, max: 0.2, default: 0.06, step: 0.005, label: 'decay mu' },
  { key: 'speed', type: 'range', min: 0.2,  max: 4.0, default: 1.0,  step: 0.1,  label: 'scroll speed' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

export const r2_rd_04_seashell            = {
  id: 'r2-rd-04-seashell',
  name: 'SEASHELL GROWTH FRONT',
  repo: 'Meinhardt 1995 — Algorithmic Beauty of Sea Shells',
  summary: 'Scanline-cascaded 1D RD generates diagonal stripes, chevrons, and zigzags filling the glyph like a woodcut print.',
  helps: 'Orthogonal aesthetic — looks hand-drawn/engraved, nothing like the other RD systems; trivially cheap to compute.',
  params: PARAMS,

  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const res   = num(params, 'res',   180)
    const dA    = num(params, 'dA',    0.02)
    const dB    = num(params, 'dB',    0.4)
    const c     = num(params, 'c',     0.06)
    const mu    = num(params, 'mu',    0.06)
    const speed = num(params, 'speed', 1.0)

    const rho0 = 0.001  // small baseline production keeps activator from dying out

    // 2D pixel buffer — we rebuild this every frame from the 1D cascade
    const img = ctx.createImageData(res, res)
    const tmp = document.createElement('canvas')
    tmp.width = res; tmp.height = res
    const tc = tmp.getContext('2d')

    // Mask
    const isIn = new Uint8Array(res * res)
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        isIn[y * res + x] = sdf.sample((x / res) * sdf.w, (y / res) * sdf.h) < 0 ? 1 : 0
      }
    }

    /* Law 2 (2026-08-09): pointer y commands the growth-front scroll rate,
     * pointer x the seed-row hash frequency (both lerped); idle keeps the
     * knob speed. Press = band reset: the lineage restarts from a fresh
     * seed row and the whole pattern re-forms. */
    let scroll = 0
    let sRate = null
    let sHashF = 0.37
    let hashPhase = 0
    let prevT = null
    let prevDown = false

    // 1D cascade scratch — hoisted out of the frame loop (fully rewritten each frame)
    const A = new Float32Array(res)
    const B = new Float32Array(res)
    const A2 = new Float32Array(res)
    const B2 = new Float32Array(res)

    return wrapLoop(() => {
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const kB = Math.min(1, interact)
      const now = clock.nowSeconds()
      if (prevT == null) prevT = now
      const dtF = Math.min(0.1, Math.max(0, now - prevT))
      prevT = now
      if (sRate == null) sRate = speed
      const tRate = ptr ? speed + ((0.2 + (1 - ptr.y / sdf.h) * 3.5) - speed) * kB : speed
      sRate += (tRate - sRate) * 0.06
      const tHash = ptr ? 0.37 + ((0.12 + (ptr.x / sdf.w) * 0.9) - 0.37) * kB : 0.37
      sHashF += (tHash - sHashF) * 0.06
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) { hashPhase = rng() * 1000; scroll += 80 }

      // Row offset scrolls over time — gives a continuous "growing" animation
      scroll += sRate * dtF
      const rowOffset = (scroll * res * 0.5) | 0

      // Seed row 0 with noise, modulated by offset so pattern evolves
      for (let x = 0; x < res; x++) {
        // Use a simple deterministic hash based on x + rowOffset for reproducible-looking noise
        const h = Math.sin(x * sHashF + rowOffset * 0.19 + hashPhase) * 0.5 + 0.5
        A[x] = 0.05 + 0.1 * h
        B[x] = 0.1  + 0.1 * (1 - h)
      }

      // theme ramp LUT (rebuilt per frame — palette is live), boosted contrast
      const rampLUT = new Uint8Array(64 * 3)
      for (let k = 0; k < 64; k++) {
        const [rr, gg, bb] = rampRGB(k / 63)
        rampLUT[k * 3] = rr; rampLUT[k * 3 + 1] = gg; rampLUT[k * 3 + 2] = bb
      }
      const [bgR0, bgG0, bgB0] = roleRGB('bg')

      for (let y = 0; y < res; y++) {
        // 4 forward-Euler steps per scanline row
        for (let it = 0; it < 4; it++) {
          for (let x = 0; x < res; x++) {
            const l = x > 0       ? A[x - 1] : A[x]
            const r = x < res - 1 ? A[x + 1] : A[x]
            const lapA = l + r - 2 * A[x]

            const lb = x > 0       ? B[x - 1] : B[x]
            const rb = x < res - 1 ? B[x + 1] : B[x]
            const lapB = lb + rb - 2 * B[x]

            const a = Math.max(0, A[x])
            const bv = Math.max(1e-9, B[x])
            const autocatA = c * a * a / bv
            // upper-clamped at 20 (normal ≲1) — the a²/B term can spike to Inf and Inf−Inf = NaN
            // dA/dt = dA∇²A + autocatA − mu*A + rho0
            A2[x] = Math.min(20, a + dA * lapA + autocatA - mu * a + rho0)
            // dB/dt = dB∇²B + autocatA − mu*B
            B2[x] = Math.min(20, bv + dB * lapB + autocatA - mu * bv)
          }
          A.set(A2)
          B.set(B2)
        }

        // Write row to pixel buffer
        for (let x = 0; x < res; x++) {
          const i = y * res + x
          const j = i * 4
          if (!isIn[i]) {
            img.data[j] = bgR0; img.data[j + 1] = bgG0; img.data[j + 2] = bgB0; img.data[j + 3] = 255
            continue
          }
          const v = Math.max(0, Math.min(1, A[x] * 6))
          const ki = (v * 63) | 0
          img.data[j]     = rampLUT[ki * 3]
          img.data[j + 1] = rampLUT[ki * 3 + 1]
          img.data[j + 2] = rampLUT[ki * 3 + 2]
          img.data[j + 3] = 255
        }
      }

      clear(ctx, W, H)
      tc.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(tmp, 0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)
    })
  },
}
