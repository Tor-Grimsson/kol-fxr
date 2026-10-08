# Plan — Home is your files

**Status:** BUILT AND WALKED 2026-10-08 on the built bundle + the local Worker (`plan08-walk.mjs`, 18 checks; the sync, morph, home and route walks re-run green). Deviations: `⌘O` not `O` (Ellipse tool); file verbs on the list layout only (the grid card draws its actions over the title), list is Home's default once signed in; an opened file loads after the chrome's boot, or the default aspect overwrote its own. Note: a page reload ends the sign-in session by design (password never stored).
**Origin:** user, 2026-10-08 — *"why are there 3 files in the library to begin with … chrome type isn't a file … use it for files, and make another shortcut for the files overlay."*

## The mistake this fixes

Home's RECENT shows three cards: Editor, Labs, Randomiser. Those are **chromes, not files**, and they are already in the rail. The catalog Home is built on exists to list files, and it lists none until you click SAVED.

## The plan

1. **Signed in, Home lists files.** RECENT = saved presets newest first, the last 12. SAVED = every saved preset. **Signed out, Home stays exactly as it is today** — the three chrome cards on RECENT. The switch is the rail's session.
2. **A card opens its file.** `/editor?open=<id>`, or `/labs?open=<id>` when the preset is a single generator layer. The chrome reads `open` once on mount, loads it through `loadPreset`, and adopts its id and name so a plain Save overwrites it.
3. **Rename, duplicate and delete on each card,** through the provider's verbs, so they sync when signed in.
4. **The Files overlay gets a key.** `⌘O` (Ctrl+O) opens it from any chrome, listed in the `S` sheet — `O` alone is the editor's Ellipse tool. The overlay stays the in-chrome quick access; Home is the full view.
5. **The Library page** keeps the other slots (palettes, patterns, type), minus the placeholders when real items exist.
6. **Walk on the built bundle.** Sign in, files on Home, open one, rename it, see the rename on a second profile, `O` opens the overlay, zero console errors.
