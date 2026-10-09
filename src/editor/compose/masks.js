import { shapeToPathNodes } from './shape-math'
import { pathD, shiftNode } from './path-math'
import { applyVectorFx } from './vectorEffects'

/**
 * MASKS (G8 — Figma / Affinity / Illustrator): a shape or path set as a mask clips the layer
 * directly below it in the stack. The mask layer carries `isMask`; its target carries `maskedBy`
 * (the mask's id). Both stay ordinary layers — Release mask clears the two keys.
 *
 * ponytail: top-level layers only, and the mask's rotation / skew are not folded into its
 * outline; add both if a rotated mask or a masked layer inside a group is wanted.
 */

/* the layer's outline in CANVAS coords (vector effects applied), or null */
export function canvasOutline(layer) {
  if (layer.type === 'path' && Array.isArray(layer.nodes)) {
    return pathD(applyVectorFx(layer, layer.nodes, !!layer.closed).map((n) => shiftNode(n, layer.x ?? 0, layer.y ?? 0)), !!layer.closed)
  }
  if (layer.type === 'shape') {
    const geo = shapeToPathNodes(layer)
    if (!geo || !geo.closed) return null
    return pathD(applyVectorFx(layer, geo.nodes, true).map((n) => shiftNode(n, layer.x ?? 0, layer.y ?? 0)), true)
  }
  return null
}

export const canMask = (layer) => !!layer && !layer.locked && canvasOutline(layer) != null

/* What the canvas draws: masks hidden, each masked layer given its clip in its OWN local px. */
export function resolveMasks(layers) {
  if (!layers.some((l) => l.isMask)) return layers
  const byId = new Map(layers.map((l) => [l.id, l]))
  return layers.filter((l) => !l.isMask).map((l) => {
    const mask = l.maskedBy && byId.get(l.maskedBy)
    if (!mask) return l
    const geo = mask.type === 'path'
      ? { nodes: applyVectorFx(mask, mask.nodes, !!mask.closed), closed: !!mask.closed }
      : (() => { const g = shapeToPathNodes(mask); return g && { nodes: applyVectorFx(mask, g.nodes, true), closed: true } })()
    if (!geo) return l
    const local = geo.nodes.map((n) => shiftNode(n, (mask.x ?? 0) - (l.x ?? 0), (mask.y ?? 0) - (l.y ?? 0)))
    return { ...l, _clipD: pathD(local, true) }
  })
}
