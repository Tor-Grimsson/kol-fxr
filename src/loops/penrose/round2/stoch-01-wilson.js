// Wilson's Algorithm — Loop-Erased Random Walk → Uniform Spanning Tree
// Each frame: advance the active walker N steps, detect loops (erase them),
// commit the path when it hits the growing tree.
//
// Wilson (1996) STOC · Bostock gist https://gist.github.com/mbostock/11357811
//
// CALM REWORK (2026-08-09 — "tweaking" fix): the walker cadence is slowed
// and its probe path draws as ONE smooth quadratic thread (dim tail, bright
// head) instead of a flickering jag. Committed corridors materialize with a
// warm ease-in glow (~1s) and settle into the fg tree; erosion retires the
// oldest corridor rarely, and every dissolve is multi-second. The whole tree
// breathes on a slow sine. Press = a radial dissolve WAVE that sweeps
// outward from the cursor melting corridors as it passes — never an instant
// splice.

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, pc, rampRGB } from '../common.js'

const PARAMS          = [
  { key: 'stepsPerFrame', type: 'int',   min: 5,   max: 200, default: 30,  step: 5,    label: 'steps/frame' },
  { key: 'lattice',       type: 'int',   min: 40,  max: 160, default: 90,  step: 10,   label: 'lattice size' },
  { key: 'walkerBright',  type: 'range', min: 0.2, max: 1.0, default: 0.9, step: 0.05, label: 'walker alpha' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

export const r2_stoch_01_wilson            = {
  id: 'r2-stoch-01-wilson',
  name: 'WILSON LERW / UST',
  repo: 'Wilson 1996 STOC · Bostock gist/11357811',
  summary: 'Loop-erased random walk builds a uniform spanning tree on a lattice inside the glyph. The live walker wanders, erases its own loops, and snaps into the growing tree on contact.',
  helps: 'Dramatic live walk + loop erasure + tree fill — the most visually theatrical stochastic growth algorithm.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const G      = num(params, 'lattice', 90)
    let spf      = num(params, 'stepsPerFrame', 30)
    let wAlpha   = num(params, 'walkerBright', 0.9)

    function buildGrid(g) {
      const inside = new Uint8Array(g * g)
      const cells = []
      for (let y = 0; y < g; y++) {
        for (let x = 0; x < g; x++) {
          const i = y * g + x
          if (sdf.sample((x + 0.5) / g * sdf.w, (y + 0.5) / g * sdf.h) < 0) {
            inside[i] = 1
            cells.push(i)
          }
        }
      }
      return { inside, cells }
    }

    const grid = buildGrid(G)

    // lazy-deletion sampling pool — replaces the per-commit filter() over the
    // whole lattice (O(cells) alloc+scan per commit, many commits per frame)
    const unvisited = grid.cells.slice()
    const inPool = new Uint8Array(G * G)
    for (const c of grid.cells) inPool[c] = 1

    const inTree  = new Uint8Array(G * G)
    const pathMap = new Int32Array(G * G).fill(-1) // points toward start of walk
    const committed = []  // { a, b, born } corridors in the tree
    const eroding   = []  // { a, b, f } corridors dissolving out (slow)
    const waves     = []  // { cx, cy, r, rMax } press dissolve wavefronts

    const nbBuf = new Int32Array(4) // hoisted — no per-step neighbor alloc
    function neighbors(idx, g, inside) {
      const x = idx % g, y = (idx / g) | 0
      let n = 0
      if (x > 0     && inside[idx - 1]) nbBuf[n++] = idx - 1
      if (x < g - 1 && inside[idx + 1]) nbBuf[n++] = idx + 1
      if (y > 0     && inside[idx - g]) nbBuf[n++] = idx - g
      if (y < g - 1 && inside[idx + g]) nbBuf[n++] = idx + g
      return n
    }

    let walkerPos = -1

    function pickNextWalker() {
      // sample the pool; cells found already in the tree are swap-removed
      while (unvisited.length > 0) {
        const j = Math.floor(rng() * unvisited.length)
        const c = unvisited[j]
        if (inTree[c]) {
          inPool[c] = 0
          unvisited[j] = unvisited[unvisited.length - 1]
          unvisited.pop()
          continue
        }
        walkerPos = c
        pathMap[walkerPos] = walkerPos // sentinel: path start
        return
      }
      walkerPos = -1
    }

    // Plant seed
    if (grid.cells.length > 0) {
      const seed = grid.cells[Math.floor(rng() * grid.cells.length)]
      inTree[seed] = 1
    }
    pickNextWalker()

    let frame = 0
    let fade = 0
    let erodeTick = 0
    let prevDown = false
    const FADE_FRAMES = 150   // completion dissolve — multi-second breath out
    const GLOW = 55           // frames a newborn corridor takes to settle in

    function restart() {
      inTree.fill(0)
      pathMap.fill(-1)
      committed.length = 0
      eroding.length = 0
      waves.length = 0
      unvisited.length = 0
      inPool.fill(0)
      for (const c of grid.cells) { inPool[c] = 1; unvisited.push(c) }
      if (grid.cells.length > 0) {
        const seed = grid.cells[Math.floor(rng() * grid.cells.length)]
        inTree[seed] = 1
      }
      pickNextWalker()
    }

    function commitPath(treeEntry) {
      let cur = walkerPos
      while (cur !== treeEntry) {
        const nxt = pathMap[cur]
        if (nxt < 0 || nxt === cur) break
        committed.push({ a: cur, b: nxt, born: frame })
        inTree[cur] = 1
        cur = nxt
      }
    }

    function retire(c) {
      inTree[c.a] = 0
      pathMap[c.a] = -1
      if (!inPool[c.a]) { inPool[c.a] = 1; unvisited.push(c.a) } // re-carveable
      eroding.push({ a: c.a, b: c.b, f: 1 })
    }

    // Pointer bias — lattice coords + weight. The weight itself is DAMPED
    // (no snap when the cursor enters/leaves); loop erasure self-restores
    // whatever the steer tangles.
    let plx = 0, ply = 0, pBias = 0
    const wsBuf = new Float64Array(4) // hoisted — no per-step weight alloc

    function stepWalker() {
      if (walkerPos < 0) return
      const nn = neighbors(walkerPos, G, grid.inside)
      if (nn === 0) { pickNextWalker(); return }
      let next
      if (pBias > 0.02) {
        const dHere = Math.hypot((walkerPos % G) - plx, ((walkerPos / G) | 0) - ply)
        let wSum = 0
        for (let k = 0; k < nn; k++) {
          const c = nbBuf[k]
          wsBuf[k] = Math.hypot((c % G) - plx, ((c / G) | 0) - ply) < dHere ? 1 + pBias : 1
          wSum += wsBuf[k]
        }
        let r = rng() * wSum
        next = nbBuf[nn - 1]
        for (let k = 0; k < nn; k++) {
          r -= wsBuf[k]
          if (r <= 0) { next = nbBuf[k]; break }
        }
      } else {
        next = nbBuf[Math.floor(rng() * nn)]
      }

      if (inTree[next]) {
        commitPath(next)
        pickNextWalker()
        return
      }

      // Loop erasure: if next is already in the current walk path, erase from walkerPos back to next
      if (pathMap[next] !== -1) {
        let cur = walkerPos
        while (cur !== next) {
          const prev = pathMap[cur]
          pathMap[cur] = -1
          if (prev < 0 || prev === cur) break
          cur = prev
        }
        walkerPos = next
        return
      }

      pathMap[next] = walkerPos // chain toward start
      walkerPos = next
    }

    const sx = W / G, sy = H / G
    const cellX = (i) => (i % G + 0.5) * sx
    const cellY = (i) => ((i / G | 0) + 0.5) * sy

    // hoisted render scratch — no per-frame allocs in the draw path
    const NB = 5
    const young = Array.from({ length: NB }, () => [])
    const EBUCK = 8
    const erodingBuckets = Array.from({ length: EBUCK }, () => [])
    const pathPts = []

    // smooth quadratic thread through a run of lattice cells
    function tracePath(pts, from, to) {
      ctx.moveTo(cellX(pts[from]), cellY(pts[from]))
      for (let i = from + 1; i < to - 1; i++) {
        const mx = (cellX(pts[i]) + cellX(pts[i + 1])) / 2
        const my = (cellY(pts[i]) + cellY(pts[i + 1])) / 2
        ctx.quadraticCurveTo(cellX(pts[i]), cellY(pts[i]), mx, my)
      }
      if (to - from > 1) ctx.lineTo(cellX(pts[to - 1]), cellY(pts[to - 1]))
    }

    return wrapLoop(() => {
      frame++
      spf    = num(params, 'stepsPerFrame', 30)
      wAlpha = num(params, 'walkerBright', 0.9)
      const t = clock.nowSeconds()

      // pointer → lattice coords; bias weight glides in and out
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      if (ptr) {
        plx = (ptr.x / sdf.w) * G
        ply = (ptr.y / sdf.h) * G
      }
      pBias += ((ptr ? Math.min(3, interact) : 0) - pBias) * 0.04

      if (fade === 0) for (let i = 0; i < spf; i++) stepWalker()

      // down-EDGE = launch a dissolve wave from the cursor — corridors melt
      // as the front passes, the walker floods back into the crater
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge && fade === 0) {
        waves.push({ cx: plx, cy: ply, r: 0, rMax: G * (0.18 + 0.1 * Math.min(3, interact)) })
      }

      // advance wavefronts — retire corridors the front crosses this frame
      for (let wi = waves.length - 1; wi >= 0; wi--) {
        const w = waves[wi]
        const r0 = w.r
        w.r += w.rMax / 45
        const r0sq = r0 * r0, r1sq = w.r * w.r
        for (let i = committed.length - 1; i >= 0; i--) {
          const c = committed[i]
          const dx = (c.a % G) - w.cx, dy = ((c.a / G) | 0) - w.cy
          const d2 = dx * dx + dy * dy
          if (d2 <= r0sq || d2 > r1sq) continue
          committed.splice(i, 1)
          retire(c)
        }
        if (w.r >= w.rMax) waves.splice(wi, 1)
      }

      // lifecycle — completion dissolves slowly and recarves; beneath that a
      // RARE erosion retires the oldest corridor so the maze never finishes
      if (fade > 0) {
        fade--
        if (fade === 0) restart()
      } else if (walkerPos < 0) {
        fade = FADE_FRAMES
      } else {
        erodeTick++
        if (erodeTick >= 24 && committed.length > 120) {
          erodeTick = 0
          retire(committed.shift())
        }
      }
      const dis = fade > 0 ? fade / FADE_FRAMES : 1
      const breath = 0.8 + 0.07 * Math.sin(t * 0.9) // the maze breathes

      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240,230,210,0.3)', 1.8)

      const lw = Math.max(2.2, Math.min(W, H) * 0.004)

      // eroding corridors — slow multi-second dissolve (alpha-bucketed so a
      // wave's worth of corridors batches into ≤8 strokes, not one each)
      for (const b of erodingBuckets) b.length = 0
      for (let i = eroding.length - 1; i >= 0; i--) {
        const e = eroding[i]
        e.f -= 0.007
        if (e.f <= 0) { eroding.splice(i, 1); continue }
        erodingBuckets[Math.min(EBUCK - 1, Math.floor(e.f * EBUCK))].push(e)
      }
      ctx.lineWidth = lw
      for (let bi = 0; bi < EBUCK; bi++) {
        const bset = erodingBuckets[bi]
        if (!bset.length) continue
        ctx.strokeStyle = pc('fg', 0.7 * ((bi + 0.5) / EBUCK) * dis)
        ctx.beginPath()
        for (const e of bset) {
          ctx.moveTo(cellX(e.a), cellY(e.a))
          ctx.lineTo(cellX(e.b), cellY(e.b))
        }
        ctx.stroke()
      }

      // young corridors materialize — warm→fg ease-in glow, bucketed
      for (const b of young) b.length = 0
      let matureFrom = committed.length
      for (let i = committed.length - 1; i >= 0; i--) {
        const g = (frame - committed[i].born) / GLOW
        if (g >= 1) { matureFrom = i + 1; break }
        young[Math.min(NB - 1, Math.floor(g * NB))].push(committed[i])
        matureFrom = i
      }
      for (let bi = 0; bi < NB; bi++) {
        if (!young[bi].length) continue
        const g = (bi + 0.5) / NB
        const [rr, gg, bb] = rampRGB(1 - 0.25 * g) // warm at birth → fg settled
        ctx.beginPath()
        for (const c of young[bi]) {
          ctx.moveTo(cellX(c.a), cellY(c.a))
          ctx.lineTo(cellX(c.b), cellY(c.b))
        }
        if (bi === 0) {
          // fake glow — wide low-alpha pass on the same path (no shadowBlur)
          ctx.strokeStyle = pc('warm', 0.25 * dis)
          ctx.lineWidth = lw * 3
          ctx.stroke()
        }
        ctx.strokeStyle = `rgba(${rr},${gg},${bb},${((0.2 + 0.65 * g) * dis).toFixed(3)})`
        ctx.lineWidth = lw * (1.35 - 0.3 * g)
        ctx.stroke()
      }

      // settled tree — one batched stroke, breathing
      ctx.strokeStyle = pc('fg', breath * dis)
      ctx.lineWidth = lw
      ctx.beginPath()
      for (let i = 0; i < matureFrom; i++) {
        const c = committed[i]
        ctx.moveTo(cellX(c.a), cellY(c.a))
        ctx.lineTo(cellX(c.b), cellY(c.b))
      }
      ctx.stroke()

      // dissolve wavefronts — a faint warm ring sweeping outward
      for (const w of waves) {
        ctx.strokeStyle = pc('warm', 0.3 * (1 - w.r / w.rMax) * dis)
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(w.cx * sx, w.cy * sy, w.r * ((sx + sy) / 2), 0, Math.PI * 2)
        ctx.stroke()
      }

      // live walker probe — one smooth thread: dim tail, bright head
      if (walkerPos >= 0) {
        pathPts.length = 0
        pathPts.push(walkerPos)
        let cur = walkerPos, safety = 0
        while (pathMap[cur] >= 0 && pathMap[cur] !== cur && safety++ < 400) {
          cur = pathMap[cur]
          pathPts.push(cur)
        }
        if (pathPts.length > 1) {
          ctx.lineJoin = 'round'
          ctx.lineCap = 'round'
          // tail — the whole probe, faint
          ctx.strokeStyle = pc('warm', wAlpha * 0.3 * dis)
          ctx.lineWidth = lw * 1.1
          ctx.beginPath()
          tracePath(pathPts, 0, pathPts.length)
          ctx.stroke()
          // head — the leading run, bright
          const headLen = Math.min(36, pathPts.length)
          ctx.strokeStyle = pc('warm', wAlpha * 0.8 * dis)
          ctx.lineWidth = lw * 1.4
          ctx.beginPath()
          tracePath(pathPts, 0, headLen)
          ctx.stroke()
        }
        const hx = cellX(walkerPos), hy = cellY(walkerPos)
        // fake glow — halo fill replaces the shadowBlur pass
        ctx.fillStyle = pc('warm', wAlpha * 0.3 * dis)
        ctx.beginPath()
        ctx.arc(hx, hy, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = pc('warm', wAlpha * dis)
        ctx.beginPath()
        ctx.arc(hx, hy, 6, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  },
}
