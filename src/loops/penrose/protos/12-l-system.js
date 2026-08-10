
import { clear, strokeOutline, wrapLoop, sampleInside, pc } from '../common.js'

// Procedural branching tree using space-colonization-like growth rules.
// A pragmatic L-system substitute: interpret branching stochastically with
// angle jitter and SDF clamping. Produces recursive vector branches.
//
// Reference: algorithmicbotany.org (Prusinkiewicz canon) · Nature of Code ch. 8.
export const lSystem            = {
  id: '12-l-system',
  name: 'L-SYSTEM / FRACTAL BRANCH',
  repo: 'algorithmicbotany.org · Shiffman Nature of Code Ch.8',
  summary:
    'Recursive branching with stochastic angle + length rules. Each tick: pick a live tip; if SDF permits growth, spawn one or two children at angle jitter. Produces classical tree / lightning / coral branching. Research flagged this as a deprioritized candidate for glyph fill because branches naturally escape domains — here they are SDF-clamped to demonstrate the limit.',
  helps:
    'Branches stop at SDF → you see dead tips stranded inside. Space colonization (#03) does what L-systems can\'t: it grows branches that respect the shape. Keep for comparison.',
  params: [
    { key: 'maxDepth', type: 'int', min: 4, max: 18, default: 11, label: 'max depth' },
    { key: 'startLength', type: 'int', min: 4, max: 24, default: 10, label: 'start length' },
    { key: 'branchChance', type: 'range', min: 0, max: 1, step: 0.05, default: 0.35, label: 'branch chance' },
    { key: 'forkAngle', type: 'range', min: 0.1, max: 1.2, step: 0.05, default: 0.45, label: 'fork angle' },
    { key: 'angleJitter', type: 'range', min: 0, max: 1, step: 0.05, default: 0.4, label: 'angle jitter' },
    { key: 'lengthDecay', type: 'range', min: 0.4, max: 0.95, step: 0.01, default: 0.72, label: 'length decay' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.max(1, Math.min(W, H) / 320) // size unit — marks scale with the canvas

    const { maxDepth, startLength, branchChance, forkAngle, angleJitter, lengthDecay } = params

    const branches           = []
    const endpointAngleJitter = angleJitter
    let prevDown = false

    /* Living system (2026-08-09): a canopy where every branch is done is a
     * fossil. Every root starts a TREE with a birth tick; a tree that has
     * finished growing and outlived its span fades out (30 frames) and its
     * branches are removed (indices remapped), freeing canopy space. When
     * the forest thins, roots auto-replant at a slow trickle. Press = plant
     * under the cursor + SHOCKWAVE: nearby branches re-arm (done = false)
     * and re-produce — regrowth is the event. */
    let tick = 0
    let plantCounter = 0
    const trees = new Map() // treeId → { born, fade } (fade < 0 = live)
    const TREE_FADE = 30
    const TREE_LIFESPAN = 500
    const CANOPY_CAP = 3500
    const plant = (px        , py        , ang        ) => {
      const id = plantCounter++
      trees.set(id, { born: tick, fade: -1 })
      branches.push({ x: px, y: py, a: ang, depth: 0, parent: -1, length: startLength, done: false, tree: id })
    }
    const [x0, y0] = sampleInside(sdf, rng)
    plant(x0, y0, -Math.PI / 2)

    return wrapLoop(() => {
      tick++
      // Pointer replant — the sim terminates (every branch goes done), so a
      // passive force would do nothing. A fresh press inside the mask roots a
      // new branch under the cursor (same shape as the seed root, random angle).
      const ptr = params.interact > 0 && pointer ? pointer() : null
      if (ptr?.down && !prevDown) {
        if (sdf.sample(ptr.x, ptr.y) < 0) plant(ptr.x, ptr.y, rng() * Math.PI * 2)
        // shockwave (2× the old reach) — re-arm nearby branches so they re-produce
        const reach = Math.min(sdf.w, sdf.h) * 0.28 * Math.min(2, params.interact)
        for (const b of branches) {
          if (b.depth >= maxDepth) continue
          const t = trees.get(b.tree)
          if (t && t.fade >= 0) continue // not on a dissolving tree
          const dx = b.x - ptr.x, dy = b.y - ptr.y
          if (dx * dx + dy * dy < reach * reach) b.done = false
        }
      }
      prevDown = !!(ptr && ptr.down)

      // one growth step per frame: each "not-done" branch tries to grow one child
      const toGrow           = []
      for (let i = 0; i < branches.length; i++) if (!branches[i].done) toGrow.push(i)
      for (const idx of toGrow) {
        const b = branches[idx]
        b.done = true // we only grow each once
        if (b.depth >= maxDepth) continue
        const produce = (angOff        ) => {
          const ang = b.a + angOff + (rng() - 0.5) * endpointAngleJitter
          const len = b.length * (lengthDecay + rng() * 0.12)
          const nx = b.x + Math.cos(ang) * len
          const ny = b.y + Math.sin(ang) * len
          if (sdf.sample(nx, ny) >= 0) return
          branches.push({
            x: nx, y: ny, a: ang, depth: b.depth + 1, parent: idx, length: len, done: false, tree: b.tree,
          })
        }
        const forks = rng() < branchChance ? 2 : 1
        if (forks === 2) {
          produce(-forkAngle + (rng() - 0.5) * 0.2)
          produce(forkAngle + (rng() - 0.5) * 0.2)
        } else {
          produce(0)
        }
      }

      // lifecycle — count per-tree growth, fade finished old trees, remove
      // fully faded ones (remap parent indices), replant when the forest thins
      const growing = new Map()
      for (const b of branches) {
        if (!b.done) growing.set(b.tree, (growing.get(b.tree) ?? 0) + 1)
      }
      let liveTrees = 0
      let oldestLive = -1, oldestBorn = Infinity
      for (const [id, t] of trees) {
        if (t.fade > 0) { t.fade--; continue }
        if (t.fade === 0) continue
        liveTrees++
        if (t.born < oldestBorn) { oldestBorn = t.born; oldestLive = id }
        if (!growing.has(id) && tick - t.born > TREE_LIFESPAN) t.fade = TREE_FADE
      }
      if (branches.length > CANOPY_CAP && oldestLive >= 0) {
        const t = trees.get(oldestLive)
        if (t && t.fade < 0) t.fade = TREE_FADE
      }
      let hasDead = false
      for (const t of trees.values()) if (t.fade === 0) { hasDead = true; break }
      if (hasDead) {
        const map = new Int32Array(branches.length).fill(-1)
        const next           = []
        for (let i = 0; i < branches.length; i++) {
          const b = branches[i]
          const t = trees.get(b.tree)
          if (t && t.fade === 0) continue
          map[i] = next.length
          next.push(b)
        }
        for (const b of next) b.parent = b.parent < 0 ? -1 : map[b.parent]
        branches.length = 0
        for (const b of next) branches.push(b)
        for (const [id, t] of trees) if (t.fade === 0) trees.delete(id)
      }
      if ((liveTrees < 3 || branches.length < 400) && rng() < 0.05) {
        const [px, py] = sampleInside(sdf, rng)
        plant(px, py, rng() * Math.PI * 2)
      }

      // Render — warm-led coral canopy, 3× stroke weight, fg growth tips
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, pc('fg', 0.18), 1.4)

      const treeAlpha = (id        ) => {
        const t = trees.get(id)
        return t && t.fade >= 0 ? t.fade / TREE_FADE : 1
      }

      // live trees batched
      ctx.strokeStyle = pc('warm', 0.85)
      ctx.lineWidth = 1.1 * U
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (const b of branches) {
        if (b.parent < 0 || treeAlpha(b.tree) < 1) continue
        const p = branches[b.parent]
        ctx.moveTo(p.x * sx, p.y * sy)
        ctx.lineTo(b.x * sx, b.y * sy)
      }
      ctx.stroke()

      // fading trees stroked per tree with their fade alpha
      for (const [id, t] of trees) {
        if (t.fade < 0) continue
        const fa = t.fade / TREE_FADE
        ctx.strokeStyle = pc('warm', 0.85 * fa)
        ctx.beginPath()
        for (const b of branches) {
          if (b.tree !== id || b.parent < 0) continue
          const p = branches[b.parent]
          ctx.moveTo(p.x * sx, p.y * sy)
          ctx.lineTo(b.x * sx, b.y * sy)
        }
        ctx.stroke()
      }

      // junction beads — PERF: live trees batch into one path + one fill;
      // only branches on fading trees pay a per-dot style (they're few)
      const beadR = 1 * U
      ctx.fillStyle = pc('warm', 0.9)
      ctx.beginPath()
      for (const b of branches) {
        if (treeAlpha(b.tree) < 1) continue
        ctx.moveTo(b.x * sx + beadR, b.y * sy)
        ctx.arc(b.x * sx, b.y * sy, beadR, 0, Math.PI * 2)
      }
      ctx.fill()
      for (const b of branches) {
        const fa = treeAlpha(b.tree)
        if (fa >= 1) continue
        ctx.fillStyle = pc('warm', 0.9 * fa)
        ctx.beginPath()
        ctx.arc(b.x * sx, b.y * sy, beadR, 0, Math.PI * 2)
        ctx.fill()
      }

      // ACTIVE growth tips flare bright fg — birth is visible at the tip (batched)
      ctx.fillStyle = pc('fg', 0.95)
      ctx.beginPath()
      const tipR = 2.4 * U
      for (const b of branches) {
        if (b.done) continue
        ctx.moveTo(b.x * sx + tipR, b.y * sy)
        ctx.arc(b.x * sx, b.y * sy, tipR, 0, Math.PI * 2)
      }
      ctx.fill()
    })
  },
}
