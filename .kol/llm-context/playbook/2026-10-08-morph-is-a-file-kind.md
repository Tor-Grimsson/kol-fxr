# Playbook — Morph is a file kind, with its own rail tab

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** Plan 09 — a morph is a fourth file kind: New File offers it, labs gets a Morph tab (two doors, steps, controls, the editing rule, Save), Home opens a morph file into the tab, the randomiser plays one, Morph… leaves the File tab.

**Standing rules (non-negotiable):**
- Verify on the built bundle (`vite preview`), never only on dev — the `sideEffects` tree-shake shipped live past every dev walk on 2026-10-08.
- Nothing gets deleted. `_tmp/<date>-<what>/`.
- The editor is this repo's source; no DS tickets for editor work.
- Copy is the user's: no user-facing text changes beyond the new surfaces.

[18:22] · plan 09 · goal file written, 6 items
  what → playbook opened; reading labs' rail tabs, the save path, the randomiser sheet, the catalog API

[18:27] · plan 09 · src/editor/morph/{morphStore,StepPicker,MorphTab}.jsx · library/UrlIntents.jsx · components/NewFileDialog.jsx
  what → the store, the two-door picker, the Morph tab (empty · steps · controls · the editing rule · Save), ?open/?new intents, New File's four doors
  what → wired: LabsParams Morph tab · LabsView mounts the picker, card yields · state.jsx no restore on ?new · buildSpec.mode · AppLayout chromeOf by mode + NewFileDialog · LibraryPage · EditorFooter Morph… gone · MobileOverlay read-only tab
  note → old MorphDialog/Host/store + OpenFromUrl → _tmp/2026-10-08-morph-dialog/ · reorder is ↑ ↓ not drag (keyboard-reachable, less code)
  verify → build ✓ · walk ~

[18:39] · plan 09 · walk on the built bundle
  what → 20 checks green: four doors · picker · step 1 lands the generator · 2 steps = tracks + play · reorder · the editing rule · Save (mode morph, 3 steps) · no Morph… in File · Home opens into the tab · the randomiser plays it, read-only
  note → fixed on the way: validatePreset dropped canvasW/H · mode · morph — kept now; UrlIntents strips the URL a tick late (child effects run before the provider's restore check); MobileOverlay's useMorph above its early returns (React #310); the randomiser starts live on ?open; icon "x" not "close"
  verify → build ✓ · plan09 ✓ · plan08 ✓ · sync ✓ · home ✓ · routes 7/7 desk + phone ✓

──────────── MILESTONE: plan 09, morph is a file kind ──────────── [18:39]
  changed: 16 files · quarantined: 4 (_tmp/2026-10-08-morph-dialog/) · build ✓
  log: /log-work next
