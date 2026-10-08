// CORE entry — @kolkrabbi/design-editor/core (the cut, deconstruction T5, 2026-09-27).
// The editor with NO layer packs: canvas, document, the vector layer types (shape · path · bool ·
// text · group · photo · pattern), the clock, bindings, export. A host adds packs by importing
// their subpaths BEFORE it renders — `@kolkrabbi/design-editor/generators` · `/effects` ·
// `/motion` — each registers itself through the seam (editor/packs.js). The root entry
// (index.jsx) is this plus every pack plus the labs and mobile chromes: the full editor.
//
// CSS: index.lib.css, NOT the app's index.css — the app sheet ships Tailwind
// preflight + framework page chrome, which would restyle the HOST page when
// the built dist/design-editor.css is imported. The lib sheet scopes its
// resets under .kol-design-editor (the root class stamped below).
import './index.lib.css'
import Editor, { EditorProviders } from './editor/Editor'
import OutputView, { OutputCanvas, OutputStage } from './editor/OutputView'
import { useRailExtras, setRailExtras, RAIL_EXTRA_PREFIX } from './railExtras'
import FilesDialog from './editor/library/FilesDialog'
import { openFiles, closeFiles, useFilesDialog } from './editor/library/filesDialogStore'
import { setNavigator, VIEW_PATHS } from './editor/mode'
import { isMobileDevice, wantsDesktop, setWantsDesktop } from './editor/mobile/device'
import { MODES, setMode, withView, currentView } from './editor/mode'
import { GeneratorLibraryProvider, useGeneratorLibrary, LIBRARY_SLOT_KEYS, loadLibrary } from './editor/library/LibraryProvider'
import { shortcutsBySection, comboLabel } from './editor/state/keymap'
import { useSettingsSections, AppSettingsSections, DisplaySettingsDrawer } from './settings/AppSettings'
import { BRAND } from './brand/config'
import { setMediaProxyBase, setMediaClient } from './editor/library/mediaLibrary'
import { setSettingsStore } from './editor/lib/appSettings'
import { useEffect } from 'react'
import { useTheme } from '@kolkrabbi/kol-framework'

/**
 * <DesignEditor /> — the whole editor as one embeddable component.
 *
 * @param {object}  props
 * @param {string} [props.mediaProxyBase='/media/'] same-origin path the host
 *   proxies to https://media.kolkrabbi.io. Load-bearing for photo-filter and
 *   export paths: the CDN sends no CORS headers, so a cross-origin media load
 *   taints the canvas. Stand up a rewrite on your host (e.g. /media/* → the
 *   CDN) and pass its path here. Default assumes the host proxies `/media`.
 * @param {object} [props.mediaClient] a client in kol-media-client's shape
 *   (`listMedia` · `mediaUrl` · `proxied` · `buckets`) to browse instead of the
 *   Kolkrabbi CDN — the apps tier passes its fixture.
 * @param {object} [props.settingsStore] `{ load() → Promise, save(settings) }`
 *   — where the editor's preferences persist beyond this browser (a database
 *   row keyed by tool). Without it they stay in localStorage.
 */
export function DesignEditor({ mediaProxyBase, mediaClient, settingsStore } = {}) {
  // ponytail: module-global config knob, set at render — idempotent, runs
  // before children mount. A context/prop-drill would be pure ceremony here.
  if (mediaProxyBase != null) setMediaProxyBase(mediaProxyBase)
  if (mediaClient) setMediaClient(mediaClient)
  useEffect(() => {
    if (!settingsStore) return
    setSettingsStore(settingsStore)
    return () => setSettingsStore(null)
  }, [settingsStore])

  // Re-stamp a persisted theme choice on mount (the app does this pre-paint in
  // index.html; embeds have no boot script). kol-framework's useTheme does it
  // only when the host has NOT set data-theme itself — a fresh embed keeps the
  // host's theme untouched.
  useTheme()

  return (
    <div className="kol-design-editor">
      <Editor />
    </div>
  )
}

export default DesignEditor

/**
 * EditorProviders — the full context stack (error boundary + library > tool >
 * compose > palette > pattern > type) WITHOUT the compose chrome. Exported so
 * a host can mount its own chrome over the same engine: kol-fxr's labs view,
 * mobile view and chromeless output window each import exactly this and
 * nothing else (traced there 2026-09-03). Nesting order is load-bearing — see
 * `editor/Editor.jsx`.
 */
