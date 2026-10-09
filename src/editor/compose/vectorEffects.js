import { modeOffset, MODE_OPTIONS } from '../../loops/distress/engine'

/**
 * VECTOR EFFECTS — effects that move GEOMETRY, not pixels (the user's 22 and 23). The first is the
 * Distressor, imported from the labs-only loop (src/loops/distress): its per-point offsets and
 * smoothing, applied to a layer's own outline instead of a parsed SVG drawn to a canvas, so the
 * result stays a vector — it renders, exports to SVG and booleans as a path.
 *
 * Non-destructive: the layer keeps its nodes; `distressOn` + its params derive the drawn outline
 * at render (LayerRenderer), at export (build.js) and for shapes in shape-math's shapeOutlineD.
 * Static for now — the loop's `motion` (a living distress) is the next step on the transport.
 */

export const DISTRESS_MODES = MODE_OPTIONS

/* The Parameters tab's Distress section — flat keys on the layer so AutoControls renders it. */
const on = (l) => !!l.distressOn
export const VECTOR_FX_SCHEMA = [
  /* Offset path — Illustrator's Offset Path: the outline grown (+) or shrunk (−) along its normal */
  { key: 'offsetOn',     label: 'Offset path', type: 'toggle', default: false, section: 'Vector effects', animatable: false },
  { key: 'offsetDist',   label: 'Distance', type: 'range', min: -100, max: 100, step: 1, default: 12, when: (l) => !!l.offsetOn, section: 'Vector effects', animatable: false },
  /* Smooth — every anchor gets tangent handles (Affinity's Smooth / Illustrator's Smooth) */
  { key: 'smoothOn',     label: 'Smooth',  type: 'toggle', default: false, section: 'Vector effects', animatable: false },
  { key: 'smoothAmount', label: 'Amount',  type: 'range', min: 0, max: 200, step: 1, default: 100, format: (v) => `${v}%`, when: (l) => !!l.smoothOn, section: 'Vector effects', animatable: false },
  /* Pucker & Bloat — Illustrator's: anchors in and curves out (bloat, +) or the reverse (pucker, −) */
  { key: 'puckerOn',     label: 'Pucker & bloat', type: 'toggle', default: false, section: 'Vector effects', animatable: false },
  { key: 'puckerAmount', label: 'Amount',  type: 'range', min: -100, max: 100, step: 1, default: 40, format: (v) => `${v}%`, when: (l) => !!l.puckerOn, section: 'Vector effects', animatable: false },
  /* Twist — Illustrator's Twist: points turn about the centre, most at the middle */
  { key: 'twistOn',      label: 'Twist',   type: 'toggle', default: false, section: 'Vector effects', animatable: false },
  { key: 'twistAngle',   label: 'Angle',   type: 'range', min: -720, max: 720, step: 1, default: 90, format: (v) => `${v}°`, when: (l) => !!l.twistOn, section: 'Vector effects', animatable: false },
  /* Warp — Illustrator's Effect › Warp: the outline bent through a style */
  { key: 'warpOn',       label: 'Warp',    type: 'toggle', default: false, section: 'Vector effects', animatable: false },
  { key: 'warpStyle',    label: 'Style',   type: 'select', options: [{ value: 'arc', label: 'Arc' }, { value: 'bulge', label: 'Bulge' }, { value: 'wave', label: 'Wave' }, { value: 'flag', label: 'Flag' }], default: 'arc', when: (l) => !!l.warpOn, section: 'Vector effects' },
  { key: 'warpBend',     label: 'Bend',    type: 'range', min: -100, max: 100, step: 1, default: 40, format: (v) => `${v}%`, when: (l) => !!l.warpOn, section: 'Vector effects', animatable: false },
  /* Zigzag — Illustrator's Distort › Zig Zag: points pushed alternately out and in along the
     outline's normal, as corners or as a wave */
  { key: 'zigzagOn',     label: 'Zigzag',  type: 'toggle', default: false, section: 'Vector effects', animatable: false },
  { key: 'zigzagSize',   label: 'Size',    type: 'range', min: 0, max: 60, step: 1, default: 8, when: (l) => !!l.zigzagOn, section: 'Vector effects', animatable: false },
  { key: 'zigzagRidges', label: 'Ridges',  type: 'range', min: 4, max: 200, step: 1, default: 40, when: (l) => !!l.zigzagOn, section: 'Vector effects', animatable: false },
  { key: 'zigzagSmooth', label: 'Points',  type: 'segmented', options: [{ value: 'corner', label: 'Corner' }, { value: 'smooth', label: 'Smooth' }], default: 'corner', when: (l) => !!l.zigzagOn, section: 'Vector effects' },
  { key: 'distressOn',     label: 'Distress',   type: 'toggle', default: false, section: 'Vector effects', animatable: false },
  { key: 'distressMode',   label: 'Mode',       type: 'select', options: MODE_OPTIONS, default: 'print-press', when: on, section: 'Vector effects' },
  { key: 'distressAmount', label: 'Amount',     type: 'range', min: 0, max: 80, step: 1, default: 12, when: on, section: 'Vector effects', animatable: false },
  { key: 'distressFreq',   label: 'Frequency',  type: 'range', min: 1, max: 100, step: 1, default: 30, when: on, section: 'Vector effects', animatable: false },
  { key: 'distressSmooth', label: 'Smoothness', type: 'range', min: 0, max: 100, step: 1, default: 20, when: on, section: 'Vector effects', animatable: false },
  { key: 'distressSeed',   label: 'Seed',       type: 'range', min: 1, max: 9999, step: 1, default: 7, when: on, section: 'Vector effects', animatable: false, noRandom: true },
]

