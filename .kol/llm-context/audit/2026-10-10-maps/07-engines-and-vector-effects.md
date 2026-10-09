# 07 — Engines that could become vector effects / shape parameters

Read-only map of kol-fxr (`/home/user/kol-fxr`, HEAD `d9b89a8 fxr-1011`). Every claim cites `path:line`.
Packages: `@kolkrabbi/kol-component 0.246.0` (package.json:33), `kol-theme 0.171.0` (:38), `kol-icons 0.34.0` (:35), `kol-framework 0.49.0` (:34), `kol-shell 0.63.0` (:37); `paper ^0.12.18` (:24), `pixi.js ^8.19.0` (:26), `pixi-filters ^6.1.5` (:25), `opentype.js ^2.0.0` (:23), `three ^0.185.1` (:29).

Note on the brief: `src/kinetic/morph.js` does not exist. The glyph-morph engine moved to `src/editor/modes/type/morph.js` on 2026-09-27 (src/editor/modes/type/morph.js:1-3); `src/kinetic/KineticType.js:5` imports it from there.

---

## 1. Registry + taxonomy: where every engine is listed, and the labs-only fence

| Thing | Value | Where |
|---|---|---|
| Flat registry groups | `shape`('Simple') · `pattern` · `patternloop` · `penrose` · `field` · `scanline` · `optic` · `abstract` · `math` · `paratype` · `modulator`('Modulator') · `distress`('Distressor') · + `GL_GROUPS` (drift, gradients, softforms, softforms3d, scene, forms, environment, ribbon) | src/loops/registry.js:33-47; src/loops/gl/catalog.js:25-34 |
| LOOPS flat list incl. `MODULATOR_LOOPS`, `DISTRESS_LOOPS` | — | src/loops/registry.js:50-54 |
| Time-shape fold: every non-penrose def gets `vpTime/vpSpeed/vpPhase` (so Distressor + Modulator carry them) | `TIME_PARAMS` | src/loops/registry.js:55-62; src/loops/lib/viewport.js:46-50 |
| Camera fold (`vpSpin/vpZoom/vpPulse/vpWobble/vpRate`) is ONLY shape + pattern-rules | `VP_PARAMS` | src/loops/contract.js:48-53; src/loops/lib/viewport.js:23 |
| Presets by group: `modulator: MODULATOR_PRESETS`, `distress: DISTRESS_PRESETS`; `optic` = OPTIC + MESH | — | src/loops/registry.js:63-79 (:72 optic merge) |
| Loop contract `kind: '2d' \| '3d'` | — | src/loops/contract.js:14 |
| Code actually tests `kind === 'engine'` | — | src/loops/registry.js:193; src/editor/morph/shape.js:266; src/loops/gl/catalog.js:99,120,202 (9 engine defs) |
| `GENERATIVE_TREE` (10 types): Scanline, Pattern, Loops, Math, Penrose, Drift, Gradients, Soft Forms, Soft Forms 3D, 3D Scene — **no `distress`, no `modulator`** | — | src/loops/taxonomy.js:19-33 |
| `MISC_TREE` = Para Type only | — | src/loops/taxonomy.js:38-40 |
| `PICKER_TREE = GENERATIVE_TREE` | — | src/loops/taxonomy.js:46 |
| `LEGACY_GROUP_LABELS` | `optic: 'Pattern · Effects'`, `paratype: 'Para Type · Misc'`, `distress: 'Distressor · Vector'`, `modulator: 'Modulator · Vector'` | src/loops/taxonomy.js:48-53 |
| LoopPicker: a group outside `tree` renders its identity READ-ONLY as `<span className="kol-helper-12 text-meta px-1">` with the legacy label — no Type dropdown | — | src/editor/compose/inspectors/LoopPicker.jsx:27-30, 62-77 |
| `.kol-helper-12` source | — | node_modules/@kolkrabbi/kol-theme/kol-type-mono-classes.css:114 |
| Desktop Generative menu iterates `GENERATIVE_TREE` only | — | src/editor/shell/MenuTop.jsx:247 |
| Mobile category screen iterates `GENERATIVE_TREE` only | — | src/editor/mobile/CategoryScreen.jsx:47 |
| Labs catalog VECTOR section (the ONLY pick entry for both engines) | `{ id:'sec:vector', label:'Vector' }`, `vec:Distressor` → `leafRows('distress')`, `vec:Modulator` → `leafRows('modulator')` | src/editor/labs/catalog.js:230-245 |
| Vector rail icons | `'vec:Distressor': 'scribble'`, `'vec:Modulator': 'dashed-circle'`, section `vector: 'pen-nib'` | src/editor/labs/catalog.js:48-49, 59; all three present in node_modules/@kolkrabbi/kol-icons/src/cuts.json |
| Policy statement | "Labs-only: both … stay out of GENERATIVE_TREE/PICKER_TREE, and resolve read-only in the editor inspector via LEGACY_GROUP_LABELS" | docs/documentation/01-hierarchy/INDEX.md:46, 58 |
| Pack seam: loops reach the core only via `pack('generators')` (`GENERATIVE_TREE`, `MISC_TREE`, `LoopPicker`, `drawLoopFrame`…) | — | src/packs/generators.js:16-24; src/editor/packs.js:1-25 |

