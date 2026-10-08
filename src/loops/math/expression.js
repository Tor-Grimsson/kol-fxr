/**
 * Expression — the labs /math index tool (the Oscilloscope): a text-DSL
 * curve scoped against the 0–100 knob range. Ported from kol-labs-single
 * math/expression/ (Oscilloscope.jsx drawing + lib/expr.js compiler).
 *
 * The compiler is DISTINCT from editor expr.js on purpose (labs keeps the
 * same split): these helpers are UNIPOLAR ×max — a bare wave(t)/saw(t)
 * reads 0–100 against the red reference lines — while editor expr.js is
 * the normalized 0..1 modulation DSL, and mathfn.js is raw geometry.
 *
 * PURE IN u — the scope window is p.sec seconds and the playhead sweeps it
 * once per loop (labs restarts the trace each window; the loop point IS
 * that restart). Labs' zoom/pan is dropped: the frame is the viewport and
 * `margin` covers labs' pad. `ofs` pans the sampled time window.
 *
 * SAFETY — mathfn's two-gate pattern in front of the Function sink
 * (math-only characters + identifier allowlist, so `sin.constructor(...)`
 * dies at the gate), and a compiled fn never throws and never returns a
 * non-finite value (last-good fallback, labs behavior).
 */

const TAU = Math.PI * 2

/* ── labs lib/expr.js MATH_HELPERS, verbatim ─────────────────────────── */
const HELPERS = `
  "use strict";
  var sin=Math.sin,cos=Math.cos,abs=Math.abs,floor=Math.floor,ceil=Math.ceil,
      round=Math.round,sqrt=Math.sqrt,pow=Math.pow,PI=Math.PI,PHI=1.618033988749895,
      wave=function(x){return(sin(x)*0.5+0.5)*max},
      saw=function(x){return(x%1)*max},
      pulse=function(x,w){w=w||0.5;var p=((x%1)+1)%1;return p<w?max:0},
      rand=function(){return Math.random()*max},
      tri=function(x){var p=((x%1)+1)%1;return(p<0.5?p*2:(1-p)*2)*max},
      ease=function(x,c){c=c||2;var p=((x%1)+1)%1;var v=p<0.5?p*2:(1-p)*2;return pow(v,c)*max},
      bell=function(x){var p=((x%1)+1)%1;return Math.exp(-pow((p-0.5)*6,2))*max},
      exp=function(x){var p=((x%1)+1)%1;return(Math.exp(p*3)-1)/(Math.exp(3)-1)*max},
      log=function(x){var p=((x%1)+1)%1;return Math.log(1+p*9)/Math.log(10)*max},
      step=function(x,n){n=n||4;var p=((x%1)+1)%1;return floor(p*n)/n*max};
`

const ALLOWED = new Set([
  'sin', 'cos', 'abs', 'floor', 'ceil', 'round', 'sqrt', 'pow', 'PI', 'PHI',
  'wave', 'saw', 'pulse', 'rand', 'tri', 'ease', 'bell', 'exp', 'log', 'step',
  't', 'f', 'min', 'max',
])
const CHARS = /^[\w\s+\-*/%(),.?:<>=!&|]+$/
/* Math stays REACHABLE — the helpers build on Math.sin etc. inside the
 * compiled body; the identifier gate keeps `Math` out of user expressions. */
const SHADOWED = [
  'globalThis', 'window', 'self', 'document', 'fetch', 'XMLHttpRequest',
  'localStorage', 'sessionStorage', 'indexedDB', 'navigator', 'location',
  'top', 'parent', 'frames', 'opener', 'Function', 'WebSocket', 'Worker',
  'importScripts',
]

const cache = new Map()
/** compile(expr) -> { ok, fn(t, f, min, max) } — never throws, never non-finite. */
function compile(str) {
  const key = String(str)
  const hit = cache.get(key)
  if (hit) return hit
  let entry
  try {
    if (!CHARS.test(key)) throw new Error('chars')
    for (const m of key.matchAll(/[A-Za-z_$][\w$]*/g)) {
      if (!ALLOWED.has(m[0])) throw new Error(`ident ${m[0]}`)
    }
    // eslint-disable-next-line no-new-func
    const raw = new Function('t', 'f', 'min', 'max', ...SHADOWED, `${HELPERS}return (${key});`)
    const probe = raw(1, 60, 0, 100)
    if (typeof probe !== 'number') throw new Error('not numeric')
    let last = 0
    entry = {
      ok: true,
      fn: (t, f, min, max) => {
        try {
          const v = raw(t, f, min, max)
          if (typeof v === 'number' && Number.isFinite(v)) { last = v; return v }
          return last
        } catch { return last }
      },
    }
  } catch {
    entry = { ok: false, fn: () => 0 }
  }
  cache.set(key, entry)
  return entry
}

