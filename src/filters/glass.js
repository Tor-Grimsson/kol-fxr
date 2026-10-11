/**
 * Glass — displacement-map filter (ported from kol-labs-single pages/glass).
 * A procedural vector field offsets each output pixel's sample point into the
 * source image, fracturing/refracting it like a sheet of patterned glass.
 * Pure canvas2d, no deps.
 *
 * Motion is woven from the transport's u∈[0,1] with integer cycles so
 * frame(0) === frame(1) exactly:
 *   spin  — whole 360° turns of the field per loop (rotation is 360-periodic
 *           for every pattern ⇒ seamless).
 *   drift — the sheet pans on a circular orbit that closes once per loop
 *           (the labs' linear panSpeedX/Y scroll was never seamless).
 *   phase — the pattern's internal time swings ±phase·π on a sine, so every
 *           field closes regardless of its own t-periodicity (the labs' 0.7×
 *           second-wave and fbm scroll made a shared linear period impossible).
 *   pulse — shift amplitude breathes on one sine cycle (labs sin(t·3) → sin(TAU·u)).
 */

import { glFx, stillUnless } from './fxCore.js'
import { HASH_GLSL } from '../loops/lib/glPass.js'

const TAU = Math.PI * 2

/* Each pattern is a displacement field(nx, ny, scale, t) -> [fx, fy] in roughly [-1,1] (nx,ny ∈ [0,1];
 * t is the woven animation clock — most are static at t=0). They live in GLSL now (GLASS below, plan
 * 27 § 3) in this order; `dispersion` (labs preset chroma) makes a pattern refract per-channel out of
 * the box: it stands in for Chroma while the knob sits at 0. */
const PATTERNS = [
  { id: 'panes', label: 'Panes' },
  /* labs "Tall Slivers" preset (panes at scale 3, shift 22:80) baked as a field: ~2× the pane count,
     offsets leaning vertical */
  { id: 'slivers', label: 'Slivers' },
  { id: 'bands', label: 'Bands' },
  { id: 'glass', label: 'Glass' },
  /* labs "Prismatic" — the frosted fbm gradient dispersing R/G/B (preset chroma 65) */
  { id: 'prismatic', label: 'Prismatic', dispersion: 65 },
  { id: 'ripple', label: 'Ripple' },
  /* labs "Prism Ripple" — concentric ripples dispersing R/G/B (preset chroma 85) */
  { id: 'prism-ripple', label: 'Prism Ripple', dispersion: 85 },
  { id: 'waves', label: 'Waves' },
  { id: 'diagonal', label: 'Diagonal' },
  { id: 'shards', label: 'Shards' },
  { id: 'grid', label: 'Grid' },
  { id: 'lens', label: 'Lens' },
  { id: 'swirl', label: 'Swirl' },
]
const PATTERN_OPTIONS = PATTERNS.map((p) => ({ value: p.id, label: p.label }))

/* Full-look recipes (labs glass/registry.js PRESETS) keyed by the pattern the
 * editor's Preset dropdown picks — a pick applies the whole labs recipe via
 * presetPatchFor, not just the pattern key. Baked-dispersion patterns
 * (slivers/prismatic/prism-ripple) carry their source preset's numbers with
 * chroma left to the bake (dispersion: field above); slivers' density is also
 * baked, so its scale stays at the field's tuning rather than labs' scale 3.
 * Labs 'Kaleidoscope' (shards + mirror fold) has no pattern of its own here —
 * one recipe per pattern — so it isn't representable and is dropped. */
