# Plan — Labs on mobile + the Vector section

**Status:** active (2026-09-01) · **Origin:** user ask 2026-09-01 — "labs available for mobile, choose randomise or labs at load" + "vector distressor and modulator in labs as a new top category".
**Scope ruling:** shape-level plan; file-level detail is worked out per step as it starts, never upfront.

## Sources (outside this repo)

| what | where | core |
|---|---|---|
| Modulator | `~/dev/projects/kol-apps/kol-modulator` | `src/components/modulator/DialRotation.jsx` (224 ln) — parametric warped-ring SVG generator; control schema in `FrequencyModulator.jsx` |
| Distressor | `~/dev/projects/kol-apps/kol-svg-distress` | `src/hooks/useSvgDistortion.js` (465 ln) — pure SVG path resample + displace; `paper` dep is UNUSED |

## Steps

1. **Extract the labs catalog from `LabsNav.jsx`** — the section/group/pick-dispatch data lives inline in the nav component; move it to a data module (e.g. `src/editor/labs/catalog.js`) that `LabsNav` renders from. Prereq for steps 4 and 5. Done when: `/labs` rail renders identically (measured), `LabsNav` holds no catalog data.
2. **Modulator engine** — new loop group `modulator` in `src/loops/` (draw fn + schema + presets per `contract.js`); gsap ticker replaced by transport `t`; params become schema fields → bind dots free. Done when: presets render, animate on transport, params bindable, browser-verified.
3. **Distressor engine + SVG sourcing** — `useSvgDistortion` ported as a pure function; engine fetches + parses the SVG source once, distorts per params (mode/amount/frequency/smoothness/seed), seed-drift over `t`. SVG support added to `LabsSourcePicker`/media facade (vault SVGs). Done when: an SVG from the picker distresses live in labs, browser-verified.
4. **VECTOR section in labs** — `sec:vector` marker + Distressor/Modulator group rows in the catalog (step 1's module); `SECTION_ICONS`/`GROUP_ICONS` entries (`square` fallback until real glyphs); hierarchy doc (`docs/documentation/01-hierarchy/`) gains the fifth METHOD. Done when: section renders both rail levels, picks dispatch, doc updated.
5. **Mobile labs chrome** — ungate the Labs door on phones in `MobileView`'s entry card; a labs mode feeding `CategoryScreen` from the step-1 catalog (effects + generative + kinetic) instead of `GENERATIVE_TREE` only; params via the existing `MobileOverlay`; effects source through `LabsSourcePicker`. Mobile inherits VECTOR via the shared catalog. Done when: phone entry offers Generate/Labs, labs mode browses the catalog and renders presets on device-sized viewport, browser-verified.

## Excluded (deliberate)

- Distress `RefinePage` per-node refinement (1,349 ln) — editor-tier, later plan.
- Editor door on phones — stays tablet-only (desktop editor needs a fine pointer).
- New icon glyphs — `square` fallback; real glyphs are a kol-icons lobby ticket when the section settles.

## Risks / laws

- Pixi/GL effect tiers on phone GPUs — gate heavy tiers the way Penrose heavyweights are.
- THE CATEGORY LAW: the rail shows sections and categories only, never presets.
- A green build is not verification — every step's done-when is a browser measurement.
- No local DS shims; consumer/DS gaps go through the lobby.
