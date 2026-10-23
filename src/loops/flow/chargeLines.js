import { TAU, mixHex } from '../lib/util.js'
import { charge, streamline, strokeLine, arrowAt, orbitAt } from './fieldCore.js'

// Charge lines (E5, after s_n_k_ *Connected Fields – Streamlines 01*) — ± point charges summed,
// field lines traced from each + charge until they reach a − charge or leave the frame, arrowheads
// along them. MAPPING: colour ← cluster — every line takes its source charge's colour, the
// palette's colours in turn. Charges ride closed paths in u ⇒ seamless.
export default {
  id: 'flow-charges',
  label: 'Charge lines',
  group: 'flow',
  kind: '2d',
  duration: 14,
  params: [
    { key: 'bg', label: 'Background', type: 'color', role: 'bg', default: '#08080b', section: 'Color' },
    { key: 'c1', label: 'Cluster 1', type: 'color', role: 'accent', default: '#ffcf33', section: 'Color' },
    { key: 'c2', label: 'Cluster 2', type: 'color', role: 'fg', default: '#ece7dc', section: 'Color' },
    { key: 'c3', label: 'Cluster 3', type: 'color', role: 'warm', default: '#e3a054', section: 'Color' },
    { key: 'c4', label: 'Cluster 4', type: 'color', role: 'dim', default: '#3f6485', section: 'Color' },
    { key: 'positive', label: 'Positive', type: 'range', min: 1, max: 4, step: 1, default: 3, noRandom: true },
    { key: 'negative', label: 'Negative', type: 'range', min: 1, max: 4, step: 1, default: 3, noRandom: true },
    { key: 'perCharge', label: 'Lines per charge', type: 'range', min: 6, max: 48, step: 1, default: 20 },
    { key: 'arrows', label: 'Arrows', type: 'range', min: 0, max: 3, step: 1, default: 1 },
    { key: 'drift', label: 'Drift', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.14 },
    { key: 'weight', label: 'Weight', type: 'range', min: 0.25, max: 3, step: 0.25, default: 1 },
  ],
  draw(ctx, u, w, h, p) {
    const m = Math.min(w, h)
    const np = Math.round(p.positive), nn = Math.round(p.negative)
    const place = (i, n, row, ph) => orbitAt(u, w * (i + 0.5) / n, h * row, p.drift * w * 0.4, p.drift * h, 1, 1, ph + i * 1.9)
    const pos = Array.from({ length: np }, (_, i) => place(i, np, 0.32, 0))
    const neg = Array.from({ length: nn }, (_, i) => place(i, nn, 0.68, 3.1))
    const field = [...pos.map(([x, y]) => charge(x, y, 1, m * 0.01)), ...neg.map(([x, y]) => charge(x, y, -1, m * 0.01))]
    const near = m * 0.012
    const atSink = (x, y) => neg.some(([nx, ny]) => (x - nx) ** 2 + (y - ny) ** 2 < near * near)
    const colors = [p.c1, p.c2, p.c3, p.c4]

    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)
    ctx.lineWidth = p.weight * m / 900
    const k = Math.round(p.perCharge)
    pos.forEach(([x, y], ci) => {
      const col = colors[ci % colors.length]
      ctx.strokeStyle = col
      ctx.fillStyle = col
      for (let j = 0; j < k; j++) {
        const a = (j / k) * TAU
        const line = streamline(field, x + Math.cos(a) * near, y + Math.sin(a) * near, { step: m / 260, maxSteps: 900, w, h, stop: atSink })
        strokeLine(ctx, line)
        for (let q = 1; q <= Math.round(p.arrows); q++) arrowAt(ctx, line, q / (Math.round(p.arrows) + 1), m * 0.006)
      }
    })
    /* the charges themselves: + filled, − ringed */
    pos.forEach(([x, y], ci) => { ctx.fillStyle = colors[ci % colors.length]; ctx.beginPath(); ctx.arc(x, y, near * 0.6, 0, TAU); ctx.fill() })
    ctx.strokeStyle = mixHex(p.bg, colors[1], 0.7)
    for (const [x, y] of neg) { ctx.beginPath(); ctx.arc(x, y, near * 0.6, 0, TAU); ctx.stroke() }
  },
}
