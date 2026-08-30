/**
 * Editor keymap — single source of truth for keyboard shortcuts.
 *
 * Each entry is `{ id, combo, label, section, hidden?, views? }`. The canvas key
 * handler uses `matchAny(event)` to look up the matching shortcut by combo;
 * the ShortcutsOverlay reads SHORTCUTS to render the cheat sheet (skipping
 * `hidden: true` entries).
 *
 * `views` — WHICH CHROME THE KEY IS TRUE IN (added 2026-08-15). Omit it and the
 * shortcut is universal, which is what every pre-existing entry means, so
 * nothing had to be re-declared.
 *
 * It exists because this file was quietly LYING. `R` is the Rectangle tool in
 * the editor, but in labs `LabsParams.jsx`'s `useLabsKeys` binds `R` to reset
 * and `Shift+R` to reroll in its own window listener — and the cheat sheet,
 * reading only this file, showed the editor's answer in both chromes. That gap
 * is also why labs kept a second hand-maintained key list of its own: there was
 * no way to say "this one is labs'".
 *
 * A key that genuinely differs per chrome is TWO entries with different `views`,
 * not one entry with a vague label.
 *
 * Combo grammar: `Mod+Shift+Alt+Key`. `Mod` = ⌘ on Mac, Ctrl elsewhere.
 * Keys are either a single character (case-insensitive for letters) or a
 * named key like `ArrowLeft`, `Escape`, `Space`, `Backspace`, `Delete`,
 * `Tab`, `Enter`.
 */

