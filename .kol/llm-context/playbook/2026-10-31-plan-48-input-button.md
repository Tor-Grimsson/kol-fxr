# Playbook — Plan 48: an input button on the rail

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** one accessible row that wires an input (mouse, mic, beat, LFO) to a generator's or effect's best params — a door onto the existing bind system, not a second one.

**Standing rules (non-negotiable):**
- bindings stay ordinary `{ bind: 'mod' }` values — the M dot and the Modulation editor open them as before
- KOL components only (`MultiSelect`, `SettingsRow`, `Button`); no local shims
- user ruled 2026-10-31: *"i dont want to decide any of this , you pick"*

---
## Entries

[16:36 GMT · 2026-10-31] · setup · playbook created
  what → initialised the live playbook   why → /kol-goal + /playbook on plan 48

[16:37 GMT · 2026-10-31] · 1.1 rulings · .kol/llm-plan/48-an-input-button-on-the-rail.md
  what → Inputs section, Animation tab top; row = MultiSelect [Source · Drives]; sources Off · Mouse X · Mouse Y · Mic · Beat · LFO; def.inputs shortlist   why → "you pick"
  note → Envelope not built — no envelope source; mic level is the follower

[16:37 GMT · 2026-10-31] · 1.1 build · src/editor/params/InputRows.jsx · labs/LabsParams.jsx · growthLine.js · fxGrowth.js
  what → InputRows: rows = MultiSelect [Source · Drives] read from mod bindings; Add input binds next shortlist param to Mouse X; mounted first in the Animation tab (generator + effect); growth line + effect declare inputs: growth · weight · contrast   why → plan 48 1.1
  verify → pending Playwright

[16:42 GMT · 2026-10-31] · 1.1 fix · src/editor/params/InputRows.jsx
  what → binding keeps transform.base; Off restores it   why → Off left Growth 0 / Weight 0.5 (the input's reading)
  before → unbind = resolved value   after → unbind = base
  verify → Growth 6 → bound → 6 ✓ · Weight 1.2 → bound → 1.2 ✓

[16:42 GMT · 2026-10-31] · 1.1 verify · Playwright 1400×900
  what → add · rewire · move · second add · off — all as the acceptance line; effect Motion tab shows Inputs, Add → Mouse X → Amount   why → close 1.1
  verify → no page errors ✓
  note → bound slider has no M dot in Labs; the Modulation section opens the binding

──────────── MILESTONE: plan 48 W1 ──────────── [16:42]
  changed: InputRows.jsx (new) · LabsParams.jsx · growthLine.js · fxGrowth.js · plan 48 · build not run
