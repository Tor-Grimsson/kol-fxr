import { lerp } from '../../loops/lib/util.js'
import { keysFor } from './buildMorph.js'

/**
 * shape — a morph's Shape mode (plan 10 § 4): point to point between the OUTLINES two steps draw,
 * generic over every canvas generator and touching none of them.
 *
 *   record  a step's `draw(ctx, u, w, h, p)` runs against a Proxy over a real 2D context. The path
 *           calls (moveTo · lineTo · arc · ellipse · beziers · rect · fillRect) are kept as point
 *           lists in canvas space — the context's own CTM is read per point, so a generator's
 *           translate / rotate / scale costs nothing to track — and fill / stroke close a record
 *           with that call's style. Everything else (gradients, measureText, save/restore, the
 *           style properties) falls through to the real context, so a recorded style is real paint.
 *   pair    backgrounds pair with backgrounds; the rest pair in draw order, the side with more
 *           subpaths folded into contiguous runs (a dashed spiral is one spiral). A pair resamples by
 *           arc length to N points, a closed pair rotates its start to the nearest tip, an open one
 *           picks its direction; a fill meeting a stroke crossfades on the moving geometry.
 *   draw    lerp the points, mix the colours, paint.
 *
 * Progress is the layer's `morphT` track — a float step position the resolver eases key to key,
 * and the lane the timeline dock shows for a morph: step = floor, k = the fraction. Both steps
 * draw at the morph's own `u`, so a step's own animation keeps moving under the morph.
 *
 * ponytail: outlines are recorded and paired every frame — cheap for canvas shapes; cache per
 * (step, u) if a heavy generator lands in a morph. arcTo is a lineTo; clip(), text and images are
 * ignored; a gradient style takes the nearer step's.
 */

const TAU = Math.PI * 2
const CURVE_SEGS = 12
const arcSegs = (sweep) => Math.max(8, Math.min(96, Math.ceil(Math.abs(sweep) / (Math.PI / 32))))

/* canvas arc semantics: the sweep runs the way `ccw` says and never more than a full turn */
function sweepOf(a0, a1, ccw) {
  let s = a1 - a0
  if (!ccw) { if (s < 0) s = (s % TAU) + TAU; if (s > TAU) s = TAU }
  else { if (s > 0) s = (s % TAU) - TAU; if (s < -TAU) s = -TAU }
  return s
}

/**
 * Run `draw` against a recorder over `backing` (a real 2D context, or the check's stub) and return
 * the subpaths it filled or stroked: `{ pts, closed, op, style, alpha, lineWidth, rule }`.
 */
