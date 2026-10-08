---
title: Saved library (presets)
type: reference
status: active
updated: 2026-10-08
description: LibraryProvider — the localStorage-backed store of user-saved generator assets (palette / pattern / type / preset), its versioned item envelope, v1→v3 migrations, cross-tab sync, and how it differs from the CDN media library.
tags:
  - project/kol-fxr
  - editor/persistence
aliases:
  - saved-library
  - preset-store
covers:
  - the four saved-asset slots
  - the versioned item envelope + validators
  - v1→v2→v3 migrations
  - cross-tab sync
  - the D1 sync (sign-in, merge, push)
  - Home's files and ?open
sources:
  - src/editor/library/LibraryProvider.jsx
  - src/editor/library/libraryApi.js
  - src/editor/library/mergeRemote.js
  - src/editor/library/libraryOps.js
  - src/editor/library/OpenFromUrl.jsx
  - api/src/index.js
related:
  - "[[INDEX|persistence]]"
  - "[[02-project-files|project files]]"
  - "[[../09-media/INDEX|media]]"
---

# Saved library (presets)

`LibraryProvider.jsx` (`GeneratorLibraryProvider`) is a **localStorage-backed store of user-saved generator assets**. It is *not* the CDN media library — that's a read-only remote bucket ([[../09-media/INDEX|media]]); they share only the word "library."

## The four slots

Four array slots, each item versioned (`v:1`) with an `id` / `savedAt` envelope:

| Slot | Holds |
|---|---|
| `palette` | saved palettes |
| `pattern` | saved patterns |
| `type` | saved type presets |
| `preset` | saved whole-frame presets (`buildSpec`, `intent:'whole'` — the same shape as a [[02-project-files\|`.json` project file]]) |

Persisted to **`kol.editor.library.v3`**.

## Persistence, validation, migration

- **Write** — an effect writes the whole `library` object to `kol.editor.library.v3` on every change.
- **Read** — loaded once on mount; each slot runs a **validator** that normalizes and drops malformed legacy entries.
- **Cross-tab sync** — a `storage`-event listener keeps two open tabs in agreement.
- **Migrations** — `v1 → v2 → v3`: the `preset` slot absorbed the legacy `layout` / `composition` slots; the `mark` slot was dropped. A `.v2._backup` key is written before the v2→v3 migration. Legacy keys: `kol.generator.library.v1`, `kol.generator.library.v2` (+ `.v2._backup`).

## API

`addItem` / `removeItem` / `updateItem` / `clearSlot`, plus the typed helpers `savePalette` / `savePattern` / `saveType` / `savePreset`. `onSave` / `onSaveAs` (in `useComposeFile.js`) route a whole frame into the `preset` slot via `addItem` / `updateItem`.

> Items are removed individually through the provider — there is no whole-key wipe, unlike the [[01-draft-autosave|draft]].

## Cloud sync (D1)

Since 2026-10-08 the library can sync to D1 `kol-fxr` through the Worker `kol-fxr-api` (`api/`). localStorage stays the session's truth; D1 is a write-behind target.

- **Opt-in per session.** The rail's **Sign in** row (above Settings, only when `VITE_FXR_API` is set) asks for the one password. A wrong one says so and nothing changes. The password lives in memory for the tab and is never stored — a reload signs you out. Signed in, the row reads *Synced · sign out* with a cloud icon.
- **On sign-in** (`signInLibrary`): the Worker's rows are merged into the stored library (`mergeRemote` — newest `updatedAt ?? savedAt` wins both ways; a newer remote tombstone drops a local item; local-only or newer items are pushed up). Home and the Library page show the merged files at once.
- **Every explicit verb pushes one op** — add, update, rename, duplicate (`put`), remove (a tombstone). Nothing per keystroke; the [[01-draft-autosave|draft]] never touches D1.
- **The table** — `documents(id, kind, name, spec, updated_at, deleted)`, one row per item, `kind` is the slot. Soft delete only.

## Files on Home

Signed in, Home's RECENT lists the last 12 saved files and SAVED all of them, as rows; signed out, Home shows the three chromes as before. **New File** (Home and Library) offers four doors — Editor · Labs · Randomiser · Morph — opening an empty frame (`?new=1`), the randomiser, or labs with the Morph tab's first-step picker (`?new=morph`). A row's Rename · Duplicate · Delete write the stored library directly (`libraryOps.js`, no provider on the shell tier) and push when signed in. Every file saved since 2026-10-08 carries `mode` — `editor` · `labs` · `morph` — written by `buildSpec` from the chrome that saved it; older files keep the guess (a single generator layer → labs). Clicking a row opens the file in its mode's chrome, `/labs?open=<id>` or `/editor?open=<id>`. `UrlIntents` loads it through `loadPreset` after the chrome's boot (so the file's aspect wins), adopts its id and name so a plain Save overwrites it, skips the draft-restore prompt, and clears the param on the next tick (after the provider's own checks have read it). A morph file also loads its steps into the morph store, so labs opens on the Morph tab. **`⌘O`** opens the Files dialog from any chrome.
</content>
