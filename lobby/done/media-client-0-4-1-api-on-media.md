# Bump `kol-media-client` to 0.4.1 — the media API is on `media.kolkrabbi.io`

**Staged:** 2026-10-06 · from a kol-website session
**Change:** one dependency bump and a redeploy

---

## The problem, in one case

The media admin has **one hostname** since 2026-10-05 (user ruling): `media.kolkrabbi.io`. The
old `admin.kolkrabbi.io` only 301s there, and it is detached once nothing calls it.

This repo pins `@kolkrabbi/kol-media-client` at **0.4.0**, whose default `adminBase` is
`https://admin.kolkrabbi.io`; the live bundle at `fxr.kolkrabbi.io` calls it
(measured 2026-10-06). It works through the redirect today and stops working the day `admin.`
is detached. `kol-media-client` **0.4.1** defaults to `media.` (kol-ds-ui
`media-client-admin-base-is-media`, published 2026-10-06; `listMedia()` answers 433 items).

## The fix

Bump `@kolkrabbi/kol-media-client` to `0.4.1`, redeploy. If this repo passes `adminBase`
explicitly anywhere, make it `https://media.kolkrabbi.io` or drop it.

## Rejected alternative

Keeping `admin.` attached as a permanent redirect — a second hostname by another name.

## Definition of done

- [ ] `kol-media-client` 0.4.1 installed; no `admin.kolkrabbi.io` in the source or the built bundle
- [ ] deployed; the live bundle names `media.kolkrabbi.io`
- [ ] receipt returned to kol-website, which then detaches `admin.`

---

## 🟠 Addressed — 2026-10-07 (kol-fxr)

`@kolkrabbi/kol-media-client` **0.4.0 → 0.4.1**, exact, with the October bump (design-editor
0.21.0 · kol-component 0.240.0 · kol-shell 0.62.0 · kol-theme 0.166.0 · kol-framework 0.49.0 ·
kol-icons 0.33.1). This repo passes no `adminBase` anywhere (`src/`, `vite.config.js`,
`vercel.json`, `index.html` grepped), so the version line is the whole change.

**Evidence, built 2026-10-07:** `grep -rl admin.kolkrabbi.io dist/` → 0 files ·
`grep -rl media.kolkrabbi.io dist/` → 1 (`dist/assets/index-*.js`) · the installed package's
one hostname is `https://media.kolkrabbi.io`.

- [x] `kol-media-client` 0.4.1 installed; no `admin.kolkrabbi.io` in the source or the built bundle
- [ ] deployed; the live bundle names `media.kolkrabbi.io` — **the user's deploy**
- [ ] receipt returned to kol-website, which then detaches `admin.` — after the deploy

🟢 when the live bundle at `fxr.kolkrabbi.io` is measured naming `media.` and not `admin.`.

---

## ✅ RESOLUTION — 2026-10-08 (kol-fxr)

**Live bundle measured:** `https://fxr.kolkrabbi.io/assets/index-BRkByJQN.js` fetched 2026-10-08 —
`media.kolkrabbi.io` × 1, `admin.kolkrabbi.io` × 0. The deploy carried 0.4.1; the bar is met.

- [x] `kol-media-client` 0.4.1 installed; no `admin.kolkrabbi.io` in the source or the built bundle
- [x] deployed; the live bundle names `media.kolkrabbi.io`
- [ ] receipt returned to kol-website — **not written from here** (user ruling 2026-10-08: this agent does not touch other repos' lobbies). kol-website reads this `done/` entry when it detaches `admin.`.
