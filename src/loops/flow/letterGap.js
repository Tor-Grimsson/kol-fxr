import { TAU } from '../lib/util.js'

// Letter gap (E2, after contemporarytype × posterkraft) — a word list where each word holds its
// line while the gaps between its letters breathe; the gap can be decorated. Each gap's width is a
// smooth loop in u (phase per word and per gap) ⇒ seamless. Built as a 2D loop rather than a kinetic
// motion: the kinetic engine lays glyphs on a path and draws no decoration between them (plan 37 § 6.1).
const DECOR = [{ value: 'none', label: 'None' }, { value: 'box', label: 'Box' }, { value: 'rule', label: 'Rule' }, { value: 'tick', label: 'Tick' }, { value: 'dot', label: 'Dot' }]

export default {
  id: 'flow-letter-gap',
  label: 'Letter gap',
  group: 'lettergap',
  kind: '2d',
  duration: 8,
  params: [
    { key: 'bg', label: 'Background', type: 'color', role: 'bg', default: '#ece7dc', section: 'Color' },
    { key: 'ink', label: 'Ink', type: 'color', role: 'fg', default: '#0b0b0e', section: 'Color' },
    { key: 'mark', label: 'Decoration', type: 'color', role: 'accent', default: '#c2502e', section: 'Color' },
    { key: 'text', label: 'Words', type: 'text', rows: 5, default: 'TRUTH\nFORM\nNOISE\nSIGNAL\nTRACE', noRandom: true },
    { key: 'decor', label: 'Gap mark', type: 'select', options: DECOR, default: 'rule' },
    { key: 'size', label: 'Size', type: 'range', min: 0.05, max: 0.3, step: 0.01, default: 0.12 },
    { key: 'gap', label: 'Gap', type: 'range', min: 0, max: 1.5, step: 0.05, default: 0.6 },
    { key: 'breathe', label: 'Breathe', type: 'range', min: 0, max: 1, step: 0.05, default: 0.8 },
    { key: 'cycles', label: 'Cycles', type: 'range', min: 1, max: 4, step: 1, default: 1, noRandom: true },
    { key: 'weight', label: 'Weight', type: 'select', options: [{ value: '400', label: 'Regular' }, { value: '600', label: 'Semibold' }, { value: '800', label: 'Heavy' }], default: '800' },
  ],
  draw(ctx, u, w, h, p) {
    const m = Math.min(w, h)
    const words = String(p.text ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
    const size = p.size * m
    const lead = size * 1.15
    const top = (h - lead * words.length) / 2 + lead / 2
    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)
    ctx.font = `${p.weight} ${size}px "PP Right Grotesk", "Inter", system-ui, sans-serif`
    ctx.textBaseline = 'middle'
    const cyc = Math.max(1, Math.round(p.cycles))
    words.forEach((word, wi) => {
      const letters = [...word]
      const widths = letters.map((ch) => ctx.measureText(ch).width)
      /* gap i (between letter i and i+1): base gap × a breathing factor 0..1, phased per word and gap */
      const gaps = letters.slice(1).map((_, gi) => size * p.gap * (1 - p.breathe + p.breathe * (0.5 + 0.5 * Math.sin(u * TAU * cyc + wi * 1.3 + gi * 0.9))))
      const total = widths.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0)
      let x = (w - total) / 2
      const y = top + wi * lead
      letters.forEach((ch, li) => {
        ctx.fillStyle = p.ink
        ctx.fillText(ch, x, y)
        x += widths[li]
        const g = gaps[li]
        if (g == null || p.decor === 'none' || g < 1) { x += g ?? 0; return }
        ctx.strokeStyle = p.mark
        ctx.fillStyle = p.mark
        ctx.lineWidth = Math.max(1, size * 0.04)
        const pad = g * 0.18
        if (p.decor === 'rule') { ctx.beginPath(); ctx.moveTo(x + pad, y); ctx.lineTo(x + g - pad, y); ctx.stroke() }
        else if (p.decor === 'tick') { ctx.beginPath(); ctx.moveTo(x + g / 2, y - size * 0.3); ctx.lineTo(x + g / 2, y + size * 0.3); ctx.stroke() }
        else if (p.decor === 'dot') { ctx.beginPath(); ctx.arc(x + g / 2, y, Math.min(g * 0.3, size * 0.08), 0, TAU); ctx.fill() }
        else if (p.decor === 'box') ctx.strokeRect(x + pad, y - size * 0.42, Math.max(0, g - pad * 2), size * 0.84)
        x += g
      })
    })
  },
}
