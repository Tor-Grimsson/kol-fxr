# Session: kol-component 0.105.0 + the lobby registered

**Date:** 2026-08-27
**Agent:** Grim (Sonnet 5)
**Summary:** One KOL bump (component 0.104.3 → 0.105.0), and fxr's `lobby/` made a real lobby — ledger written, registered in dotfiles, the 22 receipts rowed, 8 stale return-time remainders squared so `bin/lobby` reads owed 0.

## Changes Made

### Files Modified
- `package.json` — `@kolkrabbi/kol-component` `^0.104.3` → `^0.105.0` in devDependencies AND peerDependencies (`pnpm-lock.yaml` + `pnpm-workspace.yaml` `minimumReleaseAgeExclude` followed). `pnpm why` → one copy; `pnpm build` green. 0.105.0 is `SectionCtaConnectVariant` (kol-website's ticket) — nothing in it for fxr.
- `lobby/INDEX.md` — **new**, the ledger. Six sections (States · Queue · Closed · Archived · Filed elsewhere · History), monitor's shape and bar. All 22 receipts rowed under *Filed elsewhere* (20 → kol-ds-ui 🟢 remainder none, 2 → kol-mirror/kol-monitor 🔵); History reconstructed from the stubs' `Filed:` dates (08-09 · 08-12 · 08-15 · 08-27 waves).
- `lobby/inbox/ done/ archive/ _assets/` — created (empty, as monitor's).
- `lobby/outbox/` ×9 — the 8 receipts carrying a `## ✅ RETURNED` section had the DS's return-time `**Remainder here:** bump, …` line ABOVE our `✅ ADOPTED … none`; `bin/lobby` judges the FIRST field only, so all 8 read as owed. Rewritten in place to `none — adopted <date>, see below. Returned as: <original text>` (monitor's precedent, nothing deleted). `ContentFiltersEqualColumns` had no line-start field at all → appended `## ✅ ADOPTED — 2026-08-27`, remainder none (superseded by `ContentFiltersFirstGroupHugs`).
- `~/.dotfiles/files/folders.md` § lobby — row `~/dev/projects/kol-fxr/lobby`; `~/.dotfiles/docs/operations/systems/lobby/01-registry.md` — "The eight", the row, a paragraph naming fxr as the kol-monitor case repeated; `05-lookup.md` — the row. `ref --lint` 25 cards clean.

## Current State

### Working
- `lobby --paths` lists fxr (7th); `lobby --counts` → `kol-fxr 0 0 0 22 0`; `lobby --lint` clean. Flag `--kol-fxr` falls out of the path; `lobby-close` can now find fxr's receipts (the 08-15 "silently skipped, will recur" defect is closed).
- ag-init's step 7 read the receipts correctly before this too — it reads the whole stub; only the tool read the first field.

### Known Issues
- `ShellHomeSystemAdoption` at kol-mirror and kol-monitor: still 🔵 `filed` in both destination ledgers — theirs to adopt, nothing owed here.
- The mirror/monitor receipts carry `**Remainder here:** none` mid-line under *What stays here*, so the tool shows "— not returned yet —" for them. Correct (they have not returned); it will read the field once a `✅ RETURNED` section lands.

## Next Steps
1. Whatever the user names — the lobby and the deps are square.
