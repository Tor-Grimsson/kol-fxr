

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sampleInside } from '../common.js'

const PARAMS          = [
  { key: 'N',       type: 'int',   min: 4,   max: 24,  default: 8,   step: 1,    label: 'sources' },
  { key: 'waveSpd', type: 'range', min: 0.1, max: 3,   default: 0.8, step: 0.05, label: 'wave speed' },
  { key: 'wOffset', type: 'range', min: 0,   max: 60,  default: 20,  step: 2,    label: 'weight offset' },
  { key: 'blur',    type: 'range', min: 0,   max: 4,   default: 1,   step: 0.5,  label: 'edge softness' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

// Apollonius diagram (additively-weighted Voronoi) — raster CPU approach.
// Cell boundary between i and j is the hyperbola |x−cᵢ|−wᵢ = |x−cⱼ|−wⱼ.
// We rasterize by computing argmin of (|x−cᵢ|−wᵢ) per pixel at reduced
// resolution, then upscale with putImageData to canvas size.
export const r2_geom_03_apollonius            = {
  id: 'r2-geom-03-apollonius',
  name: 'APOLLONIUS DIAGRAM',
  repo: 'raster CPU · additively-weighted Voronoi',
  summary: 'Multi-source wavefront competition inside the glyph. Each seed ignites at a different time; expanding circular wavefronts compete for territory. Cell boundaries are curved hyperbolas/parabolas — distinctly non-Euclidean texture.',
  helps: 'Most visually exotic of the Voronoi family: curved boundaries, competitive territorial dynamics, maps directly to wave propagation physics.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h

    const N = Math.min(num(params, 'N', 8), 24)
    const sites                     = []
    const ignitions           = []   // time offset per source
    for (let i = 0; i < N; i++) {
      sites.push(sampleInside(sdf, rng))
      ignitions.push(rng() * 4)      // stagger ignition 0–4 s
    }
    // home positions — the spring anchor each site eases back toward
    const homes = sites.map((s) => [...s])

    let prevDown = false

    // Render at reduced resolution for performance — SCALE grows on big
    // buffers so the raster stays ≤ ~256² (bounded per-frame cost), and the
    // upscale is a native drawImage blit instead of a per-canvas-pixel JS loop.
    const SCALE = Math.max(4, Math.ceil(Math.max(sdf.w, sdf.h) / 256))
    const rw = Math.ceil(sdf.w / SCALE)
    const rh = Math.ceil(sdf.h / SCALE)
    const imgData = ctx.createImageData(rw, rh) // allocated ONCE, reused each frame
    const buf = document.createElement('canvas')
    buf.width = rw
    buf.height = rh
    const bctx = buf.getContext('2d')

    // Palette: hue per source
    const hues = sites.map((_, i) => Math.round((i / N) * 360))

    function hslToRgb(h        , s        , l        )                           {
      h /= 360; s /= 100; l /= 100
      const k = (n        ) => (n + h * 12) % 12
      const a = s * Math.min(l, 1 - l)
      const f = (n        ) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
      return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
    }

    // hoisted per-site colours — hslToRgb was running per raster pixel
    const siteRGB = hues.map((h) => hslToRgb(h, 72, 50))
    const siteDot = hues.map((h) => `hsl(${h},90%,80%)`)

    return wrapLoop(() => {
      const t      = clock.nowSeconds()
      const wspd   = num(params, 'waveSpd', 0.8)
      const woff   = num(params, 'wOffset', 20)

      // Pointer interaction — shove sites off the cursor (× interact) while a
      // 4% home-spring eases them back; cells squish and restore.
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      if (ptr) {
        const pReach = Math.min(sdf.w, sdf.h) * 0.2
        const pStr = Math.min(sdf.w, sdf.h) * 0.02 * interact
        for (const s of sites) {
          const dx = s[0] - ptr.x, dy = s[1] - ptr.y
          const d2 = dx * dx + dy * dy
          if (d2 >= pReach * pReach || d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const f = (1 - d / pReach) * pStr
          const nx = s[0] + (dx / d) * f
          const ny = s[1] + (dy / d) * f
          if (sdf.sample(nx, ny) < 0) { s[0] = nx; s[1] = ny }
        }
      }

      // down-EDGE = jolt: throw every site in reach outward HARD — the cell
      // diagram convulses; the home springs heal it over the next second
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) {
        const reach = Math.min(sdf.w, sdf.h) * 0.45
        const str = Math.min(sdf.w, sdf.h) * 0.28 * interact
        for (const s of sites) {
          const dx = s[0] - ptr.x, dy = s[1] - ptr.y
          const d2 = dx * dx + dy * dy
          if (d2 >= reach * reach || d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const f = (0.35 + 0.65 * (1 - d / reach)) * str
          const nx = s[0] + (dx / d) * f
          const ny = s[1] + (dy / d) * f
          if (sdf.sample(nx, ny) < 0) { s[0] = nx; s[1] = ny }
          else if (sdf.sample(s[0] + (dx / d) * f * 0.4, s[1] + (dy / d) * f * 0.4) < 0) {
            s[0] += (dx / d) * f * 0.4
            s[1] += (dy / d) * f * 0.4
          }
        }
      }

      for (let i = 0; i < N; i++) {
        sites[i][0] += (homes[i][0] - sites[i][0]) * 0.04
        sites[i][1] += (homes[i][1] - sites[i][1]) * 0.04
      }

      // Weights grow over time: wᵢ(t) = speed * (t − ignitions[i])
      const weights = ignitions.map((ig) => Math.max(0, (t - ig) * wspd * sdf.w * 0.12 + woff))

      // Rasterise at low res into the init-allocated buffer
      const pixels = imgData.data
      for (let ry = 0; ry < rh; ry++) {
        for (let rx = 0; rx < rw; rx++) {
          const wx = rx * SCALE + SCALE / 2
          const wy = ry * SCALE + SCALE / 2
          if (sdf.sample(wx, wy) >= 0) {
            // outside mask — transparent
            const pi = (ry * rw + rx) * 4
            pixels[pi + 3] = 0
            continue
          }
          let bestDist = Infinity, bestI = 0
          for (let i = 0; i < N; i++) {
            const [cx, cy] = sites[i]
            const ddx = wx - cx, ddy = wy - cy
            const d = Math.sqrt(ddx * ddx + ddy * ddy) - weights[i]
            if (d < bestDist) { bestDist = d; bestI = i }
          }
          const pi = (ry * rw + rx) * 4
          const [r, g, b] = siteRGB[bestI]
          pixels[pi]     = r
          pixels[pi + 1] = g
          pixels[pi + 2] = b
          pixels[pi + 3] = 235
        }
      }

      // Scale up to full canvas — native nearest-neighbour blit (same look
      // as the old manual per-pixel loop, without the W×H JS iteration)
      clear(ctx, W, H)
      bctx.putImageData(imgData, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(buf, 0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)

      // Source dots — big bright cores over their own territory hue
      const dotR = Math.max(6, Math.min(W, H) * 0.012)
      for (let i = 0; i < N; i++) {
        const [x, y] = sites[i]
        ctx.beginPath()
        ctx.arc(x * sx, y * sy, dotR, 0, Math.PI * 2)
        ctx.fillStyle = siteDot[i]
        ctx.fill()
      }
    })
  },
}
