import { useTheme } from '@kolkrabbi/kol-framework'
import {
  SettingsChoice,
  LabeledControlSection,
  SettingsRow,
  SettingsSwitch,
  SettingsPanel,
  SettingsFooter,
} from '@kolkrabbi/kol-component'
import { ASPECTS } from '../editor/shell/aspects'
import { THEME_OPTIONS } from '../loops/lib/themes'
import { useAppSettings, setAppSetting } from '../editor/lib/appSettings'
import { transport } from '../editor/params/transport'

/**
 * AppSettings — the app's settings sections, defined ONCE and rendered in two
 * places: the `/settings` page and a drawer over whatever you are looking at.
 *
 * THE SET IS THE DS's, not ours (kol-component 0.128.0): `LabeledControlSection`
 * is the eyebrow-headed section, `SettingsRow` the uppercase 160px label column,
 * `SettingsSwitch` / `SettingsChoice` the two row controls, `SettingsPanel` the
 * drawer shell (kol-r2b2's approved one — ShellDrawer underneath, so scrim,
 * Escape, focus trap, scroll lock and focus return all come with it).
 *
 * This replaces kol-shell's `SettingsSection` / `LabelRow` on this page. Those
 * render a `kol-helper-14` h2 and a lower-case `kol-helper-12` label; the KOL
 * law is that a section label is an EYEBROW, which is what
 * `LabeledControlSection` does and what kol-r2b2's drawer shows.
 *
 * THE STORE DOES NOT MOVE — `editor/lib/appSettings.js` still owns every value,
 * its versioned localStorage blob and its pub/sub. Both surfaces are pure
 * presentation over it, so a change in the drawer is live on the page and back.
 *
 * SECTIONS ARE DATA, so the page can hand its rows to `ContentFilters` as items
 * and get search + section chips for free. A row is `{ label, render }`;
 * rendering is deferred to `render()` rather than held as an element so a
 * filtered-out row's control is never built.
 *
 * Loop length is in TRANSPORT only. The page carried it twice — once under
 * Defaults as a string-valued dropdown and once under Transport as a numeric
 * one — two controls writing `defaultLoopSeconds`, which is one setting typed
 * twice, not two settings.
 */

const ASPECT_OPTIONS = ASPECTS
  .map((a) => ({ value: a.id, label: a.label }))
  .filter((o) => o.value !== 'custom')

const LOOP_LENGTH_OPTIONS = [2, 4, 8, 12, 16].map((n) => ({ value: n, label: `${n} s` }))

/* The sections, as data. `s` is the live store — every `render` reads it, so a
   set anywhere re-renders both surfaces off the one subscription. */
