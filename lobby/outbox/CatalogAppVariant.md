# CatalogAppVariant — an `app` variant on ContentCard + ContentRow and `preset="app"` on CatalogPage

**Filed:** 2026-10-23 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/CatalogAppVariant.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-22

## Why it went there
The approved file card (2026-10-22) is the DS `file` frame with fxr's own parts in it (`src/components/FileCard.jsx`). kol-mirror and kol-monitor need the same card; a DS variant ships it to all three by a bump instead of three hand copies drifting. `file` stays as it is for its bare consumers.

## What stays here
On the return: Home (`AppLayout.jsx`) and `/library` (`LibraryPage.jsx`) onto `preset="app"`, passing `verbs` · `download` · `date` · `size` · `media`; `FilePlate`, `FileMenu`, `FileThumb`, `FILE_TONE`, `fileDate`, `bytesOf` retire to `_tmp/`.

**Remainder here:** none yet — on the return: the steps above.

## ✅ RETURNED — 2026-10-22 · kol-component@0.291.0@·@kol-shell@0.75.0

kol-component 0.291.0 · kol-shell 0.75.0: `CatalogPage preset="app"` — `toCard` returns `verbs` (`{ rename?, duplicate?, remove? }`) · `download` · `menuItems` · `date` ms · `size` bytes · `media` src; the page draws download on the cover, cog over trash, and one Rename · Duplicate · Delete menu on cog and right-click. Home: return `variant: "app"` per card. mirror and monitor guidance is in the ticket resolution.

**Remainder here:** bump kol-component@0.291.0 · kol-shell@0.75.0; Library onto `preset="app"`, Home cards `variant: "app"`; retire FilePlate · FileMenu · FileThumb · FILE_TONE · fileDate · bytesOf to `_tmp/`.

## Adopted — 2026-10-23

kol-component 0.291.0 · kol-shell 0.75.0 pinned; Library on `preset="app"`, Home cards `variant: 'app'`; five parts retired to `_tmp/2026-10-23-filecard-app-variant/` (`bytesOf` kept — both pages read it). Walked `/library` on `vite preview`. Closed here as `FxrLibraryOnAppPreset`.

**Remainder here:** none — adopted 2026-10-23.
