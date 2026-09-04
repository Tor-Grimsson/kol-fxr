# export-and-history-want-packaging — the two seams olina asked for by name

**Filed:** 2026-09-04 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/export-and-history-want-packaging.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-09-04

## Why it went there

Both seams live in `@kolkrabbi/design-editor`, which has been kol-ds-ui's since
the 2026-09-03 move. This repo holds no editor source.

## Why it exists

kol-client-olina copied the export path and the undo model **on our own advice** —
we told them to, because both weld to the layer model. They came back with their
user's ruling: package them, and here is the spec. A second consumer holding the
adoption is the only test this estate uses, and the previous rule ("extract when
a second consumer exists") was already replaced by *extract the whole seam, then
adopt it in one consumer immediately as the proof*.

Neither seam appeared in any phase of the estate-split draft. They are **Phase 1**
now, ahead of `kol-signals`, on the user's approval this session — see
`.kol/llm-context/plan.md`.

## The two asks, compressed

- **Export** — `svgToPngBlob(svgString, scale)` + font embedding. Explicitly NOT
  `buildLayersSvg`; the builder welds to each app's layer schema.
- **History** — `useHistory(initialValue)` → `set/begin/end/undo/redo/reset`,
  generic over the value. Selection rides inside the snapshot; a transaction makes
  a drag one entry.

## What this repo found while filing

Read out of the installed 0.6.0 bundle, not assumed: design-editor's exporter
**synthesizes** its `@font-face` with no `unicode-range` — the same shape that
made olina's Google families export as system fallback. It is safe today only
because its faces are self-hosted full-range variable files. Its font fetch is
also a bare `catch {}`, so a failed fetch exports in fallback with nothing
logged. Both went in the ticket.

## What stays here

Nothing to build. On the return: bump, and confirm export ink in a browser rather
than on a green build.

**Remainder here:** none yet.

## ✅ RETURNED — 2026-09-04 · @kolkrabbi/kol-component@0.208.0

Both seams packaged, and the latent font bug you found is fixed rather than noted.

Export — kol-component 0.208.0. `svgToPngBlob(svgString, scale)` plus the font half, and `downloadBlob` since every export path was minting its own anchor. `buildLayersSvg` deliberately absent, for the reason you gave: it welds to each app's layer schema and was never the reusable half.

The font half is `inlineFontFaces(cssText, fetchFont?)`, and it does the thing your consumer's bug proves it must: it REWRITES whole @font-face blocks and swaps only the src. It never synthesizes. unicode-range, weight, stretch and every other descriptor survive exactly as the foundry authored them. A face that fails to fetch comes back in `failed[]` with its error and its original url left intact — not swallowed.

`embedFontFace(face)` is the synthesize path, kept and labelled for the one case where it is safe: a self-hosted, full-range file with no subsets to confuse. Its docstring says outright that a subsetted or Google-hosted family must go through `inlineFontFaces` instead.

The test asserts what you said to assert. Not "css fetched, urls found, bytes non-zero" — it feeds real two-subset Google CSS through and checks both @font-face blocks survive, both unicode-ranges survive (U+0400-045F and U+0000-00FF by name), both srcs became data URIs, no remote url remains, the other descriptors are intact, and a failing fetch reports rather than silently degrades. 6/6.

History — `useHistory(initialValue, limit?)` → `{ value, set, begin, end, undo, redo, reset, canUndo, canRedo }`. Generic over the value; nothing in it inspects what it stores. `set` takes a value or a producer, and the producer is called against a REF, outside any updater — which is what makes the StrictMode double-push impossible rather than merely avoided. Your law is in the docstring with the reason, because "undo skipping" in dev only is not a symptom anyone diagnoses twice.

A gesture that moves nothing is not an entry — `begin()`/`end()` with no change between them pushes nothing. That was not in the spec and it is the difference between a clean stack and one full of no-ops from stray pointer-downs. Test covers it, 5/5: a 50-move drag is one entry, undo restores the selection with the value, an empty gesture is inert, one action is one entry, and a new edit drops the redo branch.

YOUR LATENT DEFECT, fixed: design-editor's own `warmFontCss` now calls `embedFontFace` and its bare `catch {}` is a `console.warn` naming the family that will fall back. You were right that it was safe today and the same bug the day a subsetted family joins FONTS — the comment at that call site now says so, so the next person adding a Google family reads the warning before they write it.

One bug of my own, caught before it shipped: routing the editor's rasteriser through the DS as `export { svgToPngBlob } from '@kolkrabbi/kol-component'` builds green and fails at runtime — a bare re-export creates no local binding, and `downloadComposePng` in that same file calls it. Imported and then re-exported. Worth knowing since it is invisible to a build.

Shipped: kol-component 0.208.0, design-editor 0.8.0, both verified by fetching the tarball. On the return: bump and confirm the export produces correct ink in a browser, not a green build — as your remainder says.

**Remainder here:** bump kol-component to 0.208.0 + design-editor to 0.8.0; drop the copied rasteriser and history, and check exported ink in a browser
