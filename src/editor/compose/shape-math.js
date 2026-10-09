import { pathD } from './path-math'
import { applyVectorFx } from './vectorEffects'

/* Pure geometry helpers for shape layer rendering + export. Used by
 * LayerRenderer.jsx (DOM render) and build.js (SVG export) so the two
 * outputs stay in sync. */

/* Regular n-gon vertices inscribed in {w, h}, first vertex at top (-90°).
 * Returns the SVG `points` attribute string. `inset` shrinks the radius
 * by half-stroke-width so a stroked polygon stays inside the layer bbox. */
export function regularPolygonPoints(w, h, sides, inset = 0) {
  const cx = w / 2
  const cy = h / 2
  const rx = Math.max(0, w / 2 - inset)
  const ry = Math.max(0, h / 2 - inset)
  const n  = Math.max(3, Math.min(12, sides | 0))
  const out = []
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    out.push(`${(cx + rx * Math.cos(a)).toFixed(3)},${(cy + ry * Math.sin(a)).toFixed(3)}`)
  }
  return out.join(' ')
}

/* Star vertices: 2*points alternating outer/inner radii. */
export function starPoints(w, h, points, innerRatio = 0.5, inset = 0) {
  const cx = w / 2
  const cy = h / 2
  const rxOuter = Math.max(0, w / 2 - inset)
  const ryOuter = Math.max(0, h / 2 - inset)
  const ratio   = Math.max(0.1, Math.min(0.95, innerRatio))
  const rxInner = rxOuter * ratio
  const ryInner = ryOuter * ratio
  const n = Math.max(3, Math.min(12, points | 0))
  const total = n * 2
  const out = []
  for (let i = 0; i < total; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n
    const isOuter = i % 2 === 0
    const rx = isOuter ? rxOuter : rxInner
    const ry = isOuter ? ryOuter : ryInner
    out.push(`${(cx + rx * Math.cos(a)).toFixed(3)},${(cy + ry * Math.sin(a)).toFixed(3)}`)
  }
  return out.join(' ')
}

/* Equilateral triangle inscribed in {w, h}, apex at top-center. Returns
 * SVG points attribute string. */
/* `apex` (0–1, default ½) slides the top vertex along the top edge — a right triangle at 0 or 1. */
export function trianglePoints(w, h, inset = 0, apex = 0.5) {
  const ax = inset + (w - inset * 2) * Math.max(0, Math.min(1, apex))
  return `${ax},${inset} ${inset},${h - inset} ${w - inset},${h - inset}`
}

/* Cubic-bezier circle constant (4/3·tan(π/8)) — 4-node ellipse approximation. */
const KAPPA = 0.5523

/* SVG points string → corner path nodes ({x, y, in, out} — path-math format). */
const pointsToNodes = (str) => str.split(' ').map((p) => {
  const [x, y] = p.split(',').map(Number)
  return { x, y, in: null, out: null }
})

/* ROUNDED CORNERS ON EVERY CLOSED KIND (the user's 21 — a triangle offered Kind only). Each corner
 * of a closed polygon is cut `r` back along both edges (never past half an edge) and the cut is a
 * cubic whose handles reach KAPPA of the way to the old vertex — a circular-ish fillet. r ≤ 0
 * returns the nodes untouched, so every kind renders as before until a radius is set. */
export function roundCorners(nodes, r) {
  /* `r` is one radius for every corner, or an array — one per corner in node order (G2) */
  const at = (i) => (Array.isArray(r) ? (r[i] ?? 0) : r)
  if (nodes.length < 3 || !nodes.some((_, i) => at(i) > 0)) return nodes
  const out = []
  const n = nodes.length
  for (let i = 0; i < n; i++) {
    const p = nodes[i], a = nodes[(i - 1 + n) % n], b = nodes[(i + 1) % n]
    const la = Math.hypot(a.x - p.x, a.y - p.y), lb = Math.hypot(b.x - p.x, b.y - p.y)
    const t = Math.min(at(i), la / 2, lb / 2)
    if (!(t > 0)) { out.push(p); continue }
    const p1 = { x: p.x + ((a.x - p.x) / la) * t, y: p.y + ((a.y - p.y) / la) * t }
    const p2 = { x: p.x + ((b.x - p.x) / lb) * t, y: p.y + ((b.y - p.y) / lb) * t }
    out.push({ ...p1, in: null, out: { x: p1.x + (p.x - p1.x) * KAPPA, y: p1.y + (p.y - p1.y) * KAPPA } })
    out.push({ ...p2, in: { x: p2.x + (p.x - p2.x) * KAPPA, y: p2.y + (p.y - p2.y) * KAPPA }, out: null })
  }
  return out
}

/* An ellipse ARC as a closed pie (centre + arc), `start`/`end` in degrees clockwise from 3 o'clock
 * (Figma's arc). Cubic segments of ≤ 90°. */
