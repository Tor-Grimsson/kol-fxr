/**
 * Radar canvas FX — the seven pixel post-fx of kol-labs-single
 * radar/hooks/useCanvasFx.js (the postfx chain shared by the radar + live
 * pages), reshaped to the filter contract via fxCore's runFx(). Processors
 * are the labs originals; where the labs chain was driven by wall-clock UI
 * state, motion here weaves the transport's u∈[0,1] with INTEGER cycles so
 * frame(0) === frame(1) exactly:
 *   fx-chromatic  wobble — offset amplitude breathes on one sine cycle
 *   fx-pixelsort  sweep  — threshold swings ±sweep·50 on one sine cycle
 *   fx-kaleido    spin   — whole 360° turns per loop (rotation is 360-periodic)
 * The rest are static (`animated: false`).
 */
import { AMOUNT_PARAM, runFx, glFx, stillUnless } from './fxCore.js'

const TAU = Math.PI * 2

/* ── processors (srcData, outData, w, h, params) — labs originals ─────── */

function fxChromatic(sd, od, w, h, q) {
  const ox = q.offsetX | 0
  const oy = q.offsetY | 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) << 2
      // R from (x - ox, y - oy), G from centre, B from (x + ox, y + oy)
      const rx = Math.max(0, Math.min(w - 1, x - ox))
      const ry = Math.max(0, Math.min(h - 1, y - oy))
      const ri = (ry * w + rx) << 2
      const bx = Math.max(0, Math.min(w - 1, x + ox))
      const by = Math.max(0, Math.min(h - 1, y + oy))
      const bi = (by * w + bx) << 2
      od[i] = sd[ri]
      od[i + 1] = sd[i + 1]
      od[i + 2] = sd[bi + 2]
      od[i + 3] = sd[i + 3]
    }
  }
}

const lumAt = (sd, i) => sd[i] * 0.299 + sd[i + 1] * 0.587 + sd[i + 2] * 0.114

function fxEdgeDetect(sd, od, w, h, q) {
  const thresh = (q.threshold / 100) * 255
  const inv = q.invert ? 1 : 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      // luminance over the 3x3 neighbourhood, unrolled Sobel
      const tl = lumAt(sd, ((y - 1) * w + (x - 1)) << 2)
      const tc = lumAt(sd, ((y - 1) * w + x) << 2)
      const tr = lumAt(sd, ((y - 1) * w + (x + 1)) << 2)
      const ml = lumAt(sd, (y * w + (x - 1)) << 2)
      const mr = lumAt(sd, (y * w + (x + 1)) << 2)
      const bl = lumAt(sd, ((y + 1) * w + (x - 1)) << 2)
      const bc = lumAt(sd, ((y + 1) * w + x) << 2)
      const br = lumAt(sd, ((y + 1) * w + (x + 1)) << 2)
      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br
      let mag = Math.sqrt(gx * gx + gy * gy) > thresh ? 255 : 0
      if (inv) mag = 255 - mag
      const i = (y * w + x) << 2
      od[i] = mag
      od[i + 1] = mag
      od[i + 2] = mag
      od[i + 3] = sd[i + 3]
    }
  }
  // border rows/columns: black (or white if inverted)
  const edgeVal = inv ? 255 : 0
  for (let x = 0; x < w; x++) {
    const t = x << 2
    const b = ((h - 1) * w + x) << 2
    od[t] = od[t + 1] = od[t + 2] = edgeVal; od[t + 3] = sd[t + 3]
    od[b] = od[b + 1] = od[b + 2] = edgeVal; od[b + 3] = sd[b + 3]
  }
  for (let y = 0; y < h; y++) {
    const l = (y * w) << 2
    const r = (y * w + w - 1) << 2
    od[l] = od[l + 1] = od[l + 2] = edgeVal; od[l + 3] = sd[l + 3]
    od[r] = od[r + 1] = od[r + 2] = edgeVal; od[r + 3] = sd[r + 3]
  }
}

function fxPosterize(sd, od, w, h, q) {
  const n = Math.max(2, q.levels | 0) - 1
  for (let i = 0; i < sd.length; i += 4) {
    od[i] = Math.round(sd[i] / 255 * n) / n * 255
    od[i + 1] = Math.round(sd[i + 1] / 255 * n) / n * 255
    od[i + 2] = Math.round(sd[i + 2] / 255 * n) / n * 255
    od[i + 3] = sd[i + 3]
  }
}

