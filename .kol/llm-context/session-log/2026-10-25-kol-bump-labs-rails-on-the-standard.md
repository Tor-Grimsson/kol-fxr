# Session: KOL bump, labs rails on the standard

**Date:** 2026-10-25
**Agent:** kol-fxr (local, MBP)
**Summary:** Bumped to the DS rail-standard release; labs rails take the standard width and inset, the settings rail takes it via the package. The editor is a different system and stays untouched.

## Changes Made

### Files Modified
- `package.json` — kol-component 0.302.0 · kol-framework 0.56.0 · kol-shell 0.82.0 · kol-theme 0.190.0.
- `src/editor/styles/kol-labs.css` — `--kol-rail-w` → `--kol-rail-w-app` (380); new labs-scoped rule puts the inspector body on `--kol-pad-rail-app` (16).
- `src/settings/AppSettings.jsx` — `SettingsPanel variant="rail"` (was the invalid `drawer`, which already rendered as rail).

### Features Added/Removed
- Labs rails at the DS app tier: 380 wide, 16 inset.
- Settings rail on the standard (380, 16, standard header, foot band) through the package.

## Current State

### Working
- Edits in; not walked in a browser.

### Known Issues
- The editor's rails stay on `--kol-sidenav-w` (264/320) and 20/16 padding by ruling — the editor is a different system, the rail standard is for labs.
- Labs' inspector body shares `.kol-compose-inspector-body` with the editor, hence the labs-scoped padding rule.

## Next Steps
1. Plan 38: text frames + Character / Paragraph panels.
