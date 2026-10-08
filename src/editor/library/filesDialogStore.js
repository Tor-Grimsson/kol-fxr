import { useSyncExternalStore } from 'react'

/* Is the files dialog open. A tiny external store in `railExtras`' idiom
 * (this package's established one) rather than a context, because the two
 * callers — the topbar File menu and the rail footer's File tab — sit in
 * different subtrees from the dialog itself, and threading `open`/`onOpen`
 * through both would put a files concern in every component between.
 *
 * Module state, so it must have exactly ONE copy. It does: the package is
 * consumed as a single entry, the same rule `railExtras` and the mode
 * navigator already depend on.
 *
 * `openFiles(name)` optionally focuses the name field — Save As opens the
 * dialog rather than a `modal.prompt`. */

let state = { open: false, focusName: false }
const listeners = new Set()

const emit = () => listeners.forEach((l) => l())

export function openFiles({ focusName = false } = {}) {
  state = { open: true, focusName }
  emit()
}

export function closeFiles() {
  if (!state.open) return
  state = { open: false, focusName: false }
  emit()
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

export const useFilesDialog = () => useSyncExternalStore(subscribe, () => state, () => state)
