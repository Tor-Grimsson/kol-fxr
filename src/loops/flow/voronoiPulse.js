import { Delaunay } from 'd3-delaunay'
import { TAU, mixHex } from '../lib/util.js'
import { mulberry32 } from '../gl/rng.js'

// Voronoi pulse (E1, after polyhop *Linked Pulse II*) — Voronoi cells from drifting seeds, cells
// inset with rounded corners, a proximity graph over the points. MAPPING: stroke weight and colour
// ← cell area (small cells hot, large cells cool). Seeds ride closed loops in u ⇒ seamless.

/* a polygon shrunk toward its centroid, drawn with rounded corners (quadratic through each vertex) */
function roundedInset(ctx, poly, inset, radius) {
  const n = poly.length - 1 /* d3 closes the ring: last = first */
  if (n < 3) return 0
  let cx = 0, cy = 0, area = 0
  for (let i = 0; i < n; i++) {
    const [x0, y0] = poly[i], [x1, y1] = poly[i + 1]
    const c = x0 * y1 - x1 * y0
    area += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
  }
  area /= 2
  if (Math.abs(area) < 1e-6) return 0
  cx /= 6 * area; cy /= 6 * area
  const pts = poly.slice(0, n).map(([x, y]) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1
    const k = Math.max(0, d - inset) / d
    return [cx + dx * k, cy + dy * k]
  })
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n]
    const a = Math.min(radius, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 2)
    const b = Math.min(radius, Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2)
    const ua = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, ub = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1
    const s = [p1[0] - (p1[0] - p0[0]) * a / ua, p1[1] - (p1[1] - p0[1]) * a / ua]
    const e = [p1[0] + (p2[0] - p1[0]) * b / ub, p1[1] + (p2[1] - p1[1]) * b / ub]
    if (i === 0) ctx.moveTo(s[0], s[1]); else ctx.lineTo(s[0], s[1])
    ctx.quadraticCurveTo(p1[0], p1[1], e[0], e[1])
  }
  ctx.closePath()
  return Math.abs(area)
}

export default {
  id: 'flow-voronoi',
  label: 'Voronoi pulse',
  group: 'flow',
  kind: '2d',
  duration: 12,
  params: [
    { key: 'bg', label: 'Background', type: 'color', role: 'bg', default: '#060608', section: 'Color' },
    { key: 'cool', label: 'Large cells', type: 'color', role: 'dim', default: '#3f6485', section: 'Color' },
    { key: 'hot', label: 'Small cells', type: 'color', role: 'accent', default: '#ffcf33', section: 'Color' },
    { key: 'graph', label: 'Graph', type: 'color', role: 'warm', default: '#7bd389', section: 'Color' },
    { key: 'points', label: 'Points', type: 'range', min: 8, max: 160, step: 1, default: 48 },
    { key: 'inset', label: 'Inset', type: 'range', min: 0, max: 0.04, step: 0.002, default: 0.012 },
    { key: 'round', label: 'Corner radius', type: 'range', min: 0, max: 0.06, step: 0.002, default: 0.02 },
    { key: 'glow', label: 'Glow', type: 'range', min: 0, max: 1, step: 0.05, default: 0.6 },
    { key: 'reach', label: 'Graph reach', type: 'range', min: 0, max: 0.4, step: 0.01, default: 0.16 },
    { key: 'drift', label: 'Drift', type: 'range', min: 0, max: 0.12, step: 0.005, default: 0.05 },
    { key: 'seed', label: 'Seed', type: 'range', min: 1, max: 999, step: 1, default: 3 },
  ],
  draw(ctx, u, w, h, p) {
    const m = Math.min(w, h)
    const rng = mulberry32(Math.round(p.seed))
    const n = Math.round(p.points)
    const pts = Array.from({ length: n }, () => {
      const x0 = rng() * w, y0 = rng() * h, ph = rng() * TAU, f = 1 + Math.floor(rng() * 2)
      return [x0 + Math.cos(u * TAU * f + ph) * p.drift * m, y0 + Math.sin(u * TAU * f + ph * 1.3) * p.drift * m]
    })
    const vor = Delaunay.from(pts).voronoi([0, 0, w, h])

    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)
    /* the proximity graph first, under the cells */
    const reach = p.reach * m
    if (reach > 0) {
      ctx.lineWidth = m / 1400
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])
        if (d > reach) continue
        ctx.globalAlpha = 1 - d / reach
        ctx.strokeStyle = p.graph
        ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    const mean = (w * h) / n
    for (let i = 0; i < n; i++) {
      const poly = vor.cellPolygon(i)
      if (!poly) continue
      const area = roundedInset(ctx, poly, p.inset * m, p.round * m)
      const k = Math.max(0, Math.min(1, 1 - area / (mean * 2))) /* small cell → 1 */
      const col = mixHex(p.cool, p.hot, k)
      ctx.strokeStyle = col
      ctx.lineWidth = (0.6 + 2.4 * k) * m / 900
      ctx.shadowColor = col
      ctx.shadowBlur = p.glow * m * 0.02 * k
      ctx.stroke()
    }
    ctx.shadowBlur = 0
  },
}
