# Plan — Accounts, phone Home and the growing line

**Raised:** 2026-10-28, the phone review in session (screenshots of Home, the More sheet, the sign-in prompt with and without the keyboard; the algorigraph screen recording). Points verbatim:
- P1 *"why is there border still, and where is the new shadow under the PhoneNav?"* → *"nav pills get no shadow when it doesn need it … So we should ship variants? or presets? because if we only ship props then each repo has to tune to the same settiings and we get drift"*
- P2 *"where is the original modal we had on mobile? I want taht instead of this 2x2 bullshit"* → the old card, *"but not with the padded container right?"*
- P3 *"does the UI have to move upp to show keyboard?"*
- P4 *"I am the only user. and we will treat me THE ONLY USER as a proper user … we have d1 connected, how is that not everything youd need for a user account? … we shouldnt see any files until you've LOGGED-IN. we should rather have something unique to an unlogged experience."* → *"maybe user space? profile picture, name, custom settings?"*
- P5 *"[Image #7] we made this kind of effect right? does it also live in effect? and take media?"* → *"yes effect, but also generated. AND that is the preffered method … you shouldnt have to upload an image to view the effect."*
- P6 *"I think when you press [...] you should get the entire Nav menu list"* → *"but also ship with prop so you can customise"*

**Status:** built 2026-10-28 except 3.3's build (waits on the frame pick) and the remote Worker rollout (`pnpm api:migrate`, `pnpm api:schema`, `pnpm api:deploy`, then the first link with `pnpm api:invite`). W5 adopted on kol-shell 0.85.0 · kol-component 0.309.0. Open: those two.
**Shape:** W › phase › list.
**Laws carried:** never delete, retire to `_tmp/`; user copy verbatim; Tailwind first; no "·" as a separator; the editor is this repo's source (no DS tickets for editor work, shell/component gaps still go to kol-ds-ui); KOL pinned exact; the draft autosave never touches D1; a green build is not verification, walk it in a browser.
**How a phase closes:** acceptance line first, gates green, then Playwright against his own words.

## W1 — Phone Home chooser (P2)

