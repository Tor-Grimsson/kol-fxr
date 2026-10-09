# Audit — pass F: data and persistence (plan 21 § F)

**Run:** 2026-10-09, local (MBP), `vite preview` of the current `dist/`, Chromium via the Playwright MCP. The canvas from passes B–C (one of every layer type, two tile-inserted photos and one dropped PNG) reloaded, the storage read, a setting toggled across a reload, the labs draft, the sign-in affordance. Nothing fixed.

## What is there

`localStorage`: `kol.editor.draft` (4.4 KB, the editor canvas) · `kol.editor.labs-draft` (the labs stage, consumed when a chrome's restore prompt is answered) · `kol.editor.library.v3` (the saved set) · `kol-editor-settings` (written on the first change: `defaultAspect · defaultTheme · autoplay · clipToFrame · labsModDots · rollScopes · rollEffects · defaultLoopSeconds`) · `kol-editor-show-dots` · `kol-theme` · `kol-theme-v`. IndexedDB: none until a video is dropped (the clip store is gated behind `indexedDB.databases()` — correct).

Works: reload with a draft → *Restore your last canvas?* → **Restore** brings back all 11 layers, every tile-inserted photo (`/media/01.jpg`) intact; **New file** resolves the draft; a setting toggled in the drawer (Clip to frame) lands in `kol-editor-settings` and survives the reload; the labs draft prompts on `/labs` and `/morph` and is skipped on a deep link (plan 19 § 1).

## Findings

**F1 · A dropped image dies with the window.** The draft stores the dropped PNG as `src: "blob:http://localhost:4977/2eb8c36b-…"` — a URL that exists only in the session that made it. After the reload the layer row is back and the browser logs `Failed to load resource: net::ERR_FILE_NOT_FOUND @ blob:…` (the one console error of the whole audit); the photo is a blank. Only **videos** reach the clip store: `compose/CanvasArea.jsx:313` `if (isVideo && id) saveClip(id, file)` — images take `URL.createObjectURL(file)` (`:301`) and are never persisted. The same path in `shell/panels/EditorFooter.jsx:99–107` (`readAsDataURL` for one, `saveClip` for the other). The user's 24, root-caused. *fix: images through `saveClip` like videos (one guard), rehydrated with them.*

**F2 · The cloud is silently absent from a build without `VITE_FXR_API`.** `src/App.jsx:16` `setLibraryApi(import.meta.env.VITE_FXR_API)`; no `.env*` in the repo, so this local build has no API base — and with it no sign-in affordance anywhere (the rail, Home, Settings: none, measured), no D1 sync, no Files-from-cloud, and nothing says so. The live site has the variable from Vercel. *fix: a visible "no cloud configured" state, or a `.env.example` + a build-time warning; the sign-in flow itself (wrong password · signed in · signed out) could not be walked here — the user's live pass, or a local Worker with `api/.dev.vars`.*

**F3 · Modulation dots are two settings in two stores.** The editor's dots live in their own key (`params/dotVisibility.js:13` `kol-editor-show-dots`, the `M` key); labs' dots are `labsModDots` inside `kol-editor-settings` (`settings/AppSettings.jsx:116`, `labs/LabsParams.jsx:467`). One concept, two switches, two keys — the Settings page shows only the labs one. *fix: one setting, one key.*

Clean: the clip GC never creates an empty database; the restore prompt's two buttons do what they say; the labs draft and the editor draft are separate keys and do not cross.
