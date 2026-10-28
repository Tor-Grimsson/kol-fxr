# Plan — Logged-out Home and the fonts

**Raised:** 2026-10-28, the frames review in session (canvas https://claude.ai/artifact/W81QSMMdZXXWFrFBtGWjZP). Points verbatim:
- P1 *"why dont we use this instead of the modal 4 buttons 1 for each chrome + [...] that makes a list and nav turns to (X)?"*
- P2 *"the desktop we dont need this sentence I think FXR is enough and can we just use action button with '+' or something to get WALKTHROUGH, NEW/CREATE and USER LOGIN?"*
- P3 *"we can still use the PhoneNav here. its much nicer then 5 random buttons."* → *"I moved the Phone nav in desktop, that component shoudl probablyget its own variant or preset?"*
- P4 *"I saww this first and I was positive that it was the login/user dialog. or signup, which I liked. so this one definietely for login /signup /invitation link"* → on C2/C3: *"hate tthis … I just said i liked what was before … this is perfect, stop tryign to do too much"*
- P5 *"this is poinless 'Pick a chrome. All three run the same engine.'"*
- P6 *"/public/fonts these cant all be in use? … these are not by our convention... not DS approved"*
- P7 *"I think Public should just use link. ticket that to DS add to plan"*

**Status:** built 2026-10-28, every W.
**Shape:** W › phase › list.
**Laws carried:** never delete, retire to `_tmp/`; user copy verbatim; Tailwind first; no local DS shims (Hub and PhoneNav gaps go to kol-ds-ui); the reference frame is the build, nothing added to it; a green build is not verification.
**How a phase closes:** acceptance line first, gates green, then Playwright against his own words.

## W1 — The fonts on convention (P6)

### 1.1 — Rename the two in use — ✅ built 2026-10-28
- `public/fonts/Right-Grotesk-ttf` → `right-grotesk-ttf` (Type layer loader, pattern glyph tiles); `TG` → `tg` (kinetic families). Four path references follow.
- **Acceptance:** a Type layer and a pattern glyph tile render Right Grotesk; a kinetic preset renders TG Rot; no 404 on `/fonts/` in the console.

### 1.2 — Retire the two not in use — ✅ built 2026-10-28 (`_tmp/2026-10-28-fonts-unused/`)
- `Right-Grotesk-Mono` and `Right-Grotesk-Text` to `_tmp/2026-10-28-fonts-unused/`; nothing in `src` or any KOL package reads them.
- **Acceptance:** `public/fonts/` holds `jetbrains-mono`, `right-grotesk`, `right-grotesk-ttf`, `tg`; the app walks with 0 font 404s.

## W2 — The sentence goes (P5)

### 2.1 — Home has no subtitle — ✅ built 2026-10-28
- `APP.subtitle` ("Pick a chrome. All three run the same engine.") leaves Home, phone and desktop. The heading is FXR alone.
- **Acceptance:** Home at 390 and 1440 shows FXR and no subtitle line.

## W3 — Logged-out Home (P1, P2, P3)

### 3.1 — Phone: frame A2 — ✅ built 2026-10-28 (••• → × in kol-shell 0.87.0)
- Signed out: FXR and the live stage; the pill at the bottom holds Generate, Effects, Labs, Morph and •••; ••• opens the whole list and becomes ×. No files.
- **Acceptance:** at 390 signed out, no file card anywhere; the pill's four chromes open their routes; ••• lists the nav and turns to ×.

### 3.2 — Desktop: frame B2 as moved — ✅ built 2026-10-28
- Signed out: FXR alone top-left, the round + top-right opening New File, Walkthrough and Sign in, the pill bottom-left where the user put it (Generate, Effects, Labs, Morph, Editor), the live stage behind. No files.
- **Acceptance:** at 1440 signed out, the layout matches B2 as moved on the canvas; + opens the three rows; the pill's five slots open their routes.

### 3.3 — Signed in stays as it is — ✅ built 2026-10-28
- Signed in, Home is today's Home (files, views) with the subtitle gone (2.1).
- **Acceptance:** signing in from + › Sign in shows the files; signing out returns to 3.1 / 3.2.

## W4 — Frame C is the account page (P4) — ✅ built 2026-10-28

### 4.1 — C, as drawn, for sign in and the invite link
- `/signin` and `/join` are frame C: the mark and the chooser left, the yellow button at the foot, the growing line right. The button opens the DS dialog (email + password; on `/join` name, email, password). The plan-43 form pages are in `_tmp/2026-10-28-account-forms/`.
- C2 and C3 left the canvas.

## W5 — DS tickets to kol-ds-ui (P1, P3)

### 5.1 — PhoneNav `dock` variant — ✅ 2026-10-28 (`PhoneNavDock`, kol-shell 0.86.0)
- The pill on a desktop: bottom-left beside the rail, the same slots, no hairline, no shadow; `AppShell` / `AppStudio` take it like `navVariant`.
- **Acceptance:** ticket filed; on the bump Home's desktop pill is `variant="dock"` with no hand-set props.

### 5.2 — HubHome signed out — ✅ 2026-10-28 (`HubHomeSignedOut`, kol-shell 0.86.0)
- A `signedOut` state for `HubHome`: no catalog, a stage slot (the app's live generator), the chrome pill, the + menu. fxr cannot draw it without a Hub seam.
- **Acceptance:** ticket filed; on the bump 3.1 and 3.2 build on it with no local markup.

### 5.3 — Public Sans by a link (P7) — ✅ 2026-10-28 (`PublicSansByLink`, kol-theme 0.195.0)
- kol-theme's `core` declares Public Sans self-hosted at `/fonts/public-sans/`; it moves to a Google Fonts link where it is used (apps/document). fxr adds no font folder for it.
- **Acceptance:** on the bump, `kol-theme/core` declares no Public Sans `@font-face`; fxr's console has no `/fonts/public-sans` request.

