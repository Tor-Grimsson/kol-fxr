import { CAMERA_SCHEMA } from './camera.js'
import { fieldPass, col } from './fieldGL.js'

// Stripes — flowing sine bands. The camera rotates/zooms the field; flow drifts
// the bands. Sharpness blends sine→square. Seamless: phase is periodic in u.
const FRAG = /* glsl */`
uniform vec3 uA, uB;
uniform float uS, uSharp;
void main() {
  float f = 0.5 + 0.5 * sin(fieldXY().x * uS + uCam.w);
  f = f * (1.0 - uSharp) + (f > 0.5 ? 1.0 : 0.0) * uSharp;
  o = vec4(mix2(f, uA, uB), 1.0);
}
`

export default {
  id: 'stripes',
  label: 'Stripes',
  group: 'field',
  kind: '2d',
  duration: 8,
  camera: CAMERA_SCHEMA,
  params: [
    { key: 'colA', label: 'Color A', type: 'color', role: 'bg', default: '#0b0b0e' },
    { key: 'colB', label: 'Color B', type: 'color', role: 'fg', default: '#e8e4dc' },
    { key: 'freq', label: 'Frequency', type: 'range', min: 1, max: 16, step: 0.5, default: 7 },
    { key: 'sharp', label: 'Sharpness', type: 'range', min: 0, max: 1, step: 0.05, default: 0.4 },
  ],
  draw(ctx, u, w, h, p) {
    fieldPass(ctx, u, w, h, p, FRAG, { uA: col(p.colA), uB: col(p.colB), uS: p.freq * 0.04, uSharp: p.sharp })
  },
}
