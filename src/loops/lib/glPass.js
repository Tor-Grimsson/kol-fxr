// glPass — one fragment shader over a W×H buffer, drawn into a 2d ctx (plan 27 § 2–3).
//
// The per-pixel loops and filters (field family, optic moiré, kaleido, glass, noise) were JS
// callbacks over up to ~1.25M pixels a frame. Same maths as GLSL, on ONE shared offscreen WebGL2
// canvas for the whole app: a fullscreen triangle, a program cached per shader source, uniforms
// by name. The result reaches the caller's ctx with drawImage — no getImageData readback — so the
// loop contract (draw(ctx, u, w, h, p)), the chain and export are unchanged.
//
// Shader contract: GLSL ES 3.00 body (no #version line) with `out vec4 o`. The prelude supplies
// `uRes` (the buffer's W, H) and `pix()` — the pixel's (i, j) with j = 0 at the TOP row and the
// integer corner, the exact coordinates the old JS rasters sampled. Optional `src` uploads a
// canvas/image as `uSrc` (sampled with `texture(uSrc, uv)`, uv top-left origin via `srcUv()`); an
// optional `aux` canvas arrives as `uAux` the same way.

const PRELUDE = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform sampler2D uSrc;
uniform sampler2D uAux;
out vec4 o;
vec2 pix() { return vec2(gl_FragCoord.x - 0.5, uRes.y - 0.5 - gl_FragCoord.y); }
vec2 srcUv() { return vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes; }
`
const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

let canvas = null
let gl = null
/* two texture slots — uSrc (unit 0) and uAux (unit 1); each remembers the canvas last uploaded and
   its generation (fxCore invalidateSource), so an unchanged still source is not re-uploaded every frame */
let slots = [null, null]
const progs = new Map()

function setup() {
  canvas = document.createElement('canvas')
  gl = canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false, alpha: true })
  if (!gl) return false
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); gl = null; progs.clear(); slots = [null, null] })
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  return true
}

function compile(type, text) {
  const s = gl.createShader(type)
  gl.shaderSource(s, text)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`glPass shader: ${gl.getShaderInfoLog(s)}`)
  return s
}

function program(body) {
  let p = progs.get(body)
  if (p) return p
  const prog = gl.createProgram()
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, PRELUDE + body))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`glPass link: ${gl.getProgramInfoLog(prog)}`)
  /* uniforms by name → { loc, type } from the linked program, so a vec4[3] gets uniform4fv */
  const locs = new Map()
  for (let i = 0, n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); i < n; i++) {
    const info = gl.getActiveUniform(prog, i)
    locs.set(info.name.replace(/\[0\]$/, ''), { loc: gl.getUniformLocation(prog, info.name), type: info.type })
  }
  p = { prog, aPos: gl.getAttribLocation(prog, 'aPos'), locs }
  progs.set(body, p)
  return p
}

function setUniform(p, name, v) {
  const u = p.locs.get(name)
  if (!u) return   /* declared but optimised out, or not in this shader */
  const a = typeof v === 'number' ? [v] : v
  switch (u.type) {
    case gl.FLOAT_VEC2: gl.uniform2fv(u.loc, a); break
    case gl.FLOAT_VEC3: gl.uniform3fv(u.loc, a); break
    case gl.FLOAT_VEC4: gl.uniform4fv(u.loc, a); break
    case gl.SAMPLER_2D: case gl.INT: gl.uniform1i(u.loc, a[0]); break
    default: gl.uniform1fv(u.loc, a)
  }
}

function bindTex(p, unit, name, src) {
  gl.activeTexture(gl.TEXTURE0 + unit)   /* first — creating a texture binds it to the ACTIVE unit */
  let s = slots[unit]
  if (!s) {
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    s = slots[unit] = { tex, src: null, gen: -1 }
  }
  gl.bindTexture(gl.TEXTURE_2D, s.tex)
  if (src !== s.src || (src._fxGen ?? 0) !== s.gen) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)   /* row 0 = the image's top — srcUv() is top-left */
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
    s.src = src
    s.gen = src._fxGen ?? 0
  }
  setUniform(p, name, unit)
}

/* Render `body` at rw×rh and draw it over (0, 0, w, h) of `ctx` (ctx in CSS px, any transform).
   Returns false when WebGL2 is unavailable (the caller paints nothing new). */
export function glPass(ctx, w, h, rw, rh, body, uniforms = {}, src = null, aux = null) {
  if (!gl && !setup()) return false
  if (canvas.width !== rw) canvas.width = rw
  if (canvas.height !== rh) canvas.height = rh
  const p = program(body)
  gl.viewport(0, 0, rw, rh)
  gl.useProgram(p.prog)
  gl.enableVertexAttribArray(p.aPos)
  gl.vertexAttribPointer(p.aPos, 2, gl.FLOAT, false, 0, 0)
  if (src) bindTex(p, 0, 'uSrc', src)
  if (aux) bindTex(p, 1, 'uAux', aux)
  setUniform(p, 'uRes', [rw, rh])
  for (const k in uniforms) setUniform(p, k, uniforms[k])
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(canvas, 0, 0, w, h)
  return true
}

/* 0–255 rgb → the 0–1 vec3 a shader wants */
export const rgb01 = (c) => [c[0] / 255, c[1] / 255, c[2] / 255]

/* fxCore's intHash2, bit-exact in GLSL. The JS multiplies in doubles: the first product sum is exact
   (it wraps to the same 32 bits as uint maths), the second (`* 1274126177`) exceeds 2^53 and is
   rounded to 53 significant bits before ToInt32 — so that product is formed in 64 bits here and
   rounded half-to-even the same way. Same hash, so Glass's panes and Noise's grain keep the exact
   offsets a saved file had on the CPU. */
export const HASH_GLSL = /* glsl */`
int msb32(uint v) {   /* findMSB is ES 3.10 */
  if (v == 0u) return -1;
  int r = 0;
  if (v >= 0x10000u) { v >>= 16; r += 16; }
  if (v >= 0x100u) { v >>= 8; r += 8; }
  if (v >= 0x10u) { v >>= 4; r += 4; }
  if (v >= 0x4u) { v >>= 2; r += 2; }
  if (v >= 0x2u) r += 1;
  return r;
}
float jsHash(int x, int y) {
  uint h1 = uint(x) * 374761393u + uint(y) * 668265263u;
  int a = int(h1) ^ (int(h1) >> 13);
  bool neg = a < 0;
  uint m = neg ? (~uint(a) + 1u) : uint(a);
  const uint K = 1274126177u;
  uint ml = m & 0xFFFFu, mh = m >> 16, kl = K & 0xFFFFu, kh = K >> 16;
  uint ll = ml * kl, lh = ml * kh, hl = mh * kl, hh = mh * kh;
  uint mid = (ll >> 16) + (lh & 0xFFFFu) + (hl & 0xFFFFu);
  uint hi = hh + (lh >> 16) + (hl >> 16) + (mid >> 16);
  uint lo = (mid << 16) | (ll & 0xFFFFu);
  int len = hi > 0u ? 33 + msb32(hi) : msb32(lo) + 1;
  if (len > 53) {
    uint s = uint(len - 53);
    uint mask = (1u << s) - 1u, rem = lo & mask, hf = 1u << (s - 1u);
    lo &= ~mask;
    if (rem > hf || (rem == hf && ((lo >> s) & 1u) == 1u)) { uint add = 1u << s; lo += add; if (lo < add) hi += 1u; }
  }
  int c = int(neg ? (~lo + 1u) : lo);
  int d = c ^ (c >> 16);
  return float(uint(d)) / 4294967295.0;
}
`
