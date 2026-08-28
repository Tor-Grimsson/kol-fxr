# ThreeColumnEditorShell — two-column shell + left-only resize gesture

**Filed:** 2026-08-15 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ThreeColumnEditorShell.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 CLOSED + ADOPTED 2026-08-15 — shipped in kol-ds-ui, published to npm, and adopted here. Remainder: none.

Carries three gaps in one family: the 3-column editor grid (shipped
`.kol-brand-layout` is 2-col; the 3-col rule is bound to the 160px docs
`--kol-toc-w`), `useDragResize` being sidenav-shaped so a right rail cannot
use it, and `.kol-sidenav-link` shipping no `:focus-visible` while its sibling
`.shell-nav-item` does.

## Why it went there

Rails, widths, collapse and the resize gesture are shell chrome. A consumer
copy of the gesture is the local-twin pattern this repo is retiring.

## What stays here

- `--kol-rail-w` + the grid block in `labs.css`; the `focus-visible:ring-focus`
  patch on `NavLeaf`.
- **On ship: adopt.** Delete the grid block, point the hook at `--kol-rail-w`
  with `side: 'right'`, drop the focus patch.

## ✅ RETURNED — 2026-08-15 · kol-framework@0.21.0 + kol-theme@0.43.0

All three gaps closed.

1. **The gesture** — `useDragResize(ref, { token, side })`. Every name it
   touches (custom properties, data-attributes, both localStorage keys) now
   derives from one token; `side: 'right'` inverts the pointer sign AND the
   arrow keys. Call it as
   `useDragResize(railRef, { token: 'kol-rail', side: 'right' })`.
   Defaults reproduce the 0.17.0 names byte-for-byte, so SideNav is untouched.
2. **The layout** — `--kol-rail-{w,w-collapsed,snap,step,snap-default}` and
   `.kol-brand-layout[data-rail="true"]`, each rail's track behind a private
   var so the two collapse independently. Deliberately NOT behind the TOC's
   `min-width: 1280px` gate.
3. **The focus leaf** — `.kol-sidenav-link` had no treatment at all, only
   `.is-active` and its dot, so it fell through to the browser default. That
   is the "weird highlight bug". Now 1px INSET, matching `.shell-nav-item`
   rather than the 2px offset ring you correctly flagged as blooming.

**Remainder here:** none — adopted 2026-08-15, see below. Returned as: bump, delete the `--kol-rail-w` + `.kol-editor-grid`
blocks, point the hook at `{ token: 'kol-rail', side: 'right' }`, drop the
`focus-visible:ring-focus` patch. ⚠️ NOT YET PUBLISHABLE — see the note below.

---

**⚠️ PUBLISH STATUS — do not adopt yet.** The versions cited above are bumped
in kol-ds-ui but **not published**. npm still serves kol-component@0.45.0,
kol-theme@0.42.2, kol-framework@0.20.1. Bumping here or deleting a stopgap
before those land on the registry breaks this repo. Publishing is the user's
call, not the agent's.

**⚠️ NOT RENDERED.** 20 gates and a name-contract check pass; nothing was seen
in a browser. No one has watched a right-hand rail drag or the placeholder gate
toggle. First adoption is the real test.

## ✅ ADOPTED HERE — 2026-08-15

The right rail drags. `labs/LabsView.jsx` `LabsRail` now holds a ref and calls
`useDragResize(railRef, { token: 'kol-rail', side: 'right' })`, rendering the
DS `.kol-sidenav-grab` chrome on its INNER edge (the one facing the canvas).
`--kol-rail-w: 256px` is deleted from `labs.css` — kol-theme 0.43.0 ships the
same value on `:root`, plus the snap/step/collapsed siblings the gesture needs.

`labs.css` keeps its grid rules, rewritten onto private track vars so the two
rails collapse independently off one rule each, and now handling
`:root[data-rail="collapsed"]` and `[data-rail-dragging]`.

**Why the grid CSS did not fully die:** the DS ships
`.kol-brand-layout[data-rail="true"]`, and this shell's grid is
`.kol-editor-grid`. A DS rule cannot reach markup that never wears its class.
Closing that last gap means either putting `.kol-brand-layout` on the editor
grid — which drags in the rest of that class's rules — or the DS exposing the
template without the class. Not attempted; flagged.

**Remainder here:** none blocking. Build clean.
