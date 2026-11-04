

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop } from '../common.js'

// Hyperbolic Droste / logarithmic spiral conformal warp.
// A self-similar log-polar spiral: the pattern repeats once per turn and once per scale step k, so it zooms forever
// with no seam (plan 50 2.1 — the old exp(c·log z) map broke at the angle's wrap).

const PARAMS          = [
  { key: 'zoom', type: 'range', min: 0.3, max: 3.0, default: 1.0, step: 0.05, label: 'zoom speed' },
  { key: 'scale', type: 'range', min: 1.1, max: 4.0, default: 2.0, step: 0.05, label: 'scale factor k' },
  { key: 'twist', type: 'int', min: -4, max: 4, default: 1, label: 'twist' }, /* whole turns per scale step — the only values that close (plan 50 2.1) */
  { key: 'bands', type: 'int', min: 2, max: 16, default: 6, label: 'radial bands' },
  { key: 'cx', type: 'range', min: -0.5, max: 0.5, default: 0.0, step: 0.01, label: 'center x' },
  { key: 'cy', type: 'range', min: -0.5, max: 0.5, default: 0.0, step: 0.01, label: 'center y' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

export const r2_hyp_03_droste            = {
  id: 'r2-hyp-03-droste',
  name: 'Hyperbolic Droste spiral',
  repo: 'Conformal map · log-exp · Escher Print Gallery',
  summary:
    'Log-polar spiral: a pattern that repeats exactly once per turn and once per scale step k, so it zooms inward forever with no seam. Twist sets whole spiral turns per step; the Droste self-similarity of Escher\'s Print Gallery.',
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
    const bk = Math.min(1, 480 / Math.max(W, H)) /* was 300; 720 held 15 fps — plan 49 5.3 */
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
      const twist = Math.round(num(params, 'twist', 1))
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

      /* THE SPIRAL CLOSES ON ITSELF (plan 50 2.1). The old map was z → exp(c·log z) with c = log k/2π + i(1 + twist): where
         arg z wraps from +π to −π (the left half of the centre line) the 2π jump landed on a shift of the texture that
         is not one of its repeats (hue moved by log k, stripes by 2π(1+twist)), so a seam ran along it at any setting.
         The pattern is now a function of log-radius and angle that repeats exactly on both — once per turn (2π) and once
         per scale step (log k) — so the wrap and every zoom step are identities. Twist is whole turns per scale step; at
         0 the bands are radial, otherwise logarithmic spiral arms. */
      const logk = Math.log(k)
      const zoomT = ((t * zoomSpd + zoomPhase) * 0.25) % 1 /* one scale step per 4 s at zoom 1; a whole step is an identity */

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

          const lr = 0.5 * Math.log(r2) / logk - zoomT /* log-radius in scale steps */
          const turn = Math.atan2(zy, zx) / (2 * Math.PI) /* −½…½ */
          /* bands × turn + twist × lr: integer coefficients on both axes — continuous across the wrap and the step */
          /* +¼: no band edge lies on the horizontal axis at any band count — at Twist 0 one read as a seam */
          const stripe = ((bands * turn + twist * lr + 0.25) % 1 + 1) % 1
          const gFade = Math.max(0, Math.min(1, -sdfDist / 20))
          const texAngle = turn * 2 * Math.PI

          const hue = (texAngle / (Math.PI * 2) + 0.5 + t * 0.03) % 1
          // HSL-ish: pick two complementary colors
          /* a soft ring once per scale step — the zoom reads at any twist (cos(2π·lr) repeats with the step) */
          const bright = (0.4 + 0.6 * (stripe < 0.5 ? stripe * 2 : (1 - stripe) * 2)) * (0.78 + 0.22 * Math.cos(2 * Math.PI * lr))
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
