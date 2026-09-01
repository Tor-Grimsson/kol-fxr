# RailSectionPressOpensRail — a section row is a dead press on the closed rail

**Filed:** 2026-08-30 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/RailSectionPressOpensRail.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-08-30

## Why it went there

User, 2026-08-30: *"if I press effects from collapsed nav it should maybe open?
currently pressing it does nothing."*

On the closed rail a section row has no working control at all: the icon calls
`onNavigate(path)` and a section is not a destination, while the disclosure
caret is a separate button that the 48px clip puts out of reach. Open, the caret
works fine — the defect is closed-state only, which is the default state.

## Why it could not be fixed here

`railOpen` is `NavRail`'s own `useState(false)`, set only by `useRailDrag`'s
`snapTo` on pointer events on the grab strip. No prop, no callback, no handle.

Writing `--kol-shell-rail-width` from outside is not a workaround — the width
animates open but `railOpen` stays `false` and the L2 rows render behind
`railOpen && open && …`, so it produces a **wide, empty rail**: worse than the
dead press. `openWidth()` also reads `--kol-sidenav-w`, so reimplementing the
snap locally would duplicate the ladder too.

**Asked for:** pressing a section row on the closed rail opens the rail and
expands that section — the 0.17.0 `SideNav` behaviour, in-component so no
consumer wires it by hand. Offered the alternative of an imperative seam if they
would rather it stayed the consumer's call.

## What stays here

Nothing. The section paths are `#rail/sec:*` sentinels with no dispatch entry,
and that is correct — a section has no action of its own.

**Remainder here:** none — adopted 2026-08-30, see below. Returned as: bump kol-shell 0.29.0, then press Effects on the collapsed rail.
**State:** 🟢 closed 2026-08-30 · **kol-shell 0.29.0** — adopted here the same day

## ✅ RETURNED — 2026-08-30

**kol-shell 0.29.0.** In-component, as you preferred — no prop, nothing to wire.

A section press on the closed rail snaps the rail open and expands that section.
Icon and label both. Open state unchanged.

`useRailDrag` hands `snapTo` out through a ref now, so the press reuses the real
snap and the `openWidth()` ladder. Your diagnosis was exactly right about why a
local fix was impossible — the width would animate while `railOpen` stayed
false, and the L2 rows render behind that flag.

## Remainder here — 📌 bump only

kol-shell 0.29.0. Then press Effects on the collapsed rail: it should open and
that section should be expanded, with the other three closed.

⚠️ Not screen-verified here — no surface in this repo renders a `NavRail` with
sections. Your labs rail is the first real test.


## ✅ ADOPTED — 2026-08-30 · kol-shell 0.29.0

Bump only, as the return said. In-component, no prop, nothing wired here.

**Screen-verified — we are the first surface to render a `NavRail` with
sections, which the return flagged as untested:**

| | result |
|---|---|
| press Effects on the closed rail | rail snaps **48 → 264**, Effects `aria-expanded="true"` |
| the other three | Generative · Composition · Modulation all still `false` |
| layout with the rail open | no horizontal overflow; canvas and right rail reflow correctly |

⚠️ **Worth knowing for the next verification:** the first attempt read as a
failure — rail stayed 48, nothing expanded — because the dev server predated the
bump and was serving the pre-bundled 0.28.0. Restarted with `--force` and it
worked first try. Same lesson AGENT-CONTEXT already carries: after any bump,
re-read from disk AND restart the server before trusting a browser check.

**Remainder here:** none — adopted 2026-08-30.
