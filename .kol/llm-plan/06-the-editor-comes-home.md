# Plan — the editor comes home: `src/` from the sibling checkout, no link, no tickets

**Status:** DONE 2026-10-08 — copied, repointed, built and walked (every route at 1600 and 390, the save-to-Home path, labs' library door, 0 console errors). The DS session confirmed first: src is exactly 0.23.0, nothing unreleased, nothing outside src but the fonts and `/media/`. Its view on record: two editors under one name drift — its copy retires or stays the source, the user's call. · **Origin:** user ruling 2026-10-08 — *"we are not doing round-trips to DS"* · *"we are not making a link to ds"* · *"ds is literally a sibling… grab the files directly from there"*. Reverses the 2026-09-03 move; restores the layout `ARCHITECTURE.md` §2 and the docs' source maps still describe.
**Scope ruling:** read in `~/dev/projects/kol-ds-ui/packages/design-editor` at 0.22.0 (workspace == npm tonight). The copy is a file operation; nothing is built.

## What disconnects

One thing: the `@kolkrabbi/design-editor` npm dependency. The DS tier — component · theme · icons · shell · framework · media-client · brand — stays on npm exactly as pinned today. Those are stable primitives; the editor and its engines are this repo's work again.

## What comes over, and from where

| from `kol-ds-ui/` | to `kol-fxr/` | note |
|---|---|---|
| `packages/design-editor/src/*` (3.4 MB: `editor/` `loops/` `filters/` `kinetic/` `brand/` `data/` `packs/` `settings/` `components/styleguide/` `core.jsx` `index.jsx` `index.lib.css` `railExtras.js`) | `src/` — merged at the root, the pre-09-03 layout | no file collides: fxr's `src/` holds `App` · `AppLayout` · `main` · `pages/` · `components/hooks/` · `index.css`; its `index.lib.css` is the same file's older copy and is overwritten |
| `public/fonts/TG/` (3 `.ttf`) | `public/fonts/TG/` | the kinetic-type fonts the source reads at `/fonts/TG/…`; fxr has `jetbrains-mono` `right-grotesk` `Right-Grotesk-Mono` and no `TG` |
| `public/fonts/right-grotesk-ttf/` | `public/fonts/Right-Grotesk-ttf/` | the source reads `/fonts/Right-Grotesk-ttf/PPRightGrotesk-…ttf`; check the case the files are served under before copying — fxr's folder is `right-grotesk`, which may already be it |

Nothing else. Every bare import in the source (`@kolkrabbi/kol-component` · `kol-framework` · `kol-icons` · `kol-media-client` · `kol-shell` · `colord` · `d3-delaunay` · `d3-force` · `mediabunny` · `opentype.js` · `paper` · `pixi-filters` · `pixi.js` · `simplex-noise` · `three` · `react`) is already in `package.json` — checked by script, zero missing. The source's only references to its own package name are comments.

Not copied: `vite.lib.config.js`, `scripts/check-core.mjs`, `CHANGELOG.md`, `README.md`, `dist/` — the package's own build and bookkeeping. fxr already has a vestigial `vite.lib.config.js` + `build:lib` script; publishing is off the table and they stay as they are.

## Edits after the copy

1. `package.json` — remove `"@kolkrabbi/design-editor"`; `pnpm install`.
2. `src/App.jsx` — `from '@kolkrabbi/design-editor'` → `from './index.jsx'`; the four lazy `import('@kolkrabbi/design-editor')` → `import('./index.jsx')`.
3. `src/AppLayout.jsx` — the one import → `'./index.jsx'`.
4. `src/pages/LibraryPage.jsx` — the one import → `'../index.jsx'`.
5. `src/index.css` — delete the eager `@import "@kolkrabbi/design-editor/style.css"` and its note. With the editor as app source there is **one** Tailwind pass: Tailwind scans `src/` itself, the component sheets (`kol-editor.css`, `kol-labs.css`, …) ride the JSX imports, and the two-stylesheet cascade bug of 2026-10-07 cannot exist. `index.lib.css` is the embeddable build's sheet and is not imported by the app (it never was before 09-03).
6. `vite.config.js` — nothing. The `optimizeDeps.exclude` list is for the npm KOL packages and stays.
7. Walk: `pnpm dev`, every route at 1600 and 390, the save-to-Home path, `/labs` and `/randomiser` chrome — the three scripts from the 2026-10-07 walk, re-pointed.

Order: copy first, then 1–6 in one pass, then 7. One session.

## What it changes on paper — his word, not mine

- `AGENT-CONTEXT.md` *"THIS REPO IS AN APP, NOT A PACKAGE (2026-09-03)"* becomes false the day the copy lands. `ARCHITECTURE.md` §2 becomes true again (it was never updated for the move). Both need a line from him.
- `kol-ds-ui/packages/design-editor` keeps existing and publishing for its other consumers (`apps/editor-hub`, `apps/labs`, `apps/randomiser`, kol-client-olina's deck). From the copy on, the two trees **diverge**; whether the DS copy is retired, or fxr's work flows back there some other way, is a ruling to record before the first divergent edit — not a thing to decide here.
- The 33 round-trip tickets to the DS stay history. New editor work here files nothing.

## Then

Plan 05 (`preset-morph-and-the-ring-seam`) executes here: `src/loops/scanline/engine.js` for the seam, `src/editor/` for Morph…. Its § 5 ("nothing to build here") and its DS-ticket steps are void once this plan lands.
