# GatedEmptyState — placeholder prose belongs to the DS, gated, off by default

**Filed:** 2026-08-15 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/GatedEmptyState.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 CLOSED + ADOPTED 2026-08-15 — shipped in kol-ds-ui, published to npm, and adopted here. Remainder: none.

## What stays here

- `src/editor/components/Hint.jsx` + the `H` key + `showHints` setting,
  wired to 8 call sites. **Declared stopgap**, delete on adopt.

## ✅ RETURNED — 2026-08-15 · kol-component@0.46.0 + kol-theme@0.43.0

`usePlaceholders()` + `<EmptyState gated>` + the `.kol-placeholder` class.
One concept, one gate, default OFF — this ticket's own diagnosis was right,
that splitting "helper text" / "empty state" / "hint" into three ideas is what
let the prose creep back, since each had a home and none had an off switch.

The suppression is CSS, NOT a render branch, so it covers this repo's OWN
prose the moment the class goes on it — not only `EmptyState`. Written as
`:root:not([data-kol-placeholders])` so an element keeps whatever display it
had instead of being forced back to `block` on reveal. The hook persists to
localStorage and syncs through a module-level subscriber set, because a
settings checkbox and a keybind are usually two components.

`gated` is OPT-IN, not the default: flipping it would silently blank every
surface already shipping an `EmptyState`.

**THE KEYBIND IS DELIBERATELY YOURS.** `H` here is already `toggle-visibility`
in `keymap.js`; a DS that grabbed a global key would have shipped you that
collision. Bind `toggle` to whatever you pick.

**Remainder here:** none — adopted 2026-08-15, see below. Returned as: bump, delete `Hint.jsx` and its module-scope listener, put
`.kol-placeholder` on the 8 call sites. ⚠️ NOT YET PUBLISHABLE — see below.

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

`components/Hint.jsx` is now three lines: it renders `<p>` with
`kol-placeholder`. Deleted from it — the module-scope window listener, the
`appSettings.showHints` read, and the null-return branch. `showHints` is gone
from `lib/appSettings.js` (the DS owns the preference and persists it under
its own key; two copies of one switch is two sources of truth).

`I` moved to `state/useGlobalShortcuts.js`, which EditorShell already mounts —
the very reason Hint had bound its own listener. `keymap.js`'s `toggle-hints`
entry lost `passive: true`, since it is genuinely dispatched now.

All 8 call sites are untouched: `<Hint>` still works, and the gate is a class,
so any element wearing `kol-placeholder` is governed by the same switch.

**Remainder here:** none. Build clean.
