---
title: Media & Library
type: reference
status: active
updated: 2026-10-10
description: The four media sources (photo, video, webcam) as first-class photo layers through the plain / canvas-filtered / GL-filtered render paths, plus OS drag-drop, IndexedDB clip persistence, and the CDN media library behind the same-origin /media proxy.
aliases:
  - media
tags:
  - project/kol-fxr
  - editor/media
  - editor/persistence
  - domain/cdn
covers:
  - photo source (upload objectURL, fit, crop) and the three render paths
  - video source (transport-governed playback, trim in/out, rate/loop/muted, video crop)
  - IndexedDB clip persistence (clips survive reload)
  - webcam source (getUserMedia registry, mirror, always-live)
  - OS file drag-drop onto the stage
  - the media library (MediaPicker) and the /media same-origin proxy
sources:
  - src/editor/compose/LayerRenderer.jsx
  - src/editor/params/schemas/photo.js
  - src/editor/compose/CanvasArea.jsx
  - src/editor/compose/CropOverlay.jsx
  - src/editor/compose/build.js
  - src/editor/lib/clipStore.js
  - src/editor/lib/webcam.js
  - src/editor/library/mediaLibrary.js
  - src/editor/library/MediaPicker.jsx
  - src/editor/library/LibraryProvider.jsx
related:
  - "[[../00-overview/INDEX|overview]]"
  - "[[../02-layers/INDEX|layers]]"
  - "[[../04-effects/INDEX|effects]]"
  - "[[../08-export/INDEX|export]]"
  - "[[../11-persistence/INDEX|persistence]]"
---

# Media & Library

Media is a `photo` layer. There is exactly one layer type for pixels, and it carries a `srcType` discriminator — image, `video`, or `webcam` — so a clip and a live camera feed are **first-class photo sources**: every one flows through the same fit, crop, filter, and export machinery. The differences are narrow (a video is transport-governed, a webcam is always-live) and handled by dedicated render components, not a separate layer type.

Two orthogonal stores sit behind the layers: the **CDN media library** (a read-only bucket browsed through `MediaPicker`, reached via the same-origin `/media/` proxy) and the **saved-preset library** (a localStorage store of user-saved palettes/patterns/type/presets). They share the word "library" and nothing else.

## The photo source

A `photo` layer's pixels come from a `src` URL (plus `srcType`). Uploads enter as an `objectURL` (`blob:…`) minted from the picked `File`; library picks enter as a `/media/`-proxied CDN URL; drops mint an `objectURL` at the drop point.

| Prop | Meaning |
|---|---|
| `src` | Image/video URL — `blob:` (upload/drop), proxied CDN, `data:`. Absent for webcam. |
| `srcType` | `undefined`/image · `'video'` · `'webcam'`. Selects the render component. |
| `fit` | `cover` · `contain` · `fill` — see below. |
| `imgX/imgY/imgW/imgH` | Crop window (frame-local px). Set = cropped; unset = object-fit render. |

### Fit

`fit` (schema default `cover`) governs how the source fills the layer box. On the plain path it is the CSS `object-fit`; on the filtered paths it is baked by `drawFitted` — `contain` scales by `min(w/sw, h/sh)`, `cover` by `max(…)`, `fill` stretches to the box. (`src/editor/params/schemas/photo.js`, `LayerRenderer.drawFitted`.)

### Crop

Crop is an explicit rect, not an `object-fit` mode. `CropOverlay` writes `{imgX,imgY,imgW,imgH}` — the source's draw rect in frame-local px — and the render clips that rect to the `{w,h}` frame inside an `overflow:hidden` box. `enterCrop` (`CanvasArea`) seeds the rect from the current `fit` math; for a video it reads the intrinsic size off a detached `<video>`'s metadata (no `naturalWidth`). The overlay shows a 35%-opacity full-extent ghost of what falls outside the crop — a `<video>` for video sources (`<img src=blob:video>` renders blank). Export bakes a cropped layer as `<g clip-path><image …/></g>` (`build.js`).

**Cropped sources ignore filters in v1** — the crop branch's frame-local image math doesn't compose with the fitted-source pipeline, so the plain path wins (`filterable` requires `imgW == null`).

### The three render paths

