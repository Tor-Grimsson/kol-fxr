# FloatingStyleAndSignInDemos — a floating style beside the current one, AppFloatNav, sign in over Home, demo apps style + modal

**Filed:** 2026-10-30 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/FloatingStyleAndSignInDemos.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟠 `addressed` 2026-10-30

## Why it went there
The user, after three canvas rounds (page Round 3 of https://claude.ai/artifact/W81QSMMdZXXWFrFBtGWjZP): the rounded floating shapes are a new style KOL does not have, and they are needed in another repo too — so the style, the nav and the sign-in presentations are KOL's, with two demo apps.

## What stays here
On the bump: fxr's dock and phone nav become AppFloatNav with fxr's rows (Editor, Labs, Randomiser › Generate · Effects, Morph); `/signin` becomes the column over Home; the local float shadow in `src/editor/styles/kol-editor.css:468` retires to the token.

## ✅ RETURNED — 2026-10-30

🟠 `addressed` in **kol-ds-ui** — **kol-theme 0.201.0 · kol-component 0.318.0 · kol-shell 0.91.0** (shell needs component ≥0.318.0, theme ≥0.201.0). Stays open there for the showcase AppFloatNav page and the user's approval of the float values.
- **AppFloatNav** (kol-shell) — the floating nav, one family. `variant`: `mobile` (phone nav) · `dock` (desk dock: rail rows in rail order, then ··· opens the whole nav and turns into ×) · `panel` (Labs' top pill) · `transport` (Labs' transport). A row with `sub: [{ label, icon?, onPress }]` opens its rows above its slot (Randomiser › Generate · Effects); slots name themselves on hover in the KOL Tooltip; menus are borderless unless `menuBorder`. Pass your rows as data, no local styling.
- **AccountForm** (kol-shell) — `{ title, fields: [{ id, placeholder, type?, autoComplete? }], okLabel, footer: { text, link, href?, onPress? }, onSubmit, check?, done? }`, `variant="column"` (desk) or `"box"` (phone, style B).
- **Sign in over Home** — pass `AppHub signIn.form` with AccountForm's props (data only). Signed out, every Sign in the Hub draws opens it over Home instead of `signIn.page`: the 672 column slides in from the left on a desk, the style-B box on a phone; the + now shows on the phone too.
- **Float style B** — `--kol-shadow-float` (kol-theme) replaces the local shadow; Button / Input `variant="float"` are passed by the composed components, never by hand.
- **PhoneNav and TransportPill still work** — deprecated aliases of AppFloatNav on the retirement ledger (`nav` maps to `mobile`; TransportPill is `variant="transport"`). Move to AppFloatNav at your pace.
- **Float values are provisional** — shadow, radius, inset and heights change in later releases as the research lands; fxr changes no code, only bumps.

**Remainder here:** 📌 bump kol-theme 0.201.0 · kol-component 0.318.0 · kol-shell 0.91.0; dock and phone nav → `AppFloatNav` with fxr's rows; `/signin` → `signIn.form` over Home; retire the local float shadow in `src/editor/styles/kol-editor.css:468` to `_tmp/`.

## Adopted here — 2026-10-30

Bumped kol-theme 0.201.0 · kol-component 0.318.0 · kol-shell 0.91.1 (plus kol-framework 0.65.0 · kol-icons 0.53.5). `src/AppLayout.jsx`: `home.chromes` are the board's rows (Editor · Labs · Randomiser with Generate and Effects as `sub` · Morph); `signIn.form` replaces `signIn.page` with /signin's own fields and copy (/signin stays for a link). `src/editor/labs/LabsView.jsx`: `AppFloatNav` `panel` and `transport` replace PhoneNav and TransportPill. `src/editor/styles/kol-editor.css`: the menu's shadow is `var(--kol-shadow-float)` (same value). Build passes.

**Remainder here:** none.

## ✅ RETURNED — 2026-10-31 · kol-theme@0.203.0 · kol-component@0.320.0 · kol-shell@0.92.0

The float style is accepted (user 2026-10-31: both glass styles, round 3) and replaces the provisional values. kol-theme 0.203.0: --kol-glass-dark-* / --kol-glass-light-* (fill, blur 6/16 saturate 1.8, rim, shadows) and --kol-float-* sizes (mouse 28/36/44, touch 36/44/52 on pointer: coarse), .kol-float-solid|glass-dark|glass-light (+ .kol-float-m), reduced transparency to solid; glass-dark carries dark ink in either theme. kol-component 0.320.0: Tooltip, SegmentedToggle and TabsRow variant="float", surface; the TabsRow pill 66 tall, 56 slots, split and labels (tabbarPillWidth() values changed). kol-shell 0.92.0: AppFloatNav surface on all four variants + labels, AccountForm box surface (340, r 28). Showcase /components/app-float-nav. Measured: every shape x surface x mouse/touch x light/dark matches round 3 within 1px (1944 checks, 0 fails).

**Remainder here:** bump kol-theme 0.203.0 · kol-component 0.320.0 · kol-shell 0.92.0; pass surface= where a float sits over a stage

## Adopted — 2026-10-31 · kol-theme 0.203.0 · kol-component 0.320.0 · kol-shell 0.92.0

Bumped. Every fxr float (Home dock, Labs' phone pills) takes the default `solid`, the user's pick for now; nothing passes `surface`. Home's dock cannot take another surface until HubHome forwards one (ticket `HubHomeFloatSurface`).

**Remainder here:** none.
