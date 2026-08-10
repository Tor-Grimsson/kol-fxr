// Prototype draw helpers — ported from kol-labs-single
// src/pages/penrose/prototypes/common.js with exactly two behavioural changes:
//   (a) PALETTE / OPACITY come from ./palette.js (the adapter singletons the
//       host syncs from the editor theme) instead of ../settings.
//   (b) wrapLoop does NOT self-drive: labs ran its own rAF; here the editor's
//       transport owns time, so wrapLoop just registers the step fn with the
//       active collector (collectSteps) and returns a no-op cleanup. The
//       export name/signature is unchanged so prototype files stay verbatim.
// Everything else is byte-for-byte labs.

import { PALETTE, OPACITY } from './palette.js'

const _hexRGB = (h) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || '')
  if (!m) return [255, 255, 255]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Map a 0..1 field intensity to the palette ramp (bg→dim→accent→fg→warm) → [r,g,b].
// For pixel-field prototypes that write raw ImageData and bypass the stroke tint
// (CA / reaction-diffusion / fractals): replace their per-pixel colour with this so
// the field reads in the theme instead of hardcoded/garish hues.
// HARDENED 2026-08-09: (a) NaN intensity guarded — stops[NaN] was undefined and
// `a[0]` killed the editor ("can't access property 0"); any sim whose physics
// blows up now renders black instead of crashing. (b) The 5-stop parse is
// memoized by palette signature — sims call this per element per frame, and
// re-running five hex regexes each call was a real frame-budget leak.
let _rampStops = null
let _rampSig = ''
export function rampRGB(t) {
  const sig = `${PALETTE.bg}|${PALETTE.dim}|${PALETTE.accent}|${PALETTE.fg}|${PALETTE.warm}`
  if (sig !== _rampSig) {
    _rampSig = sig
    _rampStops = ['bg', 'dim', 'accent', 'fg', 'warm'].map((k) => _hexRGB(PALETTE[k] ?? PALETTE.fg))
  }
  const stops = _rampStops
  const tt = Number.isFinite(t) ? t : 0
  const x = Math.max(0, Math.min(1, tt)) * (stops.length - 1)
  const i = Math.floor(x)
  const f = x - i
  const a = stops[i]
  const b = stops[Math.min(stops.length - 1, i + 1)]
  return [Math.round(a[0] + (b[0] - a[0]) * f), Math.round(a[1] + (b[1] - a[1]) * f), Math.round(a[2] + (b[2] - a[2]) * f)]
}

// Discrete palette colour by role → [r,g,b]. For pixel-field protos that colour
// distinct species/states (map each to a role: accent/fg/warm/dim).
export function roleRGB(role) { return _hexRGB(PALETTE[role] ?? PALETTE.fg) }

