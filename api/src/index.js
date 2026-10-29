/* kol-fxr-api — the library and the accounts over one D1 database (plan 07, 2026-10-08; accounts plan 43, 2026-10-28).
 *
 *   POST   /api/auth/signin     { email, password } → { token, expiresAt, user }
 *   POST   /api/auth/signup     { invite, email, name, password } → { token, expiresAt, user } — invite only, one use
 *   POST   /api/auth/signout    ends the session the request carries
 *   GET    /api/me              the signed-in user
 *   PATCH  /api/me              { name?, avatar?, prefs? } — prefs merge key by key
 *   POST   /api/invites         mint a sign-up link token (signed in)
 *   POST   /api/invite-requests { name, email } — anyone, no token: ask for an invite (one open request per email)
 *   GET    /api/invite-requests the open requests (signed in)
 *   POST   /api/invite-requests/:id/invite  mint a link for that request and close it (signed in)
 *   GET    /api/documents       the user's rows, tombstones included (the client merges, newest wins)
 *   PUT    /api/documents/:id   { kind, name, spec, updatedAt } — upsert; an OLDER put is a no-op
 *   DELETE /api/documents/:id   tombstone: deleted = 1, updated_at = now
 *
 * Auth: `Authorization: Bearer <token>` from signin / signup. The token is 32 random bytes; the sessions table keeps
 * only its SHA-256. The shared ADMIN_PASSWORD gate of plan 07 is gone (the old Worker: `_tmp/2026-10-28-accounts/`).
 * The FIRST account to sign up claims every row that has no owner — the library from before accounts.
 * CORS for the app's origin (ALLOWED_ORIGINS) and any localhost / 127.0.0.1 port.
 *
 * Log intentions, never interactions: the app calls this on an explicit save, rename, duplicate or delete, on sign-in
 * and on a profile edit. The draft autosave never reaches it. */

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || ''
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  if (!origin || !(local || allowed.includes(origin))) return {}
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, PUT, POST, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

const json = (body, status, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } })

const SESSION_MS = 90 * 24 * 60 * 60 * 1000
const INVITE_MS = 7 * 24 * 60 * 60 * 1000
const PBKDF2_ITERATIONS = 100000 // workerd's ceiling
const REQUESTS_MAX = 200 // open requests held at once; past it a new one is refused, so the public route cannot fill the table
const AVATAR_MAX = 200000 // a 256px webp data URL is ~20 KB; this only stops a full photo landing in a row

const enc = new TextEncoder()
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const randomToken = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)))
const sha256 = async (s) => b64url(await crypto.subtle.digest('SHA-256', enc.encode(s)))
async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return b64url(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: PBKDF2_ITERATIONS }, key, 256))
}
/* equal-length strings compared without an early exit */
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0 }

const normEmail = (e) => (typeof e === 'string' ? e.trim().toLowerCase() : '')
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, avatar: u.avatar ?? null, prefs: JSON.parse(u.prefs || '{}') })

async function startSession(env, userId) {
  const token = randomToken()
  const expiresAt = Date.now() + SESSION_MS
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?1, ?2, ?3)').bind(await sha256(token), userId, expiresAt).run()
  return { token, expiresAt }
}

/* the user the request's Bearer token belongs to, or null */
async function userOf(request, env) {
  const h = request.headers.get('Authorization') || ''
  if (!h.startsWith('Bearer ')) return null
  const row = await env.DB.prepare(
    'SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ?1 AND sessions.expires_at > ?2',
  ).bind(await sha256(h.slice(7).trim()), Date.now()).first()
  return row ?? null
}

async function mintInvite(env) {
  const token = randomToken(18)
  const expiresAt = Date.now() + INVITE_MS
  await env.DB.prepare('INSERT INTO invites (token, created_at, expires_at) VALUES (?1, ?2, ?3)').bind(token, Date.now(), expiresAt).run()
  return { token, expiresAt }
}

const body = async (request) => { try { return (await request.json()) || {} } catch { return null } }

