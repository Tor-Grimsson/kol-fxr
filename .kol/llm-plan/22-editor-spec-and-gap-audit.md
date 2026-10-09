# Plan — The editor spec and gap audit: define the panel system, then grade everything against it

**Status:** OPEN 2026-10-09 — prepared locally for a **cloud session (Fable, max thinking)**. Audit only: nothing is fixed in this plan.
**Origin:** user, 2026-10-09, after a pass over the running editor (screenshots in `22-assets/`):
> *"can we just audit whats missing instead of me trying to remember everything from memory? again references are figma affinity adobe"*
> *"do the audits not yield any actionable results, we have done 3 editor audit passes. where I specificaly said, consistency, unified look. that means we define the rail, what is in the rails, the panes, the content in the pains, headings, label styles etc."*
> *"I've said the input is too wide how many times now? it never gets adressed?"*

## Why the last three passes failed — read this first

Plans 16, 20 and 21 listed findings one by one (46 in plan 21) and each got a local fix. None of them **defined the standard** a panel is held to, so every fix was judged against its neighbour, the neighbours disagreed, and the inconsistency survived. Widths, heading sizes, label case and control sizes kept drifting because nothing said what they should be.

**This plan inverts the order: SPEC first, then a pass/fail grade of every panel against the spec.** A finding is "row X fails spec rule R", never "this looks off".

## 0. Prerequisites (cloud)

