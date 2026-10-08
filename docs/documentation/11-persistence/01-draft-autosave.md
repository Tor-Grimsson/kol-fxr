---
title: Draft autosave
type: reference
status: active
updated: 2026-07-08
description: The whole-document draft lifecycle — the debounced localStorage write under kol.editor.draft, the restore-prompt on mount with its gate, and the three clear paths (empty canvas, File → New, error reset).
tags:
  - project/kol-fxr
  - editor/persistence
aliases:
  - draft
  - autosave
covers:
  - the kol.editor.draft write (debounced)
  - the mount restore prompt and its gate
  - the three clear paths
sources:
  - src/editor/compose/state.jsx
  - src/editor/shell/MenuTop.jsx
  - src/editor/EditorErrorBoundary.jsx
  - src/editor/lib/clipStore.js
related:
  - "[[INDEX|persistence]]"
  - "[[02-project-files|project files]]"
  - "[[../02-layers/INDEX|layers]]"
---

# Draft autosave

The editor autosaves the live composition so a reload restores your work. One localStorage slot, `kol.editor.draft`, owned by `src/editor/compose/state.jsx`. This is the *implicit* counterpart to the *explicit* [[02-project-files|`.json` project file]].

## Write — debounced

A debounced (500 ms) effect writes the live composition to `kol.editor.draft`:

```
{ aspect, canvasW, canvasH, showGrid, showRulers, guides,
  layers,
  canvas:  { fill, fillOpacity, infiniteFill },
  palette: { poolId, modeId, colors, locks },
  paint:   { fill, stroke, active } }
```

The slot is **cleared when the canvas empties** (`layers.length === 0`) — an empty editor never leaves a stale draft behind.

## Restore — prompted, gated

On first mount, if a usable draft exists, `modal.confirm` prompts **"Restore your last canvas?"**. Autosave stays gated (`restoreResolvedRef`) until the prompt resolves, so a mount-time `layers=[]` can't delete the stored draft before the user answers. On accept:

- **`normalizeLayersDeep`** migrates legacy layers (flat `filterId` + params → the `filters[]` chain).
- **`hydrateVideoClips`** re-mints uploaded-video object URLs from the IndexedDB clip store (`lib/clipStore.js`) before the layers mount — a raw `blob:` src is dead after reload, so this is what makes an uploaded clip survive. See [[../09-media/INDEX|media]].

Every restore branch — accepted, declined, no draft, bad draft — funnels through one `resolve(finalLayers)` that both opens autosave **and** runs **`gcClips(finalLayers)`**: it reclaims any IndexedDB clip the restored canvas no longer owns, keyed to the settled layer set so a kept clip is never dropped. This is what closes the orphan vectors per-delete cleanup can't reach (File → New, Clear, a crash, a declined restore). The one branch that skips it is an unreachable `localStorage` (below) — a transient read failure must not nuke live clips.

A declined restore, a malformed draft, or an empty draft all clear the slot.

## Ephemeral sessions — `persistDraft={false}`

`ComposeStateProvider` (via `EditorProviders`) takes **`persistDraft`** (default `true`). Passing `false` opts the mount out of the *entire* draft surface — no restore prompt, no `kol.editor.draft` reads/writes/deletes, no load-time `gcClips`. The autosave gate simply never opens (`restoreResolvedRef` stays false).

Two mounts use it: the **mobile generative chrome** (`mobile/MobileView`) and the **output window** (`OutputView`). Both are ephemeral views of a document that isn't theirs — without the opt-out they would prompt restore against the desktop's draft, delete it on decline, autosave their own state over it, and GC clips against the wrong layer set.

## Clear — three paths

| Path | Where | What it does |
|---|---|---|
| **Auto** | `state.jsx` | Canvas empties (`layers.length === 0`) → slot removed. |
| **File → New** | `MenuTop.jsx` (`onNew`) | Confirm-guarded: `removeItem('kol.editor.draft')` then `window.location.reload()` for a clean default. |
| **Error reset** | `EditorErrorBoundary.jsx` | The crash-recovery button wipes the draft so a poisoned document can't re-crash on reload. |

> The draft holds only what's listed above. It is **not** the full app state — global settings, theme, and saved presets live in their own keys (see [[04-app-settings|app settings]], [[03-saved-library|saved library]]).
</content>
