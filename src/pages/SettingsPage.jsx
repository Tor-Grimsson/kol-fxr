import { useState } from 'react'
import { Divider, Dropdown, LabeledControlSection, ViewToggle } from '@kolkrabbi/kol-component'
import { ThemeToggle } from '@kolkrabbi/kol-framework'
import { useNavigate } from 'react-router-dom'
import { SettingsScaffold, SettingsShortcuts, SettingsLinks, SettingsColophon } from '@kolkrabbi/kol-shell'
import { useSettingsSections, AppSettingsSections, DisplaySettingsDrawer } from '../settings/AppSettings'
import { shortcutsBySection, comboLabel } from '../editor/state/keymap'
import { currentView } from '../editor/mode'

/**
 * SettingsPage — ONE settings page, at `/settings`: Display · Defaults ·
 * Transport · Keyboard Shortcuts, plus About and Repo.
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
 * IT IS `SettingsScaffold` SINCE 2026-08-30 (kol-shell 0.21.0/0.22.0). This
 * page hand-built `PageShell → PageHeader → ContentFilters → body` because the
 * scaffold carried its own third header shape; it was filed as
 * `SettingsScaffoldFromFxrPage`, the user ruled this render correct, and the
 * scaffold was rebuilt FROM it. So the shape came home — we are the reference
 * and now also the first consumer, which makes this page the scaffold's first
 * screen check (no repo had rendered it).
 *
 * THE HEADER IS `ContentFilters`, THE ACTUAL ORGANISM (user, 2026-08-28: "2
 * different content filters in settings and effexor home why"). It was briefly
 * hand-written here to that grammar, which is how a second one happened: the
 * organism's search is `size="md" iconSize={16} fieldHeight={28}` and a copy
 * that passes none of those renders a different pill in the same row on the
 * next page over. A row that looks like ContentFilters must BE ContentFilters.
 * The scaffold owns that row now — nothing here composes it.
 *
 * THE TWO-ROW SELECTOR IS THE SCAFFOLD'S TOO, since kol-shell 0.23.0. Our page
 * selector runs across BOTH strip rows — SETTINGS above the rule, ABOUT / REPO
 * below it (user, 2026-08-28) — writing ONE state. That briefly rode
 * `filtersProps`; it was filed as `SettingsScaffoldTabRows`, answered yes-it-is-
 * one-idiom, and returned as `row: 'layout'` on a `tabs` entry. So the override
 * is gone, `renderContent`'s `tab` argument is the truth, and the masthead
 * reads its title off the active tab instead of a local `HEADERS` map.
 *
 * It fits without stretching: the SETTINGS / ABOUT / REPO strip is the view
 * strip (the home page's RECENT / SAVED), the section names are one filter
 * group, and search reads a row's own label — so `loop`, `aspect` or `undo`
 * all land. `renderItem` gets the surviving rows and regroups them under their
 * section eyebrows.
 *
 * THE ROWS ARE NOT AUTHORED HERE. `settings/AppSettings.jsx` owns the sections
 * and the editor's drawer renders the same ones, so the page and the in-place
 * panel cannot drift the way the two topbar menus did.
 *
 * THE STORE DOES NOT MOVE. `lib/appSettings.js` still owns every value, its
 * versioned localStorage blob and its pub/sub.
 *
 * App theme is kol-framework's store (`useTheme` / `applyTheme`, key
 * `kol-theme`) — `editor/theme.js` is retired to `_tmp/` (2026-08-27). One
 * store means the DS `ThemeToggle` can sit here, as it does in monitor; the
 * boot script in index.html reads the framework's key.
 *
 * Shortcuts render read-only from `keymap.js`, which is what kol-shell's own
 * docstring asks for: feed ONE array to the settings page and the overlay so
 * the pair cannot drift. Scoped by `currentView()` — null on a shell page, so
 * the full map renders, which is the right answer for a settings page reached
 * from the rail rather than from an editor. Page-only: the drawer is for the
 * handful of switches you flip while working, not a reference sheet.
 */

const SHORTCUTS_SECTION = 'Shortcuts'

/* THE HEADER'S RIGHT CLUSTER — kol-r2b2's row 1, verbatim in shape (user,
   2026-08-28): a segmented icon toggle, then the sm controls beside it. Here it
   is the three CHROMES, the theme toggle, and a gear back to the editor's
   drawer. It replaces the old SETTINGS / ABOUT / REPO text strip up here —
   About and Repo moved down to the smaller row. */
