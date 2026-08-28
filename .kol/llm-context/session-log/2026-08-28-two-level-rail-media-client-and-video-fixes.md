# Session: The two-level rail, the media client, and three video fixes

**Date:** 2026-08-28
**Agent:** Grim (Sonnet 5)
**Summary:** Rail rebuilt to a user-ruled two-level shape and round-tripped through the DS; `mediaLibrary.js` replaced by the published `kol-media-client`; three real defects found by running the app rather than building it.

## Changes Made

### Packages — all on latest
`kol-shell 0.14.0 → 0.17.1` · `kol-component 0.119.0 → 0.128.0` · `kol-framework 0.34.0 → 0.35.0` · `kol-theme 0.81.0 → 0.89.0` · **`kol-media-client` added at 0.3.2** (exact pin). `kol-icons 0.24.0` / `kol-brand 0.1.3` already current. All in devDeps + peerDeps + `minimumReleaseAgeExclude`.

### The rail — one component, two levels
- `src/AppLayout.jsx` — on kol-shell's `AppShell`. Dropped the stale `iconComponent` seam and `themeToggle={false}` (both left `AppShell` in 0.16.0). Ported kol-mirror's Settings toggle: click opens `/settings`, click again returns to the last page. **⌥-digit is now LOCAL, not AppShell's `navKeys`** (user: "alt 1 should short to home, library 3 4 5") — the prop maps ⌥n to `items[n-1]`, which skips HOME (`/` is the logomark, not a row) and, on `/labs`, handed ⌥5-9 to the appended category rows. `KEY_ORDER` is derived from `NAV_ITEMS` + `BOTTOM_ITEMS` so adding a destination cannot silently renumber the rest.
- `src/railExtras.js` — **new.** A `useSyncExternalStore` store letting a route hand rows to the shell rail. Rows carry `#rail/…` sentinel paths plus a dispatch map, because `NavRail` only knows `onNavigate(path)` and labs' leaves dispatch rather than route.
- `src/editor/labs/LabsNav.jsx` — **renders `null`.** Builds the same tree and publishes it, folding the flat `sec:` stream into real nesting: section → its groups.
- `src/editor/labs/LabsView.jsx` — the `setNavHidden(true)` mount-timeout + re-assert pair **deleted**; `LabsNav` moved out of the grid's `left.body` slot.
- `src/editor/styles/kol-labs.css` — nav track → `0px`; the collapsed-track rule, the `.kol-sidenav` stretch and the sidenav half of the transition-suspend all removed.
- `src/styles/kol-app.css` — **retired to `_tmp/`** (every selector was `.kol-sidenav.is-collapsed`, which 0.16.0's rail no longer produces). `src/index.css` is imports-only again and `src/styles/` is gone.

### The media layer
- `src/editor/library/mediaLibrary.js` — was a hand-rolled fork of the published package (`listMedia` · `mediaUrl` · `proxied` · type guards · `formatSize`), R2-only. Now a thin facade: `createMediaClient({ buckets: true })`, no local table, no local `formatSize` wrapper.
- `src/editor/library/MediaPicker.jsx` — store selector (DS `Dropdown`), re-lists on switch with an `AbortController`, and **all five** URL call sites take the bucket.

### Defects fixed in `src/editor/compose/LayerRenderer.jsx`
1. **Crash** — `syncVideoTransport` now guards the element (`typeof v?.pause !== 'function'`) instead of trusting `layer.srcType`.
2. **First frame** — `setMedia` moved from `onloadedmetadata` (readyState 1, nothing decoded) to `onloadeddata`.
3. **Black video** — a paused video is now primed with a real seek before publishing.

## Current State

### Working
- One rail component on every route. L1 sections 20px glyph in a 32px box (glyph x 14); L2 groups 12px in 20px, indented right (x 30). Nothing auto-expands — arriving at `/labs` renders zero L2 rows with all four sections `aria-expanded="false"`.
- Media library reaches three stores: R2 433 · B2 website 3,443 · B2 vault 4,095 = **7,971 files**, up from 433. R2 proxied, both B2 hosts direct.
- Video: renders its first frame while the transport is stopped, advances on play, survives a video→image swap.
- All six routes loaded in a browser with `pageerror` + console listeners — **zero errors**.
- **⌥1 Home · ⌥2 Library · ⌥3 Editor · ⌥4 Labs · ⌥5 Randomiser · ⌥6 Settings** — all six verified by keypress; ⌥5 from `/labs` still reaches Randomiser rather than a category row; the typing guard holds in a focused field and the key works again once blurred.

### Known Issues
- **T6 not done: webcam and phone camera unverified.** Needs real hardware. All three chromes share one source component (Library · Upload · Camera) and both `LabsSourcePicker` and `EditorFooter` can start a stream, but none of it was exercised.
- `RailSettingsDisclosure` is **🔴 needs-ruling** — returned as framework 0.34.0 + shell 0.14.0, then 0.16.0 deleted the `settings` prop before fxr adopted it. Retire, or re-file against `NavRail`. `src/editor/labs/RailSettings.jsx` is dead code either way. **The agent does not close it — statuses are the user's call.**
- `MediaClientBucketTable`'s remainder is done, but fxr still declares nothing — worth confirming no other repo copy remains.
- The `/media` proxy is now optional (R2 CORS is live) but **deliberately kept**: the header is on the response, so pre-policy cached entries still taint. `crossOrigin="anonymous"` must be everywhere first — fxr already sets it for http(s) sources, so step 1 of kol-r2b2's sequence is effectively done.
- Uploads are ruled out by kol-r2b2's ARCHITECTURE §2/§4 — fxr stays read-only; writes go through the `bucket-r2` CLI.

### The lesson, three times in one session
Every defect today came from **treating a pre-bump observation as still true**:
1. Forked `NavRail` from 0.16.0 source held in context *after* bumping to 0.16.1 → filed a defect against the DS that was my own fork's bug. Corrected in both ledgers.
2. Deleted `kol-app.css` correctly, then chased the symptom twice before reading `NavRail.jsx`.
3. Browser-verified `kol-media-client` on 0.2.0, then bumped 0.3.0 → 0.3.1 on node checks and `pnpm build` alone. **0.3.1 was browser-fatal and fxr was shipping it** — a top-level `process.argv` reference throws on import. kol-mirror took the white screen.

**Law:** after any dependency bump, re-read the source *from disk* and load the app in a *browser*. Build-green plus node-green does not overlap with browser-green for import-time failures.

And on the black video specifically: two guesses were wrong (`loadeddata`, and "the one draw missed the frame" — disproved by forcing a re-render). What settled it was measuring `drawImage` output per element. `readyState 4` does not mean a frame can be composited.

## Next Steps
1. **Rule `RailSettingsDisclosure`** — retire (and send `RailSettings.jsx` to `_tmp/`) or re-file against `NavRail`.
2. **T6** — plug in a camera and run webcam + phone camera with effects across all three chromes.
3. Optional: finish kol-r2b2's sequence and drop the `/media` proxy — one surface direct, verify `getImageData`, then the rest, then the rewrites.
