import { MenuItem, MenuDropdownItem, MenuDropdownDivider, MenuDropdownNest } from '@kolkrabbi/kol-component'
import EditorIcon from '../icons/EditorIcon'
import { useThemeMode } from '../theme'
import { useAppSettings, setAppSetting } from '../lib/appSettings'
import { transport } from '../params/transport'
import { THEME_OPTIONS } from '../../loops/lib/themes'
import { ASPECTS } from '../shell/aspects'
import { goEditor, goRandomiser, goChooser } from '../mode'

/**
 * LabsMenuTop — labs mode's reduced topbar, swapped in through the shell's
 * `registry.topbar` seam (plan.md Phase 11.4).
 *
 *   [ Labs ]                                    [ Mode ▼ ]  [ Settings ▼ ]
 *
 * Everything the editor's MenuTop carries for COMPOSING (Generative / Effects
 * insert menus, File, Canvas, Templates, frame title) is gone: labs picks its
 * subject from the left nav, and its output is standardized. What's left is
 * the mode switch and the global settings that also apply here — the UI
 * theme, plus the two appSettings defaults that seed a labs layer.
 */
export default function LabsMenuTop() {
  const [themeMode, setThemeMode] = useThemeMode()
  const appSettings = useAppSettings()

  return (
    <div className="kol-editor-topbar flex items-center gap-3 px-4 h-12 border-b border-fg-08">
      <span className="kol-helper-12 text-emphasis">Labs</span>
      <div className="flex items-center gap-1 ml-auto">
        {/* panelClassName z-[1000]: MenuItem panels opt out of .kol-popover
            chrome and get no z-index of their own — see MenuTop. */}
        <MenuItem label="Mode" panelClassName="z-[1000]">
          <div className="py-1 w-52">
            <MenuDropdownItem onClick={goEditor}>Editor</MenuDropdownItem>
            <MenuDropdownItem onClick={goRandomiser}>Randomiser</MenuDropdownItem>
            <MenuDropdownDivider />
            <MenuDropdownItem onClick={goChooser}>Choose on next open</MenuDropdownItem>
          </div>
        </MenuItem>

        <MenuItem label="Settings" panelClassName="z-[1000]">
          <div className="py-1 w-56">
            <MenuDropdownNest label="Theme">
              {[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ].map((opt) => (
                <MenuDropdownItem
                  key={opt.value}
                  onClick={() => setThemeMode(opt.value)}
                  shortcut={themeMode === opt.value ? <EditorIcon name="check" size={11} /> : undefined}
                >
                  {opt.label}
                </MenuDropdownItem>
              ))}
            </MenuDropdownNest>
            <MenuDropdownDivider />
            {/* Global defaults (appSettings), same store the editor writes.
                Loop theme is the generative palette theme, NOT the UI theme. */}
            <MenuDropdownNest label="Default aspect">
              {ASPECTS.filter((a) => a.id !== 'custom').map((a) => (
                <MenuDropdownItem
                  key={a.id}
                  onClick={() => setAppSetting('defaultAspect', a.id)}
                  shortcut={appSettings.defaultAspect === a.id ? <EditorIcon name="check" size={11} /> : undefined}
                >
                  {a.label}
                </MenuDropdownItem>
              ))}
            </MenuDropdownNest>
            <MenuDropdownNest label="Loop theme">
              {THEME_OPTIONS.map((opt) => (
                <MenuDropdownItem
                  key={opt.value}
                  onClick={() => setAppSetting('defaultTheme', opt.value)}
                  shortcut={appSettings.defaultTheme === opt.value ? <EditorIcon name="check" size={11} /> : undefined}
                >
                  {opt.label}
                </MenuDropdownItem>
              ))}
            </MenuDropdownNest>
            {/* Transport default — the loop length new sessions boot with;
                the transport bar's inline field edits the LIVE value. */}
            <MenuDropdownNest label="Loop length">
              {[2, 4, 8, 12, 16].map((n) => (
                <MenuDropdownItem
                  key={n}
                  onClick={() => { setAppSetting('defaultLoopSeconds', n); transport.setLoopSeconds(n) }}
                  shortcut={appSettings.defaultLoopSeconds === n ? <EditorIcon name="check" size={11} /> : undefined}
                >
                  {n} s
                </MenuDropdownItem>
              ))}
            </MenuDropdownNest>
            <MenuDropdownDivider />
            {/* Bind dots in the labs rail — hidden by default, M toggles too. */}
            <MenuDropdownItem
              onClick={() => setAppSetting('labsModDots', !appSettings.labsModDots)}
              shortcut={appSettings.labsModDots ? <EditorIcon name="check" size={11} /> : 'M'}
            >
              Modulation dots
            </MenuDropdownItem>
          </div>
        </MenuItem>
      </div>
    </div>
  )
}