const PRESET_PATCHES = {
  panes:          { xShift: 60, yShift: 0, scale: 1.5, angle: 0, chroma: 0, mix: 100, edge: 'clamp', mirror: false },
  slivers:        { xShift: 22, yShift: 80, scale: 1.5, angle: 0, chroma: 0, mix: 100, edge: 'clamp', mirror: false },
  bands:          { xShift: 80, yShift: 24, scale: 1.2, angle: 0, chroma: 0, mix: 100, edge: 'clamp', mirror: false },
  glass:          { xShift: 40, yShift: 40, scale: 1.2, angle: 0, chroma: 0, mix: 100, edge: 'mirror', mirror: false },
  prismatic:      { xShift: 50, yShift: 50, scale: 1.6, angle: 0, chroma: 0, mix: 100, edge: 'mirror', mirror: false },
  ripple:         { xShift: 42, yShift: 42, scale: 1, angle: 0, chroma: 25, mix: 100, edge: 'mirror', mirror: false },
  'prism-ripple': { xShift: 55, yShift: 55, scale: 1.4, angle: 0, chroma: 0, mix: 100, edge: 'mirror', mirror: false },
  waves:          { xShift: 30, yShift: 55, scale: 1, angle: 0, chroma: 20, mix: 100, edge: 'mirror', mirror: false },
  diagonal:       { xShift: 70, yShift: 10, scale: 1.5, angle: 0, chroma: 0, mix: 100, edge: 'clamp', mirror: false },
  shards:         { xShift: 60, yShift: 60, scale: 1.3, angle: 0, chroma: 0, mix: 100, edge: 'clamp', mirror: false },
  grid:           { xShift: 50, yShift: 50, scale: 1.6, angle: 0, chroma: 0, mix: 100, edge: 'clamp', mirror: false },
  lens:           { xShift: 85, yShift: 85, scale: 1, angle: 0, chroma: 45, mix: 100, edge: 'clamp', mirror: false },
  swirl:          { xShift: 60, yShift: 60, scale: 1.2, angle: 0, chroma: 30, mix: 100, edge: 'mirror', mirror: false },
}

/* The displacement pass over the fitted source pixels, as a fragment shader (plan 27 § 3 — the
 * per-pixel JS ran a moving Glass at 30 fps). With chroma > 0 the R/G/B channels sample slightly
 * different offsets (dispersion along the displacement + a radial lens fringe) → chromatic
 * aberration. Alpha is carried from the sampled pixel (labs forced 255; `fit: contain` letterbox
 * would go black otherwise). jsHash is fxCore's intHash2 bit for bit, so every pane, band and
 * shard keeps the offset it had. */
