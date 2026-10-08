# Plan — Morph and the timeline, made right

**Status:** BUILT 2026-10-08 (cloud session), all eight, walked on `vite preview` at 1600 (`walk-morph.mjs`, 10 checks) — crossfade, greyed modes, resolution, grab-handle steps, `Loops / Simple`, centred loop field, seconds counter, named header lane, dock resize + curve handles. Parked for a local session: the step list to the DS (§ 4), a per-option `disabled` on `SegmentedToggle` (the greyed cell is a dimmed label + tooltip until then).
**Origin:** user, 2026-10-08, on `fxr.kolkrabbi.io/morph` (Circle morph → Star morph, Blend):
- *"blend now ignores everything but the first layer? I thought each layer would be added as a layer to the 'timeline'?"*
- *"'Shape' needs resolution slider to make the morph smoother"*
- *"what does the timer mean? it looks like a percentage drawn like a timer"*
- *"we have a component exactly for this"* (Length) · *"why does it just say SIMPLE"* · *"'loop/4s' should be centered"*
- *"would we not want to allow drag to resize height and access curve controls? how davinci and after effect etc give you bezier handles"*
- *"just disconnect it and make it local to the repo"* (the timeline)

Order: § 1 first (it unblocks § 6–8), then § 2–5 (small, independent), then § 6–8.

## 1. The timeline comes home

- **Now:** `src/editor/params/TimelineDock.jsx` is a wrapper over kol-component's `TimelineDock` (lifted out of this repo 2026-09-27). Every change to it is a DS round trip — ruled out for editor work (plan 06).
- **Do:** copy `node_modules/@kolkrabbi/kol-component/src/organisms/TimelineDock.jsx` (0.244.0, 261 lines) into `src/editor/params/` as the dock itself; its imports (`Input`, `Dropdown`, `Tooltip`) become `@kolkrabbi/kol-component` imports. Fold the wrapper's `collectTracks` + clock into it. Consumers (`packs/motion.js`, `labs/LabsView.jsx`) keep the same import path.
- **Not:** a lookalike — it is the DS file, owned here from the copy on, as the editor was.
- **Done when:** the dock renders and edits keys exactly as before, on `vite preview`, in labs and the editor.

## 2. Blend drops every step but the first's generator — a third mode, Crossfade

- **Cause:** Blend is `buildMorph` — it tweens step 1's generator's params, reading step 2's values only for keys of the same name (`MorphTab.jsx:52`). Circle morph is `morph-circle`, Star morph is `star-morph`: the star is silently gone. Blend is plain keyframe tracks by design (`buildMorph.js:9` — drag the keys, bind a knob) and a fade cannot be a track, so Blend must not try to cover this.
- **Do:** three modes — **Shape · Blend · Crossfade** (user, 2026-10-08). Crossfade is its own draw, the way Shape is (`shapeMorphDef`): both steps drawn, alpha by the segment's progress; the layer carries `morph.steps` + the `morphT` lane. Blend stays pure tracks.
- **Greyed, with the reason as its tooltip:** Blend when the steps are not one generator; Shape and Crossfade when a step is a GL `engine` generator (10 of them — only 2D canvas draws can be recorded or redrawn). A greyed current mode falls to the first available one.
- **Done when:** circle → star → circle plays in Crossfade with both shapes visible; Blend is greyed for that pair and still tweens a same-generator pair.

## 3. Shape has no resolution

- **Cause:** the sample count is automatic, `max(64, min(512, …))` (`shape.js:196`).
- **Do:** a **Resolution** row in Shape mode (Auto · 64–1024), stored on `morph`, fed to the pairing. No cache — every generator moves with `u`, so an outline is never static.

## 4. Morph rail on the shared assets

- **Length:** hand-built `Input` + a loose `s`. It also duplicates the transport's loop length (both write `transport.setLoopSeconds`). **Do:** drop Length from the Morph rail; the transport owns the length, Save reads `transport.getLoopSeconds()`, and loading a saved morph sets the transport from its stored `seconds` (or an old file plays at the wrong length). If it must stay: the transport's own field (`Input variant="property" unit="s"`, `TransportBar.jsx:33`).
- **Step list:** a hand-built `<ul>` with ↑ ↓ × buttons — a local component that belongs in the DS (user, 2026-10-08). **Do here:** reorder by a **grab handle** (`drag-handle`, kol-icons; the `2×3 dots`) instead of the arrows — HTML drag the way `LayerStack` does it (`onDragStart` … `onDrop`), × stays. Keep it as one local `StepList` so it lifts clean.
  **Parked for a local session (DS ticket):** ship it to kol-component as a numbered list item + group, two variants — (1) as it is, arrows; (2) with the grab handle. Then this repo swaps its local copy for the package's.
- **Title:** the rail heading is the group alone (`LabsParams.jsx:406` → "SIMPLE"). **Do:** method / group — `LOOPS / SIMPLE`.

## 5. `Loop / 4s` is not centered

- **Cause:** `variant="property"` left-packs by design; `inputClassName="text-center"` only centres inside the hugging input.
- **Do:** centre the shell from `TransportBar.jsx` (the field's `className`), no DS change.

## 6. The counter reads a fraction, not time  *(needs § 1)*

- **Now:** `0.82` — the loop's 0–1 position, printed `t.toFixed(2)`.
- **Do:** pass the loop seconds in; counter `3.28 / 4.00 s`, key tooltips and `key @` in seconds.

## 7. Steps named on the lane  *(needs § 1)*

- **Now:** a morph is one layer; its lane shows bare diamonds (steps 1 → 2 → 1) under a truncated `Loop · Circle mo…`.
- **Do:** keep one layer (it saves, bakes and exports as one). One **header lane per morph** carrying the step names on its keys and the transition on each span (*Circle morph → Star morph*); clicking a name opens that step for editing (`editStep`). In Blend every differing param is its own track — those lanes fold under the header, never named per step. The header reads the morph's name.

## 8. Resizable dock and curve editing  *(needs § 1)*

- **Now:** fixed height; a key's easing is one of six presets in the selected-key menu.
- **Do:** drag the dock's top edge to resize. A curve view per lane (AE / Resolve style): bezier handles on a key, easing Linear · Ease in · Ease out · Ease in-out · Custom. The resolver already reads a cubic-bezier array (`easing.js:51`) — Custom is UI only, the data model exists.

## Verification

Every item walked on `vite preview` of `pnpm build` in Chromium here, desktop and 390 touch — never on dev alone.