**Why labs-only (quoted):** taxonomy.js:14-17 — "NOT here by design: `optic` (labs parks those four generator pages under EFFECTS > Pattern …) and `paratype` (labs Type Lab section …)"; taxonomy.js:42-45 — "Groups living elsewhere (optic → EFFECTS > Pattern, paratype → the misc layer) resolve to a read-only identity via LEGACY_GROUP_LABELS instead of appearing as pickable generative types." Both comments name only optic/paratype; the map still fences `distress`/`modulator` (:51-52). catalog.js:230-232 states the intent: "VECTOR — the ported kol-apps instruments (plan 02 step 4): tools that make or eat PATHS, neither pixel effects nor generative fields."

---

## 2. Distress engine (`vector-distress`)

**Input → output.** Input is an SVG document (inline markup or URL) carried OFF-SCHEMA on the layer as `svgSrc` (src/loops/distress/engine.js:198; src/loops/distress/presets.js:3-5). Pipeline: `DOMParser` (engine.js:33) → svg attached off-screen so `getTotalLength` works on non-`<path>` (:36-43) → `path, rect, circle, ellipse, line, polyline, polygon` sampled by arc length with `getPointAtLength` into `{x,y,t}` point lists, `n ≤ 2000`, spacing ladder `max(6, 70 − min(50,f)·1.2)` then `max(2, … − max(0,f−50)·0.3)` (:52-69) → per frame: seeded per-point offsets (`modeOffset`, :108-137) → box-smoothed over a window `win = round(smoothness/30)` (:210, :221-232) → centripetal Catmull-Rom → **`Path2D`** via `bezierCurveTo` (:140-164) → **painted to Canvas2D** `ctx.fill(path)` / `ctx.stroke(path)` (:236-244). **Output is pixels on the loop canvas; no SVG `d` string is emitted anywhere.** The source app's SVG bake is explicitly not ported: "The source's 'filter' preview (feTurbulence) is not ported — the bake path was the app's own export truth" (:12-13). Export of a loop layer is a raster snapshot (src/editor/compose/build.js:406-416, 507-508). Cache: `(frequency|src)` → parsed, 16 entries (:84-90); URLs fetched once, falling back to `DEFAULT_SVG` (circle + stroked rect, `currentColor`) (:19-22, :99-101). No source ⇒ default art, "so a preset is never a blank stage" (presets.js:4-5).

Def: `id:'vector-distress'`, `label:'Distressor'`, `group:'distress'`, `kind:'2d'`, `duration: 6` (engine.js:177-182).

| key | label | type | range / options | default | flags | line |
|---|---|---|---|---|---|---|
| bg | Background | color | role `bg` | `#121215` | — | engine.js:184 |
| ink | Ink | color | role `fg` (resolves `currentColor`) | `#e8e4dc` | — | :185, :236 |
| mode | Mode | select | `print-press` · `noise` · `jitter` · `hand` · `roughen` · `tear` · `ink-spread` · `offset`(label 'Misregister') | `print-press` | — | :186, :166-175 |
| amount | Amount | range | 0–80 step 1 | 24 | — | :187 |
| frequency | Frequency | range | 1–100 step 1 | 30 | also keys the sample cache | :188, :86 |
| smoothness | Smoothness | range | 0–100 step 1 | 20 | — | :189 |
| seed | Seed | range | 1–9999 step 1 | 7 | `noRandom` | :190 |
| motion | Motion | range | 0–8 step 1 | 2 | `noRandom`; wave modes: `uPhase = TAU·u·motion`; random modes re-seed `motion·2`× per loop | :191, :202-207 |
| size | Reach | range | 0.4–1 step 0.02 | 0.8 | fit scale `min(w·size/vw, h·size/vh)` | :192, :213 |
| svgSrc | — | (off-schema) | markup string or URL | — | set by LabsSourcePicker only | :198; src/editor/labs/LabsSourcePicker.jsx:51, 66 |
| vpTime / vpSpeed / vpPhase | Time / Speed / Phase | select / range 1–4 / range 0–1 | folded by registry | linear / 1 / 0 | tab `anim`, section `Form` | src/loops/registry.js:58-62; src/loops/lib/viewport.js:46-50 |

Mode recipes (engine.js:108-137): `noise` sin/cos of `phase=(t·freq·2+seed·0.1)π+uPhase`; `jitter` hashed ±0.5·strength; `hand` 0.8·strength sines at 0.6/0.9 phase; `roughen` quantised-to-¼ hash ×1.2; `tear` sawtooth ×2.2 with 1.8 spikes when hash>0.86; `ink-spread` 0.4·jitter; `offset` fixed-angle `(seed%360)°` translate ×0.6 + 0.2 jitter; default `print-press` hash × (0.9 or 1.7 spike). `freq` maps `frequency≤50 → f/6`, else `50/6 + (f−50)/8` (:209).

Presets (8, three `sub`s): Erosion `dst-press`, `dst-roughen`, `dst-tear`; Wobble `dst-hand`, `dst-noise`, `dst-jitter`; Print `dst-ink`, `dst-misregister` (presets.js:13-25). Labs leaves are these three subs (catalog.js:157-175, :238).

