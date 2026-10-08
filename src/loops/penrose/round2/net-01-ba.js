

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sampleInside, repelPoints, pc } from '../common.js'

// Barabási-Albert — MORE. Density up (default population doubled), node
// discs sized by degree with the hubs BIG (glow halo + bright core), edges
// weighted by the brighter endpoint's degree, and every growth event
// VISIBLE: newborn nodes pop in with an expanding birth ring and their
// fresh edges flash. Churn (oldest nodes fade out) keeps it alive; press
// bursts a bigger hub cluster at the cursor.

const PARAMS = [
  { key: 'N', type: 'int', min: 30, max: 600, default: 300, step: 10 },
  { key: 'm', type: 'int', min: 1, max: 8, default: 3, step: 1 },
  { key: 'addPerSec', type: 'int', min: 1, max: 40, default: 12, step: 1 },
  { key: 'nodeSize', type: 'range', min: 0.5, max: 6, default: 2.4, step: 0.5 },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

export const r2_net_01_ba = {
  id: 'r2-net-01-ba',
  name: 'BARABÁSI-ALBERT',
  repo: 'Barabási & Albert, Science 286 (1999)',
  summary:
    'Preferential attachment at full weight: hubs render BIG (degree-sized discs with glow halos and bright cores), edges thicken with degree, and every attachment flashes in with a birth ring. Continuous churn; press bursts a hub cluster.',
  helps: 'Scale-free hub-and-spoke topology growing live — degree concentration mirrors stroke-weight gradients.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.min(sdf.w, sdf.h)
    const Um = Math.min(W, H)
    const K = Um / 640

    const nodes = []
    const edges = []
    const rings = []
    let totalDeg = 0
    let lastAdd = clock.nowSeconds()

    const m0 = 4
    for (let i = 0; i < m0; i++) {
      const [x, y] = sampleInside(sdf, rng)
      nodes.push({ x, y, hx: x, hy: y, deg: 1, fade: 1, dying: false, born: 0 })
      totalDeg += 1
    }
    for (let i = 0; i < m0 - 1; i++) {
      edges.push({ a: i, b: i + 1, born: 0 })
      nodes[i].deg++; nodes[i + 1].deg++; totalDeg += 2
    }

    let prevDown = false
    function removeNode(idx) {
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i]
        if (e.a === idx || e.b === idx) {
          const other = e.a === idx ? e.b : e.a
          nodes[other].deg--
          edges.splice(i, 1)
        } else {
          if (e.a > idx) e.a--
          if (e.b > idx) e.b--
        }
      }
      nodes.splice(idx, 1)
      totalDeg = 0
      for (const nd of nodes) totalDeg += nd.deg
    }

    function addNode(m, atX, atY) {
      if (nodes.length >= num(params, 'N', 300) + 60) return // hard population cap
      const [x, y] = atX != null ? [atX, atY] : sampleInside(sdf, rng)
      const newId = nodes.length
      nodes.push({ x, y, hx: x, hy: y, deg: 0, fade: 1, dying: false, born: 1 })

      const chosen = new Set()
      let attempts = 0
      while (chosen.size < Math.min(m, nodes.length - 1) && attempts < 80) { // capped: each attempt is an O(N) scan
        attempts++
        const r = rng() * totalDeg
        let acc = 0
        for (let i = 0; i < nodes.length - 1; i++) {
          acc += nodes[i].deg
          if (acc >= r && !chosen.has(i)) { chosen.add(i); break }
        }
      }

      for (const t of chosen) {
        edges.push({ a: newId, b: t, born: 1 })
        nodes[t].deg++
        nodes[newId].deg++
        totalDeg += 2
      }
    }

    return wrapLoop(() => {
      const now = clock.nowSeconds()
      const N = num(params, 'N', 300)
      const m = num(params, 'm', 3)
      const addPerSec = num(params, 'addPerSec', 12)
      const nodeSize = num(params, 'nodeSize', 2.4)

      // growth never stops — the churn below keeps the population at N
      const dt = now - lastAdd
      const toAdd = Math.min(10, Math.floor(dt * addPerSec))
      if (toAdd > 0) {
        for (let i = 0; i < toAdd; i++) addNode(m)
        lastAdd = now
      }

      // pointer — repel nodes (× interact); spring toward home restores
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      if (ptr) {
        repelPoints(nodes, ptr, {
          reach: U * 0.15,
          strength: U * 0.015 * interact,
          keep: (nx, ny) => sdf.sample(nx, ny) < 0,
        })
      }

      // down-EDGE — big burst of nodes at the cursor: a local hub cluster
      // blooms (with a press ring); the churn retires the oldest for it
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) {
        rings.push({ x: ptr.x * sx, y: ptr.y * sy, r: Um * 0.012, life: 1 })
        const burst = 6 + Math.round(4 * Math.min(3, interact))
        for (let k = 0; k < burst; k++) {
          const a = rng() * Math.PI * 2
          const r = rng() * U * 0.07
          const bx = ptr.x + Math.cos(a) * r
          const by = ptr.y + Math.sin(a) * r
          if (sdf.sample(bx, by) < 0) addNode(m, bx, by)
        }
      }

      // churn — mark the oldest nodes dying whenever the living population
      // exceeds N; dying nodes fade out, then leave (edges go with them)
      if (nodes.length > 6) {
        let alive = 0
        for (const nd of nodes) if (!nd.dying) alive++
        let over = alive - N
        for (let i = 0; i < nodes.length && over > 0; i++) {
          if (!nodes[i].dying) { nodes[i].dying = true; over-- }
        }
      }
      let removed = 0 // cap: each removeNode is an O(E) reindex
      for (let i = nodes.length - 1; i >= 0; i--) {
        const nd = nodes[i]
        if (!nd.dying) continue
        nd.fade = Math.max(0, nd.fade - 0.03)
        if (nd.fade <= 0 && nodes.length > 6 && removed < 6) { removeNode(i); removed++ }
      }

      for (const n of nodes) {
        n.x += (n.hx - n.x) * 0.05
        n.y += (n.hy - n.y) * 0.05
      }

      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, pc('dim', 0.06), 1.2)

      // edges — weighted by the brighter endpoint's degree; fresh ones flash.
      // Flashing/fading edges stroke individually (few); the steady majority
      // is batched into one path per brightness bucket.
      const maxDeg = nodes.reduce((a, n) => Math.max(a, n.deg), 1)
      ctx.lineCap = 'round'
      for (const e of edges) {
        const na = nodes[e.a], nb = nodes[e.b]
        const ef = Math.min(na.fade, nb.fade)
        if (e.born <= 0 && ef >= 1) continue
        const brightness = Math.max(na.deg, nb.deg) / maxDeg
        const flash = e.born > 0 ? e.born : 0
        ctx.strokeStyle = pc('accent', (0.1 + 0.4 * brightness + 0.5 * flash) * ef)
        ctx.lineWidth = K * (0.8 + 2.6 * brightness) + K * 2 * flash
        ctx.beginPath()
        ctx.moveTo(na.x * sx, na.y * sy)
        ctx.lineTo(nb.x * sx, nb.y * sy)
        ctx.stroke()
        if (e.born > 0) e.born = Math.max(0, e.born - 0.04)
      }
      const NB = 6
      for (let b = 0; b < NB; b++) {
        const mid = (b + 0.5) / NB
        ctx.strokeStyle = pc('accent', 0.1 + 0.4 * mid)
        ctx.lineWidth = K * (0.8 + 2.6 * mid)
        ctx.beginPath()
        let any = false
        for (const e of edges) {
          if (e.born > 0) continue
          const na = nodes[e.a], nb = nodes[e.b]
          if (Math.min(na.fade, nb.fade) < 1) continue
          const brightness = Math.max(na.deg, nb.deg) / maxDeg
          if (Math.min(NB - 1, (brightness * NB) | 0) !== b) continue
          ctx.moveTo(na.x * sx, na.y * sy)
          ctx.lineTo(nb.x * sx, nb.y * sy)
          any = true
        }
        if (any) ctx.stroke()
      }

      // nodes — degree-sized discs; hubs get a glow halo and a bright core;
      // newborns pop in behind an expanding birth ring
      const rCap = Um * 0.032
      for (const n of nodes) {
        const tDeg = n.deg / maxDeg
        const r = Math.min(rCap, K * nodeSize * Math.sqrt(Math.max(0.5, n.deg))) * (0.3 + 0.7 * (1 - n.born))
        if (tDeg > 0.45) {
          ctx.fillStyle = pc('accent', 0.16 * n.fade)
          ctx.beginPath()
          ctx.arc(n.x * sx, n.y * sy, r * 2.1, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = pc('accent', (0.55 + 0.4 * tDeg) * n.fade)
        ctx.beginPath()
        ctx.arc(n.x * sx, n.y * sy, r, 0, Math.PI * 2)
        ctx.fill()
        if (tDeg > 0.7) {
          ctx.fillStyle = pc('fg', 0.85 * n.fade)
          ctx.beginPath()
          ctx.arc(n.x * sx, n.y * sy, r * 0.45, 0, Math.PI * 2)
          ctx.fill()
        }
        if (n.born > 0) {
          ctx.strokeStyle = pc('fg', n.born * 0.8)
          ctx.lineWidth = Math.max(1, K * 1.4)
          ctx.beginPath()
          ctx.arc(n.x * sx, n.y * sy, r + K * (3 + (1 - n.born) * 10), 0, Math.PI * 2)
          ctx.stroke()
          n.born = Math.max(0, n.born - 0.03)
        }
      }

      // press rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const rg = rings[i]
        rg.r += Um * 0.018
        rg.life -= 0.05 // ≥300ms fade (anti-strobe)
        if (rg.life <= 0) { rings.splice(i, 1); continue }
        ctx.strokeStyle = pc('accent', 0.8 * rg.life)
        ctx.lineWidth = Math.max(2, Um * 0.005 * rg.life)
        ctx.beginPath()
        ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2)
        ctx.stroke()
      }
    })
  },
}
