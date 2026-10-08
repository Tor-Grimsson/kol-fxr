/**
 * libraryApi — where the library syncs to, and the backend that talks to it (plan 07, 2026-10-08).
 *
 * The host names the API once (`setLibraryApi(import.meta.env.VITE_FXR_API)`); unset, nothing
 * in the editor shows a Sign in and the library is localStorage only, exactly as before. The
 * backend is the provider's seam: `hydrate()` and `push(op)`. A module setter in the idiom of
 * `setMediaProxyBase` — one copy, the host sets it before the editor mounts.
 */
import { useSyncExternalStore } from 'react'

let apiBase = null
export function setLibraryApi(base) { apiBase = typeof base === 'string' && base.trim() ? base.trim().replace(/\/+$/, '') : null }
export function getLibraryApi() { return apiBase }

export class UnauthorizedError extends Error { constructor() { super('unauthorized'); this.name = 'UnauthorizedError' } }

/* `{ hydrate, push }` over the Worker. The password lives in this closure for the session and
 * nowhere else; a 401 throws UnauthorizedError and the provider drops the backend. */
export function createD1Backend(base, password) {
  const auth = 'Basic ' + btoa(`admin:${password}`)
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
 * read by every provider as it mounts. `signInLibrary` hydrates once to prove the password; a wrong
 * one throws UnauthorizedError and nothing changes. Never persisted. */
let session = null
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
export function getLibrarySession() { return session }
export const useLibrarySession = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, getLibrarySession, getLibrarySession)
export async function signInLibrary(password) {
  if (!apiBase) throw new Error('no library api')
  const backend = createD1Backend(apiBase, password)
  const rows = await backend.hydrate()
  session = { backend }
  emit()
  return rows.filter((r) => !r.deleted).length
}
export function signOutLibrary() { if (!session) return; session = null; emit() }
