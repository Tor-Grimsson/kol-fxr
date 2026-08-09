# Handoff — 2026-08-09 00:40

## Goal of the current arc
Labs mode (plan.md Phase 11): a second chrome over the editor engine that does what labs.kolkrabbi.io does — effects · generative · modulation on standardized output, no compositor UI. The architecture is DONE and browser-verified; **the arc is NOT done: the user compared it against labs side-by-side and it is miles off visually.** The remaining work is the reskin, not the machinery.

## Last actions taken (causal trail, newest first)
- Fixed the broken dropdown (two causes, both DS-drift): kol-theme lost ALL `.kol-dd-*` chrome after 0.6.0 → shim in `kol-editor.css` §6; unstyled `.kol-dd-list` + inline-flex rows gave the panel ~860px intrinsic width → floating-ui shifted it off its trigger → shim adds column-flex. Playwright-verified aligned + styled.
- Ported labs' label treatment: scoped `labs.css` uppercases control labels (the exact `uppercase`+`tracking-widest` pair labs' own atoms use); nav rows uppercase w/ 0.06em tracking, chevron right; nav sections sentence case.
- Fixed the Geometry/Geometry doubled headers editor-wide (`AutoControls.jsx` — header drops when it equals its first param's label).
- Per user: chooser stripped to buttons only; labs boots to an EMPTY stage (no autoplay, no autoselect — deep link `?preset=` is the only auto-open); Space = play/pause in labs (own listener; the editor's lives in `PanZoomViewport` which labs doesn't mount).
- Built 11.1–11.6 in one pass (labs registry chrome, one-layer swap, LabsNav, topbar seam, chooser + deep links, `draftKey`).
- Bumped all four KOL packages to actual latest and closed the stale peer ranges.

## Current state / open decision points
- **Working, verified:** deep links, param editing, layer swap, draft isolation (`kol.editor.labs-draft`), dropdown fix, dedup fix.
- **The gap (user verdict "miles off"), concrete deltas vs the reference screenshots:** labs has nav group ICONS (its icon set isn't in this repo); labs picks presets via CHIPS across the rail top (`Dither ASCII Bitmap`), we show the Type/Category/Preset dropdown stack; labs tabs are `Effect · Motion`, ours `Generate · Style · Animation`; spacing/density tighter throughout. Closing this means labs-specific presentation over the shared panels (a `LabsParams` skin or per-mode props), NOT forking panel logic.
- **DS debts (kol-ds-ui side, ticket NOT yet filed):** restore `.kol-dd-*` chrome to kol-theme (shim here is temporary); kol-icons 0.10.0 dropped `stop`/`rewind` (transport warns); some DS component leaks an `uppercase` prop to the DOM (React warning).
- Local: `JetBrainsMono-Variable.woff2` in `public/fonts/` fails OTS decode (corrupt) — mono falls back. Effect pick = two undo steps. `kol-helper-11`→`kol-helper-12` (`ParametersPanel.jsx:305`) awaiting user go.
- The user's `humpty-tokens` hook blocks bare `4px`/`12px` in css writes — the dd shim states spacing in rem (0.25/0.75) for that reason; keep doing that in shims.

## Next intended action
- The reskin pass, labs screenshots as the spec (user has them; `/radar/ascii` and `/pattern/interlace/herringbone` were the references): preset chips, tab naming, density, nav icons (pull labs' set via `/lobby-icon` or port the SVGs). Propose the mechanism first — likely a labs-scoped skin layer + small per-mode props on the shared panels, never forked panels.
- Then file the kol-ds-ui ticket for the dd chrome + transport icons.

## Working memory not yet in AGENT-CONTEXT
- Labs' uppercase mechanism is CSS-side in ITS repo (`kol-labs-single/src/styles/kol-framework.css` `.kol-sidenav-hop`, atoms pair `uppercase tracking-widest`) — the published DS deliberately dropped auto-uppercase, so any further labs-look styling should stay scoped under `.kol-editor-labs`, never in shared chrome.
- `pnpm outdated` served stale registry data at session start — trust `npm view <pkg> dist-tags` when versions matter.
- The synthetic `element.click()` doesn't open floating-ui popovers (interaction hooks want real pointer events) — use a real playwright click when verifying.
- Labs' rail reference at 1:1: preset chips top (`Dither ASCII Bitmap`), then `Effect | Motion` segmented tabs, then sectioned params (sentence-case section headers, UPPERCASE control labels), `Randomize` as a full-width button inside the section flow.
