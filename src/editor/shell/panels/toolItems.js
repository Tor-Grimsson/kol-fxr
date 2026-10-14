import { TOOL_META } from '../../state/tools'
import { shortcutById, comboLabel } from '../../state/keymap'

/* the item builders the tools strip and the action bar share (plan 31 § 2 split ToolPalette in two) */
/* Shortcut chips come from keymap.js only (spec R9.4) — never a hand-typed '⇧H' beside it. */
export const key = (keymapId) => { const s = shortcutById(keymapId); return s ? comboLabel(s.combo) : undefined }
export const tool = (id) => ({ kind: 'tool', id, label: TOOL_META[id].label, icon: TOOL_META[id].icon, shortcut: key(`tool-${id}`) })
export const variant = (id) => ({ id, label: TOOL_META[id].label, icon: TOOL_META[id].icon, shortcut: key(`tool-${id}`) })
export const SHAPES = ['rect', 'ellipse', 'triangle', 'polygon', 'star'].map(variant)
export const BOOLEANS = [
  { id: 'unite', icon: 'boolean-unite', label: 'Unite' },
  { id: 'subtract', icon: 'boolean-subtract', label: 'Subtract' },
  { id: 'intersect', icon: 'boolean-intersect', label: 'Intersect' },
  { id: 'exclude', icon: 'boolean-exclude', label: 'Exclude' },
]
export const DIVIDER = { kind: 'divider' }