// Palette colour with alpha — prototypes pull each element's colour from the live
// theme by ROLE (bg / fg / accent / dim / warm) so colours land where the author
// intends, instead of being luminance-guessed by the tint. The role's live
// opacity multiplier scales the authored alpha. Returns rgba().
export function pc(role, a = 1) {
  const hex = PALETTE[role] ?? PALETTE.fg
  const alpha = Math.min(1, a * (OPACITY[role] ?? 1))
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex // already rgba (e.g. grid) — pass through
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function makeSampler(sdf, w, h) {
  return (x, y) => {
    const ix = Math.max(0, Math.min(w - 1, Math.round(x)))
    const iy = Math.max(0, Math.min(h - 1, Math.round(y)))
    return sdf[iy * w + ix]
  }
}

export function makeSDF(data, w, h) {
  return { data, w, h, sample: makeSampler(data, w, h) }
}

// Sample a random point inside the mask (sdf < 0). Rejection.
export function sampleInside(sdf, rng, tries = 128) {
  for (let i = 0; i < tries; i++) {
    const x = rng() * sdf.w
    const y = rng() * sdf.h
    if (sdf.sample(x, y) < 0) return [x, y]
  }
  return [sdf.w / 2, sdf.h / 2]
}

// Central-difference gradient of SDF at (x,y). Useful for pushing points inward.
export function sdfGrad(sdf, x, y, h = 1.5) {
  const dx = sdf.sample(x + h, y) - sdf.sample(x - h, y)
  const dy = sdf.sample(x, y + h) - sdf.sample(x, y - h)
  return [dx / (2 * h), dy / (2 * h)]
}

// Returns a normalized direction pointing toward the interior from (x,y).
export function inwardDir(sdf, x, y) {
  const [gx, gy] = sdfGrad(sdf, x, y)
  const m = Math.hypot(gx, gy) || 1
  return [-gx / m, -gy / m]
}

export function clear(ctx, W, H, bg) {
  // No bg → transparent: the engine paints no background; the host paints the
  // layer's bg colour beneath the blit. An explicit colour is kept for the
  // attractor trail-fade effects that wash a translucent overlay.
  if (bg === undefined) { ctx.clearRect(0, 0, W, H); return }
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
}

// Faint SDF=0 outline, useful so the shape is visible even when empty.
// PERF (2026-08-09): the sign-change probe scanned the full SDF grid EVERY
// frame (~250k samples at 2000px) and drew each dot as its own beginPath/
// fill — and every proto calls this per frame. The SDF is immutable per
// instance, so the point list is memoized per sdf.data, and the dots batch
// into ONE path + ONE fill.
const _outlinePts = new WeakMap()
export function strokeOutline(
  ctx,
  sdf,
  W,
  H,
  color = 'rgba(240, 230, 210, 0.35)',
  size = 1.2,
) {
  let raw = _outlinePts.get(sdf.data)
  if (!raw) {
    raw = []
    // Sparse sign-change probe, every 4 pixels, adds ~enough dots for an outline
    const stride = 4
    for (let y = 0; y < sdf.h - 1; y += stride) {
      for (let x = 0; x < sdf.w - 1; x += stride) {
        const a = sdf.data[y * sdf.w + x]
        const b = sdf.data[y * sdf.w + (x + stride)]
        const c = sdf.data[(y + stride) * sdf.w + x]
        if ((a < 0) !== (b < 0)) raw.push([x + (stride * a) / (a - b), y])
        if ((a < 0) !== (c < 0)) raw.push([x, y + (stride * a) / (a - c)])
      }
    }
    _outlinePts.set(sdf.data, raw)
  }
  ctx.fillStyle = color
  const sx = W / sdf.w, sy = H / sdf.h
  ctx.beginPath()
  for (let i = 0; i < raw.length; i++) {
    const px = raw[i][0] * sx, py = raw[i][1] * sy
    ctx.moveTo(px + size, py)
    ctx.arc(px, py, size, 0, Math.PI * 2)
  }
  ctx.fill()
}

// ── pointer forces — the shared interaction verbs (2026-08-09) ───────────
// Every proto gets a `pointer()` accessor from the host (null when off-layer,
// else {x,y} in SIM/sdf space). These are the two standard applications so
// per-proto wiring stays one call. Scale both by the proto's interaction knob.

// REPEL — push point-state away inside a reach ring; the sim's own dynamics
// (relaxation, springs, flow) restore. `pts` is any array whose items carry
// the coordinate fields named by xKey/yKey; `keep(nx, ny, item)` gates the
// write (SDF containment etc.) — omit for unguarded.
export function repelPoints(pts, ptr, { reach, strength, xKey = 'x', yKey = 'y', keep } = {}) {
  if (!ptr || !reach || !strength) return
  const r2 = reach * reach
  for (const c of pts) {
    const dx = c[xKey] - ptr.x
    const dy = c[yKey] - ptr.y
    const d2 = dx * dx + dy * dy
    if (d2 >= r2 || d2 < 1e-6) continue
    const d = Math.sqrt(d2)
    const f = (1 - d / reach) * strength
    const nx = c[xKey] + (dx / d) * f
    const ny = c[yKey] + (dy / d) * f
    if (!keep || keep(nx, ny, c)) { c[xKey] = nx; c[yKey] = ny }
  }
}

// STAMP — write a radial falloff into a grid field at the pointer (inject
// chemistry, heat, sand, disturbance). `set(i, w)` receives the cell index
// and the 0..1 falloff weight so the proto owns the write semantics.
export function stampGrid(gw, gh, ptr, radius, set) {
  if (!ptr || !radius) return
  const x0 = Math.max(0, Math.floor(ptr.x - radius))
  const x1 = Math.min(gw - 1, Math.ceil(ptr.x + radius))
  const y0 = Math.max(0, Math.floor(ptr.y - radius))
  const y1 = Math.min(gh - 1, Math.ceil(ptr.y + radius))
  const r2 = radius * radius
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - ptr.x
      const dy = y - ptr.y
      const d2 = dx * dx + dy * dy
      if (d2 > r2) continue
      set(y * gw + x, 1 - Math.sqrt(d2) / radius)
    }
  }
}

// Active clock for the prototypes. The host sets a per-state clock around each
// proto.init (setLoopClock) — protos read it via their `clock` init arg; kept
// module-level for labs API parity (labs wrapLoop pause-gated on it; here the
// host gates stepping by transport-u instead).
const FALLBACK_CLOCK = { nowSeconds: () => 0, now: () => 0, isPaused: () => false }
let _loopClock = FALLBACK_CLOCK
export function setLoopClock(c) { _loopClock = c || FALLBACK_CLOCK }
export function getLoopClock() { return _loopClock }

// ── behavioural change (b): collector instead of rAF ─────────────────────
// A proto's init() calls wrapLoop(run) expecting a self-driving loop; here the
// host wraps init in collectSteps() and drives the collected step fns itself
// (one call per transport tick). Outside a collector, wrapLoop is a no-op —
// nothing self-drives in the editor.
let _collector = null

// Run `fn` (a proto.init call) with a live collector; returns the step fns
// every wrapLoop() inside registered. Nested/previous collectors restore.
export function collectSteps(fn) {
  const steps = []
  const prev = _collector
  _collector = steps
  try { fn() } finally { _collector = prev }
  return steps
}

// Labs signature preserved (run, opts) so prototype files port verbatim.
// `opts.ignorePause` is meaningless here — pause means the host never calls
// the step, which freezes the canvas exactly like the labs pause-gate did.
export function wrapLoop(run, opts = {}) { // eslint-disable-line no-unused-vars
  if (_collector) _collector.push(run)
  return () => {}
}
