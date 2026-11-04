

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, pc } from '../common.js'

// Penrose P3 — Thin + Thick Rhombs, substitution method.
// Inflate from a central thick rhombus N times, collect tile polygons.
// Animate: substitution-depth stagger fade-in + slow global rotation (phason spin).

const PARAMS          = [
  { key: 'tileScale', type: 'range', min: 14, max: 150, default: 36, step: 2, label: 'tile size' },
  { key: 'spin', type: 'range', min: 0, max: 0.5, default: 0.05, step: 0.01, label: 'rotation speed' },
  { key: 'fillOpacity', type: 'range', min: 0, max: 1, default: 0.4, step: 0.02, label: 'fill opacity' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

const PHI = (1 + Math.sqrt(5)) / 2

// shortest-arc angular difference, for lerping accumulating angles
function angDiff(a        , b        )         {
  let d = (a - b) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

// Penrose P3 substitution rules (Robinson triangles decomposition).
// Each tile stored as { type: 'thick'|'thin', verts: [p0,p1,p2,p3], depth }
// We use the standard deflation on acute golden gnomons:
//   thick rhombus → 2 thick + 1 thin
//   thin rhombus  → 1 thick + 1 thin




function add(a    , b    )     { return [a[0] + b[0], a[1] + b[1]] }
function sub(a    , b    )     { return [a[0] - b[0], a[1] - b[1]] }
function scale(a    , s        )     { return [a[0] * s, a[1] * s] }
function lerp(a    , b    , t        )     { return add(scale(a, 1 - t), scale(b, t)) }

// P3 BY ROBINSON TRIANGLES (plan 49 5.4 — the old rhomb deflation made overlapping slivers, not a tiling: "makes no
// sense"). The standard construction: a wheel of 10 half-rhomb triangles around the centre, each subdivided by the golden
// ratio — an obtuse half (thin rhomb) into 2, an acute half (thick rhomb) into 3. Every edge shrinks by 1/φ a step. A
// triangle is { type, a, b, c, depth }; two halves share the edge c→a, so stroking a→b→c draws whole rhombs.
function deflateTile(t) {
  const { type, a: A, b: B, c: C, depth } = t
  const nd = depth + 1
  if (type === 'thin') {
    const P = add(A, scale(sub(B, A), 1 / PHI))
    return [
      { type: 'thin', a: C, b: P, c: B, depth: nd },
      { type: 'thick', a: P, b: C, c: A, depth: nd },
    ]
  }
  const Q = add(B, scale(sub(A, B), 1 / PHI))
  const R = add(B, scale(sub(C, B), 1 / PHI))
  return [
    { type: 'thick', a: R, b: C, c: A, depth: nd },
    { type: 'thick', a: Q, b: R, c: B, depth: nd },
    { type: 'thin', a: R, b: Q, c: A, depth: nd },
  ]
}

function buildPenrose(depth, radius) {
  let tiles = []
  for (let i = 0; i < 10; i++) {
    let B = [radius * Math.cos(((2 * i - 1) * Math.PI) / 10), radius * Math.sin(((2 * i - 1) * Math.PI) / 10)]
    let C = [radius * Math.cos(((2 * i + 1) * Math.PI) / 10), radius * Math.sin(((2 * i + 1) * Math.PI) / 10)]
    if (i % 2 === 0) [B, C] = [C, B]
    tiles.push({ type: 'thin', a: [0, 0], b: B, c: C, depth: 0 })
  }
  for (let d = 0; d < depth; d++) tiles = tiles.flatMap(deflateTile)
  return tiles
}

// (per-tile drawRhomb retired 2026-08-09 — tiles now batch-render by
// (family, quantized alpha) bucket inside the loop; same colours/roles)

export const r2_tile_05_penrose            = {
  id: 'r2-tile-05-penrose',
  name: 'Penrose P3 rhombs',
  repo: 'Penrose 1974; Robinson triangle deflation',
  summary: 'Thin + thick golden-ratio rhombs from a wheel of ten Robinson triangles, subdivided until the tiles reach the chosen size; the tiling fades in from the centre and slowly rotates.',
  helps: 'The golden-ratio proportions of Penrose rhombs harmonize with Gullhamrar glyph structure; five-fold symmetry is visually distinct from all other round2 prototypes.',
  params: PARAMS,
  init({ ctx, sdf, W, H, params, clock, pointer }) {
    let cachedTiles              = []
    let cachedDepth = 0
    let cachedScale = 0
    let cachedMaxDepth = 1
    // hoisted batch buckets — 33 quantized alpha levels × 2 tile families
    const buckets = Array.from({ length: 66 }, () => [])

    /* Law 2 (2026-08-09): the tiling parallax-follows the pointer — cursor
     * position commands rotation + translation (lerped); idle continues the
     * slow auto phason spin. Press = rotation kick that decays. */
    let rot = 0
    let txO = 0
    let tyO = 0
    let rotV = 0
    let prevT = null
    let prevDown = false

    return wrapLoop(() => {
      const t = clock.nowSeconds()
      /* THE TILING COVERS THE FRAME (plan 49 5.4, the user: "Penrose P3 RHOMBS is low res and just ugly. makes no sense"):
         deflation subdivides the seed without growing it, so the seed was always ~113 px wide — a small star in an empty
         frame, whatever the depth. The seed decagon now reaches the frame's corners and the depth
         follows from the tile size: an edge after d deflations is r / φ^d. Depth is no longer a knob — it is the tile size. */
      const tileScale = num(params, 'tileScale', 36)
      const seedR = Math.hypot(W, H) / 2 * 1.05 /* the wheel's outer radius reaches the corners */
      const depth = Math.max(2, Math.min(8, Math.round(Math.log(seedR / tileScale) / Math.log(PHI))))
      const spin = num(params, 'spin', 0.05)
      const fillOpacity = num(params, 'fillOpacity', 0.18)

      if (depth !== cachedDepth || tileScale !== cachedScale) {
        cachedTiles = buildPenrose(depth, seedR)
        cachedDepth = depth
        cachedScale = tileScale
        cachedMaxDepth = 1 // memoized — the old per-frame Math.max(...map) allocated + scanned every frame
        for (const ti of cachedTiles) if (ti.depth > cachedMaxDepth) cachedMaxDepth = ti.depth
      }

      clear(ctx, W, H)

      const maxDepth = cachedMaxDepth

      // rotation + translation — pointer-commanded parallax when present,
      // auto phason spin when absent; press adds a decaying kick
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const kB = Math.min(1, interact)
      if (prevT == null) prevT = t
      const dtF = Math.min(0.1, Math.max(0, t - prevT))
      prevT = t
      if (ptr) {
        rot += angDiff(((ptr.x / sdf.w) - 0.5) * 1.2 * kB, rot) * 0.06
        txO += (((ptr.x / sdf.w) - 0.5) * W * 0.1 * kB - txO) * 0.07
        tyO += (((ptr.y / sdf.h) - 0.5) * H * 0.1 * kB - tyO) * 0.07
      } else {
        rot += spin * 0.3 * dtF
        txO += (0 - txO) * 0.05
        tyO += (0 - tyO) * 0.05
      }
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) rotV += (ptr.x < sdf.w / 2 ? -1 : 1) * 0.8 * Math.min(1.5, interact)
      rot += rotV * 0.1
      rotV *= 0.9
      const rotation = rot

      // Depth-reveal cycle
      const cycle = 4.5
      const phase = (t % cycle) / cycle

      ctx.save()
      ctx.translate(W / 2 + txO, H / 2 + tyO)
      ctx.rotate(rotation)

      const cosR = Math.cos(rotation), sinR = Math.sin(rotation)
      for (const b of buckets) b.length = 0
      for (const tile of cachedTiles) {
        // Centroid for SDF test
        const cx = (tile.a[0] + tile.b[0] + tile.c[0]) / 3
        const cy = (tile.a[1] + tile.b[1] + tile.c[1]) / 3
        // Transform forward to canvas space for SDF (same transform the
        // draw uses: rotate, then offset)
        const canvX = cx * cosR - cy * sinR + W / 2 + txO
        const canvY = cx * sinR + cy * cosR + H / 2 + tyO
        const sx = (canvX / W) * sdf.w
        const sy = (canvY / H) * sdf.h
        if (sdf.sample(sx, sy) > tileScale * 0.3) continue

        /* the reveal runs out from the centre (every tile is the same depth now, so a depth stagger fades them all at once) */
        const fadeStart = Math.min(1, Math.hypot(cx, cy) / seedR) * 0.65
        const fadeIn = Math.max(0, Math.min(1, (phase - fadeStart) / 0.2))

        // quantize the fade alpha (33 levels) so same-styled tiles batch
        buckets[(tile.type === 'thick' ? 0 : 33) + Math.round(fadeIn * 32)].push(tile)
      }

      // one beginPath + one fill + one stroke per (family, alpha) bucket —
      // was a beginPath/fill/stroke + 4 pc() parses PER TILE (~4k tiles at depth 6)
      for (let bi = 0; bi < 66; bi++) {
        const arr = buckets[bi]
        if (!arr.length) continue
        const role = bi < 33 ? 'warm' : 'accent'
        const q = bi % 33
        ctx.beginPath()
        for (const tile of arr) {
          ctx.moveTo(tile.a[0], tile.a[1]); ctx.lineTo(tile.b[0], tile.b[1]); ctx.lineTo(tile.c[0], tile.c[1]); ctx.closePath()
        }
        ctx.fillStyle = pc(role, fillOpacity * (q / 32))
        ctx.fill()
        /* outline a→b→c only — the shared c→a edge is inside a rhomb */
        ctx.beginPath()
        for (const tile of arr) { ctx.moveTo(tile.a[0], tile.a[1]); ctx.lineTo(tile.b[0], tile.b[1]); ctx.lineTo(tile.c[0], tile.c[1]) }
        ctx.strokeStyle = pc('fg', 0.55 * (q / 32) + 0.1)
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      ctx.restore()
      strokeOutline(ctx, sdf, W, H)
    })
  },
}
