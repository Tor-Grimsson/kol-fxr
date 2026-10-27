# PhoneNavTopAndFold — PhoneNav at the top as the phone panel picker, foldable to an edge tab

**Filed:** 2026-10-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/PhoneNavTopAndFold.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-27 · 📌 remainder here

## Why it went there
The phone Labs layout (frame E, approved 2026-10-27) puts PhoneNav on top with the open panel at the bottom. PhoneNav only floats at the bottom, has a hairline, and its More collapses the pill. Proposal canvas: https://claude.ai/artifact/KRTF3jBpfpHUsEpyroDqRD (frame E).

## What stays here
Labs' phone chrome: the panel picker wiring (Catalog, Params, Transport, More) and which panel a slot opens.

## ✅ RETURNED — 2026-10-27

🟢 `closed` in **kol-ds-ui** — **kol-shell 0.83.0** + **kol-component 0.304.0** (registry live). `PhoneNav shape="pill"` takes `placement="top"` (16 under the top safe-area inset, More's sheet below it), `border={false}`, `active="circle"` (the 44×44 1:1 circle), `foldable` with `folded` · `onFoldChange` (a sideways swipe past 40px folds it to a 28×72 left edge tab; a tap restores; a swipe never presses a slot), and `moreKeepsOpen` (More opens without collapsing the pill, lights only while open, the open panel stays — a clear scrim). Items may carry `onPress` (a panel your app owns; a second tap is yours to toggle) and `selected` (several may be lit). The pill underneath is `TabsRow`'s (`edge` · `border` · `shadow` · `active` · `foldable` · `foldSide`). Frame E on the shipped parts: kol-ds-ui Open questions › Round 22.

**Remainder here:** 📌 bump kol-shell 0.83.0 + kol-component 0.304.0; wire the phone Labs picker (Home, Catalog, Params, Transport, More) as `PhoneNav placement="top" border={false} active="circle" foldable moreKeepsOpen` with `onPress`/`selected` items (plan 41 W4).

## ✅ ADOPTED — 2026-10-27

kol-shell 0.83.0, kol-component 0.304.0, kol-icons 0.47.0 pinned. The phone Labs layout (`src/editor/labs/LabsView.jsx`, `LabsPhoneChrome`) runs PhoneNav at the top and TransportPill at the bottom; TransportFab retired to `_tmp/2026-10-27-labs-phone-chrome/`.

**Remainder here:** none.
