---
title: Mobile & Tablet
type: reference
status: active
updated: 2026-07-09
description: The touch-device generative chrome — the capability gate that routes phones/tablets to a randomize-only playground instead of the desktop editor, its three screens and one tabbed modal, the touch-size control system, the aspect/Fill display control, and the tablet + desktop escape hatches into and out of it.
aliases:
  - mobile
  - tablet
tags:
  - project/kol-fxr
  - editor/mobile
  - domain/responsive
covers:
  - the device gate (capability-based, not width breakpoints)
  - the three screens — entry, category, live
  - the tabbed overlay (Generate / Transport / Output)
  - the touch-size control system (lg buttons/toggles/input)
  - aspect switching + the Fill display view
  - the tablet choice and the desktop entry into simple mode
  - why the session is ephemeral (persistDraft)
sources:
  - src/App.jsx
  - src/editor/mobile/device.js
  - src/editor/mobile/MobileView.jsx
  - src/editor/mobile/MobileOverlay.jsx
  - src/editor/shell/Canvas.jsx
  - src/editor/params/TransportBar.jsx
related:
  - "[[../00-overview/INDEX|overview]]"
  - "[[../08-export/INDEX|export]]"
  - "[[../11-persistence/01-draft-autosave|draft autosave]]"
---

# Mobile & Tablet

The editor is a mouse-and-keyboard tool. Rather than reflow it onto a phone,
touch-primary devices get a **separate, simpler chrome** — a randomize-only
generative playground over the *same* engine — while desktop keeps the full
editor untouched. The fork is a hard branch at the entry, not responsive CSS.

## The gate — capability, not width

`src/editor/mobile/device.js` decides; `src/App.jsx` routes.

- **`isMobileDevice()`** — `matchMedia('(pointer: coarse)')` **and** `navigator.maxTouchPoints > 0`. A tablet with a keyboard/trackpad reports a *fine* primary pointer and gets the desktop editor natively. There are **no `@media (max-width)` breakpoints** — the decision is input capability.
- **`isTabletSized()`** — `min(screen.width, screen.height) >= 600`. Only gates whether the desktop opt-in is offered (phones don't get it).

Route table (`App.jsx`, no router — one `?view` read):

| URL | Renders |
|---|---|
| *(no param)* | touch-primary **and** no desktop preference → `MobileView`; else `Editor` |
| `?view=mobile` | `MobileView` (and **clears** the desktop preference) |
| `?view=desktop` | `Editor` (forced, any device) |
| `?view=output` | `OutputView` (chromeless recording surface) |

The **`kol-editor:mobile-use-desktop`** localStorage flag persists a tablet's
choice across plain (no-param) reloads: `goDesktop` sets it, `goMobile` /
`?view=mobile` clears it.

## The three screens

`src/editor/mobile/MobileView.jsx`.

1. **Entry** — *Insert image/video* · *Generate* (· *Use desktop editor*, tablet-sized only).
2. **Category** — the `GENERATIVE_TREE` types as buttons.
3. **Live** — the composition full-frame under the `MobileOverlay`.

**Insert path** — a hidden `<input accept="image/*,video/*">` → a full-bleed
`cover` photo layer (`x:0 y:0 w:CANVAS_W h:` aspect-derived — on mobile the
media *is* the composition). Video is persisted to the IndexedDB clip store
keyed by the layer id, so it survives the transport's loop. **Start over**
removes each layer individually (freeing any video clip) and returns to entry.

## The overlay

`src/editor/mobile/MobileOverlay.jsx` — one see-through, **borderless** modal
(`color-mix(var(--kol-surface-primary) 35%, transparent)` + blur); content
split into `SegmentedToggle` tabs so only one concern shows at once.

- **Generate** — *Preset ⚄* / *Generator* switch, then the inspector's exact scoped-randomize block (`Randomize all` + the per-scope grid, sharing `rolls.jsx`'s `computeRoll`).
- **Transport** — the established `TransportBar` at touch size (`size="lg"`).
- **Output** — aspect + Fill, *Download* (@2× PNG), *Hide UI*, *Start over*.

**Collapsed** (header tap) = `[Randomize all] [title ▴]` — the bare *Randomize
all* rolls without re-opening the modal. **Hide UI** blanks every control for
screen-recording (tap anywhere to restore) — this is the mobile **video path**:
there is no webm export on mobile, you screen-record the hidden-UI stage.

## Touch-size control system

Every control is `size="lg"` — 40px tall, `kol-mono-16`, 8/20 padding — so
buttons, all three `SegmentedToggle`s, and the `TransportBar` `Input` line up
instead of each guessing its own height. This required the DS to grow a
matching `sm/md/lg` scale across `Button` / `SegmentedToggle` / `Input`
(`@kolkrabbi/kol-component` + `kol-theme` **0.6.0**), which also moved every
button's `:hover` behind `@media (hover: hover)` so a tap doesn't leave a
button stuck in its hover state on touch. `TransportBar` took a `size` prop
(default `sm` = desktop verbatim) rather than forking.

## Aspect & Fill

`Canvas.jsx` `fit` prop. The Output tab exposes the seven export-spec aspects
(`9:16 · 3:5 · 4:5 · 1:1 · 5:4 · 5:3 · 16:9`) plus **Fill**:

- An **aspect** re-frames the composition (real `setAspect`, so *Download* exports at that spec) **and** refits the active full-frame layer.
- **Fill** is display-only `fit="cover"` — the letterbox becomes an overflow crop; the composition's aspect is **untouched**, so it never affects export. See [[../08-export/02-sizing|sizing]].

## Ephemeral by construction

The mobile chrome mounts with `persistDraft={false}` — no restore prompt, no
`kol.editor.draft` read/write, no clip GC. It can never touch the desktop's
saved work. See [[../11-persistence/01-draft-autosave|draft autosave]].