/* Pixel-sort segment scratch. The labs version allocated an object per pixel
 * per segment per frame; the sweep makes this filter animated, so instead
 * each entry packs quantized luma (16 bits) above the RGBA bytes (32 bits)
 * in one float64 (48 bits — exact): a plain numeric TypedArray sort orders
 * by luma and carries the pixel along. Buffer reused across frames. */
let segBuf = new Float64Array(0)

function sortSegment(data, start, stride, len) {
  if (len < 2) return
  if (segBuf.length < len) segBuf = new Float64Array(len)
  for (let i = 0; i < len; i++) {
    const idx = start + i * stride
    const lum = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114
    const packed = ((data[idx] * 256 + data[idx + 1]) * 256 + data[idx + 2]) * 256 + data[idx + 3]
    segBuf[i] = Math.round(lum * 256) * 4294967296 + packed
  }
  segBuf.subarray(0, len).sort()
  for (let i = 0; i < len; i++) {
    const idx = start + i * stride
    const p = segBuf[i] % 4294967296
    data[idx] = (p >>> 24) & 0xff
    data[idx + 1] = (p >>> 16) & 0xff
    data[idx + 2] = (p >>> 8) & 0xff
    data[idx + 3] = p & 0xff
  }
}

/* The deal path (plan 27 close-out — a moving Pixel sort held 30 fps at retina). A still source's
 * sort keys never change, only the threshold does. So once per source, every line's pixels are put
 * in key order (one native sort of the frame's keys, ~0.4 s at 2160×2700). A frame then needs no
 * sort: one pass finds the segments, a second walks the line in key order and deals each pixel to
 * the next slot of its segment — linear, whatever the threshold, and identical output (equal keys
 * are equal pixels). Keyed on the base pixel array buffersFor hands out (a new source = a new
 * array), and only once that array comes back unchanged on a second frame: a source that moves
 * every frame keeps the direct path and never pays the ordering. */
const orderCache = new WeakMap()
let lastSd = null
let segId = new Int32Array(0), segStart = new Int32Array(0), segCur = new Int32Array(0)
function orderFor(sd, w, h, vertical) {
  let R = orderCache.get(sd)
  if (!R) {
    const n = sd.length >> 2
    const lum = new Float64Array(n)   /* the threshold test must match the direct path bit for bit */
    const keys = new Float64Array(n)
    for (let p = 0, i = 0; p < n; p++, i += 4) {
      const l = sd[i] * 0.299 + sd[i + 1] * 0.587 + sd[i + 2] * 0.114
      lum[p] = l
      keys[p] = Math.round(l * 256) * 4294967296 + ((sd[i] * 256 + sd[i + 1]) * 256 + sd[i + 2]) * 256 + sd[i + 3]
    }
    /* every pixel's place in key order: rank by binary search into the sorted keys, ties dealt in turn */
    const sorted = Float64Array.from(keys).sort()
    const slot = new Uint32Array(n)
    for (let r = 0; r < n; r++) slot[r] = r
    const ord = new Uint32Array(n)
    for (let p = 0; p < n; p++) {
      const k = keys[p]
      let lo = 0, hi = n - 1
      while (lo < hi) { const m = (lo + hi) >>> 1; if (sorted[m] < k) lo = m + 1; else hi = m }
      ord[slot[lo]++] = p
    }
    R = { lum, ord, lines: {} }
    orderCache.set(sd, R)
  }
  /* per direction, each line's positions in key order (built in one walk of the global order) */
  const dir = vertical ? 'v' : 'h'
  if (!R.lines[dir]) {
    const n = R.ord.length, L = new Uint16Array(n), fill = new Uint32Array(vertical ? w : h)
    for (let r = 0; r < n; r++) {
      const p = R.ord[r], y = (p / w) | 0, x = p - y * w
      if (vertical) L[x * h + fill[x]++] = y
      else L[y * w + fill[y]++] = x
    }
    R.lines[dir] = L
  }
  return R
}

function fxPixelSort(sd, od, w, h, q) {
  const stable = sd === lastSd
  lastSd = sd
  if (!stable) { pixelSortDirect(sd, od, w, h, q); return }
  const vertical = q.vertical
  const { lum, lines } = orderFor(sd, w, h, vertical)
  const L = lines[vertical ? 'v' : 'h']
  const thresh = (q.threshold / 100) * 255
  od.set(sd)
  const out = new Uint32Array(od.buffer, od.byteOffset, od.length >> 2)
  const src = new Uint32Array(sd.buffer, sd.byteOffset, sd.length >> 2)
  const nLines = vertical ? w : h, along = vertical ? h : w, step = vertical ? w : 1
  if (segId.length < along) { segId = new Int32Array(along); segStart = new Int32Array(along); segCur = new Int32Array(along) }
  for (let l = 0; l < nLines; l++) {
    const base = vertical ? l : l * w
    let ns = 0, s = -1
    for (let a = 0; a <= along; a++) {
      if (a < along && lum[base + a * step] > thresh) {
        if (s < 0) { s = a; segStart[ns] = a; segCur[ns] = 0 }
        segId[a] = ns
      } else {
        if (s >= 0) { ns++; s = -1 }
        if (a < along) segId[a] = -1
      }
    }
    if (!ns) continue
    const lo = l * along
    for (let k = 0; k < along; k++) {
      const a = L[lo + k], id = segId[a]
      if (id >= 0) out[base + (segStart[id] + segCur[id]++) * step] = src[base + a * step]
    }
  }
}

