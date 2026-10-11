/**
 * fx-blocks — block corruption (plan 26 § 14; the user, 2026-10-09: *"a post processing fx or just a
 * regular effect that in glitchy blocky effect, maybe has settings for distortion and irregular
 * chromatic aberration?"*, over a 1-bit portrait with black squares thrown across it, blocks shoved
 * sideways and clusters of pure blue / green / magenta).
 *
 * The frame is cut into a grid of square blocks. Each block rolls, in order, for one fate:
 *   Drop       filled solid — ink, paper, or the block's own average
 *   Displace   copied from a block 1…Shift blocks away (whole blocks, so the grid stays crisp)
 *   Chromatic  its own R and B offsets — every block a different vector, the irregular aberration
 *   Noise      clusters of pure R · G · B · C · M · Y pixels
 * then Tear shifts thin row bands sideways over the result.
 *
 * Canvas tier, not pixi: the look is grid work on a (usually 1-bit) image and must stay pixel-crisp;
 * a pixi stage resamples. Stacks after Dither / Halftone / Scanline in the same tier. The pass is a
 * fragment shader (glPass, plan 27 follow-up — the JS pass plus its full-frame readback held a moving
 * chain at 15 fps under load): every pixel finds its tear shift, then its block's fate. jsHash is
 * intHash2 bit for bit, so a seed corrupts the same blocks it did on the CPU.
 *
 * Motion: the pattern is hash(block, seed, epoch) with epoch = floor(u · Rate) — it reshuffles Rate
 * times a loop and is back at epoch 0 for u = 1, so the loop is seamless by construction. Hold keeps
 * that fraction of blocks on their epoch-0 fate across reshuffles: flicker, not churn. Rate 0 = still.
 */
import { AMOUNT_PARAM, glFx, stillUnless } from './fxCore.js'
import { glPass, HASH_GLSL } from '../loops/lib/glPass.js'

/* Drop · Average needs each block's mean — a small pass with one pixel per block, its result the
   main pass's uAux (cols × rows). Block size is ≤ 96 css px × dpr 2. */
const AVERAGE = /* glsl */`
uniform float uB;
void main() {
  int B = int(uB);
  ivec2 o0 = ivec2(pix()) * B, S = textureSize(uSrc, 0);
  vec3 acc = vec3(0.0);
  float n = 0.0;
  for (int y = 0; y < 192; y++) {
    if (y >= B || o0.y + y >= S.y) break;
    for (int x = 0; x < 192; x++) {
      if (x >= B || o0.x + x >= S.x) break;
      acc += texelFetch(uSrc, o0 + ivec2(x, y), 0).rgb;
      n += 1.0;
    }
  }
  o = vec4(acc / max(n, 1.0), 1.0);
}
`

const BLOCKS = /* glsl */`${HASH_GLSL}
uniform float uBlock, uDensity, uSeed, uEpoch, uHold, uDisplace, uShift, uDir, uDrop, uFill, uChroma, uSpread;
uniform float uNoise, uCluster, uBands, uTearH;
const vec3 PURE[6] = vec3[6](vec3(1, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1), vec3(0, 1, 1), vec3(1, 0, 1), vec3(1, 1, 0));
int iround(float v) { return int(floor(v + 0.5)); }   /* Math.round */
/* a 0..1 draw per (block, salt), on this epoch unless the block is held */
float roll(int bx, int by, int salt, bool held) {
  int seed = int(uSeed);
  return jsHash(bx + salt * 1013 + seed * 7, by + salt * 389 + (held ? 0 : int(uEpoch) * 9973));
}
vec4 blockAt(ivec2 p) {
  int B = int(uBlock), seed = int(uSeed);
  ivec2 S = ivec2(uRes);
  int bx = p.x / B, by = p.y / B;
  bool held = jsHash(bx * 31 + seed, by * 17 + 7919) < uHold;
  float d = uDensity;
  if (roll(bx, by, 1, held) < uDrop * d) {
    vec3 c = uFill == 2.0 ? texelFetch(uAux, ivec2(bx, by), 0).rgb : vec3(uFill);   /* ink 0 · paper 1 · average */
    return vec4(c, 1.0);
  }
  if (roll(bx, by, 2, held) < uDisplace * d) {
    float span = max(1.0, uShift);
    int dx = 0, dy = 0;
    if (uDir != 1.0) { dx = iround((roll(bx, by, 3, held) * 2.0 - 1.0) * span); if (dx == 0) dx = 1; }
    if (uDir != 0.0) { dy = iround((roll(bx, by, 4, held) * 2.0 - 1.0) * span); if (dy == 0) dy = 1; }
    return srcAt(p + ivec2(dx, dy) * B);
  }
  if (roll(bx, by, 5, held) < uChroma * d) {
    int ox = iround((roll(bx, by, 6, held) * 2.0 - 1.0) * uSpread);
    int oy = iround((roll(bx, by, 7, held) * 2.0 - 1.0) * uSpread * 0.5);
    vec4 s = srcAt(p);
    return vec4(srcAt(p - ivec2(ox, oy)).r, s.g, srcAt(p + ivec2(ox, oy)).b, s.a);
  }
  if (roll(bx, by, 8, held) < uNoise * d) {
    int c = max(1, int(uCluster));
    float v = jsHash((p.x / c) * 7 + seed + int(uEpoch) * 131, (p.y / c) * 13 + bx);
    if (v <= 0.55) return vec4(PURE[int(v * 1000.0) % 6], 1.0);
  }
  return srcAt(p);
}
vec4 fx(ivec2 p) {
  /* Tear — thin row bands slid sideways over the result, applied in order on the CPU; here each
     pixel walks them backwards to find the column it shows */
  int x = p.x, W = int(uRes.x), H = int(uRes.y), seed = int(uSeed), ep = int(uEpoch), th = max(1, int(uTearH));
  for (int t = 15; t >= 0; t--) {
    if (t >= int(uBands)) continue;
    int y0 = int(floor(jsHash(t * 53 + seed, ep * 7 + 3) * float(H)));
    if (p.y < y0 || p.y >= min(H, y0 + th)) continue;
    int sx = iround((jsHash(t * 97 + seed, ep * 11 + 5) * 2.0 - 1.0) * float(W) * 0.12);
    x = ((x - sx) % W + W) % W;
  }
  return blockAt(ivec2(x, p.y));
}
`
const FILL = { ink: 0, paper: 1, average: 2 }
const DIR = { horizontal: 0, vertical: 1, both: 2 }
let avg = null

