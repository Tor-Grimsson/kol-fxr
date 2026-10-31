# Session: Plan 45 — the loader is the line, KOL floats, Atlas ticket

**Date:** 2026-10-31
**Agent:** Claude (Opus 5.5)
**Summary:** Plan 45 finished: one growing line from load to Home, floats on KOL's solid style, and the line + intro ticketed to KOL for Atlas.

## Changes Made

### Files Modified
- `src/components/HomeStage.jsx` — the intro: line grows inside the FXR letters, breathes while the page fades in, then blends to the orb and fills the screen; a resize keeps the line; slow wave.
- `src/loops/growth/engine.js` — softer, wider mouse (0.24 reach, bell falloff), pointer low-pass 0.35, `draw({ wave })`.
- `src/components/intro.js`, `src/main.jsx`, `index.html` — the intro is stamped on every reload of `/` (not reduced motion); the plain loader everywhere else. `vite.config.js` stamp removed.
- `package.json` — kol-theme 0.203.0 · kol-component 0.320.0 · kol-shell 0.92.0 · icons 0.54.0.
- `.kol/llm-plan/45-…md` — W1, W3, W4 ✅ with measurements; playbook `playbook/2026-10-31-plan-45-line-settles-loader.md`.
- `src/components/BootIntro.jsx` → `_tmp/2026-10-31-boot-intro/`.

### Lobby
- `HomeDockShadow` adopted (kol-shell 0.91.3, dock shadow = Labs' pill).
- `FloatingStyleAndSignInDemos` adopted at 0.92.0 — every fxr float stays `solid` (his pick, "probably solid").
- Filed to kol-ds-ui: `GrowthLineIntro` (kol-growth + GrowthLineStage catch up with fxr's line and intro, for Atlas — fxr keeps its own engine) and `HubHomeFloatSurface` (HubHome forwards a float surface to the dock and +).

## Current State

### Working
- Reload of signed-out `/`: one line from load to Home, no cut (max 8.4% centre change a frame); `\` and window resizes keep the line; 60 fps at DPR 2.

### Known Issues
- Home's dock and + can't take glass until `HubHomeFloatSurface` ships.

## Next Steps
1. Plan 45 2.2 (TALK): intro pace and the phone.
2. On `HubHomeFloatSurface`'s return: bump kol-shell, show the glasses beside solid on Home.
3. PARKED: the dock's ··· menu should open like the + menu.