export function recordOutline(draw, u, w, h, p, backing) {
  const subs = []
  let path = []       /* the current path's subpaths */
  let cur = null      /* the open subpath */
  let lastU = null    /* the current point, user space */
  let depth = 0       /* the generator's own save/restore balance */
  const xf = (x, y) => { const m = backing.getTransform(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f] }
  const start = (x, y) => { cur = { pts: [xf(x, y)], closed: false, startU: [x, y] }; path.push(cur); lastU = [x, y] }
  const point = (x, y) => {
    if (!cur) { if (lastU) start(lastU[0], lastU[1]); else { start(x, y); return } }
    cur.pts.push(xf(x, y)); lastU = [x, y]
  }
  const sweep = (fx, fy, a0, s) => {
    const n = arcSegs(s)
    for (let i = 0; i <= n; i++) { const a = a0 + (s * i) / n; point(fx(a), fy(a)) }
  }
  const emit = (op, rule) => {
    for (const s of path) {
      if (s.pts.length < 2) continue
      subs.push({ pts: s.pts, closed: s.closed, op, style: op === 'fill' ? backing.fillStyle : backing.strokeStyle, alpha: backing.globalAlpha, lineWidth: backing.lineWidth, rule })
    }
  }
  const box = (x, y, rw, rh, op) => subs.push({ pts: [xf(x, y), xf(x + rw, y), xf(x + rw, y + rh), xf(x, y + rh)], closed: true, op, style: op === 'fill' ? backing.fillStyle : backing.strokeStyle, alpha: backing.globalAlpha, lineWidth: backing.lineWidth })
  const noop = () => {}
  const rec = {
    beginPath() { path = []; cur = null },
    moveTo(x, y) { start(x, y) },
    lineTo(x, y) { point(x, y) },
    closePath() { if (cur) { cur.closed = true; lastU = cur.startU; cur = null } },
    rect(x, y, rw, rh) { start(x, y); point(x + rw, y); point(x + rw, y + rh); point(x, y + rh); cur.closed = true; cur = null; lastU = [x, y] },
    arc(cx, cy, r, a0, a1, ccw = false) { sweep((a) => cx + r * Math.cos(a), (a) => cy + r * Math.sin(a), a0, sweepOf(a0, a1, ccw)) },
    ellipse(cx, cy, rx, ry, rot, a0, a1, ccw = false) {
      const c = Math.cos(rot), s = Math.sin(rot)
      sweep((a) => cx + rx * Math.cos(a) * c - ry * Math.sin(a) * s, (a) => cy + rx * Math.cos(a) * s + ry * Math.sin(a) * c, a0, sweepOf(a0, a1, ccw))
    },
    arcTo(x1, y1) { point(x1, y1) },
    bezierCurveTo(x1, y1, x2, y2, x, y) {
      const [x0, y0] = lastU ?? [x1, y1]
      for (let i = 1; i <= CURVE_SEGS; i++) {
        const t = i / CURVE_SEGS, m = 1 - t
        point(m * m * m * x0 + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x, m * m * m * y0 + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y)
      }
    },
    quadraticCurveTo(x1, y1, x, y) {
      const [x0, y0] = lastU ?? [x1, y1]
      for (let i = 1; i <= CURVE_SEGS; i++) {
        const t = i / CURVE_SEGS, m = 1 - t
        point(m * m * x0 + 2 * m * t * x1 + t * t * x, m * m * y0 + 2 * m * t * y1 + t * t * y)
      }
    },
    fill(a) { if (a && typeof a === 'object') return; emit('fill', typeof a === 'string' ? a : undefined) },
    stroke(a) { if (a && typeof a === 'object') return; emit('stroke') },
    fillRect(x, y, rw, rh) { box(x, y, rw, rh, 'fill') },
    strokeRect(x, y, rw, rh) { box(x, y, rw, rh, 'stroke') },
    save() { depth++; backing.save() },
    restore() { if (depth > 0) { depth--; backing.restore() } },
    clearRect: noop, clip: noop, fillText: noop, strokeText: noop, drawImage: noop, putImageData: noop,
  }
  const proxy = new Proxy(backing, {
    get(t, k) { if (Object.hasOwn(rec, k)) return rec[k]; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v },
    set(t, k, v) { t[k] = v; return true },
  })
  backing.save()
  backing.setTransform(1, 0, 0, 1, 0, 0)
  try { draw(proxy, u, w, h, p) } finally { while (depth-- > 0) backing.restore(); backing.restore() }
  return subs
}

/* ── pairing ── */
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2
function area(pts) { let s = 0; for (let i = 0, n = pts.length; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1] } return s / 2 }
function extent(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  return (x1 - x0) * (y1 - y0)
}
function centroid(pts) { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1] } return [x / pts.length, y / pts.length] }

/** N points evenly spaced by arc length along `pts` (a closed path includes its closing segment). */
export function resample(pts, closed, N) {
  if (pts.length === 0) return []
  const P = closed ? [...pts, pts[0]] : pts
  const L = [0]
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.sqrt(d2(P[i - 1], P[i])))
  const total = L[L.length - 1]
  if (!(total > 0)) return Array.from({ length: N }, () => [pts[0][0], pts[0][1]])
  const out = []
  let seg = 0
  for (let k = 0; k < N; k++) {
    const d = closed ? (total * k) / N : (total * k) / (N - 1)
    while (seg < P.length - 2 && L[seg + 1] < d) seg++
    const span = L[seg + 1] - L[seg] || 1
    const f = Math.min(1, Math.max(0, (d - L[seg]) / span))
    out.push([lerp(P[seg][0], P[seg + 1][0], f), lerp(P[seg][1], P[seg + 1][1], f)])
  }
  return out
}

