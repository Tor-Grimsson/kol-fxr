---
title: Batch export & live record
type: reference
status: active
updated: 2026-07-08
description: The two multi/live output modes — batch multi-size zip export (the preset×scale matrix and the dependency-free store-only zip writer) and live real-time webm record.
tags:
  - project/kol-fxr
  - domain/export
  - editor/export
aliases:
  - batch-export
  - live-record
covers:
  - the batch preset×scale matrix
  - the store-only zip writer (CRC32)
  - live real-time webm record
sources:
  - src/editor/compose/useComposeFile.js
  - src/editor/lib/zipStore.js
  - src/editor/shell/panels/BatchExportModal.jsx
related:
  - "[[INDEX|export]]"
  - "[[03-formats|formats]]"
  - "[[05-clocks|the three clocks]]"
---

# Batch export & live record

Two modes beyond the single-output formats: **batch** emits many stills at once, **record** captures the live screen. Both were built in the 2026-07-08 parity Wave D.

## Batch multi-size export

The **Batch export** button opens `src/editor/shell/panels/BatchExportModal.jsx` — tick a set of aspect presets × a set of `@Nx` scales; "Export all" renders the full **preset × scale matrix** and bundles every PNG into ONE `.zip`.

- **Job matrix** — the modal builds `{ aspectId, scale }` jobs from the two checkbox sets and shows an `N/M` progress counter; the export loop lives in the hook, the modal is pure UI. `custom` is excluded (no fixed dims).
- **`renderComposePngBlob(aspectId, scale)`** (`useComposeFile.js`) — renders the current frame at an *arbitrary* preset + scale to a PNG **Blob** (no download). The aspect only reframes the 1080-virtual viewBox (layers keep their coords); dims come from `PRESET_SIZES`.
- **`runBatchExport(jobs, onProgress)`** — **pauses the transport** for the whole run so every size captures the SAME live moment, loops `renderComposePngBlob`, then restores play state. Filenames encode preset+scale, e.g. `compose-9x16@2x.png`; the archive is `compose-batch-<t>.zip`.
- **`src/editor/lib/zipStore.js`** — a dependency-free, **STORE-only** (no compression) zip writer with a real per-entry CRC32. Store-only is deliberate: PNGs are already DEFLATE-compressed internally, so zip-level compression would buy ~nothing. Layout is `[local header + data] × N → [central dir] × N → EOCD`, no Zip64 (batches are well under 4 GB). A node-safe `demo()` self-check asserts CRC32 known-answers plus exact byte offsets of a fixed 2-file zip.

## Live real-time record

The **Record** button (`onRecordStart` / `onRecordStop`) captures whatever is happening on screen in **real time** — transport running, params being tweaked — the complement to the deterministic offline loop bake.

Because there is no single live canvas, a per-`rAF` **pump** re-composites each frame through the same `buildLayersSvg → drawSvgToCanvas` path the bake uses, but **sampling the live transport ctx** instead of seeking. A `captureStream(fps)` samples that scratch canvas on its own cadence; whatever is painted at sample time lands in the webm. It is honest wall-clock WYSIWYG, not frame-locked — heavy layers can drop the per-frame SVG decode below 30 fps. Aspect + canvas dims freeze at start (a mid-stream resize would break the stream); layers + palette stay live via a `liveRef` updated every render. Output: `compose-live-<w>x<h>-<t>.webm`.

## Offline bake vs. live record

| | Offline loop bake (`onExportWebm`) | Live record (`onRecordStart`) |
|---|---|---|
| Time source | seeks `t = i/N` | samples live transport |
| Frame cadence | offline, encoded frame-by-frame (WebCodecs VP9) | free-running `rAF`, wall-clock |
| Determinism | deterministic (private EMA + warm-up) | WYSIWYG, may drop frames |
| Content | one seamless `u: 0→1` loop | whatever happens while recording |

**Which to use** depends on what is moving — free-running sims and video only capture under Record. That decision is [[05-clocks|the three clocks]].

## Output window

The **Open output window** button (`openOutputWindow`) sidesteps the in-app Record path's SVG-round-trip fps sag: it snapshots the whole doc to `localStorage` (`OUTPUT_SNAPSHOT_KEY`, the same `{page, version, spec}` envelope as Save-to-file) and opens `?view=output` in a new tab. `App.jsx` gates that param to `OutputView` — the composition rendered full-screen with **zero editor chrome** (reusing the `Canvas` letterbox with `guideColor="transparent"` to drop the frame border + label), transport auto-playing. You then record that clean tab with OS or browser-tab capture.

Snapshot at open-time, **not live-synced** — a loop recording needs no live edits, the loop plays via the transport. Re-press the button to push a fresh snapshot after editing. Standalone-app only: the button opens `?view=output` on the current origin, which an embedding host won't serve.
</content>
