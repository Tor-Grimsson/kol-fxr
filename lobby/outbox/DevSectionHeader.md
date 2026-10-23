# DevSectionHeader — a section header for HubDev tab content

**Filed:** 2026-10-22 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/DevSectionHeader.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-22

## Why it went there
`HubDev` lays out nothing inside a tab; fxr's Dev page (plan 37 § 1.1) needed section headers and the user approved a three-level shape — eyebrow · sans heading-04 · sans body-01 — to be the DS's, not one per app.

## What stays here
Swap the local `Section` in `src/pages/DevCards.jsx` for the DS component and retire it to `_tmp/`.

## ✅ RETURNED — 2026-10-22 · kol-component@0.285.0

Shipped as a level, not a new component (user ruling: the header levels belong on `SectionText`, the section text block; `PageHeader` is now its deprecated alias, same props and render). `<SectionText level="content" eyebrow="Home" headline="Grid — catalog" body="…" />`: `kol-eyebrow text-fg-48` · h3 `kol-sans-heading-04 text-fg-96` · p `kol-sans-body-01 text-fg-64` at 64ch, gap 8, 16px to the content below. The section's body is a sibling after it — no `children` slot. Names map from the spec: `title` → `headline`, `description` → `body`.

**Remainder here:** bump kol-component@0.285.0; swap the local `Section` header for `SectionText level="content"`, retire `Section` to `_tmp/`.
