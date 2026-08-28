# Handoff — 2026-08-14 16:13

## Goal of the current arc
The mobile randomiser polish arc: audit done and closed (see the 2026-08-14 session log); what remains is user-gated follow-through — the color-contrast system and a real-device verification pass.

## Last actions taken (causal trail, newest first)
- Closed the /kol-goal audit: 10/10 generator doors verified headless, zero console errors.
- Fixed the Gradients "Media" wreck (preset `type` param shadowed `layer.type` → renamed `form`, `RESERVED_LAYER_KEYS` guard in `presetParams`).
- Fixed three-0.185 lost-context crash (canvas keyed per engine identity at 3 LayerRenderer sites).
- Wired touch on every generator (orbit tool flip in mobile, `setPointer` nudges on drift/iridescent/softforms, tap-retrigger on flat 2d loops).
- Added Camera source pane (front-preferred `facingMode`), Esc-closes-modals, modal-pauses-playback, loop chips, collapsed Download, header Start over.
- Retired EditorButton (111 call sites → shipped Button + `iconComponent={EditorIcon}`).

## Current state / open decision points
- **Color-contrast plan proposed, NO GO yet:** (1) roll contrast floor (bg↔fg luminance distance, re-roll fg under it), (2) Background + Motif roll buttons on the Generate tab, (3) settings gear — hex bg, roll intensity, roll scope (bg/motif/both). User said "we have to restrict color… too weak when you randomise" then the session moved to bugs; the plan was restated twice without an answer.
- Device-verify owed (user's hardware): webcam layer pixels, SF3D Preset button (stalled under headless software-GL only), brief blank flash on GL family hops, desktop 3D Orbit under three 0.185.
- Lobby: ten 🟢 stubs carry 📌 remainders all recorded as adopted in logs — squaring is bookkeeping, user's call. SegmentedFilledStateFix still 🔵 in kol-ds-ui (0.37 `tonal` may satisfy it).
- kol-component 0.37.0 peer-wants `opentype.js ^1.3.4` vs the editor's deliberate 2.0.0 — DS-side range widen, lobby material if it bites.

## Next intended action
- Get the user's yes/no on the color-contrast plan; build it if go. Otherwise run the device pass list top to bottom.

## Working memory not yet in AGENT-CONTEXT
- Headless GL screenshots show a white top band that is a compositor artifact of chrome-headless-shell + SwiftShader — pixel probes (readPixels + drawImage) proved the buffer fully painted. Don't chase it again.
- Audit tooling lives in the session scratchpad (`audit.mjs`, `repro-gradients.mjs`, probes) using npx-cached playwright-core + the 1228 headless shell — pattern worth reusing; the MCP playwright opens a headed window (user wants headless).
- `pnpm dev -- --port N` did NOT forward the port flag (vite picked its own); the audit server ran wherever vite landed — check the log line, don't trust the flag.
- Preset shuffle on multi-family groups is the strongest smoke test for GL lifecycle bugs (it exercises destroy→create on family hops).
