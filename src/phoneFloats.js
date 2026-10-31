import { useSyncExternalStore } from 'react'

/* LABS ON A PHONE RUNS ON KOL's TWO FLOATS (plan 46 W1, kol-shell 0.98.0 `touch="floats"`). AppShell is the app's
 * (AppLayout), so Labs cannot mount it; it publishes what the floats hold here, the way `railExtras` hands up its
 * categories, and AppLayout passes it as `shell.floats`. Two stores, two directions:
 *   floats — Labs → AppLayout: `{ items, actions, transport, railOpen, railHeight }`, or null when Labs is not on touch.
 *   railHost — AppLayout → Labs: the DOM node AppShell's bottom Rail renders; Labs portals its params rail into it
 *   so the rail keeps every provider (handing AppShell a node would render it outside the editor's state). */

const make = (initial) => {
  let value = initial
  const listeners = new Set()
  const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
  return {
    set: (next) => { if (next === value) return; value = next; listeners.forEach((l) => l()) },
    use: () => useSyncExternalStore(subscribe, () => value, () => value),
  }
}

const floats = make(null)
const railHost = make(null)

export const setPhoneFloats = floats.set
export const usePhoneFloats = floats.use
export const setRailHost = railHost.set
export const useRailHost = railHost.use
