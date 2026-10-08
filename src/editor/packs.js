/**
 * packs — THE SEAM between the editor's core and its layers (deconstruction T4, 2026-09-27;
 * .kol/llm-context/plan-2026-09-27-deconstruction-roadmap.md § Coupling map).
 *
 * The core is the canvas, the document, the vector layer types (shape · path · bool · text ·
 * group · photo · pattern), the clock and the bindings. Three layers ride on top and register
 * here instead of being imported by it:
 *
 *   generators   the loop catalog (loops/) — the `loop` and `misc` layer types and their params
 *   effects      the filter catalog (filters/) — the chain on photo and loop layers
 *   motion       kinetic type (kinetic/) — the `kinetic` layer type — and the timeline dock
 *
 * No core file imports loops/, kinetic/ or filters/; it asks `pack(name)` and handles null —
 * an absent pack means its layer types are not offered and its chains render as a pass-through.
 * `@kolkrabbi/design-editor` registers all three (src/packs/index.js), so the full editor is
 * unchanged; the core entry registers none and a host adds the ones it wants.
 *
 * Registration happens at module load, before the first render, so nothing here is reactive.
 */
const packs = {}

export function registerPack(name, api) { packs[name] = api }

export const pack = (name) => packs[name] ?? null