export { EditorProviders }

/**
 * OutputView — the chromeless output window over the same engine (OutputCanvas / OutputStage are
 * its parts, for a host that frames them itself). The labs and mobile chromes are pack-built, so
 * they ship from the root entry only.
 */
export { OutputView, OutputCanvas, OutputStage }

/**
 * THE HOST'S CONFIGURATION, for a chrome mounted WITHOUT `<DesignEditor />` (2026-09-29, found
 * mounting LabsView and MobileView in the apps tier): the three props `DesignEditor` takes are
 * module setters underneath, and only `DesignEditor` called them — so a host that routed straight
 * to `LabsView` or `MobileView` got the Kolkrabbi CDN behind a `/media/` proxy it never stood up,
 * and every picked image rendered empty. Call them once, before the chrome mounts; `DesignEditor`'s
 * props call the same three.
 */
export { setMediaClient, setMediaProxyBase, setSettingsStore }

/** Where the library syncs to (plan 07) — unset, the app is localStorage only and shows no Sign in. */
export { setLibraryApi, getLibraryApi, useLibrarySession, signInLibrary, signOutLibrary, UnauthorizedError } from './editor/library/libraryApi'
export { renameStored, duplicateStored, removeStored } from './editor/library/libraryOps'

/** The seam — a host's own pack registers through it exactly as the shipped ones do. */
export { registerPack } from './editor/packs'


/**
 * railExtras — the tiny external store labs PUBLISHES its category rows into
 * and the host's rail READS (ONE RAIL, user 2026-08-28: labs used to mount its
 * own SideNav). It moved in with labs and is exported so both ends read one
 * store — a host that kept its own copy would subscribe to a store labs never
 * writes to, the same two-copies failure as the contexts, one level down.
 * `RAIL_EXTRA_PREFIX` marks a row's path as a dispatch sentinel rather than a
 * route; the host's layout routes anything under it to `dispatch`.
 */
export { useRailExtras, setRailExtras, RAIL_EXTRA_PREFIX }

/* the files dialog — the component and the store the File surfaces open it
 * with, so a host can put `Files…` anywhere it likes */
export { FilesDialog, openFiles, closeFiles, useFilesDialog }

/**
 * The navigator bridge and the device gate — module-singleton state the HOST
 * must set on the package's copy, not its own (found on kol-fxr's step-3
 * adoption, 2026-09-03). `mode.js` keeps `let navigator = null`, set by
 * `setNavigator(fn)`; every in-package navigation (`goMode`, `goEditor`,
 * `goLabs`, `goRandomiser`, `goChooser`, `device.js`'s `goDesktop` /
 * `goMobile`) routes through it and FALLS BACK to `window.location.assign` —
 * so a host registering its router on a local copy got the right route via a
 * full page load, silently, with in-memory state gone. Same single-copy rule
 * as `railExtras` and the contexts. `VIEW_PATHS` is the route table the host
 * mounts; the device trio is the mobile gate the host's router reads.
 */
export { setNavigator, VIEW_PATHS, isMobileDevice, wantsDesktop, setWantsDesktop }

/**
 * What a HOST'S OWN PAGES reach for — found on kol-fxr's step-4 build with the
 * editor source moved out (2026-09-03): its home, library and settings pages
 * are the app's, and they read the editor's library store, its mode table,
 * its shortcut list and its settings sections. Exported rather than shimmed:
 * a host copying any of these would be back to two stores.
 *
 *   MODES · setMode · withView · currentView      the mode table and view router
 *   GeneratorLibraryProvider · useGeneratorLibrary · LIBRARY_SLOT_KEYS
 *                                                  the saved-generators library
 *   loadLibrary                                    the sanitised library, read fresh with
 *                                                  no provider — a Hub Home's SAVED set
 *                                                  (kol-fxr, 2026-10-07)
 *   shortcutsBySection · comboLabel               the keymap, for a cheat sheet
 *   useSettingsSections · AppSettingsSections · DisplaySettingsDrawer
 *                                                  the settings rows, defined once
 *   BRAND                                          the brand config a host's
 *                                                  page-title hook reads
 */
export {
  MODES, setMode, withView, currentView,
  GeneratorLibraryProvider, useGeneratorLibrary, LIBRARY_SLOT_KEYS, loadLibrary,
  shortcutsBySection, comboLabel,
  useSettingsSections, AppSettingsSections, DisplaySettingsDrawer,
  BRAND,
}
