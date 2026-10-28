-- kol-fxr D1 — one table for every library slot (preset · palette · pattern · type), `kind` discriminates.
-- `spec` is the item as the app stores it (its envelope included). SOFT DELETE: a tombstone, never a
-- removed row — a stale client's hydrate must not resurrect what another machine deleted.
-- Apply: `pnpm api:schema` (remote) · `pnpm api:schema:local` (wrangler dev's SQLite).
-- A database made before accounts (plan 43, 2026-10-28) also needs `api/migrations/0001-accounts.sql` once.
CREATE TABLE IF NOT EXISTS documents (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,
  name       TEXT,
  spec       TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0,
  user_id    TEXT
);
CREATE INDEX IF NOT EXISTS documents_kind_deleted ON documents (kind, deleted);

-- ACCOUNTS (plan 43 W2). A password is PBKDF2-SHA256 (100k, workerd's cap) with its own salt; a session
-- stores the SHA-256 of its token, never the token. Sign-up only through an invite (2.4): one use each.
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL DEFAULT '',
  avatar     TEXT,
  pw_hash    TEXT NOT NULL,
  pw_salt    TEXT NOT NULL,
  prefs      TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS invites (
  token      TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_by    TEXT
);
CREATE INDEX IF NOT EXISTS documents_user ON documents (user_id);
