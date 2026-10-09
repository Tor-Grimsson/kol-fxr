# Plan — The global audit: the whole repo, every route, every control, by hand

**Status:** DONE 2026-10-09 (local, one session, under `/kol-goal`) — seven logs under `.kol/llm-context/audit/2026-10-09-{A..G}.md`, **46 findings** (A routes 14 · B tools 8 · C panels 5 · D type 5 · E DS assets 6 · F persistence 3 · G code 5), every one with file:line + state + width, nothing fixed. Walked on the built bundle at 1600 and 390 (width only — the MCP browser has no coarse pointer; the gestures stay the user's phone); sign-in not walkable without `VITE_FXR_API` (F2). The user's thirty are all either confirmed with a root cause (22 · 24 · 25 · 27 · 28 · 19 · 18) or routed to a ruling. **Plan 20 § 9 is the ordered build list.** Shots + console logs: `_tmp/2026-10-09-plan-21-walk/`. Playbook: `.kol/llm-context/playbook/2026-10-09-plan-21-the-global-audit.md`.
**Was:** OPEN 2026-10-09 (local). Runs BEFORE plan 20's thirty are ordered — plan 20 § 0b points here.
**Origin:** user, 2026-10-09: *"the cloud agent only audited text? then the entire repo needs an audit, I wanted a global audit!"* Plan 16's run (`.kol/llm-context/audit/2026-10-08.md`) was a console-error/overflow walk of seven routes at two widths plus four greps — it pressed no tool, opened no panel, and swept one tag. Its twelve findings were real; its coverage was not.

## What "global" means here

Every surface the app ships, on the **built bundle** (`vite preview`), at **1600 and 390 touch**, with every state a control can be in — nothing selected · a shape · a photo · a loop · a locked layer · signed out · signed in. Each pass reads the files behind what it walks; a grep is a starting list, never a finding. One log per pass under `.kol/llm-context/audit/2026-10-DD-<pass>.md`: numbered findings, each with file:line, the state, what is wrong, the fix class (fix · ticket · ruling · ignore). Nothing is fixed during a pass.

## The passes

### A. Routes and chromes
`/` · `/library` · `/settings` · `/editor` · `/labs` · `/morph` · `/randomiser` · `?view=mobile` · `?view=output` · the sign-in flow against the local Worker. Every nav row, every tab, every sheet and drawer, every dialog (New File · Files · Roll scopes · Shortcuts · Batch export · Palette). Deep links (`?open=` `?new=` `?preset=`) with and without a draft. Console clean on every step.

### B. The editor's tools and verbs
Every `ToolPalette` item and every `MenuTop` verb, pressed in each selection state above; the keymap (`?` sheet) key by key; drop, paste, alt/shift/⌘ modifiers; crop · node-edit · kinetic · boolean modes entered and exited; undo/redo after each. Finding 27 (*"multiple items in the tools don't work"*) gets its names here.

### C. The panels
Inspector (every section for every layer type) · Parameters · Effects · Layers · Assets · Colour / Stroke / Swatches · Animation · the timeline dock · labs' Generate / Style / Animation · the randomiser's row and dialog. Every empty state, every input's width and unit, every popover and dropdown.

### D. Type conformance — all of `src/`
`/kol-type-conform`: every `kol-helper-*` on text that can wrap → `kol-mono-*` (the `Hint` default first); no freestyle Tailwind sizing; no foreign families; mono split on the one fault line. Canvas rendering (`LayerRenderer`, `OutputView`) is exempt — it draws the user's type, not chrome.

### E. DS assets — all of `src/`
Hand-built where the DS has it: bare `<select>` / `<input>` / `<textarea>` / `<button>` / `<ul>` doing a component's job; local popovers, lists, chips, rows, headers; inputs stretching instead of `chars`-sized; the labs-rail laws (one segmented control · one row · one label voice · no `size` literals in rail components). DS gaps → plan 17's parked list, never tickets from the audit.

### F. Data and persistence
Drafts (editor · labs · morph) across reload and a closed window; dropped and uploaded images and videos (blob URLs vs the clip store — finding 24); the library and D1 sync at sign-in; `appSettings` keys; the clip GC; what a crash restores.

### G. Code
Dead code (`FlipButton`; unreferenced exports; the retired `_tmp/` pointers); duplicate helpers across `compose/` · `labs/` · `params/` · `mobile/`; `size` literals; `oq-*` vs `fg-*` strokes; every `TODO` / `ponytail:` comment aged against the plans.

## Order
A → B → C are one walk and go together, in a day. D and E are reads, next. F and G last. Then plan 20 absorbs the findings and the thirty are ordered with them.

## Verification
The log for each pass exists, every finding carries file:line + state + width, and the user can reproduce any finding from its line alone.
