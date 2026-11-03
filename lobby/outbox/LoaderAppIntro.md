# LoaderAppIntro — receipt

**Filed:** 2026-11-01 → kol-ds-ui `lobby/inbox/LoaderAppIntro.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**State:** 🟢 `closed` 2026-11-01 · **synced:** 2026-11-01
**Asked:** KOL's app loader gets an intro mode — `loaderApp({ intro })` paints ground only on `/` (pre-paint stamp, mark hidden); `GrowthLineStage intro` claims it and hides the loader on its first frame (600 ms fallback when nothing claims); HubHome holds its chrome and fades it in during the breath. Atlas then drops its static `#atlas-boot` curtain for `loaderApp({ intro: true })`.
**Remainder here:** none — the remainder is kol-atlas's (the swap). fxr may adopt later and retire `src/components/intro.js`, the `index.html` stamp and HomeStage's page fade; not asked.

## ✅ RETURNED — 2026-11-01 · kol-component@0.331.0 · kol-framework@0.69.0 · kol-shell@0.99.0

`loaderApp({ intro })` (true = `/`, or paths) stamps `kol-intro` pre-paint with motion allowed and hides the loader's mark; without it the HTML is byte-identical. `claimIntro` · `introClaimed` · `endIntro` · `releaseIntro` sit beside `hideLoaderApp`, which does the 600 ms claim-or-fallback itself (source in kol-component, re-exported from kol-framework incl. `src/loaderApp.js`). `GrowthLineStage intro` claims on mount, hides the loader on its first frame, ends the intro at the end; new `onIntroBreath`. HubHome holds its chrome under an intro stage and fades it in 700 ms, 800 ms into the breath, then clears. Verified on studio-hub.

**Remainder here:** none — kol-atlas's swap (bump, `loaderApp({ graphic: <hex>, intro: true })`, retire `#atlas-boot` and the HOLD timer) is the remainder, and kol-fxr may adopt later.
