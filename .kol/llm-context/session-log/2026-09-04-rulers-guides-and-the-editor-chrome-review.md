# Session: Rulers + guides shipped, and the editor chrome review

**Date:** 2026-09-04 (continuous with the 2026-09-03 move session)
**Agent:** Grim (Opus 5)
**Summary:** Got the Figma ruler/guide behaviour exported out of kol-component's private internals and adopted by a second consumer the same night, then filed the user's own sixteen-finding review of the running editor with three rulings attached.

## Changes Made

### Files Modified — kol-fxr
- `lobby/inbox/editor-pin-is-30-versions-back.md` → **`lobby/done/`** with its resolution. All three asks answered and then superseded by the move; queue is **empty**.
- `lobby/outbox/rulers-and-guides-are-private.md` — **NEW**, then closed 🟢 with the tarball verification appended.
- `lobby/outbox/editor-chrome-review.md` — **NEW**.
- `lobby/INDEX.md` — two Filed-elsewhere rows, two history lines, destination count 29 → 31, queue 1 → 0.
- `.kol/llm-context/round-trip-inventory.md` — **NEW**. What has and has not been through a ticket: ~6,000 of 56,600 lines.
- `.kol/llm-context/playbook/2026-09-03-rulers-guides-extraction.md` — **NEW**. Live journal, two milestone blocks.
- `.kol/llm-context/plan.md` — appended the DRAFT estate split (`kol-signals` · `kol-fx`/`fx-panels` · keep `kinetic` · the deck), awaiting approval.
- `_tmp/2026-09-03-terminal-palette/palette.md` — **NEW**. The sampled terminal palette.

### Filed to kol-ds-ui
- **`rulers-and-guides-are-private`** — export `CanvasRuler` + `CanvasGuides`, break two couplings. **Returned as kol-component 0.203.0 in 79 minutes.**
- **`editor-chrome-review`** — sixteen findings from the user's own pass, his words verbatim, three rulings attached.

## Current State

### Working
- **Rulers + guides are a shipped component, adopted by two consumers on two different stages.** kol-component 0.203.0: all five symbols public, `virtualWidth` a prop, `view` gone entirely.
- kol-client-olina's deck runs them at `virtualWidth={1920}` in its built app — `pxPer` 0.393 on a 755px frame, ladder picks 250, a guide at the midpoint records `h:[540]`. Nothing to pass for `view`; the ResizeObserver + rAF settle covered their resize and width cap unaided.
- Four of the sixteen review findings already shipped (kol-component 0.205.0 · kol-theme 0.144.0 · design-editor 0.5.0): AlignmentGrid as two stateless SegmentedToggles, `PopoverPanel` tone + `oq-04` border, `.kol-popover` reading `--kol-tone-bg`, and both 12×12 close buttons onto `CloseButton`/`Button`.
- fxr's lobby queue is **empty** for the first time in the arc.

### Known Issues
- **Finding 1 (close-button hit area) is UNCONFIRMED.** I read `PanelTabs.jsx:19` and `PaletteModal.jsx:143` as 12×12 (`self-center` in a 40px `items-stretch` row); the user says it closes on the container. Either I read the wrong component or something else takes the press. Retracted to kol-ds-ui; their fix stands on its own merit regardless.
- **Finding 14 needs drawings, not a fix** — the six align marks and the rotate/flip trio are weak at 16px. They are fxr's own originals that moved with the editor, so there is nothing to send; it is new design work.
- Findings 3 · 4 · 8 · 10 · 11 · 12 · 16 still open. 10 (*"very buggy"* on the Scanline list) and 11 (*"transport is wrong"*) were never specified and could not be reproduced from a screenshot.
- `ARCHITECTURE.md` §2 + §N still claim this repo publishes the editor. **Still stale, still flagged, still not corrected.**
- The estate-split plan in `plan.md` is a DRAFT — `kol-signals` first — and unapproved.

### Rulings recorded
- **Accent → teal, scoped to `.kol-design-editor` only.** The brand binding (`--kol-accent-primary` → `--kol-color-yellow-300` in kol-framework) is out of this repo's scope: *"you dont have any brand control you only control the tickets to ds and assembly of the editor"*.
- **Guides → magenta**, deliberately separate from the accent.
- **Selected text field → white.**
- **Interaction steps are a two-state budget** — halve whatever step a hover lands on so selected has somewhere to go: `oq-ab-04` hover, `oq-ab-08` selected.

### The lessons
1. **I answered the deck's guides question from memory and was wrong.** I said the ruler geometry reads `PanZoomViewport`'s transform; it reads `[data-canvas-frame]`'s bounding rect and is transform-agnostic. Reading the source turned "not doing" into a shipped component adopted the same night. **The first answer was confident and cost a day if it had stood.**
2. **Measure the one claim you were about to assert.** CSS `zoom` vs `transform: scale` — both return a 960 rect on a 1920 element. That sentence is now in the component's docstring, where it stops someone adding a branch.
3. **npm serves 200 on version metadata while the tarball is still 404, for up to forty minutes.** `npm view` and the version doc both lie in that window; fetch the artifact. `kol-shell 0.53/0.54/0.55` and `kol-component 0.202.0` exist as metadata with no artifact — skip them.

## Next Steps
1. **Correct `ARCHITECTURE.md` §2 + §N** — third session running that this has been flagged and not done.
2. Decide the estate split in `plan.md` — `kol-signals` first, with the ADSR envelope.
3. Redraw the nine glyphs for finding 14, or rule them out of scope.
4. Resolve finding 1 — which close button actually closes on its container.
5. The engine (`loops` 28,421 · `filters` 5,194 · `kinetic` 1,969) has still never been examined by any ticket.
