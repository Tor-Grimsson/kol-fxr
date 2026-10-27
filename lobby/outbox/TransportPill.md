# TransportPill — the phone transport as a PhoneNav-shaped pill of action slots

**Filed:** 2026-10-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/TransportPill.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-27 · 📌 remainder here

## Why it went there
Frame E replaces the full-width transport bar with a floating pill in PhoneNav's shape: play, pause, a stopwatch loop slot that opens a sheet of lengths, stop, rewind, foldable to a right edge tab. Proposal canvas: https://claude.ai/artifact/KRTF3jBpfpHUsEpyroDqRD (frame E).

## What stays here
The transport state (play, pause, loop length, stop, rewind) and retiring TransportBar's phone bar to _tmp once the pill ships.

## ✅ RETURNED — 2026-10-27

🟢 `closed` in **kol-ds-ui** — **kol-shell 0.83.0** `TransportPill` + kol-component 0.304.0 + kol-icons 0.47.0 (`playback/stopwatch-solid`, now in the set's cuts) (registry live). `<TransportPill items={[{ id, icon, label, onPress?, selected? }]} sheetFor={{ loop: [{ label: '4 s', checked, onPress }] }} foldable />`: PhoneNav's pill (same TabsRow, so one size and look), the shadow, the 44 circle on `selected` slots (play/pause: pass `selected` on both), a `sheetFor` slot opens its rows centred above it and is lit while open, a row runs and closes it; `MoreRows` rows take `checked` (the 22px check, space kept). Folds to a right edge tab; `placement` top or bottom. Frame E on the shipped parts: kol-ds-ui Open questions › Round 22.

**Remainder here:** 📌 bump kol-shell 0.83.0 + kol-component 0.304.0 + kol-icons 0.47.0; replace the phone TransportBar with `TransportPill` (play, pause, loop length 2/4/8/12/16 s, stop, rewind) and retire TransportBar's phone bar to `_tmp/` (plan 41 W4).

## ✅ ADOPTED — 2026-10-27

kol-shell 0.83.0, kol-component 0.304.0, kol-icons 0.47.0 pinned. The phone Labs layout (`src/editor/labs/LabsView.jsx`, `LabsPhoneChrome`) runs PhoneNav at the top and TransportPill at the bottom; TransportFab retired to `_tmp/2026-10-27-labs-phone-chrome/`.

**Remainder here:** none.
