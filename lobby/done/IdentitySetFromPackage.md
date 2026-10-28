# IdentitySetFromPackage — take your icons from kol-icons, draw nothing

**Staged:** 2026-10-28 · from a kol-ds-ui session
**Change:** `pnpm icons` copies the set out of the package; `generate-icons.mjs` and its sharp dependency retire
**Plan:** `~/dev/projects/kol-ds-ui/.kol/llm-context/plan-2026-10-28-identity.md` (W3)

---

## The problem, in one case
Every app drew its own app icon in its own repo with its own copy of fxr's `generate-icons.mjs`, so nobody saw the family side by side and Mirror's tile drifted small. The DS now owns every identity's set (kol-mirror's `AppIdentitySet` ticket, user 2026-10-28: *"the favicons have a system that needs to be reviewed as a set"*), rendered by one script and reviewed on `apps/identity` (ui.kolkrabbi.io/apps/identity, `pnpm identity` in kol-ds-ui).

## The fix
1. Bump to **kol-icons 0.50.0 · kol-component 0.308.0 · kol-shell 0.84.0 · kol-framework 0.60.0 · kol-brand 0.2.0** (kol-icons ≥0.50.0 is the one that matters).
2. Replace `scripts/generate-icons.mjs` with the copy (playbook: kol-ds-ui `docs/operations/07-apps-tier/10-save-to-home-screen.md` step 3), `ID = 'fxr'`:

```js
// scripts/icons.mjs — package.json: "icons": "node scripts/icons.mjs" (or as "postinstall", so a bump carries it)
import { cpSync, mkdirSync } from 'node:fs'
const ID = 'fxr' // the identity folder
const SET = `node_modules/@kolkrabbi/kol-icons/src/kol-icon-set-identity/${ID}`
for (const d of ['public/touch-icons', 'public/svg', 'public/og']) mkdirSync(d, { recursive: true })
for (const f of ['apple-touch-icon-dark.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png']) cpSync(`${SET}/${f}`, `public/touch-icons/${f}`)
cpSync(`${SET}/${ID}-favicon.svg`, 'public/svg/favicon.svg')
cpSync(`${SET}/og.png`, `public/og/${ID}.png`)
```

3. Retire `generate-icons.mjs`, the local app-icon/OG sources and the `sharp` devDependency to `_tmp/<date>-icons-from-package/`.

Your folder is `identity/fxr/`: the icon, `fxr-logomark` (your app icon's mark), `fxr-favicon` (your `public/favicon/favicon.svg`), the app icon dark and light (`-app-icon`), the PNGs and `og.png` (your current card). Every PNG is pixel-identical to what `pnpm icons` renders today, so the swap changes nothing on screen. Your favicon lives at `public/favicon/favicon.svg`, so point that one copy line there.

A new or changed mark is still drawn here with `/app-icon`, then ticketed to kol-ds-ui; it comes back on the next bump.

## Definition of done
- [ ] bumped; `pnpm icons` copies from the package; the head tags and manifest unchanged
- [ ] generator, local sources and sharp in `_tmp/`
- [ ] the copied files match what shipped before (or the change is on apps/identity)


## ✅ RESOLVED — 2026-10-28

kol-icons 0.50.0 · kol-component 0.308.0 · kol-shell 0.84.0 · kol-framework 0.60.0 · kol-brand 0.2.0 pinned. `scripts/icons.mjs` (`pnpm icons`) copies `identity/fxr/` into `public/`; the favicon lands at `public/favicon/favicon.svg`, and `fxr-tile.svg` lands at `public/touch-icons/apple-touch-icon-dark.svg` because the manifest links that SVG (caught on the walk: without it the manifest icon 404'd). `generate-icons.mjs`, the local tile and OG SVG sources and `sharp` retired to `_tmp/2026-10-28-icons-from-package/` (the pre-swap files kept beside them in `before/`). Head tags and manifest untouched.
Checked: every copied PNG pixel-identical to what shipped (raw RGBA diff 0 on all five), favicon byte-identical. Walked `vite preview`: `/` and `/labs` load, all icon URLs 200, 0 console messages.

- [x] bumped; `pnpm icons` copies from the package; the head tags and manifest unchanged
- [x] generator, local sources and sharp in `_tmp/`
- [x] the copied files match what shipped before
