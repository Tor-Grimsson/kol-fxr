---
title: Project files (.json)
type: reference
status: active
updated: 2026-07-08
description: The portable document format — buildSpec, the {page,version,spec} envelope, onSaveSettings / onLoadSettings, the SettingsFileTab file input, and why the "Settings" tab actually saves the whole document.
tags:
  - project/kol-fxr
  - editor/persistence
aliases:
  - project-files
  - save-open
covers:
  - buildSpec (the frame spec)
  - the {page,version,spec} envelope
  - onSaveSettings / onLoadSettings
  - the SettingsFileTab input + naming caveat
sources:
  - src/editor/compose/useComposeFile.js
  - src/editor/shell/panels/EditorFooter.jsx
  - src/editor/lib/download.js
related:
  - "[[INDEX|persistence]]"
  - "[[01-draft-autosave|draft autosave]]"
  - "[[03-saved-library|saved library]]"
  - "[[../08-export/01-pipeline|export pipeline]]"
---

# Project files (.json)

Save the whole document to a portable `.json` file and re-open it later — the *explicit* counterpart to the [[01-draft-autosave|draft autosave]]. Owned by `src/editor/compose/useComposeFile.js`.

> **Naming.** The two buttons read **Save to file** / **Load from file** — in the File tab, above the library Save / Save as lane. They were renamed from the misleading "Save/Load settings": they do **not** save app settings, they save the whole frame (`intent:'whole'`). The handlers are still `onSaveSettings` / `onLoadSettings` and the component is still `SettingsFileTab` (internal names, not user-facing). App settings are a different store entirely ([[04-app-settings|app settings]]).

## The spec

`buildSpec(name)` is the document payload — the same shape used for both the `.json` export and a [[03-saved-library|saved library]] preset:

```
{ intent:  'whole',
  name,                       // preset name or null
  aspect,
  canvasW, canvasH,
  layers,
  palette: { poolId, modeId, colors, locks } }
```

It carries the frame's **structure**, not pixels — no rasterization, no fonts, just the layer tree and its settings.

## The envelope

`onSaveSettings` wraps the spec in a versioned envelope and downloads it (via `lib/download.js`) as `kol-fxr.json`:

```
{ page:    'kol-fxr',   // SETTINGS_PAGE — the file's identity tag
  version: SETTINGS_VERSION,
  spec:    buildSpec(currentPresetName) }
```

## Load

`onLoadSettings(file)` is the import path (behind the file tab's `<input accept="application/json,.json">`):

1. `FileReader.readAsText` → `JSON.parse`.
2. Validate the envelope — `page === 'kol-fxr'` and a known `version`. A foreign or mis-versioned file is rejected.
3. `loadPreset(env.spec)` — applies the spec to the canvas. Like every load path, it **re-ids every layer** (`reidLayers`) so an opened document never collides with what's already on the canvas.

## Relationship to the other document stores

| | Draft | `.json` file | Library preset |
|---|---|---|---|
| Trigger | automatic (500 ms) | user "Save settings" | user "Save" / "Save as" |
| Where | `localStorage` (1 slot) | a file you keep | `localStorage` (named slot) |
| Payload | live composition | `buildSpec` envelope | `buildSpec` |
| Reopen | restore-prompt on reload | open the file | insert onto canvas |

All three serialize the same document shape; they differ only in *where it goes* and *how it comes back*.
</content>
