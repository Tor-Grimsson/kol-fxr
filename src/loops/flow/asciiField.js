import { createNoise4D } from 'simplex-noise'
import { TAU, mixHex } from '../lib/util.js'
import { mulberry32 } from '../gl/rng.js'
import { CHARSETS, rampChar } from '../../filters/fxAscii.js'

// ASCII field (plan 41 § 7.8/7.9) — generative ASCII without media: a scalar field per grid cell
// picks a character from one of ASCII's density ramps; colour ramps ink → accent by the same value.
// Every time term runs integer cycles of u (noise walks a circle in its 3rd/4th dims) ⇒ seamless.
// Draws from a glyph atlas like fxAscii (fillText per cell was a fifth of that frame): one sprite
// per (char, colour band), stamped with drawImage.

const FIELDS = [
  { value: 'noise', label: 'Noise' },
  { value: 'plasma', label: 'Plasma' },
  { value: 'rings', label: 'Rings' },
  { value: 'waves', label: 'Waves' },
  { value: 'vortex', label: 'Vortex' },
]
const BANDS = 8 /* colour steps — keeps the atlas small */

const noiseBySeed = new Map()
const noiseFor = (seed) => {
  if (!noiseBySeed.has(seed)) noiseBySeed.set(seed, createNoise4D(mulberry32(seed)))
  return noiseBySeed.get(seed)
}

/* field value 0..1 at centred, min-side-normalised (x, y); t = u·TAU·cycles */
function fieldAt(kind, x, y, t, s, n4) {
  switch (kind) {
    case 'plasma':
      return (Math.sin(x * s * 6 + t) + Math.sin(y * s * 6 - t) + Math.sin((x + y) * s * 4 + t)
        + Math.sin(Math.hypot(x, y) * s * 10 - t)) / 8 + 0.5
    case 'rings':
      return 0.5 + 0.5 * Math.sin(Math.hypot(x, y) * s * 14 - t)
    case 'waves':
      return 0.5 + 0.5 * Math.sin(y * s * 10 + 1.5 * Math.sin(x * s * 5 + t) - t)
    case 'vortex': {
      const r = Math.hypot(x, y)
      return 0.5 + 0.5 * Math.sin(Math.atan2(y, x) * 3 + r * s * 12 - t)
    }
    default:
      return 0.5 + 0.5 * n4(x * s * 2, y * s * 2, Math.cos(t) * 0.8, Math.sin(t) * 0.8)
  }
}

let atlasKey = ''
const atlas = new Map()
/* sprites are drawn at the context's backing scale (dpr) so glyphs stay crisp */
function spriteFor(ch, fontPx, font, color, k) {
  if (font + k !== atlasKey) { atlas.clear(); atlasKey = font + k }
  const key = ch + color
  let sp = atlas.get(key)
  if (!sp) {
    const S = Math.ceil(fontPx * 2) + 2
    sp = document.createElement('canvas')
    sp.width = Math.ceil(S * k)
    sp.height = Math.ceil(S * k)
    sp.css = S
    const g = sp.getContext('2d')
    g.scale(k, k)
    g.font = font
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = color
    g.fillText(ch, S / 2, S / 2)
    atlas.set(key, sp)
  }
  return sp
}

export default {
  id: 'flow-ascii',
  label: 'ASCII field',
  group: 'flow',
  kind: '2d',
  duration: 12,
  params: [
    { key: 'field', noRandom: true, label: 'Field', type: 'select', options: FIELDS, default: 'noise' },
    { key: 'charset', noRandom: true, label: 'Charset', type: 'select', options: CHARSETS.map(({ value, label }) => ({ value, label })), default: 'classic' },
    { key: 'cols', label: 'Columns', type: 'range', min: 16, max: 160, step: 1, default: 80, noRandom: true },
    { key: 'glyphScale', label: 'Glyph scale', type: 'range', min: 0.5, max: 2, step: 0.05, default: 1 },
    { key: 'contrast', label: 'Contrast', type: 'range', min: 0.2, max: 3, step: 0.05, default: 1.2 },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false },
    { key: 'scale', label: 'Scale', type: 'range', min: 0.2, max: 4, step: 0.05, default: 1 },
    { key: 'speed', label: 'Speed', type: 'range', min: 1, max: 6, step: 1, default: 1 },
    { key: 'seed', noRandom: true, label: 'Seed', type: 'range', min: 1, max: 999, step: 1, default: 7, when: (l) => (l.field ?? 'noise') === 'noise' },
    { key: 'bg', collapsed: true, label: 'Background', type: 'color', role: 'bg', default: '#06070b', section: 'Color' },
    { key: 'ink', label: 'Ink', type: 'color', role: 'fg', default: '#f4f1ea', section: 'Color' },
    { key: 'accent', label: 'Accent', type: 'color', role: 'accent', default: '#ffcf33', section: 'Color' },
    { key: 'accentMix', label: 'Accent ramp', type: 'range', min: 0, max: 1, step: 0.05, default: 0.6 },   /* not in 'Color': colours already form the Color roll scope, a range there made a second "Color" button */
  ],
  draw(ctx, u, w, h, p) {
    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)
    const cols = Math.round(p.cols)
    const cell = w / cols
    const cellH = cell / 0.6 /* monospace advance ≈ 0.6em: tall cells so glyphs pack edge to edge */
    const rows = Math.ceil(h / cellH)
    const m = Math.min(w, h)
    const t = u * TAU * Math.round(p.speed)
    const n4 = noiseFor(Math.round(p.seed))
    const ramp = (CHARSETS.find((c) => c.value === p.charset) ?? CHARSETS[0]).ramp
    const fontPx = Math.max(4, cellH * p.glyphScale)
    const font = `${fontPx}px ui-monospace, monospace`
    const k = Math.max(1, Math.abs(ctx.getTransform().a))
    const colors = Array.from({ length: BANDS }, (_, i) => mixHex(p.ink, p.accent, (i / (BANDS - 1)) * p.accentMix))

    for (let j = 0; j < rows; j++) {
      const cy = (j + 0.5) * cellH
      for (let i = 0; i < cols; i++) {
        const cx = (i + 0.5) * cell
        let v = fieldAt(p.field, (cx - w / 2) / m, (cy - h / 2) / m, t, p.scale, n4)
        v = Math.max(0, Math.min(0.999, 0.5 + (v - 0.5) * p.contrast))
        if (p.invert) v = 0.999 - v
        const ch = rampChar(ramp, v)
        if (ch === ' ') continue
        const sp = spriteFor(ch, fontPx, font, colors[Math.floor(v * BANDS)], k)
        const half = sp.css / 2
        ctx.drawImage(sp, cx - half, cy - half, sp.css, sp.css)
      }
    }
  },
}
