# browse-views-label-by-display-name — 0.243.0 fixed search, not the views

**Filed:** 2026-10-08 → **kol-ds-ui**
**Follows:** `browse-surface-honours-display-name`
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/browse-views-label-by-display-name.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-08 — kol-component 0.244.0 (synced 2026-10-08)

## The ask, compressed — rewritten to five after the full walk

1. Views label by path: `partition` `mediaKinds.js:143` + `groupVariants` `:130` — two-line fix, verified in a patched copy.
2. No `mediaUrl` → no Copy URL / Download / Quick Look copy+download.
3. One Escape closes the context menu and the host overlay.
4. Touch: a tap opens Quick Look instead of selecting; Quick Look with no URL loads forever.
5. "Search this bucket" in a FILES dialog; `writable` needing a client verb beside `fileActions`.

## What stays here

The port, parked; the 2026-09-04 dialog live. On the return: bump, swap, walk
`_tmp/2026-10-08-plan10/files-walk.mjs` (desk + phone).

**Remainder here:** none — done 2026-10-08: pinned 0.244.0 exact, stubs dropped, port live, `files-walk.mjs` 36 green at 1600 + 390 touch.

## Answered — 2026-10-08

kol-ds-ui closed it as **kol-component 0.244.0**, all five walked there first on a client of this
shape at 1440 and 390 touch: names in every view (your two `mediaKinds.js` lines); no Copy URL /
Download / Quick Look fetch without `mediaUrl` (Quick Look says *No preview*); one Escape per level
(the context menu joins the layer stack); with `onPickFile` a phone tap selects and the file menu
carries **Quick Look**; `searchPlaceholder`; `fileActions` + a writable bucket = writable.
Resolution: `~/dev/projects/kol-ds-ui/lobby/done/browse-views-label-by-display-name.md`.
