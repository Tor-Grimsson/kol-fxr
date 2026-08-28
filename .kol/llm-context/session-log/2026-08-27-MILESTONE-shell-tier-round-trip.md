# 🏁 Milestone: the shell tier round-trip

**Date:** 2026-08-27
**Agent:** Grim (Haiku 4.5)
**Arc:** Home · Library · Settings under the `AppShell` rail — from "another `?view=` route" (2026-08-15 handoff) to the shared app-tier system the DS now ships and fxr consumes.
**Delivered:** fxr rebuilt page by page against kol-monitor; everything generic filed as `ShellHomeSystem` (13 items) and shipped by the DS the same day — kol-shell 0.8.0 · kol-component 0.104.3 · kol-theme 0.71.0 · kol-framework 0.28.0 · kol-icons 0.20.0 · kol-brand 0.1.3 — and adopted in full; kol-monitor and kol-mirror ticketed to follow.

## What closed
- 2026-08-15 handoff "shell tier is a route, not a system" → **done**: router in, chromes lazy routes under the rail, SPA hops via a `navigateTo` bridge; `/output` alone stays chromeless.
- Home / Library hand-rolled catalog pages → **done**: `CatalogPage` (`toCard`, RECENT/SAVED, LIST/GRID, walkthrough, action row); Library pools the four slots, TYPE first, each slot a filter group (prints shape: first hugs, rest flow), placeholder tags 3·8·16·8.
- Settings → **done**: monitor's shape (Display · Defaults · Transport · Keyboard Shortcuts · About · Repo) on `SettingsShortcuts` / `SettingsLinks` / `SettingsColophon`, DS `ThemeToggle`, one theme store (kol-framework's; `editor/theme.js` retired), `THEME_BOOT_SCRIPT` injected by vite.
- Title voice / section seams (`PageHeaderMonoTitle`) → **shipped 0.7.0–0.7.2, adopted**; every wrapper override deleted.
- Rail → **done**: `AppShell railToggleKey={'\\'} touch="bare"`, `nav-*` glyphs from kol-icons, logomark from kol-brand, `--fxr-rail` for the randomiser's fixed layers, randomiser under the rail opens on the generator list.
- ContentFilters shape → **the law is in the component** (0.104.3) after a same-day misread (`ContentFiltersEqualColumns`, withdrawn) and its correction (`ContentFiltersFirstGroupHugs`); the rule is in memory.
- Both 📌 receipts from 08-15 (`SegmentedFilledStateFix`, `PropertyField`) → **done**; `public/fonts/right-grotesk` case → **done in the index**; the two bad tokens (`--kol-font-mono`, `--kol-fg-1`) → **fixed**.
- Deprecated `GridCard` / `TabStrip` → **no longer imported**; icons on alpha ink → **none left**; `::selection`, per-card hover/truncate, eyebrow ink overrides → **all deleted, DS defaults**.
- Stale-after-bump renders (title, filter labels) → **`"dev": "vite --force"`**; excluding DS packages from pre-bundling was tried and reverted (CJS deps).
- kol-monitor / kol-mirror → **ticketed** (`ShellHomeSystemAdoption` in each lobby, receipts here). All 21 receipts in `lobby/outbox/` are 🟢, remainder none.

## The arc (brief)
- 08-15: shell tier lands as `?view=` branches; handoff names the gap against mirror/monitor (`session-bridge/handoff-2026-08-15-1740-shell-tier-is-a-route-not-a-system.md`).
- 08-27 morning: bump to latest, receipts closed, font-dir case, token fixes (`2026-08-27-ds-bump-to-latest-receipts-closed-and-font-dir-case.md`).
- 08-27: home diffed against monitor → rail, logomark, filters, titles; the user rules type, eyebrows, icons, columns; every gap filed and shipped within the hour — the DS was publishing faster than fxr could bump (five package bumps in one day).
- 08-27: `ShellHomeSystem` closed and adopted; `ContentFilters` law cemented after the one misread; monitor and mirror handed the same round-trip.