export const SHORTCUTS = [
  /* Edit */
  { id: 'undo',        combo: 'Mod+Z',       label: 'Undo',                     section: 'Edit', views: ['editor'] },
  { id: 'redo',        combo: 'Mod+Shift+Z', label: 'Redo',                     section: 'Edit', views: ['editor'] },
  { id: 'redo-alt',    combo: 'Mod+Y',       label: 'Redo',                     section: 'Edit', hidden: true, views: ['editor'] },
  { id: 'duplicate',   combo: 'Mod+D',       label: 'Duplicate selection',      section: 'Edit', views: ['editor'] },
  { id: 'delete-back', combo: 'Backspace',   label: 'Delete selection',         section: 'Edit', views: ['editor'] },
  { id: 'delete-fwd',  combo: 'Delete',      label: 'Delete selection',         section: 'Edit', hidden: true, views: ['editor'] },

  /* Selection */
  { id: 'deselect',    combo: 'Escape',      label: 'Deselect',                 section: 'Selection', views: ['editor'] },
  { id: 'group',       combo: 'Mod+G',       label: 'Group selection',          section: 'Selection', views: ['editor'] },
  { id: 'ungroup',     combo: 'Mod+Shift+G', label: 'Ungroup',                  section: 'Selection', views: ['editor'] },

  /* Layer */
  { id: 'toggle-lock',       combo: 'L',                  label: 'Toggle lock',          section: 'Layer', views: ['editor'] },
  { id: 'toggle-visibility', combo: 'H',                  label: 'Toggle visibility',    section: 'Layer', views: ['editor'] },
  { id: 'flip-h',            combo: 'Shift+H',            label: 'Flip horizontal',      section: 'Layer', views: ['editor'] },
  { id: 'flip-v',            combo: 'Shift+V',            label: 'Flip vertical',        section: 'Layer', views: ['editor'] },
  { id: 'nudge-left',        combo: 'ArrowLeft',          label: 'Nudge ← 1px',          section: 'Layer', views: ['editor'] },
  { id: 'nudge-right',       combo: 'ArrowRight',         label: 'Nudge → 1px',          section: 'Layer', views: ['editor'] },
  { id: 'nudge-up',          combo: 'ArrowUp',            label: 'Nudge ↑ 1px',          section: 'Layer', views: ['editor'] },
  { id: 'nudge-down',        combo: 'ArrowDown',          label: 'Nudge ↓ 1px',          section: 'Layer', views: ['editor'] },
  { id: 'nudge-left-10',     combo: 'Shift+ArrowLeft',    label: 'Nudge ← 10px',         section: 'Layer', hidden: true, views: ['editor'] },
  { id: 'nudge-right-10',    combo: 'Shift+ArrowRight',   label: 'Nudge → 10px',         section: 'Layer', hidden: true, views: ['editor'] },
  { id: 'nudge-up-10',       combo: 'Shift+ArrowUp',      label: 'Nudge ↑ 10px',         section: 'Layer', hidden: true, views: ['editor'] },
  { id: 'nudge-down-10',     combo: 'Shift+ArrowDown',    label: 'Nudge ↓ 10px',         section: 'Layer', hidden: true, views: ['editor'] },

  /* Tools — the compositor's, so EDITOR ONLY. Labs has no canvas tools, and
     `R` in particular is reset there (see the Labs block below). */
  { id: 'tool-select',  combo: 'V', label: 'Select tool',       section: 'Tools', views: ['editor'] },
  { id: 'node-edit',    combo: 'A', label: 'Edit path nodes',   section: 'Tools', views: ['editor'] },
  { id: 'tool-text',    combo: 'T', label: 'Text tool',         section: 'Tools', views: ['editor'] },
  { id: 'tool-pen',     combo: 'P', label: 'Pen tool',          section: 'Tools', views: ['editor'] },
  { id: 'tool-rect',    combo: 'R', label: 'Rectangle tool',    section: 'Tools', views: ['editor'] },
  { id: 'tool-ellipse', combo: 'O', label: 'Ellipse tool',      section: 'Tools', views: ['editor'] },
  { id: 'tool-zoom',    combo: 'Z', label: 'Zoom tool',         section: 'Tools', views: ['editor'] },
  { id: 'tool-orbit',   combo: 'C', label: 'Orbit tool (3D camera)', section: 'Tools', views: ['editor', 'labs'] },

  /* View */
  { id: 'toggle-grid',  combo: 'G', label: 'Show/hide grid',    section: 'View' },
  { id: 'toggle-rail',  combo: '\\', label: 'Show / hide rail',  section: 'View' },

  /* Color */
  { id: 'paint-default', combo: 'D',       label: 'Default fill + stroke (white / black)', section: 'Color', views: ['editor'] },
  { id: 'paint-toggle',  combo: 'X',       label: 'Toggle fill / stroke focus',            section: 'Color', views: ['editor'] },
  { id: 'paint-swap',    combo: 'Shift+X', label: 'Swap fill and stroke colors',           section: 'Color', views: ['editor'] },
  { id: 'paint-clear',   combo: 'N',       label: 'Clear focused paint (none)',            section: 'Color', views: ['editor'] },
  { id: 'paint-clear',   combo: '/',       label: 'Clear focused paint (none)',            section: 'Color', hidden: true, views: ['editor'] },

  /* Layer opacity — digits are handled bespoke in CanvasArea (a combo can't
   * express ranges or the double-0 chord); documented here for the cheat
   * sheet. */
  { id: 'opacity-digits', combo: '1–9',   label: 'Layer opacity 10–90%',    section: 'Layer', passive: true, views: ['editor'] },
  { id: 'opacity-full',   combo: '0',     label: 'Layer opacity 100%',      section: 'Layer', passive: true, views: ['editor'] },
  { id: 'opacity-zero',   combo: '00',    label: 'Layer opacity 0%',        section: 'Layer', passive: true, views: ['editor'] },

  /* View */
  { id: 'show-shortcuts', combo: 'S',     label: 'Show / hide shortcuts',   section: 'View' },
  /* The settings DRAWER, not the `/settings` page (that is the rail's ⌥6).
   * Bound in `EditorShell.jsx`, where the drawer lives — `passive` here for the
   * same reason `fps` is: declared for the cheat sheet, dispatched at the
   * surface that owns it. EVERY chrome renders EditorShell, so it answers in
   * the editor, labs and the randomiser alike; the shell pages (home, library,
   * settings) render no chrome and never bind it. `,` because `S` is the
   * shortcuts overlay and every tool letter is spoken for. */
  { id: 'settings-drawer', combo: ',',    label: 'Show / hide settings',    section: 'View', passive: true },
  { id: 'toggle-dots',    combo: 'M',     label: 'Show / hide modulation dots', section: 'View' },
  /* Dispatched by state/useGlobalShortcuts.js onto the DS switch
   * (`usePlaceholders().toggle`, kol-component 0.46.0). No longer `passive`:
   * it was passive because components/Hint.jsx bound its own window listener,
   * and that duplicate listener is gone. */
  { id: 'toggle-hints',   combo: 'I',     label: 'Show / hide placeholder text', section: 'View' },
  { id: 'toggle-rulers',  combo: 'Shift+R', label: 'Show / hide rulers',    section: 'View', views: ['editor'] },
  { id: 'pan',            combo: 'Space', label: 'Play / pause · hold + drag to pan', section: 'View', passive: true },
  /* Handled inside the canvas viewport (window keydown, input-guarded) —
   * documented here for the cheat sheet only. */
  { id: 'fps',            combo: 'F',     label: 'Toggle fps readout',      section: 'View', passive: true },
  /* Labs — bound by `useLabsKeys` in labs/LabsParams.jsx, NOT by the canvas
     handler. Declared here so the cheat sheet stops showing the editor's
     answer for `R` while standing in labs. */
  { id: 'labs-reset',  combo: 'R',       label: 'Reset to defaults', section: 'Labs', views: ['labs'] },
  { id: 'labs-reroll', combo: 'Shift+R', label: 'Reroll',            section: 'Labs', views: ['labs'] },
]

