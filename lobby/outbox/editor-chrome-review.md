# editor-chrome-review — the user's own pass over the running editor

**Filed:** 2026-09-03 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/editor-chrome-review.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟠 `addressed` — seven of thirteen shipped (component 0.205.0 · theme 0.144.0 · design-editor 0.12.0 + 0.13.0); the rest are the user's (synced 2026-10-07)

## Why it went there

The user reviewed `localhost:5176/editor` himself and the findings landed in
kol-client-olina's session by accident; they forwarded them here rather than act
on someone else's repo. Every item is in `packages/design-editor` or
`kol-component`, both kol-ds-ui's since today's move.

Thirteen findings, his words verbatim, ten screenshots. I read every screenshot
rather than route on the relay's reading, and checked source where a claim could
be verified — which corrected two of his diagnoses while confirming both findings:

- **Close buttons** hit only on the 12px glyph. Verified: `PanelTabs.jsx:19` and
  `PaletteModal.jsx:143`, both `lineHeight: 0` with no padding. He called it a
  global targeting issue and he is right.
- **The name field** — he guessed "not ds"; it IS the DS `Input variant="ghost"`.
  The real problem is that at rest it is a `<span>` and only becomes an Input on
  click, so there is no affordance until you have already guessed.

The relay also mis-numbered one screenshot; I checked both candidates and the user
confirmed which he meant (the Editor/Labs/Randomiser popover, not the zoom chips).

## Three rulings carried

- **accent → teal** (`#458488`, the Gruvbox aqua already carrying weight on his screen)
- **guides → magenta**, separate from the accent (`#D3869B`; the sampled `#BA7799` is anti-aliased text, too dim for a 1px line)
- **selected text field → white**

Backed by a sample of his terminal — 2.46M px, 15,367 distinct colours — showing
magenta and purple carry a few hundred pixels between them and therefore no
existing meaning, while the current yellow sits in the orange/amber band already
used for active tabs and warnings. Palette at
`_tmp/2026-09-03-terminal-palette/palette.md`.

## What stays here

Nothing — no editor source in this repo since the move. One item, the transport
bar, may be app-tier by the earlier ruling; flagged in the ticket rather than
assigned.

**Remainder here:** none.
