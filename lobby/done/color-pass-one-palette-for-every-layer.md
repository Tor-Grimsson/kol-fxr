# Color pass — one palette system every layer reads, instead of a random hex per param

**Staged:** 2026-10-22 · from a claude.ai chat session
**Change:** new subsystem — a palette store, resolver and generator wired into the existing `role` seam; touches `loops/theme.js`, `editor/lib/rng.js`, `editor/params/rolls.jsx`, `editor/modes/palette/`, the colour UI
**Related:** [effects-intake-motion-references-2026-10](effects-intake-motion-references-2026-10.md) — its effects consume this; build this first

---

## The problem, in one case

The user's read: colour in the visuals the tools produce is "pretty sure just random now, maybe connected to some saved swatches". Checked 2026-10-22 — it is three unconnected systems plus a dice roll:

| | what | where | who reads it |
|---|---|---|---|
| 1 | Nine fixed themes `{bg, fg, accent, dim, warm, grid}`; `themeParams()` patches every `type:'color'` param carrying a `role` | `loops/lib/themes.js` · `loops/theme.js` | loops (all 44 loop files with colour params tag a role); only 4 of 7 such files in `filters/` + `kinetic/` do |
| 2 | The Combo Lab engine — `generatePalette(pool, mode, currentColors, locks, baseColor)`, six modes (random · mono · analogous · complementary · triadic · double comp), locks, a seed colour; HSL maths | `editor/modes/palette/colorMath.js` · `pools.js` | palette mode only |
| 3 | Saved swatches | `editor/color/SwatchesPanel.jsx`, localStorage `kol.editor.swatches` | the picker only — no layer reads them as a palette |
| 4 | The Color roll — each colour param gets its own random hex | `editor/lib/rng.js:61`, scope in `editor/params/rolls.jsx` | every roll |

Row 4 is the "random" the user sees: a roll yields N unrelated hexes, because nothing knows they belong together. 145 `type:'color'` params exist across `loops/`, `filters/` and `kinetic/`. No colour library is installed (no culori / chroma).

## The fix

**One palette shape**, one store:
`{ id, name, colors: [hex…], roles?: { bg, base, accent, dim, warm }, source: 'editor' | 'local' | 'generated', harmony?, seed? }`
The nine `THEMES` become nine saved palettes in it; Combo Lab output and editor swatches are readable as palettes too.

**Color settings on a layer** (default: inherit the composition's):

| setting | values |
|---|---|
| Link | **linked** to the editor's active palette / swatches ↔ **unlinked**, a local palette |
| Amount | how many colours are in play |
| Assignment | **Roles** — background, base, accent(s), using the five roles already in the schema · **Rotation** — no roles, elements cycle through the N colours |
| Relationship | monochromatic · analogous · complementary · split-complementary · triadic · tetradic · duotone · random-within-pool |
| Generator | base hue, spread, saturation + lightness range, seed; **lock** a swatch and regenerate the rest; **save** the result to the editor's swatches |
| Load | any saved palette |
| Mapping | how colours are distributed: by index · seeded random · **by property** — a layer declares what it can map (cell size, field strength, cluster id, image tone, glyph index) |

Mapping is what makes colour a design parameter rather than a picker; the effects ticket depends on it.

**Wiring:**
1. Generalise `themeParams()` into a resolver: `(params, schema, palette, settings) → params`. Roles resolve as today; un-roled colour params resolve by index in Rotation.
2. Lift `generatePalette` out of `modes/palette/` into a shared module and extend its modes (split-complementary, tetradic, duotone). Generate in **OKLCH**, store hex — HSL steps look uneven and analogous yellows/greens go muddy.
3. The Color roll rolls a **palette** (relationship + seed) and resolves it. Independent per-param hex stays available as an explicit "Random" relationship, not the default.
4. A contrast check between background and the rest — a warning, never enforced.
5. Tag roles on the colour params in `filters/` and `kinetic/` that lack them.

## Rejected alternative

- **Make `rng.js` pick from the current swatches.** Stops the randomness but gives no relationships, no roles and no mapping — the half that matters.
- **A new generator beside Combo Lab.** It would be the third colour engine in the repo. Lift the one that exists.

## Definition of done

- [ ] Audit appended here: per folder, which colour params carry a role and which layer types ignore the theme today
- [ ] One store: themes, Combo Lab output and swatches all load as palettes; the nine themes migrate with no visual change (one preset compared before/after)
- [ ] Color settings on a layer — link, amount, roles/rotation, relationship, generate, lock, load, save — walked in a browser
- [ ] The Color roll produces visibly related colours
- [ ] Mapping proven on one layer: by index plus one property
- [ ] Desk + 390, 0 console errors

---

## Audit — 2026-10-22 (plan 37 § 5.1, kol-fxr agent)

Line count of `type: 'color'` schema entries (a multi-line entry counts once; `loops/theme.js` excluded):

| folder | colour params | with a `role` before | after plan 37 § 5.3 |
|---|---|---|---|
| `loops/` | 125 | 121 | 124 — `patternLoop` color3 → dim, fillColor → bg · `math/expression` gridColor → dim · `gl/catalog` sceneColor → fg |
| `filters/` | 11 | 6 | 10 — `scanline` bg/fg → bg/fg · `gl/catalog` tint ×2 → accent |
| `kinetic/` | 2 | 0 | 2 — `knobs` bg → bg, fill → fg (both `noRandom`; a theme now reaches them) |
| `editor/` | 8 | 0 | 0 — inspector paints (fill/stroke), not generator params |

Left un-roled on purpose: `filters/pixi/defs.js` (colour-replace pairs — from/to, original/target — a role would collapse a replacement onto itself) and `loops/penrose/host.js:100` (the generic param factory; its callers tag roles).

Layer types that ignore the theme today: `photo`, `shape`, `text`, `path`, `bool`, `group` (their colour is the inspector's fill/stroke, not a schema); `kinetic` took no role until this pass.

---

## Resolution — 🟢 closed 2026-10-22 (plan 37 W5, kol-fxr agent)

- One shape + store + resolver: `src/editor/color/palette.js` — themes, editor swatches and library palettes load as palettes; `themeParams()` is the resolver with a theme (`palette.check.mjs`: 9 themes resolve as before).
- Engine: kol-component's `colorMath` harmonies (the DS styleguide's ColorLab runs on it) under FXR's seeded roll — not a third engine; HSL, not OKLCH.
- The Color roll rolls ONE palette (`src/editor/lib/rng.js`): roles hit, un-roled params rotate; walked — related palettes.
- Settings: the editor's color pane **Palette** tab (`PaletteBody.jsx` — relationship · roll · lock · load · save · apply; Window and Edit menus open it) and Labs' settings-rail **Palette** row (`LoopFields.jsx`); the Randomiser's Color roll is the simplified version.
- Mapping by property: the Flow loops colour by cell area (Voronoi), field strength (Glyph vortex), cluster (Charge lines).
- Walked desk + 390 on `vite preview`, 0 console messages. Not done: OKLCH; PaletteModal's own `colorMath.js` copy still to move onto the DS engine.
