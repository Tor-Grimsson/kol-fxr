# Playbook — Plan 44: logged-out Home and the fonts

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** build plan 44 under /kol-goal; W4.1 is the user's; W3 rides the DS returns.

**Standing rules (non-negotiable):**
- never delete — retire to `_tmp/`
- the reference frame is the build, nothing added
- no local DS shims

---
## Entries

[21:53 GMT · 2026-10-28] · W5 · lobby
  what → filed PhoneNavDock, HubHomeSignedOut (PublicSansByLink earlier)

[21:53 GMT · 2026-10-28] · W1 · public/fonts · patternLoop.js · glyphTile.js · fontLoader.js · kinetic/fonts.js
  what → Right-Grotesk-ttf → right-grotesk-ttf, TG → tg; Mono + Text to _tmp/2026-10-28-fonts-unused/
  verify → preview: tg + right-grotesk-ttf serve font/ttf 200; old path falls to html ✓

[21:53 GMT · 2026-10-28] · W2 · AppLayout.jsx
  what → APP.subtitle gone   verify → Home 1440 + 390: FXR only ✓

[21:53 GMT · 2026-10-28] · W4 · canvas
  what → C2, C3 off the canvas
  note → a page save landed 1s before the publish; canvas.json from the read before it

[22:11 GMT · 2026-10-28] · W5.3 · package.json
  what → kol-theme 0.195.0: no Public Sans @font-face   verify → Labs requests only jetbrains-mono ✓

[22:11 GMT · 2026-10-28] · W3 · components/HomeStage.jsx · AppLayout.jsx · growthLine.js (sourceCanvas exported)
  what → kol-shell 0.86.0 · kol-component 0.311.0; home.signedOut / stage / chromes; the stage is the growing line in CSS px, stops at its cap
  verify → 1440 + 390 signed out: no files, stage, + (New File, Walkthrough, Sign in), dock / pill ✓ · Editor slot routes ✓ · sign in → files, sign out → stage ✓ · 0 console
  note → first stage pass was 1000-unit sim (too fine on a phone), second px with gaps 6–22 overfilled; gaps 4–16, cap = area / 130
  note → ••• stays ••• on the phone; filed PhonePillMoreTurnsToClose
