# Playbook — Two-level labs rail, then the input QA pass

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** Give the rail a real second level so labs' sections come back — L1 sections at 20px-icon/32px-container, L2 groups at 12px-icon/20px-container right-aligned, nothing auto-expanding. Build it in fxr first, prove it live, then file the working version to kol-ds-ui. After it lands: verify every input source (webcam · phone camera · video · image) and effects over them across all three chromes.

**Standing rules (non-negotiable):**
- **Local first, then ship.** Build it in fxr, make it work, file the WORKING version — never file-and-wait. (`WorkspaceSidebarGeometry` is the precedent.)
- **Read the shipped component before theorising about its CSS.** This session already burned two wrong fixes by patching symptoms instead of opening `NavRail.jsx`.
- **The category law holds:** the rail shows SECTIONS and CATEGORIES only — presets never render there; they belong to `LabsParams`.
- Icons opaque `oq-*` only — never an alpha `fg-*` on a glyph.
- No local DS shims as an endpoint; a consumer/DS gap goes to the lobby.
- `npm view <pkg> dist-tags`, never `pnpm outdated` (stale four times now).

---
## Phases

1. **L2 geometry** — a two-level rail in fxr: L1 sections (20/32), L2 groups (12/20, right-aligned), collapsed shows L1 glyphs only, expand reveals L2, no auto-open on entering labs.
2. **File it** — the working version to kol-ds-ui as the section-anchor + sub-row-icon ticket; close/redirect `RailSettingsDisclosure` (🔵, filed against a rail shape 0.16.0 deleted) in the same pass.
3. **Input QA** — webcam · phone camera · video · image, each with effects over it, across editor · labs · randomiser.

---
## Entries

[06:10 GMT · 2026-08-28] · setup · playbook created
  what → initialised the live playbook   why → three-phase effort starting from a design ruling, worth journalling as it goes

[06:10 GMT · 2026-08-28] · phase 0 · package.json · pnpm-workspace.yaml
  what → bumped kol-component 0.125.0→0.126.0, kol-shell 0.16.0→0.16.1
  verify → install ✓ · build ✓
  note → 0.16.1 did NOT change the sub-row shape — `NavRail.jsx:188` is still label-only (`pl-11`, no icon slot), so the L2 geometry is genuinely unshipped

[06:10 GMT · 2026-08-28] · phase 1 · design ruled (user)
  what → L1 = the ~5 sections (Effects · Generative · Composition · Modulation + destinations), 20px icon in 32px container
  what → L2 = the groups under them, 12px icon in 20px container, aligned RIGHT
  what → collapsed rail shows L1 only; expanding reveals L2; labs must NOT auto-expand on entry
  why → the flat swap earlier today dropped section headers entirely and dumped 44 rows into a rail built for 5
  note → two real DS gaps: no section-anchor row, and sub-rows have no icon slot

[06:15 GMT · 2026-08-28] · phase 1 · src/shell/AppRail.jsx · src/shell/AppShellLocal.jsx
  what → forked NavRail + AppShell locally, added the L2 row   why → AppShell renders its rail with no component seam, so the level cannot be added from outside
  note → AppShellLocal IMPORTS NavHiddenContext/useTouchPrimary/TouchDeviceOverlay from kol-shell — only the ~30 lines of layout/keys are forked
  note → L2 is not a Button: the icon ladder stops at sm/28px and this rung is 20

[06:15 GMT · 2026-08-28] · phase 1 · src/editor/labs/LabsNav.jsx
  what → fold the flat navTree stream into its sections — `sec:` marker becomes L1, the groups that follow become its sub
  before → 24 flat rows on a rail built for 5   after → 4 section rows + 4 destinations + Settings

[06:15 GMT · 2026-08-28] · phase 1 · package.json
  what → added `gsap ^3.13.0` as a direct dep   why → the fork imports it at source; it had only ever resolved as kol-shell's peer

[06:15 GMT · 2026-08-28] · ⚠ DS DEFECT FOUND · kol-shell 0.16.1 + kol-component 0.126.0
  what → NavRail calls `GRAB.marks.reduce(...)` but kol-component's GRAB has NO `marks` key
  what → it also tests `Math.abs(frac - mark) > GRAB.stick` where stick is 90 (px) against a 0–1 fraction
  → the SHIPPED rail throws a TypeError on every pointermove within `near` of its edge; the pill never travels
  verify → reproduced in a browser, 13 errors from one drag; affects every consumer, mirror included
  note → fork carries local MARKS/STICK as a fallback, flagged in-file; owed to kol-ds-ui as its own ticket

