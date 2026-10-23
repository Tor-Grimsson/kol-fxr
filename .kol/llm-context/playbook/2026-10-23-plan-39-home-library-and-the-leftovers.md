# Playbook — Plan 39: Home vs Library, empty covers, Color Modes

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** build plan 39 in one run — Home is the user's, Library the chrome saves, no card hover, covers on old files, Color Modes a tool.

**Standing rules (non-negotiable):**
- card frame is the DS's; fix what fxr puts in it
- never delete — retire to `_tmp/`
- user-facing copy verbatim; Tailwind first

---
## Entries

[00:49 GMT · 2026-10-23] · setup · playbook created
  what → initialised the live playbook   why → plan 39, one run under /kol-goal
  note → 1.3 ruled by agent: Library = chrome saves only; shipped generators already live in each chrome's picker

[00:53 GMT · 2026-10-23] · W1 · src/AppLayout.jsx · src/pages/LibraryPage.jsx
  what → Home = New File card + files (recent/saved), signed in or not; Library = type · palette · pattern
  note → chrome cards off Home; Library cards no longer clickable
[00:53 GMT · 2026-10-23] · W3 · src/editor/library/UrlIntents.jsx · LibraryProvider.jsx
  what → a file with no cover gets one 1.5 s after it opens (setThumb — thumb only, savedAt kept)
  why → generators draw on live canvases; a cover cannot be drawn from an unmounted file
[00:53 GMT · 2026-10-23] · W4 · src/editor/color/ColorModesWindow.jsx · palette.js
  what → Color Modes is a scrim window (Tools · Edit · Window); Palette tab gone; Apply to document added
  what → PaletteModal + PalettePreview → _tmp/2026-10-23-palette-modal-retired/
  what → roll generates in OKLCH (oklchToHex, gamut by chroma)
  verify → palette.check ✓ (60 seeds × 7 relations, accent L 0.60–0.72)

[00:58 GMT · 2026-10-23] · W1 · src/pages/LibraryPage.jsx
  what → Library covers: a palette shows its colours, a type save its own text in its face
[00:58 GMT · 2026-10-23] · verify · dev server :5391 (killed after)
  verify → Home: New File + files ✓ · hover rest = hover ✓ · Library: palette only ✓
  verify → cover backfill = save cover, layers + savedAt same ✓ · Color Modes window from Tools ✓ · Apply to document → compose colors ✓
  verify → palette.check ✓ · console 0 errors ✓
  note → receipt AppCardNoHoverFill closed in lobby/INDEX.md

──────────── MILESTONE: plan 39 ──────────── [00:58 GMT · 2026-10-23]
  changed: 13 files · retired: 2 (PaletteModal, PalettePreview → _tmp) · build ✓ (dev)
