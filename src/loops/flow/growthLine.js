import { mulberry32 } from '../gl/rng.js'
import { transport } from '../../editor/params/transport.js'
import { Growth, densityFrom, SIM_W } from '../growth/engine.js'

// Growing line (plan 43 § 4.1) — one closed line grows from a blob and fills a built-in image, tighter where it is
// darker (growth/engine.js). The image is drawn here, so it is seen with no upload (user 2026-10-28: *"you shouldnt
// have to upload an image to view the effect"*); the same engine takes a photo as Effects › Growing line.
//
// ⚠ NON-SCRUBBING, like Reaction diffusion: the frame is the growth's history, not a function of u. The sim advances
// `speed` steps per draw while it plays; Image, Text, Variation, the frame's aspect or a transport stop/rewind restart it.

export const GROWTH_SOURCES = [
  { value: 'type', label: 'Type' },
  { value: 'orb', label: 'Orb' },
  { value: 'split', label: 'Split' },
  { value: 'rings', label: 'Rings' },
]

/* the built-in image, drawn dark on light into a canvas at the frame's aspect */
export function sourceCanvas(kind, text, aspect) {
  const W = 400, H = Math.max(1, Math.round(W / aspect))
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H)
  if (kind === 'orb') {
    const r = Math.min(W, H) * 0.46
    const grd = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, r)
    grd.addColorStop(0, '#000'); grd.addColorStop(1, '#fff')
    g.fillStyle = grd; g.fillRect(0, 0, W, H)
  } else if (kind === 'split') {
    const grd = g.createLinearGradient(0, 0, W, 0)
    grd.addColorStop(0, '#000'); grd.addColorStop(1, '#fff')
    g.fillStyle = grd; g.fillRect(0, 0, W, H)
  } else if (kind === 'rings') {
    for (let i = 7; i > 0; i--) { g.fillStyle = i % 2 ? '#222' : '#ddd'; g.beginPath(); g.arc(W / 2, H / 2, (i / 7) * Math.min(W, H) * 0.48, 0, Math.PI * 2); g.fill() }
  } else {
    const t = (text || 'FXR').slice(0, 12)
    g.fillStyle = '#000'
    g.textAlign = 'center'; g.textBaseline = 'middle'
    let size = H * 0.8
    g.font = `900 ${size}px "Right Grotesk", "Helvetica Neue", Arial, sans-serif`
    const fit = (W * 0.9) / Math.max(1, g.measureText(t).width)
    if (fit < 1) { size *= fit; g.font = `900 ${size}px "Right Grotesk", "Helvetica Neue", Arial, sans-serif` }
    g.fillText(t, W / 2, H / 2)
  }
  return c
}

let sim = null
let simKey = ''

export default {
  id: 'flow-growth',
  label: 'Growing line',
  group: 'flow',
  kind: '2d',
  duration: 12, // nominal — the growth free-runs; u only paces the transport
  params: [
    { key: 'paper', label: 'Background', type: 'color', role: 'bg', default: '#f4f1ea', section: 'Color' },
    { key: 'ink', label: 'Line color', type: 'color', role: 'fg', default: '#141414', section: 'Color' },
    { key: 'source', label: 'Image', type: 'select', options: GROWTH_SOURCES, default: 'type', noRandom: true },
    { key: 'text', label: 'Text', type: 'text', rows: 1, default: 'FXR', noRandom: true, when: (l) => (l.source ?? 'type') === 'type' },
    { key: 'variant', label: 'Variation', type: 'range', min: 1, max: 99, step: 1, default: 1, noRandom: true },
    { key: 'minGap', label: 'Dark spacing', type: 'range', min: 2, max: 14, step: 0.5, default: 6, rMin: 4.5, rMax: 8 },
    { key: 'maxGap', label: 'Light spacing', type: 'range', min: 8, max: 60, step: 1, default: 20, rMin: 14, rMax: 32 },
    { key: 'contrast', label: 'Contrast', type: 'range', min: 0.5, max: 3, step: 0.1, default: 1.4, rMin: 1, rMax: 2 },
    { key: 'weight', label: 'Weight', type: 'range', min: 0.5, max: 4, step: 0.1, default: 1.2, rMin: 0.8, rMax: 2 },
    { key: 'nodes', label: 'Length', type: 'range', min: 1000, max: 12000, step: 500, default: 7000, noRandom: true },
    { key: 'growth', label: 'Growth', type: 'range', min: 0, max: 20, step: 1, default: 6, noRandom: true, tab: 'anim', section: 'Motion' },
    { key: 'speed', label: 'Speed', type: 'range', min: 1, max: 8, step: 1, default: 2, noRandom: true, tab: 'anim', section: 'Motion' },
  ],
  draw(ctx, u, w, h, p) {
    const aspect = w / h
    const key = `${p.source}|${p.text}|${p.variant}|${aspect.toFixed(3)}|${transport.getEpoch()}`
    if (!sim || simKey !== key) {
      sim = new Growth({ w: SIM_W, h: SIM_W / aspect, density: densityFrom(sourceCanvas(p.source, p.text, aspect)), rand: mulberry32((p.variant ?? 1) >>> 0) })
      sim.seed()
      simKey = key
    }
    sim.setParams({ minGap: p.minGap, maxGap: p.maxGap, contrast: p.contrast, growth: p.growth, cap: p.nodes })
    if (transport.isPlaying()) for (let i = 0; i < Math.round(p.speed); i++) sim.step()
    sim.draw(ctx, w, h, { ink: p.ink, paper: p.paper, width: p.weight * Math.min(w, h) / 900 })
  },
  /* vector export (build.js): the paper and the one path, in layer units */
  svg(w, h, p) {
    if (!sim) return ''
    return `<rect width="${w}" height="${h}" fill="${p.paper}"/><path d="${sim.pathD(w, h)}" fill="none" stroke="${p.ink}" stroke-width="${(p.weight * Math.min(w, h) / 900).toFixed(3)}" stroke-linejoin="round"/>`
  },
}
