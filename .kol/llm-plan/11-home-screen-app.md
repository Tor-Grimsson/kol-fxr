# Plan — Home-screen app

**Status:** BUILT 2026-10-08 — `public/touch-icons/` (four files, verbatim), `public/manifest.webmanifest`, seven head lines in `index.html`; the favicon was diffed byte-identical to the media app's before copying. Dev server serves the manifest as `application/manifest+json` and the PNG 200. The on-device Add to Home Screen is the user's check.
**Origin:** user, 2026-10-08 — *"does this app have this app type function set where you can save a safari website to home screen? with an app icon?"* No: `index.html` carries the SVG favicon and the viewport meta only. Add to Home Screen lands as a bookmark with a page screenshot and opens inside Safari's chrome.

## The reference

kol-website `apps/media` — `index.html` lines 10–22, `public/manifest.webmanifest`, `public/touch-icons/` (dark + light, png + svg). Seven head lines: `apple-touch-icon`, `manifest`, `mobile-web-app-capable`, `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style: black-translucent`, two `theme-color` metas per scheme. The KOL touch icon spec is in the SVG itself (24-grid, mark on the 18×18 keyline square, rx1 at x3 y3, 180×180 out).

## Steps

1. `public/touch-icons/` — the four files from `apps/media`, verbatim. First compare this repo's `public/favicon/favicon.svg` with kol-website's mark; if it differs, stop and say so — the icon is the brand's call.
2. `public/manifest.webmanifest` — media's shape: name `Effexor FXR`, short_name `FXR`, description = Home's lede, `display: standalone`, `start_url` / `scope` `/`, the two icons. No `orientation` — labs runs landscape on a tablet. Colours from the theme's dark surface, not media's literal unless they match.
3. `index.html` — the seven head lines after the favicon link. `viewport-fit=cover` is already there.
4. `black-translucent` puts the page under the status bar: check the shell's safe-area padding on `/`, `/labs`, `/editor` at 390.
5. Verify on the built bundle: `/manifest.webmanifest` served as `application/manifest+json`, the head carries the lines, the icons resolve. The on-device Add to Home Screen is the user's check.
