

import { Delaunay } from 'd3-delaunay'
import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sampleInside, pc } from '../common.js'

const PARAMS          = [
  { key: 'N',      type: 'int',   min: 60,   max: 500, default: 220, step: 20,   label: 'points' },
  { key: 'speed',  type: 'range', min: 0.05, max: 1.5, default: 0.3, step: 0.05, label: 'sweep speed' },
  { key: 'jitter', type: 'range', min: 0,    max: 4,   default: 1.2, step: 0.1,  label: 'point drift' },
  { key: 'reverse', type: 'boolean', default: false, label: 'crystallize' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

// Circumradius for a Delaunay triangle defined by its three vertex indices
function circumradius(pts              , a        , b        , c        )         {
  const ax = pts[2 * a], ay = pts[2 * a + 1]
  const bx = pts[2 * b], by = pts[2 * b + 1]
  const cx = pts[2 * c], cy = pts[2 * c + 1]
  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
  if (Math.abs(D) < 1e-10) return Infinity
  const ux = ((ax*ax + ay*ay) * (by - cy) + (bx*bx + by*by) * (cy - ay) + (cx*cx + cy*cy) * (ay - by)) / D
  const uy = ((ax*ax + ay*ay) * (cx - bx) + (bx*bx + by*by) * (ax - cx) + (cx*cx + cy*cy) * (bx - ax)) / D
  return Math.hypot(ax - ux, ay - uy)
}

export const r2_geom_02_alpha            = {
  id: 'r2-geom-02-alpha',
  name: 'ALPHA-SHAPE SWEEP',
  repo: 'd3-delaunay · alpha complex',
  summary: 'One Delaunay triangulation, animated alpha threshold. High α = convex hull fills the glyph; low α = boundary shreds into archipelagos of isolated points. Reverse mode crystallizes from dust.',
  helps: 'Topological erosion driven by a single scalar — conceptually clean, cinematically striking.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h

    let N    = Math.min(500, num(params, 'N', 220)) // hard cap on point count
    let base                     = []
    const phases           = []

    const reseed = () => {
      N = Math.min(500, num(params, 'N', 220))
      base = []
      phases.length = 0
      for (let i = 0; i < N; i++) {
        base.push(sampleInside(sdf, rng))
        phases.push(rng() * Math.PI * 2)
      }
    }
    reseed()

    // Hoisted scratch — drifted positions written in place each frame
    const flatPts = new Float64Array(N * 2)

    // Pre-sort circumradii once per reseed for fast threshold filtering
    let cachedPts                      = null
    let sortedEdges                                                                  = []
    let framesSinceBuild = 1e9

    /* Law 2 (2026-08-09): the alpha sweep ran on an automatic clock — the
     * sim's primary dimension now belongs to the pointer. Cursor x commands
     * the threshold (lerped, never snapped); with no pointer the slow auto
     * oscillation resumes seamlessly. Press = scatter blast: the base points
     * blow outward and the triangulation re-forms. */
    let sweep = 0
    let prevDown = false

    return wrapLoop(() => {
      const t       = clock.nowSeconds()
      const speed   = num(params, 'speed', 0.3)
      const jitter  = num(params, 'jitter', 1.2)
      const rev     = params['reverse']

      // Pointer repel — pushes the persistent base[] pairs (pts are re-derived
      // per frame from base + phase drift); once base has moved >2 the drift
      // heuristic re-triangulates, so the alpha complex follows the shove.
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      if (ptr) {
        const pReach = Math.min(sdf.w, sdf.h) * 0.15
        const pStr = Math.min(sdf.w, sdf.h) * 0.012 * interact
        for (const b of base) {
          const dx = b[0] - ptr.x, dy = b[1] - ptr.y
          const d2 = dx * dx + dy * dy
          if (d2 >= pReach * pReach || d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const f = (1 - d / pReach) * pStr
          const nx = b[0] + (dx / d) * f
          const ny = b[1] + (dy / d) * f
          if (sdf.sample(nx, ny) < 0) { b[0] = nx; b[1] = ny }
        }
      }

      // down-EDGE = scatter blast — base points blow outward in a large
      // reach and the alpha complex re-forms over the new constellation
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) {
        const reach = Math.min(sdf.w, sdf.h) * 0.4
        const str = Math.min(sdf.w, sdf.h) * 0.16 * interact
        for (const b of base) {
          const dx = b[0] - ptr.x, dy = b[1] - ptr.y
          const d2 = dx * dx + dy * dy
          if (d2 >= reach * reach || d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const f = (1 - d / reach) * str
          const nx = b[0] + (dx / d) * f
          const ny = b[1] + (dy / d) * f
          if (sdf.sample(nx, ny) < 0) { b[0] = nx; b[1] = ny }
        }
        cachedPts = null // force immediate re-triangulation
      }

      // Drift positions slowly — into the hoisted scratch (no per-frame arrays)
      const flat = flatPts
      for (let i = 0; i < base.length; i++) {
        flat[2 * i] = base[i][0] + Math.sin(t * 0.4 + phases[i]) * jitter
        flat[2 * i + 1] = base[i][1] + Math.cos(t * 0.37 + phases[i] + 1.1) * jitter
      }

      framesSinceBuild++
      const needRebuild = cachedPts === null ||
        (Math.abs(flat[0] - cachedPts[0]) > 2 && framesSinceBuild >= 6)  // drift re-triangulation throttled to ~10Hz

      if (needRebuild) {
        framesSinceBuild = 0
        cachedPts = flat.slice()
        const d = new Delaunay(flat)
        sortedEdges = []
        const tris = d.triangles
        const added = new Set        ()
        for (let i = 0; i < tris.length; i += 3) {
          const a = tris[i], b = tris[i+1], c = tris[i+2]
          const cr = circumradius(flat, a, b, c)
          if (!isFinite(cr)) continue
          const pairs                     = [[a,b],[b,c],[a,c]]
          for (const [p, q] of pairs) {
            const key = p < q ? p * 1024 + q : q * 1024 + p // numeric key — no string churn (N ≤ 500)
            if (added.has(key)) continue
            added.add(key)
            sortedEdges.push({
              r: cr,
              ax: flat[2*p], ay: flat[2*p+1],
              bx: flat[2*q], by: flat[2*q+1],
            })
          }
        }
        sortedEdges.sort((a, b) => a.r - b.r)
      }

      // Alpha threshold — pointer-commanded when present (cursor x maps to
      // the sweep, lerped), auto oscillation when absent (idle still lives)
      const maxR = sortedEdges.length ? sortedEdges[sortedEdges.length - 1].r : 80
      const autoPhase = (Math.sin(t * speed * Math.PI) * 0.5 + 0.5)  // 0..1
      const cmd = ptr
        ? autoPhase + (Math.max(0, Math.min(1, ptr.x / sdf.w)) - autoPhase) * Math.min(1, interact)
        : autoPhase
      sweep += (cmd - sweep) * (ptr ? 0.1 : 0.04)
      const phase = sweep
      const alphaR = rev ? maxR * (1 - phase) : maxR * phase  // threshold on circumradius

      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)

      // Edges whose circumradius ≤ alphaR are inside the alpha complex — fg-led mesh
      ctx.beginPath()
      ctx.strokeStyle = pc('fg', 0.75)
      ctx.lineWidth = 2.2
      for (const e of sortedEdges) {
        if (e.r > alphaR) break
        if (sdf.sample(e.ax, e.ay) >= 0 || sdf.sample(e.bx, e.by) >= 0) continue
        ctx.moveTo(e.ax * sx, e.ay * sy)
        ctx.lineTo(e.bx * sx, e.by * sy)
      }
      ctx.stroke()

      // Points — warm nodes, big enough to read as the constellation
      ctx.fillStyle = pc('warm', 0.95)
      const dotR = Math.max(4, Math.min(W, H) * 0.008)
      ctx.beginPath() // all dots batched into ONE path + one fill
      for (let i = 0; i < base.length; i++) {
        const x = flat[2 * i], y = flat[2 * i + 1]
        if (sdf.sample(x, y) >= 0) continue
        ctx.moveTo(x * sx + dotR, y * sy)
        ctx.arc(x * sx, y * sy, dotR, 0, Math.PI * 2)
      }
      ctx.fill()
    })
  },
}
