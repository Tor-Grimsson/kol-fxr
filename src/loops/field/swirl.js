import { CAMERA_SCHEMA } from './camera.js'
import { fieldPass, col } from './fieldGL.js'

// Swirl — a pinwheel: angular bands twisted by radius, spun by flow. Integer arms
// keep the value continuous across the ±π seam; phase is periodic ⇒ seamless.
const FRAG = /* glsl */`
uniform vec3 uA, uB, uC;
uniform float uArms, uTwist;
void main() {
  vec2 q = fieldXY();
  o = vec4(mix3(0.5 + 0.5 * sin(uArms * atan(q.y, q.x) + length(q) * 0.01 * uTwist - uCam.w), uA, uB, uC), 1.0);
}
`

export default {
  id: 'swirl',
  label: 'Swirl',
  group: 'field',
  kind: '2d',
  duration: 8,
  camera: CAMERA_SCHEMA,
  params: [
    { key: 'colA', label: 'Color A', type: 'color', role: 'bg', default: '#06060a' },
    { key: 'colB', label: 'Color B', type: 'color', role: 'fg', default: '#7a3fb0' },
    { key: 'colC', label: 'Color C', type: 'color', role: 'accent', default: '#f4f1ea' },
    { key: 'arms', label: 'Arms', type: 'range', min: 1, max: 12, step: 1, default: 5, noRandom: true },
    { key: 'twist', label: 'Twist', type: 'range', min: 0, max: 8, step: 0.5, default: 3 },
  ],
  draw(ctx, u, w, h, p) {
    fieldPass(ctx, u, w, h, p, FRAG, { uA: col(p.colA), uB: col(p.colB), uC: col(p.colC), uArms: Math.round(p.arms), uTwist: p.twist })
  },
}
