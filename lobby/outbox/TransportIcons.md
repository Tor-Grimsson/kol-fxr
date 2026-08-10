# TransportIcons — `stop` + `rewind` for the TransportBar

**Filed:** 2026-08-09 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/TransportIcons.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-09 — shipped in `@kolkrabbi/kol-icons@0.13.0`: both names resolve as real drawings in `playback/` (promoted from the DS's legacy stroke shelf, keyline-conformed — `rewind` is the double-triangle ⏪, deliberately distinct from `skip-start`'s bar+triangle). 📌 **Remainder here:** update `@kolkrabbi/kol-icons` to ≥0.13.0 — the `Icon "…" not found` console noise and the empty TransportBar cells end at the bump, no code change needed

## Why it went there

The curated kol-icon-set-v1 is the DS's to mint into — consumers never ship
set icons locally. TransportBar (`src/editor/params/TransportBar.jsx:75-76`)
requests `stop` and `rewind` by name; the installed set didn't carry them, so
every mount logged `Icon "stop" not found in icon set` / `Icon "rewind" not
found in icon set` and rendered empty cells.

## What stays here

- **On ship: adopt.** Bump `@kolkrabbi/kol-icons` to ≥0.13.0 and verify the
  TransportBar cells render both glyphs at 12–16px (editor + labs chrome,
  desktop + mobile sizes).
- Nothing else — no local registration, no workaround to retire.
