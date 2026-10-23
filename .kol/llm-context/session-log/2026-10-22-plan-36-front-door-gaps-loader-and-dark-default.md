# Session: Plan 36 — front-door gaps, the DS loader, dark default

**Date:** 2026-10-22
**Agent:** kol-fxr (local, MBP)
**Summary:** KOL packages bumped; the /app-icon + /front-door gaps closed (plan 36): the loader and dev favicon now come from kol-framework, FXR is indexable, `pnpm icons` regenerates the icon set; README rewritten as an app; dark is the default theme.

## Changes Made

### Files Modified
- `package.json` — kol-component 0.282.0 · kol-framework 0.51.0 · kol-icons 0.41.0 · kol-media-client 0.6.0 · kol-shell 0.72.0 · kol-theme 0.178.0; `sharp` 0.35.5 + `icons` script.
- `vite.config.js` — `loaderApp({ graphic: 'src/assets/fxr-mark.svg' })` and `devFavicon({ label: 'X', ground: '#F2D24B' })` from `@kolkrabbi/kol-framework/vite`; local dev-favicon plugin gone.
- `src/main.jsx` — `hideLoaderApp()`; the runtime yellow-E dev favicon gone.
- `src/assets/fxr-mark.svg` — the loader's mark (was inline `#fxr-boot`).
- `index.html` — loader markup/CSS out; `noindex` out, canonical in; `data-theme="dark"` on `<html>`.
- `public/robots.txt`, `public/sitemap.xml` — new.
- `scripts/generate-icons.mjs` — Mirror's generator for FXR; 180/192/512/OG regenerate pixel-identical, maskable 512 now 50%.
- `README.md` — rewritten for the app (was the npm-package README).
- `.kol/llm-plan/36-front-door-gaps-and-the-loader.md` — written and built.

### Features Added/Removed
- Root screenshots `blk-new.png` · `blk-old.png` · `pkg-editor.png` → `_tmp/2026-10-22-root-screenshots/`; pre-change files in `_tmp/2026-10-22-plan-36-*`.

## Current State

### Working
- Loader walked on `vite preview` in light, dark and reduced motion; leaves after first render; 0 console errors. Dev tab shows the DS `X` tile.
- With no saved choice FXR opens dark; a saved light/dark wins.

### Known Issues
- None found.

## Next Steps
1. Plan 36 is closed; the chrome walk against Affinity / Figma (plan 37) is still the next arc.
