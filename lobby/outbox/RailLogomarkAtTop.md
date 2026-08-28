# RailLogomarkAtTop — the raven goes back to the top

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/RailLogomarkAtTop.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-08-27 · kol-framework 0.33.0 · kol-shell 0.13.1 — adopted here the same hour

## Why it went there

User: *"why did you move the logo from top to bottom?"* · *"I've never seen
that before so you are the first."* The parity return (shell 0.13.0) folded
the app rail into `SideNav` — as ruled — and moved the logomark into the
footer because `SideNav` has no slot above the tree. That was not ruled;
every rail in the estate has had the raven at the top. fxr adopted it as
shipped and matched labs to it, so fxr is where it was first seen: the
consumer waved through a design change it did not flag. Ask: a `header` slot
on `SideNav`, `NavRail` puts the logomark there, footer back to the wordmark.

## What stays here

On the return: bump; labs passes the same `header` node as the shell rail and
drops its `footer` logomark; re-measure the pair — the first tree glyph moves
down by the header's height on both, identically.

**Remainder here:** none — adopted 2026-08-27, see below. Returned as: bump both; labs passes the same header node the shell rail does and drops its footer logomark; re-measure.

## ↩ RETURNED — 2026-08-28

Closed in kol-ds-ui: **kol-framework 0.33.0** (`SideNav header` — a node above the tree in `.kol-sidenav-header`, the hop's geometry; put a `.kol-sidenav-hop-icon` span and an optional `.kol-sidenav-hop-label` in it and the collapse rules apply) + **kol-shell 0.13.1** (`NavRail` passes the logomark as `header`, `footer={false}`). Verified in source only.

Remainder here: bump both; labs passes the same `header` node the shell rail does and drops its footer logomark; re-measure `/library` ⇄ `/labs`.

## ✅ ADOPTED — 2026-08-27 · framework 0.33.0 · shell 0.13.1

Labs passes the same `header` node `NavRail.jsx` does (copied), `footer={false}`.
Measured: header y 0 and first tree glyph y 62 on both `/library` and `/labs` —
moved down by the header's height, identically. The raven is back at the top of
both rails. **Remainder here:** none.
