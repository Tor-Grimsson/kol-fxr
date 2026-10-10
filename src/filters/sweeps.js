/**
 * Sweep fields — the labs motion rig of kol-labs-single radar/effects/sweeps.js
 * (the Dither/ASCII pages' Motion tab), reshaped for the filter contract. A
 * sweep is a time-driven scalar field f(nx, ny, t) → 0..1 that gives a static
 * image "life": a moving wavefront picks a SHAPE (how it travels) and a TARGET
 * (what it modulates — brightness fed into the cell algorithms, cell geometry,
 * or a reveal mask that wipes the effect over the raw photo).
 *
 * Like labs, sweeps STACK: each filter stage carries an ARRAY of sweeps in
 * its params (`params.sweeps = [{ shape, target, enabled, amount, speed,
 * width, angle }]`) and every enabled sweep compounds at each cell
 * (evalSweeps — the labs combine rules: brightness adds, geometry composes,
 * reveal max-blends). The one-click presets (Scan / Pulse / Wave / Radar /
 * Reveal) port the labs SWEEP_PRESETS values. Filters opt in by declaring
 * `sweeps: true` on their def; the Effects panel renders the stack UI.
 *
 * Time contract: t = the transport's u∈[0,1], woven seamlessly — Speed is
 * whole wavefront cycles per loop (integer), so frame(0) === frame(1) exactly:
 *   linear/radial/angular  band position wrap01(u·cycles) — periodic ✓
 *   wave                   phase shifts by cycles·2π per loop — periodic ✓
 *   noise                  labs scrolled the lattice linearly (never seamless);
 *                          here the sample window ORBITS instead (cos/sin of
 *                          the phase, the glass.js drift trick) — periodic ✓
 * The labs presets' cycles/sec speeds map to integer cycles per loop via
 * round(speed·4) (min 1) — the closest loop-safe reading of their pace.
 */
import { sinHash2 as hash2 } from './fxCore.js'

export const SWEEP_SHAPE_OPTIONS = [
  { value: 'linear', label: 'Linear bar' },
  { value: 'radial', label: 'Radial pulse' },
  { value: 'wave', label: 'Traveling wave' },
  { value: 'angular', label: 'Radar sweep' },
  { value: 'noise', label: 'Noise drift' },
]

export const SWEEP_TARGET_OPTIONS = [
  { value: 'brightness', label: 'Brightness' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'reveal', label: 'Reveal' },
]

/* Angle only steers shapes with a travel direction (labs SweepControls). */
export const ANGLED_SHAPES = new Set(['linear', 'wave', 'angular'])

const SWEEP_KEYS = ['shape', 'target', 'enabled', 'amount', 'speed', 'width', 'angle', 'cx', 'cy', 'travel']

/* TRAVEL (plan 26 § 5; the user: "it seems to origin from top left or left, and only one direction") —
 * forward · reverse · ping-pong, all whole cycles per loop, so every one closes at u = 1. */
export const SWEEP_TRAVEL_OPTIONS = [
  { value: 'forward', label: 'Forward' },
  { value: 'reverse', label: 'Reverse' },
  { value: 'pingpong', label: 'Ping-pong' },
]

/* A fresh sweep with sane defaults (brightness band drifting left→right) —
 * labs makeSweep. `cx/cy` is the ORIGIN (labs' centerX/centerY, which the port
 * had pinned at 0.5, 0.5 — plan 26 § 5): where a radial / radar sweep centres
 * and where a linear band starts. `speed` is integer cycles per loop. */
export function makeSweep(shape = 'linear', overrides = {}) {
  const sw = {
    shape,
    target: 'brightness',
    enabled: true,
    amount: 0.6,   // strength applied to the chosen target (brightness/geometry)
    speed: 1,      // wavefront cycles per LOOP (integer); negative reverses
    width: 0.35,   // band thickness (0..1) / wavelength for the wave shape
    angle: 0,      // travel direction in degrees (linear/wave/angular)
    cx: 0.5,       // origin, normalized frame coords (0,0 = top-left)
    cy: 0.5,
    travel: 'forward',
  }
  for (const k of SWEEP_KEYS) if (overrides[k] !== undefined) sw[k] = overrides[k]
  return sw
}

