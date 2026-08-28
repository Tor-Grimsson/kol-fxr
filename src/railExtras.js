import { useSyncExternalStore } from 'react'

/* Route-contributed rail rows. ONE RAIL (user, 2026-08-28): labs used to hide
 * the shell rail and mount kol-framework's `SideNav` in its own grid cell — a
 * different component with no grab animation and its own active accent. It now
 * publishes its categories HERE and the shell's `NavRail` renders them, so
 * every route is the same rail in the same two states.
 *
 * Leaves dispatch rather than route (labs swaps the layer, it does not
 * navigate), and `NavRail` only knows `onNavigate(path)` — so a row's path is
 * a sentinel and `dispatch` is what actually runs. AppLayout routes anything
 * under PREFIX here instead of to the router. */

export const RAIL_EXTRA_PREFIX = '#rail/'

let state = { items: [], dispatch: null }
const listeners = new Set()

export function setRailExtras(next) {
  state = next ?? { items: [], dispatch: null }
  listeners.forEach((l) => l())
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

export const useRailExtras = () => useSyncExternalStore(subscribe, () => state, () => state)