const range = (key, label, min, max, step, dflt, extra = {}) => ({ key, label, type: 'range', min, max, step, default: dflt, ...extra })
const sel = (key, label, dflt, options, extra = {}) => ({ key, label, type: 'select', default: dflt, options, ...extra })

export const BLOCKS_FX = [
  {
    id: 'fx-blocks',
    label: 'Blocks',
    stillKey: stillUnless('rate'),   /* Rate 0 = one frozen corruption (plan 27 § 1) */
    params: [
      range('size', 'Block size', 4, 96, 1, 16, { section: 'Blocks' }),
      range('density', 'Density', 0, 1, 0.01, 0.35, { section: 'Blocks' }),
      range('seed', 'Seed', 0, 999, 1, 1, { section: 'Blocks', noRandom: true }),
      range('displace', 'Displace', 0, 1, 0.01, 0.5, { section: 'Displace' }),
      range('shift', 'Shift', 1, 8, 1, 2, { section: 'Displace' }),
      sel('dir', 'Direction', 'horizontal', [
        { value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }, { value: 'both', label: 'Both' },
      ], { section: 'Displace' }),
      range('drop', 'Drop', 0, 1, 0.01, 0.3, { section: 'Drop' }),
      sel('dropColor', 'Fill', 'ink', [
        { value: 'ink', label: 'Ink' }, { value: 'paper', label: 'Paper' }, { value: 'average', label: 'Average' },
      ], { section: 'Drop' }),
      range('chroma', 'Chromatic', 0, 1, 0.01, 0.3, { section: 'Chromatic' }),
      range('spread', 'Spread', 0, 24, 1, 6, { section: 'Chromatic' }),
      range('noise', 'Channel noise', 0, 1, 0.01, 0.2, { section: 'Noise' }),
      range('cluster', 'Cluster', 1, 8, 1, 2, { section: 'Noise' }),
      range('tear', 'Tear', 0, 1, 0.01, 0, { section: 'Tear' }),
      range('tearH', 'Tear height', 1, 40, 1, 6, { section: 'Tear' }),
      range('rate', 'Rate', 0, 16, 1, 4, { tab: 'anim', section: 'Motion' }),
      range('hold', 'Hold', 0, 1, 0.05, 0.5, { tab: 'anim', section: 'Motion' }),
      AMOUNT_PARAM,
    ],
    apply(ctx, src, w, h, p, u) {
      /* css px → source pixels (k = 1 at dpr 1) */
      const k = src.width / w || 1
      const rate = Math.max(0, Math.round(p.rate ?? 4))
      const block = Math.max(2, Math.round((p.size ?? 16) * k))
      const fill = FILL[p.dropColor] ?? 0
      if (fill === 2) {
        const cols = Math.ceil(src.width / block), rows = Math.ceil(src.height / block)
        if (!avg) avg = document.createElement('canvas')
        if (avg.width !== cols) avg.width = cols
        if (avg.height !== rows) avg.height = rows
        glPass(avg.getContext('2d'), cols, rows, cols, rows, AVERAGE, { uB: block }, src)
        avg._fxGen = (avg._fxGen ?? 0) + 1   /* redrawn in place — re-upload as uAux */
      }
      glFx(ctx, src, w, h, BLOCKS, {
        uBlock: block, uDensity: p.density ?? 0.35, uSeed: Math.round(p.seed ?? 1),
        uEpoch: rate ? Math.floor(((u % 1) + 1) % 1 * rate) : 0, uHold: p.hold ?? 0.5,
        uDisplace: p.displace ?? 0.5, uShift: Math.round(p.shift ?? 2), uDir: DIR[p.dir] ?? 0,
        uDrop: p.drop ?? 0.3, uFill: fill,
        uChroma: p.chroma ?? 0.3, uSpread: Math.round((p.spread ?? 6) * k),
        uNoise: p.noise ?? 0.2, uCluster: Math.max(1, Math.round((p.cluster ?? 2) * k)),
        uBands: (p.tear ?? 0) > 0 ? Math.round((p.tear ?? 0) * 12) : 0, uTearH: Math.max(1, Math.round((p.tearH ?? 6) * k)),
      }, p.amount, fill === 2 ? avg : null)
    },
  },
]

/* dev self-check: the loop is seamless — epoch at u = 0 and u = 1 is the same */
if (import.meta.env?.DEV) {
  const ep = (u, rate) => Math.floor(((u % 1) + 1) % 1 * rate)
  console.assert(ep(0, 4) === ep(1, 4) && ep(0.99, 4) === 3, 'fx-blocks: epoch wraps at the loop')
}
