# OriginPicker — receipt

**Filed:** 2026-10-31 → kol-ds-ui `lobby/inbox/OriginPicker.md`
**State:** 🟢 `closed` — adopted 2026-10-31 at kol-component 0.329.0, walked
**Asked:** a 3×3 transform-origin value picker (`value [x, y]`, radiogroup with arrow keys, on the control ramp). It is fxr's last hand-built control with no KOL counterpart (plan 49 9.2 audit).
**Remainder here:** none — swapped in `LayerInspector.jsx`; AnchorPicker retired to `_tmp/2026-10-31-anchorpicker/`.

## ✅ RETURNED — 2026-10-31 · kol-component@0.329.0

kol-component 0.329.0: OriginPicker, a new atom. value [x, y] (each 0, 0.5 or 1), onChange([x, y]), size xs · sm · md, tone, ariaLabel. A radiogroup of nine radios with roving tabindex: arrows move x / y and focus together (no wrap), one tab stop; each point named (left top … right bottom). Heights match the field at every size (xs 22 · sm 26 · md 32, light and dark); dots oq-24 at rest, oq-48 on hover, the selected dot in the accent; no border. Figma: component set OriginPicker (283:1047) on 03-atoms, size × value × state, bound to tone/bg, radius, oq and accent; Code Connect uploaded.

**Remainder here:** bump kol-component@0.329.0; LayerInspector's AnchorPicker → OriginPicker, retire AnchorPicker to _tmp/
