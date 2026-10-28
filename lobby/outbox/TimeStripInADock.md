# TimeStripInADock — `TimeStrip` in flow, spanning the loop, with a label gutter, so fxr's dock can draw its ruler from it

**Filed:** 2026-10-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/TimeStripInADock.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-10-28

## Why it went there
The strip half of `TransportFromHardware`: `TimeStrip` is absolute-positioned and spans ≥ 4 s; fxr's dock is in flow and its lanes span one loop.

## What stays here
Swapping `ScrubRuler` for the DS part on the bump; the lanes stay fxr's.
