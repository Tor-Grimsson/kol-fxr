# Plan — Morph gets presets, and a Labs pick leaves Morph

**Raised:** 2026-10-31, in session. Points verbatim:
- *"if you start in morph and go to lab, you dont get labs view. I think its good to be able to take the same frame/working file between chromes, but if I press labs, and scanline and it opens in the view. but no rails follow, thats a but?"*
- *"we have NO [type] NO [categories] OR [preset]"* (screenshot: Scanline's header — Type · Category · Preset — which Morph has none of) *"so we should make a few that accts like a preset matrx. 1>1 1>2 1>3 1>4 etc so that we have a good combination of different files to morph. Then we save them to thi system"* (screenshot: Labs' rail, Generative › Scanline · Pattern · Loops …) *"clear? you can choose icons for Morph/Type in rail."*
- Earlier the same day: Home's dock Morph opens Shape · Blend · Crossfade (plan 45 PARKED, "Morph still owed").

**Status:** DRAFT — 2026-10-31. Ruled: Morph's ladder (section › type = mode › category = starting generator › preset = run). Ruled: the runs are curated by the agent (2–4 steps). ✅ W1 and W2 built 2026-10-31. Open: nothing.
**Shape:** W › phase › list.
**Laws carried:** METHOD > TYPE > CATEGORY > PRESET (`docs/documentation/01-hierarchy/INDEX.md`); the labs catalog lands once in `src/editor/labs/catalog.js` for desk and phone; the working file carries between chromes; icons are shipped kol-icons drawings only; retired code to `_tmp/`.
**How a phase closes:** measurable acceptance line first, gates green, then Playwright against his own words.

## W1 — A Labs pick from Morph lands in Labs

### 1.1 — The rail's Labs picks never leave Morph — ✅ built 2026-10-31
The cause (reproduced 2026-10-31, 1400×900): `/morph` and `/labs` are the same `LabsView`, so on `/morph` the rail's Labs rows run the mounted dispatch in place — Labs › Generative › Scanline put Scanline on the stage, the URL became `/morph?preset=scan-spaced-drift&cat=scanline`, and the right rail stayed Morph's tab. Nothing routes to `/labs` and `morph.active` stays true.
- A Labs pick made on `/morph` hops to `/labs` first, then runs (the `pendingPick` path Home already uses), and Morph lets go of the rail (`morph.active` false). The working frame comes with it — the layer on the stage is kept.
- Built: `AppLayout` `onNavigate` hops `/morph` → `/labs` before a rail pick runs. Measured 1400×900: from `/morph`, Labs › Generative › Scanline → `/labs?preset=scan-spaced-drift&cat=scanline`, right rail SCANLINE · Type Scanline · Category Spaced · Preset Drift; rail Morph → `/morph`, Morph's tab, the stage still drawn; no page errors.
- **Acceptance:** from `/morph`, rail Labs › Generative › Scanline → URL path is `/labs`, the right rail reads the Scanline params (Type · Category · Preset = Scanline · Spaced · Drift), the stage shows Scanline; from `/labs` with a layer, rail Morph → Morph's tab with that layer as its stage (no layer lost either way).

## W2 — Morph is a TYPE with categories and presets

### 2.1 — The preset matrix — curated, not a grid — ✅ built 2026-10-31
- His shape: *"1>1 1>2 1>3 1>4"*; then, 2026-10-31: *"I was just starting to make a simple connection matrix, I truly trust you more to follow your own logic, to find nice transitions, maybe most have 2 some have 3 and few have 4 connections?"*
- **Ruled — the ladder** (*"ok"*): METHOD = Morph (its own rail section beside Generative) › TYPE = the mode — Shape · Blend · Crossfade (the rows under Morph in the rail, and Home's dock Morph sub items) › CATEGORY = the generator a run starts from › PRESET = the run.
- **Ruled — the runs are mine to pick:** a run is 2, 3 or 4 steps; I choose pairs that transition well (shapes that share structure for Shape, one schema for Blend, contrast for Crossfade), watching each one play and dropping any that cut or stall.
- **Acceptance:** per type, 6–10 presets over 3–5 categories; ≥ 60% of all presets are 2-step, ≥ 1 per type is 4-step, ≤ 20% are 4-step; Blend presets stay inside one generator; every preset opens, has its step count, plays through one full loop with no page error, and is watched on a recording before it ships.

### 2.2 — Morph takes the TYPE · CATEGORY · PRESET header and the rail rows — ✅ built 2026-10-31
- Morph's tab gets the same header as every generator (Type = mode · Category = starting generator · Preset = the run), switching file on pick.
- The catalog gets Morph's rows once (`catalog.js`): Morph with its categories under it, an icon from kol-icons, reaching the desk rail and the phone sheet together. Where it sits — its own section beside Generative, or a group inside Generative — is part of his ruling on 2.1.
- **Acceptance:** Morph's header lists 3 types, each type's categories and presets as built in 2.1; picking a preset loads its steps (step count on the tab = the preset's) and the stage plays; the rail lists Morph with the same categories and presets on desk and on a 390 phone; every icon resolves (no `Icon "…" not found` in the console).

### 2.3 — Home's dock Morph opens its types — ✅ built 2026-10-31
- `src/AppLayout.jsx` `chromes`: Morph → its types (Shape · Blend · Crossfade) → categories → presets, nested like Labs' (kol-shell 0.98.0).
- **Acceptance:** signed-out Home at 1400×900, dock Morph lists 3 rows; each lands `/morph` with the tab's mode = the row picked and ≥ 2 steps.


## Built — 2026-10-31
- `src/editor/morph/presets.js` — the ladder and the runs (`MORPH_TYPES`, `RUNS`, `morphPresets`, `loadMorphPreset`). 21 runs: Shape 6 over 4 categories, Blend 7 over 5, Crossfade 8 over 4; 71% two-step, 14% four-step, one four-step per type; Blend runs stay inside one generator; Shape and Crossfade use only canvas-drawn generators (`hasOutline`).
- Watched: every run loaded, sampled over its loop (frames change, no page error), then 3 frames each on a contact sheet. Two Shape runs dropped for stalling blank — Rings field → Stripes, Animate → Epicycle.
- `MorphTab.jsx` — Type · Category · Preset (`TreePicker`, which gained `subLabel` and `current.typeLabel`: Morph's categories repeat across types); `morphStore` carries `presetId`.
- `catalog.js` — the Morph section after Generative (`swap`), types with `line-circle` · `shaper-scurve` · `dashed-circle`; a type's row lands on its first category's first run. `AppLayout` — a Morph pick made on `/morph` stays there (the 1.1 hop skips `morph:` paths); Home's dock Morph nests type → category → preset (`useMorphRows`, lazy like Labs' rows).
- 2.2 measured: header Crossfade › Scanline › Drift → Plasma; Preset → Drift → Charge lines → Ripple (3 steps); Category → Penrose loads its first run; desktop rail Labs › Morph lists Shape · Blend · Crossfade with drawn icons, Blend loads Drift → Galaxy; 390 phone catalog lists Morph and Blend loads; no `not found` in the console.
- 2.3 measured at 1400×900 signed out: dock Morph → Shape · Blend · Crossfade → each type's categories → its runs; the first run of Shape › Loops, Blend › Math, Crossfade › Penrose each lands `/morph` with that type, 2 steps, every menu closed.

## TALK
- Nothing open.

## PARKED
- Nothing.

## Answered in session
- *"did we fix \ key restarting animation at home?"* — yes, plan 45 § 4.2 (built 2026-10-31): `\` and window resizes keep the line, measured at DPR 2.
