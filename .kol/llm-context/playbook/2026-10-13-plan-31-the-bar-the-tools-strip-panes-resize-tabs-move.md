# Playbook — Plan 31, the bar, the tools strip, panes resize, tabs move

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** build `.kol/llm-plan/31-panes-resize-and-tabs-move.md` end to end, walk § 9 on `vite preview`, DS asks filed and adopted, plan BUILT.

**Standing rules (non-negotiable):**
- A reference screenshot is the instruction (memory `match-the-reference-first`).
- Copy verbatim; Tailwind first; retire to `_tmp/`, never `rm`.
- A green build is not verification — walk `vite preview`, light + dark.
- Footer strip stays a `SegmentedToggle` (memory). Labs untouched.

---
## Entries

[21:21 GMT · 2026-10-13] · setup · playbook created
  what → initialised the live playbook   why → /kol-goal on plan 31

[21:21 GMT · 2026-10-13] · §§ 1–3 · lobby → kol-ds-ui
  what → filed MenuItemOffset · ToolPaletteVertical · CanvasRulerGraduated (inbox + outbox stubs + both ledgers)   why → the menu offset, the vertical palette and the ruler are DS code
  note → adoption waits on the publish; local build continues meanwhile

[21:33 GMT · 2026-10-13] · §§ 1–2, 4–8 · built
  what → bar bg-surface-tertiary + sans triggers (one widened rule); MenuTop passes offset={2.5} via {...BAR} (inert until the DS bump)   why → § 1
  what → ToolPalette split: ToolStrip (slot `tools`, 44px column, SwatchStack at the foot) + ActionBar (registry.toolbar, h-10 band); canvas header = DocTitle only   why → § 2 (Affinity's head)
  what → workspace.js: panes + tabs registry, record { left/right: [{id,tabs,active}], collapsed, heights }, moveTab/openTab/setPaneHeight, startTabDrag + ghost   why → § 4 the tab is the unit
  what → PaneHeader: chip press past 4px drags the tab, header drop ring, ⌄ gone, double-click collapses; Pane.jsx one component + PaneGrab (bottom edge, pill, floor header+40, dbl-click reset)   why → §§ 5–7
  what → tabs.jsx (compose tabs + WorkspaceEffects: openers + auto-flip store-side); ColourPanel square flex-1 min-h-40   why → §§ 6, 8
  note → ToolPalette · LayersAssetsPanel · SelectionPalettePanel · ColorModal → _tmp/2026-10-13-plan-31/
  note → first preview walk: 0 errors, bar #0e0e11 sans 13, headers on one line at y 72, no chevrons, 3 grabs; Color pane opened on Stroke → pane `active: 'Colour'`; swatch pair 44 wide → column 44

[21:42 GMT · 2026-10-13] · § 9 · vite preview walk · _tmp/2026-10-13-plan-31-walk/
  what → 0 console errors dark + light; bar #0e0e11 / #fff, sans 13 full ink; band 40 under the bar; strip 44 at the far left; three pane headers + doc title on one line (y 72)
  what → Color square 160 → 300 on a +140 drag; floor 80 (header + 40); dbl-click resets; +100 survives reload
  what → History chip → right rail end = new pane (ghost + drop line); onto the Selection header = joins (ring), active; a click still switches; kol:open-tab finds it where it sits
  what → dbl-click Layers header collapses (41) and expands; no ⌄ anywhere; File menu panel 1px under the bar (DS offset 4 vs 2.5 passed — one line at the bump)
  note → plan 31 BUILT; T3 (the DS trio) waits on kol-ds-ui's publish — goal `blocked` on that, lobby watch armed

[21:58 GMT · 2026-10-13] · plan 32 § 3 · public/touch-icons · manifest.webmanifest
  what → icon-192 · icon-512 · icon-512-maskable rendered from apple-touch-icon-dark.svg (rsvg-convert; the mark already sits in the middle 60%, inside the maskable safe zone); manifest lists them + `id: "/"`   why → Chrome's install needs 192 + 512 PNGs; Safari Add to Dock and iPhone already worked
  note → the three DS tickets returned as kol-component 0.256.0 — not on the registry yet (npm view: latest 0.255.0); adoption waits on the publish
