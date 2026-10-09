/* Single source of truth for human-readable layer labels.
 *
 * Convention (spec R7.2, 2026-10-09): sentence case for every label, button, menu row and
 * tooltip; Title Case only for proper names (preset names, Right Grotesk). Row labels are
 * uppercased at render by SettingsRow, so the strings stay sentence case. Layer rows, inspector
 * titles, add-menu options, library item names, dropdown labels — all read from this file. */

export const TYPE_LABELS = {
  background: 'Background',
  pattern:    'Pattern',
  photo:      'Photo',
  shape:      'Shape',
  text:       'Text',
  group:      'Group',
  bool:       'Boolean',
  path:       'Path',
  loop:       'Loop',
  kinetic:    'Kinetic type',
  misc:       'Misc',
}

export const BOOL_OP_LABELS = {
  unite:     'Unite',
  subtract:  'Subtract',
  intersect: 'Intersect',
  exclude:   'Exclude',
}

export const SHAPE_KIND_LABELS = {
  logo:     'Logo',
  rect:     'Rectangle',
  ellipse:  'Ellipse',
  triangle: 'Triangle',
  line:     'Line',
  polygon:  'Polygon',
  star:     'Star',
  flatten:  'Flatten',
}

/* Inspector title — verbose form, e.g. "Shape · Rectangle". */
export function labelForLayer(layer) {
  if (layer.type === 'shape') {
    const kind = SHAPE_KIND_LABELS[layer.kind ?? 'logo'] ?? 'Shape'
    return `Shape · ${kind}`
  }
  if (layer.type === 'bool') {
    const op = BOOL_OP_LABELS[layer.op]
    return op ? `Boolean · ${op}` : TYPE_LABELS.bool
  }
  if (layer.type === 'loop' && layer.presetLabel) return `Loop · ${layer.presetLabel}`
  if (layer.type === 'misc' && layer.presetLabel) return `Misc · ${layer.presetLabel}`
  if (layer.type === 'kinetic' && layer.presetLabel) return `Kinetic · ${layer.presetLabel}`
  return TYPE_LABELS[layer.type] ?? layer.type
}

/* Compact label for a layer-stack row. A user-set `layer.name` (inline
 * rename in the layer stack) always wins, verbatim — no casing applied.
 * Otherwise shapes show their kind directly (Figma idiom — "Rectangle"
 * not "Shape · Rectangle"); text rows show the actual content (truncated
 * by the row's CSS). */
export function rowLabelForLayer(layer) {
  /* a mask says so in its row (G8) — the pair reads as mask over its target */
  if (layer.isMask) return `${rowLabelForLayer({ ...layer, isMask: false })} (mask)`
  if (layer.name) return layer.name
  if (layer.type === 'text') return layer.text || TYPE_LABELS.text
  if (layer.type === 'shape') {
    return SHAPE_KIND_LABELS[layer.kind ?? 'logo'] ?? TYPE_LABELS.shape
  }
  if (layer.type === 'bool') return BOOL_OP_LABELS[layer.op] ?? TYPE_LABELS.bool
  if (layer.type === 'loop' || layer.type === 'misc') return layer.presetLabel || TYPE_LABELS[layer.type]
  if (layer.type === 'kinetic') return layer.presetLabel || TYPE_LABELS.kinetic
  return TYPE_LABELS[layer.type] ?? layer.type
}
