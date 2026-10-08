// Eden Growth Model — Variant B (aperture-weighted perimeter)
// Maintain a candidate set of unoccupied boundary pixels. Each tick: pick one
// candidate (uniform = Variant A; weighted by local exposure = Variant B),
// occupy it, update the candidate set. Growth is compact, KPZ-rough surface.
//
// Eden (1961) Proc. 4th Berkeley Symp. · Meakin (1998) Ch. 3



import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sampleInside, rampRGB, pc } from '../common.js'

const PARAMS          = [
  { key: 'stepsPerFrame', type: 'int',   min: 10,  max: 600, default: 150, step: 20, label: 'steps/frame' },
  { key: 'lattice',       type: 'int',   min: 60,  max: 200, default: 120, step: 20, label: 'lattice size' },
  { key: 'variantB',      type: 'range', min: 0.0, max: 1.0, default: 0.7, step: 0.05, label: 'aperture wt' },
  { key: 'seeds',         type: 'int',   min: 1,   max: 6,   default: 2,   step: 1,  label: 'seed count' },
  { key: 'interact',      type: 'range', min: 0,   max: 3,   default: 1,   step: 0.1, label: 'interaction' },
]

export const r2_stoch_04_eden            = {
  id: 'r2-stoch-04-eden',
  name: 'EDEN GROWTH',
  repo: 'Eden 1961 · Meakin 1998 · KPZ universality class',
  summary: 'Solid compact blob grows from random seeds, filling the glyph interior. Variant B weights boundary candidates by local exposure angle — concavities grow slower, exposed tips grow faster.',
  helps: 'Inverse of DLA — compact stain spreading to fill the mold, KPZ-rough surface, no branching. The spreading-ink aesthetic.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    let G   = num(params, 'lattice', 120)
    let spf = num(params, 'stepsPerFrame', 150)
    let wB  = num(params, 'variantB', 0.7)
    let nS  = num(params, 'seeds', 2)

    let state = buildState(G, nS)

    function buildState(g        , numSeeds        ) {
      const N      = g * g
      const inside = new Uint8Array(N)
      const occ    = new Uint8Array(N)   // occupied
      const cells           = []

      for (let y = 0; y < g; y++) {
        for (let x = 0; x < g; x++) {
          const i  = y * g + x
          const sx = (x + 0.5) / g * sdf.w
          const sy = (y + 0.5) / g * sdf.h
          if (sdf.sample(sx, sy) < 0) { inside[i] = 1; cells.push(i) }
        }
      }

      // perimeter: Set for O(1) delete + array for O(1) random sample
      const perimSet  = new Uint8Array(N)
      const perimArr           = []

      // age ring-buffer: occupation order, oldest at `head` — the retirement
      // side of the perpetual lifecycle
      const order           = []
      let head  = 0
      let alive = 0

      function addPerim(i        ) {
        if (!inside[i] || occ[i] || perimSet[i]) return
        perimSet[i] = 1
        perimArr.push(i)
      }

      function occupy(i        ) {
        if (occ[i]) return
        occ[i] = 1
        perimSet[i] = 0
        order.push(i)
        alive++
        // push unoccupied 4-neighbors
        const x0 = i % g, y0 = (i / g) | 0
        for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nx = x0 + dx, ny = y0 + dy
          if (nx < 0 || nx >= g || ny < 0 || ny >= g) continue
          addPerim(ny * g + nx)
        }
      }

      // Retire the k OLDEST occupied cells — they rejoin the frontier, the
      // colony regrows into the holes, so it creeps forever instead of
      // filling the mask and fossilizing.
      function retire(k        ) {
        let done = 0
        while (done < k && head < order.length) {
          const c = order[head++]
          if (!occ[c]) continue
          occ[c] = 0
          alive--
          addPerim(c)
          done++
        }
        // compact the consumed front of the ring-buffer
        if (head > 4096 && head * 2 > order.length) {
          order.splice(0, head)
          head = 0
        }
      }

      // plant seeds
      for (let s = 0; s < numSeeds; s++) {
        const [sx, sy] = sampleInside(sdf, rng)
        const gx = Math.min(g - 1, Math.max(0, Math.floor(sx / sdf.w * g)))
        const gy = Math.min(g - 1, Math.max(0, Math.floor(sy / sdf.h * g)))
        const si = gy * g + gx
        if (inside[si]) occupy(si)
      }

      return { inside, occ, perimSet, perimArr, g, cells, occupy, retire, getAlive: () => alive }
    }

    // Aperture weight: count how many 4-neighbors of i are NOT occupied
    // (exposed to open space → higher weight in Variant B)
    function aperture(i        , g        , occ            , inside            )         {
      const x0 = i % g, y0 = (i / g) | 0
      let exp = 0
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx = x0 + dx, ny = y0 + dy
        if (nx < 0 || nx >= g || ny < 0 || ny >= g) { exp++; continue }
        const ni = ny * g + nx
        if (!inside[ni] || !occ[ni]) exp++
      }
      return exp
    }

    // Pointer bias: perimeter candidates near the cursor weigh heavier in
    // pickRandom, so growth creeps toward it (scaled by `interact`, 0 = inert).
    // No direct occupation writes — the perimeter invariants stay intact.
    let ptrG = null

    function pickRandom(g        , wB        , state                               )         {
      const { perimArr, perimSet, occ, inside } = state
      // Compact out dead entries lazily on each call
      let lo = 0
      while (lo < perimArr.length && (!perimSet[perimArr[lo]] || occ[perimArr[lo]])) lo++
      if (lo >= perimArr.length) return -1

      if (wB < 0.01) {
        // Variant A: uniform
        for (let tries = 0; tries < 20; tries++) {
          const j = lo + Math.floor(rng() * (perimArr.length - lo))
          const c = perimArr[j]
          if (perimSet[c] && !occ[c]) return c
        }
        return perimArr[lo]
      }

      // Variant B: weighted by aperture^wB (using rejection sampling over a few candidates)
      let best = -1, bestW = -1
      const trials = 8
      for (let t = 0; t < trials; t++) {
        const j = lo + Math.floor(rng() * (perimArr.length - lo))
        const c = perimArr[j]
        if (!perimSet[c] || occ[c]) continue
        let w = Math.pow(aperture(c, g, occ, inside), wB)
        if (ptrG) {
          const dx = (c % g) - ptrG.x, dy = ((c / g) | 0) - ptrG.y
          w *= 1 + ptrG.k / (1 + Math.hypot(dx, dy) / ptrG.r)
        }
        if (w > bestW) { bestW = w; best = c }
      }
      return best >= 0 ? best : perimArr[lo]
    }

    const scaleX = () => W / state.g
    const scaleY = () => H / state.g

    let prevDown = false

    return wrapLoop(() => {
      spf = Math.min(600, num(params, 'stepsPerFrame', 150)) // hard cap on per-frame growth
      wB  = num(params, 'variantB', 0.7)

      const { occ, perimSet, perimArr, g } = state
      const ptr = params.interact > 0 && pointer ? pointer() : null
      const edge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      ptrG = ptr
        ? {
            x: ptr.x / sdf.w * g,
            y: ptr.y / sdf.h * g,
            r: g * 0.06 * (0.5 + params.interact * 0.5),
            k: 4 * params.interact,
          }
        : null

      // Down-EDGE: seed a fresh colony nucleus at the press — a solid disc
      // of occupied cells the growth immediately creeps out from
      if (edge && ptrG) {
        const gx = Math.min(g - 1, Math.max(0, Math.round(ptrG.x)))
        const gy = Math.min(g - 1, Math.max(0, Math.round(ptrG.y)))
        const nr = 1 + Math.round(3 * params.interact)
        for (let dy = -nr; dy <= nr; dy++) {
          for (let dx = -nr; dx <= nr; dx++) {
            if (Math.hypot(dx, dy) > nr) continue
            const nx = gx + dx, ny = gy + dy
            if (nx < 0 || nx >= g || ny < 0 || ny >= g) continue
            const ni = ny * g + nx
            if (state.inside[ni] && !occ[ni]) state.occupy(ni)
          }
        }
      }

      for (let i = 0; i < spf; i++) {
        const c = pickRandom(g, wB, state)
        if (c >= 0) state.occupy(c)
      }

      // LIFE: a filled mask is a fossil. Past the population cap, retire the
      // oldest cells at the growth rate — the core decays, the frontier
      // regrows into the holes, the colony churns forever.
      const cap = Math.floor(state.cells.length * 0.55)
      const over = state.getAlive() - cap
      // anti-strobe: retirement sets the steady-state churn — cap it so a
      // given cell flips at ~≤3Hz even at high steps/frame (initial growth
      // front is untouched; only the saturated-state turnover is limited)
      if (over > 0) state.retire(Math.min(over, Math.max(8, (state.cells.length / 72) | 0)))

      // The churn keeps pushing dead/duplicate entries into perimArr —
      // compact it (dedupe via the flag) before it grows without bound
      if (perimArr.length > Math.max(4096, g * g)) {
        const live           = []
        for (const c of perimArr) {
          if (perimSet[c] && !occ[c]) { live.push(c); perimSet[c] = 0 }
        }
        perimArr.length = 0
        for (const c of live) { perimSet[c] = 1; perimArr.push(c) }
      }

      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240,230,210,0.3)', 1.8)

      const sx = scaleX(), sy = scaleY()

      // occupied — theme-ramp gradient by x+y position (accent→fg body)
      const rampCol = []
      for (let k = 0; k < 32; k++) {
        const [rr, gg, bb] = rampRGB(0.35 + (k / 31) * 0.55)
        rampCol.push(`rgb(${rr},${gg},${bb})`)
      }
      let lastBi = -1 // only touch fillStyle when the ramp bucket changes
      for (let y = 0; y < g; y++) {
        for (let x = 0; x < g; x++) {
          const i = y * g + x
          if (!occ[i]) continue
          const bi = (((x + y) / (2 * g)) * 31) | 0
          if (bi !== lastBi) { ctx.fillStyle = rampCol[bi]; lastBi = bi }
          ctx.fillRect(x * sx, y * sy, sx + 0.5, sy + 0.5)
        }
      }

      // perimeter highlight — the live frontier burns warm
      ctx.fillStyle = pc('warm', 0.9)
      for (const c of perimArr) {
        if (!perimSet[c]) continue
        ctx.fillRect((c % g) * sx, ((c / g | 0)) * sy, sx + 0.5, sy + 0.5)
      }
    })
  },
}
