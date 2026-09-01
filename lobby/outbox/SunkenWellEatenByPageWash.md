# SunkenWellEatenByPageWash — `surface-sunken` is defined against the UNWASHED page

**Filed:** 2026-08-30 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SunkenWellEatenByPageWash.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟠 `reopened` 2026-08-30 — returned as kol-theme 0.108.0, then **0.109.0 reverted it** as the wrong layer. The light-mode collision is live again; the dark-theme half stands.

## Why it went there

Found bumping kol-theme 0.99.0 → 0.106.0 (seven releases, token files). In light
mode every `tone="sunken"` control on `/settings` lost its pill and renders as
bare text — the chrome picker, DEFAULT ASPECT, LOOP THEME, LOOP LENGTH.

`--kol-surface-sunken` is `oq-ab-96` = **245, designed to sit under a 250 page**
(the token's own comment says so). But `AppShell pageWash` paints ink over that
page, and fxr passes the ruled `var(--kol-fg-02)` — 2% of `#121215`:

```
250 × 0.98 + 18 × 0.02 = 245.4 → 245
```

Measured: trigger `245,245,245`, washed page `245,245,245`, **delta `0,0,0`**.
Dark is unaffected — the wash is ink over ink, so the well stays 10 under 18.

Both halves are DS rules (the five-level well, and `pageWash` which is
`AppShell`'s own prop), so the fix is theirs: derive the well from the page as
PAINTED, or deepen it past the wash. Screenshots either side of the bump in
`_tmp/2026-08-30-theme-0106-sunken/`.

## What stays here

Nothing. fxr passes stock `tone="sunken"` and the user-ruled `pageWash` rung and
is not hand-patching either.

**Remainder here:** none — nothing is owed here; the fix was withdrawn upstream and the ticket is theirs again. See the REOPENED section. Returned as: bump kol-theme 0.108.0 + kol-component 0.137.0, re-measure the delta on `/settings`, confirm the four controls render as pills again.
**State:** 🟠 REOPENED 2026-08-30 — 0.108.0's fix was reverted in **kol-theme 0.109.0**; the collision is live again here

## ✅ RETURNED — 2026-08-30

**kol-theme 0.108.0** — option 2, as you argued. Every sunken surface paints the
same `--kol-shell-page-wash` film the page does, so the gap survives any rung.
Measured: light 5 levels, dark 8.

Also on this bump:
- **kol-theme 0.107.0** — the Dropdown trigger's hover state is gone. It carried
  `.kol-btn`, so `.kol-btn.kol-tone-sunken:hover` matched it; the exclusion
  existed only in the atoms sheet. Gated now (`validate-dd-trigger.mjs`).
- **kol-component 0.137.0** — settings drawer has no scrim/blur.

## Remainder here — 📌 YES

Bump theme 0.108.0 + component 0.137.0, re-measure the delta on `/settings`, and
confirm the four controls (chrome picker, DEFAULT ASPECT, LOOP THEME, LOOP
LENGTH) render as pills again.

Thanks for the arithmetic — `250 × 0.98 + 18 × 0.02 = 245` is what made this
findable rather than another "looks wrong" report.


## ✅ ADOPTED — 2026-08-30 · kol-theme 0.108.0 · kol-component 0.137.0

Option 2, as argued. Every sunken surface now paints the same
`--kol-shell-page-wash` film the page does — read from disk:

```css
.kol-dd-trigger.kol-tone-sunken {
  background-color: var(--kol-surface-sunken);
  background-image: linear-gradient(var(--kol-shell-page-wash, transparent),
                                    var(--kol-shell-page-wash, transparent));
}
```

The well is below the page **by construction** now, not by two numbers happening
to agree, so the next `pageWash` rung change cannot close it silently. That was
the whole point of preferring (2).

**Re-measured on `/settings`, both themes:**

| | result |
|---|---|
| light | all four controls render as pills again — chrome picker, DEFAULT ASPECT, LOOP THEME, LOOP LENGTH |
| dark | wells below the page, not the pale boxes that started this |
| drawer (component 0.137.0) | opens with no scrim and no blur, as shipped |
| console | 0 errors, 0 warnings across `/` `/library` `/editor` `/labs` `/settings` |

Screenshots before and after in `_tmp/2026-08-30-theme-0106-sunken/`.

**Remainder here:** none — superseded; see the REOPENED section below, which is this receipt's current state.


## 🟠 REOPENED — 2026-08-30 · kol-theme 0.109.0 withdrew the fix

0.108.0's mechanism is gone. `kol-components-molecules.css:1327` now says so in
the file itself:

> ⚠️ `SunkenWellEatenByPageWash` **IS NOT SOLVED HERE** — see the ticket. On
> 2026-08-30 these rules briefly painted `--kol-shell-page-wash` as a background
> layer so the well would track a washed page. That was the wrong layer (user:
> *"we are talking about components, wash affects background"*): a control has
> no business reproducing a page-level film, and portalling proved it —
> `.kol-dd-panel` renders at document.body, could not inherit the property, and
> drew a different colour from its own trigger. Reverted. The collision is a
> PAGE/token question and belongs there.

Fair, and the portal argument is right — that is the same class of thing
kol-shell 0.28.0 then went and fixed by putting the wash on the root.

**But the collision is live again on `/settings`.** Re-measured on
theme 0.109.0 / shell 0.28.0:

| | value |
|---|---|
| `.kol-dd-trigger.kol-tone-sunken` | `245, 245, 245`, `background-image: none` |
| the washed page under it | `245, 245, 245` |
| **delta** | **`0, 0, 0`** |

Same four controls, same pill-less render as before 0.108.0. Screenshot:
`_tmp/2026-08-30-theme-0106-sunken/settings-028.png`.

**What 0.109.0 DID fix and should keep:** the dark-theme half — the tone was
reading `oq-inverse-96` (luminance 23.7 on an 18.2 page), so every "sunken"
control rendered RAISED. That is the repeated "multiple backgrounds" report and
it is genuinely gone.

So: their revert is sound, their dark fix is right, and the light-mode
page/token question is still open — which is what their own note says. Nothing
is owed here; fxr passes stock `tone="sunken"` and the user-ruled `pageWash`
rung and will not hand-patch either.

## Note for the next bump — the versions were drifting under us

The 0.108.0 verification was done on 0.108.0 and then **0.109.0 installed itself**
on the next unrelated `pnpm install`, because the kol-* deps carried `^` ranges.
So a fix was verified and a revert shipped, in one session, without a version
line changing.

All six kol-* deps are now **pinned EXACT**, which is the rule AGENT-CONTEXT
already states for 0.x packages and which only `kol-media-client` was following.
