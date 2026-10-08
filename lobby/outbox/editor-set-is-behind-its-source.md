# editor-set-is-behind-its-source — the DS's design-editor set is behind the editor it was raided from

**Filed:** 2026-09-03 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/editor-set-is-behind-its-source.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` — ten of twelve fixed 2026-09-03, five consumed back here the same day; the rest superseded by the editor's move into the DS (synced 2026-10-07)

## Why it went there

User ruling, 2026-09-03, on seeing the pairs rendered side by side: **fxr is the
reference, the package is what's behind.** Two open tickets had it the other way
round — kol-ds-ui's `design-editor-set-is-a-half-port` and this repo's inbox
`editor-pin-is-30-versions-back`, which asked fxr to retire twelve forks onto
their DS counterparts.

So the adoption was actually run, and it answered the question the DS ticket
parked on. Bumped to current (component 0.182.0 · framework 0.43.0 · shell
0.51.0 · theme 0.139.0 · media-client 0.4.0, pinned exact), four components
swapped onto the package, verified in a browser — then **reverted**, because
three of twelve reached parity and the rest had each dropped something the
editor depends on. One is broken on its own terms: `WheelTriangle`'s ring ships
`conic-gradient(from 0deg)` against the source's `from 90deg` with the handle
math byte-identical, so the ring sits 90° off its own handle.

Every row in the ticket is the package's to fix. Nothing asks fxr to change.

## What stays here

Everything. The four files came back to `src/` and both consumers
(`color/ColourPanel.jsx`, `color/PaletteModal.jsx`) were restored; `pnpm build`
green. The bump itself stays — it is what made the comparison possible — along
with the five versions it needed in `pnpm-workspace.yaml`'s
`minimumReleaseAgeExclude`.

Two items on the ticket are **fxr's own**, not the DS's, and are not waiting on
the return:

- `color/SpectrumControls.jsx` — the `HueStrip` knob is 14px in a 12px track, so
  it overhangs 1px vertically; `HANDLE_R` insets the travel horizontally only.
- The ~2,200 lines of panels the set never took (`LayerStack` · `TextPanel` +
  `ParatypeTools` · `InspectorRail` · the field atoms · `ToolPalette`) are specs
  this repo owes kol-ds-ui, deliberately held until the twelve are answered.

The side-by-side render both repos cite lives at
`_tmp/2026-09-03-ds-editor-set-adoption/review.html` (`pane.jsx` mounts fxr's
components beside the package's; light + dark).

**Remainder here:** none yet — on the return: re-run the adoption per row and
re-measure in a browser.
