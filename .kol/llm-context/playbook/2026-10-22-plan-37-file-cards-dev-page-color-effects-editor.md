# Playbook — Plan 37: file cards, the Dev page, Labs rail, editor review, color pass, effects

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** build plan 37 end to end; TALK phases land as questions in the Dev page.

**Standing rules (non-negotiable):**
- Never delete — `_tmp/<date>-<what>/`.
- Card frame is the DS's; fix what we put in it.
- Close a phase on its acceptance line, walked in a browser.

---
## Entries

[21:25 CEST · 2026-10-22] · setup · playbook created
  what → kol-goal set, order W1 → W2 → W3 → W4 → W7 → W8 → W5 → W6   why → user: "go on all I'll check dev tab after you are done for open questions"

[21:28 CEST · 2026-10-22] · W1 · src/AppLayout.jsx · src/pages/DevCards.jsx · src/App.jsx
  what → Dev page on (AppHub dev prop, /dev route DEV-only), Cards tab: catalog grid · list · 2.0 file-variant mock · 2.3 + 5.4 questions
  verify → /dev renders, 0 console warnings ✓ · _tmp/2026-10-22-plan-37-walk/w1-dev.png
  note → mono UI font has no em dash glyph (rendered "¬₊") — sample uses a hyphen

[21:28 CEST · 2026-10-22] · W2 2.1/2.2 · src/components/FileCard.jsx
  what → FileActions + FileThumb + storedVerbs lifted out of AppLayout; menu icons are <Icon> nodes; no-thumb placeholder
  verify → menu shows glyph + label, aligned ✓

[21:28 CEST · 2026-10-22] · W3 · src/pages/LibraryPage.jsx
  what → raw Delete button → shared ··· menu on provider verbs; media = file's own thumb or placeholder (cycled chrome PNGs gone)
  verify → /library seeded 3 presets, menu opens with 3 verbs ✓ · w3-library-menu.png

[21:30 CEST · 2026-10-22] · W4 · src/pages/DevCards.jsx
  what → D1 (remote) holds 4 docs, none are test files — the Plan08/Sync/Morph saves live only in the user's browser storage; built "Export and remove" on /dev (JSON download first, then removeStored → tombstone push if signed in)
  verify → seeded 4 test + 2 real; pressed → 4 removed, 2 left, JSON downloaded ✓
  note → the user presses it once per origin (localhost:5173, fxr.kolkrabbi.io)

[21:32 CEST · 2026-10-22] · W7 · src/AppLayout.jsx
  what → Labs row carries its five sections as sub on /labs; enter mode enters ← LABS, sections fold inside (NavRail ships it)
  verify → desk + 390 drawer walked, group press dispatches, 0 warnings ✓ · w7-labs-level.png · w7-390-drawer.png
  note → no auto-enter on arrival (NavRail entered is internal); found 7.3: labs overlays (z modal) cover the touch drawer (z sticky) — TALK

[21:36 CEST · 2026-10-22] · W8 · MenuTop.jsx · kol-editor.css · LayerStack.jsx · ToolStrip.jsx · ColourPanel.jsx · DocTitle.jsx
  what → logo out; bar on surface-absolute-split; open trigger = tab-chip oq-08; slide between open menus; row hover fill; flyouts +1px; + menu flyouts; swatch pair 0.73; spectrum floor 64; doctitle border-t out
  verify → File→hover Layer opens Layer ✓ · Live Filters flyout butts panel ✓ · + › Shape › Rectangle adds ✓ · swatch 32 @ x5 ✓ · 0 warnings · w8-menu.png · w8-addlayer.png
  note → 8.6 (drop into empty group) + 8.10 (ruler px) are DS literals — TALK, not forked

[21:41 CEST · 2026-10-22] · W5 · src/editor/color/palette.js · editor/lib/rng.js · loops/theme.js · 6 schema files
  what → one palette shape + store + resolver on kol-component colorMath; Color roll = one seeded palette (roles hit, rest rotate); themeParams → resolver; 9 params role-tagged; audit appended to ticket
  verify → palette.check.mjs ✓ (7 relations, 9 themes unchanged) · schemas.check ✓ · 3 rolls walked ✓
  note → engine = DS (not Combo Lab lift), HSL not OKLCH; by-property mapping deferred to W6; gold rings persist across rolls on penrose packing — colour not from a param, not chased

[21:51 CEST · 2026-10-22] · W6 · loops/flow/* · filters/fxSlicer.js · registry · taxonomy · effectCategories · penrose 07 · EffectsPanel.jsx
  what → field core (components + RK4 streamlines + glyph instancer); E4 obstacle flow · E5 charge lines · E3 glyph vortex · E1 voronoi pulse (type Flow) · E2 letter gap (2D loop, type Letter Gap) · E6 slice wave + riso (dots / RD labyrinth); 07 on noiseAngle
  verify → schemas ✓ 115 loops 72 filters · sweeps ✓ · all five render, 0 warnings · 61 fps page clock · slicer apply: moves, seamless u0≡u1, labyrinth ≠ dots ✓
  note → riso CPU ~0.5s/frame on motion (ponytail); Add effect listed rack dupes twice → duplicate React keys — deduped (0 errors after)
