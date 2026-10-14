import { resolveColor } from './state'
import { getShapeSvg, SHAPE_OPTIONS, DEFAULT_SHAPE_ID } from '../modes/pattern/shapes'
import { buildPatternSvg } from '../modes/pattern/render'

/**
 * PAINT FILLS (plan 34 § 2; Figma's paint picker, the user's selection 2026-10-13: Solid · Gradient ·
 * Pattern · Image · Video). A layer's fill is a TYPE, not only a colour:
 *
 *   layer.fill = null | { type: 'gradient' | 'pattern' | 'image' | 'video', ...params }
 *
 * Absent (or `null`) is Solid — today's `layer.color`, untouched, so every reader keeps working.
 * A non-solid fill draws as a CSS background (a gradient, a tiled pattern SVG, an image) or a
 * `<video>` in the layer's box, clipped to the shape's outline (`LayerRenderer` `PaintFillWrap`);
 * text wears the background through `background-clip: text`. The export writes the same paint as an
 * SVG `<pattern>` / gradient fill on the outline (`build.js`).
 */
export const PAINT_TYPES = [
  { value: 'solid',    label: 'Solid',    icon: 'square' },
  { value: 'gradient', label: 'Gradient', icon: 'grad-lin' },
  { value: 'pattern',  label: 'Pattern',  icon: 'ptrn-dot' },
  { value: 'image',    label: 'Image',    icon: 'image' },
  { value: 'video',    label: 'Video',    icon: 'video' },
]

export const PAINT_DEFAULTS = {
  gradient: { type: 'gradient', kind: 'linear', from: '#000000', to: '#FFFFFF', angle: 0 },
  pattern:  { type: 'pattern', shapeId: DEFAULT_SHAPE_ID, cols: 4, rows: 4, gap: 0, color: '#FFFFFF', bg: null, tile: 64 },
  image:    { type: 'image', src: null, mode: 'fill', tile: 25 },
  video:    { type: 'video', src: null, mode: 'fill' },
}

/* the param rows each type's popover body draws (AutoControls schema) */
export const PAINT_SCHEMAS = {
  gradient: [
    { key: 'kind', label: 'Type', type: 'select', default: 'linear', options: [
      { value: 'linear', label: 'Linear' }, { value: 'radial', label: 'Radial' },
      { value: 'elliptical', label: 'Elliptical' }, { value: 'conical', label: 'Conical' }] },
    { key: 'from', label: 'Start', type: 'color', default: '#000000' },
    { key: 'to', label: 'End', type: 'color', default: '#FFFFFF' },
    { key: 'angle', label: 'Angle', type: 'range', min: 0, max: 360, step: 1, default: 0, unit: '°' },
  ],
  pattern: [
    /* the pattern layer's own shapes (Custom SVG stays the pattern layer's — no paste field here) */
    { key: 'shapeId', label: 'Shape', type: 'select', default: DEFAULT_SHAPE_ID, options: SHAPE_OPTIONS.filter((o) => o.value !== 'custom') },
    { key: 'color', label: 'Color', type: 'color', default: '#FFFFFF' },
    { key: 'bg', label: 'Background', type: 'color', default: null },
    { key: 'cols', label: 'Columns', type: 'range', min: 1, max: 16, step: 1, default: 4 },
    { key: 'rows', label: 'Rows', type: 'range', min: 1, max: 16, step: 1, default: 4 },
    { key: 'gap', label: 'Gap', type: 'range', min: 0, max: 40, step: 1, default: 0 },
    { key: 'tile', label: 'Tile', type: 'range', min: 8, max: 512, step: 1, default: 64, unit: 'px' },
  ],
  image: [
    { key: 'mode', label: 'Mode', type: 'segmented', default: 'fill', options: [
      { value: 'fill', label: 'Fill' }, { value: 'fit', label: 'Fit' }, { value: 'tile', label: 'Tile' }] },
    { key: 'tile', label: 'Tile', type: 'range', min: 2, max: 100, step: 1, default: 25, unit: '%', when: (p) => p.mode === 'tile' },
  ],
  video: [
    { key: 'mode', label: 'Mode', type: 'segmented', default: 'fill', options: [
      { value: 'fill', label: 'Fill' }, { value: 'fit', label: 'Fit' }] },
  ],
}

export const hasPaintFill = (layer) => {
  const t = layer?.fill?.type
  if (t === 'gradient' || t === 'pattern') return true
  return (t === 'image' || t === 'video') && !!layer.fill.src
}

const withDefaults = (fill) => ({ ...(PAINT_DEFAULTS[fill?.type] ?? {}), ...fill })

/* the pattern as an SVG string (one tile), on the pattern layer's own engine */
export function patternSvg(fill, palette) {
  const f = withDefaults(fill)
  const shapeSvg = getShapeSvg(f.shapeId ?? DEFAULT_SHAPE_ID)
  if (!shapeSvg) return null
  return buildPatternSvg({
    shapeSvg, cols: f.cols, rows: f.rows, gap: f.gap, rules: [],
    color: resolveColor(f.color, palette) ?? '#FFFFFF',
    bg: f.bg ? (resolveColor(f.bg, palette) ?? null) : null,
    size: f.tile,
  })
}

/* a CSS background for gradient / pattern / image — the video draws as its own element */
export function paintBackground(fill, palette) {
  const f = withDefaults(fill)
  if (f.type === 'gradient') {
    const a = resolveColor(f.from, palette) ?? '#000000', b = resolveColor(f.to, palette) ?? '#FFFFFF'
    const angle = Number(f.angle) || 0
    const image = f.kind === 'radial' ? `radial-gradient(circle, ${a}, ${b})`
      : f.kind === 'elliptical' ? `radial-gradient(ellipse, ${a}, ${b})`
      : f.kind === 'conical' ? `conic-gradient(from ${angle}deg, ${a}, ${b})`
      : `linear-gradient(${angle + 90}deg, ${a}, ${b})`
    return { backgroundImage: image }
  }
  if (f.type === 'pattern') {
    const svg = patternSvg(f, palette)
    return svg ? { backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`, backgroundSize: `${f.tile}px ${f.tile}px`, backgroundRepeat: 'repeat' } : {}
  }
  if (f.type === 'image' && f.src) {
    return {
      backgroundImage: `url("${f.src}")`,
      backgroundSize: f.mode === 'fit' ? 'contain' : f.mode === 'tile' ? `${f.tile}% auto` : 'cover',
      backgroundRepeat: f.mode === 'tile' ? 'repeat' : 'no-repeat',
      backgroundPosition: 'center',
    }
  }
  return {}
}
