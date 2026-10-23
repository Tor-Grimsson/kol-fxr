# Effects intake — eight motion references, one shared field core, built from parts already here

**Staged:** 2026-10-22 · from a claude.ai chat session
**Change:** backlog — new loops, one kinetic-type mode, one filter, one shared field module; proposed order at the end
**Related:** [color-pass-one-palette-for-every-layer](color-pass-one-palette-for-every-layer.md) — every effect here reads its colours through it; build that first

---

## The problem, in one case

The user collects motion references (Instagram/Facebook, a few frames per piece) and wants each judged for FXR: what it is, how it is made, whether it belongs. This is the first batch. The frames were phone screenshots in a chat and are not attached — each reference names its source post. File frames into `_assets/` with `clip-drop.sh --kol-fxr` if wanted.

## Parts that already exist (checked 2026-10-22)

| part | where | reused by |
|---|---|---|
| `d3-delaunay` Voronoi + Lloyd | `loops/penrose/protos/01-packing-lloyd.js` | E1 |
| simplex angle field | `loops/penrose/protos/07-flow-field.js` — **welded to the ecosystem sim**, not reusable as is | field core |
| reaction-diffusion solver | `loops/abstract/RDEngine.js` | E6 labyrinth screen, E8 |
| halftone / dither modes (incl. a flow-field mode) | `filters/fxHalftoneDither.js` · `filters/dither.js` | E6 |
| per-glyph `<text>` rendering + animations | `kinetic/KineticType.js` · `kinetic/animations.js` | E2 |

## The references

| | source | what it is | technique | verdict |
|---|---|---|---|---|
| E1 | polyhop — *Linked Pulse II* | Voronoi cells from drifting seeds, rounded glowing edges; a green proximity graph over the points | Voronoi of noise-drifted points; cells inset with corner radius; stroke weight + glow ← cell area; edges between points within radius r, alpha ← distance | **build** — new loop |
| E2 | contemporarytype × posterkraft | a word list whose letter gaps animate while each word holds its line; variants decorate the gap | per-gap width driven by noise; gap decoration: none · word box outline · connector rule (T—R—U—T—H) · tick · dot | **build first** — kinetic-type mode, cheapest win |
| E3 | contemporarytype × honigwespe; Anna Fay via Composition NY | one glyph tiled on a grid, each copy rotated to a vortex/spiral field; a big letterform emerges from scale/density | glyph instancing, rotation ← field angle, scale ← field strength or a letterform mask; rotation symmetry makes g read as 6/9 and n as u | **build** — needs the field core |
| E4 | dvdp — *261016* | horizontal flow lines bending around moving circles, rings at each circle | uniform flow + cylinder obstacles (potential flow), streamlines seeded at one edge, concentric rings at obstacles | **build** — field core |
| E5 | s_n_k_ — *Connected Fields – Streamlines 01* | point charges with field lines between them, coloured per cluster, arrowheads | ± point charges summed, streamlines + to −, arrow glyphs along the line, colour ← cluster | **build** — field core, near-free after E4 |
| E6 | toan_vu_huu — image slicer | an image cut into cols × rows; a zoom wave travels across the cells; cells rasterised | **(a)** slice grid with a travelling band scaling cell content (direction, width, duration, back-and-forth, extra zoom %) · **(b)** screens: halftone, stipple, labyrinth, two-ink riso with ink offset + grain | **build** — (a) a filter; (b) check against `fxHalftoneDither`: riso + labyrinth (RD as threshold) are the gap |
| E7 | tyler_spangler — eye-tile poster | a repeated image tile fills the frame; the type's rag crops the tiles | layout, not motion | **park** — likely composable today with frames + masks |
| E8 | algorigraph — line portrait | winding near-continuous lines packed tighter where the image is darker | differential growth / maze line, spacing ← image tone; vector (plotter) output | **later** — heavy; same family as E6's labyrinth, vector instead of raster |

## The fix

**Field core** — one module E3, E4, E5 (and later E8) share:
- A field is a sum of components: uniform · noise (simplex, curl) · vortex · source/sink · point charge · cylinder obstacle · image gradient · letterform mask. `sample(x, y, t) → vec2`.
- Two renderers on top: a **streamline** integrator (RK4, seeding from edge / grid / Poisson, even spacing) and a **glyph instancer** (rotation, scale, density from the field).
- `07-flow-field` moves onto it, so the repo keeps one field, not one per loop.

**Every effect:**
- lands as a labs preset with its params on `AutoControls`
- reads colour through the color pass and declares at least one mapping property (E1 cell area · E3 field strength · E5 cluster · E6 tone)

**Proposed order — the user's call:**
1. Color pass (the related ticket)
2. E2
3. Field core → E4 → E5 → E3
4. E6 (a) then (b)
5. E1
6. E8 later
7. E7 parked

**Intake for the next batch:** add a row to this table with the same columns (source · what it is · technique · verdict) and the parts it reuses, or file a new entry if the batch is large.

## Rejected alternative

- **One loop per reference, each self-contained.** E3, E4 and E5 would each grow a private field — `07-flow-field` is already that case.
- **Copy the references' look exactly.** These are technique studies; presets are FXR's own, not reproductions of the source pieces.

## Definition of done

- [ ] Field core: one module, both renderers, `07-flow-field` reading it with no visual change
- [ ] Each built effect: a labs preset, params on `AutoControls`, colour via the color pass with one mapping property, walked desk + 390, 0 console errors
- [ ] E7 and E8 rows carry their park/later reason when this entry closes

---

## Resolution — 🟢 closed 2026-10-22 (plan 37 W6, kol-fxr agent)

- Field core `src/loops/flow/fieldCore.js` (uniform · vortex · source/sink · charge · cylinder · looping noise; RK4 streamlines; glyph instancer); `penrose/protos/07-flow-field` reads `noiseAngle` (same rng draw, same values).
- Generative › **Flow**: E4 Obstacle flow · E5 Charge lines (colour ← cluster) · E3 Glyph vortex (colour/size ← field strength) · E1 Voronoi pulse (colour/weight ← cell area). **Letter Gap**: E2 as a 2D loop (the kinetic engine draws nothing between glyphs) — rule · box · tick · dot.
- E6: `filters/fxSlicer.js` — **Slice wave** (Post-processing; seamless, checked u0 ≡ u1) and **Riso** (Halftone; two inks, dots or a reaction-diffusion labyrinth screen, misregistration, grain; colour ← image tone). Riso is a CPU pass — fine on stills, ~0.5 s/frame on a moving generator.
- E7 parked (layout, not motion — composable with frames + masks); E8 parked (heavy; after a vector labyrinth).
- Walked desk + 390 on `vite preview`, 0 console messages; at 390 thin streamlines read dashed (a 1080 canvas shown at ~290px) — the output is solid.
