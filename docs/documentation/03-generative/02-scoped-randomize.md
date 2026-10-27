---
title: Scoped Randomize
type: reference
status: active
updated: 2026-10-27
description: The seeded, binding-safe, category-preserving randomize architecture — rng.js primitives, rolls.jsx scope derivation, and the Randomize-all + per-scope wiring in ParametersPanel.
tags:
  - project/kol-fxr
  - domain/generative
  - editor/randomize
aliases:
  - scoped-randomize
  - randomize
covers:
  - mulberry32 / randomSeed / randomizeSchema / mergeRoll
  - scope derivation from schema `section` metadata + the Colour type-scope
  - computeRoll / useRollSeed / SeedField
  - Randomize all + per-scope buttons in ParametersPanel
sources:
  - src/editor/lib/rng.js
  - src/editor/params/rolls.jsx
  - src/editor/compose/inspectors/ParametersPanel.jsx
  - src/editor/params/schema.js
related:
  - "[[INDEX|generative]]"
  - "[[01-loop-layer|the loop layer]]"
  - "[[03-motion-and-look-presets|motion and look presets]]"
---

# Scoped Randomize

The flagship curation surface, built the labs-parity session (Wave A, 2026-07-08). Every loop/kinetic/pattern inspector gets a **Randomize all** button plus a grid of **per-scope** buttons and an **editable seed**. One press = one seeded roll, merged over the layer, landing as **one history entry**.

Three properties define it:

| Property | How |
|---|---|
| **Seeded** | Every roll runs `mulberry32(seed)`; the seed persists on the layer as `_rollSeed`, so a roll survives save/load and is reproducible by typing the seed. |
| **Binding-safe** | `mergeRoll` never overwrites a param that currently holds a binding object or keyframe array — animated params keep their animation. |
| **Category-preserving** | Scope buttons are schema filters; a roll only touches the params inside the pressed scope, and `noRandom` params (counts, resolution, structural knobs) are skipped everywhere. |

## Layer 1 — the RNG primitives (`src/editor/lib/rng.js`)

One shared implementation, ported from labs, behind every randomize surface in the app.

| Fn | Contract |
|---|---|
| `mulberry32(seed)` | Deterministic `0..1` PRNG. Same seed → same sequence. |
| `randomSeed()` | A fresh integer seed (`Math.random() * 1e9`). |
| `randomizeSchema(params, rng)` | Rolls a value object from a declarative schema. **Skips `noRandom`.** Per type: `range` → `rMin`..`rMax` snapped to step, or the **middle half** of min..max when the schema names no span — never the slider's ends (plan 42) · `select` → one option · `toggle`/`boolean` → coin flip · `color` → a colour of **one palette** rolled for the whole call (`rollPalette`, `src/editor/color/palette.js` — kol-component's harmonies under the seeded rng): a param with a `role` takes that role, an un-roled one the palette's colours in turn, so a roll gives related colours, never N random hexes (plan 37 § 5.5). Anything else is left out (caller keeps its current value). |
| `mergeRoll(current, rolled)` | Merges the rolled patch over current values but **skips any current value that is a binding** — a non-null object (not array), or an array of keyframe objects. Plain values get replaced; bound values are preserved. |

`randomizeSchema` honouring `noRandom` and `mergeRoll` preserving bindings are the two guarantees the whole surface rests on.

**The plan 42 rule** — Randomize all rolls the look, not the structure: counts, caps, grid resolution, iterations, timesteps, positions, modes and form switches are `noRandom` in every family (Penrose holds its list once, `STRUCTURAL` in `src/loops/penrose/host.js`). `node src/editor/params/rolls.check.mjs` proves it on every preset: at most 12 rows per rail tab and at most 10 non-colour values per press.

