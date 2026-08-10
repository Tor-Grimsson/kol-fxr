

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, roleRGB } from '../common.js'

// Thomas' Cyclically Symmetric Attractor (René Thomas, 1999).
// 3-fold symmetric; projected down [1,1,1] axis + slow orbit rotation.
// Ref: https://medium.com/@rh.h.rad/thomas-attractor-exploring-the-beauty-of-chaotic-dynamics

const PARAMS          = [
  { key: 'b', type: 'range', min: 0.10, max: 0.25, default: 0.19, step: 0.002, label: 'b (dissip)' },
  { key: 'dt', type: 'range', min: 0.01, max: 0.1, default: 0.05, step: 0.005, label: 'step dt' },
  { key: 'trails', type: 'int', min: 1, max: 6, default: 3, label: 'trail count' },
  { key: 'tail', type: 'int', min: 200, max: 4000, default: 1500, label: 'tail length' },
  { key: 'spin', type: 'range', min: 0, max: 0.5, default: 0.08, step: 0.01, label: 'cam spin' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

// shortest-arc angular difference, for lerping accumulating angles
function angDiff(a        , b        )         {
  let d = (a - b) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

function rk4Thomas(x        , y        , z        , b        , dt        )                           {
  const F = (x        , y        , z        )                           => [
    Math.sin(y) - b * x,
    Math.sin(z) - b * y,
    Math.sin(x) - b * z,
  ]
  const [k1x, k1y, k1z] = F(x, y, z)
  const [k2x, k2y, k2z] = F(x+dt/2*k1x, y+dt/2*k1y, z+dt/2*k1z)
  const [k3x, k3y, k3z] = F(x+dt/2*k2x, y+dt/2*k2y, z+dt/2*k2z)
  const [k4x, k4y, k4z] = F(x+dt*k3x, y+dt*k3y, z+dt*k3z)
  return [
    x + dt/6*(k1x+2*k2x+2*k3x+k4x),
    y + dt/6*(k1y+2*k2y+2*k3y+k4y),
    z + dt/6*(k1z+2*k2z+2*k3z+k4z),
  ]
}

// Orthographic project onto plane perpendicular to [1,1,1]
// Two basis vectors in that plane: u=[1,-1,0]/√2, v=[1,1,-2]/√6
const U = [1/Math.SQRT2, -1/Math.SQRT2, 0]
const V = [1/Math.sqrt(6), 1/Math.sqrt(6), -2/Math.sqrt(6)]

function project(x        , y        , z        , angle        )                   {
  const pu = x*U[0] + y*U[1] + z*U[2]
  const pv = x*V[0] + y*V[1] + z*V[2]
  // rotate in projected plane
  const cos = Math.cos(angle), sin = Math.sin(angle)
  return [pu*cos - pv*sin, pu*sin + pv*cos]
}

export const r2_attr_04_thomas            = {
  id: 'r2-attr-04-thomas',
  name: 'THOMAS CYCLIC',
  repo: 'Thomas 1999 · dynamicmath.xyz/strange-attractors',
  summary: '3D Thomas cyclically symmetric attractor; RK4-integrated trails projected onto the [1,1,1] perpendicular plane with slow camera precession revealing 3-fold symmetry.',
  helps: 'The 3-lobe rotation is visually interpretable as a spinning object — clean rhythmic motion for the letterform.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const maxTail = 4000
    const maxTrails = 6
    const bufs = Array.from({ length: maxTrails }, (_, i) => ({
      pxs: new Float32Array(maxTail),
      pys: new Float32Array(maxTail),
      zs: new Float32Array(maxTail), // depth
      head: 0, len: 0,
      cx: 0.1 + (i - maxTrails/2) * 0.12,
      cy: (i - maxTrails/2) * 0.08,
      cz: 0.05 * i,
    }))
    // Warm up all trails
    for (const tr of bufs) {
      let [x, y, z] = [tr.cx, tr.cy, tr.cz]
      for (let i = 0; i < 800; i++) [x, y, z] = rk4Thomas(x, y, z, 0.19, 0.05)
      tr.cx = x; tr.cy = y; tr.cz = z
    }

    // Thomas extent roughly [-4, 4]; scale to glyph
    const SC = Math.min(W, H) * 0.115
    const OX = W * 0.5, OY = H * 0.5

    /* Law 2 (2026-08-09): pointer x commands the camera rotation (lerped) —
     * the 3-lobe object turns under the hand; idle auto-spin continues.
     * Press = perturbation kick to every trail's phase point; the attractor
     * re-converges by nature. */
    let camA = 0
    let prevT = null
    let prevDown = false

    // depth×alpha buckets for batched trail strokes (hoisted — no per-frame alloc)
    const DB = 4, ABK = 8
    const DMID = [0.125, 0.375, 0.625, 0.875]
    const buckets = Array.from({ length: DB * ABK }, () => [])

    return wrapLoop(() => {
      const b = num(params, 'b', 0.19)
      const dt = num(params, 'dt', 0.05)
      const nTrails = Math.min(maxTrails, num(params, 'trails', 3))
      const tail = Math.min(maxTail, num(params, 'tail', 1500))
      const spin = num(params, 'spin', 0.08)
      const STEPS = 6

      clear(ctx, W, H, 'rgba(10,11,20,0.12)')
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)

      const now = clock.nowSeconds()
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      if (prevT == null) prevT = now
      const dtF = Math.min(0.1, Math.max(0, now - prevT))
      prevT = now
      if (ptr) {
        camA += angDiff((ptr.x / sdf.w) * Math.PI * 2, camA) * 0.08 * Math.min(1, interact)
      } else {
        camA += spin * dtF
      }
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) {
        const k = 2.4 * Math.min(2, interact)
        for (const tr of bufs) {
          tr.cx += (rng() - 0.5) * 2 * k
          tr.cy += (rng() - 0.5) * 2 * k
          tr.cz += (rng() - 0.5) * 2 * k
          // safety — Thomas is bounded, but a wild kick resets to a seed
          if (!isFinite(tr.cx + tr.cy + tr.cz) ||
              Math.abs(tr.cx) + Math.abs(tr.cy) + Math.abs(tr.cz) > 40) {
            tr.cx = 0.1; tr.cy = 0; tr.cz = 0.05
          }
        }
      }
      const angle = camA

      for (let ti = 0; ti < nTrails; ti++) {
        const tr = bufs[ti]
        for (let s = 0; s < STEPS; s++) {
          const [nx, ny, nz] = rk4Thomas(tr.cx, tr.cy, tr.cz, b, dt)
          tr.cx = nx; tr.cy = ny; tr.cz = nz
          const [pu, pv] = project(nx, ny, nz, angle)
          // depth: component along [1,1,1]
          const depth = (nx + ny + nz) / (3 * Math.sqrt(3))
          tr.pxs[tr.head] = pu
          tr.pys[tr.head] = pv
          tr.zs[tr.head] = depth
          tr.head = (tr.head + 1) % maxTail
          if (tr.len < maxTail) tr.len++
        }
        // NaN hygiene — non-finite state resets to seed (guarded every frame)
        if (!isFinite(tr.cx + tr.cy + tr.cz)) { tr.cx = 0.1; tr.cy = 0; tr.cz = 0.05 }
        const drawLen = Math.min(tr.len, tail)
        // rotate the lead role per trail — warm / accent / fg
        // (batched: depth+alpha quantized to buckets → ≤32 strokes per trail
        // instead of one beginPath/stroke per segment)
        const [cr, cg, cb] = roleRGB(['warm', 'accent', 'fg'][ti % 3])
        for (const b of buckets) b.length = 0
        for (let i = 0; i < drawLen - 1; i++) {
          const age = i / drawLen
          const i0 = (tr.head - 1 - i + maxTail) % maxTail
          const d = Math.max(0, Math.min(1, tr.zs[i0] * 0.5 + 0.5))
          const db = Math.min(DB - 1, Math.floor(d * DB))
          const alpha = (1 - age) * (0.45 + d * 0.55)
          const abkt = Math.min(ABK - 1, Math.floor(alpha * ABK))
          buckets[db * ABK + abkt].push(i0)
        }
        for (let bi = 0; bi < buckets.length; bi++) {
          const seg = buckets[bi]
          if (!seg.length) continue
          const alpha = ((bi % ABK) + 0.5) / ABK
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`
          ctx.lineWidth = 1.8 + DMID[(bi / ABK) | 0] * 2.2
          ctx.beginPath()
          for (const i0 of seg) {
            const i1 = (i0 - 1 + maxTail) % maxTail
            ctx.moveTo(OX + tr.pxs[i0]*SC, OY + tr.pys[i0]*SC)
            ctx.lineTo(OX + tr.pxs[i1]*SC, OY + tr.pys[i1]*SC)
          }
          ctx.stroke()
        }

        // glowing head per trail
        if (tr.len > 0) {
          const hi = (tr.head - 1 + maxTail) % maxTail
          const hx = OX + tr.pxs[hi]*SC, hy = OY + tr.pys[hi]*SC
          // fake glow — halo fill replaces the shadowBlur pass
          ctx.fillStyle = `rgba(${cr},${cg},${cb},0.3)`
          ctx.beginPath()
          ctx.arc(hx, hy, 11, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = `rgba(${cr},${cg},${cb},0.95)`
          ctx.beginPath()
          ctx.arc(hx, hy, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    })
  },
}
