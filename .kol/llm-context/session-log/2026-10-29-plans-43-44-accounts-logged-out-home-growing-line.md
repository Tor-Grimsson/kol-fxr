# Session: Plans 43 + 44 — accounts, logged-out Home, the growing line

**Date:** 2026-10-29 (session began 2026-10-28)
**Agent:** kol-fxr (local, MBP)
**Summary:** Real accounts on D1 (invite-only, live), a signed-out Home with a live stage, frame-C sign-in / create / request-invite pages, the growing-line generator + effect, fonts on convention, and the editor clock on kol-hardware's transport.

## Changes Made

### Files Modified
- `api/src/index.js`, `api/schema.sql`, `api/migrations/0001-accounts.sql` — users, sessions, invites, invite_requests; documents owned by `user_id`; the shared-password gate retired (old Worker in `_tmp/2026-10-28-accounts/`). **Live:** migrated, schema applied, deployed.
- `scripts/invite.mjs`, `package.json` — `api:migrate[:local]`, `api:invite[:local]`; KOL component 0.311.0 · shell 0.87.0 · theme 0.195.0 · icons 0.50.0 · framework 0.60.0 · brand 0.2.0 · hardware 0.8.0 (new); `sharp` removed.
- `src/editor/library/libraryApi.js` — account session (`{ backend, user, token }`), sign in/up/out, `updateAccount`, `mintInvite`, invite requests.
- `src/editor/library/accountPrefs.js` (new), `src/editor/mode.js` — theme, last chrome, app defaults follow the account; `previewRes` stays per device.
- `src/pages/AccountPages.jsx` (new) — `/signin`, `/join` (invite → Create account; none → Request an invite), `/account` (picture, name, invite links, invite requests). Frame C as the user drew it; Escape goes Home.
- `src/AppLayout.jsx` — Hub account row (`signIn.user` / `onProfile`), `home.signedOut` + `stage` + `chromes`, `touch.label`, subtitle gone.
- `src/components/HomeStage.jsx` (new) — the growing line full-bleed behind signed-out Home, CSS px, stops at its cap.
- `src/loops/growth/engine.js` (new) + `growth.check.mjs`, `src/loops/flow/growthLine.js`, `src/filters/fxGrowth.js`, `src/editor/compose/build.js` — differential growth: Flow › Growth generator, Effects › Halftone › Growing line, vector export via a def's `svg()`.
- `src/editor/params/transport.js` — the clock is kol-hardware's `createTransport()`; API unchanged; loop-length change keeps the phase (old clock in `_tmp/2026-10-28-transport-from-hardware/`).
- `scripts/icons.mjs` — identity set copied from kol-icons (generator retired to `_tmp/2026-10-28-icons-from-package/`).
- `public/fonts` — `right-grotesk-ttf`, `tg` renamed; Mono/Text to `_tmp/2026-10-28-fonts-unused/`.
- `src/editor/labs/LabsView.jsx` — PhoneNav `variant="panel"`.
- `docs/operations/03-accounts-rollout.md` (new), `docs/documentation/11-persistence/INDEX.md`, README.
- Plans `.kol/llm-plan/43-…`, `44-…`; playbooks for both.

### Features Added/Removed
- Added: accounts + invite-only sign-up + invite requests; signed-out Home (stage, + menu, dock / pill); growing line; account preferences sync.
- Removed: the shared-password sync gate; the icon generator; the Home subtitle.

## Current State

### Working
- Locally walked: sign in / create (mismatch check) / request → `/account` list → Make invite; signed-out Home at 1440 + 390; ••• → ×; growth.check, schemas, rolls, sweeps green.
- Live: Worker + D1 (all five tables); first invite link minted.

### Known Issues
- The app with the frame-C pages and request page is **not pushed** — the live site still shows the earlier yellow-button `/join`.
- `TransportFromHardware` half done: `TimeStripInADock` came back from kol-ds-ui, not adopted — it changes the timeline's look, so it goes to the canvas first.
- `/signin` and `/join` sit outside the Hub (no rail), unlike frame C.

## Next Steps
1. User pushes the app, then creates his account from the invite link.
2. `TimeStripInADock`: frame on the canvas, then adopt and close `TransportFromHardware`.

## Amended — 2026-10-29

- Account is a rail now (frame D2): `src/components/AccountRail.jsx` on the DS rail kit (`Rail role="settings"`, `RailHeader`, `RailSection`/`RailRow`, `RailFoot` with Sign out); the Hub's account row opens it, `/account` and sign-up land on `/?account=1`. The page version is in `_tmp/2026-10-29-account-page/`.
- `/signin` and `/join` are the user's frames (fields at the chooser size, inverted button at the foot, the other page linked, Escape → Home); `/join` with no link is Request an invite (Worker `invite_requests`, live), listed in the account rail with Invite.
- kol-shell 0.87.2: the account row with no picture is the outline `user` glyph (`AccountRowNoPictureIsTheIcon`).
- kol-hardware 0.9.1: `TimelineDock` draws `TimeStrip` docked (`framed={false} span="loop" gutter={132}`); `TransportFromHardware` closed.
- Live: Worker deployed with invite requests; the app is not pushed yet.
- The account is Settings › Account (kol-shell 0.88.0, `SettingsAccountTab`): `signIn.account = { content: <AccountPanel/>, footer: Sign out }`, `src/components/AccountPanel.jsx` (picture with hover-× to remove, Upload, Name, Email, Invites); Home's ••• ends on the account row (`HomeMenuAccountRow`). The account rail is in `_tmp/2026-10-29-account-rail/`.
- `HubAppOwnsItsRows` (kol-shell 0.88.0): Home's menu, the rail foot, More and the signed-out + take `(defaults) => rows` — a row edit is fxr's own now, no ticket.
- Nothing open; no tickets out.
