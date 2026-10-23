/**
 * fx-slicer — the image slicer of the effects intake (plan 37 § 6.6, after toan_vu_huu), two stages:
 *
 *   Slice wave   the source cut into cols × rows; a band travels across the cells and zooms each
 *                cell's content about its own centre (direction · width · back-and-forth · zoom %).
 *   Riso         two inks over paper: the image split by tone into ink A (shadows) and ink B (mids),
 *                each on its own screen — dots, or a reaction-diffusion LABYRINTH as the threshold —
 *                with misregistration and grain. The gap beside `fxHalftoneDither` the ticket named.
 *
 * Everything moving is whole cycles of `u` ⇒ frame(0) === frame(1). MAPPING: the riso inks ← image
 * tone (the ticket's E6 property).
 */
import RDEngine from '../loops/abstract/RDEngine.js'
import { variationById } from '../loops/abstract/models.js'

const TAU = Math.PI * 2
const range = (key, label, min, max, step, dflt, section, extra = {}) => ({ key, label, type: 'range', min, max, step, default: dflt, section, ...extra })

/* where the band sits for cell (cx, cy) in 0..1, by direction — 0 at the band's centre */
const along = (dir, cx, cy) => (dir === 'y' ? cy : dir === 'diagonal' ? (cx + cy) / 2 : dir === 'radial' ? Math.hypot(cx - 0.5, cy - 0.5) / 0.7071 : cx)

const sliceWave = {
  id: 'fx-slice-wave',
  label: 'Slice wave',
  animated: true,
  params: [
    range('cols', 'Columns', 1, 48, 1, 12, 'Grid', { noRandom: true }),
    range('rows', 'Rows', 1, 48, 1, 16, 'Grid', { noRandom: true }),
    range('gutter', 'Gutter', 0, 8, 0.5, 0, 'Grid'),
    { key: 'dir', label: 'Direction', type: 'select', options: [{ value: 'x', label: 'Across' }, { value: 'y', label: 'Down' }, { value: 'diagonal', label: 'Diagonal' }, { value: 'radial', label: 'Radial' }], default: 'x', section: 'Wave' },
    range('width', 'Width', 0.05, 1, 0.05, 0.3, 'Wave'),
    range('zoom', 'Zoom', 0, 200, 5, 60, 'Wave'),
    { key: 'pingpong', label: 'Back and forth', type: 'toggle', default: false, section: 'Wave' },
    range('cycles', 'Cycles', 1, 4, 1, 1, 'Wave', { noRandom: true }),
  ],
  apply(ctx, src, w, h, p, u) {
    const cols = Math.max(1, Math.round(p.cols ?? 12)), rows = Math.max(1, Math.round(p.rows ?? 16))
    const cyc = Math.max(1, Math.round(p.cycles ?? 1))
    /* band centre: a sweep 0→1 per cycle, or a there-and-back on one sine */
    const pos = p.pingpong ? 0.5 - 0.5 * Math.cos(u * TAU * cyc) : (u * cyc) % 1
    const half = Math.max(0.025, (p.width ?? 0.3) / 2)
    const cw = w / cols, ch = h / rows, g = p.gutter ?? 0
    const sw = src.width / cols, sh = src.height / rows
    ctx.clearRect(0, 0, w, h)
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      let d = Math.abs(along(p.dir ?? 'x', (i + 0.5) / cols, (j + 0.5) / rows) - pos)
      if (!p.pingpong) d = Math.min(d, 1 - d) /* the sweep wraps */
      const t = d < half ? 1 - (d / half) ** 2 : 0
      const k = 1 + ((p.zoom ?? 60) / 100) * t * t
      /* zoom IN to the cell's centre: a smaller source rect into the same cell */
      const rw = sw / k, rh = sh / k
      ctx.drawImage(src, i * sw + (sw - rw) / 2, j * sh + (sh - rh) / 2, rw, rh, i * cw + g / 2, j * ch + g / 2, cw - g, ch - g)
    }
  },
}

/* ── riso ─────────────────────────────────────────────────────────────── */

/* the labyrinth screen: a Gray-Scott maze, developed once per size and kept */
let maze = null
function labyrinth(n) {
  if (maze?.n === n) return maze.v
  const rd = new RDEngine(document.createElement('canvas'), n)
  rd.setVariation(variationById('maze'))
  for (let i = 0; i < 260; i++) rd.step()
  let lo = Infinity, hi = -Infinity
  for (const x of rd.v) { if (x < lo) lo = x; if (x > hi) hi = x }
  const v = Float32Array.from(rd.v, (x) => (x - lo) / (hi - lo || 1))
  maze = { n, v }
  return v
}