- **Start at `docs/operations/02-cloud-sessions/INDEX.md`** — authorship (no agent credit in commits), the `claude/…` branch and its fast-forward handoff, what deploys where, and the house rules the local skills would have loaded.
- `pnpm install` (KOL packages install without npm auth) · `pnpm build` · `pnpm preview` (built bundle, port 4173).
- A browser: the MCP Playwright tools if the session has them; otherwise `pnpm dlx playwright install chromium` and a scratch script under `_tmp/` (gitignored — copy anything worth keeping into `.kol/llm-context/audit/`). The repo has no Playwright dependency; do not add one.
- Read: `.kol/llm-context/ARCHITECTURE.md`, `AGENT-CONTEXT.md` (the labs-rail laws: one segmented control · one row (`SettingsRow`) · one label voice (uppercase helper)), `src/editor/params/controlSize.js` (the size ladder and `RAIL_LABEL_W`), and the DS as installed: `node_modules/@kolkrabbi/kol-component/src` + `kol-theme/*.css`. Cite DS components and tokens **by name and path**.
- The user's standing rules that bind every proposal: Tailwind first; KOL type classes only (`kol-mono-*` wraps, `kol-helper-*` single-line chrome); never rename user-facing copy without a ruling; the editor's source lives in `src/` (no DS round trips for editor work — DS gaps go to plan 17's parked list).
- The references are **Figma, Affinity (Designer/Publisher) and Adobe (Illustrator/InDesign/After Effects)**. `22-assets/21-REFERENCE-affinity-transform-panel.png` is the user's picture of "clean". Use what you know of these apps; say which app a convention comes from.

## 1. Write the spec — `.kol/llm-context/audit/2026-10-10-editor-spec.md`

One document, numbered rules, each with a value and the KOL token / component that delivers it. It must answer, at minimum:

1. **The frame** — top bar (what belongs there; the user: the "Untitled" name field does not — `22-assets/14`), toolbar, left rail, right rail, canvas, timeline dock, status. Rail **widths** (one width or a stated reason for two), resize rules, collapse rules.
2. **A rail** — what each rail holds and why (left today: Stroke · Color · Swatches over Layers · Assets over Transport/Output/File; right: Inspector · Parameters · Effects). Propose the target arrangement.
3. **A pane** — tab strip style, header (title + actions: where overflow `…` and delete live — the user: trash belongs below the layers, `22-assets/25`), scroll behaviour, empty state.
4. **A section** — heading style (the user: Transform / Appearance / Path are too big, `22-assets/26`), divider, spacing above/below.
5. **A row** — label style (case — the user expects uppercase labeled controls, `22-assets/18`), label column width, row height per size rung, control alignment.
6. **Controls** — field widths by content (`chars`), never stretched (*"the input is too wide"* — Opacity, `22-assets/18`); one size per breakpoint for every control (the Generate/Style/Animation strip is bigger and in the wrong tone, `22-assets/23`); swatches; segmented controls and their tone; icon buttons.
7. **Words** — one spelling (`Colour` vs `Color` both ship today, `22-assets/27`), label casing, button copy.
8. **Pointers** — the cursor per tool (select · node select · pen with close/connect indicator · shape crosshair · text · zoom · hand · orbit).
9. **Icons** — which set, stroke, size; the toolbar grouping rule (fold related tools: zoom+orbit, pen+select, rotate+flip; no duplicate icon — `22-assets/15`).

Write it as a proposal the user rules on. Where the DS already decides (a token, a component), cite it; where it does not, propose and mark **NEW**.

## 2. Grade every surface against the spec — `.kol/llm-context/audit/2026-10-10-H-spec-grade.md`

For each pane × each selection state (nothing · rectangle · ellipse/polygon/star/triangle · path · text · image · loop · group · locked · multi-select): a table of rule → pass/fail → file:line → fix class (fix · ticket → plan 17 · ruling). Shots at 1600 into `_tmp/`, the important ones copied beside the log.

## 3. The gap audit — `.kol/llm-context/audit/2026-10-10-I-gaps.md`

What Figma / Affinity / Adobe have that the editor does not, as a matrix: capability · reference app · here (missing / partial / present) · where it would live in the spec's frame · size (S/M/L). Cover at least: selection (V / A, canvas-edge hover select), path editing on shapes (**Expand shape** — toolbar and Object menu, `22-assets/22`), pen (pointer, close indicator, retained colour), shape parameters (a triangle shows only *Kind*: points, corner radius, inner radius, star ratio… `22-assets/19`), appearance (fill/stroke as real swatches opening the colour window — `22-assets/17`; **a new shape gets fill only, stroke disabled** — today it gets a black width-0 stroke), preview/work mode (hide frame borders, ratio label, guides — Affinity/InDesign `W`/⌃W), eyedropper in the colour panel (`I` works; no icon — `22-assets/16`), vector effects, align/distribute, transform origin, history, navigator.

## 4. The user's list — every item answered

Each gets: confirmed / not reproduced · root cause with file:line · which spec rule or gap row covers it · fix class. Numbers are the user's order.

**Canvas and interaction**
1. Hover/click around the canvas border selects the canvas.
2. Preview/work display mode: hide every border and ratio label (Affinity, InDesign).
3. V = select, A = node select, as in every reference — check both, on shapes too.
4. The pointer never changes per tool — always crosshair or the plain arrow.
5. Pen: no pen pointer; no indicator when connecting end points; colour should carry from the last selection.
6. A/V work on the pen's paths but not on shapes → Expand shape (toolbar and Object › Expand shape).
7. New rectangle gets a black stroke at 0 — should be fill only, stroke off until set.

**Top bar and toolbar**
8. The top bar — drop the name input; propose a standard setup (`22-assets/14`).
9. Too many tool icons; fold groups (zoom + orbit, pen + select, rotate + flip); no duplicate icon.
10. Orbit uses the camera icon — kol-icons `shape-torus` (`22-assets/13`) or a proposed 3D glyph.
11. Where do the rotate icons come from (`22-assets/20`)? DS or local?
12. Still no eyedropper icon (`22-assets/16`).

**Panels — the consistency the spec exists for**
13. Left and right panels differ in width; rows and inputs differ (`22-assets/17`, reference `21`).
14. Opacity: field too wide (repeated ask); label sentence case (`22-assets/18`).
15. Fill / Stroke in the inspector are not clickable — make real swatches opening the colour window in an overlay.
16. "Colour…" — spelled two ways, too small, a button, unclear label (`22-assets/27`).
17. Section headings too big (`22-assets/26`).
18. Generate / Style / Animation strip: wrong tone, bigger than the rest (`22-assets/23`).
19. Choosing type and category shifts the UI as parameters fill in.
20. Booleans folded in `…`; trash in the pane header instead of under the layers (`22-assets/25`).

**Parameters and effects**
21. Shape parameters offer nothing — a triangle should expose points, curves etc. (`22-assets/19`).
22. Parameters is usually empty — vector effects belong there, starting with the distortion engine imported from distressor (`src/loops/distress/`, labs-only today).
23. More vector effects: blend between two selected shapes, smooth, and the reference apps' usual set.
24. Effect slots instead of an "Add effect" button, so effects stack.
25. One panel per effect type — its parameters plus a category/preset dropdown — instead of two dropdowns (type, then category).
26. Effects tab can be empty; **Pattern** sits in the Effects menu — is it a mode, a tool, a layer type? (`22-assets/24`).

## 5. Deliverable and handoff

- The three logs above, a short `.kol/llm-context/audit/2026-10-10-README.md` linking them, and a proposed **build order** (plan 23 draft) grouped by spec rule, not by finding.
- Nothing in `src/` changes. DS gaps go to `17-parked-for-the-ds.md` (the user files them locally).
- End with `/log-work` if the boot skills loaded; otherwise a session log by hand in `.kol/llm-context/session-log/`.

## 6. Verification

- Every item in § 4 has an answer with a file:line or a "not reproduced" with the steps tried.
- Every spec rule names a value and a KOL token/component or is marked NEW.
- The grade table covers every pane × state in § 2; a pane with no failures says so.
