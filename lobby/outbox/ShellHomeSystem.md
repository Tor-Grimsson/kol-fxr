# ShellHomeSystem — the shared app tier, shipped once

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShellHomeSystem.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 CLOSED + ADOPTED 2026-08-27 — kol-shell 0.8.0 · kol-component 0.99.0 · kol-theme 0.68.0 · kol-icons 0.20.0 · kol-framework 0.28.0 · kol-brand 0.1.3; all thirteen, adopted here the same day. Remainder: none.

## Why it went there

Home · Library · Settings under the rail is one system that fxr, mirror and
monitor each write by hand. The 2026-08-27 rebuild of fxr against monitor
produced the reference and thirteen things the DS should own: the catalog
page scaffold, the shortcuts grid, the title/section seams (folds in
`PageHeaderMonoTitle`), the eyebrow's baked ink, catalog-card hover and
one-line detail, the `nav-*` glyphs, the rail key + touch policy on
`AppShell`, the theme boot snippet, the About/Repo link list, neutral
`::selection`, the `opentype.js` peer, the logomark from kol-brand.

## What stays here

- `src/pages/HomePage.jsx` · `LibraryPage.jsx` · `SettingsPage.jsx` ·
  `src/AppLayout.jsx` — the hand-rolled versions, the reference render.
- `src/icons/nav-*.svg` + `registerIcons()` in `main.jsx`; `zoom` +
  `hover:border-fg-16` + `detailClass` on every catalog card; `selection:` on
  `#root`; the boot script in `index.html`; `public/svg/favicon-01.svg`.
  (Item 3's overrides are already gone — `PageHeaderMonoTitle` shipped and
  was adopted the same day.)
- **On ship: adopt.** Home + Library onto `CatalogPage`, Settings onto
  `SettingsShortcuts` + `SettingsLinks`, delete every override above.

## ✅ RETURNED — 2026-08-27 · kol-shell@0.8.0 · kol-component@0.99.0 · kol-theme@0.68.0 · kol-icons@0.20.0 · kol-framework@0.28.0 · kol-brand@0.1.3 · kol-foundry@0.8.1

All thirteen items shipped — see kol-ds-ui `lobby/done/ShellHomeSystem.md` and the seven changelogs. Highlights: `CatalogPage` (kol-shell) with `toCard(item, { view, layout })`; `SettingsShortcuts` · `SettingsLinks` · `SettingsColophon`; `AppShell railToggleKey` + `touch="bare" | "overlay"` (+ `TouchDeviceOverlay`, `useTouchPrimary`); `.kol-eyebrow` without ink; catalog cards zoom + step their frame by default, detail truncates; the five `nav-*` glyphs in kol-icons; `THEME_BOOT_SCRIPT` from kol-framework; neutral selection under `.kol-app-shell`; `opentype.js` 2.x allowed; `@kolkrabbi/kol-brand/svg/favicon-01.svg`.

**Remainder here:** none — adopted 2026-08-27, see below. Returned as: bump everything listed; HomePage/LibraryPage → `CatalogPage` with `toCard`; SettingsPage → `SettingsShortcuts` + `SettingsLinks` + `SettingsColophon`; AppLayout → `<AppShell railToggleKey="\\" touch="bare" …>` and delete `RailToggleKey` + the mobile gate; drop `registerIcons` and `src/icons`; `index.html` gets `THEME_BOOT_SCRIPT`; drop the selection override; logomark from kol-brand; delete the `[&>h1]` / `[&_h1]` wrappers.

## ✅ ADOPTED — 2026-08-27

Home and Library on `CatalogPage` (`toCard`, controlled RECENT/SAVED,
walkthrough + action row); Settings on `SettingsShortcuts` · `SettingsLinks` ·
`SettingsColophon`; `AppShell railToggleKey={'\\'} touch="bare"` (device.js now
writes the shell's `kol-desktop` key); rail glyphs from kol-icons 0.20.0, the
local registry retired; logomark from `@kolkrabbi/kol-brand/svg/favicon-01.svg`;
`THEME_BOOT_SCRIPT` injected by `vite.config.js`; the `selection:` override,
per-card `zoom` / border / truncate, and the eyebrow ink utility all deleted.
Retired copies in `_tmp/2026-08-27-shell-home-system-adopted/`. Verified
headless on every route: rail, toggle, titles mono 32, nothing under the rail,
no console errors; both builds green.

**Remainder here:** none.
