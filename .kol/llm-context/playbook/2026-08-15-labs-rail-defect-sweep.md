# Playbook — labs rail defect sweep

Started 2026-08-15 11:57. Source: 5 lobby screenshots + user walkthrough.
Append-only. One line per idea. Verdicts are source-verified unless marked LIVE-CHECK.

---

## 11:57 — Intake

- 12 defects raised off 5 screenshots. Item 1 (focus ring / spacebar steal) accepted as scope; its screenshot retired to `_tmp/2026-08-15-lobby-screens/`.
- User ruling: no invented numbers. Spacing values must come from a logged source or get logged first.

## 11:57 — Verified against source (no stale cache involved)

- **[2-fractions] Values are CORRECT.** `src/loops/optic/reaction.js:191-194` — feed 0.01–0.08, kill 0.04–0.075, du 0.05–0.3, dv 0.02–0.16. Real RD ranges, not 0..1.
- **[2-fractions] The 4 decimals come from `step`.** `AutoControls.jsx:94` derives decimals from step digits (0.0005 → 4). Display problem, not a value problem.
- **[2-LabeledControl] YES it is the wrapper, and it IS shipped** (`@kolkrabbi/kol-component`). Used at `AutoControls.jsx:260` and `ParametersPanel.jsx:287/297/300`.
- **[2-eyebrows] Four hand-rolled eyebrow spans bypass it** — `AutoControls.jsx:53` (`kol-helper-10 text-meta`), `:181` + `:226` (`+tracking-widest`), `:202`. Plus `labs.css:15` re-uppercases only the `tracking-widest` pair. That's the casing split in the screenshot: TYPE/CATEGORY/PRESET/SCATTER SEED uppercase, Palette/Seed authored case.
- **[2-divider] Not ignored — deliberately scoped, and the scope is logged.** `labs.css:26` limits hairlines to `.kol-labs-fx`; session-log 2026-08-09 (labs reskin) records "dividers between major zones only … scoped to `.kol-labs-fx`". `fx` is passed by EffectSurface only, so generative pages get gap-only separation.
- **[2-divider] Spacing numbers that EXIST:** `labs.css:24` section gap `0.5rem` (8px, = labs Section gap-2); `labs.css:28` divider padding-top `1.25rem` (20px); `LabsParams.jsx:124` rail body gap `gap-5` (20px). No logged number for "space–divider–space" *inside* a generative section → must be logged before it is built.
- **[3-rails] Both rails already default to 20rem.** `labs.css:37` — left `var(--kol-sidenav-w, 20rem)`, right hard `20rem`. Left drag-resizes via `useDragResize` (framework 0.17.0) writing `--kol-sidenav-w`; the right rail simply has no handle. Same-width is already true; resize is the only gap.
- **[4-transport] ONE TransportBar, not two.** `src/editor/params/TransportBar.jsx`, mounted at `EditorFooter.jsx:201` and `MobileOverlay.jsx:202`. The round bottom-right button in the shot is the labs params FAB (`kol:open-params`, `LabsNav.jsx:436`), not a transport.
- **[4-icons] They ARE shipped icons.** `TransportBar.jsx:1` imports `Icon` from `@kolkrabbi/kol-icons` (0.15.0 = latest); play/pause/stop/rewind are registry names. If the glyphs read wrong, it is a DS-side glyph issue → lobby, not a local fix.
- **[4b-loop-input] Confirmed defect.** `transport.js:83` — `setLoopSeconds` clamps `Math.max(0.1, Number(s) || 0.1)` on EVERY keystroke, and `TransportBar.jsx:72` is a controlled input with no draft. Clear the field or type `0` → instantly `0.1`. Cannot start from empty. RangeField already solves this (draft + commit on blur) — the pattern exists in-repo.
- **[5-nothing-to-randomise] Confirmed, and root-caused.** `reaction.js:191-195` — feed/kill/du/dv/iters are ALL `noRandom: true`. Only palette/seed/scatterSeed/gain remain rollable, so "Randomize all" is near-inert and `deriveScopes` yields no scope buttons.
- **[5b-animation-new] Confirmed omission.** labs-simple = `~/dev/projects/kol-apps/kol-labs-single`. `ReactionPage.jsx:200` ships a full-width **Reseed** button (`iconLeft="cycle"`); `:172-173` also reseeds on stop/rewind. The port dropped all three.
- **[fd-title] `Stam Stable Fluids + Vorticity Confinement`** overflows the preset Dropdown. Compound titles are the cause; shortening the preset labels beats truncating the control.
- **[fd-helper] Helper text is a bare unconditional paragraph.** `LabsParams.jsx:72` `ANIM_HINT`, rendered at `:227`/`:294` and `ParametersPanel.jsx:157`. No gate, no shortcut. User ruling: gate it or drop it — never load the repo with ungated helper prose.

