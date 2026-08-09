import Editor from './editor/Editor'
import OutputView from './editor/OutputView'
import LabsView from './editor/labs/LabsView'
import ModeChooser from './editor/ModeChooser'
import MobileView from './editor/mobile/MobileView'
import { isMobileDevice, wantsDesktop, setWantsDesktop } from './editor/mobile/device'
import { getMode, modeById } from './editor/mode'

// Standalone editor host. `?view=output` opens the chromeless OutputView (a
// clean full-screen recording surface in its own tab); `?view=desktop` /
// `?view=labs` / `?view=mobile` force a chrome (mobile also clears the
// tablet's persisted desktop opt-in — the way back).
//
// With no `?view=`: touch-primary devices still get the generative MobileView
// natively, and everything else opens the remembered mode — or the
// ModeChooser on a first visit (plan.md Phase 11.5). Still no router.
const CHROMES = {
  editor: Editor,
  labs: LabsView,
  randomiser: MobileView,
}

export default function App() {
  const view = new URLSearchParams(window.location.search).get('view')
  if (view === 'output') return <OutputView />
  if (view === 'desktop') return <Editor />
  if (view === 'labs') return <LabsView />
  if (view === 'mobile') {
    setWantsDesktop(false)
    return <MobileView />
  }
  if (isMobileDevice() && !wantsDesktop()) return <MobileView />
  const mode = modeById(getMode())
  if (!mode) return <ModeChooser />
  const Chrome = CHROMES[mode.id] ?? Editor
  return <Chrome />
}