const sectionsFor = (s) => [
  {
    label: 'Display',
    rowGap: 1,
    rows: [
      {
        label: 'Theme',
        /* A SWITCH, like every other row here (user, 2026-08-28) — a lone
           icon button among ToggleSwitches read as the odd one out. It drives
           kol-framework's store directly (`useTheme().toggle`), the same one
           `ThemeToggle` writes, so the header's toggle and this row stay in
           step. `system` is still reachable from the header control. */
        render: () => <ThemeDarkSwitch />,
      },
    ],
  },
  {
    label: 'Defaults',
    rows: [
      {
        label: 'Default aspect',
        align: 'fill',
        render: () => (
          <SettingsChoice
            options={ASPECT_OPTIONS}
            value={s.defaultAspect}
            onChange={(v) => setAppSetting('defaultAspect', v)}
            tone="sunken"
            className="w-full max-w-24"
            ariaLabel="Default aspect"
          />
        ),
      },
      {
        label: 'Loop theme',
        align: 'fill',
        render: () => (
          <SettingsChoice
            options={THEME_OPTIONS}
            value={s.defaultTheme}
            onChange={(v) => setAppSetting('defaultTheme', v)}
            tone="sunken"
            className="w-full max-w-24"
            ariaLabel="Loop theme"
          />
        ),
      },
      {
        label: 'Clip to frame',
        render: () => (
          <SettingsSwitch
            label="Clip to frame"
            on={s.clipToFrame}
            onChange={(v) => setAppSetting('clipToFrame', v)}
          />
        ),
      },
      {
        label: 'Modulation dots',
        render: () => (
          <SettingsSwitch
            label="Modulation dots"
            on={s.labsModDots}
            onChange={(v) => setAppSetting('labsModDots', v)}
          />
        ),
      },
    ],
  },
  {
    label: 'Transport',
    rows: [
      {
        label: 'Autoplay',
        render: () => (
          <SettingsSwitch
            label="Autoplay"
            on={s.autoplay}
            onChange={(v) => setAppSetting('autoplay', v)}
          />
        ),
      },
      {
        label: 'Loop length',
        align: 'fill',
        /* Sets the DEFAULT new sessions boot with, and pushes it to the live
           transport so the change is felt now — the pairing LabsMenuTop did,
           kept deliberately. The transport bar's inline field still edits the
           live value only. */
        render: () => (
          <SettingsChoice
            options={LOOP_LENGTH_OPTIONS}
            value={s.defaultLoopSeconds}
            onChange={(n) => { setAppSetting('defaultLoopSeconds', n); transport.setLoopSeconds(n) }}
            tone="sunken"
            className="w-full max-w-24"
            ariaLabel="Loop length"
          />
        ),
      },
    ],
  },
]

/* The Theme row's control. Its own component because the section data is a
   plain array — a hook cannot be called from inside `render()`. */
function ThemeDarkSwitch() {
  const { isDark, toggle } = useTheme()
  return <SettingsSwitch label="Dark mode" on={isDark} onChange={toggle} />
}

/** The live sections, as data — the page filters this list, the drawer renders it whole. */
export function useSettingsSections() {
  return sectionsFor(useAppSettings())
}

/**
 * The sections, rendered — an eyebrow-headed `LabeledControlSection` per
 * section, a `SettingsRow` (`LabeledControl inline`) per row. Nothing else:
 * this is a loop over the data above, not a component of its own.
 *
 * The drawer passes nothing and gets every section; the page passes the ones
 * that survived its filters. `divided` puts the hairline above a section — pass
 * it on EVERY section, the first included: the rule is
 * `.kol-section--divided + .kol-section--divided`, so the first draws nothing
 * and skipping it just costs the next its line.
 */
export function AppSettingsSections({ sections, divided = true }) {
  const all = useSettingsSections()
  return (sections ?? all).map((sec) => (
    <LabeledControlSection key={sec.label} label={sec.label} divided={divided} rowGap={sec.rowGap}>
      {sec.rows.map((row) => (
        <SettingsRow key={row.label} label={row.label} align={row.align}>
          {row.render()}
        </SettingsRow>
      ))}
    </LabeledControlSection>
  ))
}

/**
 * DisplaySettingsDrawer — the same sections as a right-anchored sheet, for
 * changing how the thing you are looking at behaves without leaving it. The
 * reset foot writes the store's own defaults back through `setAppSetting`, so
 * every subscriber hears each one.
 *
 * `children` are appended after the shared sections — a host adds what only it
 * owns (the editor's canvas grid lives in compose state, not in appSettings)
 * without that state leaking into the shared set.
 */
const DEFAULTS = {
  defaultAspect: '4:5',
  defaultTheme: 'kol',
  autoplay: false,
  clipToFrame: true,
  labsModDots: false,
  defaultLoopSeconds: 4,
}

export function DisplaySettingsDrawer({ open, onClose, children }) {
  const reset = () => {
    for (const [k, v] of Object.entries(DEFAULTS)) setAppSetting(k, v)
    transport.setLoopSeconds(DEFAULTS.defaultLoopSeconds)
  }
  return (
    <SettingsPanel
      open={open}
      variant="drawer"
      title="Display settings"
      onClose={onClose}
      footer={<SettingsFooter onReset={reset} />}
    >
      <AppSettingsSections />
      {children}
    </SettingsPanel>
  )
}