## 11:57 — Needs a live check (only genuine stale-cache candidates)

- **[1] Focus ring + Space steal.** `LabsView.jsx:219` DOES `preventDefault()` on `Space` and toggles transport, and its typing guard only exempts INPUT/TEXTAREA. So either a DS control stops propagation before window, or the ring is purely visual and the steal is elsewhere. Ring itself is unstyled UA blue — no `:focus-visible` token anywhere in `src/editor/labs/`.
- **[2-key] Does the segmented tab steal Space too?** Same mechanism as [1]; resolve both in one probe.
- **[3-zoom] Duplicate zoom chip** (top-right AND bottom-right of the canvas in the 11:23 shot, single chip in the 11:13 shot). Not reproduced from source yet.
- **[fc] "Loops sidebar what the hell?"** — no screenshot, no repro. Blocked on the user.

## 11:57 — Scope

- **A. Focus system (1, 2-key).** One probe → one `:focus-visible` treatment on labs nav leaves + segmented cells + the Space-routing fix. Root fix at the shared control, not per-surface.
- **B. Rail conformance (2-eyebrows, 2-divider).** Route the four hand-rolled eyebrows through `LabeledControl`/one section-header primitive; retire `labs.css:15`'s re-uppercase hack. Then log the generative-page spacing rule and extend the hairline off `.kol-labs-fx`. **Log the numbers first.**
- **C. Input behaviour (4b).** Draft-and-commit on the loop field; keep the clamp at commit, not per-keystroke.
- **D. Randomise honesty (5).** Decide whether RD's `noRandom` pins are still right; if they are, the Generate tab must say so rather than showing a dead button.
- **E. Parity restore (5b).** Port **Reseed** from `ReactionPage.jsx:200` — the button plus the stop/rewind reseed hooks.
- **F. Copy + chrome discipline (fd).** Shorten compound preset labels; gate or delete `ANIM_HINT`.
- **G. Deferred:** 2-fractions (display only, no defect), 3-zoom (needs repro), 3-rails (right-rail drag handle — small, real), 4-icons (DS-side → lobby), fc (blocked).

---

## 12:0x — Scope CORRECTED by the user. The earlier scope was wrong on four counts.

- **The DS is the authority. labs is a reference, never law.** Citing `kol-labs-single` to justify a shape was the error running through the whole first pass. Struck.
- **`labs.css` cascade hacks are the defect, not the baseline.** `:15` re-uppercasing DS labels is a local override of a stated DS policy (casing is authored). It goes.
- **The divider goes where the user pointed.** He named the spot below the Scatter dropdown because he wants one there — the 2026-08-09 "scoped to `.kol-labs-fx`" log does not outrank him. Build it.
- **The rails are NOT "already the same".** Neither sidebar was ever given a handle. Both get one standard width and both resize.
- **[5] restated by the user:** the defect is that **no button rolls the PRESET**. Not the `noRandom` flags, not what labs does.
- **Method agreed:** one control class at a time, fixed at the DS seam, every call site at once, local twin deleted in the same edit. Build green, user looks, next class. Surface-by-surface is what produced the drift.

## 12:0x — T1 DONE (input)

- Audited every `<input>` in `src/`: only 4. Two are hidden `type="file"` (ToolPalette:384, LabsSourcePicker:73 — no DS equivalent, legitimate). One is RangeField's range track. One was the transport loop field.
- **Root cause of the 0.1 s trap:** `transport.js:83` clamps `Math.max(0.1, …)` and `TransportBar.jsx:69` was a controlled input with no draft — so every keystroke round-tripped through the floor. Emptying the field was impossible by construction.
- **Fix:** `LoopField` in `TransportBar.jsx` — draft-then-commit (blur/Enter commit, Escape reverts), same contract RangeField's box already used. The store keeps its floor: the loop clock divides by `loopSeconds` (`transport.js:46`), so 0 is genuinely illegal — but it now lands on COMMIT only.
- **Taken from the DS, not authored:** `<Input variant="property" affordance="Loop /" unit="s" chars={4}/>`. That variant shipped in kol-component 0.36.0 off this repo's own PropertyField lobby ticket and is literally this anatomy. The old code's "the DS lost its borderless variant" comment was stale by two minor versions.
- `SIZES.mono` retired — the readout takes scale from the DS Input's `size` (sm→kol-mono-12, lg→kol-mono-16, identical to what the local map hardcoded).
- **Finding for a later step, NOT actioned:** the DS ships `molecules/Slider.jsx` — label · track · editable readout, commit on blur/Enter, revert on Escape, `--kol-slider-track` on `.slider-black`. `AutoControls.RangeField` re-implements that whole anatomy locally while using the DS's own `.slider-black` class. It is the single biggest local twin in the rail. It is NOT a straight swap: RangeField carries modulation binding (expression source, live thumb tracking while bound) and deliberately unclamped typed values, neither of which the DS Slider has. Needs a read + a lobby ticket for the gap before it moves.

