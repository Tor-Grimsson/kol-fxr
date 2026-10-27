import { hexToRgb } from '../lib/util.js'
import { glPass, rgb01 } from '../lib/glPass.js'
import { fieldRes } from '../field/fieldGL.js'

// Moiré / interference engine — two (optionally three) overlapping grids
// (lines / concentric / radial), each with its own frequency, rotation and
// animated phase, combined by a superposition mode → interference fringes. The
// ml_phæno / bustave B&W op-art look, plus duotone. Canvas2D per-pixel.
//
// Ported from kol-labs-single optic/moire. The labs' grids array is flattened to
// g1*/g2*/g3* params (the inspector renders flat schemas); grid A is always on.
// Time is woven for the loop contract: each grid's labs drift (ph = t·speed)
// becomes ph = u · cycles with a whole number of cycles per loop, so
// frame(0) === frame(1) exactly. Per-pixel work is a fragment shader (glPass, plan 27 § 2) at the
// field family's buffer size.

export const GRID_OPTIONS = [
  { value: 'lines', label: 'Lines' },
  { value: 'concentric', label: 'Concentric' },
  { value: 'radial', label: 'Radial' },
]
export const COMBINE_OPTIONS = [
  { value: 'xor', label: 'Interfere (XOR)' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'add', label: 'Add' },
  { value: 'screen', label: 'Screen' },
]
export const MOIRE_PALETTES = [
  { value: 'bw', label: 'Black / White', cols: ['#000000', '#ffffff'] },
  { value: 'blood', label: 'Blood', cols: ['#0a0000', '#ff2d2d'] },
  { value: 'cyan', label: 'Cyan', cols: ['#001014', '#2ec4b6'] },
  { value: 'gold', label: 'Gold', cols: ['#0a0a00', '#ffd23f'] },
]

const TYPES = { lines: 0, concentric: 1, radial: 2 }
const MODES = { xor: 0, multiply: 1, add: 2, screen: 3 }

/* gridVal + combine, as GLSL — grid k is uG[k] = (type, freq, angle°, cycles) */
const FRAG = /* glsl */`
uniform vec4 uG[3];
uniform float uN, uMode, uEdge, uInvert;
uniform vec3 uC0, uC1;
const float TAU = 6.283185307179586;
float gridVal(vec4 g, vec2 n, float u) {
  vec2 c = n - 0.5;
  float ph = u * g.w;   /* whole cycles per loop (integer) ⇒ seamless */
  if (g.x == 1.0) return 0.5 + 0.5 * sin(length(c) * g.y * 28.0 + ph * TAU);
  if (g.x == 2.0) return 0.5 + 0.5 * sin(atan(c.y, c.x) * floor(g.y + 0.5) * 2.0 + ph * TAU);
  float a = g.z * 3.141592653589793 / 180.0;
  return 0.5 + 0.5 * sin((n.x * cos(a) + n.y * sin(a)) * g.y * 40.0 + ph * TAU);
}
float combine(float a, float b) {
  if (uMode == 1.0) return a * b;
  if (uMode == 2.0) return (a + b) * 0.5;
  if (uMode == 3.0) return 1.0 - (1.0 - a) * (1.0 - b);
  return abs(a - b);
}
uniform float uU;
void main() {
  vec2 n = pix() / uRes;
  float v = uN > 0.0 ? gridVal(uG[0], n, uU) : 0.5;
  for (int k = 1; k < 3; k++) { if (float(k) >= uN) break; v = combine(v, gridVal(uG[k], n, uU)); }
  float lo = uEdge, hi = 1.0 - uEdge;
  v = lo == hi ? (v < 0.5 ? 0.0 : 1.0) : clamp((v - lo) / (hi - lo), 0.0, 1.0);
  if (uInvert > 0.5) v = 1.0 - v;
  o = vec4(mix(uC0, uC1, v), 1.0);
}
`