Every source is dispatched through one of three paths, chosen by whether the layer carries an enabled filter chain and whether that chain terminates in a GL engine (`LayerRenderer` `case 'photo'`):

| Path | Component | How the source is drawn |
|---|---|---|
| **Plain** | `PhotoLayer` → `<img>` / `VideoPhotoLayer` / `WebcamPhotoLayer` | A direct DOM element. No canvas cost. `object-fit` handles fit. |
| **Canvas-filtered** | `FilteredPhotoLayer` | Source drawn into a fitted source canvas (`fitSource`), run through the 2D filter chain (`runChain`) onto a positioned `<canvas>`. |
| **GL-filtered** | `EngineFilterLayer` | Canvas stages → Pixi batch → a terminal three.js engine (the chain's GL stage is always terminal). |

Video and webcam are first-class across all three: a video's fitted source is rebuilt **fresh per transport tick** on the canvas path (2D filters key their pixel caches on canvas identity) and redrawn **in place + `touchSource`** on the GL path (the `CanvasTexture` binding is stable); a webcam drives the canvas chain from a **self-owned rAF** so the feed flows through filters even while the transport is stopped. (See [[../04-effects/INDEX|effects]] for the chain itself.)

## The video source (`srcType: 'video'`)

A video is a photo source that decodes to a `<video>` instead of an `<img>`, and whose playback is **governed by the transport clock** rather than autoplaying.

### Transport-governed playback

`VideoPhotoLayer` (plain) and `syncVideoTransport` (filtered paths) map the transport onto the element: play/pause follows the clock's play state, and a **rewind/stop** (a `resetEpoch` bump) snaps `currentTime` back to `trimIn`. Renders are rare by design — the browser keeps decoding with near-zero JS between them. The ref re-asserts `muted` because React drops the attribute and Chrome refuses programmatic `play()` without it.

### Trim window

`trimIn` / `trimOut` are normalized fractions (0–1) of clip duration that bound a loop window `[inSec, outSec]`. They are `animatable:false` — structural, not a per-frame modulation target (binding them would re-seek every tick).

| Case | Behaviour |
|---|---|
| Untrimmed (`[0,1]`) | Native `loop` attribute — seamless full-clip repeat. |
| Trimmed + `videoLoop` on | Native loop off; a `timeupdate` listener (~4×/s, no rAF) wraps `outSec` → `inSec`. |
| Trimmed + `videoLoop` off | Pauses held at `outSec`; not auto-resumed on incidental re-renders. |

### Playback knobs

Video-only schema knobs (`section: 'Video'`, `when: isVideo`): `playbackRate` (Speed, 0.25–4), `videoLoop` (Loop toggle), `videoMuted` (Muted toggle). They surface only for a video layer.

### Video crop

A video crops exactly like a photo — `enterCrop`'s video branch reads intrinsic size off a detached `<video>`; `CropOverlay`'s ghost uses a muted `<video>`; `VideoPhotoLayer`'s cropped branch draws the `<video>` at its frame-local rect (the inner `<video>` carries `data-layer-id` so the export query finds it); `build.js` snapshots the live frame to a temp canvas and emits a cropped `<image>` clip.

### IndexedDB clip persistence

An uploaded clip's `objectURL` (`blob:…`) is void after reload — the [[../11-persistence/01-draft-autosave|draft autosave]] persists the layer (id + now-dead `src`) to localStorage, but the blob is gone. `clipStore.js` is the side-channel: it stores the clip `Blob` in IndexedDB keyed by the video layer's id, and `hydrateVideoClips` mints a fresh `objectURL` for it during draft restore.

| Function | Role |
|---|---|
| `saveClip(id, blob)` | Persist a clip Blob under a video layer's id (upload + drop paths). |
| `hydrateVideoClips(layers)` | On restore, mint fresh `objectURL`s for any video layer whose `src` is a dead `blob:` and whose clip was persisted. |
| `deleteClip(id)` | Drop one clip — fired when a video layer is deleted (`removeLayer`, incl. layers nested in a group/bool). |
| `gcClips(layers)` | On load, reclaim every stored clip not owned by the restored canvas — closes the orphan vectors (File→New, Clear, crash, declined restore) that per-delete cleanup can't. |
| `loadClip(id)` | Read one Blob. |

Only local `blob:` uploads are stored — library/CDN (`http`) videos already survive reload, so a stale clip under a reused id can never override a live source (both passes guard on `src.startsWith('blob:')`). Storage degrades silently (private mode, quota): the clip just doesn't survive, exactly as before.

## The webcam source (`srcType: 'webcam'`)

A live camera is a photo source with **no `src`** — a `MediaStream` is neither JSON-serializable nor draft-safe, so it can't live on the layer. The layer carries only `srcType: 'webcam'`; the stream lives in a registry keyed by layer id (`webcam.js`).

| Function | Role |
|---|---|
| `ensureWebcam(id)` | Request/return a live stream. Idempotent + race-safe — an in-flight `getUserMedia` promise is shared so the source button's user-gesture request and the mount effect don't double-prompt. |
| `getWebcamStream(id)` | The active stream, or null (synchronous). |
| `stopWebcam(id)` | Stop the tracks (camera light off) + drop the entry. |

**Lifecycle is owned by `LayerRenderer`'s top-level effect**, above the render-path switch — the stream is keyed to the layer, not any one render component, so it survives plain↔filtered↔GL swaps that remount the child. Cleanup stops the tracks on delete, source change, and unmount.

**Always-live, not transport-gated.** `WebcamPhotoLayer` (plain) attaches the `srcObject` and lets the browser paint — no play/pause/trim wiring (a camera always runs). On the filtered paths the feed is driven by a self-owned rAF.

**Mirror.** The `mirror` toggle (schema `section: 'Camera'`, `when: isWebcam`, default on) is the selfie-view flip, distinct from the generic layer `flipX`. On the plain path it's an extra `scaleX(-1)` composed onto the layer transform; on the filtered paths it's applied **pre-filter** inside `drawFitted` (the source pixels are mirrored so an asymmetric filter sees the selfie frame, not a post-hoc CSS flip).

## OS file drag-drop

Dropping an image or video file from the OS onto the stage creates a photo layer at the drop point (`CanvasArea`). `onDragOver` accepts both the app's own library drag (`application/x-kol-library`) and native OS files (`types` includes `'Files'`); `onDrop` gives the internal library payload priority, else routes the first image/video file to `addDroppedFile`.

`addDroppedFile` mints an `objectURL`, sizes the layer box to the media's intrinsic aspect (probed off the same URL), fits it within ~60% of the frame, centres it on the drop, and inserts through the shared `addLayer('photo')` path — same upload semantics as the File tab. A dropped **video** is persisted via `saveClip(id, file)` so it survives reload; a dropped **image**'s `objectURL` is session-only (no image side-channel).

## The media library

### MediaPicker — the CDN browser

`MediaPicker.jsx` is a modal over the read-only `kol-media` CDN bucket. The whole bucket is listed once on open (`listMedia('')`) and the folder tree is derived **client-side** from key path segments — `prefix` is the current folder, the text input is a secondary name filter within it.

| Feature | Detail |
|---|---|
| **Bucket grid** | Auto-fill 160px lazy thumbnails (image `<img>` / video `<video preload=metadata>`). |
| **Folder drill-down + breadcrumb** | First path segment below `prefix` becomes a folder row; breadcrumb (`root / seg / seg`) walks back up. |
| **Lightbox** | Image/video preview, ←/→ step, Esc close (owned by the lightbox so one press steps back a level, not straight out), name + `formatSize`. |
| **Copy URL** | Click-to-copy the public CDN URL. |
| **`accept`** | `image` · `video` · `all` — filters which files are pickable/shown. |

Pick contract: `onPick(url, { contentType })`; the caller rewrites the URL through `proxied()` before storing it on a layer.

### mediaLibrary.js — access + the proxy

`mediaLibrary.js` is public, no-auth: list via the admin API, fetch objects by public URL.

| Export | Role |
|---|---|
| `listMedia(prefix)` | `GET admin.kolkrabbi.io/api/list` → `[{ key, contentType, size }]`. |
| `mediaUrl(key)` | `https://media.kolkrabbi.io/<key>` — the public URL. |
| `proxied(url)` | Rewrite a public CDN URL to the same-origin proxy path. `data:` / `blob:` / already-proxied pass through untouched. |
| `setMediaProxyBase(base)` | Set the proxy path (for embedders). |
| `isImageType` / `isVideoType` / `formatSize` | Content-type + human byte-size helpers. |

### The `/media/` same-origin proxy (embedder requirement)

The CDN sends **no CORS headers**, so a cross-origin media load taints the canvas — and a tainted canvas breaks photo filters (`getImageData` throws) and export. The fix: never load CDN media cross-origin. `proxied()` rewrites `https://media.kolkrabbi.io/…` to a same-origin path (default `/media/`), and the host proxies that path to the CDN.

| Mode | How `/media/*` is proxied |
|---|---|
| App (dev/preview) | Vite proxy (`vite.config.js`). |
| App (prod) | `vercel.json` rewrite `/media/:path*` → the CDN. |
| **Embedder** | Stand up your own `/media/* → media.kolkrabbi.io` rewrite and pass its path to `<DesignEditor mediaProxyBase="…" />` (calls `setMediaProxyBase`). |

Because `proxied()` only rewrites CDN URLs, uploads (`blob:`) and webcam (no `src`) are untouched — they're already same-origin.

### The saved-preset library

The editor's **other** library — `LibraryProvider.jsx`, a localStorage store of user-saved generator assets (`palette` · `pattern` · `type` · `preset`), unrelated to the CDN — is documented under [[../11-persistence/03-saved-library|persistence → saved library]]. It shares only the word "library" with the MediaPicker above.

## Source map

| File | Role |
|---|---|
| `src/editor/compose/LayerRenderer.jsx` | Photo/video/webcam layers + the three render paths (`PhotoLayer`, `VideoPhotoLayer`, `WebcamPhotoLayer`, `FilteredPhotoLayer`, `EngineFilterLayer`); `drawFitted` / `fitSource` / `trimWindow` / `syncVideoTransport`. |
| `src/editor/params/schemas/photo.js` | Photo/video/webcam schema — `fit`, `playbackRate`, `trimIn`/`trimOut`, `videoLoop`/`videoMuted`, `mirror`. |
| `src/editor/compose/CanvasArea.jsx` | `enterCrop` (photo + video branch), OS drag-drop (`addDroppedFile`, `onDrop`/`onDragOver`). |
| `src/editor/compose/CropOverlay.jsx` | Crop rect authoring + full-extent ghost (image/video branch). |
| `src/editor/compose/build.js` | Export — live-frame snapshot for video, cropped `<image>` clip branches. |
| `src/editor/lib/clipStore.js` | IndexedDB clip persistence — `saveClip` / `hydrateVideoClips` / `loadClip` / `deleteClip`. |
| `src/editor/lib/webcam.js` | Webcam `MediaStream` registry + lifecycle — `ensureWebcam` / `getWebcamStream` / `stopWebcam`. |
| `src/editor/library/mediaLibrary.js` | CDN access — `listMedia` / `mediaUrl` / `proxied` / `setMediaProxyBase` + type helpers. |
| `src/editor/library/MediaPicker.jsx` | The CDN browser modal — bucket grid, folder drill-down, breadcrumb, lightbox, copy-URL. |
| `src/editor/library/LibraryProvider.jsx` | The saved-preset store — documented in [[../11-persistence/03-saved-library\|persistence → saved library]]. |
| `src/index.jsx` | `<DesignEditor mediaProxyBase />` — the embedder's proxy-path prop. |
</content>
</invoke>

## 2026-10-10 changes (plan 26)

- **An uploaded still lives in the file.** Every image upload — editor footer, drag-drop, labs — goes through `src/editor/lib/stillUpload.js`: decoded, downscaled to 2048 on the long side, re-encoded webp, stored as a data URL in `src`. It survives reload, sync and other devices; video stays on the clip store. GIF and SVG pass through untouched.
- **Opening a saved file re-links its clip-store uploads** (files saved before the change): `loadPreset` re-keys each clip to the layer's new id and swaps a live objectURL in.
- **Export inlines photos.** Every raster export draws the frame as an SVG inside an `<img>`, which fetches nothing — so an unfiltered photo came out blank in thumbnails, PNG, batch and webm. `useComposeFile` now warms each photo's data URL before the build.
- **Model files** for the 3D scene live in R2 (`meshes/…`, uploaded with `bucket-r2 up`), picked from the media library with a `.obj/.glb/.gltf/.stl` filter.