## 12:1x — T2 DONE (labels, purely from the DS)

- **Three of the four label spans were pure deletions.** The `inline` early-returns for range/select/toggle existed ONLY to hand-roll a label; the generic `LabeledControl` return at the bottom of `ParamControl` already renders the identical structure. Deleted all three, let them fall through.
- Toggle keeps its right-edge switch — now as the control inside `LabeledControl`, not a hand-rolled row with a spacer div.
- **Section headers now use the shipped `Section`** (`molecules/Section.jsx` — "labeled control group for inspector/editor panels", exactly this). Replaced 5 hand-rolled wrappers: `AutoControls` group wrapper + `LabsParams` Effect Stack / rack group / Post-Processing / picking cluster.
- **`labs.css` uppercase hack DELETED.** `.kol-editor-labs .kol-helper-10.tracking-widest { text-transform: uppercase }` was the cause of the casing split: it keyed on the `tracking-widest` pair, and the local select span deliberately dropped that pair to get sentence case. So SCATTER SEED and Palette were two hacks disagreeing. Labels now render as the schema authors them — uniformly.
- Side effect, and it is an improvement: inline rows now share `LabeledControl`'s fixed 96px label column, so the tracks line up instead of each starting at a different x.
- **DS gap for the lobby:** `LabeledControl` inline has no natural-width label mode — `width: labelWidth` always. The deleted local code existed partly to dodge that. Not blocking (the fixed column reads better here), but it is a real gap.

## 12:1x — T3 DONE (sections + dividers)

- **Root cause of "no divider": the structure was missing in the DATA, not the CSS.** `reaction.js:186-196` authors no `section` on its style params, so all eight collapsed into ONE group — there was no boundary for any rule to land on. CSS could not have fixed this.
- **Ported the repo's OWN cluster rule** rather than inventing one: `LabsParams` already defines the picking cluster for effect pages as "the preset param plus the selects that follow it". `AutoControls` now applies that same rule to any sectionless group — leading run of selects = the picker, the rest = parameters. Reaction therefore breaks exactly where the user pointed: below the Seed/Scatter dropdowns.
- **Hairline unscoped** — `.kol-labs-fx` fence removed from `labs.css`, so every section boundary divides on generative pages too.
- **NO invented numbers.** Space–divider–space is 20px above / hairline / 20px below: the below is this rule's existing `padding-top: 1.25rem`, the above is the rail body's existing `gap-5` on `Surface`. Both were already in the file.
- Split logic verified against 5 cases (reaction shape, no-lead-selects, all-selects, sectioned-untouched, two-groups-no-index-skew) — the splice loop advances correctly.

## 12:3x — T4 DONE (preset randomise)

- **The control existed — in ONE place only.** `MobileOverlay.jsx:103` had `shufflePreset`; the desktop and labs rails had nothing. So "no button to randomise the preset" was literally true everywhere except mobile.
- Lifted to `params/rolls.jsx` as `computePresetRoll(layer, seed)` + `presetRollPool(layer)`, seeded through the same `_rollSeed` flow, patch from the registry's canonical `presetLayerPatch`, tool presets excluded.
- **Randomize preset** button added to the Generate tab (`ParametersPanel` LoopFields) — so it reaches desktop AND labs, since labs' GenerativeSurface renders LoopFields. Hidden when the group has nothing else to move to.
- MobileOverlay now calls the shared function; its local copy and four now-unused imports deleted.
- The button gate and the roll share `presetRollPool` — one pool definition, not two.

## 12:3x — T5 SPLIT (rails)

- **The user was right and my earlier reading was wrong on the facts.** The DS defines `--kol-sidenav-w: 16rem` (kol-framework.css:37), so labs' `var(--kol-sidenav-w, 20rem)` fallback NEVER applied. Left rail was 16rem, right rail a hard 20rem. They were different widths.
- **Width standard DONE:** `--kol-rail-w: 16rem` on `.kol-editor-labs`, both grid columns now read tokens, the phantom 20rem fallbacks gone. The right rail carries its OWN variable — `useDragResize` writes `--kol-sidenav-w` on `:root` during a drag, so a shared variable would resize both rails together.
- **Resize NOT done — DS gap, filed.** `useDragResize` is sidenav-shaped by construction: `--kol-sidenav-w`, `data-sidenav` stamping, the `kol-sidenav` storage keys, rightward-drag-is-wider. No side/token parameter. Ticket drafted at `lobby/outbox/DragResizeSideAgnostic.md` (🔵, not yet filed into kol-ds-ui). Building a second copy consumer-side is the exact local-twin pattern being retired, so it was not done.