function pixelSortDirect(sd, od, w, h, q) {
  const thresh = (q.threshold / 100) * 255
  const vertical = q.vertical
  od.set(sd)
  if (vertical) {
    for (let x = 0; x < w; x++) {
      let segStart = -1
      for (let y = 0; y <= h; y++) {
        const idx = y < h ? (y * w + x) << 2 : -1
        const bright = idx >= 0 ? lumAt(sd, idx) : 0
        if (idx >= 0 && bright > thresh) {
          if (segStart < 0) segStart = y
        } else if (segStart >= 0) {
          sortSegment(od, (segStart * w + x) << 2, w << 2, y - segStart)
          segStart = -1
        }
      }
    }
  } else {
    for (let y = 0; y < h; y++) {
      let segStart = -1
      for (let x = 0; x <= w; x++) {
        const idx = x < w ? (y * w + x) << 2 : -1
        const bright = idx >= 0 ? lumAt(sd, idx) : 0
        if (idx >= 0 && bright > thresh) {
          if (segStart < 0) segStart = x
        } else if (segStart >= 0) {
          sortSegment(od, (y * w + segStart) << 2, 4, x - segStart)
          segStart = -1
        }
      }
    }
  }
}

function fxMirror(sd, od, w, h, q) {
  od.set(sd)
  if (q.axis === 'vertical') {
    // copy top half to bottom
    const halfH = h >> 1
    for (let y = 0; y < halfH; y++) {
      const srcRow = (y * w) << 2
      const dstRow = ((h - 1 - y) * w) << 2
      for (let x = 0; x < w; x++) {
        const si = srcRow + (x << 2)
        const di = dstRow + (x << 2)
        od[di] = sd[si]
        od[di + 1] = sd[si + 1]
        od[di + 2] = sd[si + 2]
        od[di + 3] = sd[si + 3]
      }
    }
  } else {
    // copy left half to right
    const halfW = w >> 1
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < halfW; x++) {
        const si = (y * w + x) << 2
        const di = (y * w + (w - 1 - x)) << 2
        od[di] = sd[si]
        od[di + 1] = sd[si + 1]
        od[di + 2] = sd[si + 2]
        od[di + 3] = sd[si + 3]
      }
    }
  }
}

// Kaleidoscope — N-fold mirrored radial symmetry. Each output pixel folds its
// angle (about the centre) into one wedge of 2π/segments, mirrored within the
// wedge, then samples the source there (nearest, edge-clamped). A fragment
// shader (plan 27 § 3) — the per-pixel JS pass ran the frame at 15 fps.
const KALEIDO = /* glsl */`
uniform float uSeg, uRot;
vec4 fx(ivec2 p) {
  vec2 c = uRes * 0.5;
  vec2 d = vec2(p) - c;
  float r = length(d);
  float wedge = 6.283185307179586 / uSeg;
  float a = atan(d.y, d.x) - uRot;
  a -= floor(a / wedge) * wedge;
  if (a > wedge * 0.5) a = wedge - a;
  a += uRot;
  return srcAt(ivec2(floor(c + r * vec2(cos(a), sin(a)) + 0.5)));
}
`

function fxThreshold(sd, od, w, h, q) {
  const level = (q.level / 100) * 255
  for (let i = 0; i < sd.length; i += 4) {
    const val = lumAt(sd, i) >= level ? 255 : 0
    od[i] = val
    od[i + 1] = val
    od[i + 2] = val
    od[i + 3] = sd[i + 3]
  }
}

/* ── filter defs ──────────────────────────────────────────────────────── */

const AXIS_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
]

