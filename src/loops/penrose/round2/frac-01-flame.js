

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, rampRGB } from '../common.js'

// Flame Fractal — Scott Draves IFS with nonlinear variations, rendered via a
// log-density histogram.
//
// LIVING FLAME REWORK (2026-08-09 — "dead on arrival" fix): the histogram is
// PERSISTENT with a slow decay, so density accumulates into blazing cores
// while structure that moves leaves fading trails. One transform rides a
// slow continuous parameter orbit — the flame visibly morphs shape over
// seconds, forever. Tone mapping is boosted for hard contrast (cores hit the
// top of the ramp). The pointer leans the morph orbit through a heavy lerp
// in a NARROW range; press = a smooth ~2s crossfade re-randomize of one
// transform (baseA glides to a new target — never a hard cut).

const PARAMS          = [
  { key: 'iters', type: 'int', min: 5000, max: 60000, default: 20000, step: 2500, label: 'iterations' },
  { key: 'drift', type: 'range', min: 0, max: 1, default: 0.25, step: 0.05, label: 'param drift' },
  { key: 'gamma', type: 'range', min: 0.2, max: 1.0, default: 0.45, step: 0.05, label: 'gamma' },
  { key: 'palette', type: 'select', options: ['warm', 'cool', 'ember'], default: 'warm' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

// Scott Draves nonlinear variations: sinusoidal, spherical, swirl
function sinusoidal(x, y) {
  return [Math.sin(x), Math.sin(y)]
}
function spherical(x, y) {
  const r2 = x * x + y * y + 1e-9
  return [x / r2, y / r2]
}
function swirl(x, y) {
  const r2 = x * x + y * y
  return [x * Math.sin(r2) - y * Math.cos(r2), x * Math.cos(r2) + y * Math.sin(r2)]
}
const VARS = [sinusoidal, spherical, swirl]

function palettePx(v, p) {
  const t = v
  if (p === 'cool') return [
    Math.floor(40 + 60 * t),
    Math.floor(100 + 120 * t),
    Math.floor(180 + 75 * t),
  ]
  if (p === 'ember') return [
    Math.floor(220 + 35 * t),
    Math.floor(80 * t * t),
    Math.floor(10 * t),
  ]
  // warm default
  return [
    Math.floor(255 * Math.min(1, t * 1.6)),
    Math.floor(200 * t * t),
    Math.floor(80 * t * t * t),
  ]
}

export const r2_frac_01_flame            = {
  id: 'r2-frac-01-flame',
  name: 'FLAME FRACTAL',
  repo: 'Scott Draves 1992 — flam3.com/flame_draves.pdf',
  summary: 'IFS with nonlinear variations (sinusoidal, spherical, swirl) rendered via log-density histogram. Affine map angles drift over time producing living, breathing filaments.',
  helps: 'Cross-scale fractal detail — zoom into any tendril and sub-tendrils appear. Log-density tone map reveals filament structure only inside the glyph.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    // 5 affine maps: [a,b,c,d,e,f] = ax+by+c, dx+ey+f; variation index; color hue
    const N = 5
    const randMap = () => [
      (rng() - 0.5) * 1.2, (rng() - 0.5) * 0.5, (rng() - 0.5) * 0.6,
      (rng() - 0.5) * 0.5, (rng() - 0.5) * 1.2, (rng() - 0.5) * 0.6,
    ]
    const baseA = Array.from({ length: N }, randMap)
    const targA = baseA.map((m) => m.slice()) // press morph targets — baseA glides toward these
    const varIdx = Array.from({ length: N }, (_, i) => i % VARS.length)
    const mapHue = Array.from({ length: N }, (_, i) => i / N)

    // persistent log-density histogram — decays slowly instead of clearing
    const RES = 160
    const hist = new Float32Array(RES * RES * 2) // [freq, color] interleaved
    const DECAY = 0.96

    const tmp = document.createElement('canvas')
    tmp.width = RES
    tmp.height = RES
    const tctx = tmp.getContext('2d')
    // hoisted per-frame buffers (2026-08-09 perf) — refilled, never re-allocated
    const img = tctx.createImageData(RES, RES)
    const rampLUT = new Uint8Array(64 * 3)

    let sLeanX = 0, sLeanY = 0, sTwist = 0
    let prevDown = false
    let px = rng() * 2 - 1, py = rng() * 2 - 1, col = rng() // persistent chaos point
    let smMax = 1    // smoothed histogram max — stable tone map, no strobing
    let boot = 30    // first ~0.5s runs hot so the flame is alive on arrival

    return wrapLoop(() => {
      const t = clock.nowSeconds()
      const drift = num(params, 'drift', 0.25)
      const iters = num(params, 'iters', 20000)
      const gamma = num(params, 'gamma', 0.45)
      const palette = String(params['palette'] ?? 'warm')

      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const kB = Math.min(1, interact)

      // pointer leans the morph orbit — NARROW range, ~1s lerp
      const tLx = ptr ? ((ptr.x / sdf.w) * 2 - 1) * 0.22 * kB : 0
      const tLy = ptr ? ((ptr.y / sdf.h) * 2 - 1) * 0.22 * kB : 0
      const tTw = ptr ? ((ptr.x / sdf.w) - 0.5) * 0.8 * kB : 0
      sLeanX += (tLx - sLeanX) * 0.03
      sLeanY += (tLy - sLeanY) * 0.03
      sTwist += (tTw - sTwist) * 0.03

      // press = pick one transform, hand it a new random target — the
      // crossfade below morphs it over ~2s, never a hard cut
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) targA[Math.floor(rng() * N)] = randMap()
      for (let k = 0; k < N; k++) {
        const m = baseA[k], g = targA[k]
        for (let j = 0; j < 6; j++) m[j] += (g[j] - m[j]) * 0.025
      }

      // build the frame's maps — auto drift + the pointer's twist and lean;
      // transform 0 additionally rides a slow continuous orbit so the flame
      // morphs shape on its own, forever
      const maps = baseA.map((m, i) => {
        let m0 = m
        if (i === 0) {
          m0 = [
            m[0] + 0.3 * Math.sin(t * 0.9), m[1] + 0.22 * Math.cos(t * 0.7), m[2] + 0.18 * Math.sin(t * 1.1),
            m[3] + 0.22 * Math.cos(t * 0.8), m[4] + 0.3 * Math.sin(t * 1.3 + 1.7), m[5] + 0.18 * Math.cos(t * 0.6),
          ]
        }
        const angle = drift * Math.sin(t * 0.3 + i * 1.4) + sTwist * (0.7 + (i / N) * 0.6)
        const ca = Math.cos(angle), sa = Math.sin(angle)
        return [
          m0[0] * ca - m0[3] * sa, m0[1] * ca - m0[4] * sa, m0[2] + sLeanX,
          m0[0] * sa + m0[3] * ca, m0[1] * sa + m0[4] * ca, m0[5] + sLeanY,
        ]
      })

      // decay, then deposit — history persists, movement leaves fading trails
      for (let i = 0; i < hist.length; i++) hist[i] *= DECAY

      const cx = RES / 2, cy = RES / 2
      const scaleIn = RES * 0.22
      let itersF = iters
      if (boot > 0) { itersF *= 3; boot-- }
      itersF = Math.min(itersF, 90000) // hard frame budget — boot×3 at max iters stays bounded

      for (let i = 0; i < itersF; i++) {
        const mi = Math.floor(rng() * N)
        const m = maps[mi]
        let nx = m[0] * px + m[1] * py + m[2]
        let ny = m[3] * px + m[4] * py + m[5]
        // variations inlined — VARS[..](..) allocated an array per iteration
        const vi = varIdx[mi]
        if (vi === 0) { nx = Math.sin(nx); ny = Math.sin(ny) }
        else if (vi === 1) { const r2 = nx * nx + ny * ny + 1e-9; const ix = nx / r2; ny = ny / r2; nx = ix }
        else { const r2 = nx * nx + ny * ny; const s = Math.sin(r2), c = Math.cos(r2); const ix = nx * s - ny * c; ny = nx * c + ny * s; nx = ix }
        col = (col + mapHue[mi]) * 0.5
        px = nx; py = ny

        const hx = Math.round(cx + nx * scaleIn)
        const hy = Math.round(cy + ny * scaleIn)
        if (hx < 0 || hx >= RES || hy < 0 || hy >= RES) continue

        // SDF check: map hist pixel to canvas coords
        const wx = (hx / RES) * sdf.w
        const wy = (hy / RES) * sdf.h
        if (sdf.sample(wx, wy) >= 0) continue

        const idx = (hy * RES + hx) * 2
        hist[idx] += 1
        hist[idx + 1] += col
      }

      // NaN hygiene — a blown-up chaos point re-seeds instead of sticking forever
      if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(col)) {
        px = rng() * 2 - 1; py = rng() * 2 - 1; col = rng()
      }

      // smoothed max — tone map stays steady while density churns
      let maxFreq = 1
      for (let i = 0; i < RES * RES; i++) if (hist[i * 2] > maxFreq) maxFreq = hist[i * 2]
      smMax += (maxFreq - smMax) * 0.06
      const logMax = Math.log(smMax + 1)

      // LUT — theme ramp by default, authored palettes on select; refilled
      // per frame so live theme flips re-tint (buffer hoisted)
      for (let k = 0; k < 64; k++) {
        const tt = k / 63
        const [rr, gg, bb] = palette === 'warm' ? rampRGB(tt) : palettePx(tt, palette)
        rampLUT[k * 3] = rr; rampLUT[k * 3 + 1] = gg; rampLUT[k * 3 + 2] = bb
      }

      img.data.fill(0) // hoisted ImageData — cleared, not re-allocated (102KB/frame saved)
      for (let i = 0; i < RES * RES; i++) {
        const freq = hist[i * 2]
        if (freq < 0.6) continue
        const a = Math.pow(Math.log(freq + 1) / logMax, gamma)
        const ki = (Math.min(1, a * 1.35) * 63) | 0
        img.data[i * 4] = rampLUT[ki * 3]
        img.data[i * 4 + 1] = rampLUT[ki * 3 + 1]
        img.data[i * 4 + 2] = rampLUT[ki * 3 + 2]
        img.data[i * 4 + 3] = Math.floor(Math.min(1, a * 1.9) * 255)
      }

      clear(ctx, W, H)
      tctx.putImageData(img, 0, 0)
      ctx.drawImage(tmp, 0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)
    })
  },
}
