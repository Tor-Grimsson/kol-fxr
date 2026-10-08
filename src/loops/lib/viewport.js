// Universal viewport camera for 2d loops (ported from kol-labs-single
// src/loops/viewport.js) — the Animation layer the archetype's Frame/Form
// needs. Opaque loop draw fns have no per-element hook, so the "motion" is a
// global camera the HOST applies around the loop's own draw:
//   FRAME (the whole loop moves)        — Spin (whole turns ⇒ seamless) · Zoom
//   FORM  (the loop modulates in place) — Pulse (zoom breathe) · Wobble (rotation osc)
// All seamless (spin = whole turns; pulse/wobble = sin at integer vpRate
// cycles, return at u=1 — the editor's loop-safety convention). Keys are
// `vp`-prefixed so they never collide with a loop's own `spin`/`camZoom`
// params, and default to IDENTITY so a loop with no camera renders exactly as
// before.
//
// Rotation would reveal the canvas corners (the loop's bg rect rotates off
// them), so the camera adds just enough cover-zoom that the rotated frame
// always blankets the canvas — no separate bg fill needed.
//
// Which loops carry the vp params is decided by contract.js (the def-schema
// fold): the shape group + pattern-rules. Every 2d draw path goes through
// drawLoopFrame below, so layers without vp keys pay one identity check.

const TAU = Math.PI * 2

export const VP_DEFAULTS = { vpZoom: 1, vpSpin: 0, vpPulse: 0, vpWobble: 0, vpRate: 1 }
export const VP_KEYS = Object.keys(VP_DEFAULTS)

/* ── THE TIME SHAPE (plan 18 § 4, 2026-10-08; the user: "I dont love the loop always breathing
 * in and out. I would like more variation to the way it animates") ──
 * The loop clock is `u` 0→1, linear, and most generators phase a sine on it — so every loop
 * breathes the same way. These three params warp `u` BEFORE the draw, in `drawLoopFrame` (every
 * 2d frame, live and export) and on the GL engines' `u`. Identity by default. Seamless by
 * construction: every curve returns to its start at u=1, speed is whole loops per cycle, phase
 * is a rotation of the loop. `drift` wanders a smooth hump on top of linear (two sines, both
 * integer cycles, so it closes too). Folded onto every 2d def at the registry — the camera's
 * fold covers only shape + pattern-rules — and not onto the Penrose sims (a warped clock on an
 * accumulating sim is not a loop). */
export const TIME_DEFAULTS = { vpTime: 'linear', vpSpeed: 1, vpPhase: 0 }
export const TIME_KEYS = Object.keys(TIME_DEFAULTS)
export const TIME_CURVES = [
  { value: 'linear',   label: 'Linear' },
  { value: 'ease',     label: 'Ease' },
  { value: 'pingpong', label: 'Ping-pong' },
  { value: 'steps',    label: 'Steps' },
  { value: 'bounce',   label: 'Bounce' },
  { value: 'drift',    label: 'Drift' },
]
export const TIME_PARAMS = [
  { key: 'vpTime',  label: 'Time',  type: 'select', default: 'linear', options: TIME_CURVES, tab: 'anim', section: 'Form' },
  { key: 'vpSpeed', label: 'Speed', type: 'range', min: 1, max: 4, step: 1,    default: 1, tab: 'anim', section: 'Form' },
  { key: 'vpPhase', label: 'Phase', type: 'range', min: 0, max: 1, step: 0.05, default: 0, tab: 'anim', section: 'Form' },
]
const frac = (x) => x - Math.floor(x)
/** `u` through the layer's time shape; identity when the params are absent or default. */
export function warpTime(u, p) {
  if (!p) return u
  const curve = p.vpTime || 'linear'
  const speed = Math.max(1, Math.round(p.vpSpeed || 1))
  const phase = p.vpPhase || 0
  if (curve === 'linear' && speed === 1 && !phase) return u
  let x = frac(u * speed)
  switch (curve) {
    case 'ease':     x = 0.5 - 0.5 * Math.cos(x * Math.PI); break
    case 'pingpong': x = x < 0.5 ? x * 2 : 2 - x * 2; break
    case 'steps':    x = Math.floor(x * 4) / 4; break
    case 'bounce':   { const b = Math.abs(Math.sin(x * Math.PI * 2)); x = x < 0.5 ? b : 1 - b * 0.5; x = frac(x); break }
    case 'drift':    x = frac(x + 0.08 * Math.sin(x * TAU) + 0.04 * Math.sin(x * TAU * 3)); break
    default: break
  }
  return frac(x + phase)
}

/* Editor param-schema entries for the camera (labs LoopsShell Animation tab,
 * its actual split: Frame = Spin + Zoom · Form = Pulse + Wobble + Rate).
 * Ranges match the labs sliders (LoopsShell.jsx:364-375). */
export const VP_PARAMS = [
  { key: 'vpSpin',   label: 'Spin',   type: 'range', min: 0, max: 4,   step: 1,    default: 0, tab: 'anim', section: 'Frame' },
  { key: 'vpZoom',   label: 'Zoom',   type: 'range', min: 1, max: 2.5, step: 0.05, default: 1, tab: 'anim', section: 'Frame' },
  { key: 'vpPulse',  label: 'Pulse',  type: 'range', min: 0, max: 1,   step: 0.05, default: 0, tab: 'anim', section: 'Form' },
  { key: 'vpWobble', label: 'Wobble', type: 'range', min: 0, max: 30,  step: 1,    default: 0, tab: 'anim', section: 'Form' },
  { key: 'vpRate',   label: 'Rate',   type: 'range', min: 1, max: 4,   step: 1,    default: 1, tab: 'anim', section: 'Form' },
]

// Apply the camera transform to ctx for frame u. Returns true if it transformed
// (caller wrapped it in save/restore); false if identity (nothing applied).
export function applyViewport(ctx, u, w, h, p) {
  const spin = Math.round(p.vpSpin || 0)
  const zoom = p.vpZoom ?? 1
  const pulse = p.vpPulse || 0
  const wobble = p.vpWobble || 0 // degrees
  if (!spin && pulse === 0 && wobble === 0 && zoom === 1) return false

  const ph = u * TAU * Math.round(p.vpRate || 1)
  const rot = u * TAU * spin + (wobble * Math.PI / 180) * Math.sin(ph)
  // Worst-case rotation this loop reaches → cover-zoom so corners never show.
  const maxAngle = spin ? Math.PI / 4 : Math.abs(wobble * Math.PI / 180)
  const cover = Math.cos(maxAngle) + Math.sin(maxAngle) // ≥1; √2 at 45°
  const z = Math.max(zoom * (1 + pulse * 0.5 * Math.sin(ph)), cover * 1.02)

  ctx.translate(w / 2, h / 2)
  ctx.rotate(rot)
  ctx.scale(z, z)
  ctx.translate(-w / 2, -h / 2)
  return true
}

// The single draw seam: every 2d loop frame renders through this (LoopLayer,
// EffectedLayer's loop source, EngineLoopFilterLayer's feed, build.js export)
// so the camera applies identically live and exported. Identity params ⇒
// exactly the bare loop.draw (labs drawWithViewport).
export function drawLoopFrame(ctx, loop, u, w, h, p) {
  if (!loop) return
  const t = warpTime(u, p)
  ctx.save()
  applyViewport(ctx, t, w, h, p)
  loop.draw(ctx, t, w, h, p)
  ctx.restore()
}
