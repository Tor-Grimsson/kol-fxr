import { Dropdown, ToggleSwitch } from '@kolkrabbi/kol-component'
import { ThemeToggle } from '@kolkrabbi/kol-framework'
import { SettingsScaffold, SettingsSection, LabelRow, SettingsShortcuts, SettingsLinks, SettingsColophon } from '@kolkrabbi/kol-shell'
import { ASPECTS } from '../editor/shell/aspects'
import { THEME_OPTIONS } from '../loops/lib/themes'
import { useAppSettings, setAppSetting } from '../editor/lib/appSettings'
import { transport } from '../editor/params/transport'
import { shortcutsBySection, comboLabel } from '../editor/state/keymap'
import { currentView } from '../editor/mode'

/**
 * SettingsPage — ONE settings page, at `/settings`, on kol-shell's
 * `SettingsScaffold` (2026-08-15), in kol-monitor's shape (2026-08-27):
 * one Settings tab — Display · Defaults · Transport · Keyboard Shortcuts —
 * and an About tab.
 *
 * Was `editor/home/SettingsView.jsx` behind `?view=settings`; moved here
 * when the app got a real router. Original in `_tmp/`.
 *
 * It replaces the two topbar dropdowns that had already drifted:
 * `shell/MenuTop.jsx` carried default aspect · loop theme · autoplay · clip to
 * frame, `labs/LabsMenuTop.jsx` carried default aspect · theme · loop length ·
 * mod dots. Both wrote the SAME `appSettings` store, so the split was never a
 * separation of concerns — it was one settings surface typed twice.
 *
 * THE STORE DOES NOT MOVE. `lib/appSettings.js` still owns every value, its
 * versioned localStorage blob and its pub/sub. kol-shell ships NO persistence
 * of any kind — it renders a settings page, it does not store settings — so
 * this page is pure presentation over the store that already existed.
 *
 * App theme is kol-framework's store now (`useTheme` / `applyTheme`, key
 * `kol-theme`) — `editor/theme.js` is retired to `_tmp/` (2026-08-27). One
 * store means the DS `ThemeToggle` can sit here, as it does in monitor; the
 * boot script in index.html reads the framework's key.
 *
 * Shortcuts render read-only from `keymap.js`, which is what kol-shell's own
 * docstring asks for: feed ONE array to the settings page and the overlay so
 * the pair cannot drift. Scoped by `currentView()` — null on a shell page, so
 * the full map renders, which is the right answer for a settings page reached
 * from the rail rather than from an editor.
 */

/* the loop-length defaults new sessions can boot with (the transport bar edits the live value) */
const LOOP_LENGTH_OPTIONS = [2, 4, 8, 12, 16].map((n) => ({ value: String(n), label: `${n} s` }))
const ASPECT_OPTIONS = ASPECTS
  .map((a) => ({ value: a.id, label: a.label }))
  .filter((o) => o.value !== 'custom')

const LOOP_SECONDS = [2, 4, 8, 12, 16]

const TABS = [
  { value: 'settings', label: 'Settings', title: 'Settings', subtitle: 'Configuration and preferences' },
  { value: 'about', label: 'About', title: 'About', subtitle: 'Effexor FXR by Kolkrabbi' },
  { value: 'repo', label: 'Repo', title: 'Repo', subtitle: 'Source and deployments' },
]