[06:15 GMT · 2026-08-28] · phase 1 · MEASURED LIVE on /labs ✓
  verify → build ✓ · rail collapsed 48 ✓ · L1 box 32×32, glyph 20 ✓ · L2 box 20×20, glyph 12 ✓
  verify → L2 glyph x=30 vs L1 x=14 — indented right ✓ · sub rows on entry = 0, all 4 sections aria-expanded=false ✓
  verify → drag opens to 264, expanding Effects reveals 6 groups (Halftone·Scanline·CRT·Refraction·FX rack·Pattern) ✓
  note → T1 T2 T3 ticked

[06:19 GMT · 2026-08-28] · phase 2 · FILED · RailTwoLevelSections → kol-ds-ui
  what → entry in ds-ui inbox, receipt in fxr outbox, rows + history in BOTH ledgers
  what → carries the GRAB.marks defect as a second, independent ask
  note → ds-ui queue 21 → 22 · remainder here: delete both forked files, restore the kol-shell import, drop gsap, re-measure

[06:19 GMT · 2026-08-28] · phase 2 · 🔴 RailSettingsDisclosure — needs-ruling, NOT closed
  what → returned as framework 0.34.0 + shell 0.14.0, then shell 0.16.0 DELETED the `settings` prop it shipped
  why → fxr bumped 0.14.0 → 0.16.0 → 0.16.1 and never passed through the window where the shape existed
  note → the agent does not close it: declaring a ticket stale is the user's call (lobby law)
  note → options recorded in the receipt — ⚫ retire, or re-file against NavRail. `RailSettings.jsx` is dead code either way
  note → T4 T5 ticked; T6/T7 (input QA) are next

[06:25 GMT · 2026-08-28] · phase 2 · ✅ RETURNED SAME HOUR · kol-shell 0.17.0
  what → bumped 0.16.1→0.17.0; both forks → `_tmp/2026-08-28-rail-fork-superseded-by-shell-0.17.0/`
  what → AppLayout back on kol-shell's AppShell; direct `gsap` dep dropped; local MARKS/STICK gone with the fork
  verify → build ✓ · arrival: rail 48, 4 sections aria-expanded=false, 0 × 12px glyphs ✓
  verify → opened: L1 32/20@x14 · L2 12@x30 · 6 rows under Effects ✓ — identical to the fork's numbers
  note → DS also shipped `AppShell railComponent`; unneeded here but the right seam
  note → no `xs` button rung minted — sm/md/lg is a user law, that call is his

[06:25 GMT · 2026-08-28] · ⤺ MY DEFECT REPORT WAS WRONG — corrected in receipt + ledger
  what → the GRAB.marks TypeError was the FORK's bug, not the shipped rail's
  why → read NavRail.jsx at 0.16.0, bumped to 0.16.1, forked the stale in-context copy without re-reading
  verify → installed 0.16.1 compares `Math.abs(along - grabTarget) < GRAB.stick`, px vs px, never touches `marks`
  note → the hazard underneath WAS real: shell 0.16.0 + component ≥0.126.0 throws, and 0.16.0's peer range allowed it — DS deprecated 0.16.0 on npm for it
  note → SAME LESSON AS THIS MORNING'S kol-app.css: re-read a dependency's source AFTER bumping. A copy in context is not the installed file.

[06:25 GMT · 2026-08-28] · ports
  note → verified on a scratch vite (5211, --force) because the user's 5177 was serving deleted fork files; killed at task end

[06:32 GMT · 2026-08-28] · phase 3 · input QA — source matrix, read from source
  what → all three chromes share ONE source component (`LabsSourcePicker`): Library · Upload · Camera, `accept="image/*,video/*"`
  what → editor ALSO has `EditorFooter` File tab: Upload image · Upload video · From library · Webcam (four buttons)
  note → `MobileView`'s comments still say "From library | Upload, same as labs" — STALE, the randomiser shows Camera too (verified live)
  note → `LayerInspector.jsx` (editor, per-layer replace) is `accept="image/*"` only — no video, no camera; the footer covers both, so a gap in reach, not capability

