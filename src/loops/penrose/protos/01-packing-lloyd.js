import { Delaunay } from 'd3-delaunay'

import { clear, strokeOutline, wrapLoop, pc, repelPoints } from '../common.js'







// Variable-radius Poisson-disc (multi-pass greedy) + Lloyd relaxation (continuous).
// Repo: kchapelier/fast-2d-poisson-disk-sampling (Bridson) + d3/d3-delaunay (Voronoi).
export const packingLloyd            = {
  id: '01-packing-lloyd',
  name: 'PACKING + LLOYD',
  repo: 'd3-delaunay · Bridson PDS',
  summary:
    'Variable-radius Poisson-disc pack (SDF-scaled radii) settled by Lloyd relaxation. Each frame: Voronoi → move each circle to its cell centroid. Blue-noise → centroidal Voronoi tessellation. Re-usable as the base "packed" layer.',
  helps:
    'The backbone base layer — recreates the Squishy Type reference directly. Matches the ref aesthetic 1:1.',
  // Generation knobs — surfaced as Layout sliders, read live in init() so each
  // slider drives the actual pack/relaxation. Defaults reproduce the ref look.
  params: [
    { key: 'minR', type: 'int', min: 2, max: 24, default: 6, label: 'min radius' },
    { key: 'maxR', type: 'int', min: 16, max: 80, default: 44, label: 'max radius' },
    { key: 'radiusScale', type: 'range', min: 0.4, max: 1.2, step: 0.05, default: 0.85, label: 'radius scale' },
    { key: 'padding', type: 'int', min: 0, max: 10, default: 2, label: 'padding' },
    { key: 'attempts', type: 'int', min: 1000, max: 12000, step: 500, default: 6000, label: 'density' },
    { key: 'relax', type: 'range', min: 0.02, max: 0.5, step: 0.01, default: 0.18, label: 'relax' },
    { key: 'spokes', type: 'int', min: 6, max: 40, default: 22, label: 'spokes' },
    // alive — clock-driven motion (default 0/1 = static, reproduces the ref look)
    { key: 'bounce', type: 'range', min: 0, max: 1, step: 0.02, default: 0, label: 'bounce' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
    { key: 'loop', type: 'range', min: 0.5, max: 8, step: 0.5, default: 3, label: 'loop (s)' },
  ],
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h

    const { minR, maxR, radiusScale, padding, attempts } = params

    // Pack via multi-pass greedy dart-throwing into SDF-constrained space
    const cells         = []
    const cell = Math.max(minR, 2)
    const gw = Math.ceil(sdf.w / cell) + 1
    const gh = Math.ceil(sdf.h / cell) + 1
    const grid             = new Array(gw * gh)
    for (let i = 0; i < grid.length; i++) grid[i] = []
    const gi = (x        , y        ) =>
      Math.max(0, Math.min(gh - 1, Math.floor(y / cell))) * gw +
      Math.max(0, Math.min(gw - 1, Math.floor(x / cell)))

    const collides = (x        , y        , r        )          => {
      const cx = Math.floor(x / cell), cy = Math.floor(y / cell)
      const reach = Math.max(1, Math.ceil((r + maxR) / cell))
      for (let j = -reach; j <= reach; j++) {
        const yy = cy + j
        if (yy < 0 || yy >= gh) continue
        for (let i = -reach; i <= reach; i++) {
          const xx = cx + i
          if (xx < 0 || xx >= gw) continue
          const bucket = grid[yy * gw + xx]
          for (let k = 0; k < bucket.length; k++) {
            const c = cells[bucket[k]]
            const dx = c.x - x, dy = c.y - y
            const s = c.r + r + padding
            if (dx * dx + dy * dy < s * s) return true
          }
        }
      }
      return false
    }

    // PERF: hard population cap — every frame runs a full Delaunay+Voronoi
    // rebuild over the cells, so the pack size must stay bounded no matter
    // what density/minR the sliders ask for.
    const CELL_CAP = 1500
    const bands                     = [
      [maxR * 0.7, maxR],
      [maxR * 0.45, maxR * 0.7],
      [maxR * 0.25, maxR * 0.45],
      [minR, maxR * 0.25],
    ]
    for (const [lo, hi] of bands) {
      if (cells.length >= CELL_CAP) break
      for (let i = 0; i < attempts && cells.length < CELL_CAP; i++) {
        const x = rng() * sdf.w
        const y = rng() * sdf.h
        const s = sdf.sample(x, y)
        if (s >= 0) continue
        const maxPoss = Math.min(maxR, -s * radiusScale - padding)
        if (maxPoss < lo) continue
        const r = Math.min(maxPoss, hi)
        if (r < minR || collides(x, y, r)) continue
        const idx = cells.length
        cells.push({ x, y, r })
        grid[gi(x, y)].push(idx)
      }
    }

    // interaction multiplication — scales how strongly cells relax/interact
    const relaxStrength = params.relax * params.interact
    // grab state — the held cell + a smoothed drag-velocity estimate that
    // becomes the release fling (the inertia feel).
    let grab = null
    const TAU = Math.PI * 2
    // per-cell pulsing display radius (alive bounce), looping every `loop` seconds
    const dispR = (c, ci) => c.r * (1 + params.bounce * Math.sin((clock.nowSeconds() / params.loop) * TAU + ci * 0.7))

    return wrapLoop(() => {
      // Lloyd step: move each circle toward its Voronoi-cell centroid (clamped by SDF).
      const pts = cells.map((c) => [c.x, c.y]                    )
      const delaunay = Delaunay.from(pts)
      const voronoi = delaunay.voronoi([0, 0, sdf.w, sdf.h])
      for (let i = 0; i < cells.length; i++) {
        const poly = voronoi.cellPolygon(i)
        if (!poly) continue
        let cx = 0, cy = 0, area = 0
        for (let k = 0; k < poly.length - 1; k++) {
          const [x0, y0] = poly[k]
          const [x1, y1] = poly[k + 1]
          const cross = x0 * y1 - x1 * y0
          area += cross
          cx += (x0 + x1) * cross
          cy += (y0 + y1) * cross
        }
        area *= 0.5
        if (Math.abs(area) < 1e-6) continue
        cx /= 6 * area
        cy /= 6 * area
        const nx = cells[i].x + (cx - cells[i].x) * relaxStrength
        const ny = cells[i].y + (cy - cells[i].y) * relaxStrength
        if (sdf.sample(nx, ny) < -cells[i].r * 0.2) {
          cells[i].x = nx
          cells[i].y = ny
        }
      }

      // ── pointer interaction, three modes (scaled by `interact`, 0 = inert):
      //   hover  — ambient repel; cells shove aside, Lloyd reseals behind.
      //   hold   — GRAB the nearest cell under the press; it rides the
      //            pointer, plowing overlapping neighbors out of its way.
      //   release— the grabbed cell flies with the drag's smoothed velocity
      //            (inertia fling), friction-decayed below while Lloyd
      //            reabsorbs it. A quick tap = grab + ~zero fling = a poke.
      // ponytail: force constants eyeballed against relax 0.18; tune here.
      const inMask = (nx, ny, c) => sdf.sample(nx, ny) < -c.r * 0.2
      const ptr = params.interact > 0 && pointer ? pointer() : null
      if (ptr?.down) {
        if (!grab) {
          let best = null, bd = Infinity
          for (const c of cells) {
            const dx = c.x - ptr.x, dy = c.y - ptr.y
            const d2 = dx * dx + dy * dy
            const rr = Math.max(c.r * 1.5, minR * 3) // generous ring — touch
            if (d2 < rr * rr && d2 < bd) { bd = d2; best = c }
          }
          if (best) grab = { c: best, px: ptr.x, py: ptr.y, vx: 0, vy: 0 }
        }
        if (grab) {
          const c = grab.c
          grab.vx = grab.vx * 0.5 + (ptr.x - grab.px) * 0.5
          grab.vy = grab.vy * 0.5 + (ptr.y - grab.py) * 0.5
          grab.px = ptr.x
          grab.py = ptr.y
          if (inMask(ptr.x, ptr.y, c)) { c.x = ptr.x; c.y = ptr.y }
          c.vx = 0
          c.vy = 0
          // the carried cell plows overlapping neighbors aside
          for (const o of cells) {
            if (o === c) continue
            const dx = o.x - c.x, dy = o.y - c.y
            const s = c.r + o.r + padding
            const d2 = dx * dx + dy * dy
            if (d2 >= s * s || d2 < 1e-6) continue
            const d = Math.sqrt(d2)
            const push = (s - d) * 0.6
            const nx = o.x + (dx / d) * push
            const ny = o.y + (dy / d) * push
            if (inMask(nx, ny, o)) { o.x = nx; o.y = ny }
          }
        }
      } else {
        if (grab) { // release → inertia fling
          grab.c.vx = grab.vx * params.interact
          grab.c.vy = grab.vy * params.interact
          grab = null
        }
        if (ptr) {
          repelPoints(cells, ptr, {
            reach: maxR * 2.5,
            strength: maxR * 0.12 * params.interact,
            keep: inMask,
          })
        }
      }
      // momentum integration — flung cells coast with friction, soft-bounce
      // off the mask, and hand back to Lloyd as they slow.
      for (const c of cells) {
        if (!c.vx && !c.vy) continue
        const nx = c.x + c.vx, ny = c.y + c.vy
        if (inMask(nx, ny, c)) { c.x = nx; c.y = ny }
        else { c.vx *= -0.5; c.vy *= -0.5 }
        c.vx *= 0.92
        c.vy *= 0.92
        if (c.vx * c.vx + c.vy * c.vy < 0.01) { c.vx = 0; c.vy = 0 }
      }

      // Render — each element pulls its colour from the palette by role:
      // outline/spokes = dim (recessive), edges + dot rings = accent, dots = fg,
      // centres = warm.
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, pc('dim', 0.22), 1)

      // spokes
      ctx.strokeStyle = pc('dim', 0.25)
      ctx.lineWidth = 0.6
      ctx.beginPath()
      const spokeCount = params.spokes
      cells.forEach((c, ci) => {
        const rr = dispR(c, ci)
        for (let i = 0; i < spokeCount; i++) {
          const ang = (i / spokeCount) * TAU
          ctx.moveTo(c.x * sx, c.y * sy)
          ctx.lineTo((c.x + Math.cos(ang) * rr) * sx, (c.y + Math.sin(ang) * rr) * sy)
        }
      })
      ctx.stroke()

      // edges between touching cells (approx via Voronoi neighbors + dist check)
      ctx.strokeStyle = pc('accent', 0.4)
      ctx.lineWidth = 0.8
      ctx.beginPath()
      // PERF: neighbors() yields both directions — skipping j<i dedupes
      // without the per-frame Set + string-key churn
      for (let i = 0; i < cells.length; i++) {
        for (const j of voronoi.neighbors(i)) {
          if (j < i) continue
          const a = cells[i], b = cells[j]
          const dx = a.x - b.x, dy = a.y - b.y
          if (dx * dx + dy * dy < (a.r + b.r + 10) ** 2) {
            ctx.moveTo(a.x * sx, a.y * sy)
            ctx.lineTo(b.x * sx, b.y * sy)
          }
        }
      }
      ctx.stroke()

      // boundary dots (per spoke endpoint) — PERF: one batched path for all
      // dots (cells × spokes arcs), one fill + one stroke instead of one per dot
      ctx.fillStyle = pc('fg')
      ctx.strokeStyle = pc('accent')
      ctx.lineWidth = 1
      ctx.beginPath()
      cells.forEach((c, ci) => {
        const rr = dispR(c, ci)
        for (let i = 0; i < spokeCount; i++) {
          const ang = (i / spokeCount) * TAU
          const bx = (c.x + Math.cos(ang) * rr) * sx
          const by = (c.y + Math.sin(ang) * rr) * sy
          ctx.moveTo(bx + 1.6, by)
          ctx.arc(bx, by, 1.6, 0, Math.PI * 2)
        }
      })
      ctx.fill()
      ctx.stroke()

      // centers — batched
      ctx.fillStyle = pc('warm')
      ctx.beginPath()
      for (const c of cells) {
        ctx.moveTo(c.x * sx + 2.4, c.y * sy)
        ctx.arc(c.x * sx, c.y * sy, 2.4, 0, Math.PI * 2)
      }
      ctx.fill()
    })
  },
}
