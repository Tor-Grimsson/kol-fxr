# Playbook — Plan 43: accounts, phone Home and the growing line

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** build plan 43 under /kol-goal; 3.3 to frames only, W5 to filed tickets.

**Standing rules (non-negotiable):**
- never delete — retire to `_tmp/`
- user copy verbatim; Tailwind first; no "·" as a separator in new labels or prose
- the draft autosave never touches D1; a green build is not verification

---
## Entries

[19:52 GMT · 2026-10-28] · W6 · scripts/icons.mjs · package.json · README.md
  what → kol-icons 0.50.0, component 0.308.0, shell 0.84.0, framework 0.60.0, brand 0.2.0; icons copied from identity/fxr
  verify → PNG raw diff 0 ✓ · preview / and /labs 0 console ✓
  note → manifest links apple-touch-icon-dark.svg: copy fxr-tile.svg there (caught on the walk); ticket closed, receipt to kol-ds-ui

[19:52 GMT · 2026-10-28] · W5 + W1 + W2.3/W3.1 · lobby
  what → filed PhoneNavVariants, PhoneMoreWholeNav, PromptHoldsWithKeyboard, HubHomePhoneChooser, HubAccountRow
  why → HubHome draws the doors and AppHub owns the sign-in row and dialog; no consumer seam, no local shims

[20:01 GMT · 2026-10-28] · W2 · api/src/index.js · api/schema.sql · api/migrations/0001-accounts.sql · scripts/invite.mjs · libraryApi.js · pages/AccountPages.jsx · App.jsx · AppLayout.jsx
  what → users, sessions, invites in D1; documents owned by user_id; /signin /join /account; shared password gate retired
  verify → curl: bad/reused invite refused, first account claims unowned rows, B cannot touch A's rows, signout ends token ✓ · preview walk: join, rename, avatar, invite, signout, signin ✓
  note → old Worker + libraryApi in _tmp/2026-10-28-accounts/; the Worker was overwritten before its copy — restored verbatim from the read
  note → rail row bridge: the Hub's one-string prompt is read as the password for this device's last account until HubAccountRow ships

[20:01 GMT · 2026-10-28] · W3.2 · editor/library/accountPrefs.js · editor/mode.js
  what → theme, remembered chrome, app defaults follow the account; previewRes stays on the device
  verify → theme light on A, fresh device B signs in light ✓ · autoplay on A → B ✓ · B's previewRes half kept ✓ · 0 console

[20:13 GMT · 2026-10-28] · W4 · loops/growth/engine.js · loops/flow/growthLine.js · filters/fxGrowth.js · compose/build.js · effectCategories.js
  what → one engine (differential growth over a density field); generator Flow › Growth; effect Halftone › Growing line; a def's svg() exports vector
  verify → growth.check: cap held, 0 crossings, dark 4.8 / light 17.6 ✓ · schemas, rolls, sweeps ✓ · Labs 60 fps ✓ · effect over a photo ✓ · PNG export 1080×1350 through the vector path ✓ · 0 console
  note → caught by the check: resample splits overran the node cap (4495 vs 2500); budgeted
  note → own seed knob renamed Variation (the effect page already carries a roll Seed)

[20:13 GMT · 2026-10-28] · W3.3 · frames
  what → three frames on a Design canvas: phone full-bleed, desktop full-bleed, desktop split; stage = real growth paths from the engine
  note → build waits on the pick

[20:21 GMT · 2026-10-28] · W1 + W5 adoption · package.json · AppLayout.jsx · AccountPages.jsx · LabsView.jsx · lobby
  what → kol-shell 0.85.0 · kol-component 0.309.0; touch.label "Select chrome"; signIn user + onProfile; Labs PhoneNav variant="panel"; last-email bridge retired
  verify → 390 Chromium: stacked chooser ✓ · Home pill border transparent, no shadow ✓ · More lists the whole nav + account ✓ · account row → /account ✓ · Sign in asks email + password, signs in ✓ · Labs panel pill top, transport shadow ✓ · 0 console
  note → kol-shell 0.85.0 tarball 404'd for ~4 min after listing; WebKit not installed, so the keyboard fix is unchecked on a real iPhone