const GLASS = /* glsl */`${HASH_GLSL}
uniform float uPat, uScale, uAx, uAy, uMix, uCa, uSa, uChroma, uEdge, uMirror, uPanX, uPanY, uTime;
float band(int i) { return jsHash(i, 7) * 2.0 - 1.0; }   /* per-band signed offset, stable per index */
float fade(float t) { return t * t * (3.0 - 2.0 * t); }
float vnoise(vec2 q) {
  vec2 i = floor(q), f = q - i;
  int xi = int(i.x), yi = int(i.y);
  float a = jsHash(xi, yi), b = jsHash(xi + 1, yi), c = jsHash(xi, yi + 1), d = jsHash(xi + 1, yi + 1);
  float u = fade(f.x), v = fade(f.y);
  return (a * (1.0 - u) + b * u) * (1.0 - v) + (c * (1.0 - u) + d * u) * v;
}
float fbm(vec2 q) { float s = 0.0, amp = 0.5, f = 1.0; for (int i = 0; i < 4; i++) { s += amp * vnoise(q * f); f *= 2.0; amp *= 0.5; } return s; }
int count(float base, float k, int lo) { return max(lo, int(floor(base + uScale * k + 0.5))); }
vec2 field(vec2 n) {
  int pat = int(uPat); float s = uScale, t = uTime;
  if (pat <= 1) {   /* panes · slivers */
    int N = pat == 0 ? count(3.0, 6.0, 2) : count(6.0, 12.0, 4);
    int b = int(floor(n.x * float(N)));
    float dr = t != 0.0 ? 0.25 * sin(t + float(b)) : 0.0;
    return vec2(band(b * 2) * (pat == 0 ? 0.35 : 0.2), band(b * 2 + 1) + dr);
  }
  if (pat == 2) {   /* bands */
    int b = int(floor(n.y * float(count(3.0, 6.0, 2))));
    float dr = t != 0.0 ? 0.25 * sin(t + float(b)) : 0.0;
    return vec2(band(b * 2) + dr, band(b * 2 + 1) * 0.35);
  }
  if (pat == 3 || pat == 4) {   /* glass · prismatic */
    float f = 2.0 + s * 3.0, e = 0.012, ph = t * 0.15;
    float base = fbm(vec2(n.x * f + ph, n.y * f));
    float gx = fbm(vec2((n.x + e) * f + ph, n.y * f)) - base;
    float gy = fbm(vec2(n.x * f + ph, (n.y + e) * f)) - base;
    return vec2((gx / e) * 0.12, (gy / e) * 0.12);
  }
  vec2 c = n - 0.5;
  if (pat == 5 || pat == 6) {   /* ripple · prism ripple */
    float r = length(c) + 1e-4;
    return (c / r) * sin(r * (8.0 + s * 22.0) - t * 2.0);
  }
  if (pat == 7) { float f = 4.0 + s * 12.0; return vec2(sin(n.y * f + t), sin(n.x * f + t * 0.7)); }
  if (pat == 8) { float o = band(int(floor((n.x + n.y) * float(count(4.0, 8.0, 2))))); return vec2(o * 0.7); }
  if (pat == 9) {   /* shards */
    int N = count(2.0, 5.0, 2);
    int cx = int(floor(n.x * float(N))), cy = int(floor(n.y * float(N)));
    return vec2(band(cx * 31 + cy), band(cy * 31 + cx));
  }
  if (pat == 10) { int N = count(3.0, 6.0, 2); return vec2(band(int(floor(n.y * float(N)))), band(int(floor(n.x * float(N))))); }
  if (pat == 11) { float k = (0.5 - length(c)) * (1.0 + s); return c * k * 2.0; }
  float a = (0.5 - length(c)) * (2.0 + s * 4.0) + t * 0.5;   /* swirl */
  return vec2(-c.y, c.x) * a * 2.0;
}
/* edge handling for an out-of-bounds sample coordinate — clamp · wrap · mirror */
int edgeAt(float v, int n) {
  float fn = float(n);
  if (v >= 0.0 && v < fn) return int(v);
  if (uEdge == 1.0) return min(n - 1, int(mod(v, fn)));
  if (uEdge == 2.0) { float p = fn - 1.0, m = mod(abs(v), 2.0 * p); return int(m <= p ? m : 2.0 * p - m); }
  return v < 0.0 ? 0 : n - 1;
}
vec4 fx(ivec2 P) {
  float w = uRes.x, h = uRes.y, x = float(P.x), y = float(P.y);
  int W = int(w), H = int(h);
  /* kaleidoscope fold: mirror the right half onto the left before sampling */
  float fb = uMirror > 0.5 && x >= w * 0.5 ? w - 1.0 - x : x;
  /* rotate sample-space into the field, then the result back, so the whole pattern turns with Angle;
     the pan slides the sheet */
  float cx = fb / w - 0.5 - uPanX, cy = y / h - 0.5 - uPanY;
  vec2 v = field(vec2(uCa * cx + uSa * cy + 0.5, -uSa * cx + uCa * cy + 0.5));
  float dx = (uCa * v.x - uSa * v.y) * uAx, dy = (uSa * v.x + uCa * v.y) * uAy;
  vec4 c;
  if (uChroma > 0.0) {
    float cAmt = uChroma / 100.0, cRad = uChroma / 100.0 * w * 0.02;
    float rx = (x - w * 0.5) / (w * 0.5), ry = (y - h * 0.5) / (h * 0.5);
    vec4 R = srcAt(ivec2(edgeAt(fb + dx * (1.0 + cAmt) + rx * cRad, W), edgeAt(y + dy * (1.0 + cAmt) + ry * cRad, H)));
    vec4 G = srcAt(ivec2(edgeAt(fb + dx, W), edgeAt(y + dy, H)));
    vec4 B = srcAt(ivec2(edgeAt(fb + dx * (1.0 - cAmt) - rx * cRad, W), edgeAt(y + dy * (1.0 - cAmt) - ry * cRad, H)));
    c = vec4(R.r, G.g, B.b, G.a);
  } else {
    c = srcAt(ivec2(edgeAt(fb + dx, W), edgeAt(y + dy, H)));
  }
  return uMix >= 1.0 ? c : srcAt(P) * (1.0 - uMix) + c * uMix;
}
`
const EDGES = { clamp: 0, wrap: 1, mirror: 2 }

