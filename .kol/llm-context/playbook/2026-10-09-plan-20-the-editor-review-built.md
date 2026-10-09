# Playbook — Plan 20 § 9, the build

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** Plan 20 § 9 (`.kol/llm-plan/20-the-editor-review.md`) — steps 0–8 built, rulings decided here, each step walked on the built bundle.

**Standing rules (non-negotiable):**
- Nothing gets deleted. `_tmp/<date>-<what>/`.
- Tailwind first; DS component before local markup; copy is the user's.
- Build + walk per step, never only dev.
- Ports: preview by PID, killed when the walk ends.

[01:08] · plan 20 § 9 · goal file written (force), 10 items · playbook opened
  what → step 0: bump component 0.245.0 + theme 0.169.0, then StepList + disabled in MorphTab

[01:11] · plan 20 § 9 step 0 + step 8 · MorphTab.jsx · lobby
  what → component 0.245.0 · theme 0.169.0 pinned; StepList from the DS (items/activeIndex/onSelect/onRemove/onMove/onAdd, grab = pointer sort), local copy → _tmp/2026-10-09-morph-steplist/; mode strip on options[].disabled, dim() + the onChange guard gone; Icon import dropped
  what → three tickets filed into kol-ds-ui: EditorTransformGlyphs (icons, #14) · ButtonPrimaryHoverDeeper (theme, #15) · HubSettingsHeaderAt390 (shell, A13); receipts + rows here; the two returned receipts squared (Remainder: none)
  verify → build, then the Morph rail on preview

[01:14] · plan 20 § 9 step 1 · clipStore.js · state.jsx · CanvasArea.jsx · EditorFooter.jsx
  what → images are clips: storable() = video|image with a blob: src, one guard for dead/swap/gc; CanvasArea saves every dropped file; the footer's Upload image goes blob + saveClip (was a data: URL into localStorage); collectVideoClipIds frees image clips too
  what → window dragover/drop while the editor is mounted: prevented everywhere, a drop off the stage lands at the frame centre (B7)
  verify → preview: synthetic PNG drop on the grey viewport → prevented, Photo at 536,671 (frame centre), kol-editor-clips DB created; reload → Restore → the photo renders (naturalWidth 1), 0 console errors ✓

[01:15] · plan 20 § 9 step 0 · verified on preview
  verify → /morph: two steps via the palette → the DS StepList (3 li, 2 grab handles, "1 Circle morph · 2 Circle morph · 3 Add a step"), mode strip cells carry aria-disabled only when blocked ✓

[01:21] · plan 20 § 9 step 2 · CanvasArea.jsx · state.jsx · TypeBlock.jsx · LayerRenderer.jsx · ToolPalette.jsx · LayerInspector.jsx
  what → B1 a pointerdown on the viewport pane outside the stage deselects · B6 ⌥-drag = duplicateLayer(id, { offset: 0 }) (returns the clone id now) then the copy drags · B2 flips + duplicate obey canXform/locked · B3 the text tool places with editOnMount → TypeBlock opens editing with the caret (a selected→unselected transition commits, not the first render) · B4 crop: a mode chip + wheel-zoom about the pointer (cover-fit floor) — a cover photo filled its frame so crop looked dead · B5 the inspector's Crop cell gone, the toolbar's is the one
  note → B8 was my test's error (⌘Z had undone the lock); the nudge branch already guards locked
  verify → preview: outside click clears the inspector ✓ · ⌥-drag 2→3 rows, copy moved ✓ · lock disables flip/rotate/duplicate ✓ · T + click + "Hello" + Esc → text Hello, flag cleared ✓ · one Crop button ✓ · crop chip shown, wheel 1080→1968 ✓

[01:23] · plan 20 § 9 step 3 · keymap.js · CanvasArea.jsx · ColourPanel.jsx · ShortcutsOverlay.jsx
  what → Escape closes the shortcuts sheet (a window listener — the DS panel's own needs focus inside it) · ? aliases S (matchCombo matches the glyph, not the shift state) · I = eyedrop (kol:eyedrop → ColourPanel's pick), the placeholder toggle hidden on Shift+I
  verify → preview: S opens, Esc closes, ? opens, I fires kol:eyedrop, the sheet lists Eyedropper and not the placeholder ✓

[01:23] · plan 20 § 9 step 4 · the type sweep
  what → nine <Hint className="kol-helper-12"> overrides dropped (the default is mono) · MenuTop · ErrorBoundary · RuleRow · AudioInputRow · EditorFooter err → mono · eight eyebrows → kol-eyebrow (AssetsBody ×2, ColorField's JS toUpperCase, PaletteModal ×2, TextPanel ×3) · index.lib.css root family → --kol-font-family-sans
  note → D4 (the [data-kol-tip]::after chip) is a pseudo-element — CSS is the sanctioned place; not a finding after all

[01:33] · plan 20 § 9 step 5 · NewFileDialog.jsx · AppLayout.jsx · FilesDialog.jsx · LabsCatalogCard.jsx · lobby
  what → A1/A2 the New File dialog on a surface (bg · oq-08 border · shadow), rows in kol-mono-12 · A3 the walkthrough's copy from the chromes' own one-liners · A10 crumb = Files / Library / Preset (the bucket was named "Files" too) · A14 the phone card starts under the top bar, a scrim tap closes it, the sheet's Catalog brings it back · A5 is the Hub's carousel → HubWalkthroughEscape filed (kol-shell) · A4 kept: LibraryPage.jsx:464 documents the empty placeholder on purpose · A11 → plan 17 (the DS columns view has no empty line)
  verify → preview: dialog bg rgb(250,250,250) + 1px border, titles JetBrains Mono ✓ · walkthrough text ✓ · crumb "Files / LIBRARY / PRESET" ✓ · 390: card top 48, hamburger reachable, scrim tap closes, Catalog button present ✓

[01:38] · plan 20 § 9 step 6 · CanvasArea.jsx · overlays · LayerInspector.jsx · AutoControls.jsx · StrokePanel.jsx · lib/util.js · lib/sandbox.js
  what → E4 five z-indexes onto --kol-z-* · E5 the canvas menu is the DS ContextMenu (rows stay local; LayerStack rows → plan 17, the DS has no onContextMenu) · E1 the schema rail's range input → DS Slider readout="none" (the 8 "native ranges" in labs ARE the DS Slider's own) · G1 FlipButton → _tmp/2026-10-09-flipbutton/ · G2 clamp/lerp: one util (5 editor files), loopById/filterById were pack SEAMS not copies — left · G3 one SHADOWED_GLOBALS (loops/lib/sandbox.js) for both expression compilers · G4 the two stale notes went with their features · C3 kept: Type/Category is a chooser, not an empty stage · C1 the stroke weight field w-24
  verify → preview: DS context menu at the pointer, 6 rows, Esc closes ✓ · stroke input no longer fills the row ✓

[01:38] · plan 20 § 9 step 7 · the rulings, decided here
  what → A6 placeholders ride the DS usePlaceholders switch; off (default) the Library shows an EmptyState · A7 no drawer gear on /settings · C2 the footer File tab keeps import/export + audio, the three menu verbs left · C4/F3 one dots switch (dotVisibility; labsModDots gone; the Settings row is a DotsSwitch) · F2 the Files dialog says "Cloud sync is not configured" when there is no API base · #20 Appearance shows Fill · Stroke swatches + "Colour…" opening the colour modal · #21 snapping already covered objects + canvas + guides — the menu label said guides only; fixed · #26 = B4's pan + wheel · #29 ADMIN_PASSWORD set to the user's value (wrangler secret put ✓, api/.dev.vars) · A3 the walkthrough copy
  verify → preview: Library 0 placeholders + "Nothing saved yet" ✓ · /settings no gear ✓ · footer Save to file / Load from file only ✓ · no-cloud line ✓ · snap label ✓ · paint row + Colour… ✓ · M writes kol-editor-show-dots ✓

[01:39] · plan 20 § 9 · DONE — summary
  built → step 0 DS returns (StepList · disabled) · 1 images persist, drops off-stage land · 2 crop chip + wheel, one Crop, text edits on place, outside-frame deselect, ⌥-drag copy, one lock rule · 3 Esc/?/I · 4 the type sweep · 5 New File surface + voice, tour copy, Files crumb, phone card · 6 z tokens, DS ContextMenu, DS Slider, FlipButton out, clamp/lerp/sandbox deduped, stroke width · 7 eleven rulings taken · 8 four tickets filed
  walked → every step on vite preview 4977 (pid 2050, killed); shots → _tmp/2026-10-09-plan-20-walk/; final build green; 0 console errors on every walk
  corrected on the way → B8 (my test undid the lock) · B4 (crop worked, invisible on a cover-fit photo) · G2 (loopById/filterById are pack seams) · D4 (a pseudo-element — CSS is right) · C3 (a chooser, not an empty stage) · A4 (documented choice)
  open → nothing in this goal. The user's live pass: #10 · #11 · touch · sign-in · the inspector voice · the eyedropper glyph in dark.

[01:57] · the DS answered three of the four tickets within the hour
  what → kol-theme 0.170.0 pinned (ButtonPrimaryHoverDeeper, squared) · HubSettingsHeaderAt390 + HubWalkthroughEscape cite kol-component 0.246.0 + kol-shell 0.63.0 — 0.246.0 is NOT on the registry yet (pnpm view: 0.245.0), and shell 0.63.0 peers it, so those two bumps wait on the publish; receipts keep their remainder · EditorTransformGlyphs is 🔴 needs-ruling: A/B drawings on kol-ds-ui's open-questions Round 9, the user's pick

[01:58] · kol-component 0.246.0 landed → component 0.246.0 + shell 0.63.0 pinned, build green; HubSettingsHeaderAt390 + HubWalkthroughEscape squared · EditorTransformGlyphs closed as kol-icons 0.34.0 — not on the registry yet (0.33.1); that bump waits

[02:00] · kol-icons 0.34.0 published → pinned, build green; EditorTransformGlyphs squared. Every KOL package at its latest: component 0.246.0 · theme 0.170.0 · shell 0.63.0 · icons 0.34.0.
