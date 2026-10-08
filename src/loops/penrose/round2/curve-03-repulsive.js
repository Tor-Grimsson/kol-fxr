// Repulsive Curves — simplified tangent-point energy (Yu–Schumacher–Crane 2021)
// Self-repulsion via pairwise tangent-point penalty 1/r^alpha prevents crossings.
// SDF attraction keeps the curve coiling densely inside the glyph.
// Full Sobolev solve replaced by direct gradient + spatial grid for O(N log N).



import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sdfGrad, pc } from '../common.js'

const PARAMS          = [
  { key: 'N0',      type: 'int',   min: 40,  max: 400, default: 120, step: 20,   label: 'nodes' },
  { key: 'alpha',   type: 'range', min: 1.5, max: 4,   default: 2.5, step: 0.1,  label: 'repulsion exponent' },
  { key: 'repK',    type: 'range', min: 0,   max: 2,   default: 0.6, step: 0.05, label: 'repulsion strength' },
  { key: 'sdfPull', type: 'range', min: 0,   max: 3,   default: 1.2, step: 0.05, label: 'sdf pull' },
  { key: 'tensK',   type: 'range', min: 0,   max: 1,   default: 0.2, step: 0.01, label: 'tension' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]



export const r2_curve_03_repulsive            = {
  id: 'r2-curve-03-repulsive',
  name: 'REPULSIVE CURVES',
  repo: 'Yu–Schumacher–Crane ACM TOG 2021',
  summary: 'Inextensible closed curve with tangent-point self-repulsion energy. Packs densely inside the SDF glyph without ever crossing itself — like wound thread filling a letterform.',
  helps: 'Densest crossing-free packing achievable with a polyline. Clean topology at all times.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const N0      = num(params, 'N0', 120)
    const alpha   = num(params, 'alpha', 2.5)
    const repK    = num(params, 'repK', 0.6)
    const sdfPull = num(params, 'sdfPull', 1.2)
    const tensK   = num(params, 'tensK', 0.2)

    // seed: small circle centered in glyph
    const cx = sdf.w * 0.5, cy = sdf.h * 0.5
    const seedR = Math.min(sdf.w, sdf.h) * 0.12
    const pts       = []
    for (let i = 0; i < N0; i++) {
      const a = (i / N0) * Math.PI * 2
      pts.push({ x: cx + Math.cos(a) * seedR, y: cy + Math.sin(a) * seedR })
    }

    const dt = 0.1
    const CUTOFF = Math.min(sdf.w, sdf.h) * 0.35
    const REMESH = 25
    let step = 0

    // hoisted hot-path scratch (2026-08-09 perf) — nothing below reallocates per frame
    const cs = CUTOFF * 0.5
    const gw = Math.ceil(sdf.w / cs) + 1
    const gh = Math.ceil(sdf.h / cs) + 1
    const grid = new Array(gw * gh).fill(null).map(() => [])
    let fx = new Float32Array(N0), fy = new Float32Array(N0)
    let tx = new Float32Array(N0), ty_arr = new Float32Array(N0)
    const tgt = Math.hypot(sdf.w, sdf.h) * 0.5 / N0 * 2 // tension rest length (invariant)
    const maxStep = Math.min(sdf.w, sdf.h) * 0.015 // per-frame motion cap — anti-strobe + NaN guard

    /* Living system (2026-08-09): once the packing settles into equilibrium
     * the curve never moves again — fossilized. When total motion stays
     * below epsilon for ~120 frames, fade out and reseed the coil circle
     * (under the cursor when present). */
    let fade = 0
    let still = 0
    let prevDown = false
    const FADE_FRAMES = 45
    function reseed(px, py) {
      const ok = px != null && sdf.sample(px, py) < -3
      const [ncx, ncy] = ok ? [px, py] : [cx, cy]
      pts.length = 0
      for (let i = 0; i < N0; i++) {
        const a = (i / N0) * Math.PI * 2
        pts.push({ x: ncx + Math.cos(a) * seedR, y: ncy + Math.sin(a) * seedR })
      }
    }

    function remesh(p      )       {
      const n = p.length
      let total = 0
      const ls           = []
      for (let i = 0; i < n; i++) {
        const l = Math.hypot(p[(i+1)%n].x-p[i].x, p[(i+1)%n].y-p[i].y)
        ls.push(l); total += l
      }
      const seg = total / N0
      const out       = []
      let acc = 0, idx = 0
      for (let k = 0; k < N0; k++) {
        const tgt = k * seg
        while (acc + ls[idx] < tgt && idx < n-1) { acc += ls[idx]; idx++ }
        const t = ls[idx] > 1e-9 ? (tgt-acc)/ls[idx] : 0
        const a = p[idx], b = p[(idx+1)%n]
        out.push({ x: a.x+t*(b.x-a.x), y: a.y+t*(b.y-a.y) })
      }
      return out
    }

    return wrapLoop(() => {
      const n = pts.length
      if (fx.length < n) { // n only varies if a remesh miscounts — grow, never per-frame
        fx = new Float32Array(n); fy = new Float32Array(n)
        tx = new Float32Array(n); ty_arr = new Float32Array(n)
      }
      fx.fill(0, 0, n); fy.fill(0, 0, n)

      // pointer repel — extra radial force on each vertex (× interact);
      // tension + self-repulsion re-pack the curve afterwards.
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const pReach = Math.min(sdf.w, sdf.h) * 0.15

      // down-EDGE = big radial deformation (one-frame event); tension +
      // self-repulsion re-pack the curve afterwards.
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) {
        const reach = Math.min(sdf.w, sdf.h) * 0.3
        const str = Math.min(sdf.w, sdf.h) * 0.1 * interact
        for (const p of pts) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y
          const d2 = dx * dx + dy * dy
          if (d2 >= reach * reach || d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const f = (1 - d / reach) * str
          p.x += (dx / d) * f
          p.y += (dy / d) * f
        }
      }

      // tangent at each vertex (hoisted scratch)
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[(i+1)%n]
        const l = Math.hypot(q.x-p.x, q.y-p.y) || 1
        tx[i] = (q.x-p.x)/l; ty_arr[i] = (q.y-p.y)/l
      }

      // tangent-point repulsion: simplified — skip full BVH, use spatial grid
      for (let i = 0; i < grid.length; i++) grid[i].length = 0
      for (let i = 0; i < n; i++) {
        const gxi = Math.max(0, Math.min(gw-1, Math.floor(pts[i].x/cs)))
        const gyi = Math.max(0, Math.min(gh-1, Math.floor(pts[i].y/cs)))
        grid[gyi*gw+gxi].push(i)
      }

      for (let i = 0; i < n; i++) {
        const p = pts[i]
        const gxi = Math.max(0, Math.min(gw-1, Math.floor(p.x/cs)))
        const gyi = Math.max(0, Math.min(gh-1, Math.floor(p.y/cs)))
        const nx = tx[i], ny = ty_arr[i]

        for (let dgy = -1; dgy <= 1; dgy++) {
          for (let dgx = -1; dgx <= 1; dgx++) {
            const bx = gxi+dgx, by = gyi+dgy
            if (bx<0||bx>=gw||by<0||by>=gh) continue
            const bucket = grid[by*gw+bx]
            for (const j of bucket) {
              if (j === i) continue
              const dx = p.x - pts[j].x, dy = p.y - pts[j].y
              const d2 = dx*dx + dy*dy
              if (d2 > CUTOFF*CUTOFF || d2 < 1e-6) continue
              const d = Math.sqrt(d2)
              // tangent-point radius: d / |sin angle between tangent and chord|
              const dot = nx*(dx/d) + ny*(dy/d)
              const sinA = Math.sqrt(Math.max(0, 1 - dot*dot)) + 1e-6
              const r = d / sinA
              const grad = alpha * Math.pow(r, -(alpha+1)) / (sinA * d + 1e-9)
              fx[i] += (dx/d) * grad * repK
              fy[i] += (dy/d) * grad * repK
            }
          }
        }

        // tension: spring to neighbors (unrolled — no per-vertex array literal)
        for (let k = 0; k < 2; k++) {
          const oi = k === 0 ? (i-1+n)%n : (i+1)%n
          const ex = pts[oi].x-p.x, ey = pts[oi].y-p.y
          const el = Math.hypot(ex,ey) || 1e-9
          fx[i] += (ex/el)*(el-tgt) * tensK
          fy[i] += (ey/el)*(el-tgt) * tensK
        }

        // SDF boundary push inward
        const sv = sdf.sample(p.x, p.y)
        if (sv > -8) {
          const [gx, gy] = sdfGrad(sdf, p.x, p.y)
          const gm = Math.hypot(gx,gy) || 1
          fx[i] -= (gx/gm) * sdfPull * Math.max(0, sv+8) * 0.07
          fy[i] -= (gy/gm) * sdfPull * Math.max(0, sv+8) * 0.07
        }

        if (ptr) {
          const dxp = p.x - ptr.x, dyp = p.y - ptr.y
          const d2p = dxp*dxp + dyp*dyp
          if (d2p < pReach*pReach && d2p > 1e-6) {
            const dp = Math.sqrt(d2p)
            const f = (1 - dp/pReach) * 8 * interact
            fx[i] += (dxp/dp) * f
            fy[i] += (dyp/dp) * f
          }
        }
      }

      let move = 0
      for (let i = 0; i < n; i++) {
        let mx = fx[i]*dt, my = fy[i]*dt
        const mm = Math.hypot(mx, my)
        if (!(mm <= maxStep)) { // catches over-cap AND NaN/Inf — blowups clamp, never propagate
          const s = Number.isFinite(mm) && mm > 0 ? maxStep / mm : 0
          mx *= s; my *= s
        }
        pts[i].x += mx
        pts[i].y += my
        move += Math.hypot(mx, my)
      }

      step++
      if (step % REMESH === 0) {
        const r = remesh(pts)
        pts.splice(0, pts.length, ...r)
      }

      // lifecycle — settled equilibrium → fade → reseed
      if (fade > 0) {
        fade--
        if (fade === 0) { reseed(ptr?.x, ptr?.y); still = 0 }
      } else {
        still = move / Math.max(1, n) < 0.02 ? still + 1 : 0
        if (still > 120) { fade = FADE_FRAMES; still = 0 }
      }
      const dis = fade > 0 ? fade / FADE_FRAMES : 1

      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)

      ctx.strokeStyle = pc('warm', dis)
      ctx.lineWidth = Math.max(3.5, Math.min(W, H) * 0.007)
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const nn = pts.length
      for (let i = 0; i < nn; i++) {
        const p = pts[i]
        if (i === 0) ctx.moveTo(p.x*sx, p.y*sy)
        else ctx.lineTo(p.x*sx, p.y*sy)
      }
      ctx.closePath()
      ctx.stroke()
    })
  },
}
