import { useEffect, useState } from 'react'

/**
 * Window › Timeline (plan 28 § 17): pins the timeline dock open with no tracks — an empty lane for
 * someone about to add keys. Off by default (spec R1.6: the dock appears only when a track exists
 * or the Morph rail is up). Module state, persisted, same shape as `dotVisibility.js`.
 */
const KEY = 'kol-editor-timeline-pinned'

let state = false
try { state = localStorage.getItem(KEY) === '1' } catch { /* storage blocked */ }

const subs = new Set()

export function toggleTimelinePinned() {
  state = !state
  try { localStorage.setItem(KEY, state ? '1' : '0') } catch { /* ignore */ }
  subs.forEach((f) => f(state))
}

export function useTimelinePinned() {
  const [v, setV] = useState(state)
  useEffect(() => {
    const f = (x) => setV(x)
    subs.add(f)
    return () => subs.delete(f)
  }, [])
  return v
}
