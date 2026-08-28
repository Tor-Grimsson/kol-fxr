# FocusRingsInConsumers — showcase has none, consumer gets them

**Filed:** 2026-08-15 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/FocusRingsInConsumers.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 CLOSED + ADOPTED 2026-08-15 — shipped in kol-ds-ui, published to npm, and adopted here. Remainder: none.

## What stays here

- `outline: none !important` in `src/editor/styles/kol-editor.css` —
  **declared stopgap**, delete on adopt.

## ✅ RETURNED — 2026-08-15 · kol-theme@0.43.0

`--kol-focus-ring-quiet` minted; the pair is now a real off switch.

**Two premises in this ticket were wrong, and that matters more than the fix.**
(1) The showcase does NOT suppress focus rings — `showcase/src/index.css` is its
only stylesheet and holds zero `outline` and zero `:focus-visible` rules, so
there was never anything to port. (2) There is no `outline: none !important`
block here — the real rule is narrow and unflagged: plain `outline: none` on
`input`/`textarea` `:focus-visible` inside `.kol-editor-shell`.

The actual defect: `--kol-focus-ring` existed but only half the rules read it.
`.kol-btn` / `.toggle-switch` / `.focus-visible:ring-focus` read the token; the
nav rails and `.kol-seg-cell` hardcoded their colours. Setting it transparent
killed button rings and kept rail rings — a half-working opt-out, which is
exactly why this repo ended up writing local CSS.

Now `--kol-focus-ring` is the loud 2px ring and `--kol-focus-ring-quiet` the
1px inset one. EVERY focus rule in the theme reads one of the two; no
hardcoded focus colours remain. Defaults reproduce today's values, so nothing
moved visually.

**NB nothing in this system is blue.** `--kol-accent-primary` resolves to
`--kol-surface-on-primary` (#fafafa dark / #121215 light) — every ring was
always white; they differ in weight, not hue.

**Remainder here:** none — adopted 2026-08-15, see below. Returned as: bump, delete the `input`/`textarea` outline rule. Set both
tokens to `transparent` for a genuine system-wide off. ⚠️ NOT YET PUBLISHABLE.

---

**⚠️ PUBLISH STATUS — do not adopt yet.** The versions cited above are bumped
in kol-ds-ui but **not published**. npm still serves kol-component@0.45.0,
kol-theme@0.42.2, kol-framework@0.20.1. Bumping here or deleting a stopgap
before those land on the registry breaks this repo. Publishing is the user's
call, not the agent's.

**⚠️ NOT RENDERED.** 20 gates and a name-contract check pass; nothing was seen
in a browser. No one has watched a right-hand rail drag or the placeholder gate
toggle. First adoption is the real test.

## ✅ ADOPTED HERE — 2026-08-15 — with the remainder REJECTED

The DS pair is in via the theme bump. Nothing else was needed.

**THE REMAINDER WAS WRONG AND IS NOT ACTIONED.** It said to delete the
`input`/`textarea` `outline: none` rule in `styles/kol-editor.css`. That rule
suppresses the ring the BROWSER draws on a native `<input>` — an element the
DS never styled and therefore cannot switch off. `--kol-focus-ring` /
`--kol-focus-ring-quiet` govern rings the DESIGN SYSTEM draws. Deleting it
would have restored the Firefox double outline it was written to kill. The
two are unrelated mechanisms sharing a symptom, and the rule stays, with that
reasoning written into the CSS so it is not re-deleted next time.

**Remainder here:** none. Build clean.
