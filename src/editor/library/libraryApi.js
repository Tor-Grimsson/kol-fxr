/**
 * libraryApi — where the library syncs to, and the backend that talks to it (plan 07, 2026-10-08).
 *
 * The host names the API once (`setLibraryApi(import.meta.env.VITE_FXR_API)`); unset, nothing
 * in the editor shows a Sign in and the library is localStorage only, exactly as before. The
 * backend is the provider's seam: `hydrate()` and `push(op)`. A module setter in the idiom of
 * `setMediaProxyBase` — one copy, the host sets it before the editor mounts.
 */
import { useSyncExternalStore } from 'react'
import { loadLibrary, saveLibrary } from './LibraryProvider'
import { mergeRemote } from './mergeRemote'

let apiBase = null
export function setLibraryApi(base) {
  apiBase = typeof base === 'string' && base.trim() ? base.trim().replace(/\/+$/, '') : null
  restoreSession()
}
export function getLibraryApi() { return apiBase }

export class UnauthorizedError extends Error { constructor() { super('unauthorized'); this.name = 'UnauthorizedError' } }

/* `{ hydrate, push }` over the Worker, on the session token `/api/session` issued. A 401 throws
 * UnauthorizedError and the provider drops the backend (and with it the stored token). */
export function createD1Backend(base, token) {
  const auth = `Bearer ${token}`
  const call = async (path, init = {}) => {
    const res = await fetch(`${base}${path}`, { ...init, headers: { authorization: auth, 'content-type': 'application/json', ...(init.headers || {}) } })
    if (res.status === 401) throw new UnauthorizedError()
    if (!res.ok) throw new Error(`library api ${res.status}`)
    return res.json()
  }
  return {
    async hydrate() {
      const { documents } = await call('/api/documents')
      return documents
    },
    async push(op) {
      if (op.op === 'remove') return call(`/api/documents/${encodeURIComponent(op.id)}`, { method: 'DELETE' })
      const it = op.item
      return call(`/api/documents/${encodeURIComponent(it.id)}`, {
        method: 'PUT',
        body: JSON.stringify({ kind: op.kind, name: it.name ?? null, spec: it, updatedAt: it.updatedAt ?? it.savedAt ?? Date.now() }),
      })
    },
  }
}

/* THE SESSION — one per tab, module level, so it outlives a chrome switch (each chrome mounts its own
 * LibraryProvider; a ref inside one would vanish on the next route). Set by the rail's Sign in,
 * read by every provider as it mounts. `signInLibrary` trades the password for a session token
 * (POST /api/session) and hydrates once; a wrong password throws UnauthorizedError and nothing changes.
 *
 * PERSISTENT (the user, 2026-10-09: "it should try as possible to remain signed in"). The TOKEN is
 * kept in localStorage — never the password — and restored when the host names the API, so a
 * reload stays signed in until the token's 90 days run out, the password is rotated, or Sign out. */
const SESSION_KEY = 'kol.fxr.library-session'
let session = null
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
export function getLibrarySession() { return session }
export const useLibrarySession = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, getLibrarySession, getLibrarySession)
function storeSession(value) {
  try { value ? localStorage.setItem(SESSION_KEY, JSON.stringify(value)) : localStorage.removeItem(SESSION_KEY) } catch { /* storage blocked — the session lasts the tab */ }
}
function restoreSession() {
  if (session || !apiBase) return
  let stored = null
  try { stored = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { /* unreadable — signed out */ }
  if (!stored?.token || stored.base !== apiBase || !(stored.expiresAt > Date.now())) return
  session = { backend: createD1Backend(apiBase, stored.token) }
  emit()
}
export async function signInLibrary(password) {
  if (!apiBase) throw new Error('no library api')
  const res = await fetch(`${apiBase}/api/session`, { method: 'POST', headers: { authorization: 'Basic ' + btoa(`admin:${password}`) } })
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) throw new Error(`library api ${res.status}`)
  const { token, expiresAt } = await res.json()
  const backend = createD1Backend(apiBase, token)
  const rows = await backend.hydrate()
  /* THE CLOUD FILES LAND IN THE LIBRARY NOW, not on the next provider mount: merged into the stored
   * library here, so Home's SAVED (which reads `loadLibrary()` on render) and the Library page show
   * them the moment sign-in returns. Local-only items go up in the same pass. */
  const { next, pushes } = mergeRemote(loadLibrary(), rows)
  saveLibrary({ ...loadLibrary(), ...next })
  for (const op of pushes) backend.push(op).catch(() => {})
  session = { backend }
  storeSession({ base: apiBase, token, expiresAt })
  emit()
  return rows.filter((r) => !r.deleted).length
}
export function signOutLibrary() { storeSession(null); if (!session) return; session = null; emit() }
