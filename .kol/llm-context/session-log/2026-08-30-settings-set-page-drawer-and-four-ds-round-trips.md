# Session: The settings set — one page, one drawer, and four DS round-trips

**Date:** 2026-08-30
**Agent:** Grim (Opus 5)
**Summary:** The `/settings` page and an in-chrome settings drawer built on ONE section definition, the page moved onto the real `ContentFilters`, and four defects filed to kol-ds-ui and adopted the same day.

## Changes Made

### Files Modified
- `src/settings/AppSettings.jsx` — **new.** The app's settings sections as DATA (`{ label, rows: [{ label, render }] }`), rendered once by `AppSettingsSections` and once by `DisplaySettingsDrawer`. Deferred `render()` rather than held elements, so a filtered-out row's control is never built. `useSettingsSections()` exposes the array for the page's filters.
- `src/pages/SettingsPage.jsx` — off kol-shell's `SettingsScaffold`, onto `PageShell` + `PageHeader` + `ContentFilters`. The cluster (chrome Dropdown · ThemeToggle · gear) rides `PageHeader actions`; the OPTIONS/SHORTCUTS `ViewToggle` + `SETTINGS` strip sit above the rule, `ABOUT REPO` below it.
- `src/editor/shell/MenuTop.jsx` — the **Settings dropdown deleted**: it was the THIRD live copy of `appSettings` (default aspect · loop theme · autoplay · clip to frame · a theme nest) after `/settings` had already replaced the labs twin. A cog (`settings-01`, kol-r2b2's trigger verbatim) dispatches `kol:open-settings`.
- `src/editor/EditorShell.jsx` — hosts the drawer. Every chrome renders EditorShell; only the editor renders MenuTop, so a drawer bound there answered on one route in three.
- `src/AppLayout.jsx` — `,` / `⌥,` opens settings from ANYWHERE. Matched on `e.code === 'Comma'` (Option rewrites `e.key` on macOS — ⌥, is `≤`). A chrome answers with its drawer and `preventDefault()`s; a shell page has none, so it navigates to `/settings`.
- `src/editor/state/keymap.js` — `settings-drawer` entry (`passive`, so the cheat sheet lists it and the surface that owns it binds it) + `shortcutById()`; `matchCombo` now matches Alt combos on the PHYSICAL key via a `codeFor()` map.
- `src/editor/compose/SwatchRow.jsx` · `inspectors/CanvasInspector.jsx` · `compose/state.jsx` — off the `absolute` → `ab` aliases (`bg-fg-ab-48`, `--kol-surface-ab-split`).
- `package.json` · `pnpm-workspace.yaml` — six bumps (below).

### Packages
`kol-shell 0.17.1 → 0.19.1` · `kol-theme 0.89.0 → 0.95.0` · `kol-component 0.128.0 → 0.129.0` · `kol-icons 0.24.0 → 0.25.0`. All seven KOL packages on latest.

### Filed to kol-ds-ui — both closed same-day
- **`DropdownHeightAndHover`** → **kol-theme 0.90.0**: the trigger is pinned to the icon ladder (`sm 28 / md 32 / lg 36`, `padding-block: 0`) so a picker lines up with the IconFrame cluster beside it. **My hover diagnosis was wrong** — `:45-51` are *pin-backs* (restating rest colours to cancel `.kol-btn-*`'s hover), not hover states; the real bug was `outline`'s pin-back still on `oq-16` after the rest border moved to `oq-08`.
- **`PageHeaderActionsGrowsBlock`** → **kol-shell 0.19.1**: the `actions` cluster shared a flex row with the subtitle, and a row takes its tallest child — 18px lede vs 28px `sm` controls — so any page with controls sat 10px lower than every page without. Now `h-0 self-center`. **No display-02 variant needed**: a zero-height box measures nothing, so it is right at every rung, and the subtitle stays `kol-mono-14` at all three sizes anyway.
- Also returned unasked: **`SettingsChoice` forwards `tone`/`size`/`variant`** (kol-component 0.129.0) and **`--kol-surface-ab-split`** (kol-theme 0.95.0) — both from gaps reported mid-session.

## Current State

### Working
- **Two surfaces, one definition.** `/settings` and the in-chrome drawer render the same sections off `appSettings`; a change in one is live in the other. Verified by flipping Modulation dots in the drawer and reading it back on the page.
- **The page IS `ContentFilters`**, not an imitation. Section names are one filter group, search reads a row's own label (`loop`, `aspect`, `undo` all land), `renderItem` regroups survivors under their eyebrows.
- **Header block 65.203125** — identical to kol-monitor's `/`, h1 unchanged at 35.203125 on `kol-mono-heading-03`.
- `,` and `⌥,` verified opening and closing the drawer on `/editor` and `/labs`, and navigating to the page from Home. Silent on `/randomiser` (MobileView, no EditorShell, no keyboard).
- Rows: 160px label column, choice controls `max-w-24` (96px), column capped 268 so switches and dropdowns share a right edge. Everything sunken — header picker, search field, both toggles, all three choice rows.

### Known Issues
- **Two rulings are OWED BY THE USER, and kol-ds-ui declined both pending them:** retiring kol-shell's `SettingsSection`/`LabelRow` in favour of kol-component's `LabeledControlSection`/`SettingsRow` (a 71-call-site migration across mirror 44 / monitor 19 / fxr 8, and a design call about which shape is canonical), and whether `SettingsScaffold` should render the `ContentFilters` header row rather than a third header shape. fxr uses neither now.
- **The bulletin for `PageHeaderActionsGrowsBlock` is unposted** — bulletins are user-invoked only; kol-ds-ui will not broadcast on its own say-so. It is bulletin-shaped: the defect is invisible until two pages are compared side by side.
- `RailSettingsDisclosure` still 🔴 needs-ruling from 2026-08-28; `src/editor/labs/RailSettings.jsx` is dead code either way.
- The `absolute` → `ab` aliases are temporary — fxr is migrated, but any new code should use `ab`.

## The lesson
**A row that looks like `ContentFilters` must BE `ContentFilters`.** I hand-wrote a lookalike header to the organism's grammar and it drifted inside the hour: the organism's search is `size="md" iconSize={16} fieldHeight={28}` and a copy passing none of those renders a different pill on the next page over. The user caught it as "2 different content filters" before I did. Same shape of error as the local `ChoiceRow` — which existed only because `SettingsChoice` would not forward `tone`, and which came straight back out when it did.

**Corollary, theirs, worth keeping:** a component that wraps another has to forward the wrapped one's seams or it becomes a wall.

## Next Steps
1. **Rule the two open design calls** (kol-shell's duplicate settings pair; `SettingsScaffold`'s header row) — kol-ds-ui is waiting on both.
2. **Post the bulletin** for `PageHeaderActionsGrowsBlock` if it should reach every repo at init.
3. **Rule `RailSettingsDisclosure`** — retire (and send `RailSettings.jsx` to `_tmp/`) or re-file against `NavRail`.
4. T6 — webcam + phone camera, still unverified, needs real hardware.
