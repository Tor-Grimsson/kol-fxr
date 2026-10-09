/* kol-fxr-api — three routes over one D1 table (plan 07, 2026-10-08).
 *
 *   GET    /api/documents       every row, tombstones included (the client merges, newest wins)
 *   PUT    /api/documents/:id   { kind, name, spec, updatedAt } — upsert; an OLDER put is a no-op
 *   DELETE /api/documents/:id   tombstone: deleted = 1, updated_at = now
 *   POST   /api/session         Basic in, `{ token, expiresAt }` out — the app keeps the token, never the password
 *
 * Auth: `Authorization: Basic admin:<ADMIN_PASSWORD>`, or `Bearer <token>` from /api/session (2026-10-09 —
 * the password lived in memory only, so every reload signed the user out). A token is `<exp>.<hmac>`,
 * HMAC-SHA256 of the expiry keyed by ADMIN_PASSWORD: rotating the password ends every session. CORS for the app's origin
 * (ALLOWED_ORIGINS) and any localhost / 127.0.0.1 port. Nothing else lives here — no filters,
 * no pagination, no events table; the whole library is a few hundred rows of a few KB.
 *
 * Log intentions, never interactions: the app calls this on an explicit save, rename, duplicate
 * or delete, and on sign-in. The draft autosave never reaches it. */

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || ''
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  if (!origin || !(local || allowed.includes(origin))) return {}
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

const json = (body, status, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } })

const SESSION_MS = 90 * 24 * 60 * 60 * 1000
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
async function sign(exp, env) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.ADMIN_PASSWORD), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`fxr-session.${exp}`)))
}
/* equal-length strings compared without an early exit */
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0 }
async function tokenValid(token, env) {
  const [exp, mac] = token.split('.')
  if (!env.ADMIN_PASSWORD || !/^\d+$/.test(exp || '') || !mac || Number(exp) < Date.now()) return false
  return same(mac, await sign(exp, env))
}

function basicAuthorized(request, env) {
  const h = request.headers.get('Authorization') || ''
  if (!h.startsWith('Basic ')) return false
  let decoded = ''
  try { decoded = atob(h.slice(6)) } catch { return false }
  const i = decoded.indexOf(':')
  const user = decoded.slice(0, i), pass = decoded.slice(i + 1)
  return user === 'admin' && !!env.ADMIN_PASSWORD && pass === env.ADMIN_PASSWORD
}
async function authorized(request, env) {
  const h = request.headers.get('Authorization') || ''
  if (h.startsWith('Bearer ')) return tokenValid(h.slice(7).trim(), env)
  return basicAuthorized(request, env)
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    const url = new URL(request.url)
    if (/^\/api\/session\/?$/.test(url.pathname)) {
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, cors)
      if (!basicAuthorized(request, env)) return json({ error: 'unauthorized' }, 401, cors)
      const exp = Date.now() + SESSION_MS
      return json({ token: `${exp}.${await sign(String(exp), env)}`, expiresAt: exp }, 200, cors)
    }
    const m = url.pathname.match(/^\/api\/documents(?:\/([A-Za-z0-9_-]+))?\/?$/)
    if (!m) return json({ error: 'not found' }, 404, cors)
    if (!(await authorized(request, env))) return json({ error: 'unauthorized' }, 401, { ...cors, 'www-authenticate': 'Basic realm="kol-fxr"' })
    const id = m[1]

    if (request.method === 'GET' && !id) {
      const { results } = await env.DB.prepare('SELECT id, kind, name, spec, updated_at, deleted FROM documents').all()
      const documents = results.map((r) => ({ id: r.id, kind: r.kind, name: r.name, spec: JSON.parse(r.spec), updatedAt: r.updated_at, deleted: r.deleted === 1 }))
      return json({ documents }, 200, cors)
    }

    if (request.method === 'PUT' && id) {
      let body
      try { body = await request.json() } catch { return json({ error: 'bad json' }, 400, cors) }
      const { kind, name = null, spec, updatedAt } = body || {}
      if (typeof kind !== 'string' || !kind || spec == null || !Number.isFinite(updatedAt)) return json({ error: 'kind, spec, updatedAt required' }, 400, cors)
      const res = await env.DB.prepare(
        `INSERT INTO documents (id, kind, name, spec, updated_at, deleted) VALUES (?1, ?2, ?3, ?4, ?5, 0)
         ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, name = excluded.name, spec = excluded.spec,
           updated_at = excluded.updated_at, deleted = 0
         WHERE excluded.updated_at >= documents.updated_at`,
      ).bind(id, kind, name, JSON.stringify(spec), Math.round(updatedAt)).run()
      return json({ ok: true, applied: (res.meta?.changes ?? 0) > 0 }, 200, cors)
    }

    if (request.method === 'DELETE' && id) {
      const now = Date.now()
      const res = await env.DB.prepare('UPDATE documents SET deleted = 1, updated_at = ?2 WHERE id = ?1 AND updated_at <= ?2').bind(id, now).run()
      return json({ ok: true, applied: (res.meta?.changes ?? 0) > 0 }, 200, cors)
    }

    return json({ error: 'method not allowed' }, 405, cors)
  },
}
