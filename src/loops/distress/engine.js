import { TAU } from '../lib/util.js'

// Vector distress — the kol-svg-distress app's bake pipeline ported onto the
// loop contract (plan 02-labs-mobile-and-vector step 3). The source hook
// (useSvgDistortion) resampled + displaced the SVG geometry inside one
// useMemo per param change; here the expensive half (parse + arc-length
// sampling) caches per (source, frequency) and the cheap half (seeded mode
// offsets + smoothing + draw) runs per frame, so the distress LIVES: wave
// modes drift their phase `motion` full turns per loop and random modes
// re-seed `motion`×2 times per loop, both returning to frame(0) at u=1.
//
// The source's 'filter' preview (feTurbulence) is not ported — the bake path
// was the app's own export truth. Geometry sampling uses getTotalLength /
// getPointAtLength on detached DOMParser elements, exactly as the source app
// did (Chromium computes path geometry without layout; Firefox may not).

/* The stand-in art while a layer has no source yet — currentColor resolves to
 * the Ink param, so the default themes. */
const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <circle cx="200" cy="200" r="118" fill="currentColor"/>
  <rect x="46" y="46" width="308" height="308" fill="none" stroke="currentColor" stroke-width="12"/>
</svg>`

/* seeded 0..1 — the source's sin-hash */
const random = (v) => {
  const x = Math.sin(v) * 10000
  return x - Math.floor(x)
}

/* ── parse + sample (cached) ─────────────────────────────────────────── */

const parseSvg = (svgText, frequency) => {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  if (doc.querySelector('parsererror')) return { error: true, elements: [], vb: [0, 0, 400, 400] }
  /* getTotalLength/getPointAtLength THROW InvalidStateError on detached
   * circle/rect/ellipse/line (only <path> computes detached) — the source app
   * silently dropped every non-path shape through its try/catch. Attach the
   * svg off-screen for the sampling pass, remove it after. */
  const host = document.createElement('div')
  host.style.cssText = 'position:absolute;left:-99999px;top:0;width:0;height:0;overflow:hidden'
  const svg = document.importNode(doc.documentElement, true)
  host.appendChild(svg)
  document.body.appendChild(host)
  let vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number)
  if (vb.length !== 4 || !vb.every(Number.isFinite)) {
    const w = parseFloat(svg.getAttribute('width')) || 400
    const h = parseFloat(svg.getAttribute('height')) || 400
    vb = [0, 0, w, h]
  }
  const closedTags = new Set(['rect', 'circle', 'ellipse', 'polygon'])
  const elements = []
  svg.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon').forEach((el) => {
    if (typeof el.getTotalLength !== 'function') return
    let length = 0
    try { length = el.getTotalLength() } catch { return }
    if (!Number.isFinite(length) || length <= 0) return

    /* the source's density ladder: spacing narrows as frequency rises */
    const baseSpacing = Math.max(6, 70 - Math.min(50, frequency) * 1.2)
    const spacing = Math.max(2, baseSpacing - Math.max(0, frequency - 50) * 0.3)
    const n = Math.min(2000, Math.max(4, Math.round(length / spacing)))
    const tag = el.tagName.toLowerCase()
    const closed = closedTags.has(tag) || (tag === 'path' && /z/i.test(el.getAttribute('d') || ''))
    const pts = []
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : closed ? i / n : i / (n - 1)
      const pt = el.getPointAtLength(length * t)
      pts.push({ x: pt.x, y: pt.y, t })
    }
    elements.push({
      pts,
      closed,
      fill: el.getAttribute('fill'),
      stroke: el.getAttribute('stroke'),
      strokeWidth: parseFloat(el.getAttribute('stroke-width')) || 0,
    })
  })
  host.remove()
  return { error: false, elements, vb }
}

/* (source, frequency) → parsed geometry; remote sources fetch once and fill
 * in on a later frame (draw falls back to the default art meanwhile). */
const CACHE = new Map()
const TEXTS = new Map()
const getParsed = (src, frequency) => {
  const key = `${frequency}|${src}`
  const hit = CACHE.get(key)
  if (hit) return hit
  if (CACHE.size > 16) CACHE.delete(CACHE.keys().next().value)

  const text = src.trim().startsWith('<') ? src : TEXTS.get(src)
  if (text !== undefined) {
    const parsed = parseSvg(text, frequency)
    CACHE.set(key, parsed)
    return parsed
  }
  CACHE.set(key, null)   /* pending marker so one fetch runs */
  fetch(src).then((r) => r.text()).then((t) => { TEXTS.set(src, t); CACHE.delete(key) })
    .catch(() => { TEXTS.set(src, DEFAULT_SVG); CACHE.delete(key) })
  return null
}

/* ── the per-frame half ──────────────────────────────────────────────── */

/* the source's getModeOffset, verbatim recipes; uPhase is the one addition
 * (a whole-TAU phase advance per loop, so wave modes animate seamlessly) */
const modeOffset = (mode, index, t, strength, freq, seed, uPhase) => {
  const base = random(seed + index * 12.9898)
  const alt = random(seed * 2.133 + index * 78.233)
  const a = base - 0.5
  const b = alt - 0.5
  const phase = (t * freq * 2 + seed * 0.1) * Math.PI + uPhase

  if (mode === 'noise') return { dx: Math.sin(phase) * strength, dy: Math.cos(phase) * strength }
  if (mode === 'jitter') return { dx: a * strength, dy: b * strength }
  if (mode === 'hand') return { dx: Math.sin(phase * 0.6) * strength * 0.8, dy: Math.sin(phase * 0.9) * strength * 0.8 }
  if (mode === 'roughen') {
    return { dx: (Math.round(a * 4) / 4) * strength * 1.2, dy: (Math.round(b * 4) / 4) * strength * 1.2 }
  }
  if (mode === 'tear') {
    const saw = ((t * freq * 0.6 + uPhase / TAU) % 1 + 1) % 1
    const spike = base > 0.86 ? 1.8 : 1
    return { dx: (saw - 0.5) * strength * 2.2 * spike, dy: b * strength * 0.6 * spike }
  }
  if (mode === 'ink-spread') return { dx: a * strength * 0.4, dy: b * strength * 0.4 }
  if (mode === 'offset') {
    const angle = (seed % 360) * (Math.PI / 180)
    return {
      dx: Math.cos(angle) * strength * 0.6 + a * strength * 0.2,
      dy: Math.sin(angle) * strength * 0.6 + b * strength * 0.2,
    }
  }
  /* print-press — the source's default branch */
  const spike = base > 0.9 ? 1.7 : 0.9
  return { dx: a * strength * spike, dy: b * strength * spike }
}

/* centripetal catmull-rom → bezier segments (the source's buildSegments) */
const toPath = (points, closed) => {
  const path = new Path2D()
  if (points.length < 2) return path
  const get = (i) => {
    if (closed) return points[(i + points.length) % points.length]
    return points[Math.min(Math.max(i, 0), points.length - 1)]
  }
  const n = closed ? points.length : points.length - 1
  path.moveTo(points[0].x, points[0].y)
  for (let i = 0; i < n; i++) {
    const p0 = get(i - 1); const p1 = get(i); const p2 = get(i + 1); const p3 = get(i + 2)
    const tt = (t, q0, q1) => t + Math.sqrt(Math.hypot(q1.x - q0.x, q1.y - q0.y))
    let t0 = 0; let t1 = tt(t0, p0, p1); let t2 = tt(t1, p1, p2); let t3 = tt(t2, p2, p3)
    if (t1 === t0) t1 = t0 + 1
    if (t2 === t1) t2 = t1 + 1
    if (t3 === t2) t3 = t2 + 1
    const m1x = ((p2.x - p0.x) / (t2 - t0)) * (t1 - t0)
    const m1y = ((p2.y - p0.y) / (t2 - t0)) * (t1 - t0)
    const m2x = ((p3.x - p1.x) / (t3 - t1)) * (t2 - t1)
    const m2y = ((p3.y - p1.y) / (t3 - t1)) * (t2 - t1)
    path.bezierCurveTo(p1.x + m1x / 3, p1.y + m1y / 3, p2.x - m2x / 3, p2.y - m2y / 3, p2.x, p2.y)
  }
  if (closed) path.closePath()
  return path
}

const MODE_OPTIONS = [
  { value: 'print-press', label: 'Print press' },
  { value: 'noise', label: 'Noise' },
  { value: 'jitter', label: 'Jitter' },
  { value: 'hand', label: 'Hand-drawn' },
  { value: 'roughen', label: 'Roughen' },
  { value: 'tear', label: 'Torn edge' },
  { value: 'ink-spread', label: 'Ink spread' },
  { value: 'offset', label: 'Misregister' },
]

export default {
  id: 'vector-distress',
  label: 'Distressor',
  group: 'distress',
  kind: '2d',
  duration: 6,
  params: [
    { key: 'bg', label: 'Background', type: 'color', role: 'bg', default: '#121215' },
    { key: 'ink', label: 'Ink', type: 'color', role: 'fg', default: '#e8e4dc' },
    { key: 'mode', label: 'Mode', type: 'select', options: MODE_OPTIONS, default: 'print-press' },
    { key: 'amount', label: 'Amount', type: 'range', min: 0, max: 80, step: 1, default: 24 },
    { key: 'frequency', label: 'Frequency', type: 'range', min: 1, max: 100, step: 1, default: 30 },
    { key: 'smoothness', label: 'Smoothness', type: 'range', min: 0, max: 100, step: 1, default: 20 },
    { key: 'seed', label: 'Seed', type: 'range', min: 1, max: 9999, step: 1, default: 7, noRandom: true },
    { key: 'motion', label: 'Motion', type: 'range', min: 0, max: 8, step: 1, default: 2, noRandom: true },
    { key: 'size', label: 'Reach', type: 'range', min: 0.4, max: 1, step: 0.02, default: 0.8 },
  ],
  draw(ctx, u, w, h, p) {
    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)

    const src = (typeof p.svgSrc === 'string' && p.svgSrc) || DEFAULT_SVG
    const parsed = getParsed(src, p.frequency) ?? getParsed(DEFAULT_SVG, p.frequency)
    if (!parsed || parsed.error || !parsed.elements.length) return

    const motion = Math.round(p.motion)
    /* wave modes: whole turns per loop · random modes: whole re-seeds per loop
     * — both land back on frame(0) at u=1 */
    const uPhase = TAU * u * motion
    const steps = motion * 2
    const seed = p.seed + (steps > 0 ? (Math.floor(u * steps) % steps) * 101 : 0)
    const strength = Math.max(0, p.amount)
    const freq = Math.max(1, p.frequency <= 50 ? p.frequency / 6 : 50 / 6 + (p.frequency - 50) / 8)
    const win = p.smoothness > 0 ? Math.max(1, Math.round(p.smoothness / 30)) : 0

    const [vx, vy, vw, vh] = parsed.vb
    const s = Math.min((w * p.size) / vw, (h * p.size) / vh)
    ctx.save()
    ctx.translate((w - vw * s) / 2 - vx * s, (h - vh * s) / 2 - vy * s)
    ctx.scale(s, s)

    parsed.elements.forEach((el, index) => {
      const offs = el.pts.map((pt, i) => modeOffset(p.mode, i + index * 1000, pt.t, strength, freq, seed, uPhase))
      let finalOffs = offs
      if (win > 0) {
        finalOffs = offs.map((_, idx) => {
          let sx = 0; let sy = 0; let count = 0
          for (let step = -win; step <= win; step++) {
            let i = idx + step
            if (el.closed) i = (i + offs.length) % offs.length
            else if (i < 0 || i >= offs.length) continue
            sx += offs[i].dx; sy += offs[i].dy; count++
          }
          return { dx: sx / count, dy: sy / count }
        })
      }
      const points = el.pts.map((pt, i) => ({ x: pt.x + finalOffs[i].dx, y: pt.y + finalOffs[i].dy }))
      const path = toPath(points, el.closed)

      const paint = (v) => (v === 'currentColor' ? p.ink : v)
      const fill = paint(el.fill ?? p.ink)
      if (fill && fill !== 'none') { ctx.fillStyle = fill; ctx.fill(path) }
      const stroke = paint(el.stroke)
      if (stroke && stroke !== 'none') {
        ctx.strokeStyle = stroke
        ctx.lineWidth = el.strokeWidth || 1
        ctx.stroke(path)
      }
    })
    ctx.restore()
  },
}
