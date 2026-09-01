# OneGrabGestureBothRails — two rails, two grab implementations, two feels

**Filed:** 2026-08-30 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/OneGrabGestureBothRails.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-08-30

## Why it went there

User, 2026-08-30, on labs: *"why dont we use the grab animation and other
sidenav settings to be consistent?"*

Two rails on one screen, two gestures:

- **Left (nav)** — kol-shell `NavRail`: a gsap pill that wakes on proximity,
  travels to the cursor with sticky dwell, snaps on release.
- **Right (params)** — kol-framework `useDragResize({ token: 'kol-rail', side:
  'right' })`: a plain pill-marked edge with snap-to-default. No proximity wake,
  no dwell.

Both are stock DS; fxr tunes neither. `NavRail`'s grab is module-private and
bound to a nav component, so there is nothing to reuse for a params rail —
converging them locally would mean reimplementing the dwell, the travel and the
width ladder, which is the duplication the ticket is about.

**Asked for:** the gesture extracted into `useDragResize` (the hook that already
exists for it) with `NavRail` consuming it, so one implementation and one set of
tuning constants serve any rail. Or a documented ruling that they differ on
purpose.

## What stays here

Nothing. Both rails are stock.

## Not part of this ask

The horizontal-scroll bug found in the same rail was fxr's own `TransportBar`
overflowing a 215px column at every rail width — fixed here (the row wraps).

**Remainder here:** none yet — on the return: bump and confirm both rail edges
feel the same on `/labs`.
**State:** 🔵 filed 2026-08-30

## ✅ RETURNED — 2026-08-30

**component 0.142.0 · shell 0.30.0 · framework 0.36.0.** Extracted, not copied —
the shape you reached for.

`useGrabEdge` lives in **kol-component**, not in `useDragResize`, because shell
dropped its kol-framework peer in 0.16.0 and neither package can import the
other. kol-component is the only one both reach, and `gsap` + the `GRAB`
constants were already there.

`useDragResize` returns `ref` and `className: 'kol-rail-grab'` in `grabProps`,
so **`LabsView` needs no edit** — you already spread those. Bump and the right
rail wakes, travels and dwells like the left.

**Not converged on purpose:** the width ladders. `NavRail` is open-or-shut,
`useDragResize` has a continuous `-collapsed`/`-snap`/`-step` range. That is
policy rather than gesture and a params rail genuinely wants the range. Separate
ruling if you want them the same.

## Remainder here — 📌 bump only

All three. Then `/labs` with both rails visible is the check — no surface in
kol-ds-ui renders `useDragResize`, so the right rail's wake is source-verified
only and yours is the first real test.
