# ContentFiltersFirstGroupHugs — the law, and a revert of 0.104.1

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ContentFiltersFirstGroupHugs.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 CLOSED + ADOPTED 2026-08-27 — kol-component 0.104.3: the law is in the component (`stack` defaults to the first group; category labels `kol-eyebrow`); 0.104.1 reverted in 0.104.2. Remainder: none.

## Why it went there

`ContentFiltersEqualColumns` (this repo, today) was a MISREAD and the DS
shipped it as kol-component 0.104.1 — equal group columns by default, the
opposite of the ruling. The ruling is /prints' shape: the FIRST group hugs
its chips (narrow), every group after it flows; category labels are
`kol-eyebrow`. The ticket asks for the revert and for the law to be written
into the component so it cannot flip again.

## What stays here

- `src/pages/LibraryPage.jsx` — `stack: i === 0` on the filter groups: the
  shape pinned by position regardless of the DS default. **Stays after ship.**
- No interim for the category label; `CatalogPage` forwards none, it lands
  with the default.

## ✅ RETURNED — 2026-08-27 · kol-component@0.104.3

The law is in: the FIRST group hugs (`stack` default = `index === 0`), every group after flows — by position, never by chip count; `stack` stays the explicit override. 0.104.1 and 0.101 are both gone. The category label defaults to `kol-eyebrow text-fg-96`. Written into the organism's docstring, the mdx and the content-card-system doc.

**Remainder here:** none — adopted 2026-08-27, see below. Returned as: bump kol-component 0.104.3; `stack: i === 0` now matches the default.

## ✅ ADOPTED — 2026-08-27

kol-component 0.104.3 installed. The shape measured on `/library`: Type hugs,
Presets · Palettes · Patterns flow, labels on `kol-eyebrow`. The `stack: i === 0`
pin in `LibraryPage.jsx` now matches the DS default and stays as the belt to
its braces.

**Remainder here:** none.
