import { CAMERA_SCHEMA } from './camera.js'
import { fieldPass, col } from './fieldGL.js'

// Interference — overlapping circular waves from several point sources arranged
// on a ring; flow pulses them. Seamless: phase is periodic in u.
const FRAG = /* glsl */`
uniform vec3 uA, uB, uC;
uniform float uS, uN, uSpan;
void main() {
  vec2 q = fieldXY();
  float acc = 0.0;
  for (int k = 0; k < 16; k++) {
    if (float(k) >= uN) break;
    float a = (float(k) / uN) * 6.283185307179586;
    acc += sin(length(q - vec2(cos(a), sin(a)) * uSpan) * uS - uCam.w);
  }
  o = vec4(mix3(0.5 + 0.5 * (acc / uN), uA, uB, uC), 1.0);
}
`

export default {
  id: 'interference',
  label: 'Interference',
  group: 'field',
  kind: '2d',
  duration: 8,
  camera: CAMERA_SCHEMA,
  params: [
    { key: 'colA', label: 'Color A', type: 'color', role: 'bg', default: '#06060a' },
    { key: 'colB', label: 'Color B', type: 'color', role: 'fg', default: '#2a8f8f' },
    { key: 'colC', label: 'Color C', type: 'color', role: 'accent', default: '#f4f1ea' },
    { key: 'sources', label: 'Sources', type: 'range', min: 2, max: 6, step: 1, default: 3, noRandom: true },
    { key: 'freq', label: 'Frequency', type: 'range', min: 1, max: 16, step: 0.5, default: 8 },
  ],
  draw(ctx, u, w, h, p) {
    fieldPass(ctx, u, w, h, p, FRAG, { uA: col(p.colA), uB: col(p.colB), uC: col(p.colC), uS: p.freq * 0.03, uN: Math.round(p.sources), uSpan: Math.min(w, h) * 0.3 })
  },
}
