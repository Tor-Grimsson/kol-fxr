// Phyllotaxis GARDEN ECOSYSTEM.
// A population of 2-4 golden-angle spirals ("plants") lives inside the glyph.
// Organs BLOOM at each spiral front (stem grows, warm petal opens), mature,
// WITHER (shrink/fade), and drop SEEDS that disperse through the mask and
// root NEW plants elsewhere — the oldest plant dies as new ones take root,
// so the garden churns instead of accreting. Pointer hover = SUNLIGHT
// (organs near the cursor bloom bigger and faster); press = plant a seed
// burst at the cursor (one roots immediately).
//
// Reference: Fowler, Prusinkiewicz & Battjes, SIGGRAPH 1992; ABOP Ch.4.

import { num, bool } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sampleInside, inwardDir, pc } from '../common.js'

const GOLDEN_ANGLE = 137.507764 * (Math.PI / 180)

const PARAMS = [
  { key: 'spawnRate', type: 'range', min: 0.5, max: 20, default: 9, step: 0.5, label: 'organs/sec' },
  { key: 'axisStep', type: 'range', min: 0.5, max: 4, default: 1.4, step: 0.1, label: 'axis advance' },
  { key: 'armScale', type: 'range', min: 0.2, max: 3, default: 1.4, step: 0.05, label: 'arm scale' },
  { key: 'waveAmp', type: 'range', min: 0, max: 0.5, default: 0.12, step: 0.01, label: 'wave tropism' },
  { key: 'plants', type: 'int', min: 1, max: 4, default: 3, label: 'population' },
  { key: 'showAxis', type: 'boolean', default: false, label: 'show axis' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

export const r2_lsys_04_phyllotaxis = {
  id: 'r2-lsys-04-phyllotaxis',
  name: 'PHYLLOTAXIS SPIRAL FILL',
  repo: 'Fowler/Prusinkiewicz/Battjes SIGGRAPH 1992 + ABOP Ch.4',
  summary: 'Garden ecosystem of concurrent golden-angle spirals: organs bloom, mature, wither, and drop seeds that disperse and root new plants — oldest dying as new ones take. Hover is sunlight, press plants a seed burst.',
  helps: 'Population dynamics on top of the phyllotaxis fill — birth/death churn keeps the glyph alive instead of fossilizing into a finished spiral.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.min(sdf.w, sdf.h)
    const Um = Math.min(W, H)

    const plants = []
    const seeds = []
    const rings = []

    // hoisted render scratch (2026-08-09 perf): steady-state organs share one
    // exact style, so they batch into 3 constant-style paths per frame
    let batchCap = 512
    let bAX = new Float32Array(batchCap), bAY = new Float32Array(batchCap)
    let bTX = new Float32Array(batchCap), bTY = new Float32Array(batchCap)

    // sunlight — 0..~2 by cursor proximity, scaled by interact (closure is
    // hoisted; the loop just refreshes curPtr/curInteract each frame)
    let curPtr = null, curInteract = 1
    const sunR = U * 0.2
    const sunAt = (x, y) => {
      if (!curPtr) return 0
      const d = Math.hypot(x - curPtr.x, y - curPtr.y)
      return Math.max(0, 1 - d / sunR) * Math.min(2, curInteract)
    }

    function rootPlant(x, y, born, now = born) {
      plants.push({
        x, y,
        angle: rng() * Math.PI * 2,
        born,
        lastSpawn: now,
        orgCount: 0,
        withering: false,
        organs: [],
      })
    }

    // Root a plant, retiring the oldest if the population is full.
    function tryRoot(x, y, t, maxPlants) {
      let living = 0
      let oldest = null
      for (const p of plants) {
        if (p.withering) continue
        living++
        if (!oldest || p.born < oldest.born) oldest = p
      }
      if (living < maxPlants) { rootPlant(x, y, t); return true }
      if (oldest && t - oldest.born > 5) {
        oldest.withering = true
        rootPlant(x, y, t)
        return true
      }
      return false
    }

    function spawnOrgan(p, t, axisStep, armScale) {
      // axis wanders gently, corrected inward near the boundary
      p.angle += GOLDEN_ANGLE + (rng() - 0.5) * 0.03
      p.x += (rng() - 0.5) * axisStep * 0.6
      p.y += (rng() - 0.5) * axisStep * 0.6
      if (sdf.sample(p.x, p.y) >= -2) {
        const [ix, iy] = inwardDir(sdf, p.x, p.y)
        p.x += ix * 3
        p.y += iy * 3
      }
      const d = Math.abs(sdf.sample(p.x, p.y))
      let armLen = Math.max(U * 0.02, d * armScale * (0.55 + rng() * 0.5))
      const heading = p.angle + (p.orgCount % 2 === 0 ? 0 : Math.PI)
      p.orgCount++
      let tipX = p.x + Math.cos(heading) * armLen
      let tipY = p.y + Math.sin(heading) * armLen
      if (sdf.sample(tipX, tipY) >= 0) {
        armLen *= 0.45
        tipX = p.x + Math.cos(heading) * armLen
        tipY = p.y + Math.sin(heading) * armLen
        if (sdf.sample(tipX, tipY) >= 0) return
      }
      p.organs.push({
        ax: p.x, ay: p.y,
        heading, armLen,
        ch: Math.cos(heading), sh: Math.sin(heading), // heading trig cached — hot loops reuse
        phase: rng() * Math.PI * 2,
        grow: 0,
        wither: 0,
        withering: false,
        life: 7 + rng() * 7,
        born: t,
      })
    }

    const t0 = clock.nowSeconds()
    for (let k = 0; k < 3; k++) {
      const [x, y] = sampleInside(sdf, rng)
      rootPlant(x, y, t0 - k * 6, t0) // stagger ages so deaths interleave
    }

    let tPrev = t0
    let prevDown = false

    return wrapLoop(() => {
      const t = clock.nowSeconds()
      const dt = Math.max(0, Math.min(0.1, t - tPrev))
      tPrev = t

      const spawnRate = num(params, 'spawnRate', 9)
      const axisStep = num(params, 'axisStep', 1.4)
      const armScale = num(params, 'armScale', 1.4)
      const waveAmp = num(params, 'waveAmp', 0.12)
      const maxPlants = num(params, 'plants', 3) | 0
      const showAxis = bool(params, 'showAxis', false)
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null

      curPtr = ptr; curInteract = interact // feeds the hoisted sunAt

      // press — SEED BURST at the cursor; one roots immediately
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) {
        rings.push({ x: ptr.x * sx, y: ptr.y * sy, r: Um * 0.012, life: 1 })
        for (let k = 0; k < 10 && seeds.length < 60; k++) { // rapid clicks can't flood the seed pool
          const a = rng() * Math.PI * 2
          const v = U * (0.06 + rng() * 0.12)
          seeds.push({
            x: ptr.x, y: ptr.y,
            vx: Math.cos(a) * v, vy: Math.sin(a) * v,
            born: t, root: t + 0.8 + rng() * 1.6,
          })
        }
        if (sdf.sample(ptr.x, ptr.y) < 0) tryRoot(ptr.x, ptr.y, t, maxPlants)
      }

      // plant lifecycle — grow the front, or unwind when withering
      for (const p of plants) {
        if (!p.withering && (p.orgCount > 110 || t - p.born > 26)) p.withering = true
        if (!p.withering) {
          const sun = sunAt(p.x, p.y)
          const rate = spawnRate * (1 + 1.2 * sun)
          const interval = 1 / Math.max(0.1, rate)
          let guard = 0
          while (t - p.lastSpawn >= interval && guard++ < 8) {
            p.lastSpawn += interval
            spawnOrgan(p, t, axisStep, armScale)
          }
          if (t - p.lastSpawn > 1) p.lastSpawn = t // clock-jump clamp
        } else {
          let toWither = Math.ceil(dt * spawnRate * 2)
          for (let i = 0; i < p.organs.length && toWither > 0; i++) {
            const o = p.organs[i]
            if (!o.withering) { o.withering = true; toWither-- }
          }
        }
      }
      for (let i = plants.length - 1; i >= 0; i--) {
        if (plants[i].withering && plants[i].organs.length === 0) plants.splice(i, 1)
      }
      // the garden never dies out entirely
      if (plants.length < Math.min(2, maxPlants)) {
        const [x, y] = sampleInside(sdf, rng)
        rootPlant(x, y, t)
      }

      // organ lifecycle — bloom, mature, wither, drop seeds
      for (const p of plants) {
        const organs = p.organs
        for (let i = organs.length - 1; i >= 0; i--) {
          const o = organs[i]
          const tipX = o.ax + o.ch * o.armLen
          const tipY = o.ay + o.sh * o.armLen
          const sun = sunAt(tipX, tipY)
          if (o.grow < 1) o.grow = Math.min(1, o.grow + dt * (1 / 0.9) * (1 + 1.5 * sun))
          if (!o.withering && t - o.born > o.life) o.withering = true
          if (o.withering) {
            o.wither += dt / 1.4
            if (o.wither >= 1) {
              organs.splice(i, 1)
              if (rng() < 0.25 && seeds.length < 50) {
                const a = rng() * Math.PI * 2
                seeds.push({
                  x: tipX, y: tipY,
                  vx: Math.cos(a) * U * 0.05, vy: Math.sin(a) * U * 0.05,
                  born: t, root: t + 1 + rng() * 2,
                })
              }
            }
          }
        }
      }

      // seed dispersal — drift inside the mask, then root or die
      for (let i = seeds.length - 1; i >= 0; i--) {
        const s = seeds[i]
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.vx = s.vx * 0.985 + (rng() - 0.5) * U * 0.3 * dt
        s.vy = s.vy * 0.985 + (rng() - 0.5) * U * 0.3 * dt
        if (sdf.sample(s.x, s.y) >= -2) {
          const [ix, iy] = inwardDir(sdf, s.x, s.y)
          s.x += ix * 2
          s.y += iy * 2
          s.vx *= 0.5
          s.vy *= 0.5
        }
        if (t >= s.root) {
          if (sdf.sample(s.x, s.y) < 0) tryRoot(s.x, s.y, t, maxPlants)
          seeds.splice(i, 1)
          continue
        }
        if (t - s.born > 5) seeds.splice(i, 1)
      }

      // --- Render ---
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, pc('dim', 0.05), 1)

      const stemW = Um * 0.0045
      const petalR = Um * 0.011
      ctx.lineCap = 'round'
      let batchN = 0
      for (const p of plants) {
        for (const o of p.organs) {
          const bloom = o.grow * o.grow * (3 - 2 * o.grow) // smoothstep
          const fade = 1 - o.wither
          const len = o.armLen * (0.25 + 0.75 * bloom) * (1 - 0.5 * o.wither)
          const wave = waveAmp * Math.sin(t * 2.1 + o.phase)
          const perpX = -o.sh
          const perpY = o.ch
          const tx = o.ax + o.ch * len + perpX * len * wave
          const ty = o.ay + o.sh * len + perpY * len * wave
          const sun = sunAt(tx, ty)

          // steady-state organ (bloom=1, no wither, no sunlight) → identical
          // style to every other one; defer to the batched paths below
          if (o.grow >= 1 && o.wither <= 0 && sun <= 0) {
            if (batchN === batchCap) {
              batchCap *= 2
              const g = (a) => { const b = new Float32Array(batchCap); b.set(a); return b }
              bAX = g(bAX); bAY = g(bAY); bTX = g(bTX); bTY = g(bTY)
            }
            bAX[batchN] = o.ax * sx; bAY[batchN] = o.ay * sy
            bTX[batchN] = tx * sx; bTY[batchN] = ty * sy
            batchN++
            continue
          }

          // stem
          ctx.strokeStyle = pc('accent', (0.3 + 0.45 * bloom) * fade)
          ctx.lineWidth = stemW * (0.7 + 0.7 * bloom) * (1 - 0.4 * o.wither)
          ctx.beginPath()
          ctx.moveTo(o.ax * sx, o.ay * sy)
          ctx.lineTo(tx * sx, ty * sy)
          ctx.stroke()

          // petal head — warm bloom, swells in sunlight
          const pr = petalR * bloom * (1 - 0.8 * o.wither) * (1 + 0.7 * sun)
          if (pr > 0.5) {
            ctx.fillStyle = pc('warm', (0.5 + 0.45 * bloom) * fade)
            ctx.beginPath()
            ctx.arc(tx * sx, ty * sy, pr, 0, Math.PI * 2)
            ctx.fill()
            if (bloom > 0.85 && !o.withering) {
              ctx.fillStyle = pc('fg', 0.75)
              ctx.beginPath()
              ctx.arc(tx * sx, ty * sy, pr * 0.32, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }

      // batched steady-state organs — one stroke + two fills for the whole garden
      if (batchN > 0) {
        ctx.strokeStyle = pc('accent', 0.75)
        ctx.lineWidth = stemW * 1.4
        ctx.beginPath()
        for (let i = 0; i < batchN; i++) { ctx.moveTo(bAX[i], bAY[i]); ctx.lineTo(bTX[i], bTY[i]) }
        ctx.stroke()
        if (petalR > 0.5) {
          ctx.fillStyle = pc('warm', 0.95)
          ctx.beginPath()
          for (let i = 0; i < batchN; i++) { ctx.moveTo(bTX[i] + petalR, bTY[i]); ctx.arc(bTX[i], bTY[i], petalR, 0, Math.PI * 2) }
          ctx.fill()
          const cr = petalR * 0.32
          ctx.fillStyle = pc('fg', 0.75)
          ctx.beginPath()
          for (let i = 0; i < batchN; i++) { ctx.moveTo(bTX[i] + cr, bTY[i]); ctx.arc(bTX[i], bTY[i], cr, 0, Math.PI * 2) }
          ctx.fill()
        }
      }

      // seeds — bright sparks drifting to new ground
      for (const s of seeds) {
        const tw = 0.55 + 0.45 * Math.sin(t * 9 + s.born * 13)
        ctx.fillStyle = pc('fg', 0.85 * tw)
        ctx.beginPath()
        ctx.arc(s.x * sx, s.y * sy, Math.max(1.5, Um * 0.0035), 0, Math.PI * 2)
        ctx.fill()
      }

      if (showAxis) {
        for (const p of plants) {
          ctx.fillStyle = pc('fg', p.withering ? 0.3 : 0.8)
          ctx.beginPath()
          ctx.arc(p.x * sx, p.y * sy, Math.max(2, Um * 0.006), 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = pc('accent', 0.5)
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(p.x * sx, p.y * sy, Math.max(4, Um * 0.011), 0, Math.PI * 2)
          ctx.stroke()
        }
      }

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