**How the SVG gets in (and that it currently can't).** `useSourceInput` switches to `svgMode` when `layer.type === 'loop' && layer.loopGroup === 'distress'` (LabsSourcePicker.jsx:39-43): upload reads the file as text → `patch({ svgSrc })` (:49-54), library pick → `patch({ svgSrc: proxied(url) })` (:66), file input `accept=".svg,image/svg+xml"` (:81), `MediaPickerDialog accept={isSvgObject}` (:84, :12), Camera hidden (:130-131, :143). But the two mounts are gated on PHOTO layers: `needsSource = layer?.type === 'photo' && !layer.src && …` (src/editor/labs/LabsView.jsx:76, mount :137) and `pickerOpen = screen === 'live' && active?.type === 'photo' && …` (src/editor/mobile/MobileView.jsx:186, mount :306). `SourceStrip` (LabsSourcePicker.jsx:106-122, the rail strip meant to carry Library/Upload) has **no consumer** in `src/` (only a comment at src/editor/mobile/MobileOverlay.jsx:61). `svgSrc` is written nowhere else (grep). ⇒ Today the Distressor always renders `DEFAULT_SVG`.

Chrome measured: full-pane door buttons are `Button tone="primary" size="lg"` with `SPREAD = 'w-full [&>span]:w-full [&>span]:justify-between'` (LabsSourcePicker.jsx:141-144; src/editor/mobile/CategoryScreen.jsx:9), Back is `tone="grey" size="lg"` (:163); the card is `kol-overlay-scrim`, `zIndex: var(--kol-z-modal)` (=100, kol-theme/kol-design-tokens.css:143), panel `max-w-sm rounded p-8 gap-6` on `var(--kol-surface-primary)` (:156-157; `#121215` dark / `#fafafa` light, kol-theme/kol-base-tokens.css:110/47), title `kol-eyebrow text-body` (:159; kol-type-roles.css:285), hint `kol-mono-12 text-meta` (:160; kol-type-mono-classes.css:34). The strip is `SegmentedToggle value={null} size={cs}` + `stripClamp(cs)` (:111-117; `STRIP_CLAMP` src/editor/params/controlSize.js:38). Components: node_modules/@kolkrabbi/kol-component/src/atoms/Button.jsx (sizes `xs|sm|md|lg` :16), …/atoms/SegmentedToggle.jsx.

---

## 3. Modulator (`modulator-rings`)

**Input → output.** No input at all — a parametric generator. Draws `1 + 2·(rings−1)` concentric rings as 240-segment `lineTo` polylines, radius `r = R + ringAmp·sin(cycles·a + driftPhase + pairPhase)`, `ctx.stroke()` (src/loops/modulator/rings.js:53-78). Output = pixels. Seamless by `u`: `breath = |sin(TAU·u·round(breaths)·0.5)|`, `driftPhase = TAU·u·round(drift)`, integer `cycles = max(1, round(frequency/10))` (:44-48). Def `id:'modulator-rings'`, `label:'Modulator'`, `group:'modulator'`, `kind:'2d'`, `duration: 6` (:16-20).

| key | label | type | range | default | flags | line |
|---|---|---|---|---|---|---|
| bg | Background | color | role bg | `#0b0b0e` | — | rings.js:22 |
| ink | Ink | color | role fg | `#e8e4dc` | — | :23 |
| intensity | Intensity | range | 0–400 step 5 | 200 | amp term `intensity·0.05` | :24, :46 |
| frequency | Frequency | range | 10–200 step 5 | 100 | → integer cycles | :25, :48 |
| rings | Rings | range | 1–8 step 1 | 3 | `noRandom` | :26 |
| separation | Separation | range | 0–40 step 1 | 16 | ×depth ×(1+breath) | :27, :73 |
| breaths | Breaths | range | 1–4 step 1 | 2 | `noRandom` | :28 |
| breathAmp | Breath amp | range | 0–40 step 1 | 10 | — | :29 |
| drift | Drift | range | 0–6 step 1 | 1 | `noRandom`; whole turns/loop | :30, :45 |
| depth | Depth | range | 10–100 step 1 | 50 | `scale = depth/100` | :31, :42 |
| size | Reach | range | 0.4–1 step 0.02 | 0.7 | `R = min(w,h)/2·size` | :32, :41 |
| weight | Weight | range | 0.5–8 step 0.5 | 2 | `lineWidth` | :33, :51 |
| vpTime/vpSpeed/vpPhase | — | — | folded | — | — | src/loops/registry.js:58-62 |

Presets (6): Pulse `mod-pulse`, `mod-pulse-deep`, `mod-pulse-soft`; Weave `mod-weave`, `mod-weave-fine`, `mod-weave-drift` (src/loops/modulator/presets.js:11-20). Labs-only for the same taxonomy reason (taxonomy.js:19-33 omit it; :52 legacy label). Despite the "Vector" shelf (catalog.js:230-232) it neither eats nor emits a path — it is a ring *generator* drawn to canvas; as a shape parameter it would be a "sine-warped ring" primitive (radius modulation), not an effect on existing geometry.

---

## 4. Morph engines

### 4a. `src/editor/morph/shape.js` — canvas-outline morph (Shape mode)

| export / fn | signature | what it does | line |
|---|---|---|---|
| `recordOutline` | `(draw, u, w, h, p, backing) → subs[]` | Runs a generator's `draw` against a `Proxy` over a real 2D ctx; captures `moveTo/lineTo/arc/ellipse/beziers/rect/fillRect` as point lists in canvas space (CTM read per point); each `fill/stroke` closes a record `{ pts, closed, op, style, alpha, lineWidth, rule }`. Curves flattened at `CURVE_SEGS = 12`, arcs 8–96 segs. | shape.js:45-111; :30-31; :42-43 |
| **`resample`** | `(pts, closed, N) → [[x,y]…]` | N points evenly spaced by arc length (closed includes closing segment) | :123-141 |
| **`align`** | `(a, b, closed, memo) → b'` | Closed: rotates `b`'s start to the offset minimising Σd²; open: picks direction; `memo` keeps last choice within `STICK = 1.1` to stop frame-to-frame flips | :143-174 |
| `mixStyle` | `(a, b, k)` | per-channel rgba lerp for hex/rgb(a); else nearer step's | :179-195 |
| `chunk` (internal) | `(subs, m)` | folds many subpaths into `m` contiguous runs | :199-209 |
| `blendPair` (internal) | `(x, y, k, N0, memo)` | `N = max(64, min(512, max(len)))` or forced `N0 ≥ 3`; `prep` (resample + CCW), `align`, lerp points, lerp `lineWidth`, `mixStyle`; fill-vs-stroke crossfades on shared geometry | :210-224; :176 |
| `pairAll` (internal) | `(a, b, k, N, memos)` | bg↔bg, fg↔fg in draw order; unmatched collapse to centroid | :225-232; :177 |
| **`morphOutlines`** | `(A, B, k, frame=∞, resolution=0, memo) → subs[]` | **the blend-between-two-outlines function**: splits backgrounds (`isBg` = closed fill ≥ 90 % of frame), pairs, returns subpaths k of the way | :234-239; :198 |
| `paint` | `(ctx, subs, mul=1)` | polyline paint (`moveTo/lineTo`, `closePath`, fill rule) | :241-253 |
| `hasOutline` | `(def)` | `typeof def.draw === 'function' && def.kind !== 'engine'` | :266 |
| `outlineOf` | `(def, u, w, h, p, ctx?)` | `recordOutline` on a module-level backing canvas | :256-271 |
| `morphKeys` | `(n, cycle, curve)` | `morphT` track keys | :274-277 |
| `drawShapeMorph` | `(ctx, u, w, h, p, lookup)` | records A and B at `u`, `morphOutlines`, edge-fades the real step in over `EDGE = 0.12` | :280-306 |
| `drawCrossfade` / `canCrossfade` / `crossfadeMorphDef` | — | 3rd mode: step B painted into a scratch canvas, composited at `k` | :308-352 |
| `shapeMorphDef` | `(lookup, loopId)` | renderer def for a `morph.mode === 'shape'` layer | :354-365 |

Answer to (3): **yes** — `resample` + `align` + the lerp in `blendPair`, wrapped by `morphOutlines`, already do point-to-point blending between two polyline sets. What is missing for a 'Blend' vector effect between two selected shape/path layers: (a) input today is a *recorded canvas draw*, not the editor's path-node model `{x,y,in,out}`; (b) output is `paint()` to canvas, not nodes/`d`; (c) no bézier-node → polyline flattener exists in `src/` (the only flattening is the recorder's `CURVE_SEGS = 12`, shape.js:81-94; `paper` is a dep via src/editor/compose/boolean-ops.js:18 but `.flatten/.simplify/.smooth` are never called — grep empty). Node-side helpers available: `shapeToPathNodes(layer)` turns rect/ellipse/triangle/polygon/star/line into nodes (src/editor/compose/shape-math.js:65-80); `pathD(nodes, closed)` serialises nodes (node_modules/@kolkrabbi/kol-component/src/hooks/pathMath.js:29, re-exported at src/editor/compose/path-math.js:5-8).

