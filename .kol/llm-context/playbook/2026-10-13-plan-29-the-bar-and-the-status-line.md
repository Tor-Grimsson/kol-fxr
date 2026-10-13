# Playbook — Plan 29, the bar and the status line

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** build `.kol/llm-plan/29-the-bar-and-the-status-line.md` §§ 1–12, walk it on `vite preview`, amend the spec in the same build.

**Standing rules (non-negotiable):**
- Every change names the spec rule it fulfils / amends / restores (§ 0).
- Copy verbatim; Tailwind first; retire to `_tmp/`, never `rm`.
- A green build is not verification — walk `vite preview`, light + dark.
- Footer strip stays a `SegmentedToggle` (memory).

---
## Entries

[17:13 GMT · 2026-10-13] · setup · playbook created
  what → initialised the live playbook   why → /kol-goal + /playbook on plan 29

[17:17 GMT · 2026-10-13] · § 1 · src/editor/shell/StatusBar.jsx
  what → name read-only "Untitled @ 100%", * while layers ≠ last save/open   why → amends R1.2 (Affinity's bar is read-only)
  note → compose/savedMark.js; markSaved at buildSavedSpec (the one save choke point) + on currentPresetId change

[17:17 GMT · 2026-10-13] · §§ 2–3 · shell/NavigatorPanel.jsx · panels/LayersAssetsPanel.jsx
  what → Navigator = 4th left-rail tab, zoom row (− slider +) via kol:zoom-at   why → restores plan 24 § 7
  what → canvas fill as the box background; snapshot every 500 ms while mounted   why → black canvas read empty; loops froze

[17:17 GMT · 2026-10-13] · §§ 4–5, 7 · shell/MenuTop.jsx
  what → logo 16px inert; "Effexor FXR" app menu (Home · Chromes ▸ · Settings…); cog retired   why → amends R1.1
  what → Tools menu (Generative ▸ Pattern ▸ Type ▸ Effects ▸ · Insert image); Layer = edit verbs   why → user ruling

[17:17 GMT · 2026-10-13] · § 9 · params/TimelineDock.jsx · panels/EditorFooter.jsx · packs/motion.js
  what → useTimelineUp() shared; editor footer shows Transport only while the dock is up   why → amends R2.1
  note → labs keeps Transport (its loop plays on it) — scoped by currentView() === 'editor'

[17:17 GMT · 2026-10-13] · § 12 · color/ColourPanel.jsx
  what → one Dropdown top-right (Hue · Wheel · HSL · RGB); both strips retired   why → restores the user's reference, amends R3.2

[17:24 GMT · 2026-10-13] · § 8 · shell/menus/MenuFlyout.jsx
  what → flyout panel flex flex-col   why → inline-flex rows measured as one line (≈795px) → 320 cap
  verify → Starters 192 · Aspect 180 · Library 180 · leaves 180 ✓

[17:24 GMT · 2026-10-13] · § 3 · shell/NavigatorPanel.jsx
  what → thumbnail in a fixed 200px stage, width min(100%, 200·ratio)   why → full-width portrait squeezed the Color pane
  verify → 160×200 at 4:5 ✓ · black canvas draws black ✓

[17:24 GMT · 2026-10-13] · § 11 · audit/2026-10-10-editor-spec.md · audit/2026-10-10-I-gaps.md · llm-plan/28
  what → R1.1 R1.2 R1.6 R2.1 R2.4 R3.2 amended; gap rows 13 20 28 31; plan 28 superseded-in-part note   why → the law matches the build

──────────── MILESTONE: plan 29 built ──────────── [17:24 GMT · 2026-10-13]
  changed: 13 files · quarantined: 0 · rescued: 0 · build ✓ · walk ✓ (light + dark, 0 errors)
  log: run /log-work for the session log

[17:32 GMT · 2026-10-13] · § 1 follow-up · compose/savedMark.js · shell/StatusBar.jsx
  what → the * counts canvas changes too (aspect, size, fill, opacity, backdrop)   why → user: "is it normal now or no" — Affinity marks any change
  verify → fresh Untitled · aspect → Untitled* · Save clears · fill → * · ⌘S clears ✓ · 0 errors
