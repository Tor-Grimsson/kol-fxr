
import { strokeOutline, wrapLoop } from '../common.js'

// Clifford attractor (https://paulbourke.net/fractals/clifford/), point cloud
// fixed-rate iterated and mapped into the glyph silhouette by discarding
// points that fall outside the SDF. The glyph acts as a rectangular clip.
//
// Reference: rreusser/clifford-and-de-jong-attractors (Observable notebook).
export const attractor            = {
  id: '11-attractor',
  name: 'CLIFFORD ATTRACTOR (SDF-CLIPPED)',
  repo: 'observablehq.com/@rreusser/clifford-and-de-jong-attractors',
  summary:
    'Clifford strange attractor iterated for 20k points per frame, then warped and clipped to the glyph SDF. The attractor does not naturally respect the shape — this shows why the shortlist deprioritizes attractors for letterform fill, but the pattern is gorgeous in its own right.',
  helps:
    'Evidence for the deprioritization in the research shortlist. The attractor ignores the mask — most of the iteration is thrown away on the clip test. Included so you can see why it is not a fit.',
  params: [
    { key: 'points', type: 'int', min: 2000, max: 60000, step: 1000, default: 20000, label: 'points' },
    { key: 'scale', type: 'range', min: 0.1, max: 0.5, step: 0.01, default: 0.28, label: 'scale' },
    { key: 'size', type: 'range', min: 1, max: 4, step: 0.5, default: 1, label: 'point size' },
    { key: 'fade', type: 'range', min: 0.01, max: 0.3, step: 0.01, default: 0.05, label: 'fade' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const { points, size, fade } = params
    /* Living system (2026-08-09): the coefficients ARE the primary dimension.
     * Pointer x/y retarget a and b (smooth lerp — the attractor MORPHS, never
     * snaps); press pulls the projection center to the cursor and swells the
     * scale. Idle: a slow breath around the home coefficients keeps the ink
     * from ever settling into a fixed image. */
    const aH = -1.24 + rng() * 0.6, bH = -1.25 + rng() * 0.5, c = -1.81 + rng() * 0.5, d = -1.91 + rng() * 0.4
    let a = aH, b = bH
    let x = 0, y = 0
    let tick = 0
    let cxOff = 0, cyOff = 0
    let scaleMul = 1

    return wrapLoop(() => {
      tick++
      const ptr = params.interact > 0 && pointer ? pointer() : null
      let ta = aH + Math.sin(tick * 0.006) * 0.06
      let tb = bH + Math.sin(tick * 0.0043 + 2.1) * 0.06
      let tCx = 0, tCy = 0, tScale = 1
      if (ptr) {
        const ix = Math.max(0, Math.min(1, ptr.x / sdf.w))
        const iy = Math.max(0, Math.min(1, ptr.y / sdf.h))
        const amt = Math.min(1, params.interact)
        ta += (-1.9 + ix * 1.2 - ta) * amt // x commands a
        tb += (-1.9 + iy * 1.2 - tb) * amt // y commands b
        if (ptr.down) {
          tCx = ptr.x - sdf.w / 2
          tCy = ptr.y - sdf.h / 2
          tScale = 1 + 0.6 * Math.min(1, params.interact)
        }
      }
      a += (ta - a) * 0.04 // glide, don't snap — the morph is the motion
      b += (tb - b) * 0.04
      cxOff += (tCx - cxOff) * 0.08
      cyOff += (tCy - cyOff) * 0.08
      scaleMul += (tScale - scaleMul) * 0.08

      ctx.fillStyle = `rgba(10, 11, 20, ${fade})`
      ctx.fillRect(0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(243, 231, 207, 0.18)', 1)

      // Use SDF bbox roughly (the mask). Attractor range is about [-2, 2].
      const cx = sdf.w / 2 + cxOff, cy = sdf.h / 2 + cyOff
      const sxOut = W / sdf.w, syOut = H / sdf.h
      const scale = Math.min(sdf.w, sdf.h) * params.scale * scaleMul

      ctx.fillStyle = 'rgba(243, 201, 196, 0.5)'
      for (let i = 0; i < points; i++) {
        const nx = Math.sin(a * y) + c * Math.cos(a * x)
        const ny = Math.sin(b * x) + d * Math.cos(b * y)
        x = nx; y = ny
        const px = cx + x * scale
        const py = cy + y * scale
        if (sdf.sample(px, py) >= 0) continue
        ctx.fillRect(px * sxOut, py * syOut, size, size)
      }
    })
  },
}
