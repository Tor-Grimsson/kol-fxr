

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sampleInside, repelPoints, pc } from '../common.js'

// MST medial-axis veins — DENSE. 2-3× the nodes, veins drawn THICK
// (depth-weighted, thickening as they mature), nodes as real discs sized by
// interior depth, and the active growth front GLOWS and pulses as Kruskal
// adds edges. Completion dissolves and regrows (churn); press bursts a
// bigger node cluster at the cursor and the veins grow out to meet it.

const PARAMS = [
  { key: 'N', type: 'int', min: 40, max: 400, default: 220, step: 10 },
  { key: 'edgesPerSec', type: 'int', min: 2, max: 80, default: 30, step: 1 },
  { key: 'depthBias', type: 'range', min: 0, max: 1, default: 0.6, step: 0.05, label: 'medialBias' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

export const r2_net_04_mst = {
  id: 'r2-net-04-mst',
  name: 'MST MEDIAL AXIS VEIN',
  repo: 'Kruskal (1956) + Blum medial axis (1967)',
  summary:
    'Dense node field biased toward the medial axis; Kruskal MST grows shortest-first as a THICK vein network — backbone edges heavy, growth front glowing and pulsing. Dissolve-and-regrow churn; press bursts new nodes for the veins to reach.',
  helps: 'MST on medial-axis samples reconstructs the glyph skeleton at full weight — reads as vasculature, not twigs.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.min(sdf.w, sdf.h)
    const Um = Math.min(W, H)
    const K = Um / 640

    class UF {
      constructor(n) {
        this.parent = []
        this.rank = []
        for (let i = 0; i < n; i++) { this.parent.push(i); this.rank.push(0) }
      }
      add() {
        this.parent.push(this.parent.length)
        this.rank.push(0)
        return this.parent.length - 1
      }
      find(x) {
        while (this.parent[x] !== x) { this.parent[x] = this.parent[this.parent[x]]; x = this.parent[x] }
        return x
      }
      union(a, b) {
        a = this.find(a); b = this.find(b)
        if (a === b) return false
        if (this.rank[a] < this.rank[b]) [a, b] = [b, a]
        this.parent[b] = a
        if (this.rank[a] === this.rank[b]) this.rank[a]++
        return true
      }
    }

    let nodes = []
    let sortedEdges = []
    let mstEdges = []
    let uf
    let edgeIdx = 0
    let lastAdd = 0
    let prevN = -1, prevBias = -1

    let fade = 0
    let prevDown = false
    let f = 0 // frame counter — drives growth-front glow + maturation
    const rings = []
    const FADE_FRAMES = 70

    function rebuild(N, depthBias) {
      nodes = []
      const candidates = []
      for (let i = 0; i < N * 8; i++) {
        const [x, y] = sampleInside(sdf, rng)
        const d = -sdf.sample(x, y) // positive = inside
        candidates.push({ x, y, depth: d })
      }
      const maxDepth = Math.max(...candidates.map(c => c.depth))
      for (const c of candidates) {
        if (nodes.length >= N) break
        const p = Math.pow(c.depth / maxDepth, depthBias)
        if (rng() < p) nodes.push(c)
      }
      while (nodes.length < N) {
        const [x, y] = sampleInside(sdf, rng)
        nodes.push({ x, y, depth: -sdf.sample(x, y) })
      }
      for (const n of nodes) { n.hx = n.x; n.hy = n.y; n.connected = false }

      const all = []
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          all.push({ a: i, b: j, w: Math.sqrt(dx * dx + dy * dy) })
        }
      all.sort((a, b) => a.w - b.w)

      sortedEdges = all
      mstEdges = []
      uf = new UF(nodes.length)
      edgeIdx = 0
      lastAdd = clock.nowSeconds()
    }

    function segInside(ax, ay, bx, by) {
      const steps = 6
      for (let i = 1; i < steps; i++) {
        const t = i / steps
        if (sdf.sample(ax + (bx - ax) * t, ay + (by - ay) * t) >= 0) return false
      }
      return true
    }

    return wrapLoop(() => {
      f++
      const N = num(params, 'N', 220)
      const edgesPerSec = num(params, 'edgesPerSec', 30)
      const depthBias = num(params, 'depthBias', 0.6)

      if (N !== prevN || Math.abs(depthBias - prevBias) > 0.01) {
        rebuild(N, depthBias); prevN = N; prevBias = depthBias
      }

      const now = clock.nowSeconds()
      const dt = now - lastAdd
      const toAdd = Math.floor(dt * edgesPerSec)

      if (toAdd > 0 && edgeIdx < sortedEdges.length) {
        let added = 0
        let scanned = 0 // hard cap — late-Kruskal frames scanned thousands of rejected edges (segInside = 6 sdf samples each)
        while (added < toAdd && scanned < 400 && edgeIdx < sortedEdges.length) {
          scanned++
          const e = sortedEdges[edgeIdx++]
          const na = nodes[e.a], nb = nodes[e.b]
          if (segInside(na.x, na.y, nb.x, nb.y)) {
            if (uf.union(e.a, e.b)) {
              const avgDepth = (na.depth + nb.depth) / 2
              mstEdges.push({ a: e.a, b: e.b, depth: avgDepth, born: f })
              na.connected = true
              nb.connected = true
              added++
            }
          }
        }
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
      for (const n of nodes) {
        n.x += (n.hx - n.x) * 0.05
        n.y += (n.hy - n.y) * 0.05
      }

      // down-EDGE — big burst of nodes at the cursor; candidate edges merge
      // into the Kruskal queue so the veins grow out to meet them
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge && fade === 0) {
        rings.push({ x: ptr.x * sx, y: ptr.y * sy, r: Um * 0.012, life: 1 })
        const burst = 6 + Math.round(4 * Math.min(3, interact))
        const fresh = []
        for (let k = 0; k < burst; k++) {
          const a = rng() * Math.PI * 2
          const r = rng() * U * 0.08
          const bx = ptr.x + Math.cos(a) * r
          const by = ptr.y + Math.sin(a) * r
          if (sdf.sample(bx, by) >= 0) continue
          const idx = nodes.length
          nodes.push({ x: bx, y: by, hx: bx, hy: by, depth: -sdf.sample(bx, by), connected: false })
          uf.add()
          for (let j = 0; j < idx; j++) {
            const dx = nodes[j].x - bx, dy = nodes[j].y - by
            fresh.push({ a: idx, b: j, w: Math.sqrt(dx * dx + dy * dy) })
          }
        }
        if (fresh.length) {
          sortedEdges = sortedEdges.slice(edgeIdx).concat(fresh).sort((p, q) => p.w - q.w)
          edgeIdx = 0
        }
      }

      // lifecycle — completion (or exhaustion) dissolves, then regrows
      const complete = mstEdges.length >= nodes.length - 1 || edgeIdx >= sortedEdges.length
      if (fade > 0) {
        fade--
        if (fade === 0) rebuild(N, depthBias)
      } else if (complete && sortedEdges.length > 0) {
        fade = FADE_FRAMES
      }
      const dis = fade > 0 ? fade / FADE_FRAMES : 1

      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, pc('dim', 0.06), 1.2)

      let maxDepth = 1
      for (const n of nodes) if (n.depth > maxDepth) maxDepth = n.depth

      // veins — thick, depth-weighted, thickening as they mature; the
      // freshest edges are the growth front: a glowing, pulsing overlay
      ctx.lineCap = 'round'
      for (const e of mstEdges) {
        const na = nodes[e.a], nb = nodes[e.b]
        const tD = e.depth / maxDepth
        const age = f - e.born
        const matur = Math.min(1, age / 120)
        const w = Math.max(K * 1.6, K * (1.6 + 3.4 * tD) * (0.55 + 0.45 * matur))
        if (age < 45) {
          const g = 1 - age / 45
          const pulseF = 0.7 + 0.3 * Math.sin(f * 0.1) // ~1Hz pulse (was 3.3Hz strobe)
          ctx.strokeStyle = pc('fg', 0.5 * g * pulseF * dis)
          ctx.lineWidth = w + K * 5 * g
          ctx.beginPath()
          ctx.moveTo(na.x * sx, na.y * sy)
          ctx.lineTo(nb.x * sx, nb.y * sy)
          ctx.stroke()
        }
        ctx.strokeStyle = pc('warm', (0.4 + 0.5 * tD) * dis)
        ctx.lineWidth = w
        ctx.beginPath()
        ctx.moveTo(na.x * sx, na.y * sy)
        ctx.lineTo(nb.x * sx, nb.y * sy)
        ctx.stroke()
        // frontier halos on the newest connections
        if (age < 45) {
          const g = 1 - age / 45
          ctx.fillStyle = pc('fg', 0.45 * g * dis)
          ctx.beginPath()
          ctx.arc(nb.x * sx, nb.y * sy, K * 7 * g + 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // nodes — real discs sized by interior depth; unconnected wait fainter.
      // Batched: one fill path (connected) + one stroke path (waiting).
      ctx.fillStyle = pc('dim', 0.16 * dis)
      ctx.beginPath()
      for (const n of nodes) {
        if (!n.connected) continue
        const r = K * (1.7 + 2.8 * (n.depth / maxDepth))
        ctx.moveTo(n.x * sx + r, n.y * sy)
        ctx.arc(n.x * sx, n.y * sy, r, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.strokeStyle = pc('dim', 0.07 * dis)
      ctx.lineWidth = Math.max(1, K)
      ctx.beginPath()
      for (const n of nodes) {
        if (n.connected) continue
        const r = K * (1.7 + 2.8 * (n.depth / maxDepth))
        ctx.moveTo(n.x * sx + r, n.y * sy)
        ctx.arc(n.x * sx, n.y * sy, r, 0, Math.PI * 2)
      }
      ctx.stroke()

      // press rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const rg = rings[i]
        rg.r += Um * 0.018
        rg.life -= 0.05 // ≥300ms fade (anti-strobe)
        if (rg.life <= 0) { rings.splice(i, 1); continue }
        ctx.strokeStyle = pc('warm', 0.8 * rg.life)
        ctx.lineWidth = Math.max(2, Um * 0.005 * rg.life)
        ctx.beginPath()
        ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2)
        ctx.stroke()
      }
    })
  },
}