Morph layer model: `morph.mode ∈ 'shape' | 'blend' | 'crossfade'` (src/editor/morph/morphStore.js:15); Shape `resolution` 0–1024, 0 = Auto (src/editor/morph/MorphTab.jsx:47); renderer picks the def by mode (src/editor/compose/LayerRenderer.jsx:33-35). **'Blend' already means the param tween** (`buildMorph`, src/editor/morph/buildMorph.js:4-27; MorphTab.jsx:28).

### 4b. `src/editor/modes/type/morph.js` — glyph-outline morph (the ex-kinetic engine)

| export | role | line |
|---|---|---|
| `commandsToPath(cmds)` | opentype commands → SVG `d` (M/L/C/Q/Z, 2 dp) | morph.js:68-81 |
| `commandsMatch(a, b)` | same length + same op sequence | :83-87 |
| `lerpCommands(a, b, t)` | per-control-point lerp (keeps béziers) | :89-101 |
| `commandsBbox` | bbox of all x/x1/x2… | :103-110 |
| `curveBlend(t, curve, phase, cp1, cp2)` | per-letter blend distribution (flat/linear/reverse/ease/expo-in/expo-out/log/sine/custom) | :157-171, :173-183 |
| `MORPH_MODE_OPTIONS` | `morph` · `fade` · `random` | :185-189 |
| `buildMorphGlyphs(fontA, fontB, text, size, cfg)` | lerps when topology matches else "pop to the closer cut at 0.5" | :195-256 (:244-248) |

