# HubHomeContract — Home is a closed data contract on `HubHome`; the hub draws every card

**Filed:** 2026-10-23 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HubHomeContract.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-24 — shipped in kol-shell 0.77.0 · kol-theme 0.184.0 · kol-component 0.296.0 (registry live)

## Why it went there
The three Homes (fxr · mirror · monitor) were promised identical and are not: `HubHome` shares only the frame
and spreads every consumer prop into `CatalogPage`, so each app writes its own card mapping, label, list layout
and CSS. The `app` preset froze the look, not the mapping. The fix is the hub building the cards from data
(`files` · `template` · handlers) and accepting nothing else — the `shelf` precedent, at the `HubHome` tier.

**The user's conditions, in the ticket:** the DS builds it in `apps/hub` on dummy data FIRST and he reviews it
there at desktop and phone widths before any of the three apps adopt; and the `app` card/row get a real mobile
breakpoint pass at 390 and 768.

## What stays here
Nothing until the return. On the return: bump; `home` on `AppHub` becomes `files` · `template` · `onOpen` ·
`onDownload` · `onRename` · `onDuplicate` · `onRemove` · `action` (the `toCard`, `preset`, `rowVariant`,
`defaultLayout`, `filtersTitle` lines go); `bytesOf`'s Blob count leaves with it; delete the `/` → `/randomiser`
touch redirect at `src/AppLayout.jsx:308` and make New File open the chooser on touch; then walk all three
apps at 1280 and 390 in one pass, side by side, before anyone says "same". kol-fxr-f7 relays the same adoption to
the mirror and monitor sessions.

**Remainder here:** none yet — on the return: the steps above, after the user's sign-off on `apps/hub`.

## ✅ RETURNED — 2026-10-24 · kol-shell 0.77.0 · kol-theme 0.184.0 · kol-component 0.296.0

Closed by the DS on the publish; adopted here in the Studio adoption run from kol-ds-ui (steps 1–9): fxr on
`AppStudio`, Home on `files` + handlers (`renameStored` · `duplicateStored` · `removeStored`), the `/` →
`/randomiser` touch redirect gone. Pass against studio-hub green, 54/54 at 1440 and 390; `vite build` green.

**Remainder here:** none — adopted 2026-10-24.
