/**
 * Shape-layer param schema — the type-specific knobs (kind + per-kind shape
 * params). Universal layer props (position, transform, fill/stroke, opacity)
 * are NOT here; they're shared controls the inspector renders directly.
 *
 * Structural params (sides/points/innerRatio/slope) are marked non-animatable
 * for now — integer/enum morphs read as jank; revisit per-param if wanted.
 */

const KIND_OPTIONS = [
  { value: 'logo',     label: 'Logo'      },
  { value: 'rect',     label: 'Rectangle' },
  { value: 'ellipse',  label: 'Ellipse'   },
  { value: 'triangle', label: 'Triangle'  },
  { value: 'line',     label: 'Line'      },
  { value: 'polygon',  label: 'Polygon'   },
  { value: 'star',     label: 'Star'      },
  { value: 'flatten',  label: 'Flatten'   },
]
const LOGO_VARIANTS = [
  { value: 'logomark',    label: 'Logomark' },
  { value: 'wordmark',    label: 'Wordmark' },
  { value: 'lockup-hori', label: 'Lockup · horizontal' },
  { value: 'lockup-vert', label: 'Lockup · vertical' },
]
const FIT_OPTIONS = [
  { value: 'fill',    label: 'Stretch (fill)' },
  { value: 'contain', label: 'Aspect (contain)' },
]
const SLOPE_OPTIONS = [
  { value: '\\', label: '↘' },
  { value: '/',  label: '↗' },
]

const isKind = (k) => (l) => (l.kind ?? 'logo') === k
const isKinds = (...ks) => (l) => ks.includes(l.kind ?? 'logo')

export const SHAPE_SCHEMA = [
  { key: 'kind',       label: 'Kind',        type: 'select',    default: 'logo',     options: KIND_OPTIONS },
  { key: 'variant',    label: 'Variant',     type: 'select',    default: 'logomark', options: LOGO_VARIANTS, when: isKind('logo') },
  { key: 'fit',        label: 'Fit',         type: 'segmented', default: 'fill',     options: FIT_OPTIONS,   when: isKind('flatten') },
  { key: 'sides',      label: 'Sides',       type: 'range', min: 3, max: 12, step: 1,    default: 5,   format: (v) => `${v}`,     when: isKind('polygon'), animatable: false, section: 'Geometry' },
  { key: 'points',     label: 'Points',      type: 'range', min: 3, max: 12, step: 1,    default: 5,   format: (v) => `${v}`,     when: isKind('star'),    animatable: false, section: 'Geometry' },
  { key: 'innerRatio', label: 'Inner ratio', type: 'range', min: 0.2, max: 0.9, step: 0.05, default: 0.5, format: (v) => v.toFixed(2), when: isKind('star'),    animatable: false, section: 'Geometry' },
  { key: 'slope',      label: 'Slope',       type: 'segmented', default: '\\',        options: SLOPE_OPTIONS, when: isKind('line'), section: 'Geometry' },
  /* EVERY PRIMITIVE HAS PARAMETERS (the user's 21 — a triangle showed Kind only). One geometry
     source (shape-math: roundCorners · trianglePoints apex · the ellipse arc) feeds the render, the
     export, the booleans and Convert to path, so each of these reads the same in all four. */
  { key: 'apex',       label: 'Apex',        type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, format: (v) => `${Math.round(v * 100)}%`, when: isKind('triangle'), animatable: false, section: 'Geometry' },
  { key: 'arcStart',   label: 'Arc start',   type: 'range', min: 0, max: 360, step: 1,  default: 0,   format: (v) => `${v}°`, when: isKind('ellipse'), animatable: false, section: 'Geometry' },
  { key: 'arcEnd',     label: 'Arc end',     type: 'range', min: 0, max: 360, step: 1,  default: 360, format: (v) => `${v}°`, when: isKind('ellipse'), animatable: false, section: 'Geometry' },
  { key: 'radius',     label: 'Corner radius', type: 'range', min: 0, max: 200, step: 1, default: 0, format: (v) => `${v}`, when: isKinds('rect', 'triangle', 'polygon', 'star'), animatable: false, section: 'Geometry' },
]
