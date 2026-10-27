# Playbook — Plan 42: normalise knobs and Randomize all

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** build plan 42 end to end under /kol-goal; the agent makes the open calls (user: "make logical decision to finish").

**Standing rules (non-negotiable):**
- never delete — retire to `_tmp/`
- param labels and user copy verbatim; Tailwind first
- no "·" as a separator in new labels or prose

---
## Entries

[04:31 GMT · 2026-10-27] · setup · playbook created
  what → initialised the live playbook   why → plan 42 build, one run under /kol-goal
  note → Ribbon call made by agent: Glass (IOR, dispersion) and Guides (wireframe) close too, so Ribbon reaches 12

[04:58 GMT · 2026-10-27] · W0–W4 · AutoControls.jsx · schema.js · lib/rng.js · penrose/host.js · lib/fill.js · pattern/patternLoop.js · scanline/engine.js · math/* · gl/catalog.js · paratype/glyph.js · flow/* · optic/* · abstract/presets.js · distress/engine.js
  what → closed section (`collapsed: true` → DS AccordionPanel); structural params noRandom; 12-row cap per tab on every preset
  verify → rolls.check.mjs (new) 473 presets ✓ · schemas.check ✓ · palette.check ✓
  note → call: spans live in lib/rng.js (unspanned range rolls the middle half) instead of 840 rMin/rMax lines; schema rMin/rMax still wins
  note → call: Pattern Frame/Form close on Style rather than move to Anim (Anim would reach 20)
  note → call: Ribbon reaches 12: seed to Gen, Detail, Color, Glass, View (wireframe, stroke, FOV), Post closed

[04:43 GMT · 2026-10-27] · T6–T7 · browser + close · fxChangelogRows.js · 02-scoped-randomize.md · 01-schema-and-controls.md · plan 41/42
  verify → Labs walk: Penrose Style 10 rows + closed Color opens ✓ · Ribbon Style 12 with Detail, Color, Glass, View, Post closed ✓ · 4,730 seeded rolls: structure still, ranges in span ✓ · console 0 errors
  note → FX changelog row "Calmer Randomize all" on top; docs carry rMin/rMax default + collapsed

──────────── MILESTONE: plan 42 ──────────── [04:43 GMT · 2026-10-27]
  changed: 28 source files + 1 new check · docs 2 · rolls.check ✓ schemas.check ✓ palette.check ✓
  log: run /log-work for the session log