export default {
  id: 'glass',
  label: 'Glass',
  stillKey: stillUnless('spin', 'drift', 'phase', 'pulse'),   /* still until a Motion param is set (plan 27 § 1) */
  presetPatches: PRESET_PATCHES,
  params: [
    { key: 'pattern', label: 'Pattern', type: 'select', options: PATTERN_OPTIONS, default: 'panes', section: 'Pattern' },
    { key: 'xShift', label: 'X shift', type: 'range', min: -100, max: 100, step: 1, default: 60, section: 'Distort' },
    { key: 'yShift', label: 'Y shift', type: 'range', min: -100, max: 100, step: 1, default: 0, section: 'Distort' },
    { key: 'scale', label: 'Scale', type: 'range', min: 0.2, max: 4, step: 0.05, default: 1.5, section: 'Distort' },
    { key: 'angle', label: 'Angle', type: 'range', min: 0, max: 360, step: 1, default: 0, section: 'Distort' },
    { key: 'mix', label: 'Mix', type: 'range', min: 0, max: 100, step: 1, default: 100, section: 'Blend' },
    { key: 'chroma', label: 'Chroma', type: 'range', min: 0, max: 100, step: 1, default: 0, section: 'Blend' },
    { key: 'edge', label: 'Edge', type: 'select', default: 'clamp', section: 'Blend',
      options: [
        { value: 'clamp', label: 'Clamp' },
        { value: 'wrap', label: 'Wrap' },
        { value: 'mirror', label: 'Mirror' },
      ] },
    { key: 'mirror', label: 'Mirror fold', type: 'toggle', default: false, section: 'Blend' },
    { key: 'spin', label: 'Spin · turns', type: 'range', min: -8, max: 8, rMin: -2, rMax: 2, step: 1, default: 0, tab: 'anim', section: 'Motion' },
    { key: 'drift', label: 'Drift', type: 'range', min: 0, max: 0.5, step: 0.01, default: 0, tab: 'anim', section: 'Motion' },
    /* time-less pattern fields (no t arg) ignore phase */
    { key: 'phase', label: 'Phase', type: 'range', min: 0, max: 3, step: 0.05, default: 0, when: (l) => !['diagonal', 'shards', 'grid', 'lens'].includes(l.pattern), tab: 'anim', section: 'Motion' },
    { key: 'pulse', label: 'Pulse', type: 'range', min: 0, max: 1, step: 0.05, default: 0, tab: 'anim', section: 'Motion' },
  ],
  apply(ctx, src, w, h, p, u) {
    const osc = Math.sin(TAU * u)
    const amp = 1 + (p.pulse ?? 0) * 0.4 * osc
    const pat = Math.max(0, PATTERNS.findIndex((x) => x.id === p.pattern))
    /* dispersion-native patterns refract at their baked strength while Chroma sits at 0 */
    const chroma = (p.chroma ?? 0) > 0 ? p.chroma : (PATTERNS[pat].dispersion ?? 0)
    const rad = (((p.angle ?? 0) + 360 * u * Math.round(p.spin ?? 0)) * Math.PI) / 180
    glFx(ctx, src, w, h, GLASS, {
      uPat: pat, uScale: p.scale ?? 1.5, uMix: (p.mix ?? 100) / 100, uChroma: chroma,
      uAx: (((p.xShift ?? 0) * amp) / 100) * src.width * 0.25,   /* full shift ≈ quarter-frame */
      uAy: (((p.yShift ?? 0) * amp) / 100) * src.height * 0.25,
      uCa: Math.cos(rad), uSa: Math.sin(rad), uEdge: EDGES[p.edge] ?? 0, uMirror: p.mirror ? 1 : 0,
      uPanX: (p.drift ?? 0) * Math.cos(TAU * u), uPanY: (p.drift ?? 0) * Math.sin(TAU * u),
      uTime: (p.phase ?? 0) * Math.PI * osc,
    }, 100)
  },
}
