# Handoff — 2026-08-09 12:21

## Goal of the current arc
The labs reskin arc is functionally DONE this session — labs mode now follows the kol-labs-single SOURCE contract, extracted by three subagent surveys (chrome/atoms · every effect page · every generative page). What's in flight: the LabsNavIcons lobby roundtrip and the user's visual acceptance pass.

## Last actions taken (causal trail, newest first)
- Collected labs' 15 real nav icons (from `sidebars.config.js` — `ptrn-dot`, `grid-horizontal`, `monitor`, `target-lock`, `ptrn-checker`, `cycle`, `sum`, `a-framed`, `dith-flow`, `paint-drop`, `ball`, `phone`, `font-01`, `camera`, `aa`), copied the SVGs verbatim into `kol-ds-ui/lobby/_assets/2026-08-09-labs-nav-icons/`, filed **LabsNavIcons** 🔵.
- Restructured the effect taxonomy to labs' sidebar: six groups; FX RACK's leaves are its NINE categories (`FX_RACK_GROUPS`, canvas+pixi mixed); rack leaf → labs' Effects page (`layer.fxGroup`: Effect Stack + per-category `Add effect…`); CRT purged of kaleido/mirror (→ Post-Processing).
- The full labs-contract fix pass: chips = bare `kol-helper-12` authored-case (halftone trio only), generative pages = title + Generate·Style·Animation + LoopPicker restored (labs uses dropdowns, not chips; Para Type keeps pill-chips), dividers scoped to effect pages only, scope-grid lone cells half-width again, seed off the labs rail, step-derived decimals, post-FX cards in labs chrome, adder scoped to the Post-Processing category.
- Consumed two same-session DS resolutions: icons 0.13.0 (`stop`/`rewind` real — deleted the transport bridge glyphs), component 0.32.3 + theme 0.32.4 (Dropdown viewport clamp — the Add FX overflow fixed at source).
- Earlier this session: DS sidenav adoption (useDragResize collapse rail, accordion sections), zoom/fps chips, labs keys (R/Shift+R/M/C/F/0–4/S), LabsShortcuts overlay, transport loop readout, GL/scanline/glass/dither `section:` sweep.

## Current state / open decision points
- **Builds green** (app + lib) on component 0.32.3 · theme 0.32.4 · framework 0.17.0 · icons 0.13.0. All surfaces browser-verified in dark mode.
- **LabsNavIcons 🔵 open** — until it ships, `GROUP_ICONS` (LabsNav) runs nearest-match substitutes, and every Randomize button uses `refresh` where labs uses `cycle`.
- **Deliberate deltas vs labs, awaiting the user's word:** 3-dropdown preset picker (Type level exists here, labs has 2); kinetic tabs Generate/Style/Animation (labs Design/Layout/Edit is a different panel architecture); Theme/Invert rows on every loop page (labs places selectively — Loops Style tab + Penrose only); no master "Animate" toggle on the sweep rig.
- **Theme split:** labs runs the framework theme store (topbar ThemeToggle), the editor view keeps editor `theme.js` — per-view stores, cross-view divergence possible by design.
- DS-side still open: the `uppercase` prop DOM leak (React error, survives 0.32.3) — never ticketed.

## Next intended action
- When LabsNavIcons ships: swap `GROUP_ICONS` to the labs names and change every labs `Randomize` `iconLeft` from `refresh` to `cycle` (LabsParams, LoopFields' Randomize-all, EffectsPanel RandomizeRow).
- Then hand the surface to the user for the visual pass; the deliberate-deltas list above is the likely source of the next instructions.
- Re-check the parked nav expand/collapse shift — framework 0.15.1's box-in-rules likely already fixed it; if so, tell the user the parked item is closed.

## Working memory not yet in AGENT-CONTEXT
- The three labs-contract survey outputs live in this session's task files (`…/tasks/*.output`) — chrome/atoms, effect pages, generative pages, with file:line refs. If a future session needs the contract again, re-running the surveys is cheaper than re-deriving from screenshots; the session log names the key rules.
- Labs' transport is `Tempo / 120` BPM (120 = realtime, clamp 0–300); ours stays `Loop / N s` deliberately (the engine's loop-safe time model — webm bake + integer-cycle sweeps depend on it). The user accepted the reasoning; the border/glyph treatment now matches labs.
- The kol-ds-ui lobby round-trips SAME-DAY — two tickets filed and resolved within hours this session. Filing there is faster than local workarounds, and consumer shims are banned anyway.
- Labs' `Section` header is the ONLY rail label not uppercased in JSX; every row label gets `uppercase tracking-widest` from its atom. Our labs.css uppercases via the `kol-helper-10.tracking-widest` pair — same result, keep the mechanism in mind when adding rows.
- The DS `Slider` molecule IS labs' whole range row (label · track · editable readout) — if RangeField ever gets replaced, that's the component to reach for.
- Synthetic `element.click()` still doesn't open floating-ui popovers — use real playwright clicks when verifying dropdowns.
