---
title: Research & Decision History
type: index
status: active
updated: 2026-07-08
description: The point-in-time research that shaped the editor — the two 2026-07-01 architecture RFCs (render fork → hybrid, param graph → one schema-driven graph) and the labs parity audit that drove the backfill and the 2026-07-08 parity waves. All three are executed history.
aliases:
  - research
  - decision-history
  - rfcs
tags:
  - project/kol-fxr
  - domain/architecture
  - editor/rendering
  - editor/parameters
related:
  - "[[../00-overview/INDEX|overview]]"
  - "[[2026-07-01-render-fork|render-fork decision]]"
  - "[[2026-07-01-param-graph|param-graph decision]]"
  - "[[2026-07-03-labs-parity-audit|labs parity audit]]"
---

# Research & Decision History

This section is the editor's **paper trail** — the dated design bets and the one big inventory that were resolved before the code they justify. Everything here is **executed history**: kept for the *why*, not the *what*. For the current shape of these systems, follow the forward links into the live sections; for load-bearing invariants and the running architecture record, see `.kol/llm-context/ARCHITECTURE.md` and the session logs (agent state, deliberately outside this vault).

Two things belong here: **decision records** (RFC-style, one call each, immutable once shipped) and **audits** (a snapshot survey that decays once acted on). Both carry an ISO date prefix because their value is anchored to *when* they were true.

## Contents

| Doc | Type | Date | What it settled |
|---|---|---|---|
| [[2026-07-01-render-fork|render-fork decision]] | decisions | 2026-07-01 | How WebGL effects + the 3D layer composite with the DOM/SVG stack. Resolved to **Option A — per-layer hybrid** (GL layers as positioned `<canvas>`), after an effects-repo audit proved ~90% of effects are self-contained and none sample the scene below. Full GL scene (Option B) ruled out on facts; rasterize-on-demand (Option C) deferred-maybe-never. |
| [[2026-07-01-param-graph|param-graph decision]] | decisions | 2026-07-02 | Whether inspector controls, keyframes, modulation, and effect knobs are one system or four. Resolved to **Option B — one schema-driven param graph** (a prop value is a tagged union: constant \| track \| modulation), because ~75% of the model already existed in the labs repo and building it four times guarantees drift. |
| [[2026-07-03-labs-parity-audit|labs parity audit]] | audit | 2026-07-03 | Preset-level diff of `kol-labs-single` (source of truth) vs this editor — full-parity families, 13 silent gaps (G1–G13), documented skips. Drove the same-day backfill and the **2026-07-08 five-wave parity pass**; every gap is now closed. |

## How these map to the live sections

- The **render-fork** call is realized in [[../04-effects/INDEX|effects]] (the filter-chain + lazy Pixi GL tier) and the DOM/SVG compositor described in [[../00-overview/INDEX|overview]].
- The **param-graph** call is realized in [[../05-parameters-binding/INDEX|parameters & binding]] — schema, binding union, and the source registry.
- The **parity audit**'s findings landed across [[../03-generative/INDEX|generative]] (the loop catalogs) and the type/kinetic families.

## Why they stay archived, not deleted

A decision doc records the *alternatives considered and rejected* — the fastest way to stop a future agent re-litigating a settled call (e.g. "why not one GL scene?", "why not a sidecar animation doc?"). The audit records the *baseline* the parity waves were measured against. Neither is current-state reference; both are the receipts.
