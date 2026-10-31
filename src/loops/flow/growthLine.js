import { mulberry32 } from '../gl/rng.js'
import { transport } from '../../editor/params/transport.js'
import { Growth, densityFrom, SIM_W, waveAt, playedClock } from '../growth/engine.js'

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
  { value: 'logo', label: 'FXR mark' },
  { value: 'svg', label: 'SVG' },
]

/* A VECTOR SOURCE (user 2026-10-30: the line takes vectors, not only images) — the FXR mark or pasted SVG code, drawn
 * solid black on white at the frame's aspect, whatever colours it carries (the favicon inks itself white in dark mode).
 * Async, so the generator draws paper until it lands. `code` null = the mark. */
let markCode = null
export async function vectorCanvas(code, aspect, fit = 0.8) {
  if (code == null) code = markCode ??= await fetch('/favicon/favicon.svg').then((r) => r.text())
  let src = String(code).trim()
  if (!src.includes('<svg')) throw new Error('not svg')
  if (!/<svg[^>]*xmlns=/.test(src)) src = src.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
  const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }))
  try {
    /* onload, not decode(): decode() rejects an SVG now and then on a cold load, and the stage never started */
    const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url })
    const W = 400, H = Math.max(1, Math.round(W / aspect))
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const g = c.getContext('2d')
    const iw = img.width || 100, ih = img.height || 100, k = Math.min(W / iw, H / ih) * fit
    g.drawImage(img, (W - iw * k) / 2, (H - ih * k) / 2, iw * k, ih * k)
    g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, W, H)
    g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H)
    return c
  } finally { URL.revokeObjectURL(url) }
}

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
const vec = { key: '', canvas: null }
let ptrSm = null

/* the vector source for these params, or null while it loads (or failed) */
const vectorFor = (p, aspect) => {
  const key = `${p.source}|${p.source === 'svg' ? p.svg : ''}|${aspect.toFixed(3)}`
  if (vec.key !== key) {
    vec.key = key; vec.canvas = null
    vectorCanvas(p.source === 'svg' ? p.svg ?? '' : null, aspect).then((c) => { if (vec.key === key) vec.canvas = c }).catch(() => {})
  }
  return vec.canvas
}

/* the stage pointer in sim units through the layer's box (penrose/host.js's mapping, low-passed the same), null off-layer */
const pointerIn = (p) => {
  const st = transport.getCtx().stage
  if (!st || !p.w || !p.h) return (ptrSm = null)
  const fx = (st.x - (p.x ?? 0)) / p.w, fy = (st.y - (p.y ?? 0)) / p.h
  if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return (ptrSm = null)
  const x = fx * sim.w, y = fy * sim.h
  if (!ptrSm) ptrSm = { x, y }
  ptrSm.x += (x - ptrSm.x) * 0.1; ptrSm.y += (y - ptrSm.y) * 0.1
  return { x: ptrSm.x, y: ptrSm.y, down: !!st.down }
}

const waveClock = playedClock()

