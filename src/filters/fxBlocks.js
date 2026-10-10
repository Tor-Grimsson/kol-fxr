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
 * a pixi stage resamples. Stacks after Dither / Halftone / Scanline in the same tier.
 *
 * Motion: the pattern is hash(block, seed, epoch) with epoch = floor(u · Rate) — it reshuffles Rate
 * times a loop and is back at epoch 0 for u = 1, so the loop is seamless by construction. Hold keeps
 * that fraction of blocks on their epoch-0 fate across reshuffles: flicker, not churn. Rate 0 = still.
 */
import { AMOUNT_PARAM, runFx, intHash2 } from './fxCore.js'

const PURE = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [0, 255, 255], [255, 0, 255], [255, 255, 0]]

/* a 0..1 draw per (block, salt), on this epoch unless the block is held */
const roller = (seed, epoch, hold) => (bx, by, salt) => {
  const held = intHash2(bx * 31 + seed, by * 17 + 7919) < hold
  return intHash2(bx + salt * 1013 + seed * 7, by + salt * 389 + (held ? 0 : epoch * 9973))
}

function fxBlocks(sd, od, w, h, q) {
  od.set(sd)
  const B = q.block
  const cols = Math.ceil(w / B)
  const rows = Math.ceil(h / B)
  const r = roller(q.seed, q.epoch, q.hold)
  const d = q.density

  for (let by = 0; by < rows; by++) {
    for (let bx = 0; bx < cols; bx++) {
      const x0 = bx * B, y0 = by * B
      const x1 = Math.min(w, x0 + B), y1 = Math.min(h, y0 + B)

      if (r(bx, by, 1) < q.drop * d) {
        let cr = 0, cg = 0, cb = 0
        if (q.dropColor === 'average') {
          let n = 0
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * w + x) << 2; cr += sd[i]; cg += sd[i + 1]; cb += sd[i + 2]; n++ }
          cr /= n; cg /= n; cb /= n
        } else if (q.dropColor === 'paper') { cr = cg = cb = 255 }
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * w + x) << 2; od[i] = cr; od[i + 1] = cg; od[i + 2] = cb; od[i + 3] = 255 }
        continue
      }

      if (r(bx, by, 2) < q.displace * d) {
        const span = Math.max(1, q.shift)
        const pick = (salt) => Math.round((r(bx, by, salt) * 2 - 1) * span) || 1
        const dx = q.dir === 'vertical' ? 0 : pick(3)
        const dy = q.dir === 'horizontal' ? 0 : pick(4)
        for (let y = y0; y < y1; y++) {
          const sy = Math.max(0, Math.min(h - 1, y + dy * B))
          for (let x = x0; x < x1; x++) {
            const sx = Math.max(0, Math.min(w - 1, x + dx * B))
            const i = (y * w + x) << 2, j = (sy * w + sx) << 2
            od[i] = sd[j]; od[i + 1] = sd[j + 1]; od[i + 2] = sd[j + 2]; od[i + 3] = sd[j + 3]
          }
        }
        continue
      }

      if (r(bx, by, 5) < q.chroma * d) {
        const ox = Math.round((r(bx, by, 6) * 2 - 1) * q.spread)
        const oy = Math.round((r(bx, by, 7) * 2 - 1) * q.spread * 0.5)
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * w + x) << 2
            const rx = Math.max(0, Math.min(w - 1, x - ox)), ry = Math.max(0, Math.min(h - 1, y - oy))
            const bxp = Math.max(0, Math.min(w - 1, x + ox)), byp = Math.max(0, Math.min(h - 1, y + oy))
            od[i] = sd[(ry * w + rx) << 2]
            od[i + 2] = sd[((byp * w + bxp) << 2) + 2]
          }
        }
        continue
      }

      if (r(bx, by, 8) < q.noise * d) {
        const c = Math.max(1, q.cluster)
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const cx = (x / c) | 0, cy = (y / c) | 0
            const v = intHash2(cx * 7 + q.seed + q.epoch * 131, cy * 13 + bx)
            if (v > 0.55) continue
            const col = PURE[(v * 1000 | 0) % PURE.length]
            const i = (y * w + x) << 2
            od[i] = col[0]; od[i + 1] = col[1]; od[i + 2] = col[2]; od[i + 3] = 255
          }
        }
      }
    }
  }

  /* Tear — thin row bands slid sideways over the result */
  if (q.tear > 0) {
    const bands = Math.round(q.tear * 12)
    const th = Math.max(1, q.tearH)
    const row = new Uint8ClampedArray(w * 4)
    for (let t = 0; t < bands; t++) {
      const y0 = Math.floor(intHash2(t * 53 + q.seed, q.epoch * 7 + 3) * h)
      const sx = Math.round((intHash2(t * 97 + q.seed, q.epoch * 11 + 5) * 2 - 1) * w * 0.12)
      for (let y = y0; y < Math.min(h, y0 + th); y++) {
        row.set(od.subarray(y * w * 4, (y + 1) * w * 4))
        for (let x = 0; x < w; x++) {
          const fx = ((x - sx) % w + w) % w
          const i = (y * w + x) << 2, j = fx << 2
          od[i] = row[j]; od[i + 1] = row[j + 1]; od[i + 2] = row[j + 2]; od[i + 3] = row[j + 3]
        }
      }
    }
  }
}

const range = (key, label, min, max, step, dflt, extra = {}) => ({ key, label, type: 'range', min, max, step, default: dflt, ...extra })
const sel = (key, label, dflt, options, extra = {}) => ({ key, label, type: 'select', default: dflt, options, ...extra })

export const BLOCKS_FX = [
  {
    id: 'fx-blocks',
    label: 'Blocks',
    animated: true,
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
      runFx(ctx, src, w, h, fxBlocks, {
        block: Math.max(2, Math.round((p.size ?? 16) * k)),
        density: p.density ?? 0.35,
        seed: Math.round(p.seed ?? 1),
        epoch: rate ? Math.floor(((u % 1) + 1) % 1 * rate) : 0,
        hold: p.hold ?? 0.5,
        displace: p.displace ?? 0.5, shift: Math.round(p.shift ?? 2), dir: p.dir ?? 'horizontal',
        drop: p.drop ?? 0.3, dropColor: p.dropColor ?? 'ink',
        chroma: p.chroma ?? 0.3, spread: Math.round((p.spread ?? 6) * k),
        noise: p.noise ?? 0.2, cluster: Math.max(1, Math.round((p.cluster ?? 2) * k)),
        tear: p.tear ?? 0, tearH: Math.max(1, Math.round((p.tearH ?? 6) * k)),
      }, p.amount)
    },
  },
]

/* dev self-check: the loop is seamless — epoch at u = 0 and u = 1 is the same */
if (import.meta.env?.DEV) {
  const ep = (u, rate) => Math.floor(((u % 1) + 1) % 1 * rate)
  console.assert(ep(0, 4) === ep(1, 4) && ep(0.99, 4) === 3, 'fx-blocks: epoch wraps at the loop')
}
