---
title: Accounts rollout
type: playbook
status: active
updated: 2026-10-28
audience: internal
description: Taking fxr's accounts live — the D1 migration, the new tables, the Worker deploy, the first invite link — and how sign-in, sign-up and the library work once it is done.
providers:
  - cloudflare
  - vercel
tags:
  - project/kol-fxr
  - domain/operations
  - provider/cloudflare
aliases:
  - accounts rollout
related:
  - "[[INDEX|operations]]"
  - "[[01-services|services]]"
  - "[[../documentation/11-persistence/INDEX|persistence]]"
---

# Accounts rollout

| Step | Command | Touches |
|---|---|---|
| 1 | `pnpm api:migrate` | live D1: adds `user_id` to `documents` (once) |
| 2 | `pnpm api:schema` | live D1: creates `users`, `sessions`, `invites` |
| 3 | `pnpm api:deploy` | the live Worker `fxr-api.kolkrabbi.io` |
| 4 | push the app | Vercel builds the app that talks to the new Worker |
| 5 | `pnpm api:invite` | live D1: one sign-up link, printed |

**Steps 3 and 4 go together.** The new Worker drops the old shared password; until the new app is live, the live site's sign-in fails. The library itself is safe either way: it stays in each browser and in D1.

## How it works

- **Accounts live in D1** (`kol-fxr`), behind the Worker in `api/`. A password is stored as a PBKDF2 hash with its own salt; a session keeps only its token's hash.
- **Sign-up is by invite only.** A link (`/join?invite=…`) works once and lasts 7 days. The first one comes from `pnpm api:invite`; after that, `/account` › New invite link.
- **The first account owns the old library.** Every row in `documents` from before accounts has no owner; the first sign-up claims them all.
- **Each account sees only its own files.** A save, rename or delete on another account's row changes nothing.
- **Preferences follow the account:** theme, the last chrome, the app defaults. Preview resolution stays per device.
- **Signed out,** Home shows the growing line and no files; `/signin` and `/join` are frame C, the button opening the sign-in or create-account dialog.

## 0. Prerequisites

- Wrangler signed in to the Cloudflare account that holds `kol-fxr` (see [[01-services|services]]).
- `VITE_FXR_API=https://fxr-api.kolkrabbi.io` set on Vercel (already set since plan 07).

## 1. Add the owner column

```
pnpm api:migrate
```

Run it once. A second run fails with "duplicate column name: user_id", which is harmless.

## 2. Create the account tables

```
pnpm api:schema
```

Safe to repeat: every statement is `IF NOT EXISTS`.

## 3. Deploy the Worker, then push the app

```
pnpm api:deploy
```

Then push the app straight after, so the live site and the Worker change together.

## 4. Make the first account

```
pnpm api:invite
```

It prints `https://fxr.kolkrabbi.io/join?invite=…`. Open it, press Create account, enter name, email and password. That account takes over the existing library.

## 5. Verification

- `https://fxr-api.kolkrabbi.io/api/me` with no token answers `{"error":"unauthorized"}`.
- Signed out, Home shows no files; signed in, your files are back.
- The same invite link opened again says it is used or expired.

## Local

`.env.local` with `VITE_FXR_API=http://127.0.0.1:8787`, then `pnpm api:dev`, `pnpm api:migrate:local`, `pnpm api:schema:local`, `pnpm api:invite:local` (prints a `localhost:5173` link).
