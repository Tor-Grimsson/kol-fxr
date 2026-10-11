import { CAMERA_SCHEMA } from './camera.js'
import { fieldPass, col } from './fieldGL.js'

// Checker field — an animated checkerboard from sign(sin·sin); flow slides it,
// softness controls the edge sharpness. Seamless: phase is periodic in u.
const FRAG = /* glsl */`
uniform vec3 uA, uB;
uniform float uS, uSoft;
void main() {
  vec2 q = fieldXY();
  float v = sin(q.x * uS + uCam.w) * sin(q.y * uS - uCam.w);
  o = vec4(mix2(0.5 + 0.5 * tanh(v / uSoft), uA, uB), 1.0);
}
`

export default {
  id: 'checker-field',
  label: 'Checker field',
  group: 'field',
  kind: '2d',
  duration: 8,
  camera: CAMERA_SCHEMA,
  params: [
    { key: 'colA', label: 'Color A', type: 'color', role: 'bg', default: '#0b0b0e' },
    { key: 'colB', label: 'Color B', type: 'color', role: 'fg', default: '#e8e4dc' },
    { key: 'freq', label: 'Frequency', type: 'range', min: 1, max: 16, step: 0.5, default: 6 },
    { key: 'soft', label: 'Softness', type: 'range', min: 0.02, max: 1, step: 0.02, default: 0.3 },
  ],
  draw(ctx, u, w, h, p) {
    fieldPass(ctx, u, w, h, p, FRAG, { uA: col(p.colA), uB: col(p.colB), uS: p.freq * 0.04, uSoft: Math.max(0.02, p.soft) })
  },
}