const hexToRgb = (hex) => {
  const n = parseInt(String(hex).replace('#', ''), 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

/* ── seeded expression generators ────────────────────────────────────────
 * randomExpression — a draw from the curated pool (labs' EXAMPLES rows):
 * the Expression scope chip and Randomize all both land here via the
 * schema `roll` hook. wildExpression — a procedural compositor over the
 * DSL grammar: nested rates, blended/gated/normalized-product templates.
 * Every emitted string is valid by construction and stays ~0..max scale
 * (products divide by max; blends use convex weights). */
const POOL = [
  'wave(t*2)', 'saw(t)*0.8', 'tri(t*0.5)', 'ease(t*2, 4)', 'pulse(t*3)',
  'pulse(t, 0.3)', 'sin(t)*30+50', 'abs(sin(t*3))*max', 't*20 % max',
  'exp(t)', 'log(t)', 'bell(t)', 'step(t, 4)', 'step(t, 8)',
  'exp(t)*0.5+25', 'bell(t*2)', 'wave(t)+saw(t*2)*0.3', 'tri(t)*pulse(t*4)',
  'step(t, 6)*0.8+10', 'ease(t*0.3, 3)*0.6+20',
]
export const randomExpression = (rng) => POOL[Math.floor(rng() * POOL.length)]

/* Fit — labs' fit verbatim (ExpressionPage.jsx:181): auto-range the bounds
 * to the curve's extent (10% margin), sampled over the window. The eval is
 * ALWAYS (min 0, max 100) — the knob range is the helpers' fixed scale and
 * the bounds are only the viewport, so fitting cannot feed back. */
export function fitBounds(layer) {
  const { fn } = compile(layer.expr ?? 'wave(t)')
  const sec = Number(layer.sec) || 5
  const ofs = Number(layer.ofs) || 0
  let lo = Infinity
  let hi = -Infinity
  /* Sample density scales with the window — labs' fixed 300 points alias on
   * long windows (30s ⇒ 0.1s steps miss a 0.5s ease spike's tip entirely;
   * 2026-08-09). 240/s keeps ~100+ samples per period up to rate ~2.5. */
  const N = Math.min(20000, Math.max(300, Math.round(sec * 240)))
  for (let i = 0; i <= N; i++) {
    const t = ofs + (i / N) * sec
    const v = fn(t, Math.round(t * 60), 0, 100)
    if (Number.isFinite(v)) {
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
  }
  if (lo === Infinity) return {}
  if (!(hi > lo)) { lo -= 1; hi += 1 }
  /* Headroom on Y ONLY (user ruling): 10% above/below so the trace stroke
   * isn't clipped at the extremes. X never pads — the window spans edge to
   * edge. Zooms return to 1 — they magnify ON TOP of the bounds, so a fit
   * under zoom would frame the curve and then re-blow it up (2026-08-09). */
  const m = (hi - lo) * 0.1
  return { min: Math.floor(lo - m), max: Math.ceil(hi + m), zoomX: 1, zoomY: 1 }
}

export function wildExpression(rng) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)]
  const rate = () => pick(['0.25', '0.5', '1', '1.5', '2', '3', '4', '5'])
  const osc = (depth) => {
    const f = pick(['wave', 'saw', 'tri', 'pulse', 'ease', 'bell', 'step', 'sin'])
    /* Nested modulation: the rate itself wobbles with an inner oscillator. */
    const arg = depth > 0 && rng() < 0.4
      ? `t*${rate()} + ${osc(depth - 1)}*${pick(['2', '3', '5'])}/max`
      : `t*${rate()}`
    if (f === 'pulse') return rng() < 0.5 ? `pulse(${arg}, ${pick(['0.2', '0.3', '0.5', '0.7'])})` : `pulse(${arg})`
    if (f === 'ease') return `ease(${arg}, ${pick(['0.5', '2', '3', '4', '6'])})`
    if (f === 'step') return `step(${arg}, ${pick(['3', '4', '6', '8', '12'])})`
    if (f === 'sin') return `abs(sin(${arg}))*max`
    return `${f}(${arg})`
  }
  const a = osc(1)
  const b = osc(1)
  return pick([
    () => a,
    () => `(${a} + ${b})*0.5`,
    () => `${a}*0.7 + ${b}*0.3`,
    () => `${a}*${b}/max`,
    () => `abs(${a} - ${b})`,
    () => `${a}*pulse(t*${rate()})/max`,
  ])()
}

