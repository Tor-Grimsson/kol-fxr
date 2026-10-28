import { mulberry32 } from '../loops/gl/rng.js'
import { transport } from '../editor/params/transport.js'
import { Growth, densityFrom, SIM_W } from '../loops/growth/engine.js'

// Growing line as an EFFECT (plan 43 § 4.2) — the layer's own photo or video frame is the density: one closed line
// grows over it and packs tighter where it is darker, drawn ink on paper in place of the image. The same engine is the
// generator Flow › Growth › Growing line (loops/flow/growthLine.js), which needs no upload.
//
// The density is read from `src` when the sim starts (a new source canvas, Variation, a resize or a transport stop/rewind),
// so a video grows over the frame it started on. Exports as one SVG path (`svg`).

let sim = null
let simKey = ''
let lastSrc = null

const ensure = (src, w, h, p) => {
  if (src !== lastSrc) { lastSrc = src; simKey = '' }
  const key = `${p.variant}|${p.invert}|${(w / h).toFixed(3)}|${transport.getEpoch()}`
  if (sim && simKey === key) return
  sim = new Growth({ w: SIM_W, h: SIM_W * h / w, density: densityFrom(src, 160, p.invert), rand: mulberry32((p.variant ?? 1) >>> 0) })
  sim.seed()
  simKey = key
}

export default {
  id: 'fx-growth',
  label: 'Growing line',
  animated: true,
  params: [
    { key: 'paper', label: 'Background', type: 'color', role: 'bg', default: '#f4f1ea', section: 'Color' },
    { key: 'ink', label: 'Line color', type: 'color', role: 'fg', default: '#141414', section: 'Color' },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false, noRandom: true },
    { key: 'variant', label: 'Variation', type: 'range', min: 1, max: 99, step: 1, default: 1, noRandom: true },
    { key: 'minGap', label: 'Dark spacing', type: 'range', min: 2, max: 14, step: 0.5, default: 5, rMin: 4, rMax: 7 },
    { key: 'maxGap', label: 'Light spacing', type: 'range', min: 8, max: 60, step: 1, default: 24, rMin: 16, rMax: 34 },
    { key: 'contrast', label: 'Contrast', type: 'range', min: 0.5, max: 3, step: 0.1, default: 1.6, rMin: 1, rMax: 2.2 },
    { key: 'weight', label: 'Weight', type: 'range', min: 0.5, max: 4, step: 0.1, default: 1.2, rMin: 0.8, rMax: 2 },
    { key: 'nodes', label: 'Length', type: 'range', min: 1000, max: 14000, step: 500, default: 9000, noRandom: true },
    { key: 'growth', label: 'Growth', type: 'range', min: 0, max: 20, step: 1, default: 8, noRandom: true },
    { key: 'speed', label: 'Speed', type: 'range', min: 1, max: 8, step: 1, default: 3, noRandom: true },
  ],
  apply(ctx, src, w, h, p) {
    ensure(src, w, h, p)
    sim.setParams({ minGap: p.minGap, maxGap: p.maxGap, contrast: p.contrast, growth: p.growth, cap: p.nodes })
    if (transport.isPlaying()) for (let i = 0; i < Math.round(p.speed); i++) sim.step()
    sim.draw(ctx, w, h, { ink: p.ink, paper: p.paper, width: p.weight * Math.min(w, h) / 900 })
  },
  /* vector export: the paper and the one path, in layer units */
  svg(w, h, p) {
    if (!sim) return ''
    return `<rect width="${w}" height="${h}" fill="${p.paper}"/><path d="${sim.pathD(w, h)}" fill="none" stroke="${p.ink}" stroke-width="${(p.weight * Math.min(w, h) / 900).toFixed(3)}" stroke-linejoin="round"/>`
  },
}
