// Biomechanical L-System — SDF gradient tropism + continuous tip extension.
// Each segment's heading bends toward -∇sdf (inward) at spawn; segments
// EXTEND smoothly (animated progress, ease-out) instead of popping in, and
// children sprout the moment their parent completes — growth is visible
// every single frame.
//
// Reference: Jirasek, Prusinkiewicz & Moulia, Plant Biomechanics 2000.
//            ABOP Ch.2 tropism mechanics (T(e, alpha) symbol).
//
// ALIVE-ON-ARRIVAL REWORK (2026-08-09): the grove boots with 3 thick trunks
// already extending (staggered progress, so frame one shows growth). Trees
// mature, stand briefly, fade, and are replanted staggered — the grove never
// stops churning. Tropism leans toward the pointer through a heavy-lerped
// wind vector (narrow blend); press plants a new tree at the cursor with a
// root flash.

import { num, bool } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sampleInside, sdfGrad, pc } from '../common.js'

const PARAMS          = [
  { key: 'angle',     type: 'range', min: 10,  max: 60,  default: 28,  step: 1,    label: 'branch angle °' },
  { key: 'tropism',   type: 'range', min: 0,   max: 1.5, default: 0.6, step: 0.05, label: 'tropism strength' },
  { key: 'growRate',  type: 'range', min: 0.2, max: 4,   default: 1.4, step: 0.1,  label: 'grow rate' },
  { key: 'maxDepth',  type: 'int',   min: 3,   max: 9,   default: 6,   step: 1,    label: 'max depth' },
  { key: 'taper',     type: 'range', min: 0.5, max: 0.95,default: 0.72,step: 0.01, label: 'length taper' },
  { key: 'showLoad',  type: 'boolean', default: false, label: 'colour by load' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

export const r2_lsys_01_tropism            = {
  id: 'r2-lsys-01-tropism',
  name: 'BIOMECHANICAL TROPISM',
  repo: 'Jirasek/Prusinkiewicz/Moulia 2000 + ABOP Ch.2',
  summary: 'SDF gradient replaces gravity as the tropism vector; branch headings bend inward weighted by accumulated mechanical load.',
  helps: 'Branches curve toward the letterform interior as they age — silhouette-hugging without hard clamping rules.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h

    const MAX_TREES = 3
    const HOLD = 3          // clock-seconds a mature tree stands before fading
    const trees = []        // { segs, fade, dying, grownAt, born }
    const flashes = []      // root-plant pulses { x, y, f }
    const pending = []      // frame countdowns to staggered replants
    let leanX = 0, leanY = 0  // heavy-lerped pointer wind
    let prevT = null
    let prevDown = false

    const easeOut = (p) => 1 - (1 - p) * (1 - p)

    // hoisted render buckets — same-depth segments share width+alpha, so they
    // batch into ONE stroke per depth instead of one stroke per segment
    const depthBuckets = Array.from({ length: 10 }, () => [])

    function plantTree(x, y, prog0 = 0) {
      // a thick trunk, shortened if it would poke through the mask
      let len = 26 * (0.9 + rng() * 0.2)
      while (len > 8 && sdf.sample(x, y - len) >= 0) len *= 0.8
      const segs = [{
        x0: x, y0: y, hx: 0, hy: -1, len,
        prog: prog0, depth: 0, parent: -1, children: [], spawned: false, load: 0,
      }]
      trees.push({ segs, fade: 1, dying: false, grownAt: null, born: clock.nowSeconds() })
      flashes.push({ x, y, f: 1 })
    }

    function spawnPoint() {
      // spread new roots away from live trees
      let best = null, bestD = -1
      for (let k = 0; k < 6; k++) {
        const [x, y] = sampleInside(sdf, rng)
        if (!trees.length) return [x, y]
        let dmin = Infinity
        for (const tr of trees) {
          const r = tr.segs[0]
          const d = Math.hypot(x - r.x0, y - r.y0)
          if (d < dmin) dmin = d
        }
        if (dmin > bestD) { bestD = dmin; best = [x, y] }
      }
      return best
    }

    function spawnChildren(segs, idx, angleRad, alpha, maxDepth, taper) {
      const s = segs[idx]
      if (s.depth + 1 > maxDepth) return
      const tipX = s.x0 + s.hx * s.len
      const tipY = s.y0 + s.hy * s.len
      const spawn = (angOffset) => {
        // tropism target: SDF-inward, bent by the heavy-lerped pointer wind
        const [gx, gy] = sdfGrad(sdf, tipX, tipY)
        const gm = Math.hypot(gx, gy) || 1
        let ex = -gx / gm + leanX * 1.2
        let ey = -gy / gm + leanY * 1.2
        const em = Math.hypot(ex, ey) || 1
        ex /= em; ey /= em
        // H' = H + alpha*(e - (H·e)H)
        const base = Math.atan2(s.hy, s.hx) + angOffset
        let hx = Math.cos(base), hy = Math.sin(base)
        const dot = hx * ex + hy * ey
        hx += alpha * (ex - dot * hx)
        hy += alpha * (ey - dot * hy)
        const hm = Math.hypot(hx, hy) || 1
        hx /= hm; hy /= hm

        const len = Math.max(5, 26 * Math.pow(taper, s.depth + 1)) * (0.9 + rng() * 0.2)
        if (sdf.sample(tipX + hx * len, tipY + hy * len) >= 0) return
        const ci = segs.length
        segs.push({
          x0: tipX, y0: tipY, hx, hy, len,
          prog: 0, depth: s.depth + 1, parent: idx, children: [], spawned: false, load: 0,
        })
        s.children.push(ci)
      }
      if (rng() < 0.65) {
        spawn(-angleRad * (0.8 + rng() * 0.4))
        spawn( angleRad * (0.8 + rng() * 0.4))
      } else {
        spawn((rng() - 0.5) * angleRad * 0.6)
      }
    }

    function updateLoad(segs, i) {
      const s = segs[i]
      s.load = s.len * s.prog
      for (const c of s.children) s.load += updateLoad(segs, c)
      return s.load
    }

    // boot — the grove is alive immediately: 3 thick trunks mid-extension
    for (let i = 0; i < MAX_TREES; i++) {
      const [x, y] = spawnPoint()
      plantTree(x, y, 0.3 + i * 0.22)
    }

    return wrapLoop(() => {
      const t = clock.nowSeconds()
      if (prevT == null) prevT = t
      const dtF = Math.min(0.1, Math.max(0, t - prevT))
      prevT = t

      const angleRad   = (num(params, 'angle', 28) * Math.PI) / 180
      const alpha      = num(params, 'tropism', 0.6)
      const growRate   = num(params, 'growRate', 1.4)
      const maxDepth   = num(params, 'maxDepth', 6)
      const taper      = num(params, 'taper', 0.72)
      const colorLoad  = bool(params, 'showLoad', false)

      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null

      // pointer wind — a NARROW lean (≤0.4 blend) reached through a heavy
      // lerp; idle eases back to pure SDF tropism
      let twx = 0, twy = 0
      if (ptr) {
        const dx = ptr.x - sdf.w / 2, dy = ptr.y - sdf.h / 2
        const m = Math.hypot(dx, dy) || 1
        const g = Math.min(1, 0.4 * interact)
        twx = (dx / m) * g
        twy = (dy / m) * g
      }
      leanX += (twx - leanX) * 0.03
      leanY += (twy - leanY) * 0.03

      // press = plant at the cursor with a root flash (oldest tree retires
      // if the grove is full)
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge && sdf.sample(ptr.x, ptr.y) < 0) {
        const alive = trees.filter((tr) => !tr.dying)
        if (alive.length >= MAX_TREES) alive[0].dying = true
        plantTree(ptr.x, ptr.y)
      }

      // ── continuous growth — every growing segment extends every frame ──
      const dp = growRate * dtF * 1.6
      for (const tree of trees) {
        if (tree.dying) continue
        const segs = tree.segs
        const nSeg = segs.length // children pushed this frame start next frame
        for (let i = 0; i < nSeg; i++) {
          const s = segs[i]
          if (s.prog < 1) {
            s.prog = Math.min(1, s.prog + dp)
            if (s.prog >= 1 && !s.spawned) {
              s.spawned = true
              spawnChildren(segs, i, angleRad, alpha, maxDepth, taper)
            }
          }
        }
        const anyGrowing = segs.some((s) => s.prog < 1)
        if (!anyGrowing && tree.grownAt == null) tree.grownAt = t
        if (tree.grownAt != null && t - tree.grownAt > HOLD) tree.dying = true
      }

      // grove churn — dying trees fade out and are replaced, staggered
      for (let i = trees.length - 1; i >= 0; i--) {
        const tree = trees[i]
        if (!tree.dying) continue
        tree.fade -= 0.012
        if (tree.fade <= 0) trees.splice(i, 1)
      }
      let alive = 0
      for (const tr of trees) if (!tr.dying) alive++
      if (alive + pending.length < MAX_TREES) pending.push(15 + Math.floor(rng() * 50))
      for (let i = pending.length - 1; i >= 0; i--) {
        if (--pending[i] > 0) continue
        pending.splice(i, 1)
        const [x, y] = spawnPoint()
        plantTree(x, y)
      }

      if (colorLoad) for (const tree of trees) updateLoad(tree.segs, 0)

      // ── render ──
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(243,231,207,0.3)', 1.8)

      ctx.lineCap = 'round'
      for (const tree of trees) {
        const segs = tree.segs
        const fadeA = Math.max(0, tree.fade)
        if (!colorLoad) {
          // batched path: one stroke per depth (identical width+alpha per depth)
          for (let d = 0; d < 10; d++) depthBuckets[d].length = 0
          for (let i = 0; i < segs.length; i++) {
            const s = segs[i]
            if (s.prog > 0) depthBuckets[Math.min(9, s.depth)].push(i)
          }
          for (let d = 0; d < 10; d++) {
            const bucket = depthBuckets[d]
            if (!bucket.length) continue
            ctx.lineWidth = Math.max(1.6, 9 - d * 1.2)
            ctx.strokeStyle = pc('warm', (0.5 + 0.5 * (1 - d / 9)) * fadeA)
            ctx.beginPath()
            for (const i of bucket) {
              const s = segs[i]
              const e = easeOut(s.prog)
              ctx.moveTo(s.x0 * sx, s.y0 * sy)
              ctx.lineTo((s.x0 + s.hx * s.len * e) * sx, (s.y0 + s.hy * s.len * e) * sy)
            }
            ctx.stroke()
          }
          // live buds — the extending tips carry a warm ember (one batched fill)
          let anyBud = false
          for (const s of segs) {
            if (s.prog <= 0 || s.prog >= 1) continue
            if (!anyBud) { ctx.fillStyle = pc('warm', 0.9 * fadeA); ctx.beginPath(); anyBud = true }
            const e = easeOut(s.prog)
            const bx = (s.x0 + s.hx * s.len * e) * sx
            const by = (s.y0 + s.hy * s.len * e) * sy
            ctx.moveTo(bx + 2.6, by)
            ctx.arc(bx, by, 2.6, 0, Math.PI * 2)
          }
          if (anyBud) ctx.fill()
        } else for (let i = 0; i < segs.length; i++) {
          const s = segs[i]
          if (s.prog <= 0) continue
          const e = easeOut(s.prog)
          const tx = s.x0 + s.hx * s.len * e
          const ty = s.y0 + s.hy * s.len * e
          ctx.lineWidth = Math.max(1.6, 9 - s.depth * 1.2)
          const loadNorm = Math.min(1, s.load / 120)
          const r = Math.round(110 + 145 * loadNorm)
          const g = Math.round(200 - 80 * loadNorm)
          const b = Math.round(250 - 110 * loadNorm)
          ctx.strokeStyle = `rgba(${r},${g},${b},${fadeA.toFixed(2)})`
          ctx.beginPath()
          ctx.moveTo(s.x0 * sx, s.y0 * sy)
          ctx.lineTo(tx * sx, ty * sy)
          ctx.stroke()

          // live buds — the extending tips carry a warm ember
          if (s.prog < 1) {
            ctx.fillStyle = pc('warm', 0.9 * fadeA)
            ctx.beginPath()
            ctx.arc(tx * sx, ty * sy, 2.6, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        // root dot — accent anchor
        ctx.fillStyle = pc('accent', fadeA)
        ctx.beginPath()
        ctx.arc(segs[0].x0 * sx, segs[0].y0 * sy, 6, 0, Math.PI * 2)
        ctx.fill()
      }

      // root flashes — a planting rings out
      for (let i = flashes.length - 1; i >= 0; i--) {
        const fl = flashes[i]
        fl.f -= 0.03
        if (fl.f <= 0) { flashes.splice(i, 1); continue }
        ctx.strokeStyle = pc('warm', fl.f * 0.8)
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(fl.x * sx, fl.y * sy, (1 - fl.f) * 30 + 6, 0, Math.PI * 2)
        ctx.stroke()
      }
    })
  },
}