This is a second, bézier-preserving blend (same-topology only) that *does* emit SVG `d`. Consumers: src/kinetic/KineticType.js:5, 285-300; src/editor/modes/type/MorphedText.jsx keeps its **own** `commandsToPath` / `commandsMatch` / `lerpCommands` (MorphedText.jsx:25, 45, 53) despite morph.js:1 saying MorphedText "share[s] it".

### 4c. Shape-family loops named "morph" (`morph-circle`, `star-morph`, `square-circle`) are plain 2d generators (src/loops/shape/morphCircle.js:10; starMorph.js:7; squareToCircle.js:8) — not engines.

---

## 5. The filter chain — raster only

Model: `layer.filters = [{ id, key, enabled, params }]`, `MAX_FILTERS = 8`, at most one `kind:'engine'` stage and always last; render order by TIER regardless of array order: canvas (`apply`) → pixi batch (`kind:'pixi'`) → terminal GL engine (src/editor/compose/filterChain.js:4-24, :42, :157-171). Defs resolve through `pack('effects')` (filterChain.js:39-40; src/packs/effects.js:10-16). Filter contract: `apply(ctx, src, w, h, p, u)` where **`src` is a canvas holding the FITTED source image** (src/filters/index.js:16-21); engine defs carry `kind:'engine' + engine:'<key>'` (:23-25). `runChain` feeds one stage's canvas into the next (src/filters/fxCore.js:107-125); `runFx` works on `ImageData` buffers (:40-48, :127-142). Pixi: one persistent `Application`, canvas → `Texture(CanvasSource)` → `sprite.filters` → `extract.canvas` (src/filters/pixi/pipeline.js:20-30, :74-120). GL: `setSource(def, engine, srcCanvas)`, dt-driven, free-running (src/filters/gl/host.js:1-17; src/filters/gl/catalog.js:7-9).

Vector layers (`shape`/`path`/`bool`/`text`/`pattern`) with a chain render through `EffectedLayer`, whose source is the layer's **own SVG rasterised** by `rasterizeLayer` (src/editor/compose/LayerRenderer.jsx:98-103, :120-131; src/editor/compose/rasterizeLayer.js:1-16). Which layer types may host effects: `photo`, `shape/text/pattern/path`, non-engine `loop/misc` (src/editor/compose/inspectors/effectCategories.js:133-144). ⇒ **No stage anywhere operates on vector geometry; every family consumes and emits pixels.**

| Family (file) | ids | tier | operates on | line |
|---|---|---|---|---|
| Glass (displacement sheet) | `glass` (preset param `pattern`) | canvas | ImageData displacement | src/filters/glass.js:250-266 |
| Scanline | `scanline` | canvas | luma sampler → marks | src/filters/scanline.js:57-107 |
| Dither (reaction-diffusion) | `dither` | canvas, free-running | brightness → Gray-Scott field | src/filters/dither.js:1-15, :73-80 |
| Radar post-fx | `fx-chromatic`, `fx-edge`, `fx-posterize`, `fx-pixelsort`, `fx-mirror`, `fx-kaleido`, `fx-threshold` (7) | canvas | pixel processors via `runFx` | src/filters/fxRadar.js:1-12, :239-341 |
| Halftone trio | `fx-ascii`, `fx-halftone-dither`, `fx-bitmap` (`sweeps: true`) | canvas (draw-based) | luma cells → glyphs/dots | src/filters/fxAscii.js:65-69; fxHalftoneDither.js:165-169; fxBitmap.js:161-165; sweeps.js:1-16 |
| Effects canvas tier | `fx-hsl`, `fx-hsv`, `fx-brightness`, `fx-contrast`, `fx-rgb`, `fx-invert`, `fx-sepia`, `fx-grayscale`, `fx-enhance`, `fx-blur`, `fx-pixelate`, `fx-solarize`, `fx-emboss`, `fx-noise` (14) | canvas | ImageData | src/filters/fxEffects.js:1-17, :461-628 |
| GL engines | `gl-trails`, `gl-scan`(Rutt-Etra), `gl-slitscan`, `gl-disco`, `gl-distort`, `gl-lens` (6) | engine (terminal) | three.js textures | src/filters/gl/catalog.js:33-219 |
| Pixi GPU | 35 `filter-*` defs in groups color-adjustments · blur-sharpen · distortion (displacement, twist, bulge-pinch, shockwave) · artistic · lighting · stylize · utility | pixi (batched) | pixi-filters on a sprite | src/filters/pixi/defs.js:1-22, :40-255 (count 35) |

Total registered: 1+1+1+7+3+14+6+35 = **68** (src/filters/index.js:38-53). Nav categories over them: Halftone · Scanline · CRT · Refraction · FX rack · Pattern(`['dither']`) (effectCategories.js:16-26); rack groups :31-44. Raster "distortion"-shaped knobs that *look* like vector ops: pixi `filter-twist` (defs.js:112-116), `filter-displacement` (:105-111), `filter-bulge-pinch` (:117-121); gl-disco `twist` (gl/catalog.js:122); gl-lens surfaces (:189-190). All pixel-space.

---

## 6. Path-operation grep (simplify · smooth · offset · roughen · zigzag · twirl · warp · wobble · jitter)