export default {
  id: 'optic-moire',
  label: 'Moiré grids',
  group: 'optic',
  kind: '2d',
  duration: 8,
  params: [
    { key: 'colA', collapsed: true, section: 'Color', label: 'Color A', type: 'color', role: 'bg', default: '#000000' },
    { key: 'colB', section: 'Color', label: 'Color B', type: 'color', role: 'fg', default: '#ffffff' },
    { key: 'combine', label: 'Combine', type: 'select', options: COMBINE_OPTIONS, default: 'xor', when: (l) => (l.g2On ?? true) || !!l.g3On },
    { key: 'hardness', label: 'Hardness', type: 'range', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false },
    // Grid A (always on — the base grid)
    { key: 'g1Type', label: 'Grid A', type: 'select', options: GRID_OPTIONS, default: 'lines' },
    { key: 'g1Freq', label: 'A · freq', type: 'range', min: 1, max: 30, step: 0.5, default: 6 },
    { key: 'g1Angle', label: 'A · angle', type: 'range', min: 0, max: 180, step: 1, default: 0, when: (l) => (l.g1Type ?? 'lines') === 'lines' },
    { key: 'g1Cycles', label: 'A · drift', type: 'range', min: -8, max: 8, rMin: -4, rMax: 4, step: 1, default: 1, noRandom: true, tab: 'anim', section: 'Motion' },
    // Grid B
    { key: 'g2On', label: 'Grid B on', type: 'toggle', default: true },
    { key: 'g2Type', label: 'Grid B', type: 'select', options: GRID_OPTIONS, default: 'lines', when: (l) => l.g2On ?? true },
    { key: 'g2Freq', label: 'B · freq', type: 'range', min: 1, max: 30, step: 0.5, default: 6, when: (l) => l.g2On ?? true },
    { key: 'g2Angle', label: 'B · angle', type: 'range', min: 0, max: 180, step: 1, default: 8, when: (l) => (l.g2On ?? true) && (l.g2Type ?? 'lines') === 'lines' },
    { key: 'g2Cycles', label: 'B · drift', type: 'range', min: -8, max: 8, rMin: -4, rMax: 4, step: 1, default: -1, noRandom: true, tab: 'anim', section: 'Motion', when: (l) => l.g2On ?? true },
    // Grid C
    { key: 'g3On', label: 'Grid C on', type: 'toggle', default: false },
    { key: 'g3Type', label: 'Grid C', type: 'select', options: GRID_OPTIONS, default: 'concentric', when: (l) => !!l.g3On },
    { key: 'g3Freq', label: 'C · freq', type: 'range', min: 1, max: 30, step: 0.5, default: 4, when: (l) => !!l.g3On },
    { key: 'g3Angle', label: 'C · angle', type: 'range', min: 0, max: 180, step: 1, default: 0, when: (l) => !!l.g3On && l.g3Type === 'lines' },
    { key: 'g3Cycles', label: 'C · drift', type: 'range', min: -8, max: 8, rMin: -4, rMax: 4, step: 1, default: 1, noRandom: true, tab: 'anim', section: 'Motion', when: (l) => !!l.g3On },
  ],
  draw(ctx, u, w, h, p) {
    const grids = [
      { enabled: true, type: p.g1Type, freq: p.g1Freq, angle: p.g1Angle, cycles: Math.round(p.g1Cycles) },
      { enabled: !!p.g2On, type: p.g2Type, freq: p.g2Freq, angle: p.g2Angle, cycles: Math.round(p.g2Cycles) },
      { enabled: !!p.g3On, type: p.g3Type, freq: p.g3Freq, angle: p.g3Angle, cycles: Math.round(p.g3Cycles) },
    ]
    const active = grids.filter((g) => g.enabled)
    const G = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    active.forEach((g, k) => { G[k * 4] = TYPES[g.type] ?? 0; G[k * 4 + 1] = g.freq; G[k * 4 + 2] = g.angle; G[k * 4 + 3] = g.cycles })
    const [rw, rh] = fieldRes(w, h)
    glPass(ctx, w, h, rw, rh, FRAG, {
      uG: G, uN: active.length, uMode: MODES[p.combine] ?? 0, uU: u,
      uEdge: 0.5 - p.hardness * 0.49,   /* hardness → crisp threshold via smoothstep band */
      uInvert: p.invert ? 1 : 0, uC0: rgb01(hexToRgb(p.colA)), uC1: rgb01(hexToRgb(p.colB)),
    })
  },
}