function SettingsContent() {
  const s = useAppSettings()
  const sections = shortcutsBySection(currentView())
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SettingsSection title="Display">
        <LabelRow label="Theme" align="center">
          {/* fill="subtle": on a page this toggle IS a button (the component's
              own spec); system lives behind alt-click, per the DS ruling. */}
          <ThemeToggle fill="subtle" size="sm" />
        </LabelRow>
      </SettingsSection>

      <SettingsSection title="Defaults">
        <LabelRow label="Default aspect" align="center">
          <Dropdown
            options={ASPECT_OPTIONS}
            value={s.defaultAspect}
            onChange={(v) => setAppSetting('defaultAspect', v)}
          />
        </LabelRow>
        <LabelRow label="Loop theme" align="center">
          <Dropdown
            options={THEME_OPTIONS}
            value={s.defaultTheme}
            onChange={(v) => setAppSetting('defaultTheme', v)}
          />
        </LabelRow>
        {/* The default a new session boots with — the transport bar's inline
            field edits the LIVE value. Was the labs topbar's Settings menu until
            that bar went (2026-08-27); the other three rows here already were. */}
        <LabelRow label="Loop length" align="center">
          <Dropdown
            options={LOOP_LENGTH_OPTIONS}
            value={String(s.defaultLoopSeconds)}
            onChange={(v) => { setAppSetting('defaultLoopSeconds', Number(v)); transport.setLoopSeconds(Number(v)) }}
          />
        </LabelRow>
        <LabelRow label="Clip to frame" align="center">
          <ToggleSwitch
            checked={s.clipToFrame}
            onChange={(v) => setAppSetting('clipToFrame', v)}
          />
        </LabelRow>
        <LabelRow label="Modulation dots" align="center">
          <ToggleSwitch
            checked={s.labsModDots}
            onChange={(v) => setAppSetting('labsModDots', v)}
          />
        </LabelRow>
      </SettingsSection>

      <SettingsSection title="Transport">
        <LabelRow label="Autoplay" align="center">
          <ToggleSwitch
            checked={s.autoplay}
            onChange={(v) => setAppSetting('autoplay', v)}
          />
        </LabelRow>
        {/* Sets the DEFAULT new sessions boot with, and pushes it to the live
            transport so the change is felt now — the same pairing LabsMenuTop
            did, kept deliberately. The transport bar's inline field still edits
            the live value only. */}
        <LabelRow label="Loop length" align="center">
          <Dropdown
            options={LOOP_SECONDS.map((n) => ({ value: n, label: `${n} s` }))}
            value={s.defaultLoopSeconds}
            onChange={(n) => { setAppSetting('defaultLoopSeconds', n); transport.setLoopSeconds(n) }}
          />
        </LabelRow>
      </SettingsSection>

      <SettingsSection title="Keyboard Shortcuts">
        <SettingsShortcuts sections={sections} comboLabel={comboLabel} />
      </SettingsSection>
    </div>
  )
}

function AboutContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SettingsSection title="Effexor FXR">
        <div className="text-fg-48 kol-mono-14" style={{ maxWidth: 640 }}>A DOM/SVG design compositor — frames, layers, vector tools — with generative, kinetic-type and effects layers on the same engine, served through three chromes: the Editor, Labs, and the Randomiser. Ships as a standalone app and as the embeddable <code>@kolkrabbi/design-editor</code> library.</div>
      </SettingsSection>

      <SettingsColophon />
    </div>
  )
}

function RepoContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SettingsSection title="Links">
        <SettingsLinks links={[
          { label: 'GitHub', url: 'https://github.com/Tor-Grimsson/kol-fxr' },
          { label: 'Kolkrabbi', url: 'https://fxr.kolkrabbi.io' },
          { label: 'Vercel', url: 'https://vercel.com/tor-grimssons-projects/kol-fxr' },
        ]} />
      </SettingsSection>
    </div>
  )
}

export default function SettingsPage() {
  return (
    /* `header` spreads onto the scaffold's PageHeader (kol-shell 0.7.1, the
       PageHeaderMonoTitle round-trip); the h2 role is the DS's since 0.7.2. */
    <SettingsScaffold
      tabs={TABS}
      defaultTab="settings"
      header={{ size: 'sm', voice: 'mono' }}
      renderContent={(tab) => (
        <>
          {tab === 'settings' && <SettingsContent />}
          {tab === 'about' && <AboutContent />}
          {tab === 'repo' && <RepoContent />}
        </>
      )}
    />
  )
}
