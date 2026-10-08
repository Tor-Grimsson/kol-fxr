import { useEffect, useState } from 'react'

/**
 * Global modulation-dot visibility (user ruling 2026-08-12): the bind dots
 * are CHROME NOISE at rest — hidden everywhere until the user toggles the
 * modulate mode (keymap `M`), and the choice persists (set and forget).
 * A dot whose param is already BOUND stays visible regardless, so an
 * animated value is never invisible.
 *
 * Lives at module level (not context) so every BindDot everywhere — rails,
 * popovers, labs — obeys one switch.
 */
const KEY = 'kol-editor-show-dots'

let state = false
try { state = localStorage.getItem(KEY) === '1' } catch { /* storage blocked */ }

const subs = new Set()

export const dotsVisible = () => state

export function toggleDots() {
  state = !state
  try { localStorage.setItem(KEY, state ? '1' : '0') } catch { /* ignore */ }
  subs.forEach((f) => f(state))
}

export function useBindDots() {
  const [v, setV] = useState(state)
  useEffect(() => {
    const f = (x) => setV(x)
    subs.add(f)
    return () => subs.delete(f)
  }, [])
  return v
}
