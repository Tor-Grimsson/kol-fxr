---
title: Rendering fork — hybrid DOM/GL vs. full GL scene
type: decisions
status: archived
updated: 2026-07-01
description: The pivotal bet for effects + 3D — composite WebGL layers inside the DOM stack, or rebuild on a unified GL scene. Resolved by an effects-repo audit to Option A (per-layer hybrid); fully executed.
aliases:
  - render-fork
  - render-fork-rfc
  - rendering-fork
tags:
  - project/kol-fxr
  - editor/rendering
  - domain/architecture
  - domain/webgl
related:
  - "[[2026-07-01-param-graph|param-graph decision]]"
  - "[[../04-effects/INDEX|effects]]"
  - "[[INDEX|research index]]"
---

# Rendering fork — hybrid DOM/GL vs. full GL scene

The one decision that can't be answered from the armchair. Effects (unicorn-style, full-frame shaders) and the 3D layer are WebGL; the compositor is DOM/SVG. How GL content composites with the rest is the fork.

## Why

Everything else on the roadmap runs on today's DOM/SVG base. Effects and 3D do not. Guessing wrong here means either an effects system that can't do full-frame post, or bulldozing the vector editor — the §4 mistake. This RFC exists to force a **spike before commitment**.

## Current state

`LayerRenderer` renders each layer as a positioned DOM/SVG element inside the 1080-virtual stage. Crisp text, live vector editing, cheap authoring — all things a raw GL scene gives up. Nothing GL exists yet.

## Options

### A — hybrid: GL layers as positioned `<canvas>` (recommended starting point)
Each effect / 3D layer is an offscreen GL canvas positioned like any other layer. Preserves the entire vector editor; effects and 3D slot in as new layer types via the registry seam.

- **Wins:** zero disruption to shipped work; text/vector stay DOM; per-layer effects and 3D are straightforward.
- **Loses:** *full-frame* effects that sample the composited result below them (grain over everything, whole-scene displacement) are hard — DOM layers aren't a texture. Cross-compositing a GL blur over live vector text isn't cheap.

### B — full GL scene (what unicorn.studio actually is)
Everything becomes a quad/texture in one GL context; full-frame post is native.

- **Wins:** full-scene effects, uniform compositing, the real unicorn/effect model.
- **Loses:** rebuilds text, vector editing, accessibility, crisp UI — throws away the shipped editor. High risk, direct §4 violation.

### C — hybrid + rasterize-on-demand
Hybrid for authoring; when a full-frame effect needs the scene as a texture, rasterize the DOM/SVG stack to a texture for preview/export only.

- **Wins:** most of A's safety plus full-frame effects where they matter.
- **Loses:** dual representation has sync cost; real-time full-frame post over *live-editable* vector text is the one thing it still can't do cheaply — a deliberate ceiling.

## Recommendation

Start at **A**, keep **C** as the escape hatch for full-frame effects. Do **not** entertain B without a hard reason — it's the bulldoze §4 forbids. Resolve A-vs-C empirically with the spike below rather than deciding now.

## Audit findings (kol-labs-single effects repo, 2026-07-01)

The "how many need full-frame" question is now answered — three parallel read-only audits of `/Users/biskup/dev/projects/kol-apparat/kol-labs-single`. Verdict: **Option A covers everything this repo does; Option C is not needed for it, and Option B is ruled out on facts.**

- **~90% of effects are self-contained** (~40 families / ~125 individual effects+presets) — render purely from params/noise/geometry/fonts, one canvas each. They drop into a per-layer host with zero compositing plumbing: all `src/loops/` (29), all math (15), gradient/softforms/drift three.js scenes (~11), penrose (~45), optic generators (4), pattern, kinetic/type/para-type, the 16 p5 interface widgets.
- **~12 are scene-samplers** (Effects filter-stack, Glass, Live, Radar ×8, Abstract-Dither, dual-mode Scanlines). **Load-bearing finding: each samples its OWN explicitly-uploaded image/video/webcam asset (via `radar/state/ImageContext` or a file input) — none reads the composited output of the layers beneath it.** The one thing the hybrid can't cheaply do (feed an effect the scene below) is a capability **no effect in the repo uses**. So even the scene-samplers host as isolated layers, provided the host hands each its own source asset — which is exactly the photo-layer + image-insert already shipped.
- **Heterogeneous renderers** (canvas2d bulk, three.js ~17, p5 ×16, pixi+pixi-filters ×1, raw WebGL ×1, SVG ×3–4) → the host must host arbitrary offscreen canvases. **This rules out B** (single shared GL context) on facts. Note: the pixi *tier* internally shares one WebGL app — a sub-detail of that one effect family, not a host constraint.
- **No 3D effect actually ships** — `three` is a dep and ~17 effects use it, but there is no generic "3D layer/scene" primitive (`src/loops` is 2D-only; a `PrimitiveEngine` is referenced in comments only). The 3D-layer roadmap item is genuinely new work, not an import.

**Revised recommendation:** commit to **A (per-layer hybrid)**. Treat **C as deferred-maybe-never** — nothing in the effects repo needs scene-as-texture; revisit only if a future effect must post-process the composition itself. **B is off the table.** Import target for cut one: `src/loops/` shape+field loops (pure `draw(ctx,u,w,h,params)` modules, ~5-file zero-npm runtime, already an extension seam). Exclude the pattern loop (drags opentype) and the effects pixi tier (drags pixi.js) from the first cut.

## Phases

1. **Spike** — one WebGL layer type: an offscreen canvas rendering a trivial shader, positioned/scaled/rotated as a normal layer, honoring opacity + the transform pipeline. Measure: does it slot into the layer model cleanly? What breaks with blend modes over DOM layers?
2. **Decide** — from the spike, pick the compositing model (per-layer GL only, or add rasterize-on-demand for full-frame). Record the call in ARCHITECTURE as a new decision.
3. **Build** — effects register as GL layer types; the 3D layer is one more; both share the GL-layer host.

## Open questions

- ~~How many effects need full-frame vs. per-layer?~~ **ANSWERED by the audit above — ~90% self-contained, the rest sample an owned asset, none sample the scene. C not needed.**
- Offscreen strategy: one canvas per effect layer (matches how loops/three effects already run — each owns a canvas + its own rAF) vs. pooling contexts. Loops are zero-cost canvas2d; the ~17 three.js effects each want a WebGL context, so context-count is the real scaling limit, not compositing. Decide pooling only if a composition stacks many GL effects.
- Loops **paint a full opaque frame and never auto-clear** — hosting one as a *transparent* overlay layer needs a small patch (skip the loop's bg fill) or it occludes layers below. Cheap, but must be handled in the effect-layer host.
- Color management / premultiplied alpha parity between the effect canvases and the DOM stack.

## Acceptance

A single effect layer (start with a `src/loops/` shape loop — zero-dep, canvas2d) renders, transforms, and composites alongside DOM layers in the real stage, honoring the transform + opacity pipeline. Since the audit already confirmed per-layer covers the repo, the spike validates the *host seam*, not the compositing model.
