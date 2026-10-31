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
//
// THE EDGE (plan 44 6.1, user 2026-10-30: *"allow growth outside of viewport and limit it in some other way so it just
// sits still, not this jittering"*). By default the line is held 2 units inside the frame — the effect and the generator
// draw on framed paper. `bleed` lets it run that far past every edge instead, and a node outside the frame FREEZES: no
// force, no split, no merge, no growth. The wall the line piled into is gone; what leaves the frame sits still.
//
// THE LINE SETTLES (plan 45 W1, user 2026-10-30: *"it still jitters to helll at the edges, its like a rubber string...
// until a timer is done thhen its just dead. AND the mouse is like just vibratiing EVERYTHING"*). Plan 44's version froze
// nodes by flag and kept a "front" live forever — on a finished orb the whole rim was front: it sprang while growing, every
// mouse move woke the whole rim, and the only stop was a hard cap flag. With `settle` > 0 every node carries a HEAT, 1 → 0:
// it fades by 1/settle a step; its own motion, a split beside it, the pointer (`poke`), or a warm neighbour pressing a
// fifth into its gap raise it. A cold node takes no force and is not resampled; a node's last quarter of heat tapers its
// motion out instead of stopping it; growth eases to nothing over the last 15 % before the cap and ends there, and a
// split's sideways nudge is capped at 0.15 · minGap so the wide-gapped rim is not kicked. Nothing is live forever, nothing
// snaps: the line goes still as its heat fades (`hot` counts the nodes still warm). `settle` 0 is the framed, always-live
// engine; since 2026-10-31 (user: *"Home is best version the other ones were jittery right?"*) the effect and the
// generator settle too (60, Home's), so nothing draws with settle 0 today.

export const SIM_W = 1000

/* THE SLOW WAVE (plan 45 4.3), one definition for Home, the generator and the effect: 24 s a sweep, 9 sim units (1.5 × the
 * tightest gap, so strands never cross), 640 between crests. `ms` is the clock it rides — Home's frame time, the
 * generator's and effect's played time (so a paused stage holds still). */
export const waveAt = (ms) => ({ a: 9, k: (2 * Math.PI) / 640, p: (2 * Math.PI * ms) / 24000 })
/* a clock that only runs while the transport plays — the wave's time in the editor and Labs */
export function playedClock() {
  let t = 0, last = null
  return (playing) => { const now = performance.now(); if (playing && last != null) t += Math.min(100, now - last); last = now; return t }
}
/* heat below this is cold: no force, no resample, no growth, and it does not count as hot */
const COLD = 0.02
/* fewer strands than this within 1.5 gaps, and a node is on the open front (measured: front ~10, packed interior ~20) */
const FRONT = 14
/* THE STEP IS HALVED when settling (plan 45 1.1, measured 2026-10-31): the relaxation as written overshoots — every node
 * reversed direction EVERY step (direction correlation −1.00 over the whole line, 0.9 px in the tight gaps, 2.5 px at
 * the rim), a two-step oscillation that never dies and was every jitter the user saw, the mouse's included. Half the
 * move lands on the balance point instead of past it. The framed engine (settle 0) keeps its full step; nothing uses it
 * since the effect and the generator settle too (2026-10-31) */
