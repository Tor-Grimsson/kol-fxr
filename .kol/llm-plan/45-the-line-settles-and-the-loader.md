# Plan — The line settles, and the loader lands on the logo

**Raised:** 2026-10-30, in session. Points verbatim:
- *"it still jitters to helll at the edges, its like a rubber string... until a timer is done thhen its just dead. AND the mouse is like just vibratiing EVERYTHING TO SHIT"*
- *"it doesnt need to be so active when nothing is happening, its just the mouse intereaction and the growth edges that are subject to constant change right?"*
- *"remember when shelf opens, then growth center shifts to center the gray visible area?"*
- *"D we open with the growth only, then it grows into FXR shape, then FXR shape fills to white and moves to its location. then UI enters and Home appears?"* · *"I think its better to just make the loader actual code on dev server"*
- A shape input for the engine was asked for in an earlier session and dropped; it is built (`growthLine.js` — orb · FXR mark · SVG) and D rides it.
- Recordings: `~/Screenshots/Screen Recording 2026-10-30 at 23.11.23.mov` · `… 23.13.26.mov`
- 2026-10-31: *"it looks fine, but maybe a little laggy??"* · *"the mouse radius is so small it should be bigger and more blurry"* · *"BUT you skipped the loader part??"*

**Status:** W1 and 2.1 built — 2026-10-31. Open: 2.2 (his ruling).
**Shape:** W › phase › list.
**Laws carried:** never delete, retire to `_tmp/`; no visual change beyond what is asked (the orb's look stays); the effect (`filters/fxGrowth.js`) and the generator (`growthLine.js`) share the engine and keep today's look — every engine change is opt-in; KOL changes only by ticket; a green build or a pixel count is not verification.
**How a phase closes:** measurable acceptance line first, gates green, then Playwright against his own words; motion on a recording — frames at 30fps, stitched with ffmpeg, watched against his recordings.

## W1 — The growing line settles

### 1.1 — One cause: nodes that never cool — ✅ built 2026-10-31
- Confirmed in `src/loops/growth/engine.js`: a node with few neighbours is "front" and its rest counter is reset every step, so it never cools. On a finished orb the whole outer rim is front. The rim springs while growing (the rubber string), every mouse move wakes the whole rim for a second (everything vibrates), and the only thing that ever stops it is the hard cap flag (dead).
- One mechanism replaces the binary freeze: every node carries a heat 1 → 0 that fades each step; a split beside it or the pointer raises it; forces and growth splits scale with heat; growth slows as the count nears the cap. Nothing is live forever, nothing snaps.
- Opt-in on the engine (`settle` stays the switch); HomeStage turns it on, the effect and generator do not.
- Acceptance, measured on a 30fps capture of a cold load at 1440×900, then 20 s of rest, then the pointer crossing once:
  - **Edges:** while growing, no node reverses direction more than once per second.
  - **No dead stop:** the largest per-frame movement decays over the last 3 s and never drops from > 0.5 px to 0 in one frame.
  - **At rest:** 20 s after growth ends, no pixel changes between frames.
  - **Mouse:** only nodes within the push radius (72 px) move; everything is still within 1 s of the pointer leaving; nothing outside the radius moved at any frame.
  - Watched beside `23.11.23.mov` and `23.13.26.mov`: none of what they show.

### 1.2 — Sign in re-centres without a restart — ✅ built 2026-10-31
- Measured 2026-10-31: it did NOT move — kol-shell's column overlays the stage without moving it. `HomeStage.jsx` now follows the column itself (half its width, 300 ms, on its `aria-hidden`). Re-measured: 720 → 1056 → 720 mid-grow and after, 1440 wide, node count never dropped.
- Acceptance: a capture of opening and closing sign in mid-grow and after — the canvas's centre moves 720 → 1056 and back, the canvas stays 1440 wide, the line's node count never drops to the seed ring.

### 1.3 — The lag he sees — ✅ built 2026-10-31
- Measured so far: 60 fps, step 2.1 ms p50 / 5.8 ms p95 — in Playwright at DPR 1. His screen is DPR 2 and the draw cost was never timed, so the cause is not known yet.
- Profile first at DPR 2 (step + draw split, while growing 2 steps/frame), then fix the part that is over budget — no speculative change.
- Measured at DPR 2: frame p95 16.8 ms, no frame over 20 ms, step 2.0 / 2.5 ms, draw 0.2 / 0.4 ms — frames were never the lag. The cause was the pointer's low-pass at 0.1 (the push trailed the cursor ~10 frames); now 0.35.
- Acceptance: at 1940×1130 DPR 2, frame time p95 ≤ 16.7 ms and no frame > 33 ms across the whole grow; recorded and watched.

### 1.4 — A bigger, softer mouse — ✅ built 2026-10-31
- Hover reach grows (today 0.12 of the short side, ~135 px) and the push fades smoothly to zero at the edge instead of a hard rim.
- Built: hover reach 0.24 of the short side (2×), bell falloff (1 − d²/r²)². Measured after a sweep at DPR 2: motion > 0.25 px ends 1.7 s, > 0.01 px ends 3.6 s, cold 5.1 s; nothing beyond the reach moved.
- Acceptance: hover reach ≥ 2× today; push strength vs distance has no step (smooth to 0 at the rim); line still within 5 s of the pointer leaving; nothing beyond the reach moves.

## W2 — Loader → logo, in code (D) — next after 1.3–1.4

### 2.1 — D on the dev server — ✅ built 2026-10-31
- The real engine, not images, in this order: the line grows alone; it grows into the FXR mark (`vectorCanvas`, the favicon); the mark fills white; it moves to the logo's spot; the UI enters (+, nav); Home appears (the orb stage starts).
- Replaces kol-framework's `loaderApp` mark on first load, in fxr only.
- Built: `src/components/BootIntro.jsx` + `intro.js`; `vite.config.js` stamps `fxr-intro` on a cold signed-out `/` (motion allowed) and the static loader drops its mark; Home's line waits on `introDone`. Signed in, other routes, reduced motion: the plain loader as before.
- Measured on a 30fps capture (`_tmp/2026-10-31-loader/run2/`): line ~3 s (FXR reads at ~2 s) → fill 0.9 s → fly 0.9 s → ground fades 0.6 s → Home's line starts; the landed mark matches the logo box (64/64/112) to video noise.
- Acceptance: a 30fps capture of a cold load shows the six steps in that order, each visible for at least 0.5 s, the white mark landing exactly on the logo's box (64/64, 112 px on a desk).

### 2.2 — Pace, cold load vs every visit, and the phone — TALK
- His rulings on the capture from 2.1: the timing; whether D plays on every visit to Home or only on a cold load (it adds seconds to the load); how it lands on a phone (16 / 24, 48 px).

## W3 — Home's dock floats like Labs

### 3.1 — The dock wears the float shadow (ticket to kol-shell) — ✅ built 2026-10-31 (kol-shell 0.91.3)
- 2026-10-31, screenshot of the Home dock over the line: *"this needs the drop shadow blur we use in labs?"*
- Cause: HubHome renders `AppFloatNav variant="dock"`, and the `dock` preset has `shadow: false`; Labs' `transport` has `shadow: true`. HubHome passes no `shadow`, so fxr cannot turn it on. It needs a kol-shell ticket.
- Measured on 0.91.3: the dock's `box-shadow` is `rgba(0,0,0,.4) 0 8px 24px -8px, rgba(0,0,0,.3) 0 2px 6px -2px` in light and dark — the same as Labs' transport pill. 0.91.3 also slides the stage 336 into the grey, so fxr's own follow retired (sign in: 720 → 1056 → 720, once).
- Acceptance: the Home dock's computed `box-shadow` equals Labs' transport pill's, in both themes; screenshot beside Labs.

## W4 — The mark is the line (loader, second pass)

**Raised:** 2026-10-31, recording `~/Screenshots/Screen Recording 2026-10-31 at 05.46.42.mov` (from 0:06). *"the connection point from the pattern to the form doesnt morph, it just jumps … the transition happens literally in 6 frames... that makes it just JUMP CUT"* · *"a more interesting approach would have been to fully use the mask so the logo is just the growth pattern that sits and pulses for a while, then morp to upper left location?"* · *"also '\' restarts the animation"* · *"we should have a slow lfo sweep to move the pattern in big slooow waves, just so its never static"*

- 2026-10-31, his ruling on the follow-up: *"maybe it stays a pattern and the other elements just slide in or reveal? and then it gains a second marker where it then grows out of the shape to fill the screen, like the circle does now? so we would abandon the idea of moving the logo to the top left?"* → *"yes LOVE it"*. The flight to the top-left is dropped; 2.1's fill + flight retire.

### 4.1 — One cause: the intro swaps two pictures, and two lines — ✅ built 2026-10-31
- Today the intro's line, a solid white mark, and Home's own line are three separate things, so every hand-off is a cut. Make it ONE line from load to Home: it grows clipped to the FXR letters (the mask is the logo), so the logo IS the pattern from the first frame.
- It sits in the centre and pulses (a slow breath in ink/width, ~2 s period); the UI slides in around it — the solid logo top-left, the +, the dock.
- Then the mask lets go (a second density, the screen-filling one Home uses today) and the same line grows out of the FXR shape to fill the screen. No reseed, no second sim, no solid layer.
- Built in `HomeStage.jsx` (BootIntro retired to `_tmp/2026-10-31-boot-intro/`): the line grows on the mark's density, drawn only through the letters in the logo's ink; breathes 2 × 2 s while the page's controls fade in (0.7 s); then the density blends mark → orb over 4 s while Home's ink fades up. On `/` only; signed in → plain loader.
- Measured (`_tmp/2026-10-31-loader/w4e/`): max 8.4% of the centre box changes in any frame; ink 0.4–1.0 through the breath; node count dips 13% while the letters loosen (gradual, not a reseed).
- Acceptance, on a 30fps capture of a reload at 1440×900:
  - no frame-to-frame change over 15% of the centre box's pixels at any point (no cut);
  - nothing drawn outside the letters until the release; the node count never drops after the first frame;
  - the pulse: mean ink inside the mark varies ≥ 10% peak-to-peak over ≥ 2 cycles before the release;
  - the UI's slide-in takes ≥ 0.5 s; the line reaches the screen edges as Home's does today (~25 s at 1940).

### 4.2 — One cause: a resize reseeds the line — ✅ built 2026-10-31
- `\` is the shell's rail toggle (`AppLayout.jsx` `railToggleKey`); on signed-out Home it resizes the stage's box and `HomeStage` reseeds on any real size change — so `\` "restarts the animation". Not by design. The same cause restarts the line on every window resize.
- A resize keeps the line: the canvas and the sim's frame grow or shrink around it, the density is re-sampled, nothing reseeds.
- Measured at DPR 2: `\` (1440 → 1392 → 1440) and 1440 → 1100 → 1440 — node ids kept counting, count never under 13,707, no seed.
- Acceptance: pressing `\` on signed-out Home, and resizing the window 1440 → 1100 → 1440, never drops the node count and never shows the seed again.

### 4.3 — A slow wave, so the pattern is never static — ✅ built 2026-10-31
- A slow LFO sweep moves the drawn pattern in big slow waves (a displacement at draw time; the sim stays still and costs nothing). It runs on the intro's mark and on Home's line.
- Built: engine `draw({ wave })` — 24 s, 9 px, 640 px crests. Measured at DPR 2 at rest (sim cold): 722k pixels change per second, frame p95 16.7 ms, max 16.8.
- Acceptance: period ≥ 20 s, displacement ≤ 1.5 × the line's gap (strands never cross); at rest the frame still changes every second; frame time p95 ≤ 16.7 ms at DPR 2.

## Follow-up — the generator and the effect settle too — ✅ built 2026-10-31
- User: *"Home is best version the other ones were jittery right?"* · *"add settling and wave then"*. W1 had kept `settle` opt-in so only Home changed.
- `growthLine.js` and `fxGrowth.js` run `settle: 60` (Home's) for good and only step while growing or warm; both gained **Wave** (toggle, on) — the wave is one definition now, `waveAt` in `engine.js`, Home included; in Labs and the editor it rides a clock that runs only while the transport plays.
- Measured: Growing orb grows to 7,000 nodes in ~8 s, then `hot` 0 and stays 0; Wave on, the frame keeps drifting (~2,500 of 40,000 px a 400 ms window); Wave off, 0 px change; paused, 0 px for 80 s. The effect over a radial source: Wave on 7,322 px change, off 0. Home still drifts, no page errors.

## PARKED
- **The dock's ··· menu opens the wrong way** (user 2026-10-31, screenshots, *"just to log it, not to fix it now"*): it opens as a tall sheet above the pill, over the sign-in form. He expected it like the + menu — a card beside its button, the button turning to ×. Later; the dock is kol-shell's AppFloatNav, so it goes by ticket.
- **✅ Every dock chrome gets a submenu** (user 2026-10-31, *"these should all give you sub menus"*) — built 2026-10-31 in `src/AppLayout.jsx` `chromes`: Editor → New File · Library; Labs → Effects · Generative · Vector · Composition (each lands on the section's first entry, walked in a signed-out browser). **Morph moved to plan 47 § 2.3** (its rows are its categories, once Morph has them).
- **OWED — Labs on a phone onto AppShell `touch="floats"`** (`PhoneTwoFloatLayout` returned 2026-10-31, kol-shell 0.97.0 · kol-theme 0.207.0, both bumped). Done so far: insets 88 → 98 (the pill is 66 now — Labs on a phone sat 10px under it since the earlier bump) and the sheet's shadow is `--kol-shadow-rail-up`, in `src/editor/styles/kol-labs.css`. Left: AppShell is the app's (AppLayout), so Labs hands its phone toggles, transport and params rail up to AppLayout the way `railExtras` hands up its categories; the rail leaves the editor's grid; the drag-to-resize sheet rides `floats.railHeight`; then kol-labs.css L195-205 to `_tmp/`. Moved to its own plan: `46-labs-phone-on-the-two-floats.md`.
- ✅ Ticketed as `HomeDockRound4` and adopted at kol-shell 0.95.0 (2026-10-31) — the four lines below are fixed.
- **The dock's ··· sits apart from the pill** (user 2026-10-31, screenshot: *"I dont love this being disconnected"*) — the More circle floats beside the pill instead of joining it. kol-shell's AppFloatNav.
- **The dock's ··· menu with its × and "Close" tooltip is wrong** (user 2026-10-31, screenshot: *"dont love this .. just make a note that its wrong"*) — same item as the first PARKED line, seen again at 0.94.0.
- **The dock's slots have no hover state** (user 2026-10-31) — the menu rows light on hover, the pill's icons don't. kol-shell's AppFloatNav.
- **The + should not follow the dock's surface** (user 2026-10-31, screenshots: glass on the + *"just gets a little lost here"*) — HubHome's one `surface` drives both; the + stays the inverted round button. kol-shell's HubHome.
- The canvas loader boards A–D (`Loader → logo` page) — superseded by 2.1.
