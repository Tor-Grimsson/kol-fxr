---
title: Deploy
type: reference
status: active
created: 2026-10-09
updated: 2026-10-09
description: The cloud builds and verifies; Vercel ships main; the Worker and the D1 schema ship from a local machine
tags:
  - project/kol-fxr
  - domain/workflow
  - domain/build
  - audience/agency-internal
aliases:
  - cloud-deploy
related:
  - "[[INDEX|Cloud sessions]]"
  - "[[02-branch-and-handoff|Branch and handoff]]"
  - "[[../INDEX|Operations]]"
  - "[[../01-services|Services]]"
---

# Deploy

Nothing is published to npm from this repo. Two things deploy, and the container can do neither:
it has no Vercel, Cloudflare or npm credentials.

| What | How it ships | Who |
|---|---|---|
| The app (`fxr.kolkrabbi.io`) | Vercel builds `main` on push | the user's push ([[02-branch-and-handoff\|Handoff § 2]]) |
| The Worker (`fxr-api.kolkrabbi.io`) — `api/src/index.js` | `pnpm api:deploy` | locally, after the push |
| The D1 schema — `api/schema.sql` | `pnpm api:schema` | locally, before the Worker if both changed |

## Cloud

- `pnpm build` green before the last commit (the chunk-size warning is known).
- Verify on the **built bundle** — `pnpm preview`, not `pnpm dev` ([[../INDEX|Operations § Gotchas]]).
  `pnpm dev` needs the Worker's local password (`api/.dev.vars`, not in the repo); without it,
  `pnpm dev:app` runs the app with no Sign in.
- A change under `api/` is checked in Node against a stub `env` (the Worker is a plain
  `export default { fetch }`), never by deploying.
- No `@kolkrabbi/*` bump unless the plan asks for one; a bump is `pnpm add <pkg>@<x.y.z> --save-exact`.

## Handoff

The session's last message says, after the git steps: whether the Worker or the schema changed
(and so whether `pnpm api:schema` / `pnpm api:deploy` is owed), and which `@kolkrabbi/*` versions
moved.
