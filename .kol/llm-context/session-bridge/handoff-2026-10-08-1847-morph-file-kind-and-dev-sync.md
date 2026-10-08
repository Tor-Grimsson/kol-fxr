# Handoff — 2026-10-08 18:47

## Goal of the current arc
The editor is this repo's source again and the app saves to D1 behind a Worker. The last push of the day made a morph a file kind (plan 09) and made `pnpm dev` run the app and the Worker together. Everything is built and walked on the built bundle; nothing of it is pushed yet.

## Last actions taken (causal trail, newest first)
- Signing out asks first: the cloud row opens a confirm ("Sign out of the library sync?") with Cancel · Sign out — `src/AppLayout.jsx` `RailSignIn`. Sync and plan-08 walks updated and green.
- `pnpm dev` = `scripts/dev.mjs`: applies `api/schema.sql` to local SQLite, starts the Worker on 8787 and Vite with `VITE_FXR_API` injected, each child in its own process group so one Ctrl+C stops both (proven). `pnpm dev:app` is Vite alone.
- Plan 09 built: `mode` on every saved file (`buildSpec`, kept by the preset validator — which also dropped `canvasW/H` until today), New File's four doors (`src/components/NewFileDialog.jsx`), the Morph tab in labs (`src/editor/morph/{morphStore,StepPicker,MorphTab}.jsx`), `?open=` / `?new=` through `src/editor/library/UrlIntents.jsx` (strips the URL a tick late, after the provider's restore check), the randomiser's read-only Morph tab (its `useMorph` is the first hook — React #310 otherwise), the randomiser starting live on `?open`, Morph… gone from the File tab. The old dialog is in `_tmp/2026-10-08-morph-dialog/`.
- Plan 08 built earlier the same evening: Home lists files when signed in, open / rename / duplicate / delete, `⌘O` for the Files dialog, Library placeholders only when empty.
- Docs updated: overview, operations (build targets, the built-bundle rule, Vercel redeploy), persistence (D1 sync, Home's files, modes), timeline (Morph), loop layer (the Rings seam); `ARCHITECTURE.md` §2 + §N.

## Current state / open decision points
- **Not pushed.** The live site is at `fxr-1003`-era code (the packs fix and the rail sign-in); plans 08 + 09, the dev script and the sign-out confirm are only local. Push, then check `fxr.kolkrabbi.io`: labs picks, the rail Sign in, New File's doors, a morph.
- **Production D1 has 0 rows.** Every walk ran on local SQLite. The first real save from the live site is still to be seen.
- **The step picker before a first step** lists every generator's presets in one flat list, no group labels — the `eyebrow` on `ContentRow` does not render in the default variant. Wants grouping or a search; logged in plan 09.
- **The DS's `packages/design-editor` still publishes** for its own apps; the two trees diverge from today on. The user's ruling is outstanding.
- A page reload ends the sign-in session (password never stored) — by design; a per-tab session is a possible later line.
- Bitwarden item `KOL fxr database` still does not exist; the password is on the gitignored card.

## Next intended action
- Push and verify the live site (above). Then `/log-work` for this half of the day — the playbook `2026-10-08-morph-is-a-file-kind.md` carries the milestone and says so.

## Working memory not yet in AGENT-CONTEXT
- The library's `validatePreset` is a whitelist: any new field on a saved file must be added there or it silently vanishes on save and on load.
- Child effects run before provider effects — anything that reads the URL on mount (the restore check, labs' seed) runs after `UrlIntents`, which is why the strip is deferred.
- Playwright `hasText` regexes are not trimmed: an icon button's text has whitespace around it, so `/^Sign in$/` misses and `/\bSign in\b/` hits. A `ContentRow`'s wrapper is `role=button` and its accessible name includes its actions' labels, so `getByRole('button', { name: 'Delete' })` matches the row first — use `.last()` or the `aria-label` selector.
- The walk scripts are copied to `_tmp/2026-10-08-walk-scripts/` (gitignored): `plan09-walk` · `plan08-walk` · `sync-check` · `home-check` · `desk-walk` · `touch-walk` · `library-door` · `seam-probe2` · `signin-feedback`. They expect the built bundle on `vite preview --port 5399` and the Worker on 8787, built with `VITE_FXR_API=http://127.0.0.1:8787`, and import Playwright from `~/dev/projects/kol-ds-ui/node_modules`.