| word | real geometric path op? | what the hit actually is | where |
|---|---|---|---|
| simplify | **no** | a dropped labs param key listed in a comment | src/loops/paratype/glyph.js:18-21 |
| smooth | partial | `smoothNode(nodes, i, closed)` — ONE anchor gets mirrored handles ~⅓ of each chord (pen tool); not a path smoother | node_modules/@kolkrabbi/kol-component/src/hooks/pathMath.js:205-225 via src/editor/compose/path-math.js:5-8 |
| smooth | yes (polyline) | Distressor `smoothness` = box filter over per-point offsets, window `round(s/30)` | src/loops/distress/engine.js:189, :210, :221-232 |
| smooth | no | `smoothstep` for alpha; binding EMA (`makeSmoothingState`); Catmull-Rom in skeleton | src/editor/morph/shape.js:304; src/editor/compose/useComposeFile.js:243-250; src/loops/paratype/skeleton.js:10 |
| offset | **yes** (centerline → outline) | `strokeOutline(centerline, halfThickFn, segments=80)` offsets a polyline ±halfThick along normals, closes with Catmull-Rom | src/loops/paratype/skeleton.js:21-34 |
| offset | no | Distressor mode `offset` = fixed-angle translate ("Misregister"); pattern-rule selector index offset; kinetic line y-offset; bool refit | src/loops/distress/engine.js:127-133; src/loops/pattern/rules.js:33, :84-89; src/kinetic/paths.js:103-106; src/editor/compose/boolean-ops.js:207-242 |
| roughen | yes (polyline) | Distressor mode `roughen` (quantised ¼-step hash ×1.2) | src/loops/distress/engine.js:118-120; presets.js:16 |
| zigzag | generator only | `case 'zigzag'` builds a polyline `d` for type-on-path (`freq·2` points, `amp·h·0.28`) — makes a path, does not transform one | src/kinetic/paths.js:92-99; src/kinetic/knobs.js:43 |
| twirl | **no** | preset id `double-twirl` = radial arrangement `path:{type:'radial', spin:2}` | src/kinetic/presets.js:86-87 |
| warp | no | `warpTime(u, p)` warps the CLOCK; weave warp/weft threads; GL shader params | src/loops/lib/viewport.js:53-60; src/loops/pattern/patternLoop.js:79, :101-102 |
| wobble | no (frame camera) | `vpWobble` rotates the whole frame ±deg; blob loop `amp` 0–0.4 'Wobble' | src/loops/lib/viewport.js:88-94; src/loops/shape/blob.js:4, :17 |
| jitter | yes (polyline) / raster | Distressor mode `jitter`; halftone-dither `jitter` mode (raster) | src/loops/distress/engine.js:116; src/filters/fxHalftoneDither.js:163 |
| boolean | yes (bézier-true) | paper.js unite/subtract/intersect/exclude on closed shape/path layers; no `.simplify/.smooth/.flatten` calls | src/editor/compose/boolean-ops.js:1-22, :140, :184 |

Net: the only general-purpose vector transforms on the editor's node model are the paper.js booleans and per-node `smoothNode`. Every "roughen / jitter / offset / smooth" lives inside the Distressor on sampled polylines; the only offset-by-normal lives in the paratype skeleton; nothing simplifies, twirls or warps geometry.

---

## 7. Where "Pattern" lives — six different referents

| referent | what it is | where |
|---|---|---|
| Layer type `pattern` | a core vector layer: `ALL_LAYER_TYPES` `{ id:'pattern', label:'Pattern' }`; in `COLOR_LAYER_TYPES`, `POSITIONED_TYPES`; defaults `fullCanvas({...PATTERN_DEFAULTS, color:'palette:secondary'})`; renders `buildPatternSvg` (`<symbol>+<use>` SVG) via `PatternLayer`; exports via `patternLayerSvg`; `flattenPattern` bakes to `shape{kind:'flatten'}` in a `group`; library insert slot `pattern` | src/editor/compose/state.jsx:418, :32, :304, :442, :1393-1439, :1642-1650; src/editor/compose/LayerRenderer.jsx:98-103, :598-610; src/editor/compose/build.js:495-499; src/editor/modes/pattern/render.js:1-17 |
| Tool `pattern` | `TOOLS` entry, `TOOL_META.pattern = { label:'Pattern', icon:'pattern-tool' }`; palette row; shortcut case `tool-pattern`; drag-commit `addLayer('pattern', extras)` | src/editor/state/tools.jsx:13, :25; src/editor/shell/panels/ToolPalette.jsx:74; src/editor/compose/CanvasArea.jsx:1259, :1082 |
| Pattern mode / tab | `PatternStateProvider`; `PatternPanel` reads `layer.type === 'pattern'`; selection palette adds a 'Pattern' tab; context menu 'Pattern parameters' → `kol:open-pattern`; ParametersPanel → `PatternFields` | src/editor/modes/pattern/state.jsx:1-40; src/editor/compose/inspectors/PatternPanel.jsx:49; src/editor/shell/panels/SelectionPalettePanel.jsx:41; src/editor/compose/CanvasArea.jsx:1620; src/editor/compose/inspectors/ParametersPanel.jsx:111-112; LayerInspector.jsx:286 |
| Generative TYPE 'Pattern' = registry group `pattern` | one engine `pattern-rules` + presets (Stripes/Tartan/Blocks/Organic/Interlace/Weave); `GENERATIVE_TREE` `{ label:'Pattern', groups:['pattern'] }`; `patternloop` group = 'Pattern Loops' | src/loops/pattern/patternLoop.js:235; src/loops/pattern/presets.js:1-12; src/loops/taxonomy.js:21-22; src/loops/registry.js:35-36; src/loops/contract.js:13 |
| Effects category `pattern` | `CATEGORIES` `{ id:'pattern', label:'Pattern', filterIds:['dither'] }`; Effects menu excludes it from the main nests and renders a dedicated "Pattern" nest = dither + four generator categories (`FX_PATTERN_CATEGORIES`); labs `fx:pattern` → `PATTERN_PAGES` (Moiré · Mesh Gradient · Reaction · Halftone, group `optic`) | src/editor/compose/inspectors/effectCategories.js:25; src/editor/shell/MenuTop.jsx:274, :162-167, :294-310; src/editor/labs/catalog.js:73, :202-207 |
| Library slot `pattern` | saved pattern specs (`savePattern`, `SLOT_KEYS`, `ALL_KINDS`) | src/editor/library/LibraryProvider.jsx:33, :461; src/editor/library/FilesDialog.jsx:41; src/editor/shell/MenuTop.jsx:53; src/pages/LibraryPage.jsx:38, :57 |
| Glass param `pattern` | a select on the `glass` filter (`panes`…), its preset param | src/filters/glass.js:256; effectCategories.js:105 |

