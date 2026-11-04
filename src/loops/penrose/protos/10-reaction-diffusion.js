
import { clear, wrapLoop, rampRGB, roleRGB, stampGrid } from '../common.js'

// Gray-Scott reaction-diffusion on a 220×220 grid (one-dim per channel).
// Mask limits the reactive region to SDF<0. Rendered via an ImageData put
// scaled into the canvas.
//
// Reference: jasonwebb/reaction-diffusion-playground ·
// https://karlsims.com/rd.html (Karl Sims) · mrob.com/pub/comp/xmorphia (Mrob)
export const reactionDiff            = {
  id: '10-reaction-diffusion',
  name: 'Reaction-diffusion (Gray-Scott)',
  repo: 'jasonwebb/reaction-diffusion-playground',
  summary:
    'Gray-Scott partial-differential equations solved on a coarse grid, masked by the SDF. Produces coral / zebra / spots / leopard depending on feed/kill rates. Slower iteration than vector algos; here CPU-bound at ~30fps, fine for demo. A pixel pattern layer instead of vector.',
  helps:
    'The odd one out — raster, not vector. Shows what off-brief looks like. Probably not the fit for this project, but worth seeing the comparison.',
  params: [
    { key: 'feed', type: 'range', min: 0.01, max: 0.1, step: 0.001, default: 0.055, label: 'feed' },
    { key: 'kill', type: 'range', min: 0.04, max: 0.08, step: 0.001, default: 0.062, label: 'kill' },
    { key: 'dA', type: 'range', min: 0.2, max: 1.5, step: 0.05, default: 1.0, label: 'diffuse a' },
    { key: 'dB', type: 'range', min: 0.1, max: 1, step: 0.05, default: 0.5, label: 'diffuse b' },
    { key: 'iter', type: 'int', min: 1, max: 8, default: 2, label: 'iterations' },
    { key: 'seeds', type: 'int', min: 1, max: 80, default: 20, label: 'seeds' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, params, pointer }) {
    const { feed, kill, dA, dB, iter, seeds } = params
    const GRID = 220
    const A = new Float32Array(GRID * GRID)
    const B = new Float32Array(GRID * GRID)
    const A2 = new Float32Array(GRID * GRID)
    const B2 = new Float32Array(GRID * GRID)
    const isIn = new Uint8Array(GRID * GRID)
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const sx = (x / GRID) * sdf.w
        const sy = (y / GRID) * sdf.h
        isIn[y * GRID + x] = sdf.sample(sx, sy) < 0 ? 1 : 0
        A[y * GRID + x] = 1
      }
    }
    // seed with a few random spots inside
    const seedBlob = (x        , y        ) => {
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const xx = x + dx, yy = y + dy
          if (xx < 0 || xx >= GRID || yy < 0 || yy >= GRID) continue
          if (!isIn[yy * GRID + xx]) continue
          B[yy * GRID + xx] = 1
        }
      }
    }
    for (let i = 0; i < seeds; i++) {
      const x = (Math.random() * GRID) | 0
      const y = (Math.random() * GRID) | 0
      if (!isIn[y * GRID + x]) continue
      seedBlob(x, y)
    }
    let nIn = 0
    for (let i = 0; i < GRID * GRID; i++) nIn += isIn[i]

    const dt = 1

    const img = ctx.createImageData(GRID, GRID)

    // PERF: blit canvas hoisted — a fresh document.createElement('canvas')
    // per frame was pure GC churn. And the per-pixel rampRGB (48k calls +
    // 48k [r,g,b] allocs per frame) goes through a 256-entry LUT rebuilt
    // once per frame instead.
    const tmp = document.createElement('canvas')
    tmp.width = GRID
    tmp.height = GRID
    const tmpCtx = tmp.getContext('2d')
    const LUT = new Uint8ClampedArray(256 * 3)

    /* THE STABLE STENCIL (plan 49 5.4 — the user: "these two are broken"): the 4-neighbour sum (weights −4 … +1) with
       diffusion 1.0 at dt 1 is four times past explicit Euler's limit — the field blew up to NaN within frames, and NaN
       read as the ramp's darkest stop, a blank frame. Gray-Scott's usual 3×3 kernel (Sims): 0.2 sides, 0.05 corners,
       −1 centre — weights sum to 0, stable at these rates. Edges clamp to the cell itself. */
    const at = (buf, x, y, i) => (x < 0 || x >= GRID || y < 0 || y >= GRID ? buf[i] : buf[y * GRID + x])
    const laplace = (buf, x, y, i) =>
      0.2 * (at(buf, x - 1, y, i) + at(buf, x + 1, y, i) + at(buf, x, y - 1, i) + at(buf, x, y + 1, i))
      + 0.05 * (at(buf, x - 1, y - 1, i) + at(buf, x + 1, y - 1, i) + at(buf, x - 1, y + 1, i) + at(buf, x + 1, y + 1, i))
      - buf[i]

    let prevDown = false

    return wrapLoop(() => {
      // Pointer — inject B chemical under the cursor (pointer arrives in
      // sdf space; map to grid space first). The mask still gates every write,
      // so painting outside the glyph does nothing. Hover = continuous
      // injection, held = sustained pour, down-EDGE = a RING of B — an
      // expanding wavefront from the press.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      const edge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (ptr) {
        const gp = { x: (ptr.x / sdf.w) * GRID, y: (ptr.y / sdf.h) * GRID }
        const rad = GRID * 0.04 * (0.5 + params.interact * 0.5)
        stampGrid(GRID, GRID, gp, rad * (ptr.down ? 1.4 : 1), (i, w) => {
          if (isIn[i]) B[i] = Math.min(1, B[i] + w * (ptr.down ? 1 : 0.6) * params.interact)
        })
        if (edge) {
          const ringR = rad * 5
          const thick = 2.5
          const x0 = Math.max(0, Math.floor(gp.x - ringR - thick))
          const x1 = Math.min(GRID - 1, Math.ceil(gp.x + ringR + thick))
          const y0 = Math.max(0, Math.floor(gp.y - ringR - thick))
          const y1 = Math.min(GRID - 1, Math.ceil(gp.y + ringR + thick))
          for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
              const d = Math.hypot(x - gp.x, y - gp.y)
              if (Math.abs(d - ringR) > thick) continue
              const i = y * GRID + x
              if (isIn[i]) B[i] = 1
            }
          }
        }
      }
      // LIFE: Gray-Scott can die to uniform A (B mass → 0) and fossilize.
      // Below the mass floor, re-seed random blobs — diffusion fades them in.
      let totalB = 0
      for (let i = 0; i < GRID * GRID; i++) totalB += B[i]
      if (totalB < Math.max(10, nIn * 0.002)) {
        for (let s = 0; s < 4; s++) {
          const x = (Math.random() * GRID) | 0
          const y = (Math.random() * GRID) | 0
          if (isIn[y * GRID + x]) seedBlob(x, y)
        }
      }
      // iterations per frame
      for (let it = 0; it < iter; it++) {
        for (let y = 1; y < GRID - 1; y++) {
          for (let x = 1; x < GRID - 1; x++) {
            const i = y * GRID + x
            if (!isIn[i]) { A2[i] = A[i]; B2[i] = B[i]; continue }
            const a = A[i], b = B[i]
            const ab2 = a * b * b
            A2[i] = a + (dA * laplace(A, x, y, i) - ab2 + feed * (1 - a)) * dt
            B2[i] = b + (dB * laplace(B, x, y, i) + ab2 - (kill + feed) * b) * dt
          }
        }
        A.set(A2)
        B.set(B2)
      }

      // render via ImageData scaled — palette ramp through the frame LUT
      const [bgR, bgG, bgB] = roleRGB('bg')
      for (let li = 0; li < 256; li++) {
        const [r, g, b] = rampRGB(li / 255)
        LUT[li * 3] = r
        LUT[li * 3 + 1] = g
        LUT[li * 3 + 2] = b
      }
      for (let i = 0; i < GRID * GRID; i++) {
        const j = i * 4
        if (!isIn[i]) { img.data[j] = bgR; img.data[j + 1] = bgG; img.data[j + 2] = bgB; img.data[j + 3] = 255; continue }
        const v = Math.max(0, Math.min(1, A[i] - B[i]))
        const li = (v * 255) | 0
        img.data[j] = LUT[li * 3]
        img.data[j + 1] = LUT[li * 3 + 1]
        img.data[j + 2] = LUT[li * 3 + 2]
        img.data[j + 3] = 255
      }
      clear(ctx, W, H)
      tmpCtx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true /* smooth field, not blocks — plan 49 5.3 */
      ctx.drawImage(tmp, 0, 0, W, H)
      ctx.imageSmoothingEnabled = true
    })
  },
}
