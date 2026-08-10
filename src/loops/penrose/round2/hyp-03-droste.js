

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop } from '../common.js'

// Hyperbolic Droste / logarithmic spiral conformal warp.
// Map: z → exp(c * (log(z) + t)) where c = (2πi + log(k)) / 2πi
// Creates a self-similar infinite zoom spiral. Each frame advances t → continuous zoom.
// Texture source: draw the glyph outline + radial stripes, then warp it.

const PARAMS          = [
  { key: 'zoom', type: 'range', min: 0.3, max: 3.0, default: 1.0, step: 0.05, label: 'zoom speed' },
  { key: 'scale', type: 'range', min: 1.1, max: 4.0, default: 2.0, step: 0.05, label: 'scale factor k' },
  { key: 'twist', type: 'range', min: -1, max: 1, default: 0.25, step: 0.025, label: 'twist' },
  { key: 'bands', type: 'int', min: 2, max: 16, default: 6, label: 'radial bands' },
  { key: 'cx', type: 'range', min: -0.5, max: 0.5, default: 0.0, step: 0.01, label: 'center x' },
  { key: 'cy', type: 'range', min: -0.5, max: 0.5, default: 0.0, step: 0.01, label: 'center y' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

export const r2_hyp_03_droste            = {
  id: 'r2-hyp-03-droste',
  name: 'HYPERBOLIC DROSTE SPIRAL',
  repo: 'Conformal map · log-exp · Escher Print Gallery',
  summary:
    'Logarithmic conformal spiral map (exp(c·log(z)+t)) creates infinite zoom with exact self-similarity. Time parameter advances the zoom phase continuously — the glyph interior flows inward forever.',
  helps: 'Maximum zoom payoff: every frame reveals a new scale of structure with no repetition.',
  params: PARAMS,
  init({ ctx, sdf, W, H, params, clock, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h

    /* Law 2 (2026-08-09): the spiral centre is pointer-commanded — the
     * singularity FOLLOWS the cursor (lerped, never snapped); idle eases
     * back to the cx/cy knobs. Press = zoom pulse: a decaying burst of
     * extra zoom phase. */
    let scx = null
    let scy = null
    let zoomPhase = 0
    let zoomKick = 0
    let prevDown = false

    /* Capped compute buffer, allocated ONCE — the old frame loop created a
     * full-res ImageData EVERY frame (~6MB of garbage per frame fullscreen:
     * the memory hog, 2026-08-09). The conformal map is smooth, so a small
     * buffer upscales cleanly through drawImage. */
    const bk = Math.min(1, 300 / Math.max(W, H))
    const bw = Math.max(8, Math.round(W * bk))
    const bh = Math.max(8, Math.round(H * bk))
    const buf = document.createElement('canvas')
    buf.width = bw
    buf.height = bh
    const bctx = buf.getContext('2d')
    const idata = bctx.createImageData(bw, bh)

    return wrapLoop(() => {
      const t = clock.nowSeconds()
      const zoomSpd = num(params, 'zoom', 1.0)
      const k = Math.max(1.01, num(params, 'scale', 2.0))
      const twist = num(params, 'twist', 0.25)
      const bands = Math.round(num(params, 'bands', 6))
      const kcx = num(params, 'cx', 0.0)
      const kcy = num(params, 'cy', 0.0)

      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const kB = Math.min(1, interact)
      if (scx == null) { scx = kcx; scy = kcy }
      const tcx = ptr ? kcx + (((ptr.x / sdf.w) * 2 - 1) - kcx) * kB : kcx
      const tcy = ptr ? kcy + (((ptr.y / sdf.h) * 2 - 1) - kcy) * kB : kcy
      scx += (tcx - scx) * 0.08
      scy += (tcy - scy) * 0.08
      const ocx = scx
      const ocy = scy

      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) zoomKick += 2.2 * Math.min(1.5, interact)
      zoomPhase += zoomKick * 0.06
      zoomKick *= 0.92

      // c = (2πi + log(k)) / 2π  ... the Droste constant
      const logk = Math.log(k)
      // c complex: cx_c = logk/(2π), cy_c = 1 + twist
      const c_re = logk / (2 * Math.PI)
      const c_im = 1 + twist

      // Time (plus the press pulse) drives log-domain offset → continuous zoom.
      // Wrapped mod 2/3: stripe = frac(angular + 1.5·wre) shifts by exactly 1
      // per 2/3 of tOffset, so the wrap is an exact visual identity — and
      // exp(wre) can no longer overflow to Inf/NaN as t grows (NaN hygiene).
      const tOffset = ((t * zoomSpd + zoomPhase) * logk / (2 * Math.PI)) % (2 / 3)

      clear(ctx, W, H)

      const d = idata.data
      d.fill(0)

      for (let py = 0; py < bh; py++) {
        for (let px = 0; px < bw; px++) {
          const sdfX = (px / bw) * sdf.w
          const sdfY = (py / bh) * sdf.h
          const sdfDist = sdf.sample(sdfX, sdfY) // sampled once, reused for the fade
          if (sdfDist >= 0) continue

          // Map to complex plane centered at (ocx, ocy)
          let zx = (px / bw) * 2 - 1 - ocx
          let zy = (py / bh) * 2 - 1 - ocy

          const r2 = zx * zx + zy * zy
          if (r2 < 1e-8) continue

          // log(z)
          const logR = 0.5 * Math.log(r2)
          const argZ = Math.atan2(zy, zx)

          // c * log(z) + time offset
          // c * (logR + i*argZ) = (c_re*logR - c_im*argZ) + i*(c_re*argZ + c_im*logR)
          const wre = c_re * logR - c_im * argZ + tOffset
          const wim = c_re * argZ + c_im * logR

          // exp(w)
          const expR = Math.exp(wre)
          const sampX = expR * Math.cos(wim)
          const sampY = expR * Math.sin(wim)

          // Sample a procedural radial stripe texture
          const texAngle = Math.atan2(sampY, sampX)
          const texR = Math.sqrt(sampX * sampX + sampY * sampY)

          // Bands pattern: alternate by angle + log-radius
          const bandVal = (texAngle / Math.PI + 1) * bands * 0.5 + Math.log(Math.max(1e-4, texR)) * 1.5
          const stripe = (bandVal % 1 + 1) % 1
          // Distance fade within glyph
          const gFade = Math.max(0, Math.min(1, -sdfDist / 20))

          const hue = (texAngle / (Math.PI * 2) + 0.5 + t * 0.03) % 1
          // HSL-ish: pick two complementary colors
          const bright = 0.4 + 0.6 * (stripe < 0.5 ? stripe * 2 : (1 - stripe) * 2)
          const r = Math.sin(hue * Math.PI * 2) * 0.5 + 0.5
          const g = Math.sin(hue * Math.PI * 2 + 2.094) * 0.5 + 0.5
          const b = Math.sin(hue * Math.PI * 2 + 4.189) * 0.5 + 0.5

          const idx = (py * bw + px) * 4
          d[idx]     = r * bright * gFade * 255
          d[idx + 1] = g * bright * gFade * 255
          d[idx + 2] = b * bright * gFade * 255
          d[idx + 3] = 255
        }
      }

      bctx.putImageData(idata, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(buf, 0, 0, W, H)
      strokeOutline(ctx, sdf, W, H)
    })
  },
}
