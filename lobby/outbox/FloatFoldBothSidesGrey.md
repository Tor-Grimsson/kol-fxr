# FloatFoldBothSidesGrey — receipt

**Filed:** 2026-11-03 → kol-ds-ui `lobby/inbox/FloatFoldBothSidesGrey.md`
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/FloatFoldBothSidesGrey.md`
**State:** 🔵 `filed`
**Asked:** opt-in fold props: `foldSide="swipe"` (fold to the side the swipe went) and `foldTone="handle"` (the grey edge handle) on TabsRow and AppFloatNav, plus `floats.fold` on AppShell so fxr can reach the top float.
**Remainder here:** bump kol-shell + kol-component when it returns; pass `floats: { …, fold: { side: 'swipe', tone: 'handle' } }` in `src/AppLayout.jsx`; check both floats fold left and right, with a grey tab.


## ✅ CLOSED in kol-ds-ui — 2026-11-03

Shipped **kol-component 0.333.0** and **kol-shell 0.100.0**. TabsRow `foldSide="swipe"` folds to the edge the swipe went toward; `foldTone="handle"` is the grey edge handle (`--kol-oq-24`, `--kol-oq-96` chevron). AppFloatNav forwards both on the nav and the transport; AppShell `floats.fold = { side, tone }` sets both floats. Unset, nothing changes. Checked at 390×844, light and dark, on studio-hub's Phone nav › Floats: both floats fold left and right by swipe, on the grey tab; unset unchanged. Note: kol-shell 0.100.0 includes 0.99.4 (the Rail overlays the stage), which only applies when `floats.rail` is passed.
Resolution: `kol-ds-ui/lobby/done/FloatFoldBothSidesGrey.md`.

**Remainder here:** bump kol-shell 0.100.0 + kol-component 0.333.0; pass `floats: { …, fold: { side: 'swipe', tone: 'handle' } }` in `src/AppLayout.jsx`; check both floats fold left and right, with a grey tab.

**Adopted 2026-11-03:** kol-shell 0.100.0 · kol-component 0.333.0; `floats.fold = { side: "swipe", tone: "handle" }` in `src/AppLayout.jsx`. Checked at 390×844: the top float and the transport each fold left and right by swipe, onto the grey tab. **Remainder here:** none.