const CHROMES = [
  { value: '', label: 'Open a chrome' },
  { value: 'editor', label: 'Editor' },
  { value: 'labs', label: 'Labs' },
  { value: 'randomiser', label: 'Randomiser' },
]

/* THE PAGE SELECTOR — one set of destinations across two rows, which is what
   `row` says (kol-shell 0.23.0, `SettingsScaffoldTabRows`, filed from here).
   SETTINGS sits above the rule; ABOUT and REPO below it, where the user ruled
   the two side pages on 2026-08-28. Both strips read and write the scaffold's
   ONE `tab`, so `renderContent`'s first argument is the truth and the masthead
   reads `title`/`subtitle` off whichever entry is rendering — no local mirror,
   no `filtersProps` override, no `HEADERS` map. */
const TABS = [
  { value: 'settings', label: 'SETTINGS', title: 'Settings', subtitle: 'Configuration and preferences' },
  { value: 'about', label: 'ABOUT', row: 'layout', title: 'About', subtitle: 'Effexor FXR by Kolkrabbi' },
  { value: 'repo', label: 'REPO', row: 'layout', title: 'Repo', subtitle: 'Source and deployments' },
]

/* The SMALLER strip, below the rule — the home page's LIST / GRID slot
   (`layoutOptions`, `kol-helper-12`). It splits the Settings tab's body:
   the controls, or the shortcut sheet. They are different KINDS of thing —
   one you operate, one you read — so they do not belong stacked in one
   scroll, and this is the row the estate already uses to say "same page,
   other view". It STAYS on About and Repo too (user, 2026-08-28) — the row is
   the page's furniture, and hiding it there made the header jump by a line
   every time you left Settings. Picking either one returns you to Settings —
   through the `(tab, setTab)` render prop `trailingActions` takes since
   kol-shell 0.24.0. */
/* …and the two SETTINGS views are now the icon pair beside them, the shape
   kol-r2b2's row 2 uses for its list/column pair. */
const LAYOUTS = [
  { value: 'options', label: 'OPTIONS', icon: 'slider-01' },
  { value: 'shortcuts', label: 'SHORTCUTS', icon: 'view-list' },
]

function AboutContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <LabeledControlSection label="Effexor FXR">
        <div className="text-fg-48 kol-mono-14" style={{ maxWidth: 640 }}>A DOM/SVG design compositor — frames, layers, vector tools — with generative, kinetic-type and effects layers on the same engine, served through three chromes: the Editor, Labs, and the Randomiser. Ships as a standalone app and as the embeddable <code>@kolkrabbi/design-editor</code> library.</div>
      </LabeledControlSection>

      <SettingsColophon />
    </div>
  )
}

function RepoContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <LabeledControlSection label="Links">
        <SettingsLinks links={[
          { label: 'GitHub', url: 'https://github.com/Tor-Grimsson/kol-fxr' },
          { label: 'Kolkrabbi', url: 'https://fxr.kolkrabbi.io' },
          { label: 'Vercel', url: 'https://vercel.com/tor-grimssons-projects/kol-fxr' },
        ]} />
      </LabeledControlSection>
    </div>
  )
}