/* a point on a cubic segment p → c (handles default to the anchors) */
const cubicAt = (p, c, t) => {
  const c1 = p.out ?? p, c2 = c.in ?? c, u = 1 - t
  return {
    x: u * u * u * p.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * c.x,
    y: u * u * u * p.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * c.y,
  }
}

/* Even samples along the outline by arc length: a dense polyline first, then resampled to the
 * Distressor's density ladder (spacing narrows as frequency rises, as the source app did). */
function sampleOutline(nodes, closed, frequency) {
  const segs = closed ? nodes.length : nodes.length - 1
  const dense = []
  for (let i = 0; i < segs; i++) {
    const p = nodes[i], c = nodes[(i + 1) % nodes.length]
    for (let k = 0; k < 24; k++) dense.push(cubicAt(p, c, k / 24))
  }
  dense.push(closed ? dense[0] : nodes[nodes.length - 1])
  const cum = [0]
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y))
  const length = cum[cum.length - 1]
  if (!(length > 0)) return []
  const baseSpacing = Math.max(6, 70 - Math.min(50, frequency) * 1.2)
  const spacing = Math.max(2, baseSpacing - Math.max(0, frequency - 50) * 0.3)
  const n = Math.min(2000, Math.max(4, Math.round(length / spacing)))
  const out = []
  let j = 1
  for (let i = 0; i < n; i++) {
    const t = closed ? i / n : n === 1 ? 0 : i / (n - 1)
    const target = t * length
    while (j < cum.length - 1 && cum[j] < target) j++
    const a = dense[j - 1], b = dense[j], span = cum[j] - cum[j - 1] || 1
    const f = (target - cum[j - 1]) / span
    out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, t })
  }
  return out
}

/* centripetal Catmull-Rom through the points → path-math nodes (the Distressor's toPath, writing
 * handles instead of Path2D curves) */
function catmullNodes(points, closed) {
  const n = points.length
  const get = (i) => (closed ? points[(i + n) % n] : points[Math.min(Math.max(i, 0), n - 1)])
  const nodes = points.map((p) => ({ x: p.x, y: p.y, in: null, out: null }))
  const segs = closed ? n : n - 1
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2)
    const tt = (t, q0, q1) => t + Math.sqrt(Math.hypot(q1.x - q0.x, q1.y - q0.y))
    let t0 = 0, t1 = tt(t0, p0, p1), t2 = tt(t1, p1, p2), t3 = tt(t2, p2, p3)
    if (t1 === t0) t1 = t0 + 1
    if (t2 === t1) t2 = t1 + 1
    if (t3 === t2) t3 = t2 + 1
    const m1x = ((p2.x - p0.x) / (t2 - t0)) * (t1 - t0), m1y = ((p2.y - p0.y) / (t2 - t0)) * (t1 - t0)
    const m2x = ((p3.x - p1.x) / (t3 - t1)) * (t2 - t1), m2y = ((p3.y - p1.y) / (t3 - t1)) * (t2 - t1)
    nodes[i].out = { x: p1.x + m1x / 3, y: p1.y + m1y / 3 }
    nodes[(i + 1) % n].in = { x: p2.x - m2x / 3, y: p2.y - m2y / 3 }
  }
  return nodes
}

/* Smooth: each anchor's handles along the line through its neighbours, a sixth of that span at
 * 100% (uniform Catmull-Rom), scaled by the amount. The anchors stay where they are. */
function smoothFx(layer, nodes, closed) {
  const k = (layer.smoothAmount ?? 100) / 100 / 6
  const n = nodes.length
  return nodes.map((p, i) => {
    const a = nodes[closed ? (i - 1 + n) % n : Math.max(0, i - 1)]
    const b = nodes[closed ? (i + 1) % n : Math.min(n - 1, i + 1)]
    const tx = (b.x - a.x) * k, ty = (b.y - a.y) * k
    return { x: p.x, y: p.y, in: { x: p.x - tx, y: p.y - ty }, out: { x: p.x + tx, y: p.y + ty } }
  })
}

