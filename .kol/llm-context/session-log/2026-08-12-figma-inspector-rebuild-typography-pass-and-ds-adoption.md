# Session: Figma inspector rebuild, typography/fonts pass, DS 0.35–0.37 adoption

**Date:** 2026-08-12
**Agent:** Grim (Fable 5)
**Summary:** The inspector was rebuilt to COPY Figma (purpose sections, property inputs, segmented strips, paint bars), the brand editor's text-morph came back as a basic text setting on a new family/style font model (incl. 45 Google families), and seven same-day DS round-trips were adopted (component/theme 0.37.0, icons 0.15.0). Visual verification via Playwright became the working discipline mid-session after repeated blind-claim failures.

## Changes Made

### Files Modified
- `src/editor/compose/inspectors/LayerInspector.jsx` — sectioned (Position/Layout/Appearance/Fill/Stroke/…); alignment-to-canvas strips; transform cluster; REAL auto-w/auto-h Resizing (tonal strip); property inputs (`X 240`, `∟ 0°`, opacity/corner with 0.15 glyphs); PaintRow (fillOpacity/hidden + eye + remove, one-container slotLeft bar); StrokeDepthRow (weight + StrokePanel popover); Effects section removed
- `src/editor/compose/inspectors/TextPanel.jsx` — TextSurface = Figma Typography (label-less Family/Style/SizeCombo, LH/LS property inputs, tonal alignment strips + slider-01 settings popover); VariableBlock (morph) moved to Parameters→Style; save-type → header ⋯
- `src/editor/modes/type/families.js` (NEW) — the font model: RG cuts / JetBrains / Google (css2 loading, no key); `src/editor/modes/type/MorphedText.jsx` (NEW, brand port); axis fields on text layers (axisBlend bindable); axis-aware flatten/export (`textOutline.js` warm packs, `build.js`); vertical align through render+export
- `src/editor/compose/AlignmentPanel.jsx` — 2× SegmentedToggle filled, stateless, canvas-align for single layer (state.jsx alignSelected)
- `src/editor/shell/panels/SelectionPalettePanel.jsx` — header ⋯ menu (booleans/flatten/Edit object/Save type) + header divider; `Section.jsx` full-bleed dividers
- `src/editor/params/dotVisibility.js` (NEW) — bind dots gated on `M` (persisted); `S` toggles ShortcutsOverlay; keymap entries
- `src/editor/compose/CanvasArea.jsx` — right-click context menu (selection-aware, system menu suppressed over canvas); `compose/paint.js` (NEW) per-paint alpha render+export
- `src/editor/mobile/MobileView.jsx` — Randomiser entry CARD (title + note + actions; Labs added as third door — UNVERIFIED in browser)
- `src/editor/Editor.jsx` — ModalProvider mounted (was silently native-confirm); restore dialog uses `Restore / New file` labels (0.35)
- `src/editor/shell/MenuTop.jsx` — Vector folded into Tools; Mode dropdown beside the title; `LabsNav.jsx` Mode section
- `vite.config.js` — dev-only yellow-X favicon plugin (`apply: 'serve'`) — WRITTEN, NOT VERIFIED (restart was rejected)
- `package.json` — component **0.37.0** · theme **0.37.0** · framework 0.18.0 · icons **0.15.0** (both blocks)
- Retired to `_tmp/`: `2026-08-12-retired-segbar/SegBar.jsx` (local twin — swapped to DS SegmentedToggle per user law)

### Features Added/Removed
- Text morph (morph/fade/random, Cut B style picker) as a basic text setting; Google Fonts render-only tier; auto-resize text boxes; per-paint opacity+visibility; corner radius (rect rx + text clip); right-click menu; M-gated dots; S shortcut toggle; Effects tab empty-state; nothing-selected empty rail.
- Removed: Content textarea, Font readout row, Inspector Effects section, phantom 0-width stroke row.

## Current State

### Working
- Build green (app + lib). All DS receipts adopted through 0.37.0: property inputs, slotLeft paint bar, tonal segmented (stateful strips), 0.15 glyph set, textarea axis, modal labels, menu descenders.
- Proof doc (card format): `_tmp/inspector-figma-parity-proposals/preview.html` — user-facing medium was later DROPPED by user ruling; keep for reference only, don't push it.

### Known Issues
- UNVERIFIED (built, not screenshotted): tonal strips, entry-card Labs button, dev favicon plugin.
- Open features (user go pending): mask (engine), swatch→full-picker popover, stroke inside/outside (SVG limit — declared).
- `SegmentedFilledStateFix` ticket still 🔵 in kol-ds-ui — 0.37's `tonal` variant may satisfy it (stateless strips still `filled` with ring-free rest); squaring is the user's call.
- Google/JetBrains faces are render-only (no TTF → no morph/flatten); fade export snapshots Cut A.
- Session laws (enforced repeatedly, violated twice — don't repeat): kol-helper NEVER on wrapping text; icons paint text-oq-* opaque; glyph ladder sizes (16 solo / 14 adjacent); DS components only, no local twins; selected = dark/tonal tile, never a ring; VISUALLY VERIFY with Playwright before claiming any visual change.

## Next Steps
1. Verify in browser: tonal strips, Randomiser card Labs door, dev favicon (restart dev server first).
2. User pass over the whole inspector vs Figma refs; then mask pass / picker popover on go.
3. Watch kol-ds-ui for SegmentedFilledStateFix resolution; adopt + square receipts.
