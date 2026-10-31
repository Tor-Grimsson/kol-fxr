// Pendulum wave (plan 51 W1, the user's reference: "WAIT FOR ALL 100 TO SYNC · watch the ripples").
// Pendulum k of N swings exactly (n₀ + k) times per loop, so its angle is θₖ(u) = A·cos(2π(n₀ + k)·u) on the loop
// clock u ∈ [0, 1] — pure maths, no simulation. All of them line up at u = 0 and 1 (the loop is seamless), and at
// u = p/q their phases fall into q groups: the ripples, then the sync. A bob glows while ≥ 3 others share its phase.

const TAU = Math.PI * 2

/* phase of pendulum k at u, in [0, 2π) */
const phaseOf = (k, n0, u) => {
  const c = (n0 + k) * u
  return TAU * (c - Math.floor(c))
}
/* circular distance between two phases */
const dPhase = (a, b) => { const d = Math.abs(a - b) % TAU; return d > Math.PI ? TAU - d : d }

/* the order parameter R(u) = |1/N Σ e^{iφₖ}| — 1 when all in phase */
export function orderParam(N, n0, u) {
  let re = 0, im = 0
  for (let k = 0; k < N; k++) { const f = phaseOf(k, n0, u); re += Math.cos(f); im += Math.sin(f) }
  return Math.hypot(re, im) / N
}

let rCurve = null // { key, vals } — R over one loop, sampled once per (N, n₀)

