

import { num, bool } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, rampRGB } from '../common.js'

const PARAMS          = [
  { key: 'visc', type: 'range', min: 0, max: 0.0004, default: 0.00005, step: 0.00001, label: 'viscosity' },
  { key: 'conf', type: 'range', min: 0, max: 8, default: 2.5, step: 0.25, label: 'vort confinement ε' },
  { key: 'res', type: 'int', min: 48, max: 256, default: 112, step: 8, label: 'grid res' },
  { key: 'splat', type: 'range', min: 0.1, max: 1.5, default: 0.6, step: 0.05, label: 'splat strength' },
  { key: 'dyefade', type: 'boolean', default: true, label: 'dye fade' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

export const r2_fluid_03_stam            = {
  id: 'r2-fluid-03-stam',
  name: 'Stam stable fluids',
  repo: 'Stam 1999 / Fedkiw 2001 — stable fluids + vorticity confinement',
  summary:
    'Semi-Lagrangian incompressible solver with Helmholtz-Hodge pressure projection. Vorticity confinement (Fedkiw 2001) re-energizes the fine swirl numerical diffusion destroys, filling the glyph with persistent nested eddies.',
  helps:
    'Smoke-trapped-in-glass aesthetic — tight vortex tubes spiral inward from stroke edges when ε > 2.',
  params: PARAMS,
  init({ ctx, sdf, W, H, rng, params, clock, pointer }) {
    const visc = num(params, 'visc', 0.00005)
    const confEps = num(params, 'conf', 2.5)
    const N = num(params, 'res', 112)
    const splatStr = num(params, 'splat', 0.6)
    const dyeFade = bool(params, 'dyefade', true)

    const NY = Math.round(N * H / W)
    const sz = (N + 2) * (NY + 2)

    const u = new Float32Array(sz), v = new Float32Array(sz)
    const u0 = new Float32Array(sz), v0 = new Float32Array(sz)
    const dens = new Float32Array(sz), dens0 = new Float32Array(sz)
    const solid = new Uint8Array(sz)

    const IX = (i        , j        ) => (i + 1) + (j + 1) * (N + 2)

    // Build solid mask from SDF
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < N; i++) {
        const sx = (i + 0.5) / N * sdf.w
        const sy = (j + 0.5) / NY * sdf.h
        solid[IX(i, j)] = sdf.sample(sx, sy) >= 0 ? 1 : 0
      }
    }

    /* THE SOLVER ON ONE GRID (plan 50 1.1). It treated a cell as 1/N wide but 1/NY tall while the pressure solve weighted
       all four neighbours alike, so on any non-square frame the projection left divergence behind; vorticity confinement
       fed on it and the field ran to 1e38. setBnd also walked the side walls with the column count. Now: square cells,
       h = 1/N on both axes (the domain is 1 wide, NY/N tall), and walls — the frame edge and the glyph's solid cells —
       handled inside every stencil (no-slip for velocity, zero-flux for pressure and dye) instead of patched after. */
    const h = 1 / N
    const fluid = new Uint8Array(sz) // 1 inside the grid and outside the glyph's solid
    for (let j = 0; j < NY; j++) for (let i = 0; i < N; i++) fluid[IX(i, j)] = solid[IX(i, j)] ? 0 : 1
    const zeroWalls = (x) => { for (let n = 0; n < sz; n++) if (!fluid[n]) x[n] = 0 }

    /* Gauss-Seidel over fluid cells. Pressure and dye: a wall neighbour mirrors the cell — no flux. Velocity: a wall
       neighbour is 0 — no slip. */
    const linSolve = (x, x0, a, mode, iter) => { /* mode: 'p' pressure · 'n' zero-flux scalar · 'v' no-slip velocity */
      const W1 = N + 2
      for (let k = 0; k < iter; k++) {
        for (let j = 0; j < NY; j++) {
          for (let i = 0; i < N; i++) {
            const n = IX(i, j)
            if (!fluid[n]) continue
            let sum = 0, cnt = 0
            if (fluid[n - 1]) { sum += x[n - 1]; cnt++ }
            if (fluid[n + 1]) { sum += x[n + 1]; cnt++ }
            if (fluid[n - W1]) { sum += x[n - W1]; cnt++ }
            if (fluid[n + W1]) { sum += x[n + W1]; cnt++ }
            x[n] = mode === 'p' ? (x0[n] + sum) / (cnt || 1) : mode === 'n' ? (x0[n] + a * sum) / (1 + a * cnt) : (x0[n] + a * sum) / (1 + 4 * a)
          }
        }
      }
    }
    const diffuse = (x, x0, diff, dt, neumann) => {
      const a = dt * diff * N * N
      if (a <= 0) { x.set(x0); return } /* Viscosity 0: the step still hands its buffer on (the dye-sat-still bug) */
      linSolve(x, x0, a, neumann ? 'n' : 'v', 20)
      zeroWalls(x)
    }
    const advect = (d, d0, uu, vv, dt) => {
      const dt0 = dt * N
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < N; i++) {
          const n = IX(i, j)
          if (!fluid[n]) { d[n] = 0; continue }
          const x = Math.max(0, Math.min(N - 1, i - dt0 * uu[n]))
          const y = Math.max(0, Math.min(NY - 1, j - dt0 * vv[n]))
          const i0 = Math.floor(x), j0 = Math.floor(y)
          const i1 = Math.min(N - 1, i0 + 1), j1 = Math.min(NY - 1, j0 + 1)
          const s1 = x - i0, s0 = 1 - s1, t1 = y - j0, t0 = 1 - t1
          d[n] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) + s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)])
        }
      }
    }
    const project = (uu, vv) => {
      const W1 = N + 2
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < N; i++) {
          const n = IX(i, j)
          if (!fluid[n]) { div[n] = 0; p[n] = 0; continue }
          div[n] = -0.5 * h * (uu[n + 1] - uu[n - 1] + vv[n + W1] - vv[n - W1])
          p[n] = 0
        }
      }
      linSolve(p, div, 1, 'p', 40)
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < N; i++) {
          const n = IX(i, j)
          if (!fluid[n]) continue
          const pc = p[n]
          const pl = fluid[n - 1] ? p[n - 1] : pc, pr = fluid[n + 1] ? p[n + 1] : pc
          const pb = fluid[n - W1] ? p[n - W1] : pc, pt = fluid[n + W1] ? p[n + W1] : pc
          uu[n] -= 0.5 * (pr - pl) / h
          vv[n] -= 0.5 * (pt - pb) / h
        }
      }
      zeroWalls(uu); zeroWalls(vv)
    }
    /* vorticity confinement (Fedkiw 2001): ω = curl, N = ∇|ω| / |∇|ω||, f = ε·h·(N × ω) */
    const curlA = new Float32Array(sz)
    const confine = (dt) => {
      const W1 = N + 2
      for (let j = 0; j < NY; j++) for (let i = 0; i < N; i++) {
        const n = IX(i, j)
        curlA[n] = fluid[n] ? ((v[n + 1] - v[n - 1]) - (u[n + W1] - u[n - W1])) / (2 * h) : 0
      }
      for (let j = 0; j < NY; j++) for (let i = 0; i < N; i++) {
        const n = IX(i, j)
        if (!fluid[n]) continue
        const gx = (Math.abs(curlA[n + 1]) - Math.abs(curlA[n - 1])) / (2 * h)
        const gy = (Math.abs(curlA[n + W1]) - Math.abs(curlA[n - W1])) / (2 * h)
        const gm = Math.hypot(gx, gy) + 1e-5
        const w = curlA[n]
        u[n] += dt * confEps * h * (gy / gm) * w
        v[n] -= dt * confEps * h * (gx / gm) * w
      }
    }

    const p = new Float32Array(sz), div = new Float32Array(sz)

    // Random dye source positions inside glyph
    const sources                     = []
    for (let k = 0; k < 5; k++) {
      let tries = 0
      while (tries++ < 100) {
        const si = Math.floor(rng() * N), sj = Math.floor(rng() * NY)
        if (!solid[IX(si, sj)]) { sources.push([si, sj]); break }
      }
    }

    // Grid-sized blit target — nearest-neighbor upscale replaces the old
    // full-canvas ImageData (a W×H putImageData per frame at up to 2000px).
    const img = ctx.createImageData(N, NY)
    const pixels = img.data
    const tmpC = document.createElement('canvas')
    tmpC.width = N; tmpC.height = NY
    const tctx = tmpC.getContext('2d')
    let prevT = clock.nowSeconds()
    let prevPtr = null // previous pointer sample (SDF coords) for the motion impulse
    let prevDown = false

    return wrapLoop(() => {
      const now = clock.nowSeconds()
      // floored at 0 — a backwards clock jump would make diffuse's 1/c divide blow up
      const dt = Math.max(0, Math.min(now - prevT, 0.05))
      prevT = now

      // Inject dye + force at sources — PLUMES, not pin-pricks (plan 49 5.4, the user: "these two are broken"): one cell
      // of dye per source on a 112 grid faded to nothing before it spread, so the frame read blank. Each source now
      // feeds a small disk and pushes it along its own slowly turning heading, so a plume streams out and curls.
      const R = Math.max(2, Math.round(N / 40))
      const FORCE = 4
      sources.forEach(([si, sj], k) => {
        const ang = k * 2.4 + now * 0.35
        const fx = Math.cos(ang) * splatStr * 0.6, fy = Math.sin(ang) * splatStr * 0.6
        for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
          const r2 = di * di + dj * dj
          if (r2 > R * R) continue
          const ci = si + di, cj = sj + dj
          if (ci < 0 || ci >= N || cj < 0 || cj >= NY || solid[IX(ci, cj)]) continue
          /* a soft disc, scaled by the frame's dt — a force, not a per-frame velocity kick (plan 50 1.2) */
          const wgt = 1 - Math.sqrt(r2) / (R + 1)
          dens0[IX(ci, cj)] += splatStr * 9 * dt * wgt
          u0[IX(ci, cj)] += fx * FORCE * dt * wgt
          v0[IX(ci, cj)] += fy * FORCE * dt * wgt
        }
      })

      // Pointer splat: mirror the source injection at the cursor cell — dye
      // plus a velocity impulse from pointer motion (scaled by `interact`).
      // Held drag = the motion splat (heavier pour while down); down-EDGE =
      // a BURST — a large dye charge with a radial velocity blast outward,
      // an explosion in the fluid.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      const edge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (ptr) {
        const gi = Math.floor(ptr.x / sdf.w * N)
        const gj = Math.floor(ptr.y / sdf.h * NY)
        if (gi >= 0 && gi < N && gj >= 0 && gj < NY && !solid[IX(gi, gj)]) {
          dens0[IX(gi, gj)] += splatStr * 0.8 * params.interact * (ptr.down ? 2 : 1)
          if (prevPtr) {
            /* the pointer's speed in domain units per second (plan 50 1.1: was cells, ~50× too strong) */
            u0[IX(gi, gj)] += (ptr.x - prevPtr.x) / sdf.w * 30 * params.interact
            v0[IX(gi, gj)] += (ptr.y - prevPtr.y) / sdf.w * 30 * params.interact
          }
        }
        if (edge && gi >= 0 && gi < N && gj >= 0 && gj < NY) {
          const rad = Math.max(3, Math.round(N * 0.12 * (0.5 + params.interact * 0.5)))
          for (let dj = -rad; dj <= rad; dj++) {
            for (let di = -rad; di <= rad; di++) {
              const ci = gi + di, cj = gj + dj
              if (ci < 0 || ci >= N || cj < 0 || cj >= NY) continue
              if (solid[IX(ci, cj)]) continue
              const d = Math.hypot(di, dj)
              if (d > rad) continue
              const w = 1 - d / rad
              dens0[IX(ci, cj)] += splatStr * 4 * w * params.interact
              const inv = 1 / (d || 1)
              const kick = splatStr * 1.2 * w * params.interact
              u0[IX(ci, cj)] += di * inv * kick
              v0[IX(ci, cj)] += dj * inv * kick
            }
          }
        }
        prevPtr = { x: ptr.x, y: ptr.y }
      } else {
        prevPtr = null
      }

      /* Stam's order (plan 50 1.1): add sources → diffuse → project → advect → confine → project. Sources and pointer
         impulses arrive in u0 / v0 / dens0 already scaled to this frame. */
      for (let n = 0; n < sz; n++) { u[n] += u0[n]; v[n] += v0[n] }
      diffuse(u0, u, visc, dt, false); diffuse(v0, v, visc, dt, false)
      project(u0, v0)
      advect(u, u0, u0, v0, dt); advect(v, v0, u0, v0, dt)
      if (confEps > 0.01) confine(dt)
      project(u, v)
      u0.fill(0); v0.fill(0)

      /* dye: add → diffuse → advect, then fade (plan 50 1.2 — the only way dye leaves the frame) */
      for (let n = 0; n < sz; n++) dens[n] += dens0[n]
      diffuse(dens0, dens, visc * 0.1, dt, true)
      advect(dens, dens0, u, v, dt)
      if (dyeFade) { const k = Math.exp(-dt * 0.35); for (let n = 0; n < sz; n++) dens[n] *= k } /* per second, not per frame — the same at 30 and 60 fps */
      dens0.fill(0)

      // Render density to ImageData — theme ramp LUT, hot cells hit full white-warm
      const rampLUT = new Uint8Array(64 * 3)
      for (let k = 0; k < 64; k++) {
        const [rr, gg, bb] = rampRGB(k / 63)
        rampLUT[k * 3] = rr; rampLUT[k * 3 + 1] = gg; rampLUT[k * 3 + 2] = bb
      }
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < N; i++) {
          const pidx = (j * N + i) * 4
          if (solid[IX(i, j)]) { pixels[pidx + 3] = 0; continue }
          const d = 1 - Math.exp(-dens[IX(i, j)] * 1.4) /* a soft shoulder — dense cores no longer clip to a flat blob (plan 50 1.2) */
          const ki = (d * 63) | 0
          pixels[pidx]     = rampLUT[ki * 3]
          pixels[pidx + 1] = rampLUT[ki * 3 + 1]
          pixels[pidx + 2] = rampLUT[ki * 3 + 2]
          pixels[pidx + 3] = Math.round(Math.min(1, d * 1.4) * 255)
        }
      }

      clear(ctx, W, H)
      tctx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true /* smooth field, not blocks — plan 49 5.3 */
      ctx.drawImage(tmpC, 0, 0, W, H)
      ctx.imageSmoothingEnabled = true
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)
    })
  },
}