const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(String(hex).slice(i, i + 2), 16) || 0)
let scratch = null

/* ponytail: per-pixel CPU pass (~25ms at 240×300, ~0.5s a frame at 1080×1350) — right for a still photo,
   a slideshow on a moving generator; port to a GL pass (lib/glPass) if riso on motion matters */
const riso = {
  id: 'fx-riso',
  label: 'Riso',
  animated: false,
  params: [
    { key: 'paper', label: 'Paper', type: 'color', role: 'bg', default: '#f1ece0', section: 'Inks' },
    { key: 'inkA', label: 'Ink A', type: 'color', role: 'fg', default: '#1d3fbb', section: 'Inks' },
    { key: 'inkB', label: 'Ink B', type: 'color', role: 'accent', default: '#ff4f6d', section: 'Inks' },
    { key: 'screen', label: 'Screen', type: 'select', options: [{ value: 'dots', label: 'Dots' }, { value: 'labyrinth', label: 'Labyrinth' }], default: 'dots', section: 'Screen' },
    range('cell', 'Cell', 2, 16, 1, 5, 'Screen'),
    range('split', 'Split', 0.1, 0.9, 0.05, 0.45, 'Screen'),
    range('offset', 'Misregister', 0, 12, 0.5, 3, 'Print'),
    range('grain', 'Grain', 0, 1, 0.05, 0.35, 'Print'),
  ],
  apply(ctx, src, w, h, p) {
    const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h))
    scratch ??= document.createElement('canvas')
    scratch.width = W; scratch.height = H
    const s = scratch.getContext('2d', { willReadFrequently: true })
    s.drawImage(src, 0, 0, W, H)
    const img = s.getImageData(0, 0, W, H), d = img.data
    const paper = hexRgb(p.paper), A = hexRgb(p.inkA), B = hexRgb(p.inkB)
    const cell = Math.max(2, Math.round(p.cell ?? 5)), split = p.split ?? 0.45
    const off = Math.round(p.offset ?? 3), grain = p.grain ?? 0.35
    const lab = p.screen === 'labyrinth' ? labyrinth(160) : null
    /* the screen's threshold at (x, y) for an ink whose screen is turned by `rot` */
    const thr = (x, y, rot) => {
      if (lab) { const n = 160, q = (Math.floor(y / 2 + rot * 37) % n + n) % n, r = (Math.floor(x / 2 + rot * 53) % n + n) % n; return lab[q * n + r] }
      const c = Math.cos(rot), sn = Math.sin(rot)
      const xr = (x * c - y * sn) / cell, yr = (x * sn + y * c) / cell
      const fx = xr - Math.floor(xr) - 0.5, fy = yr - Math.floor(yr) - 0.5
      return Math.min(1, Math.hypot(fx, fy) * 1.414)
    }
    const lum = (i) => (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255
    const out = s.createImageData(W, H), o = out.data
    /* deterministic grain — a hash, not Math.random, so a still stays still */
    const hash = (x, y) => { const t = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return t - Math.floor(t) }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4
      /* ink A reads the shadows at (x, y); ink B the mids, misregistered by `off` */
      const xa = x, xb = Math.min(W - 1, Math.max(0, x + off)), yb = Math.min(H - 1, Math.max(0, y - off))
      const la = lum((y * W + xa) * 4), lb = lum((yb * W + xb) * 4)
      const g = 1 - grain * hash(x, y) * 0.6
      const covA = Math.max(0, (split - la) / split) * g
      const covB = Math.max(0, 1 - Math.abs(lb - split) / (1 - split) - 0.15) * g
      const inkA = covA > thr(x, y, 0.26) ? 1 : 0
      const inkB = covB > thr(x, y, 1.31) ? 1 : 0
      /* inks multiply over the paper, as riso inks overprint */
      for (let c = 0; c < 3; c++) {
        let v = paper[c] / 255
        if (inkA) v *= A[c] / 255
        if (inkB) v *= B[c] / 255
        o[k + c] = v * 255
      }
      o[k + 3] = 255
    }
    s.putImageData(out, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(scratch, 0, 0, w, h)
  },
}

export const SLICER_FX = [sliceWave, riso]
