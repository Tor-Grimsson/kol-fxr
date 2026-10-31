# Playbook — Plan 45: the line settles, loader → logo, the dock floats

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** close plan 45 (`.kol/llm-plan/45-the-line-settles-and-the-loader.md`) — W1 built, 2.1 built, 3.1 on kol-shell 0.91.3.

**Standing rules (non-negotiable):**
- KOL changes by ticket only; motion closes on a watched recording; never delete (→ `_tmp/`).

---
## Entries

[05:07 GMT · 2026-10-31] · setup · playbook created
  what → initialised the live playbook   why → user: "go on all /playbook"
  note → already built this session: 1.1–1.4 (settle, re-centre, lag, mouse), 2.1 BootIntro; 3.1 ticket returned → kol-shell 0.91.3

[05:09 GMT · 2026-10-31] · 3.1 · package.json
  what → kol-shell 0.91.2 → 0.91.3   why → HomeDockShadow returned
  verify → dock box-shadow == Labs transport pill, light + dark ✓

[05:09 GMT · 2026-10-31] · 1.2 · src/components/HomeStage.jsx
  what → retired fxr's canvas follow of the sign-in column   why → 0.91.3's HubHome slides the stage 336 itself; both = double shift
  verify → sign in 720 → 1056 → 720 ✓ · loader lands, line starts ✓

[05:09 GMT · 2026-10-31] · 3.1 · lobby
  what → HomeDockShadow 🟢 closed, receipt adopted   why → shipped + verified

──────────── MILESTONE: plan 45 built (2.2 TALK open) ──────────── [05:09]
  changed: engine.js · HomeStage.jsx · BootIntro.jsx · intro.js · main.jsx · vite.config.js · build not run
  log: run /log-work

[05:28 GMT · 2026-10-31] · 2.1 · index.html · vite.config.js · BootIntro.jsx
  what → intro plays on every reload, any page, signed in or out; stamp moved from a vite plugin into index.html   why → user: "dont make it so conditional on dev. just make it happen on every reload"
  verify → / and /labs: line grows, mark fills, no errors ✓
  note → reduced motion keeps the plain loader; with no signed-out Home under it the mark fades in place

[06:44 GMT · 2026-10-31] · W4 · plan 45
  what → W4 opened: one line from load to Home, resize keeps the line, slow wave   why → user: "yes LOVE it" · "lets get it done!"
  note → the flight to the top-left is dropped; BootIntro's fill + flight retire; intro moves into HomeStage (signed-out Home only)

[06:51 GMT · 2026-10-31] · 4.1 · src/components/HomeStage.jsx · intro.js · main.jsx · index.html
  what → one line from load to Home: grows through FXR (masked, logo ink), breathes while the page fades in, blends mark → orb density over 4 s and grows out   why → user: "it stays a pattern … grows out of the shape to fill the screen"
  before → BootIntro overlay + solid mark + flight   after → BootIntro → _tmp/2026-10-31-boot-intro/
  verify → 30fps capture: max 8.4% centre change/frame ✓ · breath 0.4–1.0 ✓ · F filled ✓ · no errors ✓

[06:51 GMT · 2026-10-31] · 4.2 · src/components/HomeStage.jsx
  what → a resize re-centres and grows on, never reseeds   why → `\` (rail key) resized the box → reseed
  verify → `\` twice + 1100 ↔ 1440: ids kept, min 13,707 nodes ✓

[06:51 GMT · 2026-10-31] · 4.3 · src/loops/growth/engine.js · HomeStage.jsx
  what → draw({ wave }) — 24 s, 9 px, 640 px; drawn every frame, sim untouched   why → "never static"
  verify → DPR 2 at rest: pixels change ✓ · p95 16.7 ms ✓

──────────── MILESTONE: plan 45 W4 ──────────── [06:51]
  changed: HomeStage.jsx · engine.js · intro.js · main.jsx · index.html · BootIntro → _tmp · build not run