/* Offset path: dense samples pushed along the outward normal (winding read from the signed
 * area, so + always grows a closed shape), rejoined smooth. An open path offsets to one side. */
function offsetFx(layer, nodes, closed) {
  const d = layer.offsetDist ?? 12
  const pts = sampleOutline(nodes, closed, 90)
  if (pts.length < 3 || !d) return nodes
  const n = pts.length
  let area = 0
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; area += p.x * q.y - q.x * p.y }
  const sign = closed && area < 0 ? -1 : 1
  const moved = pts.map((p, i) => {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)]
    const tx = b.x - a.x, ty = b.y - a.y, len = Math.hypot(tx, ty) || 1
    /* in screen coords (y down) a clockwise ring's outward normal is (ty, −tx) */
    return { x: p.x + (ty / len) * d * sign, y: p.y + (-tx / len) * d * sign }
  })
  return catmullNodes(moved, closed)
}

/* BLEND (the user's 23 — Illustrator's Blend): N in-between outlines of two shapes. Both rings are
 * resampled to one count, the second rotated to start nearest the first, then interpolated.
 * Inputs are {nodes, closed} in one coordinate space; returns point rings for steps 1…N.
 * ponytail: layer rotation is not folded in (the caller converts paths as drawn); add it if a
 * rotated pair blends wrong. */
export function blendOutlines(a, b, steps) {
  const count = 96
  const ra = resample(a, count)
  let rb = resample(b, count)
  if (!ra.length || !rb.length) return []
  /* same winding, then the start offset that best matches the two rings around their centres —
     nearest-first-point alone twisted a rect into a circle */
  const area = (r) => r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p.x * q.y - q.x * p.y }, 0)
  if (Math.sign(area(ra)) !== Math.sign(area(rb))) rb = rb.slice().reverse()
  const centre = (r) => r.reduce((c, p) => ({ x: c.x + p.x / r.length, y: c.y + p.y / r.length }), { x: 0, y: 0 })
  const ca = centre(ra), cb = centre(rb)
  let best = 0, bestD = Infinity
  for (let s = 0; s < count; s++) {
    let dd = 0
    for (let i = 0; i < count; i += 4) {
      const p = ra[i], q = rb[(i + s) % count]
      dd += Math.hypot((p.x - ca.x) - (q.x - cb.x), (p.y - ca.y) - (q.y - cb.y))
    }
    if (dd < bestD) { bestD = dd; best = s }
  }
  const rb2 = rb.map((_, i) => rb[(i + best) % count])
  const out = []
  for (let k = 1; k <= steps; k++) {
    const t = k / (steps + 1)
    out.push(ra.map((p, i) => ({ x: p.x + (rb2[i].x - p.x) * t, y: p.y + (rb2[i].y - p.y) * t })))
  }
  return out
}
const resample = (geo, count) => {
  const pts = sampleOutline(geo.nodes, true, 100)
  if (pts.length < 3) return []
  return Array.from({ length: count }, (_, i) => pts[Math.floor((i / count) * pts.length)])
}
export { catmullNodes }

/* the outline's anchor bounding box */
const bounds = (pts) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y) }
  return { x0, y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
}

/* Pucker & Bloat on the nodes themselves: every corner gets handles a third of the way to its
 * neighbours first, then anchors scale toward the centre by k and handles away by k. */
function puckerFx(layer, nodes, closed) {
  const k = (layer.puckerAmount ?? 40) / 100
  const b = bounds(nodes)
  const n = nodes.length
  const lerp = (p, q, t) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t })
  const scale = (p, f) => ({ x: b.cx + (p.x - b.cx) * f, y: b.cy + (p.y - b.cy) * f })
  return nodes.map((p, i) => {
    const prev = nodes[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], next = nodes[closed ? (i + 1) % n : Math.min(n - 1, i + 1)]
    const inH = p.in ?? lerp(p, prev, 1 / 3), outH = p.out ?? lerp(p, next, 1 / 3)
    return { ...scale(p, 1 - k), in: scale(inH, 1 + k), out: scale(outH, 1 + k) }
  })
}

/* Twist: dense samples turned about the centre by angle × (1 − r/R) — most at the middle. */
function twistFx(layer, nodes, closed) {
  const pts = sampleOutline(nodes, closed, 70)
  if (pts.length < 3) return nodes
  const b = bounds(pts)
  const R = Math.hypot(b.w, b.h) / 2
  const a = ((layer.twistAngle ?? 90) * Math.PI) / 180
  return catmullNodes(pts.map((p) => {
    const dx = p.x - b.cx, dy = p.y - b.cy
    const t = a * (1 - Math.min(1, Math.hypot(dx, dy) / R))
    return { x: b.cx + dx * Math.cos(t) - dy * Math.sin(t), y: b.cy + dx * Math.sin(t) + dy * Math.cos(t) }
  }), closed)
}