export const RADAR_FX = [
  {
    id: 'fx-chromatic',
    label: 'RGB Split',
    stillKey: stillUnless('wobble'),   /* plan 27 § 1 */
    params: [
      { key: 'offsetX', label: 'Offset X', type: 'range', min: 0, max: 50, step: 1, default: 5 },
      { key: 'offsetY', label: 'Offset Y', type: 'range', min: 0, max: 50, step: 1, default: 0 },
      { key: 'wobble', label: 'Wobble', type: 'range', min: 0, max: 1, step: 0.05, default: 0 },
      AMOUNT_PARAM,
    ],
    apply(ctx, src, w, h, p, u) {
      const amp = 1 + (p.wobble ?? 0) * Math.sin(TAU * u)
      /* channel offsets in css px → source-pixel space (k = 1 at dpr 1). */
      const k = src.width / w || 1
      runFx(ctx, src, w, h, fxChromatic, { offsetX: (p.offsetX ?? 5) * amp * k, offsetY: (p.offsetY ?? 0) * amp * k }, p.amount)
    },
  },
  {
    id: 'fx-edge',
    label: 'Edge Detect',
    animated: false,
    params: [
      { key: 'threshold', label: 'Threshold', type: 'range', min: 0, max: 100, step: 1, default: 30 },
      { key: 'invert', label: 'Invert', type: 'toggle', default: false },
      AMOUNT_PARAM,
    ],
    apply(ctx, src, w, h, p) {
      runFx(ctx, src, w, h, fxEdgeDetect, { threshold: p.threshold ?? 30, invert: !!p.invert }, p.amount)
    },
  },
  {
    id: 'fx-posterize',
    label: 'Posterize',
    animated: false,
    params: [
      { key: 'levels', label: 'Levels', type: 'range', min: 2, max: 32, step: 1, default: 4 },
      AMOUNT_PARAM,
    ],
    apply(ctx, src, w, h, p) {
      runFx(ctx, src, w, h, fxPosterize, { levels: p.levels ?? 4 }, p.amount)
    },
  },
  {
    id: 'fx-pixelsort',
    label: 'Pixel Sort',
    stillKey: stillUnless('sweep'),   /* plan 27 § 1 */
    params: [
      { key: 'threshold', label: 'Threshold', type: 'range', min: 0, max: 100, step: 1, default: 50 },
      { key: 'direction', label: 'Direction', type: 'select', options: AXIS_OPTIONS, default: 'horizontal' },
      { key: 'sweep', label: 'Sweep', type: 'range', min: 0, max: 1, step: 0.05, default: 0 },
      AMOUNT_PARAM,
    ],
    apply(ctx, src, w, h, p, u) {
      const t = (p.threshold ?? 50) + (p.sweep ?? 0) * 50 * Math.sin(TAU * u)
      const q = { threshold: Math.max(0, Math.min(100, t)), vertical: p.direction === 'vertical' }
      runFx(ctx, src, w, h, fxPixelSort, q, p.amount)
    },
  },
  {
    id: 'fx-mirror',
    label: 'Mirror',
    animated: false,
    params: [
      { key: 'axis', label: 'Axis', type: 'select', options: AXIS_OPTIONS, default: 'horizontal' },
      AMOUNT_PARAM,
    ],
    apply(ctx, src, w, h, p) {
      runFx(ctx, src, w, h, fxMirror, { axis: p.axis ?? 'horizontal' }, p.amount)
    },
  },
  {
    id: 'fx-kaleido',
    label: 'Kaleidoscope',
    stillKey: stillUnless('spin'),   /* plan 27 § 1 */
    params: [
      { key: 'segments', label: 'Segments', type: 'range', min: 2, max: 16, step: 1, default: 6 },
      { key: 'angle', label: 'Angle', type: 'range', min: 0, max: 360, step: 1, default: 0 },
      { key: 'spin', label: 'Spin · turns', type: 'range', min: -8, max: 8, rMin: -2, rMax: 2, step: 1, default: 0 },
      AMOUNT_PARAM,
    ],
    apply(ctx, src, w, h, p, u) {
      glFx(ctx, src, w, h, KALEIDO, {
        uSeg: Math.max(2, (p.segments ?? 6) | 0),
        uRot: (((p.angle ?? 0) + 360 * u * Math.round(p.spin ?? 0)) * Math.PI) / 180,
      }, p.amount)
    },
  },
  {
    id: 'fx-threshold',
    label: 'Threshold',
    animated: false,
    params: [
      { key: 'level', label: 'Level', type: 'range', min: 0, max: 100, step: 1, default: 50 },
      AMOUNT_PARAM,
    ],
    apply(ctx, src, w, h, p) {
      runFx(ctx, src, w, h, fxThreshold, { level: p.level ?? 50 }, p.amount)
    },
  },
]
