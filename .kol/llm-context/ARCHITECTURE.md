---
_template:
  version: 1
  path: .kol/llm-context/ARCHITECTURE.md
  sync: skip
---

# kol-fxr — Architecture

Load-bearing decisions and constraints. Anything in this document is "we chose this deliberately and it has downstream consequences." Do not revisit without explicit reason. For decision history (alternatives considered, rejections, and evolution), see `./history.md`.

---

## §1 — This directory is the single consolidation target for the scattered editors

There are ~5 half-finished editor prototypes under `kol-apparat/kol-editors/` (`kol-cl-edr`, `kol-draw-3d`, `kol-editor`, `kol-radar`) plus this one. **`kol-fxr` is the one canonical editor they all converge into.** The others become sources to harvest for parts, then retire — not things to keep maintaining in parallel.

**Consequence:** new editor work lands **here**. Don't spin up another editor repo; that is the sprawl we are collapsing. Other prototypes are references, not live codebases.

**Do not revisit** unless the consolidation strategy itself is abandoned.

---

## §2 — The editor is this repo's source, consuming the published DS

The DOM/SVG compositor — canvas + frames, layers, generators, effects, the three chromes — is source in `src/` (`src/index.jsx` and below). It lived in kol-ds-ui as `@kolkrabbi/design-editor` from 2026-09-03 to 2026-10-08 and **came back by user ruling** (plan 06): editor work happens here, with no round-trip tickets. The DS tier (`@kolkrabbi/kol-*`) is still consumed as a **normal external npm consumer** — no workspace linking, no symlinks, exact pins.

**Consequence:** stack is **React 19 + Vite + Tailwind 4 + pnpm**. DS updates arrive via npm version bumps; editor changes are commits here. kol-ds-ui's `packages/design-editor` still exists and publishes for its own apps — the two trees diverge from the first edit, and its fate is an open ruling.

**Do not revisit** unless the editor is moved out again by ruling.

---

## §3 — General editor core + brand as a layer; the brand color layer stays

The editor is a **neutral, general-purpose** tool. The Kolkrabbi brand identity — currently just the color pool that feeds palette mode — is a **layer on top**, not baked into the core and **not a fork**. The brand colors are kept and repackaged, **not stripped**; stripping them was judged premature.

**Consequence:** no brand-specific fork of the editor. Brand extraction into a separate consumer layer is deferred, not required. Keep the brand color pool wired to palette mode.

**Do not revisit** unless the general editor and a brand build genuinely need to split.

---

## §4 — Importing kol-editor's functionality means re-skinning its engine — never swapping this UI out

`kol-editor` is the most mature prototype and the **only one with a canvas engine** (Konva + Pixi, real boolean geometry via `polygon-clipping`, a node-edit scaffold, a documented extension API). But on a canvas engine, **functionality and chrome are the same layer** — you cannot lift the Konva capability out from under its own toolbar / inspector / canvas. A wholesale swap (attempted 2026-07-01) replaced this directory's UI and was **reverted**.

**Consequence:** any functional import from `kol-editor` is an **engine-level port + re-skin** (keep the engine, restyle its chrome to this look), not a copy-paste, and never a UI bulldoze. The "look" is CSS + a few chrome components sitting over the engine — that is the portable part.

**Do not revisit** the *re-skin-not-swap* method. **Still open:** *whether* to adopt the Konva engine at all vs. growing shape-editing on the current base — see `./plan.md`.

---

## §5 — Shape-editor parity first; effects and image-fill are later, additive phases

Build a solid vector **shape editor** (canvas/frames, layer reorder, node/bezier editing, canvas background, export settings, boolean, flatten) **before** wiring in effects or richer image-as-fill. Effects come from a **separate effects repo** and register through an extension seam — additive, never baked into core.

**Consequence:** the near-term roadmap is shape-editing. Effects, deeper DS integration, and npm publishing are deferred phases, in that rough order.

**Do not revisit** unless the user reprioritizes.

---

## §N — Non-goals (do not reopen without explicit ask)

- **Forking into parallel editor repos** — the exact sprawl §1 collapses.
- **Stripping the brand color layer** prematurely (§3).
- **Destructive wholesale codebase/UI swaps** when only functionality was wanted (§4) — the 2026-07-01 lesson.
- **npm publishing** — the editor published as `@kolkrabbi/design-editor` from 2026-07-03, then from kol-ds-ui after 2026-09-03. Since 2026-10-08 nothing is published from this repo; it is an app.
- **Effects / image-fill before shape-editor parity** (§5).
