# FilesDialog — the save/load surface the editor never had

**Filed:** 2026-09-04 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/FilesDialog.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-09-04 — **design-editor 0.10.0 + kol-component 0.212.0**, verified by running it here

## Why it went there

The user asked for "a proper save load import export delete files dialog". Every
one of those verbs is inside `@kolkrabbi/design-editor`, which moved to kol-ds-ui
on 2026-09-03 — and `<DesignEditor>` accepts exactly one prop, `mediaProxyBase`.
There is no seam from this repo to editor state, so this could not be built here
even as a first cut.

Unusual for the outbox: the source cited in the spec is **the DS's own package**,
not a consumer fork of it. Nothing was lifted from fxr.

## What the spec says

Read before filing, not recalled:

- `onSave` / `onSaveAs` → `addItem('preset', spec)`, name via a bare `modal.prompt`
- `onSaveSettings()` → `downloadBlob`, filename **hardcoded** `kol-design-editor.json`
- `onLoadSettings(file)` → validates the `{page,version,spec}` envelope
- `removeItem(slot, id)` → `LibraryProvider.jsx:291`, full CRUD already on the context

So **only rename, duplicate and a name-on-export are new work.** The rest is
working plumbing with no UI over it.

The spec builds it as **`MediaLibrary`'s twin** — that organism is already a
browser over a store in two views, composed of `FullscreenOverlay` ·
`ContentFilters` · `ContentCard` · `ContentRow` · `MediaViewer`. It also
pre-empts MediaLibrary's own read-only ruling, which is about remote bucket
credentials and does not transfer to a localStorage store this package already
mutates on every save.

## What stays here

Nothing to hold. This repo carries no editor source since 2026-09-03 — there is
no local copy to delete on the return, only a version bump to take.

One thing deliberately **not** asked for: a `backend` prop on `LibraryProvider`.
That is the D1 sync seam scoped in `.kol/llm-plan/03-files-and-environment.md`,
it is a separate ask, and the spec says so explicitly — the library API must stay
synchronous or the write-behind design collapses into an async rewrite.

**Remainder here:** none — done 2026-09-04.

## The return

**`@kolkrabbi/design-editor@0.10.0` + `@kolkrabbi/kol-component@0.212.0`**, both
pinned exact. Both tarballs fetched before the bump (200 + real bytes) rather
than trusted from metadata, and both installed copies re-read from disk —
design-editor ships `dist`, so the check has to look inside the bundle.

**Verified in a browser, not on a build.** `/editor` → File → Files…, against a
real store:

- empty state renders (`Nothing saved yet`)
- saved `Alpha` from the dialog's own Save-current-frame row
- duplicated it → `Alpha copy`
- renamed inline → `Beta`, persisted to `kol.editor.library.v3`
- opened the copy, deleted it through the `useModal` confirm
- 0 console errors across the whole pass

**Their flagged behaviour holds:** opening a file adopts its identity — the menu
item changes `Save…` → `Save` and a plain save wrote through, count stayed at 2.
That is the silent-duplicate bug this dialog existed to make visible.

**Two deliberate deviations from the spec, both accepted.** A
"Save current frame" row (the spec's anatomy had no way to SAVE from inside the
dialog, so `modal.prompt` would have survived — the thing the ticket existed to
kill), and `initialFilters` on `ContentFilters`, which needed the DS change to
make `initialKind` reachable.

**One discrepancy, recorded not reopened:** the return says a duplicate lands
"directly after its original". In storage it does; the rendered list sorts
newest-first, so the copy appears **above** it. Cosmetic, and the user closed
the ticket with it known.
