# Plan — saves survive the machine: D1 behind a Worker, the app stays on Vercel

**Status:** BUILT AND DEPLOYED 2026-10-08 — steps 1, 2, 3 and 5 done; **step 4 is the user's: `VITE_FXR_API=https://fxr-api.kolkrabbi.io` on Vercel, then a deploy.** Worker `kol-fxr-api` live at `fxr-api.kolkrabbi.io` (401 without the password, `{"documents":[]}` with it, CORS for the app's origin); schema applied to the real D1; secret set from the card. The seam, the backend and the Sign in built and walked against the local Worker with two browser profiles: sign in, a save on A lands in D1, B hydrates it after sign-in, B's delete is a tombstone, A's re-sign-in drops it, localStorage still the local store, 0 console errors (`sync-check.mjs`). One pre-existing bug fixed on the way: labs never mounted `FilesDialogHost`, so its Files… and Save as… buttons were dead — mounted now. · **Origin:** user ask 2026-10-08 — *"scope a connection of d1 such that things can be saved"*; ruling the same hour: **a separate Worker, the app does not move**.
**Scope ruling:** plan 03 (2026-09-04) settled the design — local-first, D1 a write-behind sync target, explicit saves only, the autosave never. What changed since: the Files dialog exists (design-editor 0.10.0), and **the editor is local again (plan 06)**, so the provider seam plan 03 wanted from the DS is an edit in `src/editor/library/LibraryProvider.jsx`. Nothing goes out of this repo.

## What exists

