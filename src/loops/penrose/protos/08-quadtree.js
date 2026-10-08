
import { clear, strokeOutline, wrapLoop, pc } from '../common.js'



// Recursive quadtree subdivision against the SDF. Cells fully outside are
// dropped; cells fully inside get an inscribed circle; cells straddling the
// boundary subdivide until max depth. Animates as progressive subdivision.
//
// Reference: classic quadtree + Mondrian / "Box and Circle" generative studies.
export const quadtree            = {
  id: '08-quadtree',
  name: 'QUADTREE SUBDIVISION',
  repo: 'classic quadtree (d3-quadtree for nearest-neighbor)',
  summary:
    'Split the canvas into quads; each quad checks SDF at its 4 corners. Outside → drop. Inside → inscribe circle. Straddle → subdivide. Produces the grid-of-circles-in-box look from the ref mood. Layerable: each depth tier is its own layer.',
  helps:
    'A rectilinear / rational counterpoint to the organic packers. Each depth tier IS a layer for free, with obvious life/death rules (cell splits → parent dies, children born).',
  params: [
    { key: 'minS', type: 'int', min: 4, max: 60, default: 18, label: 'min cell' },
    { key: 'cadence', type: 'int', min: 1, max: 12, default: 3, label: 'cadence' },
    { key: 'inscribe', type: 'range', min: 0.4, max: 1, step: 0.05, default: 0.85, label: 'inscribe' },
    { key: 'dot', type: 'range', min: 0.4, max: 8, step: 0.1, default: 3, label: 'center dot' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.max(1, Math.min(W, H) / 320) // size unit — marks scale with the canvas
    const { minS, cadence, inscribe, dot } = params

    /* Living system (2026-08-09): the one-shot subdivision converged to a
     * frozen partition — rebuilt as a per-frame refine/coarsen tree. A LENS
     * (the pointer; a slow roaming point when unattended) makes nearby cells
     * subdivide finer, and cells the lens leaves behind MERGE back toward
     * the coarse partition after a hysteresis delay — the grid follows the
     * cursor like a magnifier. Press = SHATTER: the lens widens and cuts to
     * the finest grain instantly; release lets the partition heal shut. */
    const classify = (x       , y       , s       ) => {
      let nIn = 0, nOut = 0
      for (let j = 0; j <= 2; j++) {
        for (let i = 0; i <= 2; i++) {
          if (sdf.sample(x + (s * i) / 2, y + (s * j) / 2) < 0) nIn++
          else nOut++
        }
      }
      if (nOut === 0) return 'in'
      if (nIn === 0) return 'out'
      return 'straddle'
    }
    const makeCell = (x       , y       , s       ) =>
      ({ x, y, s, kind: classify(x, y, s), children: null, cool: 0 })
    const root = makeCell(0, 0, sdf.w)

    let tick = 0
    const COOL = 18 // merge hysteresis (frames) so the heal lags the lens
    const baseR = Math.min(sdf.w, sdf.h)
    let lx = sdf.w / 2, ly = sdf.h / 2
    let lensR = baseR * 0.24
    let fineS = Math.max(4, minS * 0.3)
    // PERF: hard bound on refinement — a shatter at full lens width on a big
    // buffer could otherwise mint tens of thousands of leaves. The budget is
    // recomputed per frame from the last leaf count and decremented per split.
    const LEAF_CAP = 6000
    let leafCount = 1
    let splitBudget = LEAF_CAP

    const wants = (c      ) => {
      if (c.kind === 'out') return false
      if (c.kind === 'straddle' && c.s > minS) return true // base partition
      const dx = c.x + c.s / 2 - lx, dy = c.y + c.s / 2 - ly
      const d = Math.hypot(dx, dy)
      if (d >= lensR) return false
      // lens: the target grain coarsens with distance from the lens center
      const target = fineS * Math.pow(2, (d / lensR) * 3)
      return c.s > target * 2
    }

    const step = (c      , canSplit         , canMerge         ) => {
      if (c.children) {
        let quiet = true
        for (const ch of c.children) {
          step(ch, canSplit, canMerge)
          if (ch.children || wants(ch)) quiet = false
        }
        if (!wants(c) && quiet) {
          c.cool++
          if (canMerge && c.cool > COOL) { c.children = null; c.cool = 0 }
        } else c.cool = 0
      } else if (canSplit && splitBudget > 0 && wants(c)) {
        splitBudget--
        const h = c.s / 2
        c.children = [
          makeCell(c.x, c.y, h),
          makeCell(c.x + h, c.y, h),
          makeCell(c.x, c.y + h, h),
          makeCell(c.x + h, c.y + h, h),
        ]
      }
    }

    // PERF: draw restructured — one traversal collects the visible leaves,
    // then three batched passes (grid rects / circles / dots) replace the
    // per-cell strokeRect + 2×(beginPath/stroke/fill) style thrash.
    const leaves = []
    const collect = (c      ) => {
      if (c.children) {
        for (const ch of c.children) collect(ch)
        return
      }
      if (c.kind !== 'out') leaves.push(c)
    }

    const draw = () => {
      leaves.length = 0
      collect(root)
      leafCount = leaves.length
      // grid — quiet dim scaffolding
      ctx.strokeStyle = pc('dim', 0.09)
      ctx.lineWidth = 0.6 * U
      ctx.beginPath()
      for (const c of leaves) ctx.rect(c.x * sx, c.y * sy, c.s * sx, c.s * sy)
      ctx.stroke()
      // inscribed circles
      const rMin = Math.min(sx, sy)
      ctx.strokeStyle = pc('fg', 0.85)
      ctx.lineWidth = 0.9 * U
      ctx.beginPath()
      for (const c of leaves) {
        if (!(c.kind === 'in' || c.s <= minS)) continue
        const cx = (c.x + c.s / 2) * sx
        const cy = (c.y + c.s / 2) * sy
        const r = (c.s / 2) * rMin * inscribe
        ctx.moveTo(cx + r, cy)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }
      ctx.stroke()
      // center dots
      ctx.fillStyle = pc('warm', 0.95)
      ctx.beginPath()
      for (const c of leaves) {
        if (!(c.kind === 'in' || c.s <= minS)) continue
        const cx = (c.x + c.s / 2) * sx
        const cy = (c.y + c.s / 2) * sy
        const r = Math.min(dot * U, (c.s / 2) * rMin * inscribe * 0.55)
        ctx.moveTo(cx + r, cy)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }
      ctx.fill()
    }

    return wrapLoop(() => {
      tick++
      const ptr = params.interact > 0 && pointer ? pointer() : null
      const down = !!(ptr && ptr.down)
      if (ptr) {
        lx = ptr.x
        ly = ptr.y
      } else {
        // unattended: a slow Lissajous roam keeps the partition breathing
        const t = tick * 0.008
        lx = sdf.w * (0.5 + 0.32 * Math.sin(t * 0.9))
        ly = sdf.h * (0.5 + 0.32 * Math.sin(t * 1.7 + 1.3))
      }
      const ia = ptr ? Math.min(1.6, 0.4 + 0.6 * params.interact) : 1
      // press lens 2× the hover delta — the shatter reads across the glyph.
      // ANTI-STROBE/PERF: the lens EASES toward its target (~200ms) instead of
      // snapping, which also spreads the shatter's split burst across frames.
      const lensT = baseR * (down ? 0.44 : 0.24) * ia
      const fineT = down ? Math.max(3, minS * 0.15) : Math.max(4, minS * 0.3)
      lensR += (lensT - lensR) * 0.18
      fineS += (fineT - fineS) * 0.18

      // press shatters (splits every frame); otherwise refine on the cadence
      // beat — same beat gates the merges (the heal)
      splitBudget = Math.max(0, Math.ceil((LEAF_CAP - leafCount) / 3))
      const beat = tick % cadence === 0
      step(root, down || beat, beat)

      // Render
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, pc('fg', 0.2), 1.4)
      draw()
    })
  },
}
