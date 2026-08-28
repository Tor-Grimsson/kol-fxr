# Session: DS bump to latest, both 📌 receipts closed, the font-dir case defect

**Date:** 2026-08-27
**Agent:** Grim (Haiku 4.5)
**Summary:** All five KOL packages bumped to latest with both builds green, the two
outstanding receipt remainders landed, and a production font 404 surfaced that only
`git mv` can fix. Continues `2026-08-15-shell-tier-shortcuts-roundtrip-fonts-and-keymap-views.md`.

## Changes Made

### Files Modified
- `package.json` — peer + dev ranges: component `^0.76.4` · theme `^0.58.0` · framework
  `^0.25.0` · icons `^0.18.0` · shell `^0.6.2`. `pnpm-workspace.yaml` grew the matching
  `minimumReleaseAgeExclude` entries (pnpm writes them itself).
- `src/editor/compose/AlignmentPanel.jsx` (×6) · `inspectors/LayerInspector.jsx` (×7) ·
  `inspectors/TextPanel.jsx` (×6) — the `<span className="text-oq-48 inline-flex">`
  wrappers around SegmentedToggle icon labels are gone. `.kol-seg-cell` paints `oq-48`
  at rest, `oq-64` on hover, `fg-emphasis` active; each wrapper pinned the icon to rest
  ink and killed both states. On the flip cells the inner span also overrode the outer
  accent tint, so the flipped state never showed either.
- `inspectors/LayerInspector.jsx` — `AxisField`'s three stale comment blocks (ch-width
  hug, `-ml-1` unit, "declared stopgap") replaced with one accurate one. The function
  was already `NumberField` → `Input variant="property"`; only the comments were behind.
- `inspectors/CurveEditor.jsx` · `params/ModulationEditor.jsx` (×2) — `--kol-font-mono`
  → `--kol-font-family-mono`. The old name never existed; all three fell to the
  `monospace` fallback (system mono, not JetBrains).
- `params/TimelineDock.jsx` · `EditorErrorBoundary.jsx` — `--kol-fg-1` → `--kol-fg-emphasis`.
  Never existed; the keyframe diamond and the error screen's text had no colour.
- `public/fonts/Right-Grotesk/` → `right-grotesk/` on disk (see Known Issues — this
  did NOT fix it).
- `lobby/outbox/PropertyField.md` · `SegmentedFilledStateFix.md` — squared to
  `Remainder here: none` with dated ADOPTED blocks.

### Verified
- `pnpm build` and `pnpm build:lib` green after every step.
- `pnpm why` answers ONE copy of component / icons / theme / framework — the
  NestedDsDependencies defect the 0.70.0 peer move exists to prevent is not here.
- Every imported DS name still resolves. `Section` from kol-component is now an alias of
  `InspectorSection` (0.71.0), same render. Nothing in the changelogs between 0.47.1 →
  0.76.4 / 0.44.0 → 0.58.0 touches an imported name with a breaking change.
- A node script cross-checked every `var(--kol-*)` in `src/` against the theme +
  framework CSS: the two tokens above were the only misses.
- Nothing rendered in a browser.

## Current State

### Working
- Editor, lib build, all DS surfaces on the latest published tier.
- All 16 outbox receipts are `Remainder here: none`.

### Known Issues
- **`public/fonts/Right-Grotesk/` is tracked capitalised by git.** kol-theme ≥0.41.0
  requests `/fonts/right-grotesk/…` (98 URLs). A Mac resolves either spelling, so dev is
  fine and the on-disk `mv` was a no-op for the index — every Linux clone and Vercel
  deploy 404s all Right Grotesk fonts. The BULLETIN in `LLM_RULES.md` (2026-08-26) has
  the fix; it is the user's git. Handed over:
  `git mv public/fonts/Right-Grotesk public/fonts/rg-tmp && git mv public/fonts/rg-tmp public/fonts/right-grotesk`.
  The other capitalised font dirs (`-ttf`, `-Mono`, `-Text`, `TG`) are referenced by this
  repo's own `modes/type/families.js` with matching case — consistent, leave them.
- **ag-init never reads the BULLETIN.** The skill's steps name ARCHITECTURE, AGENT-CONTEXT,
  the docs index, the log, the handoff, `pnpm outdated`, the outbox — not `LLM_RULES.md`.
  The agent missed a same-day entry that named this exact defect. Not the agent's to fix
  (user ruling this session).
- `pnpm outdated` reported stale latests a THIRD time (component 0.68.0 vs the real
  0.76.4). `npm view <pkg> dist-tags` is the check; the AGENT-CONTEXT note stands.
- `PageHeader` defaults to `size="md"` (display-03) since shell 0.6.0 — Home and Library
  titles got larger. Left on the DS default; pass `size="sm"` for the compact heading.
- `GridCard` is `@deprecated` in shell 0.6.2 → `ContentCard variant="catalog"` in
  kol-component. Renders unchanged until the next major; the swap is a prop-map
  (`docs/documentation/03-components/06-content-card-system.md` in kol-ds-ui), owed.
- **The shell tier is a router now and no session logged it.** `src/App.jsx` runs
  `BrowserRouter` with `/` · `/library` · `/settings` under an `AppLayout`;
  `src/pages/{HomePage,LibraryPage,SettingsPage,Compose}.jsx` exist; `src/editor/home/`
  is gone. The 08-15 handoff's decision 1 was evidently taken as "follow mirror" — the
  work sits uncommitted and undocumented.
- The two `text-oq-48` left in `src/` (TransportBar's hand-rolled `Cell`, MobileOverlay's
  header chevron) are not seg cells and were left alone.

## Next Steps
1. Run the `git mv` two-step above and deploy — until then production has no Right Grotesk.
2. Open Home / Library / the inspector in a browser: the seg-cell hover/active states and
   the larger PageHeader have not been seen.
3. Log the router migration — it is the biggest unlogged change in the tree.
