# Plan — An input button on the rail

**Raised:** 2026-10-31, in session. Points verbatim:
- *"there should be at least 'add a field' a special button that you assign from dropdown mouse, mic, modulation, envelope and a selected shortlist 1-3 most interesting connections? just an idea, because modulation M can be a bit hidden and this would be very accessible?"*
- *"we could set both source and effect with multiselect dropdown? just thinking out loud"*
- *"uhh are you mad?! we have the generator an it ships with envelope generator, true or false?"* · *"is envelpe and math expression not a source in moudlation?"* · *"fold both into /plan-shape"* · *"i dont want to decide any of this , you pick"*
- Context: the growth effect exposes no mouse controls; any param can already be driven through the modulation dot (M — trackpad XY, mic, LFO …), but it is hard to find.

**Status:** ✅ W1 built — 2026-10-31. Ruled by the agent on his word (*"you pick"*). Open: W2.
**Shape:** W › phase › list.
**Laws carried:** the modulation sources stay the engine (`ModulationEditor`, the bind dot) — the button is a door onto them, not a second system; one rail row vocabulary (`SettingsRow`); KOL components only.
**How a phase closes:** measurable acceptance line first, gates green, then Playwright against his own words.

## W1 — One accessible way to wire an input

### 1.1 — Inputs: a row per connection, Source · Drives in one dropdown — ✅ built 2026-10-31
**Rulings (the agent's, 2026-10-31):**
- **Name:** *Inputs* — the section; its button reads *Add input*.
- **Place:** the top of the Animation tab, above *Modulate* (QuickMotion), for generators and for effects (the stage's effect params) alike — where motion is set, and always visible, unlike the M dots.
- **Shape (his multiselect):** each connection is one row holding KOL's `MultiSelect` with two columns — **Source** and **Drives** — so source and target are set in one dropdown. *Add input* adds a row; Source → *Off* removes it.
- **Sources:** Off · Mouse X · Mouse Y · Mic · Beat · LFO (the registry's `mouseX` · `mouseY` · `audio-level` · `audio-bass` · `lfo-sine`). *Envelope* left out — **wrong call, corrected in W2**: kol-hardware 0.10.0 (installed) ships the envelope generator; only fxr's own sources were searched.
- **Drives:** the def's numeric params (QuickMotion's filter); a def may declare `inputs: [key…]`, its best connections, listed first and taken in order by *Add input*; without it, the first three eligible params. Growing line: Growth · Weight · Contrast.
- **What a row writes:** an ordinary `{ bind: 'mod', source, transform: { range } }` over the param's full span (as the M dot does) — so the dot and the Modulation editor open it as before. Rows are read back from the layer's bindings: no state of their own.
- **Acceptance:** on Growing line, *Add input* binds Growth to Mouse X in one press (`layer.growth.bind === 'mod'`, source `mouseX`, and its M dot shows bound); Source → Mic rewires the same param (source `audio-level`); Drives → Weight moves the binding (Growth is a number again, Weight is bound); Source → Off removes the row and leaves no binding; a second *Add input* takes the next shortlist param (Weight); an effect's Animation tab shows the section too; no page errors.


## W2 — Envelope and Expression, everywhere a source is picked

### 2.1 — Envelope is a modulation source, from kol-hardware's ADSR
The cause: the bind system's sources (`src/editor/params/sources.js`) never took kol-hardware's envelope — fxr imports only its transport and TimeStrip, though `@kolkrabbi/kol-hardware/signal` exports `envelopeAt` · `ADSR_DEFAULTS` · `toRange` and the package ships `EnvelopeGenerator`.
- Register `envelope` (label *Envelope*): `envelopeAt(t, adsr)` with the gate opening at every loop start, so it is a pure function of loop time like the LFOs (scrub-safe, seamless); the ADSR rides the binding's `transform.adsr`, default `ADSR_DEFAULTS`.
- **Acceptance:** binding a param to Envelope over a 4 s loop samples 0 at t = 0, rises to 100% within the attack (default 10 → ~0.2 s), holds the sustain (70%) and is back at 0 before the loop wraps; the same t always gives the same value (scrub twice, equal); the M dot's list shows *Envelope*.

### 2.2 — The envelope is shaped where the binding is edited
- The Modulation section shows kol-hardware's `EnvelopeGenerator` (ADSR mode) for a param bound to Envelope; dragging its handles writes `transform.adsr`.
- **Acceptance:** with Growth bound to Envelope, setting attack to its max in the generator changes the binding's `transform.adsr.attack` to 100 and the sampled value at t = 0.2 s drops below 15% (it was 100%); no page errors.

### 2.3 — Inputs offers Envelope and Expression
- Inputs' Source column gains *Envelope* and *Expression* (`expr`, which the bind system already has); an Expression row starts with `sin(t)` and is edited where Expression is edited today.
- **Acceptance:** Inputs › Source lists Off · Mouse X · Mouse Y · Mic · Beat · LFO · Envelope · Expression; picking Envelope writes `{ bind: 'mod', source: 'envelope' }` on the row's param; picking Expression writes `source: 'expr'` with `transform.expr = 'sin(t)'`; Off restores the base value for both.

## Built — 2026-10-31
- `src/editor/params/InputRows.jsx` — the section; mounted first in the Animation tab of generators and the Motion tab of effects (`labs/LabsParams.jsx`); `inputs: ['growth', 'weight', 'contrast']` on Growing line (generator and effect).
- A binding keeps `transform.base` — the value the param had when the input took it; Off gives it back (first run left Growth at 0 and Weight at its floor — the input's reading at that instant).
- The M dot is not shown on a bound slider in Labs; the binding opens in the existing **Modulation** section instead ("Growth · Mouse X", range 0–20) — that is the editor it reaches.
- Measured (Growing orb, 1400×900): Add input → `growth = { bind: 'mod', source: 'mouseX', range [0, 20], base 6 }`; Source → Mic → `Mic → Growth`; Drives → Weight → Growth back to 6, Weight bound to `audio-level` (base 1.2); a second Add input → Mouse X → Growth (the next free shortlist param); Off on each → no rows, Growth 6 and Weight 1.2 again; Dither › Halftone over a library photo: Motion tab opens on Inputs, Add input → Mouse X → Amount; no page errors.

## PARKED
- Nothing.
