# Bump design-editor to 0.23.0 — the library door is the DS modal now

**Staged:** 2026-10-08 · from a kol-ds-ui session
**Change:** one bump (three packages), then a look at labs' From library on a desk and a phone

---

## What changed, in one case

Labs' source card, the footer's From library and the layer inspector's media door opened
`library/MediaPicker.jsx`, a 301-line picker of the editor's own (a store dropdown, a name
filter, a breadcrumb, a thumbnail grid). It existed because the DS modal listed one bucket. The
DS modal switches buckets now, so **design-editor 0.23.0** opens `MediaLibrary variant="modal"`
from kol-component at all three doors and the editor's picker is retired
(kol-ds-ui `_tmp/2026-10-07-design-editor-media-picker/`).

What a user sees after the bump: the modal over a scrim (the old one blanked the page), the
Store dropdown, folder rows and the DS file cards, the wall's row (icon views, the sort row
below at `md+`), and on a phone a full-height sheet with one `···` for views and sort — the old
picker ran off the right edge at 390. The pick contract is unchanged:
`onSelect(url, { contentType, kind })`, the caller still `proxied()`s the URL; an SVG source
still gets vector only.

Also in the wave, if this repo draws them: `MediaViewer` passes `scrim` and shows its caption
and paging chips (they drew light on light before), with a `1 / 6` under the image on a phone;
`MediaTileGallery` is two across below `sm`.

## The fix

Bump, exact:

- `@kolkrabbi/design-editor` → **0.23.0**
- `@kolkrabbi/kol-component` → **0.241.0** (0.23.0's peer floor)
- `@kolkrabbi/kol-theme` → **0.167.0** (the modal's phone cut lives here)

Nothing in `src/` references the old picker — it was inside the package — so the version lines
are the whole change.

## Rejected alternative

Keeping the editor's picker beside the DS modal: two pickers over one bucket, which is what the
2026-09-27 editor-DS audit row "two pickers" named.

## Definition of done

- [x] the three versions installed; `pnpm build` clean
- [x] `/labs` → an effect → From library opens the DS modal: a scrim over the stage, the Store
      dropdown listing the three buckets, a pick lands on the layer as before
- [x] the same at 390: a full-height sheet, nothing off the right edge, `···` beside the search
- [x] 0 console errors on the door, both widths

---

## ✅ CLOSED — 2026-10-08 · verified by running it

Pinned exact: design-editor **0.23.0** · kol-component **0.241.0** · kol-theme **0.167.0**; `pnpm build` clean.
Walked on a task-scoped dev server with Playwright (`_tmp/2026-10-07-hub-walk/library-door-{desk,phone}.png`,
`library-pick-desk.png`):

- **1600×1000** — `/labs` → entry card → Effects → Halftone → From library: the DS modal over a scrim,
  MEDIA LIBRARY, the Store dropdown listing `R2 · media` · `B2 · website` · `B2 · vault`, folder rows,
  the file cards with Use / Copy URL, the Name · Date · Size · Kind row, Grid · List. **Use** on a card
  closes the modal and the image lands on the layer — a canvas with ink where there was none.
- **390×844 touch** — the same door: a full-height sheet, the `···` under the header, nothing off
  the right edge (no horizontal scroll), the Store dropdown and the cards two across.
- 0 console errors or warnings at either width, door open and after the pick.