async function auth(request, env, cors, action) {
  const b = await body(request)
  if (!b) return json({ error: 'bad json' }, 400, cors)

  if (action === 'signout') {
    const h = request.headers.get('Authorization') || ''
    if (h.startsWith('Bearer ')) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(await sha256(h.slice(7).trim())).run()
    return json({ ok: true }, 200, cors)
  }

  const email = normEmail(b.email)
  const password = typeof b.password === 'string' ? b.password : ''

  if (action === 'signin') {
    const u = await env.DB.prepare('SELECT * FROM users WHERE email = ?1').bind(email).first()
    /* the hash runs on a miss too, so a wrong email and a wrong password take the same time */
    const hash = await hashPassword(password, u?.pw_salt ?? 'no-such-user')
    if (!u || !same(hash, u.pw_hash)) return json({ error: 'wrong email or password' }, 401, cors)
    return json({ ...(await startSession(env, u.id)), user: publicUser(u) }, 200, cors)
  }

  /* signup — the invite is the gate (plan 43 § 2.4) */
  if (!validEmail(email)) return json({ error: 'a valid email is required' }, 400, cors)
  if (password.length < 8) return json({ error: 'the password needs at least 8 characters' }, 400, cors)
  const invite = await env.DB.prepare('SELECT * FROM invites WHERE token = ?1').bind(String(b.invite || '')).first()
  if (!invite || invite.used_by || invite.expires_at < Date.now()) return json({ error: 'this invite link is used or expired' }, 403, cors)
  if (await env.DB.prepare('SELECT id FROM users WHERE email = ?1').bind(email).first()) return json({ error: 'that email already has an account' }, 409, cors)
  const first = !(await env.DB.prepare('SELECT id FROM users LIMIT 1').first())
  const id = randomToken(12)
  const salt = randomToken(16)
  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 80) : ''
  const now = Date.now()
  /* the invite is spent in the same batch as the account, and only if it is still unspent */
  const [spent] = await env.DB.batch([
    env.DB.prepare('UPDATE invites SET used_by = ?1 WHERE token = ?2 AND used_by IS NULL').bind(id, invite.token),
    env.DB.prepare('INSERT INTO users (id, email, name, pw_hash, pw_salt, prefs, created_at) SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7 WHERE changes() = 1')
      .bind(id, email, name, await hashPassword(password, salt), salt, '{}', now),
  ])
  if ((spent.meta?.changes ?? 0) !== 1) return json({ error: 'this invite link is used or expired' }, 403, cors)
  /* the library from before accounts belongs to the first account */
  if (first) await env.DB.prepare('UPDATE documents SET user_id = ?1 WHERE user_id IS NULL').bind(id).run()
  const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?1').bind(id).first()
  return json({ ...(await startSession(env, id)), user: publicUser(u) }, 200, cors)
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    const url = new URL(request.url)

    /* asking for an invite needs no account (the one public write) */
    if (/^\/api\/invite-requests\/?$/.test(url.pathname) && request.method === 'POST') {
      const b = await body(request)
      if (!b) return json({ error: 'bad json' }, 400, cors)
      const email = normEmail(b.email)
      if (!validEmail(email)) return json({ error: 'a valid email is required' }, 400, cors)
      const open = await env.DB.prepare('SELECT COUNT(*) AS n FROM invite_requests WHERE handled_at IS NULL').first()
      if ((open?.n ?? 0) >= REQUESTS_MAX) return json({ error: 'too many open requests, try again later' }, 429, cors)
      const name = typeof b.name === 'string' ? b.name.trim().slice(0, 80) : ''
      await env.DB.prepare(
        `INSERT INTO invite_requests (id, name, email, created_at) VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(email) DO UPDATE SET name = excluded.name, created_at = excluded.created_at, handled_at = NULL`,
      ).bind(randomToken(12), name, email, Date.now()).run()
      return json({ ok: true }, 200, cors)
    }

    const a = url.pathname.match(/^\/api\/auth\/(signin|signup|signout)\/?$/)
    if (a) return request.method === 'POST' ? auth(request, env, cors, a[1]) : json({ error: 'method not allowed' }, 405, cors)

    const isMe = /^\/api\/me\/?$/.test(url.pathname)
    const isInvites = /^\/api\/invites\/?$/.test(url.pathname)
    const req = url.pathname.match(/^\/api\/invite-requests(?:\/([A-Za-z0-9_-]+)\/invite)?\/?$/)
    const m = url.pathname.match(/^\/api\/documents(?:\/([A-Za-z0-9_-]+))?\/?$/)
    if (!isMe && !isInvites && !req && !m) return json({ error: 'not found' }, 404, cors)

    const user = await userOf(request, env)
    if (!user) return json({ error: 'unauthorized' }, 401, cors)

    if (isMe) {
      if (request.method === 'GET') return json({ user: publicUser(user) }, 200, cors)
      if (request.method !== 'PATCH') return json({ error: 'method not allowed' }, 405, cors)
      const b = await body(request)
      if (!b) return json({ error: 'bad json' }, 400, cors)
      const name = typeof b.name === 'string' ? b.name.trim().slice(0, 80) : user.name
      const avatar = b.avatar === null ? null : typeof b.avatar === 'string' && b.avatar.startsWith('data:image/') && b.avatar.length <= AVATAR_MAX ? b.avatar : user.avatar
      const prefs = b.prefs && typeof b.prefs === 'object' ? JSON.stringify({ ...JSON.parse(user.prefs || '{}'), ...b.prefs }) : user.prefs
      await env.DB.prepare('UPDATE users SET name = ?2, avatar = ?3, prefs = ?4 WHERE id = ?1').bind(user.id, name, avatar, prefs).run()
      return json({ user: publicUser({ ...user, name, avatar, prefs }) }, 200, cors)
    }

    if (isInvites) {
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, cors)
      return json(await mintInvite(env), 200, cors)
    }

    if (req) {
      if (!req[1] && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT id, name, email, created_at FROM invite_requests WHERE handled_at IS NULL ORDER BY created_at DESC').all()
        return json({ requests: results.map((r) => ({ id: r.id, name: r.name, email: r.email, createdAt: r.created_at })) }, 200, cors)
      }
      if (req[1] && request.method === 'POST') {
        const r = await env.DB.prepare('SELECT * FROM invite_requests WHERE id = ?1 AND handled_at IS NULL').bind(req[1]).first()
        if (!r) return json({ error: 'no such open request' }, 404, cors)
        const invite = await mintInvite(env)
        await env.DB.prepare('UPDATE invite_requests SET handled_at = ?2 WHERE id = ?1').bind(r.id, Date.now()).run()
        return json({ ...invite, email: r.email, name: r.name }, 200, cors)
      }
      return json({ error: 'method not allowed' }, 405, cors)
    }

    const id = m[1]

    if (request.method === 'GET' && !id) {
      const { results } = await env.DB.prepare('SELECT id, kind, name, spec, updated_at, deleted FROM documents WHERE user_id = ?1').bind(user.id).all()
      const documents = results.map((r) => ({ id: r.id, kind: r.kind, name: r.name, spec: JSON.parse(r.spec), updatedAt: r.updated_at, deleted: r.deleted === 1 }))
      return json({ documents }, 200, cors)
    }

    if (request.method === 'PUT' && id) {
      const b = await body(request)
      if (!b) return json({ error: 'bad json' }, 400, cors)
      const { kind, name = null, spec, updatedAt } = b
      if (typeof kind !== 'string' || !kind || spec == null || !Number.isFinite(updatedAt)) return json({ error: 'kind, spec, updatedAt required' }, 400, cors)
      /* a row is only ever its owner's: a put on someone else's id changes nothing */
      const res = await env.DB.prepare(
        `INSERT INTO documents (id, kind, name, spec, updated_at, deleted, user_id) VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6)
         ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, name = excluded.name, spec = excluded.spec,
           updated_at = excluded.updated_at, deleted = 0
         WHERE excluded.updated_at >= documents.updated_at AND documents.user_id = excluded.user_id`,
      ).bind(id, kind, name, JSON.stringify(spec), Math.round(updatedAt), user.id).run()
      return json({ ok: true, applied: (res.meta?.changes ?? 0) > 0 }, 200, cors)
    }

    if (request.method === 'DELETE' && id) {
      const now = Date.now()
      const res = await env.DB.prepare('UPDATE documents SET deleted = 1, updated_at = ?2 WHERE id = ?1 AND updated_at <= ?2 AND user_id = ?3').bind(id, now, user.id).run()
      return json({ ok: true, applied: (res.meta?.changes ?? 0) > 0 }, 200, cors)
    }

    return json({ error: 'method not allowed' }, 405, cors)
  },
}
