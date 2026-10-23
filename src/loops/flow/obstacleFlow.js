import { TAU } from '../lib/util.js'
import { uniform, cylinder, streamline, strokeLine, orbitAt } from './fieldCore.js'

// Obstacle flow (E4, after dvdp *261016*) — horizontal streamlines bending round moving circles,
// rings at each circle. Potential flow: a uniform stream plus one doublet per cylinder; streamlines
// seeded evenly down the left edge. The circles ride closed paths in u ⇒ seamless.
export default {
  id: 'flow-obstacles',
  label: 'Obstacle flow',
  group: 'flow',
  kind: '2d',
  duration: 12,
  params: [
    { key: 'bg', label: 'Background', type: 'color', role: 'bg', default: '#0b0b0e', section: 'Color' },
    { key: 'line', label: 'Line color', type: 'color', role: 'fg', default: '#ece7dc', section: 'Color' },
    { key: 'ring', label: 'Ring color', type: 'color', role: 'accent', default: '#ffcf33', section: 'Color' },
    { key: 'lines', label: 'Line count', type: 'range', min: 12, max: 120, step: 1, default: 56 },
    { key: 'obstacles', label: 'Obstacles', type: 'range', min: 1, max: 6, step: 1, default: 3, noRandom: true },
    { key: 'radius', label: 'Radius', type: 'range', min: 0.03, max: 0.16, step: 0.01, default: 0.08 },
    { key: 'rings', label: 'Rings', type: 'range', min: 0, max: 8, step: 1, default: 4 },
    { key: 'drift', label: 'Drift', type: 'range', min: 0, max: 0.35, step: 0.01, default: 0.18 },
    { key: 'weight', label: 'Weight', type: 'range', min: 0.25, max: 3, step: 0.25, default: 1 },
  ],
  draw(ctx, u, w, h, p) {
    const m = Math.min(w, h)
    const R = p.radius * m
    const n = Math.round(p.obstacles)
    /* each circle on its own lissajous loop, spread across the frame */
    const balls = Array.from({ length: n }, (_, i) => orbitAt(u, w * (i + 0.5) / n, h * (0.3 + 0.4 * ((i * 0.618) % 1)), p.drift * w * 0.5, p.drift * h, 1, 1 + (i % 2), i * 2.4))
    const field = [uniform(1, 0), ...balls.map(([x, y]) => cylinder(x, y, R, 1))]
    const inside = (x, y) => balls.some(([bx, by]) => (x - bx) ** 2 + (y - by) ** 2 < R * R * 1.02)

    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)
    ctx.lineWidth = p.weight * m / 900
    ctx.strokeStyle = p.line
    const count = Math.round(p.lines)
    for (let i = 0; i < count; i++) {
      const y0 = (i + 0.5) * h / count
      strokeLine(ctx, streamline(field, 0, y0, { step: m / 300, maxSteps: 2000, w, h, stop: inside }))
    }
    ctx.strokeStyle = p.ring
    for (const [x, y] of balls) {
      for (let k = 0; k <= Math.round(p.rings); k++) {
        ctx.beginPath()
        ctx.arc(x, y, R * (1 - k / (Math.round(p.rings) + 1)), 0, TAU)
        ctx.stroke()
      }
    }
  },
}
