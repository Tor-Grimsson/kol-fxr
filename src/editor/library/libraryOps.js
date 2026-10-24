import { loadLibrary, saveLibrary, applyRename, applyDuplicate, isShippedOp } from './LibraryProvider'
import { getLibrarySession } from './libraryApi'

/**
 * libraryOps — the library's verbs for a surface with no provider (Home, plan 08). Read the stored
 * library, apply the same pure transform the provider uses, write it back, push one op to the
 * cloud when signed in. A chrome mounted later reads the result from storage. Each returns the
 * new item (or null) so the caller can re-render.
 */
const push = (op) => { const s = getLibrarySession(); if (s && !isShippedOp(op)) s.backend.push(op).catch((e) => console.warn('library sync: push failed —', e?.message || e)) }

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

/* a shipped file made the user's: a real save with its own id, listed on Home (Home's picks, plan 40 § 2.1) */
export function copyStored(kind, item, name) {
  const { id: _id, shipped: _s, savedAt: _a, updatedAt: _u, ...spec } = item
  const now = Date.now()
  const copy = { ...spec, id: `i${now.toString(36)}-c${Math.floor(Math.random() * 1e4)}`, name, savedAt: now, updatedAt: now }
  const lib = loadLibrary()
  saveLibrary({ ...lib, [kind]: [copy, ...(lib[kind] ?? [])] })
  push({ op: 'put', kind, item: copy })
  return copy
}

/* the cover only — like the provider's setThumb, it leaves `savedAt`/`updatedAt` alone so RECENT keeps its order */
export function setThumbStored(kind, id, thumb) {
  if (typeof thumb !== 'string') return null
  const lib = loadLibrary()
  /* never a data URL for a shipped file — its cover is drawn on demand (FileCover) */
  if ((lib[kind] ?? []).find((x) => x.id === id)?.shipped) return null
  const list = (lib[kind] ?? []).map((x) => (x.id === id ? { ...x, thumb } : x))
  saveLibrary({ ...lib, [kind]: list })
  const it = list.find((x) => x.id === id)
  if (it) push({ op: 'put', kind, item: it })
  return it ?? null
}

export function removeStored(kind, id) {
  const lib = loadLibrary()
  saveLibrary({ ...lib, [kind]: (lib[kind] ?? []).filter((x) => x.id !== id) })
  push({ op: 'remove', kind, id })
  return null
}