## 12:3x — T6 DONE (helper prose + long titles)

- **`ANIM_HINT` deleted outright** — 4 separate declarations of the same idea (LabsParams, KineticPanel, EffectsPanel, ParametersPanel), 3 short and 1 long, across 9 render sites. All gone. User ruling: don't load the repo with helper prose.
- `emptyHint="Pick an effect from the nav."` KEPT — that is an empty state (the surface is blank and you need to know why), not explanatory prose.
- **Long titles:** only 6 preset labels exceed 28 chars repo-wide; the 2 the user hit were the only welded compounds, and both were self-redundant:
  - `Stam Stable Fluids + Vorticity Confinement` (42) → `STAM STABLE FLUIDS` — the vorticity clause is already in the preset's own blurb.
  - `SPH — Smoothed Particle Hydrodynamics` (39) → `SPH FLUID` — the second half literally expands the acronym in the first half.
  - Both also move to the UPPERCASE the rest of round2 authors, which matters now that nothing auto-uppercases.
- The other 4 (29–36 chars) are parenthetical QUALIFIERS, not welded compounds. Left alone rather than inventing names.

## 12:3x — T7 SPLIT (focus + Space)

- **Ring: root-caused and FIXED.** `.kol-sidenav-link` (kol-components-atoms.css:709) defines ONLY `.is-active` and its dot — it has no `:focus-visible`, while its sibling `.shell-nav-item` does (workshop.css:366). With no DS focus rule the browser paints its own ring: that is the blue box. `NavLeaf` now wears the DS's shipped `focus-visible:ring-focus` utility (kol-color.css:277).
- **DS gap worth a ticket:** `.kol-sidenav-link` should carry the inset `outline: 1px solid var(--kol-fg-32); outline-offset: -1px` that `.shell-nav-item` has. The generic `ring-focus` utility is a 2px OFFSET ring, which blooms outside a dense nav row — correct token, arguably wrong shape for this control. User's call on the look.
- **Space steal: NOT reproduced from source, and two theories died.**
  - Theory A (a control swallows the event before `window`): no `keydown` `stopPropagation` exists anywhere on the path, in this repo or in the DS atoms.
  - Theory B (double-toggle: `Canvas.jsx:312` toggles on keyUP, `LabsView.jsx:219` on keyDOWN): **wrong** — labs mounts `OutputCanvas`, not `Canvas` (LabsView.jsx:119), which is precisely why LabsView binds its own Space. They never coexist.
  - `LabsView.jsx:220` does `preventDefault()` on keydown, which suppresses a focused button's Space activation. From source this should work. Needs a live repro, ideally noting WHICH view (labs vs editor) it happened in.

## 12:5x — T7b PROBED LIVE. The Space steal does NOT reproduce on current source.

Headless chromium (cached playwright shell, own dev server on :5175, killed after) against both views:

| view | focus | result |
|---|---|---|
| labs | nothing focused | Space toggles play/pause cleanly, 4/4 presses |
| labs | nav leaf focused | toggles 4/4; leaf keeps focus, does NOT activate |
| labs | non-active leaf focused, then Space | active preset stayed `Moiré` — **not stolen** |
| labs | segmented cell focused, then Space | tab did not change — **not stolen**, transport toggled |
| editor (`?view=desktop`) | nothing focused | toggles 4/4 |
| editor | button focused | toggles 4/4, button does not activate |

- Zero console errors in either view.
- `LabsView.jsx:220`'s `preventDefault()` on keydown does suppress the focused button's Space activation, exactly as the source read predicted.
- **The user raised a stale cache as a possibility himself, and that is now the leading explanation.** The visible half he pointed at — the raw blue ring — WAS real and is fixed (T7a); a persistent ring plus a transport that looked unresponsive is a plausible read of one defect.
- Needs his re-test on a hard reload. If it recurs, the thing to capture is WHICH view and whether the transport moves at all.

## 12:5x — State

- Landed: T1 input · T2 labels · T3 sections+dividers · T4 preset randomise · T5a rail width standard · T6 helper prose + long titles · T7a focus ring.
- Open: **T5b right-rail resize**, blocked on a side-agnostic `useDragResize` — ticket drafted at `lobby/outbox/DragResizeSideAgnostic.md`, not yet filed into kol-ds-ui.
- `pnpm build` green after every step.
- Untouched by design: 2-fractions (values correct, display only), 3-zoom duplicate chip (never reproduced), 4-icons (shipped kol-icons — DS-side if wrong), fc loops sidebar (still no repro).
