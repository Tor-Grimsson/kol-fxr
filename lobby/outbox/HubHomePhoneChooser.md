# HubHomePhoneChooser — HubHome's phone doors as fxr's old chooser: a "Select chrome" eyebrow and full-width stacked buttons with the icon on both sides, no card, in place of the 2 × 2 grid

**Filed:** 2026-10-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HubHomePhoneChooser.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-28 · adopted 2026-10-28

## Why it went there
P2 (user, 2026-10-28): *"where is the original modal we had on mobile? I want taht instead of this 2x2 bullshit"* → the original card (screenshot: "SELECT CHROME / FXR", four stacked buttons, icon left and right) → *"not with the padded container"*. Plan 43.

## What stays here
Adopting it on the bump (plan 43).


## ✅ CLOSED in kol-ds-ui — 2026-10-28

Shipped kol-shell 0.85.0 · kol-component 0.309.0. `touch.label` as the eyebrow, then one full-width `tone="primary" size="lg"` button per door, the icon on both ends, the label centred — your `EntryScreen` class for class, no card; the 2 × 2 is gone. Resolution: `kol-ds-ui/lobby/done/HubHomePhoneChooser.md`.

**Remainder here:** 📌 bump; pass `touch: { label: 'Select chrome', doors }`.


## ✅ ADOPTED — 2026-10-28

kol-shell 0.85.0 · kol-component 0.309.0 pinned. `touch: { label: 'Select chrome', doors }` in `AppLayout.jsx`; walked at 390: the eyebrow, then Generate, Effects, Labs, Morph stacked full width, icon both ends.

**Remainder here:** none.
