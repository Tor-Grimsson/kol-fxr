# ShortcutsOverlaySections — the overlay needs a sectioned variant

**Filed:** 2026-08-15 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShortcutsOverlaySections.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 CLOSED + ADOPTED 2026-08-15 — kol-shell@0.4.0, published and adopted here the same run. Remainder: none.

## Why it went there

`@kolkrabbi/kol-shell`'s `ShortcutsOverlay` takes one flat `[{ label, keys }]`
array and renders a single 2-column grid. This repo's keymap is sectioned
(Edit · Selection · Layer · Tools · View) and `state/keymap.js` already emits
`[{ section, items }]` via `shortcutsBySection()`.

So adopting the DS component as it stands would lose the grouping — which is
why `shell/ShortcutsOverlay.jsx` (99 lines) is still here.

**The agent initially "decided" to keep the local copy and not adopt. That was
not its call.** A gap between a consumer and a DS component goes through the
lobby and comes back as a variant; the DS is the one place the shape gets
settled, and every other consumer benefits. Hence this ticket.

## What stays here

- `src/editor/shell/ShortcutsOverlay.jsx` — live until the variant ships.
- **On ship: adopt.** Delete the local overlay, feed `shortcutsBySection()`
  into the DS component, keep the `kol:show-shortcuts` window event as the
  local open/close channel (the DS component is display-only and takes
  `onClose` — the consumer owns the state).

**Remainder here:** none — adopted 2026-08-15, see below. Returned as: waiting on the variant.

## ✅ RETURNED + ADOPTED — 2026-08-15 · kol-shell@0.4.0

`ShortcutsOverlay` now takes a sectioned array as well as the flat one,
detected on shape. The flat form renders exactly as before, so no other
consumer moved.

Adopted here the same run: `src/editor/shell/ShortcutsOverlay.jsx` went from
99 lines to a ~30-line **adapter** — it owns the open state and the
`kol:show-shortcuts` window-event channel, maps `shortcutsBySection()` into the
DS shape, and renders the DS panel. Its own Esc listener was dropped: the DS
panel owns Esc, and a second one would call `onClose` twice. The original is in
`_tmp/2026-08-15-shortcuts-overlay-local/` with a WHY.

**Verified in a browser, not just compiled.** `S` opens it; all six sections
render (Edit · Selection · Layer · Tools · View · Color); the section wrapper
computes to `display: contents`; the heading resolves to `gridColumn: 1 / -1`
and its box (395px) matches the grid's full content width (445 − 48 padding).

Fixed by the swap, unasked: the local file's section titles used
`uppercase tracking-widest`, against the DS no-`text-transform` law.

**Not carried over** — the DS panel has no titled header row, no explicit close
button and no `<kbd>` chips. If those are wanted they are a new ticket against
kol-shell, not a reason to restore the local file.

**Remainder here:** none. Build green.