/* One-click motion presets — labs SWEEP_PRESETS (sweeps.js:48-54) with the
 * cycles/sec speeds folded to integer cycles per loop (see header). */
export const SWEEP_PRESETS = [
  { name: 'Scan', shape: 'linear', target: 'brightness', amount: 0.75, speed: 2, width: 0.3, angle: 0 },
  { name: 'Pulse', shape: 'radial', target: 'brightness', amount: 0.85, speed: 1, width: 0.45 },
  { name: 'Wave', shape: 'wave', target: 'brightness', amount: 0.6, speed: 2, width: 0.25, angle: 0 },
  { name: 'Radar', shape: 'angular', target: 'brightness', amount: 0.8, speed: 1, width: 0.35 },
  { name: 'Reveal', shape: 'linear', target: 'reveal', speed: 1, width: 0.4, angle: 0 },
]

const TAU = Math.PI * 2
const wrap01 = (x) => x - Math.floor(x)

/* Raised falloff: 1 at the band centre, smoothly → 0 at half-width `w`. */
function band(dist, w) {
  if (w <= 0) return 0
  const t = Math.min(1, dist / w)
  return 1 - t * t * (3 - 2 * t)
}

/* Value noise (hash-lattice, smooth-interpolated) → 0..1 — labs original. */
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi), b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/* Neutral packet for the no-sweep path — engines read it like evalSweeps()'s. */
export const NO_SWEEP = Object.freeze({ bright: 0, scaleMul: 1, offX: 0, offY: 0, rot: 0, hasReveal: false, reveal: 0 })

/* Precompute one sweep's frame state from its object + transport u.
 * Everything per-frame-constant (angle trig, band position, phase) happens
 * here so evalSweeps() stays allocation-free in the per-cell hot loop. */
function sweepStateOne(sw, u) {
  const cycles = Math.round(sw.speed ?? 1)
  const a = ((sw.angle ?? 0) * Math.PI) / 180
  const width = sw.width ?? 0.35
  /* the band's place on its cycle: forward wraps 0→1, reverse 1→0, ping-pong 0→1→0 — each returns
     to its start at u = 1, so the loop stays seamless */
  const travel = sw.travel ?? 'forward'
  const raw = wrap01(u * cycles)
  const pos = travel === 'reverse' ? wrap01(-u * cycles) : travel === 'pingpong' ? 1 - Math.abs(1 - 2 * raw) : raw
  return {
    cx: sw.cx ?? 0.5,
    cy: sw.cy ?? 0.5,
    shape: sw.shape ?? 'linear',
    target: sw.target ?? 'brightness',
    amount: sw.amount ?? 0.6,
    cos: Math.cos(a),
    sin: Math.sin(a),
    pos, // band centre for linear/radial/angular
    ph: travel === 'reverse' ? -TAU * u * cycles : travel === 'pingpong' ? TAU * pos : TAU * u * cycles, // phase for wave / noise-orbit
    halfW: Math.max(0.01, width * 0.5),
    freq: 1 + (1 - width) * 8, // wave: narrower → more stripes (labs)
    nScale: 2 + (1 - width) * 8, // noise lattice scale (labs)
  }
}

/* Legacy flat params (the pre-chain one-sweep-per-filter rig: animate /
 * sweepShape / sweepTarget / …) → a one-element sweep list. Kept so any
 * un-normalized layer that still carries flat keys keeps animating. */
function legacySweeps(p) {
  if (!p.animate) return []
  return [makeSweep(p.sweepShape ?? 'linear', {
    target: p.sweepTarget ?? 'brightness',
    amount: p.sweepAmount ?? 0.6,
    speed: p.sweepSpeed ?? 1,
    width: p.sweepWidth ?? 0.35,
    angle: p.sweepAngle ?? 0,
  })]
}

