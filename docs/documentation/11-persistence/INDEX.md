---
title: Persistence
type: index
status: active
updated: 2026-10-08
description: Everything the editor writes to disk-equivalent storage — the whole-document draft autosave, the .json project file, the saved-preset library, and the global app settings + theme — plus the one master map of every storage key.
tags:
  - project/kol-fxr
  - editor/persistence
  - domain/storage
aliases:
  - persistence
  - storage
related:
  - "[[../00-overview/INDEX|overview]]"
  - "[[../02-layers/INDEX|layers]]"
  - "[[../08-export/INDEX|export]]"
  - "[[../09-media/INDEX|media]]"
  - "[[01-draft-autosave|draft autosave]]"
  - "[[02-project-files|project files]]"
---

# Persistence

Everything the editor writes to persistent storage sits on **two axes**: *this document* (the draft it autosaves, the `.json` you export) versus *global* (your saved presets, your app defaults, your theme). They share nothing but the word "save," and before this section they had no single home — draft lived in the Layers doc, presets in the Media doc, settings nowhere.

## The master storage map

Every key the app touches, in one place:

| Store | Key | Holds | Owner |
|---|---|---|---|
| localStorage | `kol.editor.draft` | **whole-document autosave** — the live composition, so a reload restores your work | [[01-draft-autosave\|draft autosave]] |
| file (download) | `kol-fxr.json` | the **exported document** — the frame *spec* as a portable file | [[02-project-files\|project files]] |
| localStorage | `kol.editor.library.v3` | **saved presets** — palette / pattern / type / preset slots | [[03-saved-library\|saved library]] |
| D1 `kol-fxr` (via `fxr-api.kolkrabbi.io`) | `documents` | **the library's cloud copy** — synced after a rail sign-in, one row per item, soft delete | [[03-saved-library\|saved library]] |
| localStorage | `kol-editor-settings` | **global defaults** — default aspect, loop-palette theme, autoplay, clip-to-frame | [[04-app-settings\|app settings]] |
| localStorage | `kol-editor-theme` | **UI theme** — `light` / `dark` / `system` | [[04-app-settings\|app settings]] |
| IndexedDB | `kol-editor-clips` / `clips` | **uploaded video Blobs**, keyed by layer id, so clips survive reload | [[../09-media/INDEX\|media]] |

The IndexedDB clip store is owned by [[../09-media/INDEX|media]] (it's a video-source concern); it appears here only so the map is complete.

## Sections

| Doc | What it covers |
|---|---|
| [[01-draft-autosave\|draft autosave]] | The `kol.editor.draft` lifecycle — the debounced write, the restore-prompt on mount, and the three ways it's cleared (empty canvas, File → New, error reset). |
| [[02-project-files\|project files]] | The `.json` document format — `buildSpec`, the `{page,version,spec}` envelope, `onSaveSettings` / `onLoadSettings`, and why the "Settings" file tab actually saves the *document*. |
| [[03-saved-library\|saved library]] | `LibraryProvider` — the saved-preset store (palette / pattern / type / preset), its versioned envelope, v1→v3 migrations, cross-tab sync, the D1 sync and Home's files. |
| [[04-app-settings\|app settings]] | `appSettings` global defaults + the UI theme mode — the two `kol-editor-*` keys, their shapes, and the "which theme" gotcha. |

## The one confusing overlap

The **draft** and the **`.json` project file** hold nearly the same content (`buildSpec`, `intent:'whole'`), but serve opposite roles: the draft is an *implicit* autosave (one slot, overwritten every 500 ms, restores on reload), the `.json` is an *explicit* export (a file you name, keep, and re-open). Neither is the saved-preset library, which stores *named* presets you insert onto a canvas.
</content>
