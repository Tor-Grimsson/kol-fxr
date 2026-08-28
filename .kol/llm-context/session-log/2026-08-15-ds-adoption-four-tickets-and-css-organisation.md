# Session: the four DS tickets adopted, and the CSS organised

**Date:** 2026-08-15
**Agent:** Grim (Haiku 4.5) — working from kol-ds-ui, in both repos
**Summary:** The four tickets this repo filed came back shipped; all four
adopted, every stopgap retired except one that was rejected on inspection.
Plus a CSS organisation pass and a routing fix found on the way.

## What came back

Built and published in kol-ds-ui, then adopted here. Deps now:
`kol-component@^0.46.0` · `kol-framework@^0.22.0` · `kol-icons@^0.17.0` ·
`kol-theme@^0.43.1`.

### 1. InspectorSectionRhythm → `Section divided`
`params/AutoControls.jsx` passes `divided`; `.kol-params-section` and both its
rules are gone.

**The correction that matters:** the DS resolution claimed our `gap: 0.5rem`
override was a no-op against `Section`'s `gap-2`. It was not. The call site
also passed `gap-4` in `className`, which out-ordered `gap-2`, and the local
rule was out-specifying *that* back to 8px. Dropping the hook class alone would
have silently widened every param section to 16px. `gap-4` was removed with it,
so `Section`'s own 8px now applies with nothing overriding anything.

### 2. ThreeColumnEditorShell → the right rail drags
`labs/LabsView.jsx`'s `LabsRail` holds a ref and calls
`useDragResize(railRef, { token: 'kol-rail', side: 'right' })`, rendering the DS
`.kol-sidenav-grab` chrome on its **inner** edge. `--kol-rail-w: 256px` deleted
— kol-framework ships it on `:root` with the snap/step/collapsed siblings.

Grid rules rewritten onto private track vars, so the two rails collapse
independently off one rule each, and `[data-rail="collapsed"]` /
`[data-rail-dragging]` are handled.

**Why the grid CSS did not fully die:** the DS ships
`.kol-brand-layout[data-rail="true"]` and this shell's grid is
`.kol-editor-grid`. A DS rule cannot reach markup that never wears its class.

### 3. GatedEmptyState → `usePlaceholders()`
`components/Hint.jsx` went from 39 lines to 3 — it renders `<p>` with
`kol-placeholder` and nothing else. Deleted: the module-scope window listener,
the `appSettings.showHints` read, the null-return branch. `showHints` removed
from `lib/appSettings.js` (the DS owns the preference and persists it under its
own key; two copies of one switch is two sources of truth).

`I` moved to `state/useGlobalShortcuts.js` — which EditorShell already mounts,
the very reason Hint had bound its own listener. `keymap.js`'s `toggle-hints`
lost `passive: true`.

All 8 call sites untouched: `<Hint>` still works, and because the gate is a
class, any element wearing `kol-placeholder` is governed by the same switch.

### 4. FocusRingsInConsumers → adopted, remainder REJECTED
The `--kol-focus-ring` / `--kol-focus-ring-quiet` pair arrived with the theme
bump. Nothing else was needed.

**The remainder said to delete our `input`/`textarea` `outline: none` rule.
That was wrong and was not actioned.** That rule suppresses the ring the
BROWSER draws on a native `<input>` — an element the DS never styled and
therefore cannot switch off. The DS tokens govern rings the DS draws. Deleting
it restores the Firefox double outline it was written to kill. The reasoning is
now written into `kol-editor.css` so it is not re-deleted next time.

Two premises in that ticket were also wrong and are corrected at the source:
the showcase does **not** suppress focus rings (its only stylesheet has zero
focus CSS), and this repo has **no** `outline: none !important` block.

## Also this session

### CSS organisation
```
src/index.css                       imports ONLY
src/index.lib.css                   lib entry (embeddable build)
src/editor/styles/kol-editor.css    the shell
src/editor/styles/kol-labs.css      labs   ← was labs/labs.css
```
`labs.css` was the only co-located sheet and the only one without the `kol-`
prefix; both fixed, all references updated including prose in comments.
`:root { scrollbar-gutter: stable }` left `index.css` for kol-framework 0.22.0
— it is chrome every app on the framework wants, not this app's business.

Mobile/randomiser has **no sheet and needs none** — Tailwind utilities plus
three DS type classes. If it grows real chrome it gets
`src/editor/styles/kol-mobile.css`.

### `?view=randomiser` now works
It existed in `CHROMES` and in `mode.js` but **not in the URL handler**, so it
silently fell through to the remembered mode and the only way in was
`?view=mobile` — which also cleared the desktop opt-in. Those are two separate
jobs and one URL was doing both. Now: `randomiser` is a deliberate request that
changes no preference and works on any device; `mobile` stays the tablet's way
back and still clears the opt-in.

## Current State

### Working
- App build clean. **Lib build (`build:lib`) also clean** — verified separately.
- Every focus rule in kol-theme reads one of two tokens; setting both
  transparent is a genuine system-wide off.

### Known Issues
- ⚠️ **NOTHING WAS RENDERED.** No browser check on any of this. The right
  rail's drag, the `I` gate and the section hairline have not been seen.
- `@kolkrabbi/design-editor` has **zero consumers** and one publish (0.1.0,
  2026-07-03), six weeks stale against an editor that has changed constantly.
  `index.lib.css` maintains a hand-written preflight copy for it. Quarantine
  was proposed, not actioned — the user's call.
- This repo is **not in the lobby registry** (`lobby --paths`), so
  `lobby-close` in kol-ds-ui silently skipped all four of our outbox receipts;
  they were written by hand. This will recur on the next ticket.
- `LabsShortcuts.jsx` and `LabsMenuTop.jsx` still duplicate the editor's own
  shortcuts overlay and settings menu — near-identical scaffolding, one
  keymap-driven and one hardcoded.

## Next Steps
1. **Render it.** First adoption is the real test.
2. The kol-shell home/settings tier — the user's proposal: kol-shell wraps
   HOME + settings *before* entering the editor, editor untouched behind it.
   `useNavHidden` is the documented seam for exactly that. Scoped, not started.
3. Decide `@kolkrabbi/design-editor`: quarantine or maintain.
4. Register this repo in the lobby registry.