const KEY_LABELS = {
  Mod:        '⌘',
  Shift:      '⇧',
  Alt:        '⌥',
  Ctrl:       '⌃',
  ArrowLeft:  '←',
  ArrowRight: '→',
  ArrowUp:    '↑',
  ArrowDown:  '↓',
  Backspace:  '⌫',
  Delete:     'Del',
  Escape:     'Esc',
  Space:      'Space',
  Tab:        'Tab',
  Enter:      '⏎',
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

/* Parse a combo string into its constituent parts. */
/* The `KeyboardEvent.code` for a single-character key — letters and digits by
 * rule, punctuation by name. Null for anything not listed, which falls back to
 * the `e.key` comparison. */
const PUNCT_CODE = {
  ',': 'Comma', '.': 'Period', '/': 'Slash', '\\': 'Backslash',
  ';': 'Semicolon', "'": 'Quote', '[': 'BracketLeft', ']': 'BracketRight',
  '-': 'Minus', '=': 'Equal', '`': 'Backquote',
}
function codeFor(key) {
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`
  if (/^[0-9]$/.test(key)) return `Digit${key}`
  return PUNCT_CODE[key] ?? null
}

function parseCombo(combo) {
  const parts = combo.split('+')
  return {
    needsMod:   parts.includes('Mod'),
    needsShift: parts.includes('Shift'),
    needsAlt:   parts.includes('Alt'),
    key:        parts[parts.length - 1],
  }
}

/* Match a KeyboardEvent against a combo string. */
/* One entry by id — for a surface that binds its own key (a `passive` entry)
 * and must not re-type the combo the cheat sheet is showing. */
export function shortcutById(id) {
  return SHORTCUTS.find((s) => s.id === id)
}

export function matchCombo(event, combo) {
  const { needsMod, needsShift, needsAlt, key } = parseCombo(combo)
  const modPressed = isMac() ? event.metaKey : event.ctrlKey

  if (needsMod !== modPressed) return false
  if (needsShift !== event.shiftKey) return false
  if (needsAlt !== event.altKey) return false

  /* ALT REWRITES `e.key` ON macOS — ⌥, is `≤`, ⌥1 is `¡`. So an Alt combo is
   * matched on the PHYSICAL key (`e.code`), which Option does not touch; the
   * same reason AppLayout's ⌥-digit map reads `Digit1`… Non-Alt combos keep
   * matching `e.key`, which is what every existing entry means. */
  if (key.length === 1) {
    if (needsAlt) {
      const code = codeFor(key)
      return code ? event.code === code : event.key.toLowerCase() === key.toLowerCase()
    }
    return event.key.toLowerCase() === key.toLowerCase()
  }
  if (key === 'Space') return event.code === 'Space'
  return event.key === key || event.code === key
}

/* Find the first SHORTCUTS entry that matches the given event. Skips
 * entries flagged `passive: true` (those are documented but handled
 * elsewhere — e.g. Space-pan in PanViewport). */
/* `view` scopes the lookup (2026-08-15). Without it `R` now matches two
 * entries — `tool-rect` (editor) and `labs-reset` (labs) — and the first in
 * array order wins, which would be the editor's answer while standing in labs.
 * No live caller was affected when this landed (the only dispatcher filters by
 * an id allow-list), but an unscoped lookup is a wrong answer waiting for its
 * second caller. */
export function matchAny(event, shortcuts = SHORTCUTS, view) {
  for (const s of shortcuts) {
    if (s.passive) continue
    if (!appliesToView(s, view)) continue
    if (matchCombo(event, s.combo)) return s
  }
  return null
}

/* Render a combo as glyphs for display: 'Mod+Shift+Z' → '⌘⇧Z'. */
export function comboLabel(combo) {
  return combo.split('+').map((p) => KEY_LABELS[p] ?? p).join('')
}

/* True when a shortcut applies in `view`. No `views` field = universal, which
 * is what every entry written before 2026-08-15 means. Passing no view at all
 * returns everything, so a caller that does not care is unaffected. */
export const appliesToView = (s, view) => !view || !s.views || s.views.includes(view)

/* Group SHORTCUTS by section, preserving SHORTCUTS order within each group.
 * Skips hidden entries, and entries that do not apply in `view`.
 *
 * `view` is 'editor' | 'labs' | 'randomiser' — the same ids `mode.js` uses.
 * Omit it and you get the full map, the pre-2026-08-15 behaviour. */
export function shortcutsBySection(view) {
  const groups = new Map()
  for (const s of SHORTCUTS) {
    if (s.hidden) continue
    if (!appliesToView(s, view)) continue
    if (!groups.has(s.section)) groups.set(s.section, [])
    groups.get(s.section).push(s)
  }
  return [...groups.entries()].map(([section, items]) => ({ section, items }))
}
