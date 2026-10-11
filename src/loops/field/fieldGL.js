import { glPass, rgb01 } from '../lib/glPass.js'
import { hexToRgb } from '../lib/util.js'
import { makeCam } from './camera.js'

// The field family on the GPU (plan 27 § 2) — replaces the per-pixel JS rasterizer (raster.js,
// retired to _tmp/). Same buffer size as before (the display width, capped at 1000 — crisp
// on-screen, bounded exports), same sample points, same camera; each loop supplies its colour
// maths as GLSL. `fieldXY()` is camera.js `sample()` for this pixel; `mix2`/`mix3` are the old
// rgb ramps; the phase is uCam.w. Colours arrive as 0–1 vec3s (`col(hex)`).

const CAP = 1000

const PRELUDE = `
uniform vec2 uSize;
uniform vec4 uCam;
vec2 fieldXY() {
  vec2 s = pix() / uRes * uSize - uSize * 0.5;
  return vec2(s.x * uCam.x - s.y * uCam.y, s.x * uCam.y + s.y * uCam.x) / uCam.z;
}
vec3 mix2(float f, vec3 a, vec3 b) { return mix(a, b, f); }
vec3 mix3(float f, vec3 a, vec3 b, vec3 c) { return f < 0.5 ? mix(a, b, f * 2.0) : mix(b, c, (f - 0.5) * 2.0); }
`

export const col = (hex) => rgb01(hexToRgb(hex))

/* The buffer the old raster used: rw = display width (64..CAP), rh by aspect. */
export function fieldRes(w, h) {
  const rw = Math.max(64, Math.min(CAP, Math.round(w)))
  return [rw, Math.max(1, Math.round((rw * h) / w))]
}

/* `body` is GLSL that sets `o` (it may call fieldXY / mix2 / mix3 and read its own uniforms). */
export function fieldPass(ctx, u, w, h, p, body, uniforms) {
  const cam = makeCam(u, p, w, h)
  const [rw, rh] = fieldRes(w, h)
  glPass(ctx, w, h, rw, rh, PRELUDE + body, { uSize: [w, h], uCam: [cam.cos, cam.sin, cam.zoom, cam.phase], ...uniforms })
}
