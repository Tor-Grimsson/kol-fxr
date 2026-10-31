# SignedOutStageStill — receipt

**Filed:** 2026-10-30 → kol-ds-ui `lobby/inbox/SignedOutStageStill.md` (plan 44 W6, 6.1 + 6.2)
**State:** 🔵 `filed`
**Asked:** HubHome's sign-in column overlays the stage and never resizes it; kol-growth / GrowthLineStage get fxr's settle fixes (`bleed` + freeze, `step(zone)`, finished once, a resting pointer is not a force).
**Remainder here:** none — fxr's `src/components/HomeStage.jsx` sizes itself to the signed-out Home and holds the fixes already.

## ✅ RETURNED — 2026-10-30 · kol-shell@0.91.2 · kol-component@0.319.1 · kol-growth@0.2.0

HubHome's stage stays absolute inset-0 with sign-in open or closed — the column overlays, the grey layer fades, nothing resizes (kol-shell 0.91.2). kol-growth 0.2.0 carries fxr's fixed engine verbatim: bleed (default 0) with off-frame nodes frozen and the hash spanning the bled frame, and step(zone). GrowthLineStage (kol-component 0.319.1): full flag set once at the cap, zone-only steps after it (r 0.36·min(w,h)), poke/wake only on a >0.3px move or a press, bleed 48 by default. Verified on Playwright 1440×900: studio-hub's stage box held 0/1440 closed, mid-slide and open; apps/growth's finished orb with a resting pointer was pixel-identical over 1.5s.

**Remainder here:** bump kol-shell 0.91.2 · kol-component 0.319.1 · kol-growth 0.2.0

## Follow-up — 2026-10-30

The returned engine still jittered and the re-centre was dropped by this ticket's own wrong ask. On the user's instruction this session built the fix in kol-ds-ui's source — kol-growth 0.3.0 (`settle`), kol-component 0.319.2, kol-shell 0.91.3 (stage slides to the grey) — **not published**. fxr's own HomeStage already holds the same engine and behaviour.

**Remainder here:** none until those three are published; then fxr may adopt kol-growth and retire its local engine (not asked).
