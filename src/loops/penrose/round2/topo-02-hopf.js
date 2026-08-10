

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, rampRGB } from '../common.js'

// Hopf Fibration — stereographic projection of S³ fibers to R³, then
// perspective to 2D. Each fiber = one great circle; colored by latitude on S².
// Ref: Niles Johnson nilesjohnson.net/hopf.html; arXiv 2212.01642
//
// HEAVY GLOBE REWORK (2026-08-09 — "more sensitive is not better" fix): the
// auto spin never stops; the pointer commands only a NARROW offset window
// (±0.6 rad around the auto orientation) through a very slow lerp, so the
// fibration turns under the hand like a weighted sphere. Flicks impart
// angular MOMENTUM that coasts out under damping; press adds a damped spin
// impulse. Nothing snaps to the cursor.

const PARAMS          = [
  { key: 'fibers', type: 'int', min: 20, max: 180, default: 80, step: 10, label: 'fiber count' },
  { key: 'spin', type: 'range', min: 0, max: 1.5, default: 0.3, step: 0.05, label: 'spin speed' },
  { key: 'pts', type: 'int', min: 20, max: 100, default: 48, step: 4, label: 'pts/fiber' },
  { key: 'cam', type: 'range', min: 2, max: 8, default: 4.0, step: 0.2, label: 'camera dist' },
  { key: 'alpha', type: 'range', min: 0.05, max: 0.8, default: 0.3, step: 0.05, label: 'base alpha' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

// 4D left-quaternion rotation around xw-plane by angle e (simple Hopf spin)
// NOTE (2026-08-09 perf): the render loop inlines these scalarized — the array
// versions allocated 4 arrays per point (~15k+/frame). Kept as the reference math.
function rot4xw(a, e) { // eslint-disable-line no-unused-vars
  const c = Math.cos(e), s = Math.sin(e)
  return [c * a[0] - s * a[3], a[1], a[2], s * a[0] + c * a[3]]
}
function rot4yz(a, e) { // eslint-disable-line no-unused-vars
  const c = Math.cos(e), s = Math.sin(e)
  return [a[0], c * a[1] - s * a[2], s * a[1] + c * a[2], a[3]]
}

// Stereographic S³ → R³ from north pole (0,0,0,1)
function stereo3(a) { // eslint-disable-line no-unused-vars
  const d = 1 - a[3]
  if (Math.abs(d) < 1e-7) return [0, 0, 0]
  return [a[0] / d, a[1] / d, a[2] / d]
}

// Fibonacci spiral on S² for uniform base point distribution
function fibSphere(i, n) {
  const phi = Math.acos(1 - 2 * (i + 0.5) / n)
  const theta = Math.PI * (1 + Math.sqrt(5)) * i
  return [theta, phi]
}

export const r2_topo_02_hopf            = {
  id: 'r2-topo-02-hopf',
  name: 'HOPF FIBRATION',
  repo: 'Niles Johnson · nilesjohnson.net/hopf · arXiv 2212.01642',
  summary: 'Pre-image fibers of the Hopf map h:S³→S², stereographically projected to R³ then perspective to 2D; animated by a 4D rotation applied each frame.',
  helps: 'Villarceau-circle fiber orbits create strong "depth through a porthole" — definitively 3D-feeling motion inside the glyph.',
  params: PARAMS,
  init({ ctx, sdf, W, H, params, clock, pointer }) {
    const SC = Math.min(W, H) * 0.22
    const OX = W * 0.5, OY = H * 0.5

    let auto1 = 0, auto2 = 0   // auto spin phase — never interrupted
    let off1 = 0, off2 = 0     // pointer-commanded narrow offset (heavy lerp)
    let coast = 0              // momentum-integrated angle
    let vel = 0                // angular velocity (flicks + press impulses)
    let prevT = null
    let prevPX = null
    let prevDown = false

    // memoized fiber table (2026-08-09 perf) — rebuilt only when NF changes
    let fibNF = -1
    let fibCT = null, fibST = null, fibCP = null, fibSP = null, fibLat = null

    return wrapLoop(() => {
      const t = clock.nowSeconds()
      const NF = num(params, 'fibers', 80)
      const spin = num(params, 'spin', 0.3)
      const PTS = num(params, 'pts', 48)
      const cam = num(params, 'cam', 4.0)
      const baseAlpha = num(params, 'alpha', 0.3)

      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      const kB = Math.min(1, interact)
      if (prevT == null) prevT = t
      const dtF = Math.min(0.1, Math.max(0.001, t - prevT))
      prevT = t

      // the globe always turns on its own
      auto1 += spin * dtF
      auto2 += spin * 0.618 * dtF

      // pointer → NARROW offset window (±0.6 rad), very slow lerp — the hand
      // suggests an orientation, the mass follows; idle eases home to auto
      const tOff1 = ptr ? ((ptr.x / sdf.w) - 0.5) * 1.2 * kB : 0
      const tOff2 = ptr ? ((ptr.y / sdf.h) - 0.5) * 1.2 * kB : 0
      off1 += (tOff1 - off1) * 0.03
      off2 += (tOff2 - off2) * 0.03

      // flicks impart momentum that coasts; press = damped spin impulse
      if (ptr && prevPX != null) vel += ((ptr.x - prevPX) / sdf.w) * 5 * kB
      prevPX = ptr ? ptr.x : null
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) vel += 2.5 * Math.min(1.5, interact)
      vel = Math.max(-6, Math.min(6, vel))
      coast += vel * dtF
      vel *= 0.988

      const e1 = auto1 + off1 + coast
      const e2 = auto2 + off2 + coast * 0.618

      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)

      // rebuild the per-fiber trig table only when the fiber count changes
      if (NF !== fibNF) {
        fibNF = NF
        fibCT = new Float32Array(NF); fibST = new Float32Array(NF)
        fibCP = new Float32Array(NF); fibSP = new Float32Array(NF)
        fibLat = new Float32Array(NF)
        for (let fi = 0; fi < NF; fi++) {
          const [theta, phi] = fibSphere(fi, NF)
          fibCT[fi] = Math.cos(theta * 0.5); fibST[fi] = Math.sin(theta * 0.5)
          fibCP[fi] = Math.cos(phi * 0.5); fibSP[fi] = Math.sin(phi * 0.5)
          fibLat[fi] = phi / Math.PI // 0..1
        }
      }

      // frame invariants hoisted out of the point loop; rot4xw/rot4yz/stereo3
      // scalarized inline (the array versions allocated 4 arrays per point)
      const ce1 = Math.cos(e1), se1 = Math.sin(e1)
      const ce2 = Math.cos(e2), se2 = Math.sin(e2)
      const dA = Math.PI / PTS // u/2 step — angles advance by rotation, no per-point trig
      const cD = Math.cos(dA), sD = Math.sin(dA)

      for (let fi = 0; fi < NF; fi++) {
        const lat = fibLat[fi]
        const cph = fibCP[fi], sph = fibSP[fi]
        let cA = fibCT[fi], sA = fibST[fi]   // cos/sin (u+theta)/2
        let cB = fibCT[fi], sB = -fibST[fi]  // cos/sin (u-theta)/2

        ctx.beginPath()
        let first = true
        let skip = false
        for (let j = 0; j <= PTS; j++) {
          // Hopf fiber parameterization
          const a0 = cA * cph, a1 = sA * cph, a2 = cB * sph, a3 = sB * sph
          // rot4xw(e1) then rot4yz(e2)
          const r0 = ce1 * a0 - se1 * a3
          const r3 = se1 * a0 + ce1 * a3
          const r1 = ce2 * a1 - se2 * a2
          const r2 = se2 * a1 + ce2 * a2
          // stereo3
          const d = 1 - r3
          let rx = 0, ry = 0, rz = 0
          if (Math.abs(d) >= 1e-7) { rx = r0 / d; ry = r1 / d; rz = r2 / d }
          const den = cam - rz
          // advance incremental angles before any skip
          const nA = cA * cD - sA * sD; sA = sA * cD + cA * sD; cA = nA
          const nB = cB * cD - sB * sD; sB = sB * cD + cB * sD; cB = nB
          if (Math.abs(den) < 1e-3) continue // perspective singularity — drop vertex, no NaN/spike
          const w = 1 / den
          const px = OX + rx * SC * w
          const py = OY + ry * SC * w
          // SDF clip on first point check
          if (j === 0) {
            const sxp = px / W * sdf.w, syp = py / H * sdf.h
            if (sdf.sample(sxp, syp) > 12) { skip = true; break }
          }
          if (first) { ctx.moveTo(px, py); first = false }
          else ctx.lineTo(px, py)
        }
        if (skip) continue
        const depth = Math.max(0, Math.min(1, (1 - lat)))
        const alpha = Math.min(1, baseAlpha + depth * 0.45)
        // latitude sweeps the theme ramp (accent→fg→warm)
        const [fr, fg2, fb] = rampRGB(0.35 + lat * 0.65)
        ctx.strokeStyle = `rgba(${fr},${fg2},${fb},${alpha.toFixed(3)})`
        ctx.lineWidth = 1.8 + depth * 2
        ctx.stroke()
      }
    })
  },
}
