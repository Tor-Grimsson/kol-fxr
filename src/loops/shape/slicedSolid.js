// Sliced solid (plan 51 W2, the user's reference IMG_3106–3113: stacked pink / red / violet ellipses in an oval).
// A solid of revolution — sphere, capsule, dome, hourglass — cut into S horizontal discs and seen from a tilt, so each
// disc draws as an ellipse (ry = rx·sin tilt). The slices drift along the axis by whole slice spacings per loop, so the
// loop is seamless. Translucent discs build the colour where they overlap; a fine line screen and four-point glints on
// the rims finish it.

const TAU = Math.PI * 2

const SHAPES = [
  { value: 'sphere', label: 'Sphere' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'dome', label: 'Dome' },
  { value: 'hourglass', label: 'Hourglass' },
]
/* radius 0–1 at height t (0 = top, 1 = bottom) */
export function profile(shape, t) {
  if (t <= 0 || t >= 1) return 0
  switch (shape) {
    case 'capsule': { const e = 0.28; if (t < e) return Math.sqrt(1 - ((e - t) / e) ** 2); if (t > 1 - e) return Math.sqrt(1 - ((t - 1 + e) / e) ** 2); return 1 }
    case 'dome': return Math.sqrt(Math.max(0, 1 - (1 - t) ** 2)) * (t > 0.97 ? (1 - t) / 0.03 : 1)
    case 'hourglass': return 0.3 + 0.7 * Math.abs(2 * t - 1) ** 1.4
    default: return Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2))
  }
}

const hex = (c) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(c || ''); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255] }
const ramp = (a, b, c, t) => {
  const [x, y, f] = t < 0.5 ? [a, b, t * 2] : [b, c, (t - 0.5) * 2]
  return [0, 1, 2].map((i) => Math.round(x[i] + (y[i] - x[i]) * f))
}
/* a small deterministic hash 0–1 — glints repeat with the loop */
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }

let screen = null // the fine line screen pattern tile

