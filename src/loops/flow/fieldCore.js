import { createNoise2D, createNoise4D } from 'simplex-noise'
import { TAU } from '../lib/util.js'

/**
 * fieldCore — ONE vector field the flow loops share (plan 37 § 6.2, lobby
 * `effects-intake-motion-references-2026-10`). A field is a list of COMPONENTS summed at a point;
 * two renderers sit on top: a streamline integrator and a glyph instancer.
 *
 *   const f = [uniform(1, 0), cylinder(x, y, r, 1), charge(x, y, +1)]
 *   const [vx, vy] = sample(f, x, y)
 *
 * Components are plain `(x, y) => [vx, vy]` functions, so a loop builds its field per frame from u
 * (moving obstacles on closed paths) and stays a pure function of u — seamless and scrubbable.
 * `penrose/protos/07-flow-field` reads its angle field through `noiseAngle` here.
 */

/* ── components ─────────────────────────────────────────────────────────── */

export const uniform = (vx, vy) => () => [vx, vy]

/* a whirl around (cx, cy); `fall` softens the core so the centre is not a singularity */
export const vortex = (cx, cy, k, fall = 40) => (x, y) => {
  const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy + fall * fall
  return [(-dy * k * fall) / r2, (dx * k * fall) / r2]
}

/* a source (q > 0) or sink (q < 0) */
export const sourceSink = (cx, cy, q, fall = 20) => (x, y) => {
  const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy + fall * fall
  return [(q * dx * fall) / r2, (q * dy * fall) / r2]
}

/* a 2D point charge — field lines run + → −; strength falls as 1/r */
export const charge = (cx, cy, q, soft = 4) => (x, y) => {
  const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy + soft * soft
  return [(q * dx) / r2, (q * dy) / r2]
}

/* a cylinder of radius R in a uniform stream U along +x — the potential-flow DOUBLET only; add
   `uniform(U, 0)` once for the stream. Inside the cylinder the field is zeroed. */
export const cylinder = (cx, cy, R, U = 1) => (x, y) => {
  const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy
  if (r2 < R * R) return [-U, 0]
  const r4 = r2 * r2, k = U * R * R
  return [-k * (dx * dx - dy * dy) / r4, -k * (2 * dx * dy) / r4]
}

/* seeded simplex noise as a direction field, looping in u: the noise is sampled on a circle in its
   3rd/4th dimensions, so u = 0 and u = 1 are the same field */
export function noiseFlow(rng, scale, strength = 1) {
  const n4 = createNoise4D(rng)
  return (u) => (x, y) => {
    const a = n4(x * scale, y * scale, Math.cos(u * TAU) * 0.6, Math.sin(u * TAU) * 0.6) * TAU
    return [Math.cos(a) * strength, Math.sin(a) * strength]
  }
}

/* the still angle field 07-flow-field steers by — same rng draw, same values as its own copy had */
export function noiseAngle(rng, scale) {
  const n2 = createNoise2D(rng)
  return (x, y) => n2(x * scale, y * scale) * TAU
}

export function sample(field, x, y) {
  let vx = 0, vy = 0
  for (const c of field) { const [a, b] = c(x, y); vx += a; vy += b }
  return [vx, vy]
}

/* ── renderer 1: streamlines (RK4 on the normalised direction, fixed arc step) ─────────────────── */

const dir = (field, x, y) => {
  const [vx, vy] = sample(field, x, y)
  const m = Math.hypot(vx, vy)
  return m < 1e-9 ? null : [vx / m, vy / m, m]
}

/**
 * Trace one streamline from (x, y). Stops at the frame edge, a stall, `maxSteps`, or when
 * `stop(x, y)` says so (a sink reached, an obstacle hit). `sign` −1 traces upstream.
 */
export function streamline(field, x, y, { step = 2, maxSteps = 600, w, h, stop, sign = 1 } = {}) {
  const pts = [[x, y]]
  for (let i = 0; i < maxSteps; i++) {
    const k1 = dir(field, x, y); if (!k1) break
    const k2 = dir(field, x + sign * k1[0] * step / 2, y + sign * k1[1] * step / 2); if (!k2) break
    const k3 = dir(field, x + sign * k2[0] * step / 2, y + sign * k2[1] * step / 2); if (!k3) break
    const k4 = dir(field, x + sign * k3[0] * step, y + sign * k3[1] * step); if (!k4) break
    x += sign * step * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6
    y += sign * step * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6
    if (w != null && (x < -step || y < -step || x > w + step || y > h + step)) break
    pts.push([x, y])
    if (stop?.(x, y)) break
  }
  return pts
}

export function strokeLine(ctx, pts) {
  if (pts.length < 2) return
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.stroke()
}

/* an arrowhead at a line's fraction t, pointing downstream */
export function arrowAt(ctx, pts, t, size) {
  if (pts.length < 3) return
  const i = Math.max(1, Math.min(pts.length - 1, Math.floor(pts.length * t)))
  const [x, y] = pts[i], [px, py] = pts[i - 1]
  const a = Math.atan2(y - py, x - px)
  ctx.beginPath()
  ctx.moveTo(x + Math.cos(a) * size, y + Math.sin(a) * size)
  ctx.lineTo(x + Math.cos(a + 2.5) * size, y + Math.sin(a + 2.5) * size)
  ctx.lineTo(x + Math.cos(a - 2.5) * size, y + Math.sin(a - 2.5) * size)
  ctx.closePath()
  ctx.fill()
}

/* ── renderer 2: glyph instancer — one glyph per grid cell, turned to the field, sized by its strength ── */

export function instanceGlyphs(ctx, field, { w, h, cols, glyph, font, size, scaleBy = 0, colorAt }) {
  const cell = w / cols
  const rows = Math.ceil(h / cell)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) * cell, y = (j + 0.5) * cell
      const [vx, vy] = sample(field, x, y)
      const m = Math.hypot(vx, vy)
      const k = m / (1 + m) /* field strength squashed to 0..1 — the mapping property */
      const s = size * cell * (1 - scaleBy + scaleBy * k)
      if (s < 0.5) continue
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(Math.atan2(vy, vx))
      ctx.font = `${s}px ${font}`
      ctx.fillStyle = colorAt(k)
      ctx.fillText(glyph, 0, 0)
      ctx.restore()
    }
  }
}

/* ── shared helpers ─────────────────────────────────────────────────────── */

/* a point riding a closed lissajous path in u — every moving thing in a flow loop rides one */
export const orbitAt = (u, cx, cy, ax, ay, fx, fy, ph) => [
  cx + ax * Math.cos(u * TAU * fx + ph),
  cy + ay * Math.sin(u * TAU * fy + ph * 1.7),
]