/* how much better a new alignment must be before it replaces last frame's (2026-10-09, the jolts):
   an animated generator moves its outline every frame, and the strict best start point can hop
   between two near-equal candidates — the shape twists a step each time it does */
const STICK = 1.1

/** `b` reordered to sit nearest `a`: a closed path rotates its start, an open one picks a direction.
 * `memo` (optional, one per pair, kept across frames) holds the last choice; it is kept while it
 * stays within STICK of the best, so the pairing does not flip from frame to frame. */
export function align(a, b, closed, memo) {
  const N = a.length
  if (closed) {
    let best = 0, bestD = Infinity
    for (let off = 0; off < N; off++) {
      let d = 0
      for (let k = 0; k < N && d < bestD; k++) d += d2(a[k], b[(k + off) % N])
      if (d < bestD) { bestD = d; best = off }
    }
    if (memo && memo.n === N && memo.off != null && memo.off !== best) {
      let d = 0
      for (let k = 0; k < N; k++) d += d2(a[k], b[(k + memo.off) % N])
      if (d <= bestD * STICK) best = memo.off
    }
    if (memo) { memo.n = N; memo.off = best }
    return best ? [...b.slice(best), ...b.slice(0, best)] : b
  }
  let fwd = 0, rev = 0
  for (let k = 0; k < N; k++) { fwd += d2(a[k], b[k]); rev += d2(a[k], b[N - 1 - k]) }
  let flip = rev < fwd
  if (memo && memo.rev != null && memo.rev !== flip && (memo.rev ? rev : fwd) <= Math.min(fwd, rev) * STICK) flip = memo.rev
  if (memo) memo.rev = flip
  return flip ? [...b].reverse() : b
}

