

import { num, bool } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, pc } from '../common.js'

// Hat monotile (Smith et al. 2023) — GAME OF LIFE on the tiling.
// Each hat is a CELL in a food-driven Life variant running on the tile
// adjacency (neighbors = tiles within centroid distance — hex-like, ≈6).
// Alive cells EAT the food under them; food regrows while a cell is dead.
// Birth needs 2-3 alive neighbors AND food, so colonies sweep across the
// tiling in waves, starve the ground behind them, collapse, and recolonize
// once the food comes back — sustained churn, not a fixed pattern.
// Dying cells fade through a warm EMBER state; dead cells render as thin
// outlines whose brightness IS the local food level. The pointer PAINTS
// life: hover seeds cells, press floods a whole patch (with a shock ring).
// The old angle-parallax is demoted to a slow ambient drift.

const PARAMS = [
  { key: 'depth', type: 'int', min: 1, max: 4, default: 3, label: 'coverage' },
  { key: 'scale', type: 'range', min: 16, max: 100, default: 40, step: 2, label: 'tile scale' },
  { key: 'pulse', type: 'range', min: 0, max: 1, default: 0.5, step: 0.05, label: 'alive pulse' },
  { key: 'rate', type: 'range', min: 2, max: 16, default: 8, step: 1, label: 'life steps/s' },
  { key: 'regrow', type: 'range', min: 0.01, max: 0.12, default: 0.04, step: 0.005, label: 'food regrowth' },
  { key: 'outlines', type: 'boolean', default: true, label: 'show edges' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

const SQ3 = Math.sqrt(3)

// 13 vertices of the hat polykite (unreflected), kite-edge units
function hatVerts(scale) {
  const s = scale
  const h = s * SQ3 / 2
  return [
    [0, 0],
    [s, 0],
    [s * 1.5, h],
    [s * 2.5, h],
    [s * 3, 0],
    [s * 4, 0],
    [s * 3.5, h],
    [s * 3, h * 2],
    [s * 2, h * 2],
    [s * 1.5, h * 3],
    [s * 0.5, h * 3],
    [0, h * 2],
    [-s * 0.5, h],
  ]
}

function hatPath(scale) {
  const verts = hatVerts(scale)
  const p = new Path2D()
  p.moveTo(verts[0][0], verts[0][1])
  for (let i = 1; i < verts.length; i++) p.lineTo(verts[i][0], verts[i][1])
  p.closePath()
  return p
}

// Hex-lattice hat placement covering the canvas; adjacency by centroid
// distance (same-row + diagonal lattice neighbors → ≈6 per interior cell).
function buildLattice(depth, scale, W, H, rng) {
  const tiles = []
  const stepX = scale * 3
  const stepY = scale * SQ3
  let R = Math.min(W, H) * (0.32 + 0.22 * depth)
  // hard cap ~4000 tiles: bounds the O(N²) adjacency build + per-frame work
  const MAXT = 4000
  const est = (Math.PI * R * R) / (stepX * stepY)
  if (est > MAXT) R *= Math.sqrt(MAXT / est)
  const rows = Math.ceil(R / stepY) + 1
  const cols = Math.ceil(R / stepX) + 1
  let idx = 0
  for (let row = -rows; row <= rows; row++) {
    for (let col = -cols; col <= cols; col++) {
      const cx = col * stepX + ((((row % 2) + 2) % 2)) * stepX * 0.5
      const cy = row * stepY
      if (Math.hypot(cx, cy) > R) continue
      tiles.push({
        cx, cy,
        angle: ((((row * 5 + col * 3) % 6) + 6) % 6) * (Math.PI / 3),
        mirror: (((idx + row) % 7) + 7) % 7 === 0,
        alive: rng() < 0.22,
        food: 0.4 + rng() * 0.6,
        ember: 0,
        born: -1e9,
        px: 0, py: 0, sx: 0, sy: 0,
        nbr: [],
      })
      idx++
    }
  }
  const thr2 = Math.pow(scale * 3.25, 2)
  for (let i = 0; i < tiles.length; i++)
    for (let j = i + 1; j < tiles.length; j++) {
      const dx = tiles[i].cx - tiles[j].cx
      const dy = tiles[i].cy - tiles[j].cy
      if (dx * dx + dy * dy < thr2) { tiles[i].nbr.push(j); tiles[j].nbr.push(i) }
    }
  return tiles
}

export const r2_tile_02_hat = {
  id: 'r2-tile-02-hat',
  name: 'HAT MONOTILE 2023',
  repo: 'Smith, Myers, Kaplan, Goodman-Strauss arXiv 2303.10798',
  summary: 'Game of Life ON the hat tiling: each einstein tile is a cell in a food-driven birth/death CA on the tile adjacency — colonies sweep, starve the ground, collapse to embers, and recolonize. Pointer paints life; press floods a patch.',
  helps: 'The 2023 aperiodic-monotile discovery becomes a living substrate — population waves and ember fronts trace the tiling structure inside the glyph.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const U = Math.min(sdf.w, sdf.h)
    const ss = Math.min(W / sdf.w, H / sdf.h)

    let tiles = []
    let path = null
    let counts = new Uint8Array(0) // life-step scratch, sized on lattice rebuild
    let prevDepth = -1
    let prevScale = -1

    let rot = 0
    let txO = 0
    let tyO = 0
    let tPrev = clock.nowSeconds()
    let stepAcc = 0
    let prevDown = false
    const rings = []

    return wrapLoop(() => {
      const t = clock.nowSeconds()
      const dt = Math.max(0, Math.min(0.1, t - tPrev))
      tPrev = t

      const depth = num(params, 'depth', 3) | 0
      const scale = num(params, 'scale', 40)
      const pulse = num(params, 'pulse', 0.5)
      const rate = num(params, 'rate', 8)
      const regrow = num(params, 'regrow', 0.04)
      const drawEdges = bool(params, 'outlines', true)
      const interact = num(params, 'interact', 1)

      if (depth !== prevDepth || scale !== prevScale) {
        tiles = buildLattice(depth, scale, W, H, rng)
        path = hatPath(scale)
        counts = new Uint8Array(tiles.length)
        prevDepth = depth
        prevScale = scale
      }

      // ambient drift — the old parallax demoted to a slow lean + rotation
      const ptr = interact > 0 && pointer ? pointer() : null
      const kB = Math.min(1, interact)
      const tTx = ptr ? ((ptr.x / sdf.w) - 0.5) * W * 0.04 * kB : 0
      const tTy = ptr ? ((ptr.y / sdf.h) - 0.5) * H * 0.04 * kB : 0
      txO += (tTx - txO) * 0.05
      tyO += (tTy - tyO) * 0.05
      rot += dt * 0.02

      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)

      // transformed centroids (canvas + sdf space); ember decay rides along
      const cosR = Math.cos(rot)
      const sinR = Math.sin(rot)
      for (const tile of tiles) {
        tile.px = tile.cx * cosR - tile.cy * sinR + W / 2 + txO
        tile.py = tile.cx * sinR + tile.cy * cosR + H / 2 + tyO
        tile.sx = (tile.px / W) * sdf.w
        tile.sy = (tile.py / H) * sdf.h
        if (tile.ember > 0) tile.ember *= 0.93
      }

      // pointer PAINTS life — hover seeds cells, press floods a patch
      if (ptr) {
        const rHover = U * 0.07 * (0.6 + 0.4 * kB)
        const rFlood = U * 0.16 * (0.7 + 0.3 * Math.min(3, interact))
        for (const tile of tiles) {
          const d = Math.hypot(tile.sx - ptr.x, tile.sy - ptr.y)
          if (downEdge && d < rFlood) {
            if (!tile.alive) tile.born = t
            tile.alive = true
            tile.food = 1
          } else if (d < rHover && !tile.alive && rng() < 0.3) {
            tile.alive = true
            tile.born = t
            tile.food = Math.max(tile.food, 0.7)
          }
        }
        if (downEdge) rings.push({ x: ptr.x * (W / sdf.w), y: ptr.y * (H / sdf.h), r: U * 0.03 * ss, life: 1 })
      }

      // life cadence — birth / death / food at a visible step rate
      stepAcc += dt * rate
      while (stepAcc >= 1) {
        stepAcc -= 1
        counts.fill(0) // reused scratch — no per-step allocation
        for (let i = 0; i < tiles.length; i++) {
          if (!tiles[i].alive) continue
          for (const j of tiles[i].nbr) counts[j]++
        }
        for (let i = 0; i < tiles.length; i++) {
          const tile = tiles[i]
          const n = counts[i]
          if (tile.alive) {
            tile.food -= 0.13
            if (tile.food <= 0 || n < 2 || n > 4) {
              tile.alive = false
              tile.ember = 1
              if (tile.food < 0) tile.food = 0
            }
          } else {
            tile.food = Math.min(1, tile.food + regrow)
            if (((n === 2 || n === 3) && tile.food > 0.35 && rng() < 0.9) || rng() < 0.002) {
              tile.alive = true
              tile.born = t
              tile.food = Math.max(0.15, tile.food - 0.1)
            }
          }
        }
      }

      clear(ctx, W, H)

      // per-frame quantized style LUTs (≤32 buckets) — pc() regex-parses hex
      // per call, so per-tile calls were thousands of parses a frame
      const aliveLUT = []
      const emberLUT = []
      const deadLUT = []
      const fgMirror = pc('fg', 0.85)
      const fgPlain = pc('fg', 0.4)
      const edgeW = Math.max(1.2, scale * 0.05)

      const margin = (scale * 0.9) / ss
      for (const tile of tiles) {
        if (sdf.sample(tile.sx, tile.sy) > margin) continue
        // no save/restore per tile — absolute setTransform in, identity after the loop
        const a = rot + tile.angle
        const ca = Math.cos(a), sa = Math.sin(a)
        if (tile.mirror) ctx.setTransform(-ca, -sa, -sa, ca, tile.px, tile.py)
        else ctx.setTransform(ca, sa, -sa, ca, tile.px, tile.py)
        if (tile.alive) {
          const breathe = 1 + pulse * 0.18 * Math.sin(t * 3 + tile.cx * 0.011 + tile.cy * 0.013)
          // eased ≥330ms birth fade-in — render-side anti-strobe, CA state untouched
          const bi = Math.min(1, (t - tile.born) * 3)
          const ease = bi * bi * (3 - 2 * bi)
          const av = Math.max(0, Math.min(1, (0.55 + 0.4 * tile.food) * breathe * ease))
          const q = (av * 31) | 0
          ctx.fillStyle = aliveLUT[q] || (aliveLUT[q] = pc('accent', q / 31))
          ctx.fill(path)
          if (drawEdges) {
            ctx.strokeStyle = tile.mirror ? fgMirror : fgPlain
            ctx.lineWidth = edgeW
            ctx.stroke(path)
          }
        } else if (tile.ember > 0.02) {
          const q = (Math.min(1, 0.75 * tile.ember) * 31) | 0
          ctx.fillStyle = emberLUT[q] || (emberLUT[q] = pc('warm', q / 31))
          ctx.fill(path)
        } else if (drawEdges) {
          // dead — thin outline, brightness = local food (the substrate map)
          const q = (Math.min(1, 0.04 + 0.08 * tile.food) * 31) | 0
          ctx.strokeStyle = deadLUT[q] || (deadLUT[q] = pc('dim', q / 31))
          ctx.lineWidth = 1
          ctx.stroke(path)
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)

      // press shock rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const rg = rings[i]
        rg.r += Math.min(W, H) * 0.02
        rg.life -= 0.06
        if (rg.life <= 0) { rings.splice(i, 1); continue }
        ctx.strokeStyle = pc('warm', 0.8 * rg.life)
        ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.006 * rg.life)
        ctx.beginPath()
        ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      strokeOutline(ctx, sdf, W, H, pc('dim', 0.06), 1.2)
    })
  },
}