export default function SettingsPage() {
  /* The text strips pick the PAGE (settings · about · repo) and that state is
     the SCAFFOLD's since kol-shell 0.23.0 — this page holds only which settings
     view the icon pair is showing (options · shortcuts). */
  const [settingsView, setSettingsView] = useState('options')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const sections = useSettingsSections()

  /* ONE FLAT ITEM LIST for the organism to filter. A setting row carries its
     section so the chips group it; a shortcut carries `group` (its own EDIT /
     LAYER / VIEW heading) under the one `Keyboard Shortcuts` section, so the
     chip row stays four wide instead of eight. */
  const shortcutSections = shortcutsBySection(currentView())
  const items = [
    ...sections.flatMap((sec) => sec.rows.map((row) => ({
      id: `${sec.label}:${row.label}`, kind: 'setting', label: row.label, section: sec.label, row,
    }))),
    ...shortcutSections.flatMap((sec) => sec.items.map((k) => ({
      id: `shortcut:${k.id}`, kind: 'shortcut', label: k.label, section: SHORTCUTS_SECTION, group: sec.section, k,
    }))),
  ]

  const FILTER_GROUPS = [{
    label: 'Section',
    key: 'section',
    values: [...sections.map((s) => s.label), SHORTCUTS_SECTION],
  }]

  /* Regroup what survived, in the sections' own order — a section with nothing
     left renders neither its eyebrow nor its block. `mode` is the below-rule
     strip: the controls, or the shortcut sheet. */
  const renderSettings = (filtered, mode) => {
    const settingRows = filtered.filter((i) => i.kind === 'setting')
    const shortcuts = filtered.filter((i) => i.kind === 'shortcut')
    const liveSections = sections
      .map((sec) => ({ ...sec, rows: settingRows.filter((i) => i.section === sec.label).map((i) => i.row) }))
      .filter((sec) => sec.rows.length > 0)
    const liveShortcuts = shortcutSections
      .map((sec) => ({ ...sec, items: shortcuts.filter((i) => i.group === sec.section).map((i) => i.k) }))
      .filter((sec) => sec.items.length > 0)

    /* The rows are a 160px label column + a control, sized for the drawer's
       380. Unbounded on a page the control stretches the full width, so the
       options column is capped; the shortcut grid wants the whole page. */
    if (mode === 'shortcuts') {
      return <SettingsShortcuts sections={liveShortcuts} comboLabel={comboLabel} />
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 268 }}>
        <AppSettingsSections sections={liveSections} divided={false} />
      </div>
    )
  }

  return (
    <>
    <SettingsScaffold
      /* `tabs` carries every destination AND its masthead copy; `row: 'layout'`
         puts ABOUT and REPO below the rule. The scaffold owns the state. */
      tabs={TABS}
      defaultTab="settings"
      /* `size="sm"` + `voice="mono"` is the app tier's masthead
         (PageHeaderMonoTitle, the kol-fxr round-trip) — the same one the home
         page wears above its filter row. Title and subtitle come off the active
         tab now, so `header` carries only what is constant. */
      header={{ size: 'sm', voice: 'mono' }}
      /* THE MASTHEAD CLUSTER IS THE SCAFFOLD'S since kol-shell 0.27.0 — order,
         gap, tone and the gear are its rules, off this page's approved render.
         Only the picker's CONTENTS are ours: three chromes where kol-r2b2's row
         1 has buckets. `tone="sunken"` because the page wears a wash and the
         control sits BELOW its plane. The hand-built `header.actions` div this
         replaced is gone, along with the local `IconFrame`. */
      picker={
        <Dropdown
          className="w-40"
          tone="sunken"
          options={CHROMES}
          value=""
          onChange={(v) => navigate(`/${v}`)}
          aria-label="Open a chrome"
        />
      }
      themeToggle={<ThemeToggle fill="none" tone="sunken" label={false} size="sm" />}
      onOpenSettings={() => setDrawerOpen(true)}
      /* `sunken` is the scaffold's default and `Preferences` its default title;
         both are stated anyway — this page is where they were ruled. */
      tone="sunken"
      title="Preferences"
      items={items}
      filterGroups={FILTER_GROUPS}
      searchKeys={['label', 'section', 'group']}
      /* The icon pair rides the row's trailing slot, above the rule. As a
         FUNCTION (kol-shell 0.24.0, `SettingsScaffoldTabFromTrailing`, filed
         from here): a node cannot reach state the scaffold owns, so picking
         OPTIONS or SHORTCUTS from About or Repo had stopped returning you to
         Settings. `setTab` is the seam that brings that back. */
      trailingActions={(tab, setTab) => (
        <>
          <ViewToggle
            variant="icon"
            size="sm"
            tone="sunken"
            options={LAYOUTS}
            viewMode={settingsView}
            onViewChange={(v) => { setSettingsView(v); setTab('settings') }}
          />
          <Divider variant="vertical" />
        </>
      )}
      /* `tab` is the scaffold's, and it is the truth — no override, no mirror. */
      renderContent={(tab, filtered) => (
        <>
          {tab === 'settings' && renderSettings(filtered, settingsView)}
          {tab === 'about' && <AboutContent />}
          {tab === 'repo' && <RepoContent />}
        </>
      )}
    />
    {/* The drawer is the page's OTHER HALF, not part of its body — a sibling of
        the scaffold, never inside the scrolling region it renders. */}
    <DisplaySettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