const GAIN = 0.5

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
    this.minGap = 5; this.maxGap = 22; this.contrast = 1.4; this.growth = 4; this.bleed = 0; this.settle = 0
    this.x = []; this.y = []; this.heat = []
    /* settling: a stable id per node, kept through splits and merges, so a node can be followed frame to frame */
    this.id = []; this.nid = 0
    /* nodes still warm (settle > 0) — the loop can sleep at 0 */
    this.hot = 0
    this.acc = 0; this.full = false
  }

  setParams({ minGap, maxGap, contrast, growth, cap, bleed, settle }) {
    if (minGap != null) this.minGap = minGap
    if (maxGap != null) this.maxGap = Math.max(maxGap, this.minGap + 0.5)
    if (contrast != null) this.contrast = contrast
    if (growth != null) this.growth = growth
    if (cap != null) this.cap = cap
    if (bleed != null) this.bleed = bleed
    if (settle != null) this.settle = settle
  }

  /* off the frame, with a bleed: frozen */
  out(x, y) {
    return this.bleed > 0 && (x < 0 || y < 0 || x > this.w || y > this.h)
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
    this.heat = new Array(n).fill(1); this.hot = n; this.acc = 0; this.full = false
    this.id = Array.from({ length: n }, (_, i) => i); this.nid = n
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
    const R = this.maxGap, b = this.bleed
    const S = this.settle, K = S > 0 ? 1 - 1 / S : 1
    const heat = S > 0 ? (this.heat.length === n ? this.heat : (this.heat = new Array(n).fill(1))) : null
    /* spatial hash on the largest gap, over the frame and its bleed */
    const cols = Math.ceil((w + 2 * b) / R) + 1, rows = Math.ceil((h + 2 * b) / R) + 1
    const head = new Int32Array(cols * rows).fill(-1)
    const next = new Int32Array(n)
    const cell = (px, py) => Math.min(rows - 1, Math.max(0, Math.floor((py + b) / R))) * cols + Math.min(cols - 1, Math.max(0, Math.floor((px + b) / R)))
    /* a node takes force when it is on the frame and (settling) warm */
    const live = new Uint8Array(n)
    for (let i = 0; i < n; i++) live[i] = this.out(x[i], y[i]) || (heat && heat[i] <= COLD) ? 0 : 1
    for (let i = 0; i < n; i++) { const c = cell(x[i], y[i]); next[i] = head[c]; head[c] = i }
    const gaps = new Float32Array(n)
    for (let i = 0; i < n; i++) gaps[i] = this.gap(x[i], y[i])
    const fx = new Float32Array(n), fy = new Float32Array(n)
    /* a warm node pressing into a neighbour's gap wakes it, by how far it presses (settling only) */
    const wake = heat ? new Float32Array(n) : null
    /* settling: strands within 1.5 gaps of each node — the open front has few, the packed interior ~20 */
    const crowd = heat ? new Uint8Array(n) : null
    for (let i = 0; i < n; i++) {
      if (!live[i]) continue
      const ip = (i - 1 + n) % n, inx = (i + 1) % n
      /* smooth: toward the neighbours' midpoint */
      fx[i] += ((x[ip] + x[inx]) / 2 - x[i]) * 0.35
      fy[i] += ((y[ip] + y[inx]) / 2 - y[i]) * 0.35
      /* repel: every non-adjacent node inside the local gap */
      const gi = gaps[i]
      const cx = Math.floor((x[i] + b) / R), cy = Math.floor((y[i] + b) / R)
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
            if (crowd && d2 < 2.25 * g * g && crowd[i] < 255) crowd[i]++
            if (d2 >= g * g || d2 === 0) continue
            const d = Math.sqrt(d2)
            const push = ((g - d) / g) * 0.5
            fx[i] += (dx / d) * push * g * 0.5
            fy[i] += (dy / d) * push * g * 0.5
            /* a press of a fifth of the gap or more carries heat across, less 0.15 a hop — so a push dies out within six
             * strands instead of travelling the packed line as a pressure wave (the mouse moved nodes 511 px away, 2026-10-31) */
            if (wake) { const v = Math.min(heat[i] - 0.15, heat[i] * ((g - d) / g - 0.2) / 0.8); if (v > 0.1 && v > wake[j]) wake[j] = v }
          }
        }
      }
    }
    const m = b > 0 ? -b : 2
    for (let i = 0; i < n; i++) {
      if (!live[i]) continue
      /* full force while warm; the last quarter of a node's heat tapers its motion out, so nothing stops mid-move */
      const lim = gaps[i] * 0.25, k = heat ? Math.min(1, heat[i] * 4) * GAIN : 1
      const mx = Math.max(-lim, Math.min(lim, fx[i])) * k, my = Math.max(-lim, Math.min(lim, fy[i])) * k
      x[i] = Math.min(w - m, Math.max(m, x[i] + mx))
      y[i] = Math.min(h - m, Math.max(m, y[i] + my))
      /* a node that still moves a tenth of its gap a step is still hot — heat is recent motion */
      if (heat) { const v = Math.min(1, Math.hypot(mx, my) / (0.1 * gaps[i])); if (v > wake[i]) wake[i] = v }
    }
    if (heat) for (let i = 0; i < n; i++) { const v = heat[i] * K; heat[i] = wake[i] > v ? wake[i] : v }
    /* resample: split long edges, merge short ones, then grow */
    const nx = [], ny = [], nh = [], ni = [], nc = []
    const id = heat ? (this.id.length === n ? this.id : (this.id = Array.from({ length: n }, () => this.nid++))) : null
    let budget = this.cap - n
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const g = this.gap(x[i], y[i])
      const dx = x[j] - x[i], dy = y[j] - y[i]
      const len = Math.hypot(dx, dy)
      /* an edge with a frozen or cold end keeps its nodes as they are */
      if (!live[i] || !live[j]) { nx.push(x[i]); ny.push(y[i]); if (heat) { nh.push(heat[i]); ni.push(id[i]); nc.push(255) } continue }
      /* settling, a merge must not leave an edge long enough to split again — a merge/split loop at one spot was the
       * last thing moving on a finished line (10 nodes, 1.5 px, forever; measured 2026-10-31) */
      if (len < g * 0.2 && n > 8 && (!heat || Math.hypot(x[j] - x[(i - 1 + n) % n], y[j] - y[(i - 1 + n) % n]) < g * 0.45)) continue
      nx.push(x[i]); ny.push(y[i]); if (heat) { nh.push(heat[i]); ni.push(id[i]); nc.push(crowd[i]) }
      if (len > g * 0.5 && budget > 0) { nx.push(x[i] + dx / 2); ny.push(y[i] + dy / 2); if (heat) { nh.push(Math.max(heat[i], heat[j])); ni.push(this.nid++); nc.push(crowd[i]) } budget-- }
    }
    if (!heat) {
      for (let k = 0; k < this.growth && nx.length < this.cap; k++) {
        const i = Math.floor(this.rand() * nx.length), j = (i + 1) % nx.length
        if (this.out(nx[i], ny[i]) || this.out(nx[j], ny[j])) continue
        /* a split nudged sideways starts a new fold */
        const dx = nx[j] - nx[i], dy = ny[j] - ny[i]
        const s = (this.rand() - 0.5) * 0.6
        nx.splice(i + 1, 0, nx[i] + dx / 2 - dy * s)
        ny.splice(i + 1, 0, ny[i] + dy / 2 + dx * s)
      }
      this.x = nx; this.y = ny
      return
    }
    /* SETTLING GROWTH — the differential-growth rule (plan 45, user 2026-10-31: *"the growth starts well but plateaus early
     * at a small size … then 4 minutes later it reaches the edges"*): every edge on the open FRONT (both ends warm, fewer than
     * FRONT strands within 1.5 gaps) splits with chance `growth`/100 a step. Random splits anywhere wasted most of the budget
     * on the cooled interior, where nothing can move — the rim crawled and the nodes ran out before the edges. The front's
     * length grows with the line, so the rim advances at a steady pace instead of stalling. Once the cap is reached the
     * splits stop for good (merges may drop the count under it; refilling it forever was the churn). The sideways nudge is
     * capped so a wide-gapped edge (the rim) is not kicked */
    if (nx.length >= this.cap) this.full = true
    if (!this.full) {
      const p = this.growth / 100, kick = 0.15 * this.minGap
      const front = []; let open = 0
      for (let i = 0; i < nx.length; i++) {
        const j = (i + 1) % nx.length
        if (nh[i] > COLD && nh[j] > COLD && nc[i] < FRONT && nc[j] < FRONT && !this.out(nx[i], ny[i]) && !this.out(nx[j], ny[j])) { open++; if (this.rand() < p) front.push(i) }
      }
      /* the front has run off the frame: the line has filled what it can reach — done, cap or not */
      if (open === 0 && nx.length > 200) this.full = true
      /* back to front, so an insert never shifts an index still to come */
      for (let q = front.length - 1; q >= 0 && nx.length < this.cap; q--) {
        const i = front[q], j = (i + 1) % nx.length
        const dx = nx[j] - nx[i], dy = ny[j] - ny[i]
        let s = (this.rand() - 0.5) * 0.6
        const len = Math.hypot(dx, dy) || 1
        if (Math.abs(s) * len > kick) s = Math.sign(s) * kick / len
        nx.splice(i + 1, 0, nx[i] + dx / 2 - dy * s)
        ny.splice(i + 1, 0, ny[i] + dy / 2 + dx * s)
        nh.splice(i + 1, 0, 1); nh[i] = 1; nh[(i + 2) % nh.length] = 1; ni.splice(i + 1, 0, this.nid++); nc.splice(i + 1, 0, nc[i])
      }
    }
    let hot = 0
    for (let i = 0; i < nh.length; i++) if (nh[i] > COLD) hot++
    this.x = nx; this.y = ny; this.heat = nh; this.hot = hot; this.id = ni
  }

  /* THE POINTER AS A FORCE (sim units) — penrose/common.js's verbs on this line: a move pushes the nodes out of a ring
   * around (px, py), a press blasts (3× reach, 6× strength, capped at 3% of the frame a step so it reads as a shove, not
   * a teleport). The line's own smoothing and spacing refold the crater; `amount` 0 turns it off. Settling, a push is
   * capped under half the tightest gap, so it can never carry a node across a strand, and it heats what it moves. */
  poke(px, py, down = false, amount = 1) {
    if (!amount) return
    const { x, y, w, h } = this, s = Math.min(w, h), m = this.bleed > 0 ? -this.bleed : 2
    const heat = this.settle > 0 && this.heat.length === x.length ? this.heat : null
    /* settling, a hover reaches as far as a press, three times the old brush, and fades out soft (plan 45 1.4, user
     * 2026-10-31: *"the mouse radius is so small it should be bigger and more blurry"*) */
    const reach = s * (heat && !down ? 0.24 : 0.08) * (down ? 3 : 1), r2 = reach * reach
    let strength = Math.min(s * 0.03, s * 0.006 * amount * (down ? 6 : 1))
    /* settling, a hover is a nudge (under a third of the tightest gap a frame, user 2026-10-31: *"mouse hover applies too much
     * affect?"*) — at half a gap it crammed strands into each other; a press may shove up to half a gap */
    if (heat) strength = Math.min(strength, (down ? 0.45 : 0.3) * this.minGap)
    let hot = this.hot
    for (let i = 0; i < x.length; i++) {
      const dx = x[i] - px, dy = y[i] - py, d2 = dx * dx + dy * dy
      if (d2 >= r2 || d2 < 1e-6 || this.out(x[i], y[i])) continue
      /* settling, the falloff is a bell — (1 − d²/r²)², no edge at the rim — instead of the linear cone */
      const d = Math.sqrt(d2), q = 1 - d2 / r2, fall = heat ? q * q : 1 - d / reach, f = fall * strength
      x[i] = Math.min(w - m, Math.max(m, x[i] + (dx / d) * f))
      y[i] = Math.min(h - m, Math.max(m, y[i] + (dy / d) * f))
      if (heat) { const v = fall; if (v > heat[i]) { if (heat[i] <= COLD && v > COLD) hot++; heat[i] = v } }
    }
    this.hot = hot
  }

  /* the one path, scaled onto a w × h frame */
  draw(ctx, fw, fh, { ink = '#111', paper = null, width = 1.2, wave = null } = {}) {
    if (paper) { ctx.fillStyle = paper; ctx.fillRect(0, 0, fw, fh) }
    let { x, y } = this
    const n = x.length
    /* a slow wave (plan 45 4.3): the drawn line is displaced by two crossed sines — `a` px, `k` rad/px, phase `p` — and
     * the sim itself never moves, so a resting line still drifts at no cost to the step */
    if (wave && n) {
      const { a, k, p } = wave, wx = new Float32Array(n), wy = new Float32Array(n)
      for (let i = 0; i < n; i++) { wx[i] = x[i] + a * Math.sin(k * y[i] + p); wy[i] = y[i] + a * Math.sin(k * x[i] + p * 1.3 + 1) }
      x = wx; y = wy
    }
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