/**
 * Precompute the frame's sweep states from a filter's params + transport u.
 * Reads the stacked `params.sweeps` array (falling back to the legacy flat
 * keys); returns null when nothing is enabled (engines take the NO_SWEEP
 * fast path).
 */
export function sweepStates(p, u) {
  const list = Array.isArray(p.sweeps) ? p.sweeps : legacySweeps(p)
  let states = null
  for (const sw of list) {
    if (!sw || sw.enabled === false) continue
    ;(states ??= []).push(sweepStateOne(sw, u))
  }
  return states
}

/* Reused scratch — evaluated per cell, consumed synchronously by the engine
 * before the next call (labs evalSweeps contract; no hot-loop allocation). */
const _acc = { bright: 0, scaleMul: 1, offX: 0, offY: 0, rot: 0, hasReveal: false, reveal: 0 }

/**
 * Combine every sweep's modulation at one cell into a single packet (the
 * labs evalSweeps compound rules):
 *   brightness → additive luma delta (± amount at each wavefront)
 *   geometry   → scale/displace/rotate compose along each travel direction
 *   reveal     → max-blended mask; the engine gates the cell (raw photo
 *                underlay shows) when reveal < 0.5
 */
export function evalSweeps(states, nx, ny) {
  _acc.bright = 0; _acc.scaleMul = 1; _acc.offX = 0; _acc.offY = 0
  _acc.rot = 0; _acc.hasReveal = false; _acc.reveal = 0
  for (let i = 0; i < states.length; i++) {
    const st = states[i]
    const s = sample(st, nx, ny)
    if (st.target === 'reveal') {
      _acc.hasReveal = true
      if (s > _acc.reveal) _acc.reveal = s
    } else if (st.target === 'geometry') {
      const k = s * st.amount
      _acc.scaleMul *= 1 + k
      _acc.offX += st.cos * k
      _acc.offY += st.sin * k
      _acc.rot += k
    } else {
      _acc.bright += s * st.amount
    }
  }
  return _acc
}

/* One sweep's wavefront value at a normalized cell (nx,ny ∈ 0..1) — the labs
 * sampleSweep() over the precomputed state, centred on the sweep's origin. */
function sample(st, nx, ny) {
  switch (st.shape) {
    case 'radial': {
      const dx = nx - st.cx, dy = ny - st.cy
      const u = wrap01(Math.sqrt(dx * dx + dy * dy) / 0.7071)
      const d = Math.abs(u - st.pos)
      return band(Math.min(d, 1 - d), st.halfW)
    }
    case 'wave': {
      const u = (nx - st.cx) * st.cos + (ny - st.cy) * st.sin
      return 0.5 + 0.5 * Math.sin(u * st.freq * TAU - st.ph)
    }
    case 'angular': {
      const ang = wrap01(Math.atan2(ny - st.cy, nx - st.cx) / TAU)
      const d = Math.abs(ang - st.pos)
      return band(Math.min(d, 1 - d), st.halfW)
    }
    case 'noise':
      // labs scrolled t·speed through the lattice; the orbit closes the loop
      return vnoise(nx * st.nScale + 0.75 * Math.cos(st.ph), ny * st.nScale + 0.75 * Math.sin(st.ph))
    case 'linear':
    default: {
      const u = wrap01(0.5 + (nx - st.cx) * st.cos + (ny - st.cy) * st.sin)
      const d = Math.abs(u - st.pos)
      return band(Math.min(d, 1 - d), st.halfW)
    }
  }
}

/* True when any of the frame's sweeps wipes the effect — engines draw the raw
 * photo underneath first so gated-off cells show it (labs hasRevealSweep). */
export const anyReveal = (states) => !!states && states.some((st) => st.target === 'reveal')
