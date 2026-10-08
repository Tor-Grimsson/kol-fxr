# Plan — Left for a local session

**Status:** PARKED. Items a cloud session cannot finish — each needs a change in kol-ds-ui (a lobby ticket, filed locally).
**Origin:** user, 2026-10-08, cloud session: *"if you cant do it because we are not doing lobby tickets in a cloud session, then just make a note of it … and park it"*

## 1. Timeline counter reads a fraction, not time

- **Seen:** the dock's counter reads `0.82` while the transport says `Loop / 4s` — it looks like a timer and is a 0–1 loop fraction.
- **Cause:** kol-component `organisms/TimelineDock.jsx:49` prints `t.toFixed(2)`; the dock is never given the loop length.
- **Ask:** an optional `seconds` prop on `TimelineDock` — counter reads `3.28 / 4.00 s`, key tooltips and the key editor's `key @` in seconds. Absent → today's fraction, so no other consumer moves.
- **Here after the bump:** pass `transport` loop seconds from `src/editor/params/TimelineDock.jsx`.

## 2. Timeline lanes: resizable height and curve editing

- **Seen:** lanes are fixed-height; a key's easing is one of six presets in the selected-key menu, no curve view.
- **Ask:** drag-to-resize the dock height, and a curve view per lane (AE / Resolve style) — bezier handles on a key, with Linear · Ease in · Ease out · Ease in-out · Custom. The resolver already reads an array easing (`Array.isArray(key.easing)` in the dock's key editor) — confirm it is a cubic-bezier before speccing.
