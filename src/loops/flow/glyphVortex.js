import { mixHex } from '../lib/util.js'
import { vortex, noiseFlow, instanceGlyphs, orbitAt } from './fieldCore.js'
import { mulberry32 } from '../gl/rng.js'

// Glyph vortex (E3, after contemporarytype × honigwespe; Anna Fay via Composition NY) — one glyph
// tiled on a grid, each copy turned to a vortex field; rotation symmetry makes g read as 6/9 and
// n as u. MAPPING: colour (and optionally size) ← field strength, a ramp dim → accent. The vortex
// centres ride closed paths and the noise loops in u ⇒ seamless.
const noiseBySeed = new Map()

export default {
  id: 'flow-glyphs',
  label: 'Glyph vortex',
  group: 'flow',
  kind: '2d',
  duration: 16,
  params: [
    { key: 'bg', label: 'Background', type: 'color', role: 'bg', default: '#0b0b0e', section: 'Color' },
    { key: 'weak', label: 'Weak', type: 'color', role: 'dim', default: '#3f6485', section: 'Color' },
    { key: 'strong', label: 'Strong', type: 'color', role: 'accent', default: '#ffcf33', section: 'Color' },
    { key: 'glyph', label: 'Glyph', type: 'select', options: ['g', 'n', 'a', 'e', 'k', 'r', 's', '6', '→', '•'].map((c) => ({ value: c, label: c })), default: 'g' },
    { key: 'cols', label: 'Columns', type: 'range', min: 8, max: 64, step: 1, default: 26 },
    { key: 'size', label: 'Size', type: 'range', min: 0.4, max: 1.6, step: 0.05, default: 0.95 },
    { key: 'scaleBy', label: 'Size by strength', type: 'range', min: 0, max: 1, step: 0.05, default: 0.5 },
    { key: 'vortices', label: 'Vortices', type: 'range', min: 1, max: 4, step: 1, default: 2, noRandom: true },
    { key: 'swirl', label: 'Swirl', type: 'range', min: 0.5, max: 8, step: 0.5, default: 3 },
    { key: 'noise', label: 'Noise', type: 'range', min: 0, max: 1, step: 0.05, default: 0.25 },
    { key: 'seed', label: 'Seed', type: 'range', min: 1, max: 999, step: 1, default: 7 },
  ],
  draw(ctx, u, w, h, p) {
    const m = Math.min(w, h)
    const seed = Math.round(p.seed)
    if (!noiseBySeed.has(seed)) noiseBySeed.set(seed, noiseFlow(mulberry32(seed), 0.004, 1))
    const n = Math.round(p.vortices)
    const field = Array.from({ length: n }, (_, i) => {
      const [x, y] = orbitAt(u, w * (i + 0.5) / n, h * 0.5, w * 0.12, h * 0.18, 1, 1, i * 2.1)
      return vortex(x, y, p.swirl * (i % 2 ? -1 : 1), m * 0.18)
    })
    if (p.noise > 0) field.push(((f) => (x, y) => { const [a, b] = f(x, y); return [a * p.noise, b * p.noise] })(noiseBySeed.get(seed)(u)))

    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)
    instanceGlyphs(ctx, field, {
      w, h, cols: Math.round(p.cols), glyph: p.glyph, size: p.size, scaleBy: p.scaleBy,
      font: '"PP Right Grotesk", "Inter", system-ui, sans-serif',
      colorAt: (k) => mixHex(p.weak, p.strong, Math.min(1, k * 1.4)),
    })
  },
}
