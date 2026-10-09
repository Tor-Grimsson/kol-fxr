# Plan — The front door: share metadata, a boot curtain, the dark home-screen icon

**Status:** BUILT 2026-10-09 (local, `/kol-goal go`). Dark touch icon + manifest (light pair retired to `_tmp/2026-10-09-plan-25-light-touch-icon/`), share tags, `public/og/fxr.{svg,png}`, About text without the library clause, the boot curtain. Walked on `vite preview` throttled to 1.5 Mbps: the curtain paints before the bundle in light, dark, forced-dark and reduced-motion, and leaves after first render; 0 errors. Owed to the user: a real unfurl after deploy, and re-adding FXR to the home screen (iOS caches the old icon).
**Origin:** user, 2026-10-09: *"have we done any sort of metadata/opengraph/descripton/seo blabla in this repo?"* · *"I would also maybe add some intro? just some simple entry loader?"* · the home-screen shot: FXR's icon reads as grey letters on grey beside R2B2's white-on-black — *"maybe the dark mode is making white grey? … lets use dark mode touch icon instead?"*

## 0. Prerequisites
- Copy in the brand register (`/tone-of-voice`): clear, quietly confident, no hype, design vocabulary. ⚠ The skill's brand-guide path (`kol-studio/data/studio/11-brand-voice-guide.md`) is gone — locate the guide; the skill's pointer is a dotfiles fix (lobby ticket, not this repo).
- Verification on `vite preview` of the built bundle; a link-preview check with a real unfurl (Slack / iMessage) after the user deploys.

## 1. The home-screen icon goes dark
- **Why it went grey:** the installed icon is `apple-touch-icon-light.png` — dark lettering on a light ground. iOS's dark home-screen appearance darkens a web clip's light ground, so it lands grey-on-grey. R2B2 ships light ink on black, which dark mode leaves alone.
- `index.html`: `apple-touch-icon` → `/touch-icons/apple-touch-icon-dark.png`. `manifest.webmanifest`: the dark PNG + SVG as the `any` icons (the manifest's `background_color` is already `#121215`). The light pair stays in `public/` unused, or retires to `_tmp/` — one icon, one look.
- An installed web clip caches its icon: remove FXR from the home screen and add it again to see the change.

## 2. Share metadata (static, in `index.html`)
- Crawlers that build link previews never run the app's JavaScript, so every tag sits in the static head.
- `description`, `og:type` website · `og:site_name` Kolkrabbi · `og:title` Effexor FXR · `og:description` · `og:image` (absolute URL) + `og:image:width/height` · `twitter:card` summary_large_image.
- Copy (drafted from the app's own About text, brand register): *"A design compositor — frames, layers and vector tools, with generative, kinetic-type and effects layers on one engine."*
- `robots: noindex, nofollow` STAYS — FXR is a tool, not a landing page; previews work regardless.
- The manifest's `description` takes the same sentence.

## 3. The share image
- `public/og/fxr.png`, 1200 × 630: the FXR glitch lettering (`favicon.svg`'s mark) centred on `#121215`, white ink — the dark touch icon's language at banner proportion. Rendered from an SVG source kept beside it (`public/og/fxr.svg`).

## 4. The About text, corrected
- `AppLayout.jsx`'s About still says FXR *"ships as the standalone app and as the embeddable `@kolkrabbi/design-editor` library"* — nothing has been published from this repo since 2026-10-08 (ARCHITECTURE § N). Copy change, so it needs the user's yes: drop the library clause.

## 5. The boot curtain (entry loader)
- **In `index.html`, not React:** the main chunk is ~9 MB, so the blank wait is the bundle download — a React loader would only appear after the wait it is meant to cover. A static curtain paints instantly.
- Shape: full-viewport `#121215` (light theme: `#FAFAFA`, read from the boot script's `data-theme`), the FXR mark centred at 64px with a slow opacity pulse; nothing else — no text, no progress bar.
- Exit: `main.jsx` removes it after React's first commit, fading 240ms. `prefers-reduced-motion` → no pulse, no fade.
- Inline `<style>` in the head (the only CSS that exists before the bundle) — the one place Tailwind cannot reach.
- Not the DS `LoaderOverlay`: it mounts after React, which is after the wait. Noted in plan 17 only if a DS boot-curtain seam would serve other apps (kol-monitor, kol-mirror have the same chunk problem).

## 6. Verification
- `vite preview` with network throttled: the curtain paints at once, fades out on first render, never flashes white; reduced-motion honoured; both themes.
- `index.html` head validated (opengraph.xyz or a Slack unfurl after deploy); the OG image loads at its absolute URL.
- Home screen: re-added on the user's phone in dark appearance reads white-on-black like R2B2.
