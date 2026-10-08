import { useEffect } from 'react'
import { usePlaceholders } from '@kolkrabbi/kol-component'
import { matchAny } from './keymap'
import { useComposeState } from '../compose/state'

/**
 * useGlobalShortcuts — keymap dispatcher for shortcuts that should work in
 * EVERY mode, not just Compose. Mounted by EditorShell so palette / pattern
 * / type all get undo, redo, deselect, etc.
 *
 * Compose-only shortcuts (delete layer, group, paint focus, tools) stay in
 * CanvasArea's local handler — they're only meaningful when CanvasArea is
 * mounted.
 *
 * Inputs and contentEditable elements are skipped so typing doesn't trigger
 * shortcuts (matches the local CanvasArea dispatcher's behavior).
 */
const GLOBAL_IDS = new Set(['undo', 'redo', 'redo-alt', 'deselect', 'toggle-grid', 'toggle-hints'])

export function useGlobalShortcuts() {
  const { undo, redo, canUndo, canRedo, select, toggleGrid } = useComposeState()
  /* Placeholder prose is the DS's switch now (kol-component 0.46.0). It used
   * to be a module-scope window listener inside components/Hint.jsx, bound
   * because hints render under three different shells — but this dispatcher
   * is already mounted by EditorShell for exactly that reason, so the second
   * listener was never needed. The DS deliberately does NOT bind a key: `I`
   * is this repo's choice, and a design system grabbing one collides with
   * every app that already used it (which is how the first attempt landed on
   * `H`, already `toggle-visibility` here). */
  const { toggle: togglePlaceholders } = usePlaceholders()

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return

      const shortcut = matchAny(e)
      if (!shortcut || !GLOBAL_IDS.has(shortcut.id)) return

      switch (shortcut.id) {
        case 'undo':       if (canUndo) { e.preventDefault(); undo() }; return
        case 'redo':
        case 'redo-alt':   if (canRedo) { e.preventDefault(); redo() }; return
        case 'deselect':   e.preventDefault(); select(null); return
        case 'toggle-grid': e.preventDefault(); toggleGrid(); return
        case 'toggle-hints': e.preventDefault(); togglePlaceholders(); return
        default:           return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, canUndo, canRedo, select, toggleGrid, togglePlaceholders])
}
