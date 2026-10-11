import { CAMERA_SCHEMA } from './camera.js'
import { fieldPass, col } from './fieldGL.js'

// Rings field — concentric colour bands radiating from the centre, flowing in/out
// (a filled cousin of Halftone). Seamless: phase is periodic in u.
const FRAG = /* glsl */`
uniform vec3 uA, uB, uC;
uniform float uS;
void main() {
  o = vec4(mix3(0.5 + 0.5 * sin(length(fieldXY()) * uS - uCam.w), uA, uB, uC), 1.0);
}
`

export default {
  id: 'rings-field',
  label: 'Rings field',
  group: 'field',
  kind: '2d',
  duration: 8,
  camera: CAMERA_SCHEMA,
  params: [
    { key: 'colA', label: 'Color A', type: 'color', role: 'bg', default: '#0b0b0e' },
    { key: 'colB', label: 'Color B', type: 'color', role: 'fg', default: '#c2502e' },
    { key: 'colC', label: 'Color C', type: 'color', role: 'accent', default: '#f6c453' },
    { key: 'freq', label: 'Frequency', type: 'range', min: 1, max: 16, step: 0.5, default: 7 },
  ],
  draw(ctx, u, w, h, p) {
    fieldPass(ctx, u, w, h, p, FRAG, { uA: col(p.colA), uB: col(p.colB), uC: col(p.colC), uS: p.freq * 0.03 })
  },
}