export default {
  id: 'math-pendulum',
  label: 'Pendulum wave',
  group: 'math',
  kind: '2d',
  duration: 60,
  params: [
    { key: 'bg', label: 'Background', type: 'color', role: 'bg', default: '#0c0d1c' },
    { key: 'ink', label: 'Pendulums', type: 'color', role: 'fg', default: '#d9dbe6' },
    { key: 'glowCol', label: 'Glow', type: 'color', role: 'accent', default: '#f0a23a' },
    { key: 'count', label: 'Count', type: 'range', min: 16, max: 144, step: 1, default: 100, tab: 'generate', noRandom: true },
    { key: 'layout', label: 'Layout', type: 'select', options: [{ value: 'grid', label: 'Grid' }, { value: 'row', label: 'Row' }], default: 'grid', tab: 'generate' },
    { key: 'n0', label: 'Base swings', type: 'range', min: 4, max: 80, step: 1, default: 30, tab: 'generate' },
    { key: 'amp', label: 'Amplitude', type: 'range', min: 5, max: 60, step: 1, default: 28, tab: 'generate' },
    { key: 'rod', label: 'Rod length', type: 'range', min: 0.3, max: 0.9, step: 0.05, default: 0.6, tab: 'generate' },
    { key: 'bob', label: 'Bob size', type: 'range', min: 0.05, max: 0.3, step: 0.01, default: 0.19, tab: 'generate' },
    { key: 'tol', label: 'Glow tolerance', type: 'range', min: 0.02, max: 0.4, step: 0.01, default: 0.08 },
    { key: 'showSync', label: 'Show sync', type: 'toggle', default: false },
  ],
  draw(ctx, u, w, h, p) {
    const N = Math.max(1, Math.round(p.count ?? 100))
    const n0 = Math.round(p.n0 ?? 30)
    const A = ((p.amp ?? 28) * Math.PI) / 180
    const sync = !!p.showSync
    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)

    /* layout: the grid fills the frame above the sync strip (when shown) */
    const m = Math.min(w, h) * 0.07
    const top = m, left = m, gw = w - 2 * m
    const gh = (sync ? h * 0.74 : h) - 2 * m
    const row = p.layout === 'row'
    const cols = row ? N : Math.ceil(Math.sqrt(N)) /* 100 → 10 × 10, his reference */
    const rows = Math.ceil(N / cols)
    const cw = gw / cols, ch = gh / rows
    const L = ch * (p.rod ?? 0.6)
    const br = Math.max(1.5, (row ? cw : Math.min(cw, ch)) * (p.bob ?? 0.17))
    const lw = Math.max(1, br * 0.18)

    const ph = new Float64Array(N)
    for (let k = 0; k < N; k++) ph[k] = phaseOf(k, n0, u)
    /* a bob glows while ≥ 3 others share its phase (his orange "group" highlight). O(N²) at ≤ 144 — 20k compares. */
    const tol = p.tol ?? 0.12
    const glow = new Uint8Array(N)
    for (let a = 0; a < N; a++) {
      let c = 0
      for (let b = 0; b < N && c < 3; b++) if (a !== b && dPhase(ph[a], ph[b]) < tol) c++
      glow[a] = c >= 3 ? 1 : 0
    }

    const pos = (k) => {
      const ci = k % cols, ri = (k / cols) | 0
      const px = left + (ci + 0.5) * cw
      const py = top + ri * ch + (row ? 0 : ch * 0.06)
      if (row) {
        /* THE CLASSIC ROW: a rod's length follows its swing rate (period ∝ √L, so L ∝ 1/(n₀+k)²) — the bobs hang on a
           curve — and each swings under half a spacing, so neighbouring rods never cross */
        const Lk = gh * (p.rod ?? 0.6) * ((n0 + 1) / (n0 + 1 + k)) ** 2
        const Ak = Math.min(A, Math.asin(Math.min(1, (cw * 0.45) / Lk)))
        const th = Ak * Math.cos(ph[k])
        return [px, py, px + Math.sin(th) * Lk, py + Math.cos(th) * Lk]
      }
      const th = A * Math.cos(ph[k])
      return [px, py, px + Math.sin(th) * L, py + Math.cos(th) * L]
    }

    /* rods + pivots, one path */
    ctx.strokeStyle = p.ink
    ctx.globalAlpha = 0.55
    ctx.lineWidth = lw
    ctx.beginPath()
    for (let k = 0; k < N; k++) { const [x0, y0, x1, y1] = pos(k); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1) }
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fillStyle = p.ink
    ctx.beginPath()
    for (let k = 0; k < N; k++) { const [x0, y0] = pos(k); ctx.moveTo(x0 + lw, y0); ctx.arc(x0, y0, lw, 0, TAU) }
    ctx.fill()

    /* halos behind the glowing bobs, then the bobs */
    ctx.fillStyle = p.glowCol
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    for (let k = 0; k < N; k++) if (glow[k]) { const [, , x, y] = pos(k); ctx.moveTo(x + br * 1.9, y); ctx.arc(x, y, br * 1.9, 0, TAU) }
    ctx.fill()
    ctx.globalAlpha = 1
    /* a lit bob keeps its colour and wears the glow as a ring + halo (his frames) */
    ctx.fillStyle = p.ink
    ctx.beginPath()
    for (let k = 0; k < N; k++) { const [, , x, y] = pos(k); ctx.moveTo(x + br, y); ctx.arc(x, y, br, 0, TAU) }
    ctx.fill()
    ctx.strokeStyle = p.glowCol
    ctx.lineWidth = Math.max(1, br * 0.32)
    ctx.beginPath()
    for (let k = 0; k < N; k++) if (glow[k]) { const [, , x, y] = pos(k); ctx.moveTo(x + br, y); ctx.arc(x, y, br, 0, TAU) }
    ctx.stroke()

    if (!sync) return
    /* THE SYNC READOUT (plan 51 1.2): the phases as dots on a ring, and R(u) over the loop with a cursor */
    const sy = h * 0.74, sh = h - sy - m * 0.6
    const ringR = Math.min(sh * 0.42, w * 0.08)
    const rcx = left + ringR + 2, rcy = sy + sh / 2
    ctx.strokeStyle = p.ink
    ctx.globalAlpha = 0.25
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(rcx, rcy, ringR, 0, TAU); ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fillStyle = p.glowCol
    ctx.beginPath()
    const dr = Math.max(1.5, ringR * 0.06)
    for (let k = 0; k < N; k++) { const x = rcx + Math.cos(ph[k]) * ringR, y = rcy + Math.sin(ph[k]) * ringR; ctx.moveTo(x + dr, y); ctx.arc(x, y, dr, 0, TAU) }
    ctx.fill()

    const key = `${N}|${n0}`
    if (rCurve?.key !== key) {
      const S = 600, vals = new Float32Array(S + 1)
      for (let i = 0; i <= S; i++) vals[i] = orderParam(N, n0, i / S)
      rCurve = { key, vals }
    }
    const px0 = rcx + ringR + m * 0.8, px1 = w - m, py0 = sy + sh * 0.1, py1 = sy + sh * 0.9
    ctx.strokeStyle = p.ink
    ctx.globalAlpha = 0.3
    ctx.beginPath(); ctx.moveTo(px0, py1); ctx.lineTo(px1, py1); ctx.moveTo(px0, py0); ctx.lineTo(px0, py1); ctx.stroke()
    ctx.globalAlpha = 1
    ctx.strokeStyle = p.glowCol
    ctx.lineWidth = Math.max(1, lw * 0.8)
    ctx.beginPath()
    const vals = rCurve.vals, S = vals.length - 1
    for (let i = 0; i <= S; i++) { const x = px0 + (i / S) * (px1 - px0), y = py1 - vals[i] * (py1 - py0); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
    ctx.stroke()
    const cxu = px0 + u * (px1 - px0), cyu = py1 - orderParam(N, n0, u) * (py1 - py0)
    ctx.fillStyle = p.ink
    ctx.beginPath(); ctx.arc(cxu, cyu, Math.max(2, lw * 1.6), 0, TAU); ctx.fill()
  },
}
