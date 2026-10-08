

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, roleRGB, stampGrid } from '../common.js'

// Drossel-Schwabl forest-fire model. Three states: empty (0), tree (1),
// burning (2). Each tick: burning -> empty; tree catches fire from any burning
// neighbor; tree ignites spontaneously with probability f (lightning); empty
// grows tree with probability p. SOC emerges when f/p -> 0.
// SDF >= 0 cells are permanently empty — glyph boundary acts as firebreak.
//
// Reference: Drossel & Schwabl (1992) PRL 69:1629.

const PARAMS          = [
  { key: 'res',       type: 'int',   min: 80,   max: 220,  default: 160, step: 10    },
  { key: 'growthP',   type: 'range', min: 0.001,max: 0.08, default: 0.02,step: 0.001 },
  { key: 'lightningF',type: 'range', min: 0.00005,max: 0.005, default: 0.0003, step: 0.00005 },
  { key: 'stepsPerFrame', type: 'int', min: 1, max: 8, default: 3, step: 1 },
  { key: 'interact', type: 'range', min: 0, max: 3, default: 1, step: 0.1, label: 'interaction' },
]

const EMPTY   = 0
const TREE    = 1
const BURNING = 2

export const r2_soc_03_forestfire            = {
  id: 'r2-soc-03-forestfire',
  name: 'FOREST FIRE',
  repo: 'Drossel-Schwabl 1992',
  summary: 'Trees grow into glyph interior, rare lightning ignites them, fire sweeps through connected clusters then regrows. p/f ratio controls canopy density vs fire frequency.',
  helps: 'Most visually legible SOC model — the green fill, catastrophic orange burn, and black regrowth cycle maps directly onto the letterform as a dramatic reveal rhythm.',

  params: PARAMS,

  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const G     = num(params, 'res', 160)
    const p     = num(params, 'growthP', 0.02)
    const f     = num(params, 'lightningF', 0.0003)
    // capped at 4 generations/frame — above that the burn/regrow cycle strobes
    // (fire crossing the whole glyph in well under 0.5s at 60fps)
    const steps = Math.min(4, num(params, 'stepsPerFrame', 3))

    const N    = G * G
    const isIn = new Uint8Array(N)
    for (let y = 0; y < G; y++) {
      for (let x = 0; x < G; x++) {
        const sx = (x / G) * sdf.w
        const sy = (y / G) * sdf.h
        isIn[y * G + x] = sdf.sample(sx, sy) < 0 ? 1 : 0
      }
    }

    const grid  = new Uint8Array(N)
    const next  = new Uint8Array(N)

    // Seed initial forest
    for (let i = 0; i < N; i++) {
      if (isIn[i] && rng() < 0.6) grid[i] = TREE
    }

    const img = ctx.createImageData(G, G)
    const tmp = document.createElement('canvas')
    tmp.width = G; tmp.height = G
    const tc  = tmp.getContext('2d')

    const neighborBurning = (i        , x        , y        )          => {
      if (x > 0     && grid[i - 1] === BURNING) return true
      if (x < G - 1 && grid[i + 1] === BURNING) return true
      if (y > 0     && grid[i - G] === BURNING) return true
      if (y < G - 1 && grid[i + G] === BURNING) return true
      return false
    }

    const tick = () => {
      for (let y = 0; y < G; y++) {
        for (let x = 0; x < G; x++) {
          const i = y * G + x
          if (!isIn[i]) { next[i] = EMPTY; continue }
          const s = grid[i]
          if (s === BURNING) {
            next[i] = EMPTY
          } else if (s === TREE) {
            if (neighborBurning(i, x, y) || rng() < f) {
              next[i] = BURNING
            } else {
              next[i] = TREE
            }
          } else {
            next[i] = rng() < p ? TREE : EMPTY
          }
        }
      }
      grid.set(next)
    }

    let prevDown = false

    return wrapLoop(() => {
      // Pointer lightning: a press (not hover — hover would raze everything)
      // ignites trees under the cursor; the ticks below spread the burn.
      // The down-EDGE = a lightning STORM — several strikes scattered in a
      // wide ring around the press; held = a sustained strike at the cursor.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      const edge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (ptr?.down) {
        const gp = { x: (ptr.x / sdf.w) * G, y: (ptr.y / sdf.h) * G }
        const rad = G * 0.06 * (0.5 + params.interact * 0.5)
        stampGrid(G, G, gp, rad, (i) => {
          if (isIn[i] && grid[i] === TREE) grid[i] = BURNING
        })
        if (edge) {
          const strikes = 12 + Math.round(8 * params.interact)
          const rMin = rad * 2, rMax = rad * 6
          for (let s = 0; s < strikes; s++) {
            const a = rng() * Math.PI * 2
            const d = rMin + rng() * (rMax - rMin)
            const sp = { x: gp.x + Math.cos(a) * d, y: gp.y + Math.sin(a) * d }
            stampGrid(G, G, sp, 5, (i) => {
              if (isIn[i] && grid[i] === TREE) grid[i] = BURNING
            })
          }
        }
      }

      for (let s = 0; s < steps; s++) tick()

      // discrete states: tree→accent, burning→warm, empty interior→dim
      // (roles hoisted per frame — palette is live)
      const cBg = roleRGB('bg')
      const cTree = roleRGB('accent')
      const cBurn = roleRGB('warm')
      const cEmpty = roleRGB('dim')
      for (let i = 0; i < N; i++) {
        const j = i * 4
        if (!isIn[i]) {
          img.data[j] = cBg[0]; img.data[j + 1] = cBg[1]; img.data[j + 2] = cBg[2]; img.data[j + 3] = 255
          continue
        }
        const s = grid[i]
        const c = s === TREE ? cTree : s === BURNING ? cBurn : cEmpty
        img.data[j] = c[0]; img.data[j + 1] = c[1]; img.data[j + 2] = c[2]
        img.data[j + 3] = 255
      }

      clear(ctx, W, H)
      tc.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(tmp, 0, 0, W, H)
      ctx.imageSmoothingEnabled = true
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)
    })
  },
}
