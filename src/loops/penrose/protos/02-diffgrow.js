
import { clear, strokeOutline, wrapLoop, sampleInside, repelPoints, pc } from '../common.js'



// Differential curve growth. Closed polylines where each node is repelled by
// nearby nodes and attracted to its two neighbors. When an edge grows too long
// it splits; the SDF keeps the whole system trapped inside the glyph.
//
// Reference: inconvergent/differential-line (Anders Hoff).
// http://www.codeplastic.com/2017/07/22/differential-line-growth-with-processing/
export const diffgrow            = {
  id: '02-diffgrow',
  name: 'DIFFERENTIAL CURVE GROWTH',
  repo: 'inconvergent/differential-line',
  summary:
    'Several closed curves that fold and branch as they fill the glyph. Per-node: repulsion from ALL nearby nodes (curves shove each other), spring to adjacent chain neighbors, inward SDF force. Edges subdivide when stretched → length increases exponentially → organic folded fill.',
  helps:
    'Closest to the "alive, growing, trapped" vision from the brief. Natural exponential growth over time. Can be a single triggered "expression" that fills the letter.',
  params: [
    { key: 'seedN', type: 'int', min: 6, max: 48, default: 24, label: 'seed nodes' },
    { key: 'repulRadius', type: 'range', min: 4, max: 20, step: 0.5, default: 11, label: 'repel radius' },
    { key: 'repulStrength', type: 'range', min: 0.05, max: 1, step: 0.01, default: 0.6, label: 'repel strength' },
    { key: 'springTarget', type: 'range', min: 2, max: 14, step: 0.5, default: 6, label: 'spring length' },
    { key: 'springStrength', type: 'range', min: 0.02, max: 0.6, step: 0.01, default: 0.24, label: 'spring strength' },
    { key: 'splitAt', type: 'range', min: 4, max: 24, step: 0.5, default: 9, label: 'split length' },
    { key: 'maxNodes', type: 'int', min: 1000, max: 12000, step: 500, default: 4500, label: 'max nodes' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.max(1, Math.min(W, H) / 320) // size unit — marks scale with the canvas

    const { seedN, repulRadius, repulStrength, springTarget, springStrength, splitAt, maxNodes } = params

    /* ESCALATION (2026-08-09): the old seed was ONE 14px circle lost on a
     * ~960px field — a squiggle in a corner. Now 3 BIG loops (radius
     * ~min(W,H)*0.12 each) spread across the mask. Their seed edges start
     * far beyond splitAt, so subdivision cascades on the very first frames —
     * the fill visibly develops within seconds instead of hiding. */
    const seedR = Math.min(sdf.w, sdf.h) * 0.12
    const nLoops = 3
    const centers = []
    for (let li = 0; li < nLoops; li++) {
      let best = null, bestScore = -Infinity
      for (let t = 0; t < 24; t++) {
        const [x, y] = sampleInside(sdf, rng)
        const depth = -sdf.sample(x, y)
        let dmin = Infinity
        for (const c of centers) dmin = Math.min(dmin, Math.hypot(x - c[0], y - c[1]))
        const score = (centers.length ? dmin : 0) + depth * 4
        if (score > bestScore) { bestScore = score; best = [x, y] }
      }
      centers.push(best)
    }
    const loops = []
    for (const [cx, cy] of centers) {
      const depth = Math.max(10, -sdf.sample(cx, cy) * 0.8)
      const r0 = Math.min(seedR, depth)
      const nodes = []
      for (let i = 0; i < seedN; i++) {
        const a = (i / seedN) * Math.PI * 2
        nodes.push({ x: cx + Math.cos(a) * r0, y: cy + Math.sin(a) * r0, vx: 0, vy: 0, born: 0 })
      }
      loops.push(nodes)
    }

    const damping = 0.75
    const sdfMargin = 4
    let tick = 0

    // PERF: repulsion grid hoisted — cell size is fixed (repulRadius), so the
    // buckets allocate once and are length-reset per frame instead of
    // reallocating gw*gh arrays every step.
    const cs = repulRadius
    const gw = Math.ceil(sdf.w / cs) + 1
    const gh = Math.ceil(sdf.h / cs) + 1
    const grid = new Array(gw * gh)
    for (let i = 0; i < grid.length; i++) grid[i] = []

    return wrapLoop(() => {
      tick++
      let total = 0
      for (const nodes of loops) total += nodes.length

      // Reset forces (use vx/vy as accumulators this tick)
      for (const nodes of loops) {
        for (const nd of nodes) { nd.vx *= damping; nd.vy *= damping }
      }

      // Repulsion — ONE spatial grid over every node of every loop, so the
      // curves also shove each other apart and tile the glyph between them
      for (let i = 0; i < grid.length; i++) grid[i].length = 0
      for (const nodes of loops) {
        for (const nd of nodes) {
          const gx = Math.max(0, Math.min(gw - 1, Math.floor(nd.x / cs)))
          const gy = Math.max(0, Math.min(gh - 1, Math.floor(nd.y / cs)))
          grid[gy * gw + gx].push(nd)
        }
      }
      for (const nodes of loops) {
        for (const a of nodes) {
          const gx = Math.floor(a.x / cs), gy = Math.floor(a.y / cs)
          for (let j = -1; j <= 1; j++) {
            const yy = gy + j
            if (yy < 0 || yy >= gh) continue
            for (let i2 = -1; i2 <= 1; i2++) {
              const xx = gx + i2
              if (xx < 0 || xx >= gw) continue
              const bucket = grid[yy * gw + xx]
              for (let k = 0; k < bucket.length; k++) {
                const b = bucket[k]
                if (b === a) continue
                const dx = a.x - b.x, dy = a.y - b.y
                const d2 = dx * dx + dy * dy
                if (d2 > repulRadius * repulRadius || d2 < 1e-6) continue
                const d = Math.sqrt(d2)
                const f = ((repulRadius - d) / repulRadius) * repulStrength
                a.vx += (dx / d) * f
                a.vy += (dy / d) * f
              }
            }
          }
        }
      }

      for (const nodes of loops) {
        const n = nodes.length
        // Spring to chain neighbors (closed loop)
        for (let i = 0; i < n; i++) {
          const a = nodes[i]
          const prev = nodes[(i - 1 + n) % n]
          const next = nodes[(i + 1) % n]
          // PERF: unrolled (no per-node [prev,next] array alloc in the hot loop)
          let dx = prev.x - a.x, dy = prev.y - a.y
          let d = Math.hypot(dx, dy) || 1e-6
          let f = (d - springTarget) * springStrength
          a.vx += (dx / d) * f
          a.vy += (dy / d) * f
          dx = next.x - a.x; dy = next.y - a.y
          d = Math.hypot(dx, dy) || 1e-6
          f = (d - springTarget) * springStrength
          a.vx += (dx / d) * f
          a.vy += (dy / d) * f
        }

        // SDF boundary force (push inward when near or outside boundary)
        for (let i = 0; i < n; i++) {
          const a = nodes[i]
          const s = sdf.sample(a.x, a.y)
          if (s > -sdfMargin) {
            const hStep = 1.5
            const gx = sdf.sample(a.x + hStep, a.y) - sdf.sample(a.x - hStep, a.y)
            const gy = sdf.sample(a.x, a.y + hStep) - sdf.sample(a.x, a.y - hStep)
            const m = Math.hypot(gx, gy) || 1e-6
            const push = Math.max(0, s + sdfMargin) * 0.25
            a.vx -= (gx / m) * push
            a.vy -= (gy / m) * push
          }
        }

        // Integrate
        for (let i = 0; i < n; i++) {
          const a = nodes[i]
          a.x += a.vx
          a.y += a.vy
        }
      }

      // Pointer repel — positional push (vx/vy are damped force accumulators,
      // a velocity kick would just bleed away). No keep guard: the SDF
      // boundary force reseals next frame — the curve squishes and re-closes.
      // Press = radial BLAST (3× reach, 6× strength) — the springs re-fold
      // the crater after release; an event, not a garnish.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      const down = !!(ptr && ptr.down)
      // ANTI-STROBE: the blast is a positional push — cap it at ~3% of the
      // canvas per frame so the press reads as a shove, not a teleport
      const blastCap = Math.min(sdf.w, sdf.h) * 0.03
      for (const nodes of loops) {
        repelPoints(nodes, ptr, {
          reach: Math.min(sdf.w, sdf.h) * 0.16 * (down ? 3 : 1),
          strength: Math.min(blastCap, Math.min(sdf.w, sdf.h) * 0.012 * params.interact * (down ? 6 : 1)),
        })
      }

      // Edge split (insert midpoint on long edges)
      for (const nodes of loops) {
        if (total >= maxNodes) break
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i]
          const b = nodes[(i + 1) % nodes.length]
          const dx = b.x - a.x, dy = b.y - a.y
          if (dx * dx + dy * dy > splitAt * splitAt) {
            nodes.splice(i + 1, 0, {
              x: (a.x + b.x) / 2,
              y: (a.y + b.y) / 2,
              vx: 0, vy: 0, born: tick,
            })
            total++
            i++
          }
        }
      }

      /* Living system (2026-08-09): the curves must never saturate at the
       * node cap. Near the cap, a few of the OLDEST nodes dissolve every
       * frame — always taken from the fattest loop, whose chain re-links by
       * array adjacency — so edge-splitting always has headroom and the fold
       * keeps moving forever. */
      if (total > maxNodes * 0.8) {
        const pruneN = 2 + (((total / maxNodes) * 3) | 0)
        for (let k = 0; k < pruneN; k++) {
          let fat = loops[0]
          for (const nodes of loops) if (nodes.length > fat.length) fat = nodes
          if (fat.length <= seedN * 2) break
          let oldest = 0
          for (let i = 1; i < fat.length; i++) {
            if (fat[i].born < fat[oldest].born) oldest = i
          }
          fat.splice(oldest, 1)
        }
      }

      // Render — accent-led: heavy glowing accent curves, warm growth tips
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, pc('fg', 0.2), 1.4)

      // glow — PERF: shadowBlur re-blurred the whole curve per stroke; the
      // cheap idiom is a single wide low-alpha under-stroke, then the crisp
      // pass on top. Both passes batch every loop into ONE path.
      ctx.lineJoin = 'round'
      ctx.beginPath()
      for (const nodes of loops) {
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i]
          if (i === 0) ctx.moveTo(a.x * sx, a.y * sy)
          else ctx.lineTo(a.x * sx, a.y * sy)
        }
        if (nodes.length) {
          const a0 = nodes[0]
          ctx.lineTo(a0.x * sx, a0.y * sy)
        }
      }
      ctx.strokeStyle = pc('accent', 0.22)
      ctx.lineWidth = 3.2 * U
      ctx.stroke()
      ctx.strokeStyle = pc('accent', 0.95)
      ctx.lineWidth = 1.1 * U
      ctx.stroke()

      // beads — every 2nd node reads as a chain of discs, not dust
      // PERF: batched — one path + one fill for all beads
      ctx.fillStyle = pc('warm', 0.55)
      ctx.beginPath()
      const beadR = 1.1 * U
      for (const nodes of loops) {
        for (let i = 0; i < nodes.length; i += 2) {
          const p = nodes[i]
          ctx.moveTo(p.x * sx + beadR, p.y * sy)
          ctx.arc(p.x * sx, p.y * sy, beadR, 0, Math.PI * 2)
        }
      }
      ctx.fill()

      // growth tips — nodes born in the last 30 ticks flare warm and big:
      // the BIRTH is the visible event of this sim (batched)
      ctx.fillStyle = pc('warm', 0.95)
      ctx.beginPath()
      const tipR = 2 * U
      for (const nodes of loops) {
        for (const p of nodes) {
          if (tick - p.born > 30) continue
          ctx.moveTo(p.x * sx + tipR, p.y * sy)
          ctx.arc(p.x * sx, p.y * sy, tipR, 0, Math.PI * 2)
        }
      }
      ctx.fill()
    })
  },
}
