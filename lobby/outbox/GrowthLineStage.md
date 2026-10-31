# GrowthLineStage — fxr's growing line as a KOL engine and stage, one engine

**Filed:** 2026-10-30 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/GrowthLineStage.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-30

## Why it went there
kol-atlas wants fxr's growing line on its home, growing into the Atlas hexagon. It lived only in fxr, so the only way in was a copy, and then two engines. KOL owns it now; fxr imports it back.

## ✅ RETURNED — 2026-10-30

🟢 `closed` in **kol-ds-ui** — **`@kolkrabbi/kol-growth` 0.1.0** (new engine package) · **`@kolkrabbi/kol-component` 0.319.0** (depends on kol-growth).
- **Engine** — `import { Growth, densityFrom, SIM_W, mulberry32, orbCanvas, pathCanvas } from '@kolkrabbi/kol-growth'`. `engine.js` is yours byte-for-byte; `mulberry32` is `src/loops/gl/rng.js`'s; `orbCanvas(aspect)` is `sourceCanvas('orb')`'s branch; `pathCanvas(d, aspect, fit)` is new (a bare path `d`, black on white, centred at `fit`).
- **Stage** — `import { GrowthLineStage } from '@kolkrabbi/kol-component'`. HomeStage's loop with props: `shape` (`'orb'` · path `d` · `(w, h) => canvas`), `fit` 0.6, `params` (orb `{6, 24, 1.4, 8}`), `cap` (`min(14000, w·h/112)`), `pointer` true, `seed`, `className` (ink from its `text-*` color). Clears to transparent, repaints on a theme flip, sleeps when grown, the pointer wakes it. Reduced motion draws the finished line once, no pointer force.
- **Your mark** — `vectorCanvas` stays yours: pass `shape={(w, h) => markCanvas}` with a canvas you built beforehand (the function is called sync, so await `vectorCanvas` first), `params={{ minGap: 4, maxGap: 48, contrast: 2, growth: 8 }}`.
- **Not carried** — transport / epoch keying, the editor params schema, the `?stage=logo` switch.

**Remainder here:** 📌 bump kol-component 0.319.0 and add `@kolkrabbi/kol-growth` 0.1.0; `src/components/HomeStage.jsx` → `<GrowthLineStage className="text-fg-48" />` (and the mark via `shape`); `src/loops/flow/growthLine.js` and `filters/fxGrowth.js` import `Growth` · `densityFrom` · `SIM_W` (and `mulberry32` where they seed) from `@kolkrabbi/kol-growth`; retire `src/loops/growth/engine.js` to `_tmp/` — one engine.
