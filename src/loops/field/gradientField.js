import { CAMERA_SCHEMA } from './camera.js'
import { fieldPass, col } from './fieldGL.js'

// Gradient field — a flowing iridescent plasma (the maxdrekker / mnaumann
// "Dynamics" mood). A smooth scalar field through a 3-stop palette; the camera's
// phase drifts it. Rendered by the field GL pass (fieldGL.js).
// Seamless: every phase term is periodic in u.
const FRAG = /* glsl */`
uniform vec3 uA, uB, uC;
uniform float uS, uWarp;
void main() {
  vec2 q = fieldXY();
  float ph = uCam.w;
  /* phase multipliers stay integers (camFlow) — the field returns to its start after one cam cycle */
  float v = sin(q.x * uS + ph) + sin(q.y * uS * 0.9 - ph) + sin((q.x + q.y) * 0.7 * uS + ph * 2.0);
  o = vec4(mix3(0.5 + 0.5 * sin(v + uWarp * sin((q.x - q.y) * 0.3 * uS)), uA, uB, uC), 1.0);
}
`

export default {
  id: 'gradient-field',
  label: 'Gradient field',
  group: 'field',
  kind: '2d',
  duration: 8,
  camera: CAMERA_SCHEMA,
  params: [
    { key: 'colA', label: 'Color A', type: 'color', role: 'bg', default: '#1b2a6b' },
    { key: 'colB', label: 'Color B', type: 'color', role: 'fg', default: '#d7263d' },
    { key: 'colC', label: 'Color C', type: 'color', role: 'accent', default: '#f6c453' },
    { key: 'freq', label: 'Frequency', type: 'range', min: 1, max: 12, step: 0.5, default: 5 },
    { key: 'warp', label: 'Warp', type: 'range', min: 0, max: 3, step: 0.1, default: 1 },
  ],
  draw(ctx, u, w, h, p) {
    fieldPass(ctx, u, w, h, p, FRAG, { uA: col(p.colA), uB: col(p.colB), uC: col(p.colC), uS: p.freq * 0.01, uWarp: p.warp })
  },
}
