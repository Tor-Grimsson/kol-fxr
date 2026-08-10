

import { num } from '../knobs.js'
import { clear, strokeOutline, wrapLoop, pc } from '../common.js'

// Clifford Torus — flat torus in S³, 4D-rotated each frame, stereographic
// projected to R³, then perspective to 2D.  Two-speed rotation in xw and yz
// planes makes the torus continuously fold inside-out.
// Ref: Wikipedia — Clifford torus; Banchoff, Beyond 3D ch. 6

const PARAMS          = [
  { key: 'grid', type: 'int', min: 10, max: 50, default: 28, step: 2, label: 'grid lines' },
  { key: 'spin1', type: 'range', min: 0, max: 1.5, default: 0.4, step: 0.05, label: 'spin xw' },
  { key: 'spin2', type: 'range', min: 0, max: 1.5, default: 0.25, step: 0.05, label: 'spin yz' },
  { key: 'cam', type: 'range', min: 1.5, max: 6, default: 3.0, step: 0.1, label: 'camera dist' },
  { key: 'alpha', type: 'range', min: 0.1, max: 0.9, default: 0.45, step: 0.05, label: 'base alpha' },
  { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
]

const INV_SQRT2 = 1 / Math.sqrt(2)

// shortest-arc angular difference, for lerping accumulating angles
function angDiff(a        , b        )         {
  let d = (a - b) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

// 4D rotation in xw-plane
// NOTE (2026-08-09 perf): project() inlines these scalarized — the array
// versions allocated ~5 arrays per point (~25k/frame). Kept as reference math.
function rxw(v                                  , a        )                                   { // eslint-disable-line no-unused-vars
  const c = Math.cos(a), s = Math.sin(a)
  return [c * v[0] - s * v[3], v[1], v[2], s * v[0] + c * v[3]]
}
// 4D rotation in yz-plane
function ryz(v                                  , a        )                                   { // eslint-disable-line no-unused-vars
  const c = Math.cos(a), s = Math.sin(a)
  return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2], v[3]]
}
// Stereographic S³ → R³
function stereo(v                                  )                           { // eslint-disable-line no-unused-vars
  const d = 1 - v[3]
  if (Math.abs(d) < 1e-7) return [0, 0, 0]
  return [v[0] / d, v[1] / d, v[2] / d]
}

