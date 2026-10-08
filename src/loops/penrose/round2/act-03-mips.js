// Motility-Induced Phase Separation — Active Brownian Particles (Cates & Tailleur 2015)
// Speed decreases with local density → spontaneous condensation into a dense motile
// cluster (the "living droplet") that wanders the glyph. No alignment, no attraction.
// Purely repulsive soft WCA + density-dependent v(ρ).



import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, sampleInside, sdfGrad, pc } from '../common.js'

const PARAMS          = [
  { key: 'N',     type: 'int',   min: 400,  max: 4000, default: 1800, step: 100, label: 'particles' },
  { key: 'v0',    type: 'range', min: 0.3,  max: 4.0,  default: 1.4,  step: 0.1, label: 'base speed v₀' },
  { key: 'Dr',    type: 'range', min: 0.005, max: 0.2, default: 0.03, step: 0.005, label: 'rot. diffusion Dr' },
  { key: 'rhoM',  type: 'range', min: 0.5,  max: 8.0,  default: 2.5,  step: 0.25, label: 'MIPS density ρ*' },
  { key: 'rep',   type: 'range', min: 0.1,  max: 2.0,  default: 0.7,  step: 0.1,  label: 'repulsion ε' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]



export const r2_act_03_mips            = {
  id: 'r2-act-03-mips',
  name: 'MIPS / LIVING DROPLET',
  repo: 'Cates & Tailleur Annu. Rev. Condens. Matter 6 219 (2015)',
  summary: 'Active Brownian Particles: density-dependent speed v(ρ) drives phase separation into a dense motile cluster + dilute gas. No alignment — pure activity-driven transition.',
  helps: 'Dense bright droplet wanders glyph interior; thin strokes guide it like a channel.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const scx = W / sdf.w, scy = H / sdf.h

    const ps        = []
    for (let i = 0; i < num(params, 'N', 1800); i++) {
      const [x, y] = sampleInside(sdf, rng)
      ps.push({ x, y, a: rng() * Math.PI * 2, b: 0 })
    }

    // soft WCA-like: linear repulsion inside sigma=3
    const SIGMA = 3.5
    const SIGMA2 = SIGMA * SIGMA

    // hoisted grids — both were allocated per frame
    const cD = 8
    const gwD = Math.ceil(sdf.w / cD) + 1
    const ghD = Math.ceil(sdf.h / cD) + 1
    const density = new Float32Array(gwD * ghD)
    const cs = SIGMA * 2
    const gw = Math.ceil(sdf.w / cs) + 1
    const gh = Math.ceil(sdf.h / cs) + 1
    const gridHead = new Int32Array(gw * gh)
    let gridNext = new Int32Array(ps.length)
    const maxStep = Math.min(sdf.w, sdf.h) * 0.015 // per-frame step cap (blowup guard)

    let prevDown = false

    return wrapLoop(() => {
      const N    = num(params, 'N', 1800)
      const v0   = num(params, 'v0', 1.4)
      const Dr   = num(params, 'Dr', 0.03)
      const rhoM = num(params, 'rhoM', 2.5)
      const rep  = num(params, 'rep', 0.7)

      // pointer interaction (read live) — wired as one more soft force below
      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const pReach = Math.min(sdf.w, sdf.h) * 0.15

      while (ps.length < N) {
        const [x, y] = sampleInside(sdf, rng)
        ps.push({ x, y, a: rng() * Math.PI * 2, b: 0 })
      }
      if (ps.length > N) ps.length = N

      // down-EDGE = shockwave: one-frame radial heading + position kick in a
      // large reach; MIPS condensation reseals the droplet afterwards. Held
      // keeps the sustained soft repel below.
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) {
        const reach = Math.min(sdf.w, sdf.h) * 0.4
        const kick = Math.min(sdf.w, sdf.h) * 0.1 * interact
        for (const p of ps) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y
          const d2 = dx * dx + dy * dy
          if (d2 >= reach * reach || d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const w = 1 - d / reach
          p.a = Math.atan2(dy, dx) + (rng() - 0.5) * 0.6
          const nx = p.x + (dx / d) * kick * w
          const ny = p.y + (dy / d) * kick * w
          if (sdf.sample(nx, ny) < 0) { p.x = nx; p.y = ny }
        }
      }

      // density grid (coarser) for v(ρ)
      density.fill(0)
      for (const p of ps) {
        const gx = Math.max(0, Math.min(gwD - 1, (p.x / cD) | 0))
        const gy = Math.max(0, Math.min(ghD - 1, (p.y / cD) | 0))
        density[gy * gwD + gx]++
      }

      // repulsion grid — reused head/next linked lists
      if (gridNext.length < ps.length) gridNext = new Int32Array(ps.length)
      gridHead.fill(-1)
      for (let i = 0; i < ps.length; i++) {
        const gx = Math.max(0, Math.min(gw - 1, (ps[i].x / cs) | 0))
        const gy = Math.max(0, Math.min(gh - 1, (ps[i].y / cs) | 0))
        const c = gy * gw + gx
        gridNext[i] = gridHead[c]
        gridHead[c] = i
      }

      const DT = 0.15
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i]

        // local density → modulate speed
        const dgx = Math.max(0, Math.min(gwD - 1, (p.x / cD) | 0))
        const dgy = Math.max(0, Math.min(ghD - 1, (p.y / cD) | 0))
        const rhoLocal = density[dgy * gwD + dgx]
        const v = v0 / (1 + rhoLocal / rhoM)

        // self-propulsion
        let fx = Math.cos(p.a) * v
        let fy = Math.sin(p.a) * v

        // soft repulsion from neighbours
        const gx = (p.x / cs) | 0, gy = (p.y / cs) | 0
        for (let dj = -1; dj <= 1; dj++) {
          const row = gy + dj
          if (row < 0 || row >= gh) continue
          for (let di = -1; di <= 1; di++) {
            const col = gx + di
            if (col < 0 || col >= gw) continue
            for (let j = gridHead[row * gw + col]; j !== -1; j = gridNext[j]) {
              if (j === i) continue
              const dx = p.x - ps[j].x, dy = p.y - ps[j].y
              const d2 = dx * dx + dy * dy
              if (d2 < 1e-6 || d2 > SIGMA2) continue
              const d = Math.sqrt(d2)
              const f = rep * (SIGMA / d - 1)
              fx += (dx / d) * f
              fy += (dy / d) * f
            }
          }
        }

        // pointer force — same falloff shape as the neighbour repulsion but
        // wider reach (× interact); MIPS dynamics reseal the droplet after.
        if (ptr) {
          const dxp = p.x - ptr.x, dyp = p.y - ptr.y
          const d2p = dxp * dxp + dyp * dyp
          if (d2p < pReach * pReach && d2p > 1e-6) {
            const dp = Math.sqrt(d2p)
            const f = (1 - dp / pReach) * 2 * interact
            fx += (dxp / dp) * f
            fy += (dyp / dp) * f
          }
        }

        // rotational diffusion
        p.a += Math.sqrt(2 * Dr) * (rng() - 0.5) * 2 * Math.PI * DT

        // clamp the step — overlapping pairs can spike the repulsion force,
        // and a NaN here must decay (zero step) instead of propagating
        let dxs = fx * DT, dys = fy * DT
        const sm = Math.hypot(dxs, dys)
        if (!Number.isFinite(sm)) { dxs = 0; dys = 0 }
        else if (sm > maxStep) { const k = maxStep / sm; dxs *= k; dys *= k }
        const nx = p.x + dxs
        const ny = p.y + dys

        if (sdf.sample(nx, ny) < 0) {
          p.x = nx; p.y = ny
        } else {
          const [gX, gY] = sdfGrad(sdf, p.x, p.y)
          const gm = Math.hypot(gX, gY) || 1
          p.x -= (gX / gm) * v * DT
          p.y -= (gY / gm) * v * DT
          p.a += Math.PI + (rng() - 0.5) * 0.8
        }
      }

      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(243,231,207,0.25)', 1.8)

      // Render: warm-led — dilute gas rides fg, the dense droplet burns warm.
      // Warm alpha quantized to 8 cached styles (pc() was a regex parse per
      // particle); gas↔warm switch eased per particle so edge flicker fades
      // over ~300ms instead of flipping frame-to-frame.
      const base = Math.max(4, Math.min(W, H) * 0.011)
      const cGas = pc('fg', 0.5)
      const warmLv = []
      for (let q = 0; q < 8; q++) warmLv.push(pc('warm', 0.45 + ((q + 0.5) / 8) * 0.55))
      let lastStyle = ''
      for (const p of ps) {
        const dgx = Math.max(0, Math.min(gwD - 1, (p.x / cD) | 0))
        const dgy = Math.max(0, Math.min(ghD - 1, (p.y / cD) | 0))
        const rhoLocal = density[dgy * gwD + dgx]
        const bright = Math.min(1, rhoLocal / (rhoM * 2))
        p.b += (bright - p.b) * 0.1
        const style = p.b > 0.35 ? warmLv[Math.min(7, (p.b * 8) | 0)] : cGas
        if (style !== lastStyle) { ctx.fillStyle = style; lastStyle = style }
        const sz = base * (0.6 + p.b * 1.2)
        ctx.fillRect(p.x * scx - sz / 2, p.y * scy - sz / 2, sz, sz)
      }
    })
  },
}
