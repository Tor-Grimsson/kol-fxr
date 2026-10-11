import { CAMERA_SCHEMA } from './camera.js'
import { fieldPass, col } from './fieldGL.js'

// Plasma — classic multi-sine plasma (a different recipe to Gradient field); flow
// animates the phase. The phase-free radial term stays put ⇒ frame(0)===frame(1).
const FRAG = /* glsl */`
uniform vec3 uA, uB, uC;
uniform float uS;
void main() {
  vec2 q = fieldXY();
  float ph = uCam.w;
  float v = sin(q.x * uS + ph) + sin(q.y * uS - ph) + sin((q.x + q.y) * uS * 0.5 + ph) + sin(length(q) * uS);
  o = vec4(mix3(0.5 + 0.5 * sin(v), uA, uB, uC), 1.0);
}
`

export default {
  id: 'plasma',
  label: 'Plasma',
  group: 'field',
  kind: '2d',
  duration: 8,
  camera: CAMERA_SCHEMA,
  params: [
    { key: 'colA', label: 'Color A', type: 'color', role: 'bg', default: '#1b2a6b' },
    { key: 'colB', label: 'Color B', type: 'color', role: 'fg', default: '#d7263d' },
    { key: 'colC', label: 'Color C', type: 'color', role: 'accent', default: '#f6c453' },
    { key: 'freq', label: 'Frequency', type: 'range', min: 1, max: 12, step: 0.5, default: 5 },
  ],
  draw(ctx, u, w, h, p) {
    fieldPass(ctx, u, w, h, p, FRAG, { uA: col(p.colA), uB: col(p.colB), uC: col(p.colC), uS: p.freq * 0.04 })
  },
}
