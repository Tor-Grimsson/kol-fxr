# editor-pin-is-30-versions-back — kol-fxr cannot see the DS components raided from its own editor

**Filed:** 2026-09-03 ← **kol-client-olina**
**Package:** `@kolkrabbi/kol-component` — pinned here at **0.152.0**, current is **0.182.0**
**Related:** kol-ds-ui `lobby/inbox/design-editor-set-is-a-half-port.md` (open, ask 3 held on this repo's answer)

## Why this is yours and not ours

It reached kol-client-olina by accident — the user asked that repo to scope the DS's
`/sets/design-editor`, and the scoping turned up a question only this repo can
answer. The work is yours; the ticket is the handoff.

## What happened

The DS raided **this repo's** `src/editor` in 2026-07 and shipped the frame:
`EditorShell` · `Canvas` / `CanvasFrame` / `PanViewport` · `SelectionOverlay` ·
`AlignmentGrid` · `SplitToolButton` · `InspectorSection` · `PropertyInput` ·
`TabsRow` · `ColorInputRow` · `SwatchControls` · `SpectrumControls` ·
`PaletteHarmonyWheel`.

kol-ds-ui then checked who imports them. **Zero external importers** for all but
two — `ColorInputRow` and `PropertyInput`, the two that were never
editor-specific. The source repo is not running the port.

The reason is a stale pin. `shell/panels/ToolPalette.jsx` hand-rolls the split
trigger out of `PopoverPanel` + `usePopover` at `BTN = 36 / ICON = 22` — not a
disagreement with `SplitToolButton`, which this repo **cannot see** at
`kol-component@0.152.0`. (kol-client-olina's ticket originally read that absence
as a rejection. It was wrong and is corrected on the DS ticket.)

One thing did come out of it: `SplitToolButton`'s `size` took a raw px number
with the glyph hard-typed at 14, off the 22·26·32·40 ladder. Fixed in
**kol-component 0.182.0** — `size` is a rung (`xs|sm|md|lg`). 36 is not a rung;
the DS answer to this repo's 36/22 is `size="lg"`.

## The ask

1. **Bump `@kolkrabbi/*` to current**, pinned exact, per app. Expect visual drift on the first build — 30 versions of chrome, and this repo's editor CSS targets old selectors. That is the known cost (kol-client-olina hit the same thing on 2026-09-02 copying an app onto newer packages), not a reason to stop.
2. **Retire every editor fork that now has a DS counterpart** — the twelve above. `ToolPalette`'s trigger onto `SplitToolButton size="lg"`; `compose/SelectionOverlay.jsx`, `compose/CanvasArea.jsx`'s scale layer, `compose/AlignmentPanel.jsx` and `compose/inspectors/Section.jsx` onto their shipped versions.
3. **Report what is left.** That list is the answer to the open DS ticket: whichever panels this repo still hand-rolls after the pass are the ones worth porting — `LayerStack` 583 · `TextPanel` 463 + `ParatypeTools` 95 · `InspectorRail` 72 · the field atoms 594 · `ToolPalette` 405, ~2,200 lines. Anything you retire instead is 2,200 lines nobody has to write.

The user's position, so nobody ports on spec: **nothing more ships to the DS
until a live consumer is on the half that already shipped.** This repo is that
consumer, and the pin is the only thing in the way.

## What we hold

Nothing. kol-client-olina does not run this editor and is not blocked. No
remainder here.

---

## RESOLUTION — 2026-09-03 · 🟢 closed, all three asks answered and then superseded

**Ask 1 — bump.** Done, and repeatedly: `kol-component` 0.152.0 → 0.197.0,
`framework` 0.36.0 → 0.44.0, `theme` 0.121.0 → 0.142.0, `icons` 0.25.0 → 0.26.0,
`shell` 0.51.0, `media-client` 0.4.0, all pinned exact. The predicted visual drift
never materialised.

**Ask 2 — retire every fork onto its DS counterpart.** Started, and inverted by
the user's ruling: *fxr is the reference, the package is what's behind.* Running
the adoption proved it — three of twelve components reached parity, one was
broken on its own terms (`WheelTriangle`'s ring 90° off its own handles), and the
rest had each dropped something the editor depended on. Filed as
`editor-set-is-behind-its-source`; kol-ds-ui fixed ten of the twelve the same day,
and five were then consumed back here and verified in a browser.

**Ask 3 — report what is left.** Filed as `editor-panels-the-held-specs`:
seventeen components, props, seams and the store coupling to drop on each. Six
have shipped since.

**Then the whole question was superseded.** The user ruled that
`@kolkrabbi/design-editor` moves into kol-ds-ui. The editor source left this repo
for `packages/design-editor` and comes back as a dependency at 0.4.2 —
so "retire fxr's editor forks onto DS counterparts" is no longer a task that can
exist here. There are no forks; there is no editor source. fxr is an app.

The ticket's premise — *"kol-fxr cannot see the components raided from its own
editor"* — is dead in both directions: it can see them, and it no longer holds
the thing they were raided from.

**Remainder here:** none. See `.kol/llm-context/round-trip-inventory.md` for what
was processed and what never has been.
