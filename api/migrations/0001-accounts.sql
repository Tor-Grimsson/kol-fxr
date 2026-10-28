-- plan 43 (2026-10-28): a database made before accounts. Run ONCE, then `pnpm api:schema` for the new tables.
-- The existing rows get no owner here; the first account to sign up claims every unowned row (api/src/index.js, signup).
ALTER TABLE documents ADD COLUMN user_id TEXT;
