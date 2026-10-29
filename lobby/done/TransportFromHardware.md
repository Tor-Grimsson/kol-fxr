# TransportFromHardware — the editor's clock and timeline on kol-hardware's transport

**Staged:** 2026-10-28 · from a kol-ds-ui session (kol-mirror's TransportAndTimeline, closed)
**Change:** `editor/params/transport.js` and the timeline's ruler and head build on the DS's; your keyframe lanes stay yours

---

## The problem
fxr and mirror each carried a transport and a timeline. The DS now ships one (**kol-hardware 0.8.0**), built from both: `createTransport()` in `@kolkrabbi/kol-hardware/signal` — mirror's clock (shaped seconds, rate, forward · reverse · ping-pong over a loop window, swing, ease, hold) as a factory, with **your** semantics too: `phase()` is your `t` (0..1 in the loop), `epoch` bumps on stop and home only (never pause), `setLoopSeconds(s)`, `seekPhase(u)`. Its face: `TimeStrip` (readout, ruler, head, the loop window; `children` render under the bar on the same span — your keyframe lanes) and `Scrubber`; hooks `useTransport` · `useTransportPlaying` · `useTransportNow`.

## The fix
1. Bump kol-hardware to 0.8.0.
2. `transport.js`: the clock becomes `const clock = createTransport({ loopIn: 0, loopOut: 4, looping: true })`; `getT()` → `clock.phase()`, `getEpoch()` → `clock.epoch`, `setLoopSeconds` · `stop` · `seek` map as named (`seek(frac)` → `seekPhase`). What stays yours: the pointer and stage inputs, `pointerInterest`, live sources, and the per-frame notify for bound layers (subscribe a rAF while `clock.playing`).
3. `TimelineDock.jsx`: the ruler, head and loop window from `TimeStrip`, your keyframe lanes as its `children` (a function `({ now, span, state })` gets the span to place keys on).

## Definition of done
- [ ] the editor plays, loops, scrubs and stops on `createTransport()`; bound layers still re-render per frame; stop/rewind still reset free-running sims (epoch)
- [ ] the timeline draws its lanes under the DS strip


## 🟠 ADDRESSED — 2026-10-28 (the clock; the strip went back)

kol-hardware 0.8.0 added. `editor/params/transport.js` runs on `createTransport({ loopIn: 0, loopOut: 4, looping: true })`: `getT` → `phase()`, `getEpoch` → `epoch`, `seek` → `seekPhase`, `stop` → `stop`, `rewind` → `home`; the module's API is unchanged for its 29 importers. Kept here: pointer and stage inputs, `pointerInterest`, live sources, the per-frame notify while playing. One behaviour kept on top: a loop-length change keeps the head's place in the loop (`setLoopSeconds` re-seeks the phase; the clock alone keeps seconds and jumped it). `transport.clock` exposes the DS clock for kol-hardware's faces. The hand-rolled clock: `_tmp/2026-10-28-transport-from-hardware/transport.js`.
Checked: the clock in node (runs, pause holds with no epoch, seek, loop length keeps phase, home and stop bump the epoch, wraps); `vite preview`: Morph plays, pause holds (1.50 → 1.50 s), a scrub on the dock lands at 3.00 / 4.00 s; Labs growing line resets on Stop (ink 1184 → 4); 0 console messages from the app.
**Not taken: the strip.** `TimeStrip` is absolute-positioned with its own frame, spans ≥ 4 s while fxr's lanes span one loop, and has no label gutter — filed back as `TimeStripInADock`.

- [x] the editor plays, loops, scrubs and stops on `createTransport()`; bound layers still re-render per frame; stop/rewind still reset free-running sims (epoch)
- [x] the timeline draws its lanes under the DS strip


## ✅ RESOLVED — 2026-10-29

The strip half landed with `TimeStripInADock` (kol-hardware 0.9.1): the dock's readout, ruler, loop window and head are `TimeStrip` docked over the lanes. Both halves done.