export default {
  id: 'flow-growth',
  label: 'Growing line',
  group: 'flow',
  kind: '2d',
  duration: 12, // nominal — the growth free-runs; u only paces the transport
  /* INPUTS' shortlist (plan 48): the params an input drives best — how fast it grows, how heavy, how hard the light/dark split */
  inputs: ['growth', 'weight', 'contrast'],
  params: [
    { key: 'paper', label: 'Background', type: 'color', role: 'bg', default: '#f4f1ea', section: 'Color' },
    { key: 'ink', label: 'Line color', type: 'color', role: 'fg', default: '#141414', section: 'Color' },
    { key: 'source', label: 'Image', type: 'select', options: GROWTH_SOURCES, default: 'type', noRandom: true },
    { key: 'text', label: 'Text', type: 'text', rows: 1, default: 'FXR', noRandom: true, when: (l) => (l.source ?? 'type') === 'type' },
    { key: 'svg', label: 'SVG code', type: 'text', rows: 4, placeholder: '<svg viewBox="0 0 24 24"><path d="…"/></svg>', default: '', noRandom: true, when: (l) => l.source === 'svg' },
    { key: 'variant', label: 'Variation', type: 'range', min: 1, max: 99, step: 1, default: 1, noRandom: true },
    { key: 'minGap', label: 'Dark spacing', type: 'range', min: 2, max: 14, step: 0.5, default: 6, rMin: 4.5, rMax: 8 },
    { key: 'maxGap', label: 'Light spacing', type: 'range', min: 8, max: 60, step: 1, default: 20, rMin: 14, rMax: 32 },
    { key: 'contrast', label: 'Contrast', type: 'range', min: 0.5, max: 3, step: 0.1, default: 1.4, rMin: 1, rMax: 2 },
    { key: 'weight', label: 'Weight', type: 'range', min: 0.5, max: 4, step: 0.1, default: 1.2, rMin: 0.8, rMax: 2 },
    { key: 'nodes', label: 'Length', type: 'range', min: 1000, max: 12000, step: 500, default: 7000, noRandom: true },
    { key: 'growth', label: 'Growth', type: 'range', min: 0, max: 20, step: 1, default: 6, noRandom: true, tab: 'anim', section: 'Motion' },
    { key: 'speed', label: 'Speed', type: 'range', min: 1, max: 8, step: 1, default: 2, noRandom: true, tab: 'anim', section: 'Motion' },
    /* the slow wave Home's line has (plan 45 4.3) — the drawn line drifts, the sim stays still */
    { key: 'wave', label: 'Wave', type: 'toggle', default: true, noRandom: true, tab: 'anim', section: 'Motion' },
    /* the pointer while it plays: a move pushes the line aside, a press blasts a crater it regrows into */
    { key: 'mouse', label: 'Mouse', type: 'toggle', default: true, noRandom: true, section: 'Interaction' },
    { key: 'click', label: 'Click', type: 'toggle', default: true, noRandom: true, section: 'Interaction' },
    { key: 'interact', label: 'Strength', type: 'range', min: 0, max: 3, step: 0.1, default: 1, noRandom: true, section: 'Interaction', when: (l) => l.mouse !== false || l.click !== false },
  ],
  draw(ctx, u, w, h, p) {
    const aspect = w / h
    const vector = p.source === 'logo' || p.source === 'svg'
    const shape = vector ? vectorFor(p, aspect) : sourceCanvas(p.source, p.text, aspect)
    if (!shape) { ctx.fillStyle = p.paper; ctx.fillRect(0, 0, w, h); return }
    const key = `${p.source}|${p.text}|${vector ? vec.key : ''}|${p.variant}|${aspect.toFixed(3)}|${transport.getEpoch()}`
    if (!sim || simKey !== key) {
      sim = new Growth({ w: SIM_W, h: SIM_W / aspect, density: densityFrom(shape), rand: mulberry32((p.variant ?? 1) >>> 0) })
      sim.seed()
      simKey = key
      if (import.meta.env?.DEV) globalThis.__fxrGrowth = sim /* dev only: read `hot` · `full` from the console */
    }
    /* THE LINE SETTLES (plan 45 W1, Home's engine since 2026-10-31): a node goes still as its heat fades, so a grown line
       rests instead of jittering at the edges; the pointer warms what it touches and that settles again */
    sim.setParams({ minGap: p.minGap, maxGap: p.maxGap, contrast: p.contrast, growth: p.growth, cap: p.nodes, settle: 60 })
    const playing = transport.isPlaying()
    if (playing) {
      const ptr = pointerIn(p)
      if (ptr && (ptr.down ? p.click !== false : p.mouse !== false)) sim.poke(ptr.x, ptr.y, ptr.down, p.interact ?? 1)
      if (!sim.full || sim.hot > 0) for (let i = 0; i < Math.round(p.speed); i++) sim.step()
    }
    const t = waveClock(playing)
    sim.draw(ctx, w, h, { ink: p.ink, paper: p.paper, width: p.weight * Math.min(w, h) / 900, wave: p.wave !== false ? waveAt(t) : null })
  },
  /* vector export (build.js): the paper and the one path, in layer units */
  svg(w, h, p) {
    if (!sim) return ''
    return `<rect width="${w}" height="${h}" fill="${p.paper}"/><path d="${sim.pathD(w, h)}" fill="none" stroke="${p.ink}" stroke-width="${(p.weight * Math.min(w, h) / 900).toFixed(3)}" stroke-linejoin="round"/>`
  },
}
