import { useEffect, useState } from 'react'
import { ShortcutsOverlay as ShellShortcutsOverlay } from '@kolkrabbi/kol-shell'
import { comboLabel, shortcutsBySection } from '../state/keymap'
import { currentView } from '../mode'

/**
 * ShortcutsOverlay — the keymap cheat sheet.
 *
 * THE PANEL IS THE DESIGN SYSTEM'S (kol-shell 0.4.0). This file used to hand-
 * roll all 99 lines of it — own scrim, own Esc listener, own header, own grid.
 * It stayed local because the DS component took one FLAT array and this
 * keymap is grouped (Edit · Selection · Layer · Tools · View), so adopting it
 * would have dropped the grouping.
 *
 * That gap went to the lobby as `ShortcutsOverlaySections` rather than being
 * settled here — a consumer working around a DS component is the duplication
 * the lobby exists to end, and every other consumer gets the fix too.
 * kol-shell 0.4.0 detects `[{ section, items }]` and groups it.
 *
 * WHAT STAYS LOCAL, and why it should: the open STATE and the
 * `kol:show-shortcuts` window-event channel. The DS panel is display-only by
 * design — it takes `onClose` and renders — so ownership of when it is open
 * belongs to the app. The event channel also keeps this decoupled from the
 * canvas key handler: anything that wants the sheet dispatches the event.
 *
 * Esc is NOT handled here any more — the DS panel owns it, and a second
 * listener would just call `onClose` twice.
 *
 * SCOPED TO THE CHROME IT OPENS IN (2026-08-15). `keymap.js` gained a `views:`
 * field, so standing in labs this sheet now shows `R → Reset to defaults`
 * (what `LabsParams`' own listener actually binds) instead of the editor's
 * `R → Rectangle tool`. It used to show the editor's answer everywhere.
 */
export default function ShortcutsOverlay() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    /* S TOGGLES (user ruling 2026-08-12): pressing it again closes. */
    const onShow = () => setOpen((o) => !o)
    const onClose = () => setOpen(false)
    window.addEventListener('kol:show-shortcuts', onShow)
    window.addEventListener('kol:close-shortcuts', onClose)
    return () => {
      window.removeEventListener('kol:show-shortcuts', onShow)
      window.removeEventListener('kol:close-shortcuts', onClose)
    }
  }, [])

  if (!open) return null

  /* The DS takes display strings; formatting a combo stays here, next to the
   * keymap that owns the binding. */
  const sections = shortcutsBySection(currentView()).map(({ section, items }) => ({
    section,
    items: items.map((s) => ({ label: s.label, combo: comboLabel(s.combo) })),
  }))

  return <ShellShortcutsOverlay shortcuts={sections} onClose={() => setOpen(false)} />
}
