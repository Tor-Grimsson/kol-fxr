# Playbook — Plan 30, the bar, the title line and the footer

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** build `.kol/llm-plan/30-the-bar-the-title-line-and-the-footer.md` end to end, walk it on `vite preview`, amend the spec in the same build.

**Standing rules (non-negotiable):**
- A reference screenshot is the instruction (memory `match-the-reference-first`).
- Copy verbatim; Tailwind first; retire to `_tmp/`, never `rm`.
- A green build is not verification — walk `vite preview`, light + dark.
- Footer strip stays a `SegmentedToggle` (memory). Labs untouched.

---
## Entries

[20:18 GMT · 2026-10-13] · setup · playbook created
  what → initialised the live playbook   why → /kol-goal + /playbook on plan 30

[20:20 GMT · 2026-10-13] · §§ 1–4 · shell/MenuTop.jsx · styles/kol-editor.css
  what → logo = Home button (16px); name "FXR" opens the app menu   why → amends R1.1 (user: logo → home, name → menu)
  what → bar h-12 → h-8; all ten MenuItem size="sm"   why → macOS bar height (kitty ref)
  what → .kol-editor-menu: surface-tertiary, oq-08 hairline, DS popover shadow; rows sans 13 / fg-emphasis / 26px   why → macOS + Firefox refs
  note → flyouts are DOM children ([role=menu]) so one scope covers every level; key labels stay mono

[20:20 GMT · 2026-10-13] · § 2 · AppLayout.jsx · index.html · manifest · mobile/MobileView.jsx
  what → Effexor FXR → FXR in all five   why → user ruling "fxr > effexor"

[20:20 GMT · 2026-10-13] · § 5 · shell/StatusBar.jsx → shell/DocTitle.jsx · Compose.jsx
  what → status bar moved to canvas.header order 1: centred "Untitled* @ 100%", h-5, no zoom button   why → amends R1.2 (Affinity ref)
  what → zoom-chip hide rule retargets :has(.kol-editor-doctitle)

[20:20 GMT · 2026-10-13] · § 6 · panels/EditorFooter.jsx · MenuTop.jsx
  what → editor footer renders nothing until useTimelineUp(); then Transport · Output · File   why → amends R2.1 (user ruling)
  what → BatchExportModal + bake overlay hoisted to `modals`, rendered with the strip down too
  what → Window › Left rail › Transport/Output/File pin the timeline when it's down, then open the tab
  note → no motion pack → no timeline → footer stays (Output · File)

[20:20 GMT · 2026-10-13] · § 7 · compose/CanvasArea.jsx
  what → FRAME_EDGE 8 → 16; a press on the DS frame's ratio label (+8px) on empty stage selects the canvas

[20:25 GMT · 2026-10-13] · §§ 8–9 · shell/panels/PaneHeader.jsx (new) · state/workspace.js (new) · EditorShell.jsx · Compose.jsx
  what → PaneHeader: grip · DS TabChips · trailing · ⌄ collapse; replaces TabsRow in Layers / Color / Selection panes   why → amends R3.1 (Affinity refs)
  note → TabChips, not SegmentedToggle filled — TabChips IS the promoted Preview | Code row
  what → registry body panes get ids (color · layers · selection); RailBody renders from the workspace record   why → § 9
  what → grip drag: elementsFromPoint → drop line by midline / rail end; movePane on up; Window › Workspace ▸ Save… · saved rows ✓ · Reset
  note → ponytail: rail widths stay with useDragResize, not in the record

[20:25 GMT · 2026-10-13] · §§ 12–13 returned · panels/ToolPalette.jsx
  what → kol-ds-ui closed both as kol-component 0.253.0; per-row disabled on Rotate + Boolean rows
  note → registry still at 0.252.0 — bump waits on the publish (T14)

[20:25 GMT · 2026-10-13] · § 14 · color/ColourPanel.jsx · color/ColorModal.jsx
  what → Opacity = header-row Stepper (Affinity "Opacity: 100 %"); slider row at the foot gone
  what → view picker a full-width row (as the Swatches palette picker is); pane height 320 → content; SB square h-40

[20:25 GMT · 2026-10-13] · § 15 · color/SwatchesPanel.jsx
  what → Recent (session, last 8) · palette picker + Add swatch (+ → Custom, kol.editor.swatches) · None/Black/Grey/White · square grid · Search

[20:25 GMT · 2026-10-13] · § 11 · audit/2026-10-10-editor-spec.md · audit/2026-10-10-I-gaps.md
  what → R1.1 · R1.2 · R2.1 · R3.1 · R6.1 amended; gap row "zoom readout" → title line

[20:34 GMT · 2026-10-13] · § 16 · _tmp/2026-10-13-plan-30-walk/
  what → vite preview walk, 38 checks green, dark (colorScheme) + light (data-theme), 0 console errors
  note → Layers header clipped Navigator at the rail width → + moved to the Layers footer bar (Affinity), chips 6px in
  note → walk's two false FAILs fixed in the script (batch modal text is uppercase; Labs' rail starts collapsed)

[20:34 GMT · 2026-10-13] · T14 · package.json · panels/ToolPalette.jsx
  what → kol-component 0.252.0 → 0.253.0 (exact); fold opens empty, rows greyed, panel 191px; rotated label horizontal, 12px
  note → at 180° the rotate handle sits on the label → filed SelectionOverlayLabelClearsRotateHandle

──────────── MILESTONE: plan 30 ──────────── [20:34 GMT · 2026-10-13]
  changed: ~20 files · new: DocTitle · PaneHeader · state/workspace.js · retired: none · build ✓ · walk ✓

[20:38 GMT · 2026-10-13] · follow-up · package.json
  what → kol-component 0.253.0 → 0.255.0; at 180° the label hangs under the handle (no overlap); full walk green
