# Playbook — Plan 21, the global audit

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** Plan 21 (`.kol/llm-plan/21-the-global-audit.md`) — seven passes A–G over the whole repo on the built bundle at 1600 + 390 touch; one log per pass under `.kol/llm-context/audit/`; every finding file:line + state + width; nothing fixed during a pass.

**Standing rules (non-negotiable):**
- A grep is a starting list, never a finding — read the file behind it.
- Nothing is fixed during a pass. Findings only.
- Walk the BUILT bundle (`vite preview`), never dev.
- Every port I open is killed by PID when the pass ends.

[00:35] · plan 21 · goal file written, 8 items · playbook opened
  what → pass A first: build is current (plan 19's last build), preview on 4977

[00:45] · plan 21 § A · DONE — audit/2026-10-09-A-routes.md, 14 findings
  what → 1600: every route, the six editor menus, ⌘O Files, S shortcuts, the settings drawer, the morph palette, the randomiser picker; 390: every route + the labs drawer/sheet/transport
  found → New File dialog has no surface (A1) · Library = 70 placeholder cards (A6) · settings gear on /settings (A7) · I = placeholder toggle (A8) · shortcuts sheet ignores Escape (A9) · Files crumb doubled (A10) · phone browse screen traps (A14) · settings header at 390 (A13)
  note → 390 is width-only here: no coarse-pointer emulation in the MCP browser
  note → the DS closed StepList + SegmentedToggleOptionDisabled meanwhile (component 0.245.0 · theme 0.169.0) — receipts carry 📌 remainders (bump, swap StepList, drop dim()); NOT done during the audit, goes to plan 20 as a step

[00:52] · plan 21 § B · DONE — audit/2026-10-09-B-tools-and-verbs.md, 8 findings
  what → 1600, real mouse (run_code): rect · two rects · group · unite · text · pen · node edit · pattern · photo · loop; every toolbar action + menu verb per state; 24 keys; ⌥-drag; synthetic OS-file drops on four targets
  found → outside-frame click keeps the selection (B1 = user 22) · lock refuses half (B2, B8) · placing text + typing fires the keymap, H hid the layer (B3) · Crop lights and does nothing — imgW missing on tile-inserted photos (B4 = user 27) · two "Crop image" buttons (B5) · ⌥-drag no duplicate (B6 = user 28) · drops off-stage not prevented → browser navigates (B7 = user 25)
  note → Insert image (native file dialog) and Orbit/kinetic not driven; effects picker → pass C

[00:55] · plan 21 § C · DONE — audit/2026-10-09-C-panels.md, 5 findings
  what → the inspector per layer type (6), every popover (6), the three left-rail tabs, the three footer tabs, the Parameters / Effects / Animation tabs, every input measured
  found → Stroke weight 153px for "0 pt" (C1 = user 18; property grid is the DS's rule) · File footer tab = File menu again (C2) · Add effect adds an empty stage (C3) · modulation dots off by default (C4)
  note → BindDot popover not reachable without the setting; MediaPicker/Library modal walked in plan 19

[00:58] · plan 21 § D + § E · DONE — audit/2026-10-09-D-type.md (5) · audit/2026-10-09-E-ds-assets.md (6)
  D → 10 helper sentences, 9 of them <Hint className="kol-helper-12"> overriding a mono default (D1 = user 19) · 2 helper error strings · 8 freestyle eyebrows · a 10px CSS chip · --font-sans undefined on the editor root (system-ui fallback)
  E → one bare range input (AutoControls) · NewFileDialog's <ul> with no surface (A1/A2's cause) + MorphTab StepList (DS ships it now) · 73 size literals in inspector files vs the labs-rail law · 5 arbitrary z-indexes · the canvas context menu still local, layers have none
  note → zero freestyle Tailwind sizes; border-fg-* 0 / border-oq-* 49

[01:04] · plan 21 § F + § G · DONE — audit/2026-10-09-F-persistence.md (3) · audit/2026-10-09-G-code.md (5)
  F → dropped image = blob: URL in the draft, ERR_FILE_NOT_FOUND after reload (F1 = user 24, root-caused: only videos hit saveClip) · no VITE_FXR_API locally → no sign-in anywhere, silently (F2) · dots setting in two keys (F3) · drafts + settings persist ✓
  G → FlipButton dead (G1) · 12 helpers defined 2–5× (loopById/filterById copies, clamp/lerp/vnoise…) (G2) · two expression sandboxes (G3) · 2 stale ponytail notes (G4)
  note → preview 4977 killed (pid 37360); walk shots + console logs → _tmp/2026-10-09-plan-21-walk/

[01:05] · plan 21 · DONE — summary
  A routes (14) · B tools and verbs (8) · C panels (5) · D type (5) · E DS assets (6) · F persistence (3) · G code (5) = 46 findings, seven logs, nothing fixed
  the user's thirty → root-caused: 22 outside-frame deselect (B1) · 24 blob: images (F1) · 25 drops off-stage (B7) · 27 crop dead, imgW (B4) · 28 ⌥-drag (B6) · 19 nine Hint overrides (D1) · 18 stroke width 153px (C1) · 17 the I key is the placeholder toggle (A8); 20 · 21 · 26 · 29 · 30 → rulings/features; 10 · 11 → the live pass
  new, not his: New File dialog has no surface (A1) · 70 placeholder cards (A6) · shortcuts sheet ignores Esc (A9) · text placement types into the keymap (B3) · lock refuses half (B2/B8) · the browse screen traps a phone (A14) · --font-sans undefined on the editor root (D5) · no VITE_FXR_API = no cloud, silently (F2) · 12 helpers ×2–5 (G2)
  plan 20 § 9 = the ordered build list (0 the DS returns → 1 data loss → 2 dead tools → 3 keys → 4 type → 5 dialogs → 6 chrome → 7 rulings → 8 tickets)
  open → nothing in this goal. Next session starts plan 20 § 9 step 0.
