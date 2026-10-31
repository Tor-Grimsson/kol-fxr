# BezierPathEditor — receipt

**Filed:** 2026-10-31 → kol-ds-ui `lobby/inbox/BezierPathEditor.md`
**State:** 🟢 `closed` — adopted 2026-10-31 at kol-component 0.330.0, walked
**Asked:** a 2D bezier node editor: nodes with in/out handles, drag, add (double-click), delete; a value of points (plan 51 4.4).
**Remainder here:** when it returns, swap fxr's local piece for it and retire the local one to `_tmp/`.

## 🟠 RETURNED — 2026-10-31 · built, awaiting publish

`BezierPathEditor`, a new atom (kol-component, unreleased): `value: [{ x, y, hl?, hr? }]` normalised 0–1, handles as offsets from the anchor (a missing one is a corner), `onChange(points)`, `closed`, `aspect`, `size` xs · sm · md, `minPoints`. Drag anchors and handles; double-click splits the nearest segment shape-preserving (`pathMath` `splitSegment`); alt-click deletes. Ground the control's, path oq-80, leashes oq-24, handles oq-48, anchors the accent; no border. Constraints like fxr ProfileEditor's locked, y-sharing ends are the consumer's, applied in `onChange`.

Not on npm yet — kol-component needs a minor publish; synced: 2026-10-31 from kol-ds-ui `lobby/INDEX.md`.

**Remainder here:** bump kol-component when published; ProfileEditor and CustomPathPoints render `BezierPathEditor` (ProfileEditor maps its y −1…1 / `hlx`… to the 0–1 value and keeps its end rule in `onChange`; CustomPathPoints maps `[x, y]` pairs to `{ x, y }` nodes), retire the local SVG to `_tmp/`.


## ✅ RETURNED — 2026-10-31

🟢 `closed` in **kol-ds-ui**: `BezierPathEditor` (atom) exported in @kolkrabbi/kol-component@0.330.0.

**Remainder here:** bump kol-component to ≥0.330.0; ProfileEditor and CustomPathPoints render `BezierPathEditor` (ProfileEditor maps its y −1…1 / `hlx`… to the 0–1 value and keeps its end rule in `onChange`; CustomPathPoints maps `[x, y]` pairs to `{ x, y }` nodes), retire the local SVG to `_tmp/`.

**Adopted:** ProfileEditor and Kinetic path points render it; the local SVG editors in `_tmp/2026-10-31-beziereditor/`.