function arcNodes(cx, cy, rx, ry, start, end) {
  let sweep = ((end - start) % 360 + 360) % 360
  if (sweep === 0) sweep = 360
  const a0 = (start * Math.PI) / 180
  const segs = Math.max(1, Math.ceil(sweep / 90))
  const step = ((sweep / segs) * Math.PI) / 180
  const k = (4 / 3) * Math.tan(step / 4)
  const pt = (a) => ({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) })
  const tan = (a) => ({ x: -rx * Math.sin(a), y: ry * Math.cos(a) })
  const nodes = [{ x: cx, y: cy, in: null, out: null }]
  for (let i = 0; i <= segs; i++) {
    const a = a0 + i * step
    const p = pt(a), d = tan(a)
    nodes.push({
      ...p,
      in: i > 0 ? { x: p.x - d.x * k, y: p.y - d.y * k } : null,
      out: i < segs ? { x: p.x + d.x * k, y: p.y + d.y * k } : null,
    })
  }
  return nodes
}

/* is this ellipse a partial arc (a pie) rather than the whole ring? */
export const isArc = (layer) => {
  const s = layer.arcStart ?? 0, e = layer.arcEnd ?? 360
  return (((e - s) % 360) + 360) % 360 !== 0
}

/* Convert a primitive shape layer's geometry to bezier path nodes
 * (layer-local coords, path-math node format). Reproduces the painted
 * geometry exactly — including the half-stroke inset the shape renderers
 * apply, so a stroked shape keeps its stroke centerline after conversion.
 * Returns { nodes, closed } or null for kinds with no primitive outline
 * (logo / flatten). */
export function shapeToPathNodes(layer) {
  const w = Math.max(1, layer.w ?? 0)
  const h = Math.max(1, layer.h ?? 0)
  const sw = layer.strokeWidth ?? (layer.kind === 'line' ? 2 : 0)
  const half = sw > 0 ? sw / 2 : 0
  switch (layer.kind) {
    case 'rect': {
      const x0 = half, y0 = half, x1 = w - half, y1 = h - half
      /* the corner radius survives the conversion (it used to drop — the user's 21) */
      return { closed: true, nodes: roundCorners([
        { x: x0, y: y0, in: null, out: null },
        { x: x1, y: y0, in: null, out: null },
        { x: x1, y: y1, in: null, out: null },
        { x: x0, y: y1, in: null, out: null },
      ], cornerRadii(layer)) }
    }
    case 'ellipse': {
      const cx = w / 2, cy = h / 2
      const rx = Math.max(0, w / 2 - half)
      const ry = Math.max(0, h / 2 - half)
      if (isArc(layer)) return { closed: true, nodes: arcNodes(cx, cy, rx, ry, layer.arcStart ?? 0, layer.arcEnd ?? 360) }
      const kx = rx * KAPPA, ky = ry * KAPPA
      return { closed: true, nodes: [
        { x: cx,      y: cy - ry, in: { x: cx - kx, y: cy - ry }, out: { x: cx + kx, y: cy - ry } },
        { x: cx + rx, y: cy,      in: { x: cx + rx, y: cy - ky }, out: { x: cx + rx, y: cy + ky } },
        { x: cx,      y: cy + ry, in: { x: cx + kx, y: cy + ry }, out: { x: cx - kx, y: cy + ry } },
        { x: cx - rx, y: cy,      in: { x: cx - rx, y: cy + ky }, out: { x: cx - rx, y: cy - ky } },
      ] }
    }
    case 'triangle': return { closed: true, nodes: roundCorners(pointsToNodes(trianglePoints(w, h, half, layer.apex ?? 0.5)), layer.radius ?? 0) }
    case 'polygon':  return { closed: true, nodes: roundCorners(pointsToNodes(regularPolygonPoints(w, h, layer.sides ?? 5, half)), layer.radius ?? 0) }
    case 'star':     return { closed: true, nodes: roundCorners(pointsToNodes(starPoints(w, h, layer.points ?? 5, layer.innerRatio ?? 0.5, half)), layer.radius ?? 0) }
    /* Line — 2-node open path along the bbox diagonal picked by `slope`
     * (endpoint math mirrors the line branches in LayerRenderer/build.js). */
    case 'line': {
      const nodes = (layer.slope ?? '\\') === '/'
        ? [{ x: half, y: h - half, in: null, out: null }, { x: w - half, y: half,     in: null, out: null }]
        : [{ x: half, y: half,     in: null, out: null }, { x: w - half, y: h - half, in: null, out: null }]
      return { closed: false, nodes }
    }
    default: return null
  }
}

/* The outline of a closed primitive as an SVG `d` — the ONE geometry the renderer, the SVG export
 * and the booleans draw from for triangle · polygon · star (and an ellipse arc), so a radius, an
 * apex or an arc reads the same in all three. */
export function shapeOutlineD(layer) {
  const geo = shapeToPathNodes(layer)
  return geo ? pathD(applyVectorFx(layer, geo.nodes, geo.closed), geo.closed) : ''
}

/* A rect's corners: [TL, TR, BR, BL] when unlinked (`radii`), else the one `radius`. */
export const cornerRadii = (layer) => (Array.isArray(layer.radii) ? layer.radii : (layer.radius ?? 0))

/* does this primitive draw from the outline path rather than its SVG element? */
export const drawsAsOutline = (layer) => !!(layer.distressOn || layer.zigzagOn || layer.offsetOn || layer.smoothOn || layer.puckerOn || layer.twistOn || layer.warpOn) || (layer.kind === 'ellipse' && isArc(layer)) || (layer.kind === 'rect' && Array.isArray(layer.radii))