export default {
  id: 'math-expression',
  label: 'Oscilloscope',
  group: 'math',
  /* An instrument, not a visual — the randomiser's Generate flow skips
   * tool presets (registry isToolPreset). Labs/desktop still list it. */
  tool: true,
  kind: '2d',
  duration: 5,
  params: [
    /* The roll hook draws from the curated pool — the Expression chip and
     * Randomize all both swap the expression; Wild (the panel's second
     * button) uses the procedural compositor. */
    { key: 'expr', label: 'Expression', type: 'text', rows: 2, default: 'wave(t)', placeholder: 'wave(t*2)', roll: randomExpression, section: 'Expression' },
    /* Bounds fold into View (user call — one knob section, one boring
     * chip). `max` stays labs' knob-range idiom: the helpers' scale AND
     * the red reference ceiling. */
    { key: 'min', label: 'Min', type: 'range', min: -100, max: 100, step: 1, default: 0, section: 'View' },
    { key: 'max', label: 'Max', type: 'range', min: 1, max: 200, step: 1, default: 100, section: 'View' },
    { key: 'sec', label: 'Window', type: 'range', min: 1, max: 30, step: 1, default: 5, section: 'View' },
    { key: 'ofs', label: 'Offset', type: 'range', min: -10, max: 10, step: 0.1, default: 0, section: 'View' },
    { key: 'margin', label: 'Margin', type: 'range', min: 0, max: 120, step: 1, default: 0, section: 'View' },
    /* Labs' View X/Y zooms (its Scale slider is just a set-both convenience
     * over these two — not real state, so it has no param here). */
    { key: 'zoomX', label: 'X', type: 'range', min: 0.1, max: 10, step: 0.1, default: 1, section: 'View' },
    { key: 'zoomY', label: 'Y', type: 'range', min: 0.1, max: 10, step: 0.1, default: 1, section: 'View' },
    { key: 'axis', label: 'Axis', type: 'select', default: 'grid', section: 'View',
      options: [{ value: 'grid', label: 'Grid' }, { value: 'none', label: 'None' }] },
    { key: 'gridOpacity', label: 'Grid opacity', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0.1, section: 'View', when: (l) => l.axis !== 'none' },
    { key: 'gridWeight', label: 'Grid weight', type: 'range', min: 0.5, max: 3, step: 0.1, default: 1, section: 'View' },
    { key: 'traceWeight', label: 'Trace weight', type: 'range', min: 0.5, max: 6, step: 0.1, default: 2, section: 'View' },
    { key: 'bg', label: 'Background', type: 'color', role: 'bg', default: '#121215', section: 'Color' },
    { key: 'fg', label: 'Trace', type: 'color', role: 'fg', default: '#faf7f0', section: 'Color' },
    { key: 'gridColor', label: 'Grid color', type: 'color', default: '#faf7f0', section: 'Color' },
  ],
  draw(ctx, u, w, h, p) {
    const { fn } = compile(p.expr ?? 'wave(t)')
    const mn = Number(p.min) || 0
    const mx = Number(p.max) || 100
    const sec = Number(p.sec) || 5
    const ofs = Number(p.ofs) || 0
    const pad = Number(p.margin) || 0
    const stroke = p.fg ?? '#faf7f0'
    const strokeRgb = hexToRgb(stroke)
    const weight = p.traceWeight ?? 2
    const uiWeight = p.gridWeight ?? 1
    const gridOn = p.axis !== 'none'
    const gridCol = hexToRgb(p.gridColor ?? '#faf7f0')
    const gridOp = p.gridOpacity ?? 0.1

    ctx.fillStyle = p.bg ?? '#121215'
    ctx.fillRect(0, 0, w, h)

    /* Zoom (labs Oscilloscope.jsx): X divides the visible window, Y divides
     * the value range around the bounds' center. */
    const zx = Number(p.zoomX) || 1
    const zy = Number(p.zoomY) || 1
    const dur = sec / zx
    const range = ((mx - mn) / zy) || 1
    const lo = (mn + mx) / 2 - range / 2
    const innerW = Math.max(1, w - pad * 2)
    const innerH = Math.max(1, h - pad * 2)
    const toY = (v) => pad + innerH * (1 - (v - lo) / range)
    const toT = (px) => ((px - pad) / innerW) * dur + ofs
    /* Eval pins (min 0, max 100) — labs' knob range is the helpers' FIXED
     * scale; the min/max params are only the viewport. Feeding the live
     * bounds in here is the Fit feedback loop (2026-08-09). */
    const sample = (t) => fn(t, Math.round(t * 60), 0, 100)

    /* Curve extents for the grid labels (labs samples the visible window). */
    let vMin = Infinity
    let vMax = -Infinity
    for (let i = pad; i < w - pad; i++) {
      const v = sample(toT(i))
      if (v < vMin) vMin = v
      if (v > vMax) vMax = v
    }
    const vMid = (vMin + vMax) / 2

    /* Knob-range 0–100 reference lines (red dashed, labs verbatim). */
    ctx.strokeStyle = 'rgba(231,76,60,0.3)'
    ctx.lineWidth = uiWeight
    ctx.setLineDash([4, 4])
    for (const v of [0, 100]) {
      const y = toY(v)
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.font = '9px "JetBrains Mono", monospace'
    ctx.fillStyle = 'rgba(231,76,60,0.4)'
    ctx.fillText('100', w - pad - 22, toY(100) + 10)
    ctx.fillText('0', w - pad - 12, toY(0) - 4)

    /* Grid lines at the curve's min / mid / max, gated by the axis style. */
    ctx.lineWidth = uiWeight
    ctx.fillStyle = `rgba(${gridCol},${Math.min(1, gridOp * 3)})`
    for (const v of [vMax, vMid, vMin]) {
      const y = toY(v)
      if (gridOn) {
        ctx.strokeStyle = `rgba(${gridCol},${gridOp})`
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke()
      }
      ctx.fillText(Math.round(v), pad + 4, y - 3)
    }

    /* Static curve — the full window, dim. */
    ctx.strokeStyle = `rgba(${strokeRgb},0.15)`
    ctx.lineWidth = uiWeight
    ctx.beginPath()
    for (let i = pad; i < w - pad; i++) {
      const y = toY(sample(toT(i)))
      i === pad ? ctx.moveTo(i, y) : ctx.lineTo(i, y)
    }
    ctx.stroke()

    /* Playhead — u sweeps sec seconds of expression time; zoomed in (zx>1)
     * it exits the frame partway through the loop, labs behavior. */
    const playX = pad + u * zx * innerW
    ctx.strokeStyle = `rgba(${strokeRgb},0.4)`
    ctx.lineWidth = uiWeight
    ctx.beginPath(); ctx.moveTo(playX, pad); ctx.lineTo(playX, h - pad); ctx.stroke()

    /* Live trace up to the playhead + the current-value dot. */
    ctx.strokeStyle = stroke
    ctx.lineWidth = weight
    ctx.beginPath()
    const traceEnd = Math.min(playX, w - pad)
    for (let i = pad; i < traceEnd; i++) {
      const y = toY(sample(toT(i)))
      i === pad ? ctx.moveTo(i, y) : ctx.lineTo(i, y)
    }
    ctx.stroke()
    ctx.fillStyle = stroke
    ctx.beginPath(); ctx.arc(playX, toY(sample(ofs + u * sec)), 3, 0, TAU); ctx.fill()
  },
}

/* ── dev self-check ─────────────────────────────────────────────────── */
if (import.meta.env?.DEV) {
  console.assert(compile('wave(t)').fn(Math.PI / 2, 0, 0, 100) === 100, 'wave scales to max')
  console.assert(compile('t*20 % max').fn(2, 0, 0, 100) === 40, 'max is the knob ceiling')
  console.assert(compile('sin.constructor("1")()').ok === false, 'constructor dies at the gate')
  console.assert(compile('fetch("x")').ok === false, 'non-math idents rejected')
  console.assert(compile('1/0').fn(0, 0, 0, 100) === 0, 'non-finite → last good (0)')
}
