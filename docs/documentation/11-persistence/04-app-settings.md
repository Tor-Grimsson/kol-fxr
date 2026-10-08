---
title: App settings & theme
type: reference
status: active
updated: 2026-07-08
description: The two global-scope stores — appSettings (default aspect, loop-palette theme, autoplay, clip-to-frame) and the UI theme mode (light/dark/system) — their keys, shapes, the no-FOUC boot script, and the "which theme" gotcha.
tags:
  - project/kol-fxr
  - editor/persistence
aliases:
  - app-settings
  - theme
covers:
  - the kol-editor-settings global defaults
  - the kol-editor-theme UI mode
  - the two-different-themes gotcha
  - the index.html no-FOUC boot script
sources:
  - src/editor/lib/appSettings.js
  - src/editor/theme.js
  - src/editor/shell/MenuTop.jsx
  - index.html
related:
  - "[[INDEX|persistence]]"
  - "[[../06-camera-motion/INDEX|camera & motion]]"
---

# App settings & theme

Two global-scope stores — they persist *your defaults*, not any one document. Both survive a File → New and never appear in a draft or `.json` file.

## Global defaults — `kol-editor-settings`

`src/editor/lib/appSettings.js` — a versioned settings object, edited from the **Global defaults** menu (`MenuTop.jsx`), seeding every new canvas and loop layer at boot.

| Field | Default | Meaning |
|---|---|---|
| `version` | — | dropped wholesale on load if it mismatches (no migration) |
| `defaultAspect` | `'4:5'` | `shell/aspects` id — seeds the canvas frame at boot |
| `defaultTheme` | `'kol'` | **loop-palette** theme id (`loops/lib/themes`) — seeds new loop layers' `themeId` |
| `autoplay` | `false` | transport starts playing on load |
| `clipToFrame` | `true` | new layers / exports crop to the aspect frame |

API: `getAppSettings()`, `setAppSetting(key, value)`, and the reactive `useAppSettings()` hook.

> **The "which theme" gotcha.** `defaultTheme` here is **not** the UI light/dark theme — it's the default *loop palette* applied to new generator layers ([[../06-camera-motion/INDEX|camera & motion]] and the generative loops consume it). The UI light/dark theme is a separate key, below.

## UI theme — `kol-editor-theme`

`src/editor/theme.js` — the interface light/dark mode, one of `'light'` / `'dark'` / `'system'` (default `'system'`, which resolves to the OS and tracks OS flips live).

- `getThemeMode()` / `setThemeMode(mode)` read and write the `kol-editor-theme` key.
- The mode is applied as a `[data-theme]` attribute on the root; `'system'` re-applies on every OS `prefers-color-scheme` change.
- **No-FOUC boot.** An inline script in `index.html` reads the key and stamps `[data-theme]` *before* React mounts, so the first paint is already in the right theme — the store is read at two points (the boot script and the React `theme.js`).

Set from the Settings menu (Theme: light / dark / system).
</content>
