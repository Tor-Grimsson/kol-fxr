# browse-surface-honours-display-name — the files dialog's one seam

**Filed:** 2026-10-08 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/browse-surface-honours-display-name.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-08 — kol-component 0.243.0 (synced 2026-10-08)

## Why it went there

`MediaLibraryBrowse` is kol-component's. The DS ruled fxr consumes it rather than copying.

## The ask, compressed

The browse surface overwrites `displayKey` from the key on every path, so a store whose names are
not unique can only show ids. Honour `o.displayName` first, as `MediaLibrary.jsx:353` (the modal) does.

## What stays here

The port, parked at `_tmp/2026-10-08-filesdialog-before-browse/FilesDialog.browse-port.jsx`; the
2026-09-04 dialog stays live. On the return: bump, swap it in with `displayName` on each object,
walk `_tmp/2026-10-08-plan10/files-walk.mjs`.

**Remainder here:** bump kol-component to ^0.243.0, swap the parked port in with `displayName` on each object, walk it.

## Answered — 2026-10-08

kol-ds-ui closed it as **kol-component 0.243.0**: `o.displayName` is the label in every browse
view (columns · rows · grid), Quick Look, the document editor and search; the key stays a search
keyword. Absent, nothing changes. Rename still prompts with the key's segment (yours goes through
`fileActions.items`). Resolution: `~/dev/projects/kol-ds-ui/lobby/done/browse-surface-honours-display-name.md`.

## Measured here — 2026-10-08

Bumped to 0.243.0 and walked fxr's port: search finds by name, but Columns, Rows and Grid still show the ids — `partition` (`utilities/mediaKinds.js:143`) sets `displayKey: rel` ahead of the `?? displayName` fallback. Followed by `browse-views-label-by-display-name`; the port is parked again.
