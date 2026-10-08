import { useSyncExternalStore } from 'react'

/* Is the Morph dialog open — `filesDialogStore`'s idiom: a tiny external store,
 * because the File tab that opens it and the host that renders it sit in
 * different subtrees. Module state, one copy — the same rule as railExtras. */

let state = { open: false }
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

export function openMorph() { state = { open: true }; emit() }
export function closeMorph() { if (!state.open) return; state = { open: false }; emit() }

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
export const useMorphDialog = () => useSyncExternalStore(subscribe, () => state, () => state)
