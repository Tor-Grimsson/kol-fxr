// Chladni membrane — standing wave superposition on the glyph domain.
// Approximates eigenmodes via weighted random Fourier modes (cos(kx·x + ky·y + φ)),
// masked to the glyph interior. Two modes mix with slowly evolving weights:
//   u(t) = cos(ω1·t)·φ1 + cos(ω2·t)·φ2
// Bright = crest/trough; dark band at u≈0 is the nodal line (where sand collects).
//
// Reference: Chladni 1787; Müller arXiv:1308.5523



import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, rampRGB, roleRGB } from '../common.js'

const PARAMS          = [
  { key: 'res',   type: 'int',   min: 80, max: 180, default: 140, step: 20,  label: 'grid res' },
  { key: 'modeA', type: 'int',   min: 1,  max: 12,  default: 3,   step: 1,   label: 'mode A index' },
  { key: 'modeB', type: 'int',   min: 1,  max: 12,  default: 5,   step: 1,   label: 'mode B index' },
  { key: 'speed', type: 'range', min: 0.05, max: 1.0, default: 0.25, step: 0.05, label: 'beat speed' },
  { key: 'nodal', type: 'range', min: 0.02, max: 0.25, default: 0.08, step: 0.01, label: 'nodal band' },
]

// Pre-baked (m,n) mode pairs for a rectangular-ish domain
const MODES                          = [
  [1,1],[1,2],[2,1],[2,2],[1,3],[3,1],[2,3],[3,2],[3,3],[1,4],[4,1],[2,4],
]

export const r2_wave_02_chladni            = {
  id: 'r2-wave-02-chladni',
  name: 'CHLADNI MEMBRANE',
  repo: 'Chladni 1787 · Müller arXiv:1308.5523',
  summary: 'Standing-wave superposition on the glyph-shaped membrane. Two eigenmodes beat against each other; bright regions vibrate, the dark nodal band reveals where sand would settle in Chladni\'s original experiment.',
  helps: 'The glyph IS the membrane — its geometry uniquely determines the nodal topology.',
  params: PARAMS,
  init({ ctx, sdf, W, H, params, clock }) {
    const G  = num(params, 'res', 140)
    const N  = G * G

    // Pre-compute SDF mask and bounding box
    const mask = new Uint8Array(N)
    let xMin = G, xMax = 0, yMin = G, yMax = 0
    for (let y = 0; y < G; y++) {
      for (let x = 0; x < G; x++) {
        const sx = (x / G) * sdf.w
        const sy = (y / G) * sdf.h
        if (sdf.sample(sx, sy) < 0) {
          mask[y * G + x] = 1
          if (x < xMin) xMin = x; if (x > xMax) xMax = x
          if (y < yMin) yMin = y; if (y > yMax) yMax = y
        }
      }
    }
    const bW = xMax - xMin + 1 || G
    const bH = yMax - yMin + 1 || G

    // Evaluate mode (m,n): cos(m·π·(x-xMin)/bW) · cos(n·π·(y-yMin)/bH)
    // This is the Neumann (free-edge) solution on a rectangle; Dirichlet would use sin.
    // Mask enforces Dirichlet on the actual glyph boundary.
    const evalMode = (m        , n        , x        , y        )         => {
      const nx = ((x - xMin) / bW) * Math.PI * m
      const ny = ((y - yMin) / bH) * Math.PI * n
      return Math.sin(nx) * Math.sin(ny)
    }

    // Natural frequency ∝ sqrt(m² + n²)
    const freq = (m        , n        ) => Math.sqrt(m * m + n * n)

    const img = ctx.createImageData(G, G)
    const tmpC = document.createElement('canvas')
    tmpC.width = G; tmpC.height = G
    const tctx = tmpC.getContext('2d')

    // Cached mode fields — rebuilt only when a mode index changes.
    // Per-frame evalMode cost 4×G×G sin calls (~130k at G=180); now amortized.
    const fieldA = new Float32Array(N)
    const fieldB = new Float32Array(N)
    let cachedA = -1, cachedB = -1
    const buildField = (buf, m, n) => {
      for (let y = 0; y < G; y++) {
        for (let x = 0; x < G; x++) buf[y * G + x] = evalMode(m, n, x, y)
      }
    }

    const rampLUT = new Uint8Array(64 * 3)
    let lastBgKey = -1

    return wrapLoop(() => {
      const t      = clock.nowSeconds()
      const modeA  = Math.max(0, Math.min(MODES.length - 1, num(params, 'modeA', 3) - 1))
      const modeB  = Math.max(0, Math.min(MODES.length - 1, num(params, 'modeB', 5) - 1))
      const speed  = num(params, 'speed', 0.25)
      const band   = num(params, 'nodal', 0.08)

      const [mA, nA] = MODES[modeA]
      const [mB, nB] = MODES[modeB]
      const wA = freq(mA, nA) * speed
      const wB = freq(mB, nB) * speed
      const cA = Math.cos(wA * t)
      const cB = Math.cos(wB * t)

      if (modeA !== cachedA) { buildField(fieldA, mA, nA); cachedA = modeA }
      if (modeB !== cachedB) { buildField(fieldB, mB, nB); cachedB = modeB }

      // theme ramp LUT — wide dynamic range: nodal lines stay dark, crests burn
      for (let k = 0; k < 64; k++) {
        const [rr, gg, bb] = rampRGB(k / 63)
        rampLUT[k * 3] = rr; rampLUT[k * 3 + 1] = gg; rampLUT[k * 3 + 2] = bb
      }
      const [bgR0, bgG0, bgB0] = roleRGB('bg')
      const bgKey = (bgR0 << 16) | (bgG0 << 8) | bgB0
      const repaintBg = bgKey !== lastBgKey
      lastBgKey = bgKey
      const invBand = 0.5 / band
      const data = img.data
      for (let i = 0; i < N; i++) {
        const j = i * 4
        if (!mask[i]) {
          if (repaintBg) {
            data[j] = bgR0; data[j+1] = bgG0; data[j+2] = bgB0; data[j+3] = 255
          }
          continue
        }
        const u = cA * fieldA[i] + cB * fieldB[i]
        const abs = Math.abs(u)
        // nodal line: u near 0 → bg end of ramp; crest amplitude keeps climbing
        const bright = abs < band ? abs * invBand : Math.min(1, 0.5 + (abs - band) * 0.8)
        const ki = (bright * 63) | 0
        data[j] = rampLUT[ki * 3]; data[j+1] = rampLUT[ki * 3 + 1]; data[j+2] = rampLUT[ki * 3 + 2]; data[j+3] = 255
      }

      clear(ctx, W, H)
      tctx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(tmpC, 0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)
    })
  },
}