- **D1 `kol-fxr`** — `3dfc8e68-1c2e-4525-96ae-7bbfa20bd61d`, WEUR, created 2026-09-04, **no tables, nothing wired** (`docs/operations/01-services.md`).
- **The password** — Bitwarden item **`KOL fxr database`**, generated 2026-09-04, unused. The gitignored card `_tmp/2026-09-04-database/README.md` is on the iMac only.
- **The store** — `LibraryProvider.jsx`: four slots (`preset · palette · pattern · type`), items `{ id, name, savedAt, updatedAt?, …spec }`, synchronous `addItem / updateItem / renameItem / duplicateItem / removeItem`, `replaceAll(next)`, localStorage `kol.editor.library.v3`, cross-tab via the `storage` event. Every verb the dialog has writes here.
- **A host-store seam already shipped for preferences** — `setSettingsStore({ load() → Promise, save(settings) })` (`editor/lib/appSettings.js:62`). Same idea, different store; the library gets its own.
- **No `wrangler` on this machine**, no `wrangler login` here yet (the OAuth session the services doc names is the iMac's).

## The design

### 1. The Worker — `api/` in this repo

| file | what |
|---|---|
| `api/wrangler.toml` | `name = "kol-fxr-api"` · `main = "src/index.js"` · `compatibility_date` · `[[d1_databases]] binding = "DB", database_name = "kol-fxr", database_id = "3dfc8e68-…"` · `routes = [{ pattern = "fxr-api.kolkrabbi.io", custom_domain = true }]` — wrangler creates the DNS record on deploy; the zone is already Cloudflare's |
| `api/schema.sql` | `documents(id TEXT PRIMARY KEY, kind TEXT NOT NULL, name TEXT, spec TEXT NOT NULL, updated_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0)` + an index on `(kind, deleted)` — plan 03's one table, **soft delete** so a stale client's hydrate cannot resurrect a row another machine removed |
| `api/src/index.js` | three routes, JSON, one file: `GET /api/documents` → every row with `deleted = 0` · `PUT /api/documents/:id` body `{ kind, name, spec, updatedAt }` → upsert, **newest `updated_at` wins** (an older put is a no-op, 200) · `DELETE /api/documents/:id` → `deleted = 1, updated_at = now`. Auth: `Authorization: Basic admin:<ADMIN_PASSWORD>` on every route, 401 otherwise. CORS: `https://fxr.kolkrabbi.io` and `http://localhost:*` / `127.0.0.1:*`, preflight answered. Nothing else — no list filters, no pagination, no events table |
| `api/.dev.vars` (gitignored) | `ADMIN_PASSWORD=…` for `wrangler dev` |

Secrets: `wrangler secret put ADMIN_PASSWORD --config api/wrangler.toml` from the Bitwarden item. Scripts in `package.json`: `api:dev` (`wrangler dev --config api/wrangler.toml`, port 8787) · `api:schema` (`wrangler d1 execute kol-fxr --remote --file api/schema.sql`; `--local` for dev) · `api:deploy`. `wrangler` as a devDependency; `api/` is not part of the Vite build.

### 2. The seam — `LibraryProvider backend`

A `backend` prop, default none = today exactly:

    hydrate()  → Promise<[{ id, kind, name, spec, updatedAt }]>   once, on mount
    push(op)   → Promise<void>                                    { op: 'put' | 'remove', kind, item }

- **On sign-in** (not on mount — see § 3): hydrate; merge by `updatedAt ?? savedAt`, newest wins, remote deletes drop a local row only when they are newer; then `replaceAll`. Rows local has that remote lacks or has older → **pushed back** (a machine that saved offline reconciles on its next load). Until hydrate returns the app runs on localStorage as now.
- **Every verb** → one `push` after the local write, fire-and-forget. A failed push `console.warn`s and is retried on the next hydrate through the reconcile above; nothing queues in memory. **Rename and duplicate are puts** (the dialog's verbs). Nothing is pushed by the draft autosave, ever — it lives in `compose/state.jsx` and never touches the library.
- The sync is invisible: no spinner, no status. The Files dialog is unchanged.

### 3. fxr's backend — `src/lib/d1Backend.js`

`createD1Backend(apiBase)`: `fetch` with `Authorization: Basic`, JSON in and out.

**No login to use the app.** The sync is **opt-in per session**: the app loads and runs on localStorage exactly as today, for anyone, with the API configured or not. A **Sign in** action (the Files dialog's footer, beside Export — one button) asks for the one password through the KOL modal (`useModal().prompt`; the provider sits inside `ModalProvider`), then hydrates and starts pushing. The password is held in a module variable, **never persisted**, dropped on a 401 (the modal asks again on the next push). Cancel the prompt and nothing changes — local only. There is no account, no user table: one shared password for Kolkrabbi's own tool, Cloudflare Access in front the day it is more than one person. Plan 03's olina rule, moved off `mount` so a visitor is never asked for anything.

Wired where `EditorProviders` builds the stack, gated on one env var:

| env | `VITE_FXR_API` | behaviour |
|---|---|---|
| local | unset | today exactly — localStorage only, no Sign in button; the `pnpm dev` default |
| remote-dev | `http://127.0.0.1:8787` | `pnpm api:dev` against local SQLite (`api:schema --local` once), or `--remote` against the real D1 |
| production | `https://fxr-api.kolkrabbi.io` | the deployed Worker; set on Vercel |

`.env.local` is already gitignored (`*.local`).

### 4. What a save costs

One row write per explicit save, rename, duplicate or delete; one read per load. The free tier is 100k writes and 5M reads a day, 500 MB; a preset is a few KB. An editing session with no save writes **zero** rows — that is the test in § Done.

## Steps

1. **`api/`** — the three files, `wrangler` devDependency, the three scripts. You: `wrangler login` on this machine, `wrangler secret put ADMIN_PASSWORD` from Bitwarden. Then `pnpm api:schema`, `pnpm api:deploy`. Done when `curl -u admin:… https://fxr-api.kolkrabbi.io/api/documents` → `{"documents":[]}` and the same without the password → 401.
2. **The seam** — `backend` prop on `LibraryProvider`, merge + push + reconcile; `pnpm build` and the Files dialog walk unchanged with no backend passed.
3. **`d1Backend.js` + the env gate** — wired in `EditorProviders`. Done when, on `pnpm api:dev`: a save in one browser profile appears in a second after reload; a delete in one is gone in the other; a rename lands; `VITE_FXR_API` unset gives today's behaviour with no UI difference; with it set and **no sign-in** the app is still identical to today; `wrangler d1 execute kol-fxr --command "select count(*) from documents"` is unchanged after ten minutes of editing without a save.
4. **Production** — `VITE_FXR_API` on Vercel, your deploy. Done when the live app saves to D1 and the iMac sees the MBP's preset.
5. `docs/operations/01-services.md` — the Worker, its URL, the secret's name; the schema decision closed.

## Excluded (deliberate)

- **The draft autosave.** Never D1 — standing ruling, the write cadence alone rules it out.
- **Moving the app** to Cloudflare Pages. A Worker beside it is the normal shape and the one ruled today.
- Multi-user, sharing, permissions — **Cloudflare Access in front of the Worker before a second person ever touches it**, then a conversation.
- Preferences sync through `setSettingsStore` — same seam, one row `kind: 'settings'`; a later line, not this one.
- An events table, pagination, search on the Worker.

## Risks / laws

- **Log intentions, never interactions** — a row per explicit save, nothing per keystroke (the 2026-09-01 hard-cap incident).
- **Store R2 keys, not URLs** in specs — this estate renamed a CDN host once and orphaned every absolute URL.
- **`wrangler d1 execute --local` and `wrangler dev` key local SQLite differently** — a schema applied by one can read as "no such table" in the other while everything is wired right. Apply with the same tool you run.
- **Soft delete or resurrection.** Never a hard `DELETE` row.
- `api/` must never be imported by `src/` — two runtimes, one repo.
