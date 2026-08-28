# EditorOverlaysOnFullscreenOverlay — the overlay tier, ruled

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/EditorOverlaysOnFullscreenOverlay.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` in kol-ds-ui — ruled; kol-theme 0.76.0 · kol-component 0.116.0, 2026-08-27

## Why it went there

User: *"the overlays are a MESS."* Six overlays here, five different scrims,
`SCRIM = 'rgba(0, 0, 0, 0.6)'` declared byte-for-byte in two files, and
hand-typed `z-[1000]` / `z-[1100]` sitting above the DS's own z-100 overlay
layer. None of them use `FullscreenOverlay` or `.kol-overlay-scrim`, which
already ship. Not one traps focus — a Tab out of any overlay walks the page
underneath. Three questions went with it: is `FullscreenOverlay` the one
component for this tier, should the scrim be a steppable token (the lightbox
wants heavier than a settings sheet), and what is the z-contract.

## What stays here

The adoption. On the ruling: retire five local scrims + both `SCRIM` consts,
drop the hand-typed z-indices, move the four modal-shaped overlays onto the DS
component. Mobile's four full-bleed sheets stay their own shape unless ruled
otherwise.

**Remainder here:** none — adopted 2026-08-27, see below. Returned as: bump kol-theme 0.76.0 · kol-component 0.116.0; four overlays onto `FullscreenOverlay`, the lightbox onto `MediaViewer`, both `SCRIM` consts and every z-1000/1100 gone, mobile sheets on `.kol-overlay-scrim` at `--kol-z-modal`.

---

## ✅ RETURNED — 2026-08-27 · kol-theme 0.76.0 · kol-component 0.116.0

🟢 `closed` in **kol-ds-ui** — Ruled (user, 2026-08-27) and documented in `01-tokens.md § Stacking` + `§ Overlays`: (a) ONE tier — a modal-shaped overlay is `FullscreenOverlay` (Escape, backdrop, close, scroll lock, focus trap, `modal` z), a paged media view is `MediaViewer` on it (arrows fixed at the viewport edges, 10rem gutters); no third archetype. (b) NO scrim token — two fixed scrims are the vocabulary: `.kol-overlay` flat `surface-primary`, `.kol-overlay-scrim` `#000 60 %` + blur (your five `rgba(0,0,0,.6)` are that class); the lightbox takes `MediaViewer`'s flat scrim. (c) the `--kol-z-*` ladder IS the z-contract; the DS moved its own strays — `.kol-popover` / `.kol-tooltip` 1000 → `tooltip` 300, `ShellSearchOverlay` 300 → `modal` 100 — and a consumer never rises above `--kol-z-nav`, nor an overlay above `--kol-z-modal`. 21 gates clean; verified in source.

**Remainder here:** bump kol-theme 0.76.0 · kol-component 0.116.0; the four modal-shaped overlays (LabsShortcuts · BatchExportModal · PaletteModal · EditorFooter progress) onto `FullscreenOverlay`, the MediaPicker lightbox onto `MediaViewer` (or `FullscreenOverlay` + your stage), both `SCRIM` consts and every `z-[1000]` / `z-[1100]` gone; the four mobile sheets keep their shape on `.kol-overlay-scrim` at `--kol-z-modal`. Also still owed from LabeledControlSection: `AutoControls.jsx` imports `SettingsSection` — it is `LabeledControlSection` since component 0.112.0, no alias.

## ✅ ADOPTED — 2026-08-27 · kol-component 0.116.0 · kol-theme 0.77.0

Bumped (0.116.0 / 0.77.0 — the registry had moved past the ruling's 0.116.0 /
0.76.0 by the time we adopted). Every overlay is on the tier:

- **`FullscreenOverlay`** — `LabsShortcuts`, `BatchExportModal`, `PaletteModal`,
  and the `EditorFooter` webm-bake progress (that one `closeButton={false}`: a
  bake is not dismissible, which is at least what its no-dismiss hand-roll was
  already saying).
- **`MediaViewer`** — the `MediaPicker` lightbox. The whole hand-rolled stage
  went: its own scrim, its own ←/→/Esc listener, its own chevrons and close.
  The per-item row (name · size · position · Use · Copy URL) rides the
  `actions` slot.
- **`.kol-overlay-scrim` at `--kol-z-modal`** — the four mobile sheets, shape
  kept, `bg-black/60 backdrop-blur-sm` gone.
- **The z-contract** — both `SCRIM` consts deleted, every `z-[1000]` /
  `z-[1100]` gone. The `MenuItem` popover panels tracked the `.kol-popover`
  token by hand at 1000 and now read `z-[var(--kol-z-tooltip)]`, following the
  DS's own 1000 → 300 move; `SelectionPalettePanel`'s popover with them.

**The scrim clash, found on adoption:** `.kol-overlay` computed to
`surface-inverse 88 %`, not the ruling's flat ground — **kol-framework 0.28.0
shipped its own `.kol-overlay` rule** and it was out-cascading the theme's.
Retired in framework 0.29.0 (the clash `DocPageAndKindShowcase` named); bumped,
and it now computes `rgb(250,250,250)` = `--kol-surface-primary`, flat and
opaque, `display: grid` from the theme. Deps: component 0.116.0 · theme 0.77.0
· framework 0.29.0.

Verified in a browser, not just built: the shortcuts overlay opens at
`z-index: 100` with `role="dialog"` / `aria-modal="true"`, closes on Escape,
and **focus lands inside the sheet** — the trap not one of the six had. The
picker and its lightbox stack correctly (two `.kol-overlay`s, both 100), embla
paging live, Use and Copy URL present.

**Remainder here:** none. The `LabeledControlSection` half of the return was
already done earlier the same day (component 0.112.0); `AutoControls.jsx` and
`LabsParams.jsx` carry zero `SettingsSection`.
