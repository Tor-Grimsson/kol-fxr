# Session: The editor comes home, the ring seam, Morph…, D1 behind a Worker, and the deploy that shipped a tree-shaken bug

**Date:** 2026-10-08
**Agent:** Grim (Fable 5.1)
**Summary:** The user ruled out DS round-trips for editor work; the editor's source came back into `src/` from the sibling checkout, both plan-05 items were built here and walked, the library syncs to D1 through a Worker with a rail sign-in — and the first deploy of all this shipped with the generator packs tree-shaken out, found on the live site and fixed.

## Changes Made

### Files Modified
- `src/` — `packages/design-editor/src` at 0.23.0 copied in whole (`editor/` `loops/` `filters/` `kinetic/` `brand/` `data/` `packs/` `settings/` `components/styleguide/` `core.jsx` `index.jsx` `index.lib.css` `railExtras.js`); `public/fonts/TG/` + `Right-Grotesk-ttf/` copied; `@kolkrabbi/design-editor` dropped from `package.json`; `App.jsx` · `AppLayout.jsx` · `pages/LibraryPage.jsx` import `./index.jsx`; `index.css` no longer imports the editor stylesheet (one Tailwind pass)
- **`package.json` — `sideEffects` removed.** The retired library build's field told the APP bundler every module is pure, so `import './packs'` was tree-shaken out of production: `pack('generators')` null, labs could not pick, the editor route went black — on `fxr.kolkrabbi.io`, after the first deploy. Dev never tree-shakes, which is why every walk had passed. Verified fixed on `vite preview` of the built bundle
- `src/loops/scanline/engine.js` — rings are `closed` paths of n points; `renderScanlines` pre-rolls a closed path once (field values cached) and emits from the carried sum. The 3 o'clock seam is gone (`_tmp/2026-10-07-hub-walk/seam-{before,after}-crop.png`)
- `src/editor/morph/` — `buildMorph.js` (+ `buildMorph.check.mjs`), `morphDialogStore.js`, `MorphDialog.jsx`, `MorphDialogHost.jsx`; `EditorFooter.jsx` File tab gets **Morph…**; the host mounted in `Editor.jsx` and `LabsView.jsx`
- `src/editor/labs/LabsView.jsx` — also mounts `FilesDialogHost`: labs' Files… and Save as… buttons had never worked (the host was the editor's only)
- **D1 (plan 07):** `api/wrangler.toml` · `api/schema.sql` · `api/src/index.js` · gitignored `api/.dev.vars`; scripts `api:dev` · `api:schema` · `api:schema:local` · `api:deploy`; `wrangler` devDependency, `workerd` in `allowBuilds`. **Deployed: `kol-fxr-api` at `https://fxr-api.kolkrabbi.io`**, schema on the real D1, `ADMIN_PASSWORD` set from the card
- `src/editor/library/libraryApi.js` (new: `setLibraryApi` · the session `signInLibrary` / `signOutLibrary` / `useLibrarySession` · `createD1Backend`), `mergeRemote.js` (+ check), `LibraryProvider.jsx` (follows the session: hydrate + merge, one push per verb), `core.jsx` exports, `App.jsx` `setLibraryApi(import.meta.env.VITE_FXR_API)`
- `src/AppLayout.jsx` — **Sign in is a pinned rail row above Settings** (`user` icon, reads Sign out once in), the gesture under the shell's own `ModalProvider`; `shell.bottomItems` names Settings too
- `docs/operations/01-services.md` — the Worker, the schema decision, the credentials row
- `.kol/llm-plan/05` (built) · `06` (done) · `07` (built, deployed)

### Features Added/Removed
- The editor is this repo's code again; nothing is published; no DS tickets for editor work
- Rings without a seam; Morph… between saved presets of one generator (tracks, the timeline dock, Save and bake as before)
- The library syncs to D1 for the session after a rail Sign in; without the env or a sign-in the app is localStorage only, as before

## Current State

### Working
- On the **production bundle** (`vite preview` + the local Worker): every route at 1600 and 390, the save-to-Home path, labs' library door, Morph…, and the sync — rail Sign in, a save on A in D1, B hydrates it, B's delete a tombstone, A's re-sign-in drops it, 0 console errors
- Live Worker: 401 without the password, `{"documents":[]}` with it, CORS for the app's origin
- Vercel has `VITE_FXR_API`; GitHub has `fxr-1002` (45cbed6) with all of it

### Known Issues
- **The 1002 push never reached Vercel** — the GitHub → Vercel webhook delivery was lost; reconnecting the repo does not replay a push, so an empty commit on top was the trigger. Verify the live bundle hash moved off `index-BYBv3mYH.js` and labs picks on `fxr.kolkrabbi.io`
- `AGENT-CONTEXT`'s "app, not a package" is retired by plan 06; `ARCHITECTURE.md` §2 is true again, §N's publishing line is not — his word
- The DS's `packages/design-editor` still exists and publishes; two trees under one name diverge from the first edit — the DS session said so on record, the call is the user's
- `scripts/check-core.mjs` was not copied (a pre-existing fail in the DS, not in `pnpm validate`)
- The Bitwarden item `KOL fxr database` still does not exist; the password is on the gitignored card

## Next Steps
1. Confirm the live bundle after the empty-commit deploy: labs picks, the rail's Sign in, a save landing in D1 from `fxr.kolkrabbi.io`
2. Decide the DS copy's fate (retire from the roster, or fxr pins again) — a ruling to record before it diverges
3. Plan 05's leftovers: OKLCH color lerp, the crossfade for differing geometries; plan 07's: Cloudflare Access before a second person