/* Warp: dense samples displaced vertically by a style curve over the box (u across, v down). */
function warpFx(layer, nodes, closed) {
  const pts = sampleOutline(nodes, closed, 70)
  if (pts.length < 3) return nodes
  const b = bounds(pts)
  const bend = (layer.warpBend ?? 40) / 100
  const style = layer.warpStyle ?? 'arc'
  return catmullNodes(pts.map((p) => {
    const u = (p.x - b.x0) / b.w, v = (p.y - b.y0) / b.h
    const hump = 1 - (2 * u - 1) ** 2
    const dy = style === 'arc' ? -bend * b.h * 0.5 * hump
      : style === 'bulge' ? (v - 0.5) * 2 * bend * b.h * 0.35 * hump
      : style === 'wave' ? bend * b.h * 0.25 * Math.sin(2 * Math.PI * u)
      : bend * b.h * 0.25 * Math.sin(2 * Math.PI * u) * u   /* flag: the wave grows toward the fly end */
    return { x: p.x, y: p.y + dy }
  }), closed)
}

/* Zigzag: an even number of samples (closed) so the ridges meet, each pushed ±size along the
 * normal of the polyline through its neighbours. */
function zigzag(layer, nodes, closed) {
  const ridges = Math.max(4, Math.round(layer.zigzagRidges ?? 40))
  const pts = sampleOutline(nodes, closed, 50)
  if (pts.length < 3) return nodes
  /* resample to exactly 2 × ridges points */
  const n = ridges * 2
  const even = []
  for (let i = 0; i < n; i++) even.push(pts[Math.min(pts.length - 1, Math.round((i / n) * (closed ? pts.length : pts.length - 1)))])
  const size = layer.zigzagSize ?? 8
  const moved = even.map((p, i) => {
    const a = even[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = even[closed ? (i + 1) % n : Math.min(n - 1, i + 1)]
    const tx = b.x - a.x, ty = b.y - a.y, len = Math.hypot(tx, ty) || 1
    const k = (i % 2 ? -1 : 1) * size
    return { x: p.x + (-ty / len) * k, y: p.y + (tx / len) * k }
  })
  return (layer.zigzagSmooth ?? 'corner') === 'smooth'
    ? catmullNodes(moved, closed)
    : moved.map((p) => ({ x: p.x, y: p.y, in: null, out: null }))
}

/* The layer's outline with its vector effects applied — the nodes untouched when none is on.
 * Order, as the Parameters list reads top-down: offset, smooth, pucker & bloat, twist, warp,
 * zigzag, then distress. */
export function applyVectorFx(layer, nodes, closed) {
  if (!Array.isArray(nodes) || nodes.length < 2) return nodes
  if (layer?.offsetOn) nodes = offsetFx(layer, nodes, closed)
  if (layer?.smoothOn) nodes = smoothFx(layer, nodes, closed)
  if (layer?.puckerOn) nodes = puckerFx(layer, nodes, closed)
  if (layer?.twistOn)  nodes = twistFx(layer, nodes, closed)
  if (layer?.warpOn)   nodes = warpFx(layer, nodes, closed)
  if (layer?.zigzagOn) nodes = zigzag(layer, nodes, closed)
  if (!layer?.distressOn) return nodes
  const frequency = layer.distressFreq ?? 30
  const pts = sampleOutline(nodes, closed, frequency)
  if (pts.length < 3) return nodes
  const strength = Math.max(0, layer.distressAmount ?? 12)
  const freq = Math.max(1, frequency <= 50 ? frequency / 6 : 50 / 6 + (frequency - 50) / 8)
  const seed = layer.distressSeed ?? 7
  const smooth = layer.distressSmooth ?? 20
  const win = smooth > 0 ? Math.max(1, Math.round(smooth / 30)) : 0
  const offs = pts.map((pt, i) => modeOffset(layer.distressMode ?? 'print-press', i, pt.t, strength, freq, seed, 0))
  const fin = win > 0
    ? offs.map((_, idx) => {
      let sx = 0, sy = 0, count = 0
      for (let step = -win; step <= win; step++) {
        let i = idx + step
        if (closed) i = (i + offs.length) % offs.length
        else if (i < 0 || i >= offs.length) continue
        sx += offs[i].dx; sy += offs[i].dy; count++
      }
      return { dx: sx / count, dy: sy / count }
    })
    : offs
  return catmullNodes(pts.map((p, i) => ({ x: p.x + fin[i].dx, y: p.y + fin[i].dy })), closed)
}
