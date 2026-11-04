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

## Amended — 2026-11-03

- The home-screen scroll and bottom band were iOS 26's short viewport (WebKit 301108: `black-translucent` + `viewport-fit=cover`, open, no Apple workaround). Fixed by an opaque status bar: `apple-mobile-web-app-status-bar-style` `default` in `index.html`; the app must be re-added to the home screen. User confirmed fixed.
- Retired from `src/editor/styles/kol-editor.css`: the standalone body/shell padding, the `html` min-height hack (frappe-ui #1289) and the Home `overflow: hidden` lock (ineffective in PWAs, WebKit 259568).
- Labs on a phone: the params Rail is fxr's own fixed overlay in `src/AppLayout.jsx` (shell `floats.rail: null`), so the stage never resizes; the top float and its ··· circle take `--kol-shadow-float` via `[data-labs-floats]` in `kol-editor.css`.
- `FloatsRailOverlaysShadow` was filed to kol-ds-ui and withdrawn the same hour: Labs is editor work, no round trips (user ruling 2026-10-08, restated). Entry in kol-ds-ui `lobby/archive/`.
- Penrose's 55 preset names were all caps since the August port (labs proto `name`, used as `label`); rewritten in sentence case in each proto under `src/loops/penrose/`, proper names and acronyms kept. Saved files key on preset id, so nothing breaks.
- The "i" button wears its row's frame (no `tone`, same classes as ‹ ›) and is the popover's native invoker (`popoverTarget`), so a click toggles it; the old `onClick` toggle lost to light dismiss and reopened on the second click.

## Amended — 2026-11-04

- Floats fold either side onto a grey tab: kol-component 0.333.0 (TabsRow `foldSide`/`foldTone`) · kol-shell 0.100.0 (`floats.fold`), opt-in; `src/AppLayout.jsx` passes `fold: { side: 'swipe', tone: 'handle' }`. Checked at 390×844. FloatFoldBothSidesGrey adopted.
- KOL queued `lobby/inbox/FloatTimeline.md` (the float timeline, built in the editor). On hold: the user says KOL's framing (timeline as the only fxr piece of the new float UI) is wrong and is taking it up with them. Don't start it until he says.
