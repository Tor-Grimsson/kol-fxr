import { CAMERA_SCHEMA } from './camera.js'
import { fieldPass, col } from './fieldGL.js'

// Moiré — two concentric ring sets at different frequencies interfere; flow
// drifts both, rolling the interference bands. Seamless: phase is periodic in u.
const FRAG = /* glsl */`
uniform vec3 uA, uB, uC;
uniform float uS1, uS2;
void main() {
  float d = length(fieldXY());
  o = vec4(mix3(0.5 + 0.5 * sin(d * uS1 + uCam.w) * sin(d * uS2 - uCam.w), uA, uB, uC), 1.0);
}
`

export default {
  id: 'moire',
  label: 'Moiré',
  group: 'field',
  kind: '2d',
  duration: 8,
  camera: CAMERA_SCHEMA,
  params: [
    { key: 'colA', label: 'Color A', type: 'color', role: 'bg', default: '#06060a' },
    { key: 'colB', label: 'Color B', type: 'color', role: 'fg', default: '#3a6ea5' },
    { key: 'colC', label: 'Color C', type: 'color', role: 'accent', default: '#f4f1ea' },
    { key: 'freq1', label: 'Frequency 1', type: 'range', min: 1, max: 14, step: 0.5, default: 6 },
    { key: 'freq2', label: 'Frequency 2', type: 'range', min: 1, max: 14, step: 0.5, default: 7 },
  ],
  draw(ctx, u, w, h, p) {
    fieldPass(ctx, u, w, h, p, FRAG, { uA: col(p.colA), uB: col(p.colB), uC: col(p.colC), uS1: p.freq1 * 0.02, uS2: p.freq2 * 0.02 })
  },
}
