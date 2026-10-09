import { useEffect } from 'react'
import { isTyping } from '../state/keymap'

/* R = reset (re-pick the selection at its defaults) · Shift+R = reroll —
 * labs' keys and the randomiser's, bound by whichever surface is mounted (one layer, one surface).
 * Same typing guard as the Space transport key. */
export function useLabsKeys(onReset, onReroll) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'r' && e.key !== 'R') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping(e)) return
      e.preventDefault()
      if (e.shiftKey) onReroll?.()
      else onReset?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
}