Icons: `'gen:Pattern': 'ptrn-checker'` and `'fx:pattern': 'ptrn-checker'` (same glyph for two different things, src/editor/labs/catalog.js:33, :36); tool uses `pattern-tool` (tools.jsx:25). All present in kol-icons cuts.json.

---

## 8. Engine → input → reachability

| engine | id / entry | input kind | emits | reachable today | file |
|---|---|---|---|---|---|
| Distressor | `vector-distress` | **vector** (SVG markup/URL via `svgSrc`) — but the door is gated off (§2) | raster (Path2D → canvas) | labs rail VECTOR section only (catalog.js:233-239); editor inspector read-only label; not in Generative menu, mobile, or Effects | src/loops/distress/engine.js |
| Modulator | `modulator-rings` | none (parametric) | raster | labs rail VECTOR section only (catalog.js:240-245) | src/loops/modulator/rings.js |
| Outline morph (Shape) | `shapeMorphDef` / `morphOutlines` | recorded canvas draw (any 2d loop def) | raster (`paint`) | labs Morph rail (MorphTab) and any loop layer with `morph.mode:'shape'` (LayerRenderer.jsx:33) | src/editor/morph/shape.js |
| Param tween (Blend) | `buildMorph` | N presets of one generator | tracks on the layer | Morph rail mode 'blend' | src/editor/morph/buildMorph.js |
| Glyph morph | `buildMorphGlyphs` | two opentype fonts/coords | **SVG `d` strings** | kinetic layer `morph.on` (KineticType.js:289); type mode MorphedText (own copy) | src/editor/modes/type/morph.js |
| Pattern rules loop | `pattern-rules` | none | raster | Generative > Pattern; Effects > Pattern nest | src/loops/pattern/patternLoop.js |
| Pattern layer | type `pattern` | shape SVG + rules | **SVG** (and flatten → shape) | Tool palette, Insert, library, Pattern tab | src/editor/modes/pattern/render.js; state.jsx:1393 |
| Paratype skeleton / flatten | `buildParatypeFlattenGroup` | params | **SVG paths** as `shape{kind:'flatten'}` children | misc layer (MISC_TREE) → flatten | src/loops/paratype/flatten.js:1-13, :50; skeleton.js:21-34 |
| Boolean ops | `computeBoolean`, `booleanCombine` | closed shape/path layers | **bézier nodes + holes** | Tool palette Boolean fold (ToolPalette.jsx:85) | src/editor/compose/boolean-ops.js |
| Filter chain (68 defs) | `runChain`, `applyPixiStack`, GL host | raster (vector layers pre-rasterised) | raster | Effects menu/panel/context menu; labs EFFECTS | src/filters/*, src/editor/compose/filterChain.js |

---

## Contradictions

1. **Distressor source door is unreachable.** `useSourceInput` writes `svgSrc` for `loop`/`distress` (src/editor/labs/LabsSourcePicker.jsx:39-43, :51, :66), yet both mounts gate on `type === 'photo'` (src/editor/labs/LabsView.jsx:76; src/editor/mobile/MobileView.jsx:186); `SourceStrip` has no consumer (src/editor/labs/LabsSourcePicker.jsx:106 vs only a comment at src/editor/mobile/MobileOverlay.jsx:61). The catalog card's comment claims otherwise: "Effects and Vector then ask for their media (LabsSourceCard)" (src/editor/labs/LabsCatalogCard.jsx:12).
2. **Mesh Gradient resolves to two different (group, sub) pairs.** Mesh presets carry `sub: 'Mesh Gradient'` and are registered under `optic` (src/loops/gl/catalog.js:324-327; src/loops/registry.js:72); labs reads `presetsInSub('optic', 'Mesh Gradient')` (src/editor/labs/catalog.js:73, :205); the desktop Effects menu reads `{ group:'gradients', sub:'Mesh' }` (src/editor/shell/MenuTop.jsx:164, :306) — no preset in `src/loops` has `sub:'Mesh'` (grep), so that nest is empty.
3. **Pixi adapter vs defs.** `createPixiFilter` has cases `filter-emboss`, `filter-grayscale`, `filter-pixelate` (src/filters/pixi/adapter.js:182-187) with no def in `PIXI_FILTERS` (src/filters/pixi/defs.js:40-255, 35 ids; header says "the 35", :3).
4. **Registry header vs imports.** "the pattern group (opentype dep) is excluded per the plan" (src/loops/registry.js:6-7) vs `import { PATTERN_LOOPS, PATTERN_PRESETS }` (:15) and `pattern: PATTERN_PRESETS` (:65).
5. **Taxonomy comments vs map.** "NOT here by design: `optic` … and `paratype`" (src/loops/taxonomy.js:14-17) and "(optic → EFFECTS > Pattern, paratype → the misc layer)" (:42-45; echoed at src/editor/compose/inspectors/LoopPicker.jsx:23-25) omit `distress`/`modulator`, which `LEGACY_GROUP_LABELS` also fences (:51-52).
6. **"Vector" shelf vs what Modulator is.** The VECTOR section is "tools that make or eat PATHS" (src/editor/labs/catalog.js:230-232; docs/documentation/01-hierarchy/INDEX.md:46 "Makes or eats PATHS"), but `modulator-rings` takes no path and strokes pixels (src/loops/modulator/rings.js:53-67); the Distressor eats SVG but also emits only pixels (src/loops/distress/engine.js:236-244), its SVG bake deliberately unported (:12-13).
7. **Loop contract `kind` vocabulary.** `kind: '2d' | '3d'` (src/loops/contract.js:14) vs the live checks `kind === 'engine'` (src/loops/registry.js:193; src/editor/morph/shape.js:266) and nine `kind: 'engine'` defs (src/loops/gl/catalog.js:99, :120, :202).
8. **Two glyph-morph implementations.** morph.js:1 says "kinetic type and the type mode's MorphedText share it", but MorphedText defines its own `commandsToPath`/`commandsMatch`/`lerpCommands` (src/editor/modes/type/MorphedText.jsx:25, :45, :53) and imports `curveBlend` from `./curveMath`, not from morph.js.
9. **"Blend" already has two meanings** before any vector effect takes the name: the Morph rail's param tween (src/editor/morph/morphStore.js:15; MorphTab.jsx:28) and the glyph-morph's per-letter amount `cfg.blend` (src/editor/modes/type/morph.js:198, :203).
10. **"Pattern" names six things** (§7): layer type (state.jsx:418), tool (tools.jsx:25), generative group (taxonomy.js:21), effects category (effectCategories.js:25), library slot (LibraryProvider.jsx:33), glass param (glass.js:256); `gen:Pattern` and `fx:pattern` share the `ptrn-checker` icon (catalog.js:33, :36).
11. **Doc vs code name.** docs/documentation/01-hierarchy/INDEX.md:60, :102 cite `PIXI_GROUPS`; effectCategories.js exports `FX_RACK_GROUPS` (:31) and no `PIXI_GROUPS` (grep).
12. **Two size rungs in one source surface.** Door buttons are hard `size="lg"` (LabsSourcePicker.jsx:141-144, :163) while the strip takes `size={cs}` from `useControlSize()` (:107, :115).
13. **Brief vs tree.** The brief names `src/kinetic/morph.js`; it does not exist — the file is `src/editor/modes/type/morph.js` (header :1-3 records the 2026-09-27 move).

## Open questions

- Was the `SourceStrip` mount (the rail's Library/Upload row) removed on purpose, and is the Distressor's SVG door meant to return? History is flat at fxr-1001 (every labs file is an add in `git show 07d85a1`), so the removal cannot be traced in this repo.
- The engine relies on `getPointAtLength` for detached/attached SVG geometry; engine.js:14-15 flags Firefox as unverified — no test or fallback exists.
- For a 'Blend' vector effect on two selected layers: which side should own flattening (paper.js `flatten`, a new node→polyline sampler, or `Path2D` + `getPointAtLength`)? Nothing in `src/` flattens the node model today; `shape.js` only flattens *canvas calls*.
- Should Distressor/Modulator move under `MISC_TREE` (taxonomy.js:38-40, already the home for "oddball rule-driven generators") as the quickest route into the editor picker, or stay a separate VECTOR method per docs/documentation/01-hierarchy/INDEX.md:46? The code does not say.
- Is the empty "Mesh Gradient" nest in the desktop Effects > Pattern menu (MenuTop.jsx:164) known? No test covers `presetsInSub` returning `[]`.
- Mobile has no VECTOR entry (CategoryScreen.jsx:47 iterates `GENERATIVE_TREE` only) — intended parity gap or oversight?
- The Distressor's `Path2D` builder (engine.js:140-164) uses `bezierCurveTo`; emitting an SVG `d` would be a near-mechanical change, but no serializer exists for `Path2D` or for the editor node model from this engine — which output format would a vector effect target (node model `{x,y,in,out}` vs raw `d`)?
