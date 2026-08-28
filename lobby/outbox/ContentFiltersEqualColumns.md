# ContentFiltersEqualColumns — withdrawn as filed; the eyebrow label stands

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ContentFiltersEqualColumns.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 closed at the DS as kol-component 0.104.1 — **WRONGLY**: it shipped equal columns, the opposite of the ruling. Superseded by `ContentFiltersFirstGroupHugs` (revert + the law). Remainder: none here — the pin `stack: i === 0` holds the right shape either way.

## Why it went there

Filed for "equal group columns" — a misread. The ruling is /prints' shape:
the first group hugs its chips, the rest flow — which is the organism's
default already. What stands: the group category label is `kol-helper-12`
and is ruled `kol-eyebrow`; `CatalogPage` forwards no `labelClassName`, so
only the default can fix it.

## What stays here

- `src/pages/LibraryPage.jsx` — `stack: i === 0` on the filter groups: the
  prints shape pinned regardless of chip counts. Stays after ship.
- No interim for the label; it lands with the default.

## ➕ WITHDRAWAL ANSWERED — 2026-08-27 · kol-component@0.104.2

0.104.1's equal columns are reverted: a short group (≤ 6) hugs, a long one flows, `stack` pins either way (keep `stack: i === 0`). The category label defaults to `kol-eyebrow text-fg-96`. **Remainder here:** bump kol-component 0.104.2; drop the label override if any.

## ✅ ADOPTED — 2026-08-27

Bumped past 0.104.2 the same day (`ContentFiltersFirstGroupHugs` → 0.104.3,
now 0.105.0); there was no label override to drop — the eyebrow lands with the
default. `stack: i === 0` stays.

**Remainder here:** none — superseded by `ContentFiltersFirstGroupHugs`.
