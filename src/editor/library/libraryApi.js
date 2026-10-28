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
 * LibraryProvider; a ref inside one would vanish on the next route). Set by sign-in or sign-up, read by every
 * provider as it mounts. The session is an ACCOUNT since plan 43 (2026-10-28): `{ backend, user }`, the user being
 * `{ id, email, name, avatar, prefs }` from the Worker. A wrong email or password throws UnauthorizedError and
 * nothing changes.
 *
 * PERSISTENT (the user, 2026-10-09: "it should try as possible to remain signed in"). The TOKEN and the last-known
 * user are kept in localStorage — never the password — and restored when the host names the API, so a reload stays
 * signed in until the token's 90 days run out or Sign out. The previous shared-password session lives in
 * `_tmp/2026-10-28-accounts/libraryApi.js`. */
const SESSION_KEY = 'kol.fxr.library-session'
let session = null
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
export function getLibrarySession() { return session }
export const useLibrarySession = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, getLibrarySession, getLibrarySession)
/* the signed-in user, or null */
export const useAccount = () => useLibrarySession()?.user ?? null
function storeSession(value) {
  try { value ? localStorage.setItem(SESSION_KEY, JSON.stringify(value)) : localStorage.removeItem(SESSION_KEY) } catch { /* storage blocked — the session lasts the tab */ }
}
const readStored = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null } }

/* the cloud files land in the library NOW, not on the next provider mount: merged into the stored library, so Home and
 * the Library page show them the moment sign-in returns. Local-only items go up in the same pass. */
function mergeInto(backend, rows) {
  const { next, pushes } = mergeRemote(loadLibrary(), rows)
  saveLibrary({ ...loadLibrary(), ...next })
  for (const op of pushes) backend.push(op).catch(() => {})
}

async function call(path, init = {}, token) {
  const res = await fetch(`${apiBase}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) } })
  if (res.status === 401) throw new UnauthorizedError()
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `library api ${res.status}`)
  return body
}

function restoreSession() {
  if (session || !apiBase) return
  const stored = readStored()
  if (!stored?.token || stored.base !== apiBase || !(stored.expiresAt > Date.now()) || !stored.user) return
  const backend = createD1Backend(apiBase, stored.token)
  session = { backend, user: stored.user, token: stored.token }
  emit()
  /* a restored session merges the cloud files into storage NOW, as sign-in does, and refreshes the user (a profile
     edited on another device) */
  call('/api/me', {}, stored.token).then(({ user }) => {
    if (session?.token !== stored.token) return
    session = { ...session, user }
    storeSession({ ...stored, user })
    emit()
  }).catch((e) => { if (e instanceof UnauthorizedError) signOutLibrary() })
  backend.hydrate().then((rows) => mergeInto(backend, rows)).catch((e) => {
    if (e instanceof UnauthorizedError) signOutLibrary()
    else console.warn('library sync: hydrate failed —', e?.message || e)
  })
}

async function open({ token, expiresAt, user }) {
  const backend = createD1Backend(apiBase, token)
  const rows = await backend.hydrate()
  mergeInto(backend, rows)
  session = { backend, user, token }
  storeSession({ base: apiBase, token, expiresAt, user })
  emit()
  return rows.filter((r) => !r.deleted).length
}

/* `{ email, password }` → the number of files in the cloud library */
export async function signInLibrary({ email, password } = {}) {
  if (!apiBase) throw new Error('no library api')
  return open(await call('/api/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) }))
}
/* `{ invite, email, name, password }` — only through an invite link (plan 43 § 2.4) */
export async function signUpLibrary(fields) {
  if (!apiBase) throw new Error('no library api')
  return open(await call('/api/auth/signup', { method: 'POST', body: JSON.stringify(fields) }))
}
export function signOutLibrary() {
  const token = session?.token ?? readStored()?.token
  storeSession(null)
  if (token && apiBase) call('/api/auth/signout', { method: 'POST', body: '{}' }, token).catch(() => {})
  if (!session) return
  session = null
  emit()
}
/* `{ name?, avatar?, prefs? }` — prefs merge key by key on the Worker */
export async function updateAccount(patch) {
  if (!session) throw new UnauthorizedError()
  const { user } = await call('/api/me', { method: 'PATCH', body: JSON.stringify(patch) }, session.token)
  session = { ...session, user }
  storeSession({ ...readStored(), user })
  emit()
  return user
}
/* a one-use sign-up link, good for 7 days */
export async function mintInvite() {
  if (!session) throw new UnauthorizedError()
  const { token, expiresAt } = await call('/api/invites', { method: 'POST', body: '{}' }, session.token)
  return { url: `${window.location.origin}/join?invite=${encodeURIComponent(token)}`, expiresAt }
}
