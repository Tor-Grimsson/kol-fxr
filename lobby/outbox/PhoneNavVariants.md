# PhoneNavVariants — PhoneNav ships named variants (`nav` · `panel` · `transport`) so every app gets the settled look without re-tuning props; AppShell/AppStudio pass it through, so Home's pill drops its hairline

**Filed:** 2026-10-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/PhoneNavVariants.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-28 · adopted 2026-10-28

## Why it went there
P1 (user, 2026-10-28): *"why is there border still"* … *"nav pills get no shadow when it doesn need it … So we should ship variants? or presets? because if we only ship props then each repo has to tune to the same settiings and we get drift"*. Plan 43.

## What stays here
Adopting it on the bump (plan 43).


## ✅ CLOSED in kol-ds-ui — 2026-10-28

Shipped kol-shell 0.85.0 · kol-component 0.309.0. `PhoneNav variant="nav" | "panel" | "transport"` over `PHONE_NAV_VARIANTS` (exported), props still override; `shadow` passthrough; `AppShell navVariant` (default `nav`) — Home's pill has no hairline with no prop set; `TransportPill` reads the table's `transport` row. Resolution: `kol-ds-ui/lobby/done/PhoneNavVariants.md`.

**Remainder here:** 📌 bump; drop Labs' hand-set pill props for `variant="panel"` and TransportPill's for nothing (it reads the table); `shell={{ navVariant }}` only if Home should differ from `nav`.


## ✅ ADOPTED — 2026-10-28

kol-shell 0.85.0 · kol-component 0.309.0 pinned. Home's pill takes `nav` by default (border transparent, no shadow, walked at 390); Labs' `PhoneNav` is `shape="pill" variant="panel"`, its hand-set props gone; TransportPill unchanged, reads its row (shadow on).

**Remainder here:** none.
