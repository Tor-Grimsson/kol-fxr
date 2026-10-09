# Plan — The gaps closed: everything the gap matrix still lists

**Status:** BUILT 2026-10-09 (local, one `/kol-goal` run). Every section walked on `vite preview` at 1600 and 1280, 0 console errors; image · loop · kinetic graded (`audit/2026-10-10-H-spec-grade.md`), six misses found and fixed in the run; `I-gaps.md` reads present on every row — the three DS-owned ones (pipette gate, zoom chip, row right-click) closed from this repo with stand-ins plan 17 #1 · #5 · #6 retire. Masks are top-level and ignore the mask's rotation (`compose/masks.js` ponytail); DS follow-ups → plan 17 #13–#15.
**Origin:** user, 2026-10-09, after plan 23: *"everythign was supposed to get made. make the friggin plan"*. Source: every `missing` / `partial` row in `.kol/llm-context/audit/2026-10-10-I-gaps.md`, plus the states the grade (`H`) did not reach.

## 0. Prerequisites
- Plan 23 built (spec R1–R9 hold). Same laws: KOL components first, `size={cs}`, the rail row (`SettingsRow` + `RAIL_LABEL_W`), the eyebrow heading, Tailwind first, no DS round trips (DS gaps → plan 17).
- Verification is the built bundle (`vite preview`), never a green build.

## 1. Pen: insert a point on a segment
- In node-edit (and with the Pen over a selected path), hovering a segment shows a `+` pen cursor; a click splits the segment there (`nearestSegmentT` + `splitSegment`, already in path-math).

## 2. Per-corner radius
- Rect: a link toggle beside Corner radius; unlinked, four fields (TL · TR · BR · BL). Render, export, booleans and Convert to path read them through `shape-math` (one geometry source).

## 3. Shear / skew
- `skewX` / `skewY` on positioned layers: an Inspector Transform field pair, the renderer's transform, the SVG export's transform.

## 4. Transform origin (anchor selector)
- A 9-point anchor in the Transform pane (Affinity). W / H / rotation typed in the Inspector resize and rotate about it instead of the top-left / centre.

## 5. Vector effects: Twist · Pucker & Bloat · Warp
- Three more in Parameters › Vector effects, on the node model in `vectorEffects.js`: Twist (angle, rotating points by distance from the centre), Pucker & Bloat (−100…100, anchors toward/away from the centre, handles the other way), Warp (Arc · Bulge · Wave · Flag, bend %).

## 6. History panel
- A History tab in the left rail's footer pane (Transport · Output · File · History): the undo stack as rows, click a row to step back or forward to it.

## 7. Navigator
- A Navigator tab beside History: a live thumbnail of the frame with the visible viewport as a rectangle; drag it to pan.

## 8. Masks
- Layer › Use as mask: the layer above masks the one below (Figma's model), drawn as an SVG `<mask>` / clip in render and export; the Layers rows show the masked pair; Release mask undoes it.

## 9. Verification
- Grade the states `H` did not reach — image, loop, kinetic — and every new control on the spec rules.
- Walk each item above on `vite preview` at 1600 and 1280, 0 console errors; update `I-gaps.md` so no row reads missing or partial except the DS-owned ones (plan 17: eyedropper gate, zoom chip, layer-row right-click).
