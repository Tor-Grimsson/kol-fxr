# library-reader-for-a-hub-home — the one seam between fxr's Home and `HubHome`

**Filed:** 2026-10-07 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/library-reader-for-a-hub-home.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟠 `addressed` 2026-10-07 — **design-editor 0.22.0** exports `loadLibrary()`; closes on fxr adopting it (synced 2026-10-07)

## Why it went there

The library store and its reader are `@kolkrabbi/design-editor`'s. `HubHome` is kol-shell's.
Both sides of the seam are theirs; fxr holds neither.

## Why it exists

fxr went onto `AppHub` this session (user ruling 2026-10-07) — Settings, the `S` sheet and the
rail are the Hub's. Home could not follow: `HubHome` takes its items as data, and the SAVED set
needs `useGeneratorLibrary()`, whose provider would go stale beside the editor's own
(`Editor.jsx:80` mounts one; the `storage` event is cross-tab only). Keying it remounts the
shell. Reading the storage key ourselves is the shim the 2026-08-09 ruling forbids.

## The ask, compressed

Export the sanitised reader (`loadFromStorage`, `LibraryProvider.jsx:222`) from the `core`
entry. `home.items = (view) => …loadLibrary().preset` then reads fresh on every render and the
shell tier mounts no provider.

## What stays here

`pages/HomePage.jsx` on its own `CatalogPage`, unchanged, until the reader publishes. Then:
bump, `home={…}` on `AppHub` per `.kol/llm-plan/04-bump-and-the-hub.md` § 2, `HomePage.jsx` →
`_tmp/`, the `/` route to `element={null}`, and the browser check — a preset saved in `/editor`
on Home's SAVED in the same tab.

**Remainder here:** none yet.

## ✅ RETURNED — 2026-10-07 · @kolkrabbi/design-editor@0.22.0

`loadLibrary()` is exported from the root and `core` entries — the provider's own `loadFromStorage`
under that name, validators and migrations included; `preset` carries `{ id, name, layers, aspect,
savedAt }` as stored. Proven in `apps/editor-hub` on `AppHub`: File → Save… in `/editor`, ⌥1 to Home
in the same tab, SAVED lists the preset, 0 console errors. Two notes for fxr: the `S` / `,` split by
route is the same one editor-hub runs; a saved preset's card wants `media: false` in `toCard` so it
draws no MISSING plate (kol-component 0.210.0).

**Remainder here:** none — done 2026-10-07. design-editor 0.22.0 pinned, `home={…}` on `AppHub` over
`loadLibrary()`, `HomePage.jsx` → `_tmp/2026-10-07-pages-onto-the-hub/`, saved cards `media: false`.
Verified in a browser: File → Save… in `/editor`, ⌥1, SAVED lists it in the same tab, no MISSING plate,
0 console errors. On the way: the lazily appended editor stylesheet was beating the app's `md:flex`
with its own `.hidden` (same `@layer utilities`, later in source) — the strip vanished after a visit to
`/editor`; the stylesheet is imported first in `index.css` now. Worth a line in the DS's consumer
notes: any host that lazy-loads `design-editor/style.css` beside its own Tailwind has this.
