# Session: Phone fixes — Home pinned, floats overlay, preset info behind an "i"

**Date:** 2026-11-03
**Agent:** Claude (Opus 5.5) as Grim
**Summary:** Signed-out Home scrolled in the home-screen app and Labs' floats sat on their own bands; both fixed in KOL and bumped, and the preset description moved behind an "i" button.

## Changes Made

### Files Modified
- `src/editor/compose/inspectors/AboutLine.jsx` — the about block is now an "i" Button that opens a native popover (eyebrow kind line + `kol-sans-body-03` basis)
- `src/editor/compose/inspectors/LoopPicker.jsx` — `about` slot at the end of the Preset row
- `src/editor/compose/inspectors/LoopFields.jsx` — passes AboutLine into that slot
- `src/editor/labs/LabsParams.jsx` — the effect's "i" sits at the end of the Randomize row
- `package.json` — kol-shell 0.99.3 · kol-component 0.332.0
- `src/editor/styles/kol-editor.css` — touched and reverted; the standalone `body` padding-top is unchanged
- `lobby/outbox/HubHomeSignedOutPinned.md`, `lobby/outbox/FloatsOverlayNoBands.md`, `lobby/INDEX.md` — filed, returned, adopted

### Features Added/Removed
- Signed-out Home box is `fixed` (kol-shell 0.99.2): iOS home-screen apps size `dvh` short, so `min-h-dvh` left a band and a scroll
- `touch="floats"` has no reserved bands (kol-shell 0.99.3): reverses the insets fxr itself asked for in PhoneTwoFloatLayout

## Current State

### Working
- At 390×844 (Chromium): Home box fixed 844, no scroll; Labs stage top 0 under the top float; "i" opens the preset info, the block is gone

### Known Issues
- The home-screen app on iPhone is unverified — the bug only shows in standalone, which no browser here reproduces
- A receipt without an `**Entry:**` line is invisible to the lobby watch, and KOL heads returns "✅ CLOSED", which the watch's `RETURNED` grep misses

## Next Steps
1. User checks on the phone: Home from the home-screen icon (no scroll, no band), Labs with the Rail open and closed
2. The rest of the mobile issues the user mentioned — not yet listed
