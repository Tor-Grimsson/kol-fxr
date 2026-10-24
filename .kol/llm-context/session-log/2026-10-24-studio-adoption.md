# Session: Studio adoption — fxr onto AppStudio

**Date:** 2026-10-24
**Agent:** kol-fxr (local, MBP), driven step by step from kol-ds-ui (kol-ds-ui-75)
**Summary:** fxr moved from `AppHub` to kol-shell's `AppStudio` in nine steps orchestrated from kol-ds-ui; the pass against studio-hub came back 54/54 green and the `HubHomeContract` receipt closed.

## Changes Made

### Files Modified
- `package.json` / `pnpm-lock.yaml` — kol-component 0.296.0 · kol-shell 0.77.0 · kol-icons 0.45.0 · kol-theme 0.184.0 (framework 0.53.0 unchanged).
- `src/AppLayout.jsx` — `AppStudio`: Library slot + the four chromes as `pages`; Labs carries its categories as `sub` everywhere (`useLabsRows` + `pendingPick`); Media · Sign in are the Hub's (`media` / `signIn` props, `RailSignIn` takes `(password)`); Home is the data contract (`fileOf`, `home` with `renameStored` · `duplicateStored` · `removeStored`, tags/notes session-only); `settings={{ ...useHubSettings(), comboLabel }}`; `APP.about` and the walkthrough's action are data; `themeToggle`, the chrome picker, `bottomItems`, `MediaPickerDialog` and the `/` → `/randomiser` touch redirect gone; docblock rewritten.
- `src/settings/AppSettings.jsx` — `useHubSettings()` (typed rows, no Theme row, `drawer.onReset`); `reset` hoisted to module level. The chromes' drawer still renders `AppSettingsSections`.
- `src/pages/LibraryPage.jsx` — header without `size`/`voice`, the New File foot button gone. Stays on Type · Palettes · Patterns with the provider's verbs (step 4 as first sent would have replaced it with Home's files — held and corrected).
- Lobby: `ContentCardRowTone` receipt moved to `_tmp/2026-10-23-content-card-row-tone-receipt/` (ledger row repointed); `HubHomeContract` re-synced 🟢, remainder none, ledger + history.

## Current State

### Working
- `vite build` green. kol-ds-ui's harness pass against studio-hub: 54/54 at 1440 (rail closed/open, Labs entered) and 390, console clean on Home (`kol-ds-ui/_tmp/2026-10-24-hubs-pass/`).

### Known Issues
- Not walked in this session's own browser; the pass was kol-ds-ui's.
- `useLabsRows`' dynamic import of `catalog.js` doesn't split (statically imported elsewhere) — harmless build warning.
- Tags and notes on Home files are session-only until the library stores them.

### Under review (the user's)
- Home vs Library: Home is the user's saves; Library is what the app ships with. Library's contents and its non-clickable cards are his to re-review.

## Next Steps
1. The user's review of the Studio build.
2. Plan 38: text frames + Character / Paragraph panels.
