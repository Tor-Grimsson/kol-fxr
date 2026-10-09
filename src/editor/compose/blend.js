import { colord } from 'colord'
import { shapeToPathNodes } from './shape-math'
import { normalizePath, shiftNode } from './path-math'
import { blendOutlines, catmullNodes } from './vectorEffects'
import { resolveColor } from './state'

/* two colors mixed in RGB at t */
const lerpHex = (a, b, t) => {
  const p = colord(a).toRgb(), q = colord(b).toRgb()
  const m = (x, y) => Math.round(x + (y - x) * t)
  return colord({ r: m(p.r, q.r), g: m(p.g, q.g), b: m(p.b, q.b), a: p.a + (q.a - p.a) * t }).toHex()
}

/* A layer's outline in CANVAS coords, or null for a layer with no outline (Blend's inputs). */
function outlineOf(layer) {
  if (layer.type === 'path' && Array.isArray(layer.nodes)) {
    return { nodes: layer.nodes.map((n) => shiftNode(n, layer.x ?? 0, layer.y ?? 0)), closed: !!layer.closed }
  }
  if (layer.type === 'shape') {
    const geo = shapeToPathNodes({ ...layer, strokeWidth: 0 })
    return geo ? { nodes: geo.nodes.map((n) => shiftNode(n, layer.x ?? 0, layer.y ?? 0)), closed: geo.closed } : null
  }
  return null
}

export const canBlend = (a, b) => !!(a && b && outlineOf(a) && outlineOf(b))

/* BLEND two layers (the user's 23 — Illustrator's Object › Blend): `steps` path layers between
 * them, outline and fill interpolated, returned as layer patches for addLayer('path', …). */
export function blendLayers(a, b, steps, palette) {
  const oa = outlineOf(a), ob = outlineOf(b)
  if (!oa || !ob) return []
  const ca = resolveColor(a.color, palette), cb = resolveColor(b.color, palette)
  return blendOutlines(oa, ob, steps).map((ring, i) => {
    const t = (i + 1) / (steps + 1)
    const norm = normalizePath(catmullNodes(ring, true))
    const color = ca && cb ? lerpHex(ca, cb, t) : (a.color ?? null)
    return {
      nodes: norm.nodes, closed: true,
      x: norm.dx, y: norm.dy, w: norm.w, h: norm.h,
      color, stroke: a.stroke ?? null, strokeWidth: a.strokeWidth ?? 0,
      opacity: (a.opacity ?? 1) + ((b.opacity ?? 1) - (a.opacity ?? 1)) * t,
      name: `Blend ${i + 1}`,
    }
  })
}
