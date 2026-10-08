import { TAU } from '../lib/util.js'

// Modulator rings — the kol-modulator app's FrequencyModulator/DialRotation
// ported onto the loop contract (plan 02-labs-mobile-and-vector step 2).
// Concentric ring pairs around a main circle, each warped by a sine wave;
// a breath cycle swells the wave amplitude and pushes the pairs apart.
//
// The original accumulated drift per gsap tick (perpetual, never seamless).
// Here every phase derives from u: breath = sin(TAU·u·breaths), the wave
// pattern rotates driftCycles full turns per loop, and the wave count around
// each ring is an integer (the source's quantize branch) — so frame(0) ===
// frame(1) by construction and the loop is scrubbable/exportable like any
// other. ponytail: always-quantized ring closure; the source's non-quantized
// mode draws a visible seam at θ=0, which is the edge case, not the look.
export default {
  id: 'modulator-rings',
  label: 'Modulator',
  group: 'modulator',
  kind: '2d',
  duration: 6,
  params: [
    { key: 'bg', label: 'Background', type: 'color', role: 'bg', default: '#0b0b0e' },
    { key: 'ink', label: 'Ink', type: 'color', role: 'fg', default: '#e8e4dc' },
    { key: 'intensity', label: 'Intensity', type: 'range', min: 0, max: 400, step: 5, default: 200 },
    { key: 'frequency', label: 'Frequency', type: 'range', min: 10, max: 200, step: 5, default: 100 },
    { key: 'rings', label: 'Rings', type: 'range', min: 1, max: 8, step: 1, default: 3, noRandom: true },
    { key: 'separation', label: 'Separation', type: 'range', min: 0, max: 40, step: 1, default: 16 },
    { key: 'breaths', label: 'Breaths', type: 'range', min: 1, max: 4, step: 1, default: 2, noRandom: true },
    { key: 'breathAmp', label: 'Breath amp', type: 'range', min: 0, max: 40, step: 1, default: 10 },
    { key: 'drift', label: 'Drift', type: 'range', min: 0, max: 6, step: 1, default: 1, noRandom: true },
    { key: 'depth', label: 'Depth', type: 'range', min: 10, max: 100, step: 1, default: 50 },
    { key: 'size', label: 'Reach', type: 'range', min: 0.4, max: 1, step: 0.02, default: 0.7 },
    { key: 'weight', label: 'Weight', type: 'range', min: 0.5, max: 8, step: 0.5, default: 2 },
  ],
  draw(ctx, u, w, h, p) {
    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)

    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) * 0.5 * p.size
    const scale = p.depth / 100
    // breath: |sin| matches the source's gsap yoyo (0→1→0 per cycle)
    const breath = Math.abs(Math.sin(TAU * u * Math.round(p.breaths) * 0.5))
    const driftPhase = TAU * u * Math.round(p.drift)
    const amp = (p.intensity * 0.05 + breath * p.breathAmp) * scale
    // integer waves per ring — the source's quantized cyclesPerCircle
    const cycles = Math.max(1, Math.round(p.frequency / 10))

    ctx.strokeStyle = p.ink
    ctx.lineWidth = p.weight

    const ring = (radius, ringAmp, pairPhase) => {
      if (radius <= 0) return
      ctx.beginPath()
      const N = 240
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * TAU
        const r = radius + ringAmp * Math.sin(cycles * a + driftPhase + pairPhase)
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }

    ring(R, amp, 0)
    const pairs = Math.round(p.rings) - 1
    for (let k = 1; k <= pairs; k++) {
      // source: baseOffset k·sep·scale, plus breath·k·sep·scale of separation
      const off = k * p.separation * scale * (1 + breath)
      const ringAmp = amp * (1 + k * 0.1)
      const pairPhase = k * 1.5
      ring(R - off, ringAmp, pairPhase)
      ring(R + off, ringAmp, pairPhase)
    }
  },
}