[06:32 GMT · 2026-08-28] · phase 3 · 🐞 CRASH FOUND + FIXED · LayerRenderer.jsx `syncVideoTransport`
  what → source SWAP image→video on a layer with an effect → `TypeError: v.pause is not a function` → whole editor tree to EditorErrorBoundary
  why → `isVideo` reads `layer.srcType` (flips instantly); `media` is state (lags a tick) — one render lands with srcType 'video' and the old <img> still in `media`
  after → guard the ELEMENT not the flag: `if (typeof v?.pause !== 'function') return` — one guard where both call sites route through
  verify → repro'd, fixed, re-run clean · build ✓

[06:32 GMT · 2026-08-28] · phase 3 · ⚠ OPEN · video renders BLACK until the transport plays
  what → drop a video in labs (transport stopped) → canvas is black; press play → renders correctly
  what → randomiser MASKS it — `startInsert` calls `transport.play()`, so it never shows there
  tried → moved `setMedia` from `onloadedmetadata` (readyState 1, no frame decoded) to `onloadeddata` (readyState 2, first frame) — correct on its own merits, KEPT, but did NOT fix the black
  note → not root-caused yet. Do NOT chain another speculative fix — profile the draw path first (this is the second time today guessing cost more than reading)
  note → arguably a design call too: should a dropped video paint its first frame while the clock is stopped?

[06:32 GMT · 2026-08-28] · phase 3 · coverage so far
  verify → labs: image+Halftone ✓ · video+Halftone ✓ (after the crash fix)
  verify → randomiser: video ✓ · video+Dither ✓
  open → editor chrome untested · webcam untested (needs a camera) · phone camera untestable from here