**The palette** (`src/editor/color/palette.js`, plan 37 W5) is one shape — `{ id, name, colors, roles: { bg, fg, accent, dim, warm }, source }` — for themes, editor swatches and library palettes alike (`allPalettes`). `themeParams()` (`loops/theme.js`) is its resolver with a theme as the palette; `resolvePalette(params, schema, palette, { rotate })` recolours by role and, with `rotate`, the rest in turn. A roll generates in **OKLCH** (plan 39 § 4.3 — `oklchToHex`, accents at one perceived lightness whatever the hue) and stores hex. Two surfaces: the editor's **Color Modes** tool window (`ColorModesWindow.jsx` around `PaletteBody.jsx` — relationship · roll · lock · load · save · apply to layer or to the document palette; Tools › Color Modes, Edit › Color Modes, Window › Left rail › Color Modes; the one palette generator since the old `PaletteModal` retired) and Labs' settings-rail **Palette** row (relationship + Roll, `LoopFields.jsx`). `palette.check.mjs` guards it.

## Layer 2 — scope derivation (`src/editor/params/rolls.jsx`)

Scopes are **schema filters**, derived per layer from its *visible* params (`visibleParams` honours each param's `when` gate).

**`deriveScopes(schema, layer)`** walks the visible params and buckets them:

- A `type: 'color'` param goes into the single **Colour** scope (`__color`), regardless of its section — so a pure-`Color` section collapses into it.
- Every other param goes into a scope keyed by its `section` metadata (`Geometry`, `Look`, `Motion`, …).
- Curation keys (`theme`, `invert`) are never rolled.

Each scope is `{ id, label, motion, params }`; `motion` is true for the `Motion` / `Frame` / `Form` sections. Section metadata is the same `section:` grammar the inspector uses for its group headers (`src/editor/params/schema.js`), so **the scope buttons are generated straight from the schema** — no per-family list.

**`allScopeParams(schema, layer)`** — the *Randomize all* set: every visible param **except** the motion sections (`Motion`/`Frame`/`Form`) and `Camera`, and except the curation keys. Rolling "all" rolls the *look*, never the motion or framing (labs scanline convention).

## Layer 3 — the roll + seed helpers

**`computeRoll(layer, params, seed, { stripNoRandom })`** — the roll → layer-patch function:

1. `randomizeSchema(params, mulberry32(seed))` produces the rolled values.
2. `mergeRoll(currentValues, rolled)` merges them over the layer, preserving bindings.
3. The seed is written back as `_rollSeed`.

`stripNoRandom` is the explicit-motion escape hatch: a schema flags its motion params `noRandom` to keep the *all*-roll off them, but pressing the **motion scope itself** must roll them — so that press temporarily clears `noRandom` on its own params (labs `randFrame`/`randForm`).

**`useRollSeed(layer)` + `SeedField`** — the editable seed field. `value` shows the manual draft or the layer's persisted `_rollSeed`; `take()` consumes a manually-committed seed **exactly once**, then mints fresh seeds again. Committing a number (Enter/blur) *arms* it for the next press.

## Layer 4 — the panel wiring (`ParametersPanel.jsx` → `LoopFields`)

```
const seed   = useRollSeed(layer)
const scopes = deriveScopes(schema, layer)

const roll = (params, scope) => {
  const patch = computeRoll(layer, params, seed.take(), { stripNoRandom: !!scope?.motion })
  // a motion roll is hand-off-the-preset → flip the touched axis dropdown(s) to Custom
  if (tables && scope?.motion) { … patch._framePreset / _formPreset = 'custom' }
  // same hand-off for the Look dropdown when the roll touched a look key
  if (lookKeys && …) patch._lookPreset = 'custom'
  updateLayer(layer.id, patch)
}
```

Rendered in the **Generate** sub-tab:

- **`Randomize all`** — `roll(allScopeParams(schema, layer))`.
- **Per-scope grid** — one `EditorButton` per derived scope (`Colour`, `Geometry`, `Look`, …), each `roll(scope.params, scope)`.
- **`SeedField`** — the editable seed below the buttons.

Because a motion or look roll lands params the quick-select dropdowns describe, `roll` flips those dropdowns to `Custom` in the same patch — keeping the [[03-motion-and-look-presets|motion and look presets]] UI honest.
</content>
