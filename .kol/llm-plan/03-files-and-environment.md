# Plan — a real files dialog (save · load · import · export · delete) + the environment behind it

**Status:** scoped, uncommitted (2026-09-04) · **Origin:** user ask 2026-09-04, immediately after creating the `kol-fxr` D1 database — "scope a proper save load import export delete files dialog and environment".
**Scope ruling:** shape-level. Every file path below was read in the installed package's source, not recalled.

## What exists today (read 2026-09-04, `kol-ds-ui/packages/design-editor/src`)

The five verbs already exist — as five unrelated surfaces, none of which is a files dialog.

| verb | today | where |
|---|---|---|
| save | `onSave` / `onSaveAs` → `addItem('preset', spec)`, name via `modal.prompt` | `editor/compose/useComposeFile.js` |
| load | `loadPreset(spec)` from the library panel, or from a picked file | same + `LibraryProvider` |
| import | `onLoadSettings(file)` — validates `{page,version,spec}`, rejects foreign files | `useComposeFile.js` |
| export | `onSaveSettings()` — downloads **`kol-design-editor.json`**, name hardcoded | `useComposeFile.js` |
| delete | `removeItem(slot, id)` — full CRUD already on the context | `editor/library/LibraryProvider.jsx:291` |

Storage is four hardcoded localStorage keys: `kol.editor.draft` (`compose/state.jsx:29`), `kol.editor.library.v3` (`LibraryProvider.jsx:29`), `kol-editor-settings` (`lib/appSettings.js:19`), `kol-editor-theme`.

**The constraint that shapes everything:** `<DesignEditor>` accepts exactly one prop, `mediaProxyBase`. There is no seam for a host to supply storage, and the editor is kol-ds-ui's since 2026-09-03 — so the dialog is a **DS ticket** and only the backend is fxr's.

## The design

**Local-first, D1 as sync target — never as the store.**

The library context is **synchronous** (`addItem` returns an id inline). A remote store is async, and rewriting that API async would touch every call site for no user-visible gain. So localStorage stays the session's source of truth, and a backend flushes changes outward and hydrates inward through `replaceAll`, which the provider already exposes. Offline, unauthenticated, or env-var absent, it degrades to exactly today's behaviour with no branch in the UI.

This also keeps the standing ruling intact: **the draft autosave never goes near D1.** It is a 500 ms debounced write; the free tier allows 100k row writes a day and enforces it with hard errors since 2026-09-01. Explicit saves only.

### The seam

`LibraryProvider` takes a `backend` prop; default is the current localStorage implementation, so every other embedder is unaffected.

    hydrate()            → [{ id, kind, name, spec, updatedAt }]   // once, on mount
    push(op)             → fire-and-forget { put | remove }        // write-behind

### The dialog

One surface over the unchanged context API — the four library slots (preset / palette / pattern / type) as one list with `kind` as a filter, plus rename, duplicate, and **a name field on export** (the hardcoded `kol-design-editor.json` is the current gap). Import and export need no backend: they are the same `.json` envelope through `downloadBlob` and `FileReader`.

### The environment

Three, selected by one env var, no code branching:

| env | `VITE_FXR_API` | behaviour |
|---|---|---|
| local | unset | today exactly — localStorage only. The `pnpm dev` default. |
| remote-dev | `http://localhost:8787` | `wrangler dev` against the real D1 |
| production | `https://fxr-api.kolkrabbi.io` | deployed Worker |

**The API cannot be a Vercel function.** fxr deploys to Vercel; a D1 binding needs a Cloudflare Worker. So a small Worker lives in this repo (`api/`), deploys with `wrangler`, and holds the only D1 binding — Vercel keeps serving the SPA and its `/media` rewrite untouched. This is the one structural difference from olina, which had Pages Functions on the same origin.

Auth is olina's: one password, `Authorization: Basic`, **prompted and dropped**, never persisted client-side. `ADMIN_PASSWORD` as a Worker secret, `.dev.vars` locally. Cloudflare Access goes in front before it is ever multi-user.

### Schema — one table

    documents(id TEXT PRIMARY KEY, kind TEXT, name TEXT, spec TEXT,
              updated_at INTEGER, deleted INTEGER DEFAULT 0)

One table for all four slots; `kind` discriminates. **Soft delete**, or a stale client's hydrate resurrects what another machine deleted. No events table until something needs one.

## Steps

1. **Files dialog in the DS** — one surface over the existing sync context: list + filter by kind, rename, duplicate, delete, and a name field on export. No remote, no API change. Lobby ticket to kol-ds-ui. Done when: every verb is reachable from one place and `kol-design-editor.json` is no longer a fixed filename.
2. **`LibraryProvider backend` prop + write-behind** — default localStorage, so nothing changes unless a host passes one. DS ticket. Done when: fxr can pass a no-op backend and behaviour is identical.
3. **The Worker** — `api/` + `wrangler.toml` + schema, D1 binding `DB`, password secret. Done when: `curl -u admin:… /api/documents` returns `{"documents":[]}` against remote D1.
4. **fxr passes the D1 backend**, gated on `VITE_FXR_API`. Done when: a save on one machine appears on another after reload, and unsetting the var restores local-only with no UI difference.
5. **Cloudflare Access** — before a second person ever touches it.

## Excluded (deliberate)

- **Draft autosave to D1.** Standing ruling; the write cadence alone rules it out.
- **Async library API.** Write-behind exists precisely to avoid it.
- Sharing, permissions, multi-user — Access first, then a conversation.
- File System Access API — the `.json` download/upload pair is the portable bridge and already works.
- An events/audit table.

## Risks / laws

- **Log intentions, never interactions.** One row-write per explicit save. Nothing per-keystroke.
- **Store R2 keys, not URLs** — this estate renamed a CDN host once (`media.` → `r2.`, 2026-08-26) and orphaned every absolute URL.
- Steps 1–2 are kol-ds-ui's and gate 4. Filing them early is the whole schedule.
- `wrangler pages dev --d1` and `wrangler d1 execute --local` key local SQLite differently — a schema applied by one is invisible to the other and reads as "no such table" while everything is wired correctly.
