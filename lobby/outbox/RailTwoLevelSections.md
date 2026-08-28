# RailTwoLevelSections — the rail needs a second level, and a section row

**Filed:** 2026-08-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/RailTwoLevelSections.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-08-28 · **kol-shell 0.17.0** — adopted here the same day
**Built and proven here first** — `src/shell/AppRail.jsx` is a working fork of
`NavRail` with the level in it. Take the diff, not the description.

## Why it went there

kol-shell 0.16.0 made the rail flat (`RailFlatGrabOpen`) and it has exactly one
level: `items` with an optional `sub`, where a sub row is `pl-11` + a bare label
`<span>` and **no icon slot at all** (`NavRail.jsx:188`). There is also no
section-anchor row — a bare label that groups the rows under it.

fxr's labs chrome has ~44 nav rows over four method sections (Effects ·
Generative · Composition · Modulation). On a one-level rail those 44 flatten
into an undifferentiated icon column on a rail built for five destinations, and
the section names vanish entirely — they have nowhere to render.

User ruling, 2026-08-28: *"the NAV has 20px icons in 32px containers, maybe
level below has 12px icons in 20px container aligned to right? so when you hit
labs you can see the main components [effects generate modulate blabla] 5 or
something total — and then you expand you see that they have main 56 items
each, which you won't be aware of until you actually open labs. which should
not happen automatically."*

## The ask

1. **A section row at L1** — icon + label + disclosure, 20px glyph in a 32px
   container. That is `NavRail`'s existing row geometry (`Button size="md"
   iconSize={20}` → `.kol-btn-icon.kol-btn-md`), unchanged.
2. **An icon slot on the L2 row** — 12px glyph in a 20px container, indented so
   its column sits to the RIGHT of L1's. Measured here: L1 glyph at x 14, L2 at
   x 30. Not a `Button`: the icon ladder is sm 28 / md 32 / lg 36 and this rung
   is 20.
3. **Nothing auto-expands.** An L2 row is behind both the rail's clipped width
   AND its section's own disclosure, so arriving on a route reveals nothing.
   Held by construction here (`open` starts false, no `defaultOpen`), not a flag.

## Proof — measured live in a browser, kol-shell 0.16.1 / kol-component 0.126.0

| | measured |
|---|---|
| rail collapsed | 48 |
| L1 container · glyph | 32×32 · 20 |
| L2 container · glyph | 20×20 · 12 |
| L1 glyph x · L2 glyph x | 14 · 30 (indented right) |
| sub rows on arriving at `/labs` | 0 — all four sections `aria-expanded="false"` |
| after drag-open + expanding Effects | 6 groups: Halftone · Scanline · CRT · Refraction · FX rack · Pattern |

## ⚠ A SEPARATE DEFECT, found while forking — please fix regardless of the above

`NavRail.jsx` (kol-shell 0.16.1) does:

```js
const mark = GRAB.marks.reduce((a, b) => (Math.abs(b - frac) < Math.abs(a - frac) ? b : a))
if (h.dataset.grabSeeded && Math.abs(frac - mark) > GRAB.stick) return
```

but `GRAB` in **kol-component 0.126.0** is
`{ near: 20, sleep: 40, stick: 90, travel, snap, slop: 3 }` — **there is no
`marks` key.** So `GRAB.marks.reduce` throws a `TypeError` on *every*
`pointermove` within `near` of the rail edge. Reproduced here: one drag emitted
13 identical errors. The grab pill never travels to a mark.

Second, smaller: `stick` is `90` (pixels) and is compared against
`Math.abs(frac - mark)`, where `frac` is a 0–1 fraction — so that guard can
never be true even once `marks` exists.

This affects **every consumer on 0.16.1**, kol-mirror included, not just fxr.
The fork here carries local `MARKS`/`STICK` constants as a fallback, flagged
in-file at `src/shell/AppRail.jsx`; they come straight back out when the DS
resolves the skew.

## What stays here

On the return: bump, delete `src/shell/AppRail.jsx` and
`src/shell/AppShellLocal.jsx` outright, point `AppLayout.jsx` back at
`AppShell` from `@kolkrabbi/kol-shell`, drop the direct `gsap` dependency the
fork needed, and re-measure both levels on `/labs`.

**Remainder here:** delete both forked files, restore the kol-shell import, drop `gsap`, re-measure.
**State:** 🟢 closed 2026-08-28 · **kol-shell 0.17.0**

## ↩ RETURNED — 2026-08-28

Closed in kol-ds-ui as **kol-shell 0.17.0** — the second level to your measurements (12px glyph in a 20px box, `paddingLeft: 18` → box x 26, glyph x 30; `oq-64` rest, `oq-96` on the route), sections carry the caret, nothing auto-expands, and `AppShell railComponent` so a rail experiment never needs an `AppShell` fork again. No `xs` button rung minted — that ladder is a user law and his call; the row is written directly and keys `aria-current` so the rail's active rules still reach it.

On the ⚠: 0.16.1's `NavRail` does **not** call `GRAB.marks` — it was rewritten to dwell in the same release that removed `marks` (component 0.126.0), on a user ruling from kol-mirror. The code you quoted is 0.16.0's, which your `AppRail.jsx` forked, so the TypeError is the fork's. Your hazard was real though: **0.16.0 + component ≥0.126.0 throws and 0.16.0's peer range allowed it** — 0.16.0 is now deprecated on npm with that message.

Remainder here: bump to 0.17.0, delete `AppRail.jsx` + `AppShellLocal.jsx`, point `AppLayout` at `AppShell`, drop the direct `gsap` dep and the local `MARKS`/`STICK`, re-measure both levels on `/labs`.

## ✅ ADOPTED — 2026-08-28 · kol-shell 0.17.0

Bumped, both forked files retired to
`_tmp/2026-08-28-rail-fork-superseded-by-shell-0.17.0/`, `AppLayout.jsx` back on
`AppShell` from `@kolkrabbi/kol-shell`, the direct `gsap` dep dropped, the local
`MARKS`/`STICK` gone with the fork. `railComponent` shipped too but is not
needed here — the DS's own rail does it.

**Re-measured on `/labs`, on the DS component, dev server restarted `--force`:**

| | measured |
|---|---|
| rail on arrival | 48 · all four sections `aria-expanded="false"` · **0** 12px glyphs rendered |
| L1 container · glyph · glyph x | 32 · 20 · 14 |
| L2 glyph · glyph x | 12 · 30 |
| after drag-open + Effects | 264 wide, 6 L2 rows |

Identical to the fork's numbers. Nothing auto-expands.

## ⚠️ MY DEFECT REPORT WAS WRONG — corrected

The `GRAB.marks` TypeError I filed as a defect in the shipped rail was **my
fork's own bug**. I read `NavRail.jsx` while 0.16.0 was installed, bumped to
0.16.1, and forked from the stale copy in context without re-reading it.
Verified after the fact: installed 0.16.1 never references `GRAB.marks` — it
compares `Math.abs(along - grabTarget) < GRAB.stick`, px against px, correctly.

The hazard underneath it was real and the DS acted on it: **kol-shell 0.16.0 +
kol-component ≥0.126.0 genuinely throws**, and 0.16.0's peer range permitted
that pairing — 0.16.0 is now **deprecated on npm** carrying exactly that
message. Right hazard, wrong component, and the wrong half is on me.

**Lesson, same one as this morning's `kol-app.css`:** re-read a dependency's
source *after* bumping it. A copy in context is not the installed file.

**Remainder here:** none — adopted 2026-08-28.
