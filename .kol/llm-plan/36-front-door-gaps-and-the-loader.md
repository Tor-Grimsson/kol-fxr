# Plan — front-door gaps and the loader

**Raised:** 2026-10-22, user after the /app-icon + /front-door audit. Points verbatim: "lets bridge the gap both regarding the /app-icon /front-door and the loader - I dont recall a noindex choice being made."
**Status:** BUILT — 2026-10-22. W2 ruled indexable ("go"). Walked on `vite preview` (light, dark, reduced motion) and `vite` dev; 0 console errors; evidence in `_tmp/2026-10-22-plan-36-walk/`.
**Shape:** W › phase › list.
**Laws carried:** DS consumed as published npm, exact pins (ARCHITECTURE §2) · KOL-owned things are consumed, not copied · retired files go to `_tmp/<date>-<what>/` · static head tags only (crawlers never run JS).
**How a phase closes:** acceptance line first, gates green, then Playwright against his own words.

Already done, nothing to build: the FXR mark is in kol-icons `identity/fxr.svg` (0.36.0, kol-ds-ui lobby `identity-fxr-and-app-icon-size` 🟢).

---

## W1 — The loader and dev favicon from the DS

### 1.1 — `loaderApp` replaces `#fxr-boot` — ✅ built 2026-10-22

**Acceptance:** `index.html` holds no loader markup or CSS; the built page paints the pulsing FXR mark before the bundle in light, dark and reduced motion, and it leaves after first render; 0 console errors.

- The mark (the current `#fxr-boot` SVG, `currentColor`, unscaled) moves to its own file and `vite.config.js` adds `loaderApp({ graphic: '<that file>' })` from `@kolkrabbi/kol-framework/vite`.
- `src/main.jsx` calls `hideLoaderApp()` in place of the local fade (`:28-35`).
- The `#fxr-boot` div and `<style>` leave `index.html`; the old block goes to `_tmp/2026-10-22-plan-36-fxr-boot/`.

### 1.2 — `devFavicon` replaces the local plugin — ✅ built 2026-10-22

**Acceptance:** on `pnpm dev` the tab shows the DS tile `X` on `#F2D24B` (fxr's row in kol-ds-ui `16-app-anatomy.md` § Dev favicon); the build keeps `/favicon/favicon.svg`.

- `vite.config.js`: the local `devFavicon` const (yellow X) is replaced by `devFavicon({ label: 'X', ground: '#F2D24B' })`.
- `src/main.jsx`'s runtime dev favicon (the yellow E, a second competing one) goes too.

## W2 — Indexing

Ruled 2026-10-22: indexable. `noindex, nofollow` had come from plan 25, never from the user.

### 2.1 — Indexable head and crawler files — ✅ built 2026-10-22

**Acceptance:** built `dist/index.html` has no robots `noindex`, has `<link rel="canonical" href="https://fxr.kolkrabbi.io/">`; `dist/robots.txt` and `dist/sitemap.xml` are served as files, not the SPA rewrite.

- `index.html`: drop the robots meta, add the canonical; the plan-25 comment saying `noindex` stays is rewritten to match.
- `public/robots.txt`: `Allow: /`, `Disallow: /*?view=` (the output and forced-chrome views), `Sitemap:` line.
- `public/sitemap.xml`: the one URL — FXR has no routes.

## W3 — The icon pipeline

### 3.1 — `pnpm icons` from one SVG — ✅ built 2026-10-22

**Acceptance:** `pnpm icons` regenerates the 180 / 192 / 512 / maskable 512 PNGs and `public/og/fxr.{svg,png}` from `public/touch-icons/apple-touch-icon-dark.svg`; the outputs match today's files by eye.

- `scripts/generate-icons.mjs` copied from kol-mirror, names and comments switched to FXR, its regex fitted to FXR's source SVG.
- `sharp` devDependency (exact pin) and the `icons` script in `package.json`.
- Run once; the PNGs it overwrites are copied to `_tmp/2026-10-22-plan-36-icons-before/` first.
- Result: 180 / 192 / 512 / OG pixel-identical; the maskable 512 now holds the mark in the middle 50% (the family's safe-circle rule, Mirror's generator) where the hand-cut one used 60%.