[06:55 GMT · 2026-08-28] · phase 4 · ADOPTED @kolkrabbi/kol-media-client 0.2.0 (exact pin)
  what → `src/editor/library/mediaLibrary.js` is now a thin facade over the package; the hand-rolled listMedia/mediaUrl/proxied/type-guards/formatSize are gone
  why → we were maintaining a fork of a published package, and it could only ever see ONE bucket
  note → exact pin, not caret — mirror's 0.x convention, and it is what kept them off the deprecated kol-shell 0.16.0 today
  note → peerDep + devDep (the lib build externalises every @kolkrabbi/*), added to minimumReleaseAgeExclude
  note → client is REBUILT on setMediaProxyBase rather than mutated — `proxyPath` is fixed at construction; that IS per-mount for the single-editor case
  verify → build ✓ · node check: r2 433 · b2 3443 · b2vault 4095 files listed = 7,971 vs 433 before
  verify → proxied() rewrites r2 → /media/, leaves b2 untouched (correct — B2 sends CORS *)

[06:55 GMT · 2026-08-28] · phase 4 · MediaPicker gained a store selector
  what → DS `Dropdown variant="grey"` in the header, BUCKET_OPTIONS, re-lists on switch with an AbortController
  before → R2 only, ~430 files   after → three stores, ~7,971 files

[06:55 GMT · 2026-08-28] · 🐞 CAUGHT LIVE · picker built URLs on the WRONG HOST
  what → switched to B2 · vault, drilled to img/01-illustrations/illustration-01 → 9 images, 0 loaded
  what → src was `https://r2.kolkrabbi.io/img/…` — an R2 host for a B2 vault key
  why → only `pick()` had been made bucket-aware; the grid thumbnails, the lightbox and Copy URL still called `mediaUrl(key)` with no bucket, silently falling back to publicBase
  after → all five call sites take `bucket`; display uses `mediaSrc` (proxies R2, leaves B2 direct), Copy URL keeps the real public URL
  verify → re-run same path: 9/9 loaded from `https://b2v.kolkrabbi.io/…`, direct, no proxy
  note → build was green through the whole bug — only the live check caught it

[06:55 GMT · 2026-08-28] · ✅ R2 CORS IS LIVE — mirror's "pending" was stale by hours
  what → kol-r2b2 shipped the bucket policy 2026-08-27; verified independently from here
  verify → `curl -H "Origin: …" https://r2.kolkrabbi.io/01.jpg` → `access-control-allow-origin: *`
  note → policy committed at kol-r2b2 `config/r2-cors.json`, documented `docs/operations/04-r2-cors.md`; `Range` allowed so video seeking preflights
  note → the /media proxy is now OPTIONAL, not load-bearing. Do NOT just delete it — the header is on the RESPONSE, so anything cached from a pre-policy load stays non-CORS and still taints. crossOrigin="anonymous" must ship FIRST (it partitions the cache). fxr already sets it for http(s) srcs in LayerRenderer, so step 1 is effectively done.
  note → r2b2's sequence: attribute first behind the proxy → one surface direct → the rest → delete the rewrites
  note → keeping the proxy is also defensible (survives a host change, gives cache control)

[06:55 GMT · 2026-08-28] · uploads — RULED, stays read-only
  what → kol-r2b2 ARCHITECTURE §2/§4: writes stay centralised there, consumers must NOT grow their own /api/library/upload
  why → writes sit behind HTTP Basic on a shared ADMIN_PASSWORD a browser app cannot hold; per-app tokens or signed upload URLs are their user's call, unbuilt
  note → fxr stays READ-ONLY; writes go through the `bucket-r2` CLI or a human

[07:05 GMT · 2026-08-28] · ⤺ SHIPPED A BROKEN BUILD FOR ~20 MIN — media-client 0.3.0/0.3.1
  what → both versions had `if (import.meta.url === \`file://${process.argv[1]}\`)` at module top level (index.js:202)
  why → a top-level `if` runs on EVERY import; `process` is undefined in a browser → ReferenceError before any export resolves → white screen
  → fxr had 0.3.1 installed and WAS broken; kol-mirror took the white screen for real
  after → 0.3.2 (self-test moved to `src/selftest.mjs`); also took shell 0.17.1 · component 0.128.0 · theme 0.89.0
  verify → grep process → 0 · imports with `delete globalThis.process` · all six routes loaded in a browser with pageerror+console listeners, 0 errors

[07:05 GMT · 2026-08-28] · 🔁 THE SAME ROOT CAUSE, TWICE IN ONE SESSION
  1 → forked NavRail from 0.16.0 source held in context AFTER bumping to 0.16.1; filed a defect that was my own fork's bug
  2 → browser-verified media-client on 0.2.0, then bumped 0.3.0 → 0.3.1 on node checks + `pnpm build` alone
  → both are treating a PRE-BUMP observation as still true. 0.2.0 had no `process` reference at all, so the clean browser pass was honest when taken and stale ten minutes later.
  LAW → after any dependency bump: re-read the source FROM DISK, and load the app in a BROWSER. Build-green + node-green is not "it loads" — a runtime import failure is invisible to both.

[07:24 GMT · 2026-08-28] · 🐞 ROOT-CAUSED + FIXED · video rendered BLACK while the transport was stopped
  what → `readyState 4` does NOT mean a frame can be composited. A detached <video> that has never played has no PRESENTABLE frame, so `drawImage` paints nothing.
  measured → same element, rs 4, drawn before a seek → 1 distinct colour · after a completed seek → 575
  why labs → it opens with the clock stopped, so the video was never played AND never seeked. The randomiser and the editor both hid it by calling transport.play() on insert.
  after → `useSourceMedia` primes a frame before publishing when the transport is paused: seek to 1/240s (inside frame 0 for anything ≤240fps, so visually frame 0), publish on `seeked`, publish anyway on a 400ms timeout so a codec that never fires it still renders
  why not currentTime=0 → already 0, so no seek, no `seeked`, no frame
  verify → labs, transport NEVER touched: 295 distinct (was 1) ✓ · press play → advances, ct 0.58, 298 ✓ · swap video→image (the morning's crash path) → 387, 0 errors ✓ · build ✓

  ⤺ TWO EARLIER GUESSES THAT WERE WRONG, both kept honest in the log:
    1 `loadedmetadata` → `loadeddata` — correct on its own merits, KEPT, did not fix it
    2 "one-shot draw missed the frame" — disproved: forcing a real re-render still painted flat
  → what settled it was measuring drawImage output per element, not reasoning about the render path

[07:24 GMT · 2026-08-28] · T7 closed · T6 remains
  verify → labs image+effect ✓ · labs video+effect ✓ (paused AND playing) · randomiser video ✓ · randomiser video+effect ✓ · video→image swap ✓
  open → T6 webcam / phone camera — needs real hardware, not automatable from here
