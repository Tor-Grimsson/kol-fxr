// Vicsek polar bands (Grégoire & Chaté 2004)
// Polar alignment with noise tuned to the coexistence window → propagating
// high-density bands sweep through the glyph interior.
// Key deviation from Boids: no cohesion, no separation — only angle-averaging.
// The interesting regime is near the order–disorder transition where bands nucleate.



import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sampleInside, sdfGrad, repelPoints, pc } from '../common.js'

const PARAMS          = [
  { key: 'N',     type: 'int',   min: 300,  max: 3000, default: 1200, step: 100, label: 'particles' },
  { key: 'v0',    type: 'range', min: 0.2,  max: 3.0,  default: 0.8,  step: 0.1, label: 'self-prop speed' },
  { key: 'noise', type: 'range', min: 0.0,  max: 1.0,  default: 0.38, step: 0.02, label: 'noise η' },
  { key: 'R',     type: 'range', min: 4,    max: 40,   default: 16,   step: 2,   label: 'align radius' },
  { key: 'trail', type: 'range', min: 0.0,  max: 1.0,  default: 0.3,  step: 0.05, label: 'trail length' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]



export const r2_act_01_vicsek            = {
  id: 'r2-act-01-vicsek',
  name: 'VICSEK BANDS',
  repo: 'Vicsek 1995 PRL; Grégoire & Chaté 2004 PRL',
  summary: 'Polar alignment + noise in the coexistence window produces propagating high-density bands. No cohesion — pure direction averaging.',
  helps: 'Density stripes sweep the glyph interior; letterform reads as a standing wave reactor.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h

    let N = num(params, 'N', 1200)
    let v0 = num(params, 'v0', 0.8)
    let eta = num(params, 'noise', 0.38)
    let R = num(params, 'R', 16)

    const ps             = []
    for (let i = 0; i < N; i++) {
      const [x, y] = sampleInside(sdf, rng)
      ps.push({ x, y, a: rng() * Math.PI * 2 })
    }

    // spatial grid — reusable head/next linked-index arrays (no per-frame alloc)
    const cellSize = () => Math.max(R, 8)
    const gridHead = new Int32Array((Math.ceil(sdf.w / 8) + 1) * (Math.ceil(sdf.h / 8) + 1))
    let gridNext = new Int32Array(N)
    const maxStep = Math.min(sdf.w, sdf.h) * 0.015 // per-frame motion cap (anti-strobe)

    let prevDown = false

    return wrapLoop(() => {
      N   = num(params, 'N', 1200)
      v0  = num(params, 'v0', 0.8)
      eta = num(params, 'noise', 0.38)
      R   = num(params, 'R', 16)

      while (ps.length < N) {
        const [x, y] = sampleInside(sdf, rng)
        ps.push({ x, y, a: rng() * Math.PI * 2 })
      }
      if (ps.length > N) ps.length = N

      const cs = cellSize()
      const gw = Math.ceil(sdf.w / cs) + 1
      const gh = Math.ceil(sdf.h / cs) + 1
      if (gridNext.length < ps.length) gridNext = new Int32Array(ps.length)
      gridHead.fill(-1, 0, gw * gh)
      for (let i = 0; i < ps.length; i++) {
        const gx = Math.max(0, Math.min(gw - 1, (ps[i].x / cs) | 0))
        const gy = Math.max(0, Math.min(gh - 1, (ps[i].y / cs) | 0))
        const c = gy * gw + gx
        gridNext[i] = gridHead[c]
        gridHead[c] = i
      }

      const half = eta * Math.PI
      const R2 = R * R

      // pointer interaction — repel positions + bias headings away (× interact);
      // Vicsek alignment restores the bands behind the cursor.
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const pReach = Math.min(sdf.w, sdf.h) * 0.15

      // down-EDGE = shockwave: one-frame radial heading + position kick in a
      // large reach; alignment re-forms the bands behind the front. Held
      // keeps the sustained repel below.
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) {
        const reach = Math.min(sdf.w, sdf.h) * 0.4
        const kick = Math.min(sdf.w, sdf.h) * 0.1 * interact
        for (const p of ps) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y
          const d2 = dx * dx + dy * dy
          if (d2 >= reach * reach || d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const w = 1 - d / reach
          p.a = Math.atan2(dy, dx) + (rng() - 0.5) * 0.6
          const nx = p.x + (dx / d) * kick * w
          const ny = p.y + (dy / d) * kick * w
          if (sdf.sample(nx, ny) < 0) { p.x = nx; p.y = ny }
        }
      }

      for (let i = 0; i < ps.length; i++) {
        const p = ps[i]
        let sx2 = 0, sy2 = 0
        const gx = (p.x / cs) | 0, gy = (p.y / cs) | 0
        for (let dj = -1; dj <= 1; dj++) {
          const row = gy + dj
          if (row < 0 || row >= gh) continue
          for (let di = -1; di <= 1; di++) {
            const col = gx + di
            if (col < 0 || col >= gw) continue
            for (let j = gridHead[row * gw + col]; j !== -1; j = gridNext[j]) {
              const dx = ps[j].x - p.x, dy = ps[j].y - p.y
              if (dx * dx + dy * dy > R2) continue
              sx2 += Math.cos(ps[j].a)
              sy2 += Math.sin(ps[j].a)
            }
          }
        }
        const mean = Math.atan2(sy2, sx2)
        p.a = mean + (rng() - 0.5) * 2 * half

        // steer heading away from the pointer inside the reach ring
        if (ptr) {
          const dxp = p.x - ptr.x, dyp = p.y - ptr.y
          const d2p = dxp * dxp + dyp * dyp
          if (d2p < pReach * pReach && d2p > 1e-6) {
            const dp = Math.sqrt(d2p)
            const w = 0.3 * interact * (1 - dp / pReach)
            const bx = Math.cos(p.a) * (1 - w) + (dxp / dp) * w
            const by = Math.sin(p.a) * (1 - w) + (dyp / dp) * w
            p.a = Math.atan2(by, bx)
          }
        }

        // advance (step clamped to ~1.5% of sim dim)
        const step = Math.min(v0, maxStep)
        const nx = p.x + Math.cos(p.a) * step
        const ny = p.y + Math.sin(p.a) * step

        if (sdf.sample(nx, ny) < 0) {
          p.x = nx; p.y = ny
        } else {
          // reflect off boundary
          const [gX, gY] = sdfGrad(sdf, p.x, p.y)
          const gm = Math.hypot(gX, gY) || 1
          const dot = Math.cos(p.a) * gX / gm + Math.sin(p.a) * gY / gm
          const rx = Math.cos(p.a) - 2 * dot * gX / gm
          const ry = Math.sin(p.a) - 2 * dot * gY / gm
          p.a = Math.atan2(ry, rx)
        }
      }

      if (ptr) {
        repelPoints(ps, ptr, {
          reach: pReach,
          strength: Math.min(sdf.w, sdf.h) * 0.012 * interact,
          keep: (nx, ny) => sdf.sample(nx, ny) < 0,
        })
      }

      const trail = num(params, 'trail', 0.3)
      const alpha = 1 - trail * 0.92
      ctx.fillStyle = `rgba(10,11,20,${alpha.toFixed(2)})`
      ctx.fillRect(0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(243,231,207,0.25)', 1.8)

      // draw as oriented ticks — accent-led, a warm minority for band contrast
      const tick = Math.max(5, Math.min(W, H) * 0.014)
      ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.005)
      ctx.lineCap = 'round'
      const cAccent = pc('accent', 0.85)
      const cWarm = pc('warm', 0.95)
      // batched: one path per colour instead of one stroke per particle
      for (let pass = 0; pass < 2; pass++) {
        ctx.strokeStyle = pass === 0 ? cAccent : cWarm
        ctx.beginPath()
        for (let i = 0; i < ps.length; i++) {
          if ((i % 9 === 0) !== (pass === 1)) continue
          const p = ps[i]
          const ca = Math.cos(p.a), sa = Math.sin(p.a)
          ctx.moveTo(p.x * sx - ca * tick * 0.5, p.y * sy - sa * tick * 0.5)
          ctx.lineTo(p.x * sx + ca * tick * 0.5, p.y * sy + sa * tick * 0.5)
        }
        ctx.stroke()
      }
    })
  },
}