### 1.1 — The old chooser, back on the page — ✅ built 2026-10-28 (kol-shell 0.85.0 `touch.label`)
- Home on a phone drops `touch.doors` (HubHome's 2×2) and renders the old `EntryScreen` content inline under the subtitle: "Select chrome" eyebrow, four stacked full-width buttons, icon on both sides (Generate, Effects, Labs, Morph).
- No card, no scrim, no padded container. Copy as it was.
- **Acceptance:** at 390 wide, Home shows the eyebrow and four stacked buttons where the 2×2 was; each opens the same route the door did.

## W2 — Accounts (P4)

### 2.1 — Users and sessions in D1 — ✅ built 2026-10-28 (local Worker; remote: `pnpm api:migrate` then `pnpm api:schema`, then `pnpm api:deploy`)
- `users` (id, email, name, avatar, password hash via WebCrypto PBKDF2 in the Worker, prefs JSON) and `sessions` (token, user id, expiry) tables in `kol-fxr`.
- Worker routes: sign in, sign out, me, update profile. The shared-secret gate retires to `_tmp/` once 2.2 passes.
- **Acceptance:** a seeded account signs in and gets a token; a wrong password is refused; the token reads `me` back.

### 2.2 — The library is owned — ✅ built 2026-10-28
- Every library row carries `user_id`; reads and writes are scoped to the signed-in user. Existing cloud rows move to the first account.
- **Acceptance:** signed in, the cloud library lists the existing rows; a second test account sees none of them.

### 2.3 — Sign-in in the app — ✅ built 2026-10-28 (`/signin`; the rail row asks email + password, kol-shell 0.85.0)
- The rail's Sign in opens an email and password sign-in, not the "Password for the library sync" prompt.
- **Acceptance:** sign in from the rail on desktop and on a phone; the session survives a reload; sign out returns to logged-out Home.

### 2.4 — Invite-link sign-up (ruled 2026-10-28) — ✅ built 2026-10-28 (`/join?invite=`, `pnpm api:invite` for the first link, `/account` mints the rest)
- Sign-up exists only through a link you generate: an `invites` table (token, used, expiry), a Worker route to mint one, a sign-up page that takes the token. No open registration.
- **Acceptance:** a minted link creates an account once; a used or missing token is refused; there is no sign-up entry without a link.

## W3 — User space and logged-out Home (P4)

### 3.1 — The rail row is you — ✅ page built 2026-10-28 (`/account`); the row is the account, kol-shell 0.85.0
- Signed in, the cloud row shows your picture and name and opens your profile page: picture, name, preferences. App Settings stays where it is.
- **Acceptance:** the row shows the avatar and name; the page edits both and they persist across a reload and another device.

### 3.2 — Your preferences (ruled 2026-10-28) — ✅ built 2026-10-28 (theme, chrome, app defaults; shortcuts are not customisable, nothing to carry)
- Look and workflow follow the account: theme, default chrome, export defaults, shortcuts. Device things stay per device: Simple mode, grid, view size.
- **Acceptance:** change theme and export defaults on desktop, sign in on the phone, and they are there; Simple mode on the phone does not reach desktop.

### 3.3 — Logged-out Home: a live stage (ruled 2026-10-28) — FRAMES up for review 2026-10-28 (https://claude.ai/artifact/W81QSMMdZXXWFrFBtGWjZP: A phone, B desktop full-bleed, C desktop split); build waits on the pick
- No files until signed in. Home is a full-bleed generator running (the growing line once W4 lands), the FXR mark, the chooser and Sign in.
- Frames before the build; the look is shaped with you.
- **Acceptance:** signed out, Home shows the running stage, the mark, the chooser and Sign in, and no file anywhere; signing in shows your files.

## W4 — The growing line (P5)

### 4.1 — Generator — ✅ built 2026-10-28 (Flow › Growth: Growing line, orb, rings; `node src/loops/growth/growth.check.mjs`)
- One closed line that grows, folds and never crosses itself (differential growth), packing tighter where a built-in image is darker. Black line on white by default; the motion is the growth.
- Lives as generative motion, so it is seen with no upload.
- **Acceptance:** pick it in Labs with no media and the line grows from a blob into the built-in image; it never crosses itself; Randomize all keeps to the plan 42 rule.

### 4.2 — Effect — ✅ built 2026-10-28 (Effects › Halftone › Growing line; vector export through the def's `svg`)
- The same engine as an effect that takes your image or video as the density source.
- **Acceptance:** drop a photo on it in the Editor and the line fills the photo's darks; SVG export is one path.

## W5 — DS tickets to kol-ds-ui (P1, P3, P6) — filed 2026-10-28 (`PhoneNavVariants`, `PhoneMoreWholeNav`, `PromptHoldsWithKeyboard`; plus `HubHomePhoneChooser` for W1 and `HubAccountRow` for 2.3 / 3.1)

### 5.1 — PhoneNav variants
- `variant="nav" | "panel" | "transport"`, each carrying the settled look (border, shadow, active shape, placement); props stay as overrides. AppShell / AppStudio pass the variant through, so Home's pill gets it too. Nav: no border, no shadow.
- **Acceptance:** ticket filed; on the bump, Home's pill has no hairline and Labs drops its hand-set props for the variant.

### 5.2 — More lists the whole nav
- More shows every nav row above the page actions by default, with a prop to choose which rows.
- **Acceptance:** ticket filed; on the bump, More on Home lists Library, Editor, Labs, Randomiser, Morph and Settings.

### 5.3 — The prompt holds still with the keyboard
- The sign-in dialog doesn't jump when the keyboard opens, and the page isn't left scrolled when it closes.
- **Acceptance:** ticket filed; on the bump, on an iPhone, the dialog stays put and Home returns to its own scroll.

## W6 — Icons from the package (lobby inbox `IdentitySetFromPackage`, kol-ds-ui 2026-10-28)

### 6.1 — Bump and copy the identity set — ✅ built 2026-10-28
- Bump kol-icons 0.50.0, kol-component 0.308.0, kol-shell 0.84.0, kol-framework 0.60.0, kol-brand 0.2.0.
- `scripts/icons.mjs` copies `identity/fxr/` out of kol-icons (`"icons"` script); the favicon copy lands at `public/favicon/favicon.svg`.
- Retire `scripts/generate-icons.mjs`, the local tile and OG sources and the `sharp` devDependency to `_tmp/2026-10-28-icons-from-package/`; close the ticket with its receipt.
- **Acceptance:** `pnpm icons` copies from the package; head tags and manifest unchanged; the copied PNGs, favicon and OG match what shipped before.
