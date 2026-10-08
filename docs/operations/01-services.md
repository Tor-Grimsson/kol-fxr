---
title: Services
type: reference
status: active
updated: 2026-10-08
description: Every external account kol-fxr depends on — the Cloudflare D1 database, the Vercel deploy, the shared Kolkrabbi CDN — who holds each one, what it costs, and where the credentials live.
tags:
  - project/kol-fxr
  - domain/operations
  - provider/cloudflare
  - provider/vercel
aliases:
  - services
related:
  - "[[INDEX|operations]]"
  - "[[../documentation/11-persistence/INDEX|persistence]]"
---

# Services

Every account this app depends on, and who holds it. Build machinery is [[INDEX|operations/]]; this page is about ownership, cost and where credentials are kept.

**No secrets live here.** Not tokens, not passwords, not recovery codes. This page names *where* a credential is kept, never the credential.

## Ownership at a glance

Everything is held by **Thordur** on the Kolkrabbi Cloudflare account (`thordur.grimsson@gmail.com`) — the same account that holds the client projects. There is no client-facing handover story for this repo: kol-fxr is Kolkrabbi's own tool.

| Service | What it does here | Plan |
|---|---|---|
| Cloudflare — D1 | `kol-fxr`, the app's database. **Created 2026-09-04, no tables yet.** | Free tier so far |
| Cloudflare — R2 | The shared Kolkrabbi CDN at `r2.kolkrabbi.io`. fxr is a **read-only consumer**, not the owner. | — |
| Vercel | Hosts the standalone app at `editor.kolkrabbi.io`. | Hobby |
| npm | **Nothing.** `package.json` is `private: true` since 2026-09-03. | — |

## Cloudflare D1

    name         kol-fxr
    database_id  3dfc8e68-1c2e-4525-96ae-7bbfa20bd61d
    region       WEUR (primary location, fixed at creation)
    created      2026-09-04
    tables       documents (since 2026-10-08 — `api/schema.sql`)
    replication  disabled

**Wired since 2026-10-08** through the Worker **`kol-fxr-api`** at `https://fxr-api.kolkrabbi.io` — `api/` in this repo (`wrangler.toml` · `schema.sql` · `src/index.js`), the only D1 binding this app has. The app itself stays on Vercel and calls it. Three routes over one table: `GET /api/documents`, `PUT /api/documents/:id` (upsert, newest `updated_at` wins), `DELETE /api/documents/:id` (a tombstone, never a removed row). Basic auth with the admin password on every route; CORS for `https://fxr.kolkrabbi.io` and localhost. Scripts: `pnpm api:dev` (local SQLite on 8787) · `pnpm api:schema` · `pnpm api:deploy`. The app reaches it only when `VITE_FXR_API` names it and the user signs in from the Files dialog — otherwise the library is localStorage, as before. Plan: `.kol/llm-plan/07-d1-saves-through-a-worker.md`.

### The naming law

One D1 per app, **named after the repo that owns it** — `kol-fxr`, `kol-monitor`, `kol-mirror`, `kol-website`. Client databases stay bare: `olina`, `hrafn-dop`. The `kol-` prefix therefore means *Kolkrabbi's own* rather than restating the resource type, and no `d1-` prefix is used — the D1 list contains nothing but D1 databases.

Per-app rather than one shared `kolkrabbi` database because D1 bills **account-wide** (rows read, rows written, GB stored), so ten databases cost exactly what one costs, while the limits that actually bite are **per database**:

| Limit | Free | Workers Paid |
|---|---|---|
| Databases per account | 10 | 50,000 |
| Maximum database size | 500 MB | 10 GB |
| Storage per account | 5 GB | 1 TB |
| Rows read | 5M / day | 25B / month included |
| Rows written | 100k / day | 50M / month included |

A shared database would put every app under one size ceiling and one migration surface, and hand each app's Worker every other app's rows. Bindings are per-Worker; the split costs nothing and buys isolation.

**Free-tier daily limits are enforced with hard errors** since 2026-09-01 — queries fail until midnight UTC rather than degrading. Log intentions (a save, an export), never interactions; nothing per-keystroke goes near this.

### What it is for

**Not autosave.** The whole-document draft stays local (see [[../documentation/11-persistence/INDEX|persistence]]) — D1 holds the saved library (every slot: preset · palette · pattern · type), one row per item, which is the part that wants to survive a machine change. Schema decided 2026-10-08: one `documents` table, `kind` discriminates, soft delete.

## Vercel

Deploys the standalone app from this repo. `vercel.json` carries two rewrites: `/media/:path*` → `https://r2.kolkrabbi.io/:path*`, and an SPA fallback to `/index.html`.

The media rewrite is load-bearing, not a convenience — filters and canvas export **taint on cross-origin pixels**, so media must be served same-origin. An embedding host has to do the same or pass `mediaProxyBase`.

Only `pnpm build` runs on Vercel, so the two-build-targets clash described in [[INDEX|operations]] never occurs in deploy.

## Where credentials live

| Credential | Where |
|---|---|
| Cloudflare account | password manager |
| Vercel account | password manager |
| Cloudflare API access | `wrangler`'s OAuth session on each machine (the MBP since 2026-10-08) — no D1 token issued; `wrangler` is a devDependency |
| R2 keys | none issued — this app only reads the public CDN host |
| fxr admin password | **Bitwarden, Login item `KOL fxr database`** (the item was never created — do it from the card). Generated 2026-09-04; **in use since 2026-10-08** as the Worker secret `ADMIN_PASSWORD` (`wrangler secret put`) and in the gitignored `api/.dev.vars` for `wrangler dev`. Working copy: `_tmp/2026-09-04-database/README.md` (gitignored). |

Nothing in this list belongs in the repo or in an env file that is committed. The app is a static SPA: anything it can read, so can a visitor.
