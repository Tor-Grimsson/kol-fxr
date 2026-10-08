# Plan — Mobile: the rail, the viewer, the media library

**Status:** BUILT 2026-10-08 (cloud session) § 1 · 2 · 4, walked at 390 touch emulation (`walk-mobile.mjs`): the sheet drags (422 → 572, the stage refits live, tap still cycles, drag under 96px collapses; the randomiser's sheet too), the floating play button + transport chevron, Media in the rail at sign-in (the DS modal library opens over the stores — the listing itself needs the network this container lacks). § 3: the standalone safe-area rule added, unverified. § 5 is the user's device.
**Origin:** user, 2026-10-08, on a phone at `fxr.kolkrabbi.io` (labs, and the home-screen app):
- *"the fake handle there, that only works on click, draggable to resize height"*
- *"the transport could be folded into an overlay button … a full circle icon container … with the play icon, maybe even draggable or it folds somehow into the edges … you dont need it visual all the time … real estate available. on mobile its very important"*
- *"'save to home screen' its not using the space available? … I also am not getting a propper logo, just an E"*
- *"access to r2b2 buckets media in the rail upon login … the explorer like at media.kolkrabbi.io"*
- *"we have a component with 2 variants for it that DS ships"* — the grab gesture.

Follows plan 02 (labs on phones, built 2026-09-01/02, emulation-verified only).

## 1. The sheet handle drags

- **Now:** the labs params sheet on touch shows a handle that only toggles on tap; it mounts no drag hook (`LabsView.jsx:334`). The sheet takes a fixed half, so the canvas sits small and the sheet has dead space under its last row (the home-screen app screenshot).
- **Do:** the DS gesture, the two variants it ships: `useGrabEdge({ axis: 'x' })` for the pill on the horizontal edge, `useDragResize` for tap = toggle, drag = height. The sheet's height goes on a `:root` variable the canvas reads, so the stage grows as the sheet shrinks. Snap collapsed under the DS snap, as the rail does.
- **Done when:** on a 390 touch viewport the handle drags between collapsed and ~80%, the canvas refits live, a tap still toggles.

## 2. The transport folds into a floating button

- **Now:** the bottom bar is ▶ · Output · File at all times on phones.
- **Do:** one round floating button over the canvas, the play glyph (the DS circular icon container — the one a *Create new* modal wears; find it before drawing anything). Tap = play/pause; long-press or a chevron opens the transport sheet (loop length, Output, File). It sits in a corner and folds to the edge when the sheet is up. Dragging it: not now — only if the fixed corner proves to be in the way.
- **Done when:** the bottom bar is gone on phones, play works from the button, Output and File still reachable.

## 3. Home-screen app: the icon and the space

- **Icon:** plan 11's icon and metas went live in `fxr-1006` (today). iOS takes the icon at the moment of *Add to Home Screen*, so an app saved before that keeps the letter. **Do:** nothing in code — delete and re-add the app once. After that it updates on every visit. Check `manifest.webmanifest` once on the live site in case `/touch-icons/` is served with the wrong type.
- **Space:** the same sheet as § 1 — fixed half. § 1 fixes it.
- **Safe area (plan 11 step 4):** `black-translucent` puts the page under the status bar — check the shell's padding on `/`, `/labs`, `/editor` at 390.

## 4. The media library in the rail

- **Now:** the three stores (R2 433 · B2 website · B2 vault) are reachable only through the source picker inside a layer.
- **Do:** a rail row at sign-in, **Media**, opening the DS browse surface (`MediaLibrary variant="browse"`, the one `media.kolkrabbi.io` runs) over the three buckets, with the store selector the picker already has. Read-only — writes go through the `bucket-r2` CLI (kol-r2b2 ruling). On phones it is a full sheet.
- **Done when:** signed in, Media lists all three stores; a picked file lands as a photo layer (labs) or in the picker's slot (editor).

## 5. Real-device pass

Everything mobile since 2026-09-01 was checked under touch emulation only; finger drags on the rail sliders are the untested part. Needs the user's phone: § 1, § 2 and the Penrose heavyweights at least.

## Verification

Chromium here, `vite preview` of `pnpm build`, 390 touch emulation — then § 5 on the device.
