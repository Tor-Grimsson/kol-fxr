# Plan — Morph and the timeline, made right

**Status:** SCOPED, not started. Cloud session 2026-10-08. Nothing here needs kol-ds-ui — the timeline comes home (§ 1), the rest is this repo's.
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

## 2. Blend drops every step but the first's generator

- **Cause:** Blend is `buildMorph` — it tweens step 1's generator's params, reading step 2's values only for keys of the same name (`MorphTab.jsx:52`). Circle morph is `morph-circle`, Star morph is `star-morph`: the star is silently gone.
- **Do:** Blend decides per segment. Same generator on both sides → today's param tween. Different generators → a **crossfade**: draw both steps, alpha by the segment's progress (plan 05 § 3's crossfade). Two modes stay — **Shape · Blend**; Blend picks tween or crossfade itself, no third toggle.
- **Done when:** circle → star → circle plays in Blend with both shapes visible; a same-generator pair still tweens.

## 3. Shape has no resolution

- **Cause:** the sample count is automatic, `max(64, min(512, …))` (`shape.js:196`), and outlines are re-recorded every frame.
- **Do:** a **Resolution** row in Shape mode (Auto · 64–1024), stored on `morph`, fed to the pairing. Cache each step's recorded outline while its own animation is static, so a high resolution doesn't cost a re-record per frame.

## 4. Morph rail on the shared assets

- **Length:** hand-built `Input` + a loose `s`. It also duplicates the transport's loop length (both write `transport.setLoopSeconds`). **Do:** drop Length from the Morph rail; the transport owns the length and Save reads it from there. If it must stay: the transport's own field (`Input variant="property" unit="s"`, `TransportBar.jsx:33`).
- **Step list:** a hand-built `<ul>` with ↑ ↓ × buttons. **Do:** check `LayerStack` (kol-component) for steps — drag reorder, select = edit step, remove. If it fits, use it; if it doesn't, say why before building anything.
- **Title:** the rail heading is the group alone (`LabsParams.jsx:406` → "SIMPLE"). **Do:** method / group — `LOOPS / SIMPLE`.

## 5. `Loop / 4s` is not centered

- **Cause:** `variant="property"` left-packs by design; `inputClassName="text-center"` only centres inside the hugging input.
- **Do:** centre the shell from `TransportBar.jsx` (the field's `className`), no DS change.

## 6. The counter reads a fraction, not time  *(needs § 1)*

- **Now:** `0.82` — the loop's 0–1 position, printed `t.toFixed(2)`.
- **Do:** pass the loop seconds in; counter `3.28 / 4.00 s`, key tooltips and `key @` in seconds.

## 7. Steps named on the lane  *(needs § 1)*

- **Now:** a morph is one layer; its lane shows bare diamonds (steps 1 → 2 → 1) under a truncated `Loop · Circle mo…`.
- **Do:** keep one layer (it saves, bakes and exports as one). Name each key with its step, each span with its transition (*Circle morph → Star morph*); clicking a name opens that step for editing (`editStep`). The lane label reads the morph's name.

## 8. Resizable dock and curve editing  *(needs § 1)*

- **Now:** fixed height; a key's easing is one of six presets in the selected-key menu.
- **Do:** drag the dock's top edge to resize. A curve view per lane (AE / Resolve style): bezier handles on a key, easing Linear · Ease in · Ease out · Ease in-out · Custom. The key editor already tolerates an array easing (`Array.isArray(key.easing)`) — confirm the resolver reads it as a cubic-bezier before building the handles.

## Verification

Every item walked on `vite preview` of `pnpm build` in Chromium here, desktop and 390 touch — never on dev alone.
