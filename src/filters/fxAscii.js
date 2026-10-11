/**
 * ASCII — full port of kol-labs-single radar/effects/asciiEngine.js (the
 * HALFTONE trio's ASCII page). Image → character cells; each algorithm is a
 * different letterform strategy: density ramps (8 charsets), gradient-directed
 * edge strokes, braille 2×4 sub-cell dots, or a user-typed custom ramp.
 * Transparent cells (`fit: contain` letterbox) draw no glyph, so the
 * background shows through.
 *
 * Amount is the labs dry/wet dial (photo crossfaded back over the glyphs);
 * motion is the STACKED sweep rig (sweeps.js, `params.sweeps` array with the
 * labs one-click presets) — woven from the transport's u with integer
 * cycles, so every sweep shape loops seamlessly. Same id as the old 5-param
 * port, superset params: legacy keys (cellSize / charset / fg / bg / invert)
 * resolve unchanged.
 */
import { AMOUNT_PARAM, mixSourceOver, registerSourceCache, stillUnless } from './fxCore.js'
import { NO_SWEEP, sweepStates, evalSweeps, anyReveal } from './sweeps.js'

const DENSITY_RAMP = ' .:-=+*#%@'
const EDGE_GLYPHS = ['—', '\\', '|', '/'] // by gradient direction, quantized

const ALGORITHM_OPTIONS = [
  { value: 'density', label: 'Density' },
  { value: 'edges', label: 'Edges' },
  { value: 'braille', label: 'Braille' },
  { value: 'custom', label: 'Custom ramp' },
]

/* Ramps for the density algorithm — ordered sparse → dense (labs originals). */
const CHARSETS = [
  { value: 'classic', label: 'Classic', ramp: DENSITY_RAMP },
  { value: 'extended', label: 'Extended', ramp: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$" },
  { value: 'blocks', label: 'Blocks', ramp: ' ░▒▓█' },
  { value: 'minimal', label: 'Minimal', ramp: ' .·:*' },
  { value: 'binary', label: 'Binary', ramp: ' 01' },
  { value: 'hex', label: 'Hex', ramp: ' 0123456789ABCDEF' },
  { value: 'katakana', label: 'Katakana', ramp: ' ･ｨｩｮｺﾆﾊﾎﾒﾗﾜ' },
  { value: 'strokes', label: 'Strokes', ramp: " `'-/\\|+X#" },
]
const CHARSET_OPTIONS = CHARSETS.map(({ value, label }) => ({ value, label }))

/* Braille dot bit order: 1-3 left col, 4-6 right col, 7-8 bottom row
 * (U+2800 + bits) — [col, row, bit] per sub-cell. */
const BRAILLE_DOTS = [
  [0, 0, 0x01], [0, 1, 0x02], [0, 2, 0x04], [1, 0, 0x08],
  [1, 1, 0x10], [1, 2, 0x20], [0, 3, 0x40], [1, 3, 0x80],
]

const rampChar = (ramp, l) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(l * ramp.length)))]

/* Per-source pixel cache (glass.js pattern) — the host hands us a NEW fitted
 * canvas whenever the image/fit/size changes, so canvas identity is the key:
 * base pixels read once per source, nothing allocated per frame. */
const pixelCache = new WeakMap()
registerSourceCache(pixelCache)   /* chain intermediates / loop sources invalidate in place */
function pixelsFor(src) {
  let d = pixelCache.get(src)
  if (!d) {
    d = src.getContext('2d').getImageData(0, 0, src.width, src.height).data
    pixelCache.set(src, d)
  }
  return d
}

/* Glyph atlas (plan 27 § 5) — fillText per cell was a fifth of the frame. Each glyph is rendered once
 * per (font, colour) into a sprite and stamped with drawImage. Colour mode stamps WHITE sprites into
 * one layer and tints the whole layer once (`source-in` over a per-cell colour grid) instead of a
 * fillStyle string per cell; a glyph that leaves its cell (geometry sweep, glyph scale > 1) would
 * take a neighbour's colour that way, so those frames keep fillText. */
let atlasKey = ''
const atlas = new Map()
function spriteFor(ch, fontPx, font, color) {
  const key = `${font}|${color}`
  if (key !== atlasKey) { atlas.clear(); atlasKey = key }
  let sp = atlas.get(ch)
  if (!sp) {
    const S = Math.ceil(fontPx * 2) + 2
    sp = document.createElement('canvas')
    sp.width = S
    sp.height = S
    const g = sp.getContext('2d')
    g.font = font
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = color
    g.fillText(ch, S / 2, S / 2)
    atlas.set(ch, sp)
  }
  return sp
}
let layer = null
let grid = null
function canvasFor(c, w, h) {
  if (!c) c = document.createElement('canvas')
  if (c.width !== w) c.width = w
  if (c.height !== h) c.height = h
  return c
}

