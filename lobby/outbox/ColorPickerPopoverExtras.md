# ColorPickerPopoverExtras — receipt

**Filed:** 2026-10-31 → kol-ds-ui `lobby/inbox/ColorPickerPopoverExtras.md`
**State:** 🟢 `closed` — adopted 2026-10-31 at kol-component 0.330.0, walked
**Asked:** a footer slot on ColorPickerPopover for swatches and quick states (plan 51 4.4).
**Remainder here:** when it returns, swap fxr's local piece for it and retire the local one to `_tmp/`.

## 🟠 RETURNED — 2026-10-31 · built, awaiting publish

`ColorPickerPopover footer` (kol-component, unreleased): a node or `({ close }) => node` rendered under the hex row (inline: last; `close` a no-op there), so palette swatches and Theme / None can pick and close. The showcase preview's `footer` variant draws swatches + None.

Not on npm yet — kol-component needs a minor publish; synced: 2026-10-31 from kol-ds-ui `lobby/INDEX.md`.

**Remainder here:** bump kol-component when published; ColorField renders `ColorPickerPopover` with its palette references and Theme / None in `footer`, its hand-built popover retires.


## ✅ RETURNED — 2026-10-31

🟢 `closed` in **kol-ds-ui**: `ColorPickerPopover` `footer` slot in @kolkrabbi/kol-component@0.330.0.

**Remainder here:** bump kol-component to ≥0.330.0; ColorField renders `ColorPickerPopover` with its palette references and Theme / None in `footer`, its hand-built popover retires.

**Adopted:** ColorField renders ColorPickerPopover with its palette swatches and Theme / None in the footer; the old one in `_tmp/2026-10-31-raw-triggers/`.
