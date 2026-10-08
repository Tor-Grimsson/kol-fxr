---
title: Operations
type: guide
status: active
updated: 2026-10-08
description: Repo machinery for kol-fxr — the app build and the D1 Worker, the pnpm build-script gate, Vite gotchas, the production-bundle rule, and deploy.
tags:
  - project/kol-fxr
  - domain/build
  - domain/packaging
aliases:
  - operations
related:
  - "[[../documentation/00-overview/INDEX|overview]]"
  - "[[01-services|services]]"
---

# Operations

Repo machinery — how kol-fxr is developed, built and deployed. This is *process*, kept out of the subject [[../documentation/INDEX|documentation]] by design. Stack: **React 19 + Vite + Tailwind 4 + pnpm**, consuming the published `@kolkrabbi/kol-*` design system as a normal npm consumer.

The external accounts this app runs on — the Cloudflare D1 database, the Vercel deploy, the shared CDN, and where each credential is kept — are [[01-services|services]].

## Build targets

| Command | Target |
|---|---|
| `pnpm dev` | **The app and its Worker**: applies the schema to local SQLite, starts the Worker on 8787 and Vite with `VITE_FXR_API` pointed at it — the rail shows Sign in, the password is `api/.dev.vars`'s. Ctrl+C stops both (`scripts/dev.mjs`) |
| `pnpm dev:app` | Vite alone (`vite --force`) — no API, no Sign in, the library local only |
| `pnpm build` | **The app** (Vercel) — `dist/` |
| `pnpm api:dev` | The D1 Worker locally on 8787, against local SQLite (`pnpm api:schema:local` once) |
| `pnpm api:schema` | Apply `api/schema.sql` to the real D1 |
| `pnpm api:deploy` | Deploy `kol-fxr-api` to `fxr-api.kolkrabbi.io` |

`VITE_FXR_API` names the Worker for the app: set on Vercel (config, not a secret — it is an address and lands in the bundle); `pnpm dev` injects `http://127.0.0.1:8787` itself. Unset, the app is localStorage only and the rail shows no Sign in. The Worker's password is its secret `ADMIN_PASSWORD`; see [[01-services|services]].

The editor's source is in `src/` (plan 06, 2026-10-08). `pnpm build:lib` and `vite.lib.config.js` are the old embeddable build's and are not used.

## Gotchas (load-bearing)

- **pnpm-11 build-script gate.** `pnpm dev`/`build` run a deps-status pre-check that fails if a package's build script is "ignored". `esbuild` needs its build to run — approved via `allowBuilds: esbuild: true` in `pnpm-workspace.yaml` (NOT the old `pnpm.onlyBuiltDependencies` in `package.json`, which pnpm 11 no longer reads).
- **Verify on the built bundle, not on dev.** `pnpm build && vite preview`, then walk it. On 2026-10-08 a `package.json` `sideEffects: ["**/*.css"]` left over from the library build told the app bundler every module was pure; the import that registers the generator packs was tree-shaken out of production, and labs and the editor broke on the live site while every dev walk passed. Do not reintroduce `sideEffects` in this app.
- **The raw-source KOL packages stay out of `optimizeDeps`.** `vite.config.js` excludes kol-icons · kol-component · kol-framework · kol-brand · kol-shell · kol-theme and pre-bundles kol-component's `react-syntax-highlighter` and `embla-carousel-react` by name. kol-component 0.240.0's `PdfPage` imports `pdfjs-dist/…?url`, which the optimizer reads as a filename and dies on.
- **A Vercel redeploy rebuilds the old commit.** "Redeploy" reuses the deployment's commit. To ship a new push that the webhook missed, push again (an empty commit is enough); reconnecting the repo does not replay a push.
- **kol-loader icons need `optimizeDeps.exclude`.** `@kolkrabbi/kol-loader`'s `Icon` reads its SVG registry via `import.meta.glob`; Vite only expands globs in source-transformed files, so pre-bundling the dep yields an empty registry (icons "not found" **in dev only** — prod builds are fine). `vite.config.js` excludes it from `optimizeDeps`. Any future DS package shipping `import.meta.glob` in source needs the same exclusion.
- **zsh doesn't word-split unquoted variables.** The shell here is zsh — `cmd $FILES` passes the whole string as one arg. Use explicit args or a zsh array for multi-file scripting.

## Media + fonts proxy

Filters and export taint on cross-origin pixels, and mono fonts fall back, unless `/media/*` and `/fonts/*` are served **same-origin**. Deploy: `vercel.json` rewrites `/media` (and `/fonts`) to the CDN; the dev/preview Vite proxy does the same. **Any embedding host must proxy `/media/*` and `/fonts/*` same-origin**, or provide `mediaProxyBase`.

## Publishing

Nothing is published from this repo. The editor was `@kolkrabbi/design-editor`, built in kol-ds-ui from 2026-09-03; its source came back here on 2026-10-08 and the app no longer depends on the package.
