# CanvasViewCommands

**Filed:** 2026-10-13 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/CanvasViewCommands.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-13 — kol-component 0.258.0, adopted 2026-10-14

`PanZoomViewport` can't be asked to fit from outside (⌘0's reset is key-only), can't fit a rect (To Width / To Selection), and `ZOOM_MAX = 8` is relative to the fitted frame, so 800% real is out of reach. Ask: `kol:zoom-fit { to }`, the cap in real terms, optionally `kol:zoom-to { scale }`. Plan 33 § 3.

## What this repo does on the return
bump; To Fit / To Width / To Selection are already wired to `kol:zoom-fit`; walk 800%.

**Remainder here:** none yet — on the return: bump + walk.

## ✅ RETURNED — 2026-10-13 · kol-component@0.258.0

PanZoomViewport takes two new window events beside kol:zoom-at: `kol:zoom-fit` { to: 'frame' (default, ⌘0's view) | 'width' | { x, y, w, h } in frame px, 24px margin, centred } and `kol:zoom-to` { scale } (real, 1 = 100%, about the centre). Zoom clamps are now real: 2%–3200% of screen px per frame px (fit = [data-canvas-frame].offsetWidth / 1080), on every path — keys, wheel, zoom-at. ⌘0 / ⌘= / ⌘- and the wheel otherwise unchanged. Verified on the showcase canvas (540×418 viewport, rest 0.343 real): 'width' → frame 540 wide at x 0; rect 100,100 200×200 → 370² at (85, 24), centred with the 24 margin; zoom-to 8 → exactly 8.000 real; 40× zoom-at 1.5 caps at 32.000 real; zoom-fit {} → back to the rest view.

**Remainder here:** bump kol-component ^0.258.0; View › Zoom To Fit / To Width / To Selection go live; 800% via kol:zoom-to { scale: 8 } or your measure

## Adopted — 2026-10-14

kol-component 0.258.0 pinned. `zoomToReal` now dispatches `kol:zoom-to { scale }` (the local measure retired); walked on `vite preview` (`_tmp/2026-10-14-plans-33-34-walk/`): fitted reads 64%, ⌘1–⌘4 read 100 / 200 / 400 / 800, ⌘0 back to 64%, View › Zoom › To Width fills the viewport (frame 916 = viewport 916).

**Remainder here:** none.
