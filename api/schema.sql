-- kol-fxr D1 — one table for every library slot (preset · palette · pattern · type), `kind` discriminates.
-- `spec` is the item as the app stores it (its envelope included). SOFT DELETE: a tombstone, never a
-- removed row — a stale client's hydrate must not resurrect what another machine deleted.
-- Apply: `pnpm api:schema` (remote) · `pnpm api:schema:local` (wrangler dev's SQLite).
CREATE TABLE IF NOT EXISTS documents (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,
  name       TEXT,
  spec       TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS documents_kind_deleted ON documents (kind, deleted);
