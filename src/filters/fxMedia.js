/**
 * fx-media — the media moves (plan 26 § 4; the user, 2026-10-09: *"would you not also want to somehow
 * control the media? f.e. repeat x and y? or sweep image movement? or slight 3d tilt? … the effect is
 * very alive, but it could be combined with some basic media motion as well"*).
 *
 * A canvas-tier chain stage, pinned FIRST (`first: true` — addFilter puts it at 0), so every effect
 * after it works on the moving picture. Not on the photo schema and not a CSS transform: the fitted
 * source is cached for stills (animating it would put every still on the video path), and export
 * snapshots the live chain canvas, which a CSS transform never reaches. As a stage its params are
 * ordinary params — bind dots, keyframes, rolls, save/load and export come with it — and it runs on a
 * generator's chain the same as a photo's.
 *
 *   Tile X / Y   the source repeated (1 = as it is)
 *   Drift X / Y  whole TILES per loop, signed — the pattern's period, so the wrap never jumps
 *   Spin         whole turns per loop · Zoom about the centre
 *   Tilt X / Y   a perspective tilt (rows / columns drawn as strips — true perspective on canvas 2D,
 *                which has no 3D transform), Swing = ± degrees on one sine per loop
 *
 * Everything moving is whole cycles of `u`, so frame(0) === frame(1).
 */
import { invalidateSource } from './fxCore.js'

const TAU = Math.PI * 2
const bufs = new Map()   /* role → canvas, resized on demand */
function buf(role, w, h) {
  let c = bufs.get(role)
  if (!c) { c = document.createElement('canvas'); bufs.set(role, c) }
  if (c.width !== w) c.width = w
  if (c.height !== h) c.height = h
  return c
}

/* rows of `src` drawn into `g` as a plane tilted `a` radians about the horizontal axis (focal `f`) */
function tiltRows(g, src, W, H, a, f) {
  const s = Math.sin(a), co = Math.cos(a)
  for (let yo = 0; yo < H; yo++) {
    const y = yo - H / 2
    const den = f * co - y * s
    if (den <= 1e-6) continue
    const ys = (y * f) / den                       /* the source row this output row sees */
    const row = ys + H / 2
    if (row < 0 || row >= H) continue
    const k = f / (f + ys * s)                     /* that row's width at its depth */
    g.drawImage(src, 0, row | 0, W, 1, W / 2 - (W * k) / 2, yo, W * k, 1)
  }
}
function tiltCols(g, src, W, H, a, f) {
  const s = Math.sin(a), co = Math.cos(a)
  for (let xo = 0; xo < W; xo++) {
    const x = xo - W / 2
    const den = f * co - x * s
    if (den <= 1e-6) continue
    const xs = (x * f) / den
    const col = xs + W / 2
    if (col < 0 || col >= W) continue
    const k = f / (f + xs * s)
    g.drawImage(src, col | 0, 0, 1, H, xo, H / 2 - (H * k) / 2, 1, H * k)
  }
}

const int = (v, d = 0) => Math.round(v ?? d)
const range = (key, label, min, max, step, dflt, section, extra = {}) => ({ key, label, type: 'range', min, max, step, default: dflt, section, ...extra })

export const MEDIA_FX = [
  {
    id: 'fx-media',
    label: 'Media motion',
    animated: true,
    first: true,
    params: [
      range('tileX', 'Tile X', 1, 8, 1, 1, 'Tile'),
      range('tileY', 'Tile Y', 1, 8, 1, 1, 'Tile'),
      range('driftX', 'Drift X', -4, 4, 1, 0, 'Motion', { tab: 'anim' }),
      range('driftY', 'Drift Y', -4, 4, 1, 0, 'Motion', { tab: 'anim' }),
      range('spin', 'Spin', -4, 4, 1, 0, 'Motion', { tab: 'anim' }),
      range('zoom', 'Zoom', 0.25, 4, 0.05, 1, 'Tile'),
      range('tiltX', 'Tilt X', -60, 60, 1, 0, 'Tilt'),
      range('tiltY', 'Tilt Y', -60, 60, 1, 0, 'Tilt'),
      range('swing', 'Swing', 0, 45, 1, 0, 'Motion', { tab: 'anim' }),
      range('perspective', 'Perspective', 0.5, 6, 0.1, 2, 'Tilt'),
    ],
    apply(ctx, src, w, h, p, u) {
      const tx = Math.max(1, int(p.tileX, 1)), ty = Math.max(1, int(p.tileY, 1))
      const zoom = p.zoom ?? 1
      const rot = TAU * u * int(p.spin)
      const swing = ((p.swing ?? 0) * Math.PI / 180) * Math.sin(TAU * u)
      const ax = (p.tiltX ?? 0) * Math.PI / 180 + swing
      const ay = (p.tiltY ?? 0) * Math.PI / 180 + swing * 0.6
      const tilted = Math.abs(ax) > 1e-4 || Math.abs(ay) > 1e-4

      /* 1 — the moving pattern, into the destination or (when tilting) a buffer at the source's pixels */
      const k = src.width / w || 1
      const W = Math.round(w * k), H = Math.round(h * k)
      const flat = tilted ? buf('flat', W, H) : null
      const g = flat ? flat.getContext('2d') : ctx
      const gw = flat ? W : w, gh = flat ? H : h
      if (flat) g.setTransform(1, 0, 0, 1, 0, 0)
      g.save()
      g.clearRect(0, 0, gw, gh)
      const pat = g.createPattern(src, 'repeat')
      const tileW = gw / tx, tileH = gh / ty
      /* one tile = gw/tx × gh/ty; drift slides the pattern a whole tile per cycle */
      pat.setTransform(new DOMMatrix()
        .translate(u * int(p.driftX) * tileW, u * int(p.driftY) * tileH)
        .scale(tileW / src.width, tileH / src.height))
      g.translate(gw / 2, gh / 2)
      g.rotate(rot)
      g.scale(zoom, zoom)
      g.translate(-gw / 2, -gh / 2)
      g.fillStyle = pat
      const pad = Math.max(gw, gh) * 2 / Math.min(1, zoom)   /* cover the corners under spin / zoom-out */
      g.fillRect(-pad, -pad, gw + pad * 2, gh + pad * 2)
      g.restore()
      if (!flat) return

      /* 2 — the tilt: rows (about X), then columns (about Y), as strips */
      const f = (p.perspective ?? 2) * Math.max(W, H)
      let cur = flat
      if (Math.abs(ax) > 1e-4) {
        const r = buf('rows', W, H); const rg = r.getContext('2d')
        rg.setTransform(1, 0, 0, 1, 0, 0); rg.clearRect(0, 0, W, H)
        tiltRows(rg, cur, W, H, ax, f); cur = r
      }
      if (Math.abs(ay) > 1e-4) {
        const c = buf('cols', W, H); const cg = c.getContext('2d')
        cg.setTransform(1, 0, 0, 1, 0, 0); cg.clearRect(0, 0, W, H)
        tiltCols(cg, cur, W, H, ay, f); cur = c
      }
      ctx.drawImage(cur, 0, 0, w, h)
      invalidateSource(cur)
    },
  },
]
