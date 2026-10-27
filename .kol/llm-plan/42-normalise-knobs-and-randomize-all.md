# Plan — Normalise exposed knobs and Randomize all

**Raised:** 2026-10-27, plan 41 W5 (audit + proposed rule, `.kol/llm-plan/41-tunnel-grab-and-the-mobile-way-out.md` § W5).
**Status:** DRAFT — 2026-10-27. Open: everything.
**Shape:** W › phase › list.
**Laws carried:** the editor is this repo's source, no DS tickets for editor work; never delete, retire to `_tmp/`; user copy verbatim (param labels unchanged); Tailwind first; no "·" as a separator.
**How a phase closes:** acceptance line first, gates green, then Playwright against his own words.

## The rule (one rule, all families)

- **At most 12 knobs visible.** Form and look first; the rest go in a named section that stays collapsed.
- **Randomize all rolls the look, not the structure.** Counts, seeds, geometry modes and form swaps are `noRandom` (they keep their own scope buttons). Every rolled range carries a curated `rMin`/`rMax`. Target 6 to 10 values per press.
- **Colours roll through roles only** (bg, fg, accent from one palette), never as free hexes.

## W1 — Penrose (55 loops, 20–26 knobs, all visible)

### 1.1 — Collapse past 12 — TALK
Acceptance: every Penrose loop shows ≤12 knobs; the rest sit in one collapsed section.
- Split each loop's params into the visible form/look set and a collapsed rest.

### 1.2 — Roll the look — TALK
Acceptance: Randomize all on any Penrose loop moves 6–10 values, never a count, seed or mode, and none land on a slider end.
- Mark structural params `noRandom`, add `rMin`/`rMax` to every rolled range.

### 1.3 — Colours through roles — TALK
Acceptance: Penrose's 5 colour params roll from one palette's roles, not free hexes.

## W2 — Math (waveform, field: 11–30 knobs)

### 2.1 — Collapse past 12 and roll the look — TALK
Acceptance: Math loops show ≤12 knobs; Randomize all moves 6–10 curated values.

## W3 — 3D Scene (Primitive, Ribbon: up to 39 knobs)

### 3.1 — Collapse past 12 and roll the look — TALK
Acceptance: Primitive and Ribbon show ≤12 knobs; Randomize all moves 6–10 curated values.

## W4 — Gated engines (Gradients, Scanline, Pattern Rules)

### 4.1 — Roll the look — TALK
Acceptance: Randomize all moves 6–10 curated values; the gates already hold the visible count.
- Gradients 32 rolled, Scanline 27, Pattern Rules 52: cut each to the look.

## W5 — The rest (Loops Simple, Pattern Field, Flow, Letter Gap, Drift, Soft Forms)

### 5.1 — Curate the rolls — TALK
Acceptance: each family's Randomize all moves 6–10 values, every one with an `rMin`/`rMax`.

## W6 — Close out

### 6.1 — FX changelog row — TALK
Acceptance: Dev › FX changelog has a row for the normalised rolls on top.
