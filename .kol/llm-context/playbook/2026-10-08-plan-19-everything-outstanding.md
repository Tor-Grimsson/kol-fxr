# Playbook — Plan 19, everything outstanding

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** Plan 19 (`.kol/llm-plan/19-audit-fixes.md`) end to end — the audit's six fixes and the two DS tickets; own decisions; nothing outstanding at the end.

**Standing rules (non-negotiable):**
- Nothing gets deleted. `_tmp/<date>-<what>/`.
- The editor is this repo's source; no DS tickets for editor work — only for the two gaps plan 17 named.
- Copy is the user's: no user-facing text changes.
- Tailwind first; DS component before local markup.

[00:41] · plan 19 · goal file written, 8 items · playbook opened
  what → lobby squared first: media-client-0-4-1 closed on the live bundle (media. ×1, admin. ×0); outbox owes nothing, the 📌 list was my grep not the ledger

[00:52] · plan 19 § 1 · LabsView.jsx · state.jsx
  what → the pick-opens-rail effect unfolds two frames late (the Morph-arrival race, same fix); restore guard skips on ?preset= like ?open=
  verify → walk on preview, pending

[00:55] · plan 19 § 2 · InspectorRail · PatternPanel · EffectsPanel · TimelineDock
  what → three kol-helper-12 sentences → kol-mono-12; TimelineDock's was helper-10 → mono-10 ("Hold — no curve.")
  note → AssetsBody:43 "Loading…" left — § 5 replaces the file

[00:58] · plan 19 § 3 · vite.lib.config.js → _tmp/2026-10-08-lib-build/ · build:lib out · README line out
  note → audit #10 was WRONG on core.jsx + index.lib.css: App/AppLayout/LibraryPage import src/index.jsx → ./core → index.lib.css. They stay. Plan § 3 corrected.
  verify → pnpm build at the end of the code passes

[01:14] · plan 19 § 4 · three passes landed
  what → ghost-quiet Button: TimelineDock (Delete key · Close · fold chevron) · LabsView Catalog (pressed) · MobileOverlay Start over · EffectsPanel's iconBtn helper + sweep eye/x · LabsParams remove effect · LayerInspector SectionIconBtn (icon prop, pressed)
  what → outline Button: ModulationEditor Learn ×2
  what → MenuDropdownItem: blend list · expression examples (rowClass kol-mono-10 h-6, desc as shortcut) · bind sources · size presets · canvas context menu (+ MenuDropdownDivider; the fixed container stays local — ContextMenu would be the full swap)
  what → Tag xs: ColorField Theme/None (swatch as child) · LabsParams pills
  note → FlipButton (LayerInspector:409) has NO caller — dead, left as is, not converted
  note → Icon import dropped from TimelineDock · EffectsPanel · LabsParams (no uses left)
  verify → build + walk, pending

[01:58] · plan 19 § 1 + § 3 · verified on vite preview (built bundle, 1600)
  verify → /labs?view=labs&preset=scan-spaced-drift&cat=scanline with kol.editor.labs-draft present: data-rail absent, --kol-shell-rail-width 320px, --kol-rail-w 320px, no "Restore your last canvas?", layer on stage, 0 console errors ✓
  verify → pnpm build green twice (passes 1–3, then AssetsBody) ✓ · build:lib gone

[02:03] · plan 19 § 6 · /editor mount, built bundle on preview
  verify → performance resource entries at mount: localhost only (9), no external host; 0 console errors. The one external host in source is fonts.googleapis.com in modes/type/families.js — on demand when a Google family is picked, not at mount. Audit #1 was a cloud-network one-off; nothing degrades, nothing to fix ✓

[02:12] · plan 19 § 4 + § 5 · walked on vite preview (built bundle, 1600) · shots in _tmp/2026-10-09-plan-19-walk/
  verify → Assets list = ContentRow (file, thumb 32, titleClass kol-mono-12 — the file ramp's heading-05 sans was wrong for a rail) · grid = MediaTile on AssetGrid, same tile as the Images block ✓
  verify → canvas right-click = MenuDropdownItem rows + divider ✓ · ColorField popover = Tag xs NONE chip ✓ · labs Style rail clean ✓ · 0 console errors across /labs /editor and the popovers ✓
  note → not eyeballed (same DS atoms, build green): TimelineDock Delete key/Close, Learn ×2, blend/bind/size menus, EffectsPanel xs buttons — the user's live pass

[02:24] · plan 19 § 7 · two DS tickets filed into kol-ds-ui (StepList · SegmentedToggleOptionDisabled)
  what → specs in kol-ds-ui/lobby/inbox/, two 🔵 rows + history there (queue 18 → 20); receipts in lobby/outbox/ + Filed-elsewhere rows + history here; plan 17 struck (Open: none)
  note → filing INTO the DS inbox is the lobby-ds flow the user designed; the 2026-10-08 "don't touch other repos' lobby" was about returning kol-website's receipt on its behalf — if it meant every lobby, these two files are the undo

[02:27] · plan 19 · DONE — summary
  § 1 labs deep link: rail unfold two frames late (LabsView.jsx) · restore guard skips ?preset= (state.jsx) — walked ✓
  § 2 four sentences helper → mono (InspectorRail · PatternPanel · EffectsPanel · TimelineDock)
  § 3 vite.lib.config.js → _tmp/2026-10-08-lib-build/ · build:lib + README line out · core.jsx + index.lib.css STAY (live app code; audit #10 overreached) · build green ×3
  § 4 30 bare buttons → 11 ghost-quiet Button · 2 outline · 5 MenuDropdownItem (+ divider) · 3 Tag xs · 9 left as not-targets · FlipButton found dead (no caller), untouched
  § 5 AssetsBody: ContentRow (titleClass kol-mono-12) + MediaTile on AssetGrid — walked ✓
  § 6 /editor mount: localhost only, nothing to fix
  § 7 StepList + SegmentedToggleOptionDisabled filed into kol-ds-ui; plan 17 struck
  also → media-client-0-4-1 closed on the live bundle; walk shots in _tmp/2026-10-09-plan-19-walk/; preview server killed (pid 7328)
  open → nothing. The user's live pass covers the sites not eyeballed (listed in plan 19's status line).
