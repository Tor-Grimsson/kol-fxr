import { loadLibrary, saveLibrary, applyRename, applyDuplicate } from './LibraryProvider'
import { getLibrarySession } from './libraryApi'

/**
 * libraryOps — the library's verbs for a surface with no provider (Home, plan 08). Read the stored
 * library, apply the same pure transform the provider uses, write it back, push one op to the
 * cloud when signed in. A chrome mounted later reads the result from storage. Each returns the
 * new item (or null) so the caller can re-render.
 */
const push = (op) => { const s = getLibrarySession(); if (s) s.backend.push(op).catch((e) => console.warn('library sync: push failed —', e?.message || e)) }

export function renameStored(kind, id, name) {
  const lib = loadLibrary()
  const list = applyRename(lib[kind] ?? [], id, name)
  saveLibrary({ ...lib, [kind]: list })
  const it = list.find((x) => x.id === id)
  if (it) push({ op: 'put', kind, item: it })
  return it ?? null
}

export function duplicateStored(kind, id) {
  const lib = loadLibrary()
  const newId = `i${Date.now().toString(36)}-d${Math.floor(Math.random() * 1e4)}`
  const list = applyDuplicate(lib[kind] ?? [], id, newId)
  saveLibrary({ ...lib, [kind]: list })
  const copy = list.find((x) => x.id === newId)
  if (copy) push({ op: 'put', kind, item: copy })
  return copy ?? null
}

export function removeStored(kind, id) {
  const lib = loadLibrary()
  saveLibrary({ ...lib, [kind]: (lib[kind] ?? []).filter((x) => x.id !== id) })
  push({ op: 'remove', kind, id })
  return null
}