export default {
  id: 'fx-ascii',
  label: 'ASCII',
  stillKey: stillUnless('sweeps'),   /* moves only through the sweep rig (plan 27 § 1) */
  sweeps: true,   /* stacked sweep rig (sweeps.js) — Effects panel Motion tab */
  params: [
    { ...AMOUNT_PARAM, section: 'Effect' },
    { key: 'algorithm', label: 'Algorithm', type: 'select', options: ALGORITHM_OPTIONS, default: 'density', section: 'Algorithm' },
    { key: 'charset', label: 'Charset', type: 'select', options: CHARSET_OPTIONS, default: 'classic', section: 'Algorithm', when: (l) => (l.algorithm ?? 'density') === 'density' },
    { key: 'ramp', label: 'Custom ramp', type: 'text', rows: 1, placeholder: DENSITY_RAMP, default: DENSITY_RAMP, section: 'Characters', when: (l) => l.algorithm === 'custom' },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false, section: 'Characters' },
    { key: 'glyphScale', label: 'Glyph scale', type: 'range', min: 0.5, max: 2, step: 0.05, default: 1, section: 'Characters' },
    /* noRandom: cell size is grid resolution — a size thing, not a look. */
    { key: 'cellSize', label: 'Cell size', type: 'range', min: 4, max: 40, step: 1, default: 10, noRandom: true, section: 'Cells' },
    { key: 'contrast', label: 'Contrast', type: 'range', min: -100, max: 100, step: 1, default: 0, section: 'Cells' },
    { key: 'useColor', label: 'Original color', type: 'toggle', default: true, section: 'Color' },
    { key: 'fg', label: 'Foreground', type: 'color', role: 'fg', default: '#f4f1ea', section: 'Color', when: (l) => !(l.useColor ?? true) },
    { key: 'bg', label: 'Background', type: 'color', role: 'bg', default: '#06070b', section: 'Color' },
  ],
  apply(ctx, src, w, h, p, u) {
    if ((p.amount ?? 100) <= 0) { ctx.drawImage(src, 0, 0, w, h); return }
    const sw = src.width
    const sh = src.height
    const data = pixelsFor(src)
    /* The source is dpr-backed (sw = w·dpr); cellSize is authored in css px,
     * so scale it into source-pixel space (k = 1 at dpr 1 — identical). */
    const k = sw / w || 1
    const step = Math.max(2, Math.round((p.cellSize ?? 10) * k))
    const algorithm = p.algorithm ?? 'density'
    const useColor = p.useColor ?? true
    const invert = !!p.invert

    const st = sweepStates(p, u)
    const reveal = anyReveal(st)
    const geo = !!st && st.some((s) => s.target === 'geometry')

    const contrast = p.contrast ?? 0
    const cf = (259 * (contrast + 255)) / (255 * (259 - contrast))
    const adjust = (v) => Math.max(0, Math.min(255, cf * (v - 128) + 128))

    /* Contrast-adjusted, optionally inverted luma at a pixel (clamped);
     * null for transparent (letterbox) pixels — the cell draws nothing. */
    const lumaAt = (px, py) => {
      const cx = Math.max(0, Math.min(sw - 1, Math.round(px)))
      const cy = Math.max(0, Math.min(sh - 1, Math.round(py)))
      const i = (cy * sw + cx) << 2
      if (data[i + 3] < 20) return null
      const l = (0.299 * adjust(data[i]) + 0.587 * adjust(data[i + 1]) + 0.114 * adjust(data[i + 2])) / 255
      return invert ? 1 - l : l
    }
    const colorAt = (px, py) => {
      const cx = Math.max(0, Math.min(sw - 1, Math.round(px)))
      const cy = Math.max(0, Math.min(sh - 1, Math.round(py)))
      const i = (cy * sw + cx) << 2
      return `rgb(${Math.floor(adjust(data[i]))},${Math.floor(adjust(data[i + 1]))},${Math.floor(adjust(data[i + 2]))})`
    }

    const ramp = algorithm === 'custom'
      ? ((p.ramp && p.ramp.length) ? p.ramp : DENSITY_RAMP)
      : (CHARSETS.find((c) => c.value === p.charset) ?? CHARSETS[0]).ramp

    ctx.save()
    ctx.scale(w / sw, h / sh) // glyph pass runs in source-pixel space
    ctx.fillStyle = p.bg ?? '#06070b'
    ctx.fillRect(0, 0, sw, sh)
    // Reveal sweeps wipe glyphs in/out over the raw photo, so it goes underneath.
    if (reveal) ctx.drawImage(src, 0, 0, sw, sh)

    ctx.fillStyle = p.fg ?? '#f4f1ea'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const fontPx = Math.max(4, step * (p.glyphScale ?? 1))
    const font = `${fontPx}px ui-monospace, monospace`
    ctx.font = font
    /* the atlas path, unless a coloured glyph can leave its cell (see the atlas note) */
    const stamp = !useColor || (!geo && (p.glyphScale ?? 1) <= 1)
    const cols = Math.ceil(sw / step), rows = Math.ceil(sh / step)
    let g = ctx, cells = null
    if (stamp && useColor) {
      layer = canvasFor(layer, sw, sh)
      g = layer.getContext('2d')
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.clearRect(0, 0, sw, sh)
      grid = canvasFor(grid, cols, rows)
      cells = grid.getContext('2d').createImageData(cols, rows)
    }
    const ink = useColor ? '#ffffff' : (p.fg ?? '#f4f1ea')

    for (let y = 0; y < sh; y += step) {
      for (let x = 0; x < sw; x += step) {
        const cx = x + step / 2
        const cy = y + step / 2
        let l = lumaAt(cx, cy)
        if (l == null) continue

        const pkt = st ? evalSweeps(st, cx / sw, cy / sh) : NO_SWEEP
        if (pkt.hasReveal && pkt.reveal < 0.5) continue // photo underlay shows through
        if (pkt.bright) l = Math.max(0, Math.min(1, l + pkt.bright))

        let ch = null
        switch (algorithm) {
          case 'edges': {
            const lR = lumaAt(cx + step, cy)
            const lB = lumaAt(cx, cy + step)
            if (lR == null || lB == null) break
            const dx = lR - l
            const dy = lB - l
            const mag = Math.hypot(dx, dy)
            if (mag < 0.06) { ch = l > 0.5 ? '·' : null; break }
            // gradient direction → stroke perpendicular to it (follows the edge)
            const ang = Math.atan2(dy, dx) + Math.PI / 2
            const bin = Math.round(((ang + Math.PI) / Math.PI) * 2) % 4
            ch = EDGE_GLYPHS[bin]
            break
          }
          case 'braille': {
            // 2×4 sub-cells per glyph, thresholded at mid-luma
            const sx = step / 2
            const sy = step / 4
            let bits = 0
            for (let k = 0; k < BRAILLE_DOTS.length; k++) {
              const d = BRAILLE_DOTS[k]
              const sl = lumaAt(x + sx * d[0] + sx / 2, y + sy * d[1] + sy / 2)
              if (sl != null && sl > 0.5) bits |= d[2]
            }
            if (bits === 0) break
            ch = String.fromCharCode(0x2800 + bits)
            break
          }
          case 'density':
          case 'custom':
          default:
            ch = rampChar(ramp, l)
            break
        }
        if (!ch || ch === ' ') continue

        if (stamp) {
          if (cells) {
            const ci = Math.round(Math.max(0, Math.min(sw - 1, cx))), cj = Math.round(Math.max(0, Math.min(sh - 1, cy)))
            const i = (cj * sw + ci) << 2, o = (((y / step) | 0) * cols + ((x / step) | 0)) << 2
            cells.data[o] = Math.floor(adjust(data[i])); cells.data[o + 1] = Math.floor(adjust(data[i + 1]))
            cells.data[o + 2] = Math.floor(adjust(data[i + 2])); cells.data[o + 3] = 255
          }
          const sp = spriteFor(ch, fontPx, font, ink)
          const half = sp.width / 2
          if (geo) {
            g.save()
            g.translate(cx + pkt.offX * step, cy + pkt.offY * step)
            g.rotate(pkt.rot)
            g.scale(pkt.scaleMul, pkt.scaleMul)
            g.drawImage(sp, -half, -half)
            g.restore()
          } else {
            g.drawImage(sp, cx - half, cy - half)
          }
          continue
        }
        if (useColor) ctx.fillStyle = colorAt(cx, cy)
        if (geo) {
          ctx.save()
          ctx.translate(cx + pkt.offX * step, cy + pkt.offY * step)
          ctx.rotate(pkt.rot)
          ctx.scale(pkt.scaleMul, pkt.scaleMul)
          ctx.fillText(ch, 0, 0)
          ctx.restore()
        } else {
          ctx.fillText(ch, cx, cy)
        }
      }
    }
    if (cells) {
      /* tint the white glyph layer by its cells' colours in one composite */
      grid.getContext('2d').putImageData(cells, 0, 0)
      g.globalCompositeOperation = 'source-in'
      g.imageSmoothingEnabled = false
      g.drawImage(grid, 0, 0, cols * step, rows * step)
      g.globalCompositeOperation = 'source-over'
      ctx.drawImage(layer, 0, 0, sw, sh)
    }
    ctx.restore()
    mixSourceOver(ctx, src, w, h, p.amount) // dry/wet: photo back over the glyphs
  },
}