const prep = (s, N) => { const pts = resample(s.pts, s.closed, N); if (s.closed && area(pts) < 0) pts.reverse(); return pts }
const collapse = (s, k) => { const c = centroid(s.pts); return { ...s, pts: s.pts.map((p) => [lerp(p[0], c[0], k), lerp(p[1], c[1], k)]), alpha: s.alpha * (1 - k) } }

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const RGB = /^rgba?\(([^)]+)\)$/i
function rgba(s) {
  if (typeof s !== 'string') return null
  const h = HEX.exec(s)
  if (h) { let x = h[1]; if (x.length === 3) x = x.split('').map((c) => c + c).join(''); const n = parseInt(x, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1] }
  const r = RGB.exec(s)
  if (r) { const v = r[1].split(/[\s,/]+/).filter(Boolean).map(Number); if (v.length >= 3 && v.every(Number.isFinite)) return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1] }
  return null
}
/** colours mix per channel; anything else (a gradient, a pattern) is the nearer step's */
export function mixStyle(a, b, k) {
  const A = rgba(a), B = rgba(b)
  if (!A || !B) return k < 0.5 ? a : b
  const c = A.map((x, i) => lerp(x, B[i], k))
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`
}

/* a background: a closed fill over most of the frame (the generator's bg rect) */
const isBg = (sub, frame) => sub.op === 'fill' && sub.closed && extent(sub.pts) >= frame * 0.9
/* `subs` (in draw order) folded into `m` contiguous runs, each one polyline — a dashed spiral
   becomes the spiral it traces, so it can pair with one star instead of fading in dash by dash */
function chunk(subs, m) {
  if (subs.length <= m) return subs
  const out = []
  for (let c = 0; c < m; c++) {
    const run = subs.slice(Math.floor((c * subs.length) / m), Math.floor(((c + 1) * subs.length) / m))
    out.push({ ...run[0], pts: run.flatMap((x) => x.pts), closed: false })
  }
  return out
}
/* two subpaths k of the way: shared geometry; a fill meeting a stroke crossfades on it */
function blendPair(x, y, k, N0, memo) {
  /* a typed or slid count floors at 3 — fewer points cannot hold an outline */
  const N = N0 ? Math.max(3, Math.round(N0)) : Math.max(64, Math.min(512, Math.max(x.pts.length, y.pts.length)))
  const closed = x.closed && y.closed
  const px = prep({ ...x, closed }, N)
  const py = align(px, prep({ ...y, closed }, N), closed, memo)
  const pts = px.map((q, i) => [lerp(q[0], py[i][0], k), lerp(q[1], py[i][1], k)])
  const lineWidth = lerp(x.lineWidth, y.lineWidth, k)
  if (x.op === y.op) return [{ pts, closed: k < 0.5 ? x.closed : y.closed, op: x.op, rule: (k < 0.5 ? x : y).rule, style: mixStyle(x.style, y.style, k), alpha: lerp(x.alpha, y.alpha, k), lineWidth }]
  return [
    { pts, closed: x.closed, op: x.op, rule: x.rule, style: x.style, alpha: x.alpha * (1 - k), lineWidth },
    { pts, closed: y.closed, op: y.op, rule: y.rule, style: y.style, alpha: y.alpha * k, lineWidth },
  ]
}
function pairAll(a, b, k, N, memos) {
  const out = []
  if (!a.length || !b.length) { for (const x of a) out.push(collapse(x, k)); for (const y of b) out.push(collapse(y, 1 - k)); return out }
  const m = Math.min(a.length, b.length)
  const ca = chunk(a, m), cb = chunk(b, m)
  for (let i = 0; i < m; i++) out.push(...blendPair(ca[i], cb[i], k, N, memos && (memos[i] ??= {})))
  return out
}

/** The subpaths k of the way from outline A to outline B (`frame` = w·h, to tell a background).
 * `resolution` is the points per pair (plan 14 § 3); 0 / undefined = auto (64–512 by the outline). */
export function morphOutlines(A, B, k, frame = Infinity, resolution = 0, memo) {
  const bgA = A.filter((x) => isBg(x, frame)), bgB = B.filter((x) => isBg(x, frame))
  return [...pairAll(bgA, bgB, k, resolution, memo && (memo.bg ??= [])), ...pairAll(A.filter((x) => !isBg(x, frame)), B.filter((x) => !isBg(x, frame)), k, resolution, memo && (memo.fg ??= []))]
}

export function paint(ctx, subs, mul = 1) {
  if (!(mul > 0)) return
  for (const s of subs) {
    if (!(s.alpha > 0) || s.pts.length < 2) continue
    ctx.globalAlpha = s.alpha * mul
    ctx.beginPath()
    s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    if (s.closed) ctx.closePath()
    if (s.op === 'fill') { ctx.fillStyle = s.style; if (s.rule) ctx.fill(s.rule); else ctx.fill() }
    else { ctx.strokeStyle = s.style; ctx.lineWidth = s.lineWidth; ctx.stroke() }
  }
  ctx.globalAlpha = 1
}

/* ── the morph ── */
let backing = null
function backingCtx(w, h) {
  if (typeof document === 'undefined') return null
  if (!backing) backing = document.createElement('canvas').getContext('2d')
  const c = backing.canvas
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
  return backing
}

/** a generator Shape mode can record — a 2d `draw`, not a GL engine */
export const hasOutline = (def) => typeof def?.draw === 'function' && def.kind !== 'engine'

export function outlineOf(def, u, w, h, p, ctx = backingCtx(w, h)) {
  if (!hasOutline(def) || !ctx) return []
  return recordOutline(def.draw.bind(def), u, w, h, p, ctx)
}

/** the `morphT` track: step indices eased key to key; Loop closes on index N (= step 0 again) */
export function morphKeys(n, cycle, curve) {
  const idx = Array.from({ length: n }, (_, i) => i)
  return cycle === 'loop' ? keysFor([...idx, n], 'once', curve) : keysFor(idx, cycle, curve)
}

/** Draw the morph layer `p` (resolved: `morphT` is a number) at `u`. `lookup` is `loopById`. */
export function drawShapeMorph(ctx, u, w, h, p, lookup) {
  const steps = p.morph?.steps ?? []
  const n = steps.length
  if (!n) return
  const s = Number.isFinite(p.morphT) ? p.morphT : 0
  const fl = Math.floor(s)
  const i = ((fl % n) + n) % n, j = (i + 1) % n, k = s - fl
  const A = outlineOf(lookup(steps[i].loopId), u, w, h, steps[i].params)
  if (!(k > 0) || n === 1) { paint(ctx, A); return }
  const B = outlineOf(lookup(steps[j].loopId), u, w, h, steps[j].params)
  let memo = memos.get(`${i}>${j}`)
  if (!memo) { if (memos.size > 32) memos.clear(); memo = {}; memos.set(`${i}>${j}`, memo) }
  const M = morphOutlines(A, B, k, w * h, p.morph?.resolution || 0, memo)
  /* THE ENDS MEET THE STEPS (2026-10-09, the jolts). The morph draws resampled, paired, chunked
     geometry; a step at rest is the generator's own drawing — so every boundary snapped from one to
     the other. Over the first and last EDGE of a segment the step's own drawing fades in over the
     morph, so the frame at the key IS the step and nothing jumps. */
  const a = k < EDGE ? 1 - smooth(k / EDGE) : 0
  const b = k > 1 - EDGE ? smooth((k - (1 - EDGE)) / EDGE) : 0
  paint(ctx, M, 1 - Math.max(a, b))
  paint(ctx, A, a)
  paint(ctx, B, b)
}
const EDGE = 0.12
const smooth = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c) }
/* last frame's alignments, per step pair (see `align`) */
const memos = new Map()

/* ── crossfade (plan 14 § 2) — the third mode: both steps drawn, the second faded in over the
 * first. No pairing, no recording: any 2d generator, the two steps as the generators draw them.
 * The second step paints into its own canvas and composites at `k`, so a generator that writes
 * `globalAlpha` itself cannot defeat the fade. */
let fadeLayer = null
/* a scratch canvas the size of the target's, wearing the target's transform — so whatever the
 * viewport did to the target (dpr, fit, zoom) the fade layer composites pixel for pixel */
function fadeCtx(ctx) {
  if (!fadeLayer) fadeLayer = document.createElement('canvas').getContext('2d')
  const c = fadeLayer.canvas, t = ctx.canvas
  if (c.width !== t.width || c.height !== t.height) { c.width = t.width; c.height = t.height }
  fadeLayer.setTransform(1, 0, 0, 1, 0, 0)
  fadeLayer.clearRect(0, 0, c.width, c.height)
  fadeLayer.setTransform(ctx.getTransform())
  return fadeLayer
}
export const canCrossfade = (def) => typeof def?.draw === 'function' && def.kind !== 'engine'
export function drawCrossfade(ctx, u, w, h, p, lookup) {
  const steps = p.morph?.steps ?? []
  const n = steps.length
  if (!n) return
  const s = Number.isFinite(p.morphT) ? p.morphT : 0
  const fl = Math.floor(s)
  const i = ((fl % n) + n) % n, j = (i + 1) % n, k = s - fl
  const a = lookup(steps[i].loopId), b = lookup(steps[j].loopId)
  if (canCrossfade(a)) { ctx.save(); a.draw(ctx, u, w, h, steps[i].params); ctx.restore() }
  if (!(k > 0) || n === 1 || !canCrossfade(b)) return
  const f = fadeCtx(ctx)
  f.save(); b.draw(f, u, w, h, steps[j].params); f.restore()
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = k
  ctx.drawImage(f.canvas, 0, 0)
  ctx.restore()
}
const FADE_DEFS = new Map()
export function crossfadeMorphDef(lookup, loopId) {
  const base = lookup(loopId)
  let d = FADE_DEFS.get(base)
  if (!d) {
    d = { id: 'crossfade', label: 'Crossfade', params: base?.params ?? [], draw: (ctx, u, w, h, p) => drawCrossfade(ctx, u, w, h, p, lookup) }
    FADE_DEFS.set(base, d)
  }
  return d
}

/* The renderer's def for a shape-morph layer: the first step's schema (bg toggle, labels), a draw
 * that is the morph. One per base def so the renderer's redraw-skip signature keeps its identity. */
const DEFS = new Map()
export function shapeMorphDef(lookup, loopId) {
  const base = lookup(loopId)
  let d = DEFS.get(base)
  if (!d) {
    d = { id: 'morph', label: 'Morph', params: base?.params ?? [], draw: (ctx, u, w, h, p) => drawShapeMorph(ctx, u, w, h, p, lookup) }
    DEFS.set(base, d)
  }
  return d
}