export const r2_topo_03_clifford            = {
  id: 'r2-topo-03-clifford',
  name: 'CLIFFORD TORUS 4D',
  repo: 'Banchoff · Beyond 3D ch.6 · en.wikipedia.org/wiki/Clifford_torus',
  summary: 'Flat torus on S³ as (cosθ, sinθ, cosφ, sinφ)/√2; two independent 4D plane rotations projected stereographically then perspective to 2D wireframe.',
  helps: 'Inside-out folding motion is unlike anything else — the torus continuously inverts through itself, strong depth-cued warping.',
  params: PARAMS,
  init({ ctx, sdf, W, H, params, clock, pointer }) {
    const SC = Math.min(W, H) * 0.24
    const OX = W * 0.5, OY = H * 0.5

    /* Law 2 (2026-08-09): pointer x/y command the xw/yz rotation angles
     * (lerped) — the torus morphs and folds under the cursor; idle keeps
     * the two-speed auto spin. Press = flip impulse: a decaying yz burst
     * that snaps the torus through itself. */
    let ax1 = 0
    let ax2 = 0
    let vFlip = 0
    let prevT = null
    let prevDown = false

    // hoisted trig tables (2026-08-09 perf): the 48-step parameter sweep is
    // fixed — one cos/sin table forever; the θ table is memoized on grid count
    const STEPS = 48
    const CS48 = new Float32Array(STEPS + 1), SN48 = new Float32Array(STEPS + 1)
    for (let j = 0; j <= STEPS; j++) { const a = (j / STEPS) * Math.PI * 2; CS48[j] = Math.cos(a); SN48[j] = Math.sin(a) }
    let gN = -1, gCS = null, gSN = null

    return wrapLoop(() => {
      const t = clock.nowSeconds()
      const G = num(params, 'grid', 28)
      const s1 = num(params, 'spin1', 0.4)
      const s2 = num(params, 'spin2', 0.25)
      const cam = num(params, 'cam', 3.0)
      const baseAlpha = num(params, 'alpha', 0.45)

      const interact = num(params, 'interact', 1)
      const ptr = interact > 0 && pointer ? pointer() : null
      if (prevT == null) prevT = t
      const dtF = Math.min(0.1, Math.max(0.001, t - prevT))
      prevT = t
      if (ptr) {
        const w = 0.1 * Math.min(1, interact)
        const MAXD = 0.12 // anti-strobe: cap commanded step ≈7°/frame — no whip-fast folds
        ax1 += Math.max(-MAXD, Math.min(MAXD, angDiff((ptr.x / sdf.w) * Math.PI * 2, ax1) * w))
        ax2 += Math.max(-MAXD, Math.min(MAXD, angDiff((ptr.y / sdf.h) * Math.PI * 2, ax2) * w))
      } else {
        ax1 += s1 * dtF
        ax2 += s2 * dtF
      }
      const downEdge = !!(ptr && ptr.down) && !prevDown
      prevDown = !!(ptr && ptr.down)
      if (downEdge) vFlip = Math.min(12, vFlip + 10 * Math.min(1.5, interact)) // rapid clicks can't stack into a strobe spin
      ax2 += vFlip * dtF
      vFlip *= 0.93

      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(240, 230, 210, 0.35)', 2)

      const a1 = ax1
      const a2 = ax2
      const ca1 = Math.cos(a1), sa1 = Math.sin(a1)
      const ca2 = Math.cos(a2), sa2 = Math.sin(a2)
      if (G !== gN) { // θ table memoized on grid count
        gN = G
        gCS = new Float32Array(G); gSN = new Float32Array(G)
        for (let i = 0; i < G; i++) { const a = (i / G) * Math.PI * 2; gCS[i] = Math.cos(a); gSN[i] = Math.sin(a) }
      }

      // Project one (θ,φ) point to canvas — scalarized rxw/ryz/stereo inline,
      // writes PX/PY/PZ (no per-point arrays, no per-point trig)
      let PX = 0, PY = 0, PZ = 0
      function project(ct        , st        , cp        , sp        ) {
        const v0 = ct * INV_SQRT2, v1 = st * INV_SQRT2, v2 = cp * INV_SQRT2, v3 = sp * INV_SQRT2
        const x = ca1 * v0 - sa1 * v3
        const w4 = sa1 * v0 + ca1 * v3
        const y = ca2 * v1 - sa2 * v2
        const z = sa2 * v1 + ca2 * v2
        const d = 1 - w4
        let rx = 0, ry = 0, rz = 0
        if (Math.abs(d) >= 1e-7) { rx = x / d; ry = y / d; rz = z / d }
        let den = cam - rz
        if (den >= 0 && den < 1e-3) den = 1e-3 // spike/NaN floor on the perspective divide
        else if (den < 0 && den > -1e-3) den = -1e-3
        const w = 1 / den
        PX = OX + rx * SC * w; PY = OY + ry * SC * w; PZ = rz
      }

      // Draw constant-θ lines (latitude)
      for (let i = 0; i < G; i++) {
        const ct = gCS[i], st = gSN[i]
        ctx.beginPath()
        let first = true
        let sumZ = 0
        for (let j = 0; j <= STEPS; j++) {
          project(ct, st, CS48[j], SN48[j])
          sumZ += PZ
          if (first) { ctx.moveTo(PX, PY); first = false }
          else ctx.lineTo(PX, PY)
        }
        const meanZ = sumZ / 49
        const depth = Math.max(0, Math.min(1, (meanZ + 2) / 4))
        ctx.strokeStyle = pc('accent', baseAlpha * (0.6 + depth * 0.4))
        ctx.lineWidth = 1.5 + depth * 2
        ctx.stroke()
      }

      // Draw constant-φ lines (longitude)
      for (let j = 0; j < G; j++) {
        const cp = gCS[j], sp = gSN[j]
        ctx.beginPath()
        let first = true
        let sumZ = 0
        for (let i = 0; i <= STEPS; i++) {
          project(CS48[i], SN48[i], cp, sp)
          sumZ += PZ
          const sx = PX / W * sdf.w, sy = PY / H * sdf.h
          if (sdf.sample(sx, sy) > 6) { first = true; continue }
          if (first) { ctx.moveTo(PX, PY); first = false }
          else ctx.lineTo(PX, PY)
        }
        const meanZ = sumZ / 49
        const depth = Math.max(0, Math.min(1, (meanZ + 2) / 4))
        ctx.strokeStyle = pc('warm', baseAlpha * (0.5 + depth * 0.5))
        ctx.lineWidth = 1.4 + depth * 1.8
        ctx.stroke()
      }
    })
  },
}