export default {
  id: 'sliced-solid',
  label: 'Sliced solid',
  group: 'shape',
  kind: '2d',
  duration: 12,
  params: [
    { key: 'bg', label: 'Background', type: 'color', role: 'bg', default: '#e6a2e2' },
    { key: 'colA', label: 'Top', type: 'color', role: 'fg', default: '#ff86cf' },
    { key: 'colB', label: 'Middle', type: 'color', role: 'accent', default: '#e3233f' },
    { key: 'colC', label: 'Bottom', type: 'color', role: 'warm', default: '#6b4cff' },
    { key: 'shape', label: 'Shape', type: 'select', options: SHAPES, default: 'sphere', tab: 'generate' },
    { key: 'slices', label: 'Slices', type: 'range', min: 6, max: 60, step: 1, default: 12, tab: 'generate' },
    { key: 'tilt', label: 'Tilt', type: 'range', min: 5, max: 60, step: 1, default: 30, tab: 'generate' },
    { key: 'width', label: 'Width', type: 'range', min: 0.4, max: 1, step: 0.02, default: 0.8, tab: 'generate' },
    { key: 'inner', label: 'Inner shape', type: 'select', options: [{ value: 'none', label: 'None' }, ...SHAPES], default: 'none', tab: 'generate' },
    { key: 'innerScale', label: 'Inner size', type: 'range', min: 0.25, max: 0.8, step: 0.05, default: 0.55, tab: 'generate', when: (l) => l.inner && l.inner !== 'none' },
    { key: 'drift', label: 'Drift', type: 'range', min: -4, max: 4, step: 1, default: 1, tab: 'anim', section: 'Motion' },
    { key: 'discAlpha', label: 'Disc opacity', type: 'range', min: 0.05, max: 0.6, step: 0.01, default: 0.2 },
    { key: 'rim', label: 'Rim', type: 'range', min: 0, max: 1, step: 0.05, default: 0.8 },
    { key: 'texture', label: 'Texture', type: 'range', min: 0, max: 1, step: 0.05, default: 0.35 },
    { key: 'glints', label: 'Glints', type: 'range', min: 0, max: 1, step: 0.05, default: 0.5 },
  ],
  draw(ctx, u, w, h, p) {
    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)
    const S = Math.max(2, Math.round(p.slices ?? 12))
    const tilt = ((p.tilt ?? 30) * Math.PI) / 180
    const sinT = Math.sin(tilt)
    const cx = w / 2
    const R = (w / 2) * (p.width ?? 0.8)
    /* the solid runs the frame's full height, its end discs allowed past the edge — his frames crop the oval top and bottom */
    const sh = h * 0.96
    const y0 = (h - sh) / 2 - R * sinT * 0.5
    const A = hex(p.colA), B = hex(p.colB), C = hex(p.colC)
    /* slices move down one spacing per loop per Drift step — a whole spacing is an identity, so the loop is seamless */
    const phase = (((u * Math.round(p.drift ?? 1)) % 1) + 1) % 1
    const op = p.discAlpha ?? 0.2 /* not `opacity` — that is the layer's own (plan 51 2.1: the whole layer drew at 30 %) */
    const rimA = p.rim ?? 0.8

    /* the silhouette, faint — the oval the discs live in */
    ctx.fillStyle = `rgba(${A[0]},${A[1]},${A[2]},0.18)`
    ctx.beginPath() /* the union of 64 thin slices (nonzero) — the exact envelope */
    for (let i = 1; i < 64; i++) {
      const t = i / 64, r = profile(p.shape, t) * R
      if (r < 1) continue
      const y = y0 + t * sh
      ctx.moveTo(cx + r, y); ctx.ellipse(cx, y, r, r * sinT, 0, 0, TAU)
    }
    ctx.fill()

    const discs = [] // remembered for the glints
    const slab = (shape, scale, dark) => {
      const RR = R * scale, hh = sh * scale, yy = y0 + (sh - hh) * (shape === 'dome' && scale < 1 ? 1 : 0.5)
      for (let i = 0; i < S; i++) {
        const t = (i + phase) / S
        const r = profile(shape, t) * RR
        if (r < 1) continue
        const y = yy + t * hh
        const [cr, cg, cb] = ramp(A, B, C, t).map((v) => (dark ? Math.round(v * 0.55) : v))
        /* each disc shades from a dark back edge to a light front edge (his frames) */
        const a = dark ? Math.min(1, op * 1.8) : op
        const g = ctx.createLinearGradient(0, y - r * sinT, 0, y + r * sinT)
        g.addColorStop(0, `rgba(${cr >> 1},${cg >> 1},${cb >> 1},${Math.min(1, a * 1.6)})`)
        g.addColorStop(0.55, `rgba(${cr},${cg},${cb},${a})`)
        g.addColorStop(1, `rgba(${Math.min(255, cr + 60)},${Math.min(255, cg + 50)},${Math.min(255, cb + 60)},${a})`)
        ctx.fillStyle = g
        ctx.beginPath(); ctx.ellipse(cx, y, r, r * sinT, 0, 0, TAU); ctx.fill()
        if (rimA > 0) {
          /* the back edge reads dark, the front edge catches the light — the discs' rims in his frames */
          ctx.lineWidth = Math.max(1.2, w / 420)
          ctx.strokeStyle = `rgba(${cr >> 1},${cg >> 1},${cb >> 1},${rimA * 0.55})`
          ctx.beginPath(); ctx.ellipse(cx, y, r, r * sinT, 0, Math.PI, TAU); ctx.stroke()
          ctx.strokeStyle = `rgba(${Math.min(255, cr + 80)},${Math.min(255, cg + 70)},${Math.min(255, cb + 80)},${rimA * 0.8})`
          ctx.beginPath(); ctx.ellipse(cx, y, r, r * sinT, 0, 0, Math.PI); ctx.stroke()
        }
        if (!dark) discs.push([y, r])
      }
    }
    slab(p.shape, 1, false)
    if (p.inner && p.inner !== 'none') slab(p.inner, p.innerScale ?? 0.55, true)

    /* THE LINE SCREEN (plan 51 2.2, IMG_3108's woven texture): one tiled pattern over the silhouette */
    const tex = p.texture ?? 0.35
    if (tex > 0) {
      if (!screen) {
        const c = document.createElement('canvas'); c.width = 4; c.height = 4
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 4, 1); x.fillRect(0, 0, 1, 4)
        screen = c
      }
      ctx.save()
      ctx.globalAlpha = tex * 0.22
      ctx.fillStyle = ctx.createPattern(screen, 'repeat')
      ctx.fillRect(cx - R, y0 - R * sinT, 2 * R, sh + 2 * R * sinT)
      ctx.restore()
    }

    /* GLINTS: K slots, each flashing 6 times a loop for 30 % of its period (≤ 0.6 s at 12 s), placed by a hash of the
       flash index mod 6 — the same flashes every loop */
    const K = Math.round((p.glints ?? 0.5) * 32)
    const M = 6
    if (K && discs.length) {
      ctx.fillStyle = '#ffffff'
      for (let j = 0; j < K; j++) {
        const c = u * M + j / K
        const a = c - Math.floor(c)
        if (a > 0.3) continue
        const n = ((Math.floor(c) % M) + M) % M + j * 7.13
        const [y, r] = discs[Math.floor(hash(n) * discs.length)]
        const ang = hash(n + 0.5) * Math.PI /* the front half */
        const gx = cx + Math.cos(ang) * r, gy = y + Math.sin(ang) * r * sinT
        const env = Math.sin((a / 0.3) * Math.PI)
        const L = Math.max(4, w / 60) * env
        ctx.globalAlpha = env
        ctx.beginPath()
        ctx.moveTo(gx - L, gy); ctx.quadraticCurveTo(gx, gy, gx, gy - L); ctx.quadraticCurveTo(gx, gy, gx + L, gy)
        ctx.quadraticCurveTo(gx, gy, gx, gy + L); ctx.quadraticCurveTo(gx, gy, gx - L, gy)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
  },
}
