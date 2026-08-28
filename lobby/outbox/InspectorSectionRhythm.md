# InspectorSectionRhythm — Section needs the divider + density it is faked around

**Filed:** 2026-08-15 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/InspectorSectionRhythm.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 CLOSED + ADOPTED 2026-08-15 — shipped in kol-ds-ui, published to npm, and adopted here. Remainder: none.

## Why it went there

The user's ruling: "you dont need to maintain labs css locally, what is the
point? what is there that isnt answered in kol ui?" Section spacing and
dividers are component anatomy, not consumer styling.

## What stays here

- `.kol-params-section` hook class + the gap/hairline rules in `labs.css`.
- **On ship: adopt.** Delete the block, drop the hook class, pass the prop.

## ✅ RETURNED — 2026-08-15 · kol-component@0.46.0 + kol-theme@0.43.0

`Section` gained a `divided` prop; the hairline is
`.kol-section--divided + .kol-section--divided` (border-top `--kol-fg-08`,
padding-top 20px). The rule sits on the ADJACENT PAIR, so the first section in
a stack never carries a stray top border and no consumer needs
`:not(:first-child)` — that pair selector is exactly what cannot be expressed
as a utility class, which is why every consumer had to invent a hook class.

`density` was deliberately NOT built: this repo's `.kol-params-section
{ gap: 0.5rem }` is exactly Section's shipped `gap-2` — a no-op override, so
there is no second density to name until a real one appears.

**Remainder here:** none — adopted 2026-08-15, see below. Returned as: bump, then delete the `.kol-params-section` block and the
hook class from `labs.css`. ⚠️ NOT YET PUBLISHABLE — see the note below.

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

`params/AutoControls.jsx` passes `divided`; the `.kol-params-section` hook
class and both its rules are gone from `labs.css`.

**Correction to the resolution above.** It claimed the `gap: 0.5rem` override
was a no-op against Section's `gap-2`. It was not — the call site also passed
`gap-4` in `className`, which out-ordered Section's own `gap-2`, and the local
rule was out-specifying THAT back to 8px. Dropping the hook class alone would
have silently widened every param section to 16px. `gap-4` was removed with
it, so Section's default 8px now applies with nothing overriding anything.
Read the render, not the default.

**Remainder here:** none. Build clean.
