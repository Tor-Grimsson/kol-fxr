// The growing line (plan 43 W4) — differential growth: ONE closed line that grows, folds and never crosses itself,
// packing tighter where a density field is darker. The reference is algorigraph's plotted portraits (user 2026-10-28:
// *"a single elastic loop morphs into the shapes of a…"*). The generator (growthLine.js) feeds it a built-in image;
// the effect (filters/fxGrowth.js) feeds it the layer's own photo. Both draw it the same way: one path, ink on paper.
//
// A step: every node is pulled toward its neighbours' midpoint (smooth), pushed off every non-adjacent node closer than
// the local spacing (no crossings, even gaps), held inside the frame; edges longer than half the spacing split, shorter
// than a fifth merge, and `growth` random edges split per step so the line keeps lengthening until the node cap.
// Spacing is local: `minGap` where the density is 1, `maxGap` where it is 0. Units are sim px — the sim is 1000 wide
// and as tall as the frame's aspect, scaled to the frame at draw.

export const SIM_W = 1000

/* density from any canvas: 1 − luma, on a grid `cols` wide, lightly blurred so the spacing changes smoothly */
export function densityFrom(canvas, cols = 160, invert = false) {
  const rows = Math.max(1, Math.round(cols * canvas.height / canvas.width))
  const c = document.createElement('canvas')
  c.width = cols; c.height = rows
  const g = c.getContext('2d', { willReadFrequently: true })
  g.filter = 'blur(1px)'
  g.drawImage(canvas, 0, 0, cols, rows)
  const d = g.getImageData(0, 0, cols, rows).data
  const out = new Float32Array(cols * rows)
  for (let i = 0; i < out.length; i++) {
    const j = i * 4
    const a = d[j + 3] / 255
    /* transparent reads as paper */
    const lum = ((0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 255) * a + (1 - a)
    out[i] = invert ? lum : 1 - lum
  }
  return { cols, rows, data: out }
}

export class Growth {
  constructor({ w = SIM_W, h = SIM_W, density = null, rand = Math.random, cap = 6000 }) {
    this.w = w; this.h = h
    this.density = density
    this.rand = rand
    this.cap = cap
    this.minGap = 5; this.maxGap = 22; this.contrast = 1.4; this.growth = 4
    this.x = []; this.y = []
  }

  setParams({ minGap, maxGap, contrast, growth, cap }) {
    if (minGap != null) this.minGap = minGap
    if (maxGap != null) this.maxGap = Math.max(maxGap, this.minGap + 0.5)
    if (contrast != null) this.contrast = contrast
    if (growth != null) this.growth = growth
    if (cap != null) this.cap = cap
  }

  /* a small ring of nodes — at (cx, cy) in 0..1, or at the field's centre of darkness */
  seed(cx, cy, r = 14) {
    if (cx == null && this.density) {
      const { cols, rows, data } = this.density
      let sx = 0, sy = 0, sw = 0
      for (let i = 0; i < data.length; i++) { const v = data[i] * data[i]; sx += v * (i % cols); sy += v * Math.floor(i / cols); sw += v }
      if (sw > 0) { cx = (sx / sw + 0.5) / cols; cy = (sy / sw + 0.5) / rows }
    }
    cx = (cx ?? 0.5) * this.w; cy = (cy ?? 0.5) * this.h
    const n = 24
    this.x = []; this.y = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      this.x.push(cx + Math.cos(a) * r); this.y.push(cy + Math.sin(a) * r)
    }
  }

  dens(x, y) {
    const D = this.density
    if (!D) return 0.5
    const c = Math.min(D.cols - 1, Math.max(0, Math.floor((x / this.w) * D.cols)))
    const r = Math.min(D.rows - 1, Math.max(0, Math.floor((y / this.h) * D.rows)))
    return D.data[r * D.cols + c]
  }

  gap(x, y) {
    const d = Math.pow(Math.min(1, Math.max(0, this.dens(x, y))), 1 / this.contrast)
    return this.maxGap + (this.minGap - this.maxGap) * d
  }

  step() {
    const { x, y, w, h } = this
    let n = x.length
    if (n < 3) return
    const R = this.maxGap
    /* spatial hash on the largest gap */
    const cols = Math.ceil(w / R) + 1, rows = Math.ceil(h / R) + 1
    const head = new Int32Array(cols * rows).fill(-1)
    const next = new Int32Array(n)
    const cell = (px, py) => Math.min(rows - 1, Math.max(0, Math.floor(py / R))) * cols + Math.min(cols - 1, Math.max(0, Math.floor(px / R)))
    for (let i = 0; i < n; i++) { const c = cell(x[i], y[i]); next[i] = head[c]; head[c] = i }
    const gaps = new Float32Array(n)
    for (let i = 0; i < n; i++) gaps[i] = this.gap(x[i], y[i])
    const fx = new Float32Array(n), fy = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const ip = (i - 1 + n) % n, inx = (i + 1) % n
      /* smooth: toward the neighbours' midpoint */
      fx[i] += ((x[ip] + x[inx]) / 2 - x[i]) * 0.35
      fy[i] += ((y[ip] + y[inx]) / 2 - y[i]) * 0.35
      /* repel: every non-adjacent node inside the local gap */
      const gi = gaps[i]
      const cx = Math.floor(x[i] / R), cy = Math.floor(y[i] / R)
      for (let oy = -1; oy <= 1; oy++) {
        const ry = cy + oy
        if (ry < 0 || ry >= rows) continue
        for (let ox = -1; ox <= 1; ox++) {
          const rx = cx + ox
          if (rx < 0 || rx >= cols) continue
          for (let j = head[ry * cols + rx]; j !== -1; j = next[j]) {
            if (j === i || j === ip || j === inx) continue
            const dx = x[i] - x[j], dy = y[i] - y[j]
            const g = (gi + gaps[j]) / 2
            const d2 = dx * dx + dy * dy
            if (d2 >= g * g || d2 === 0) continue
            const d = Math.sqrt(d2)
            const push = ((g - d) / g) * 0.5
            fx[i] += (dx / d) * push * g * 0.5
            fy[i] += (dy / d) * push * g * 0.5
          }
        }
      }
    }
    const m = 2
    for (let i = 0; i < n; i++) {
      const lim = gaps[i] * 0.25
      x[i] = Math.min(w - m, Math.max(m, x[i] + Math.max(-lim, Math.min(lim, fx[i]))))
      y[i] = Math.min(h - m, Math.max(m, y[i] + Math.max(-lim, Math.min(lim, fy[i]))))
    }
    /* resample: split long edges, merge short ones, then grow */
    const nx = [], ny = []
    let budget = this.cap - n
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const g = this.gap(x[i], y[i])
      const dx = x[j] - x[i], dy = y[j] - y[i]
      const len = Math.hypot(dx, dy)
      if (len < g * 0.2 && n > 8) continue
      nx.push(x[i]); ny.push(y[i])
      if (len > g * 0.5 && budget > 0) { nx.push(x[i] + dx / 2); ny.push(y[i] + dy / 2); budget-- }
    }
    for (let k = 0; k < this.growth && nx.length < this.cap; k++) {
      const i = Math.floor(this.rand() * nx.length), j = (i + 1) % nx.length
      /* a split nudged sideways starts a new fold */
      const dx = nx[j] - nx[i], dy = ny[j] - ny[i]
      const s = (this.rand() - 0.5) * 0.6
      nx.splice(i + 1, 0, nx[i] + dx / 2 - dy * s)
      ny.splice(i + 1, 0, ny[i] + dy / 2 + dx * s)
    }
    this.x = nx; this.y = ny
  }

  /* the one path, scaled onto a w × h frame */
  draw(ctx, fw, fh, { ink = '#111', paper = null, width = 1.2 } = {}) {
    if (paper) { ctx.fillStyle = paper; ctx.fillRect(0, 0, fw, fh) }
    const { x, y } = this
    const n = x.length
    if (n < 3) return
    const sx = fw / this.w, sy = fh / this.h
    ctx.beginPath()
    /* through the edge midpoints with the nodes as control points — a smooth closed curve */
    const mx = (i) => ((x[i] + x[(i + 1) % n]) / 2) * sx, my = (i) => ((y[i] + y[(i + 1) % n]) / 2) * sy
    ctx.moveTo(mx(n - 1), my(n - 1))
    for (let i = 0; i < n; i++) ctx.quadraticCurveTo(x[i] * sx, y[i] * sy, mx(i), my(i))
    ctx.closePath()
    ctx.strokeStyle = ink
    ctx.lineWidth = width
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  /* the same path as one SVG `d`, in frame units */
  pathD(fw, fh) {
    const { x, y } = this
    const n = x.length
    if (n < 3) return ''
    const sx = fw / this.w, sy = fh / this.h, f = (v) => v.toFixed(2)
    const mx = (i) => f(((x[i] + x[(i + 1) % n]) / 2) * sx), my = (i) => f(((y[i] + y[(i + 1) % n]) / 2) * sy)
    let d = `M${mx(n - 1)} ${my(n - 1)}`
    for (let i = 0; i < n; i++) d += `Q${f(x[i] * sx)} ${f(y[i] * sy)} ${mx(i)} ${my(i)}`
    return d + 'Z'
  }
}
