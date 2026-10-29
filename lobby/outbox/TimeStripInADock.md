# TimeStripInADock — `TimeStrip` in flow, spanning the loop, with a label gutter, so fxr's dock can draw its ruler from it

**Filed:** 2026-10-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/TimeStripInADock.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-28

## Why it went there
The strip half of `TransportFromHardware`: `TimeStrip` is absolute-positioned and spans ≥ 4 s; fxr's dock is in flow and its lanes span one loop.

## What stays here
Swapping `ScrubRuler` for the DS part on the bump; the lanes stay fxr's.

## ✅ CLOSED in kol-ds-ui — 2026-10-28

Shipped **kol-hardware 0.9.0**: `<TimeStrip transport={t} framed={false} span="loop" gutter={labelWidth}>{lanes}</TimeStrip>`.
- `framed={false}` sits in flow with no border, padding, background or z; your dock frames it.
- `span="loop"` is the loop window exactly, so a key at `t` 0..1 maps to the full width; function children get `{ now, span, origin, state }`.
- `gutter` holds the readout; ruler and bar start after it; children render full width, so your lanes' label column lines up.
Resolution: `kol-ds-ui/lobby/done/TimeStripInADock.md`.

**Remainder here:** bump kol-hardware 0.9.0; swap `ScrubRuler` in `TimelineDock` for `TimeStrip` docked; check it at a 2 s and an 8 s loop.
