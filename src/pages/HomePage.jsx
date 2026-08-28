import { useState } from 'react'
import { Button } from '@kolkrabbi/kol-component'
import { CatalogPage } from '@kolkrabbi/kol-shell'
import { useNavigate } from 'react-router-dom'
import { MODES, setMode, withView } from '../editor/mode'
import { GeneratorLibraryProvider, useGeneratorLibrary } from '../editor/library/LibraryProvider'

/**
 * HomePage — the front door, at `/`, on kol-shell's `CatalogPage` (ShellHomeSystem,
 * shipped 2026-08-27 from this repo's own hand-rolled version). RECENT = the three
 * chromes, the starting points; SAVED = the library's saved presets (monitor: the
 * empty rack vs all presets). Library and Settings are rail destinations, not rows.
 *
 * Standalone app only. The embedded `<DesignEditor />` boots the editor directly
 * from `src/index.jsx` and never sees the router at all.
 */

/* `name`/`title` are what the page's search reads. Card media = a photo of the
   chrome (`public/previews/chromes/<id>.png`). */
const CHROMES = MODES.map((m) => ({ name: m.id, title: m.label, detail: m.blurb }))

const fmtDate = (ms) =>
  new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

const VIEWS = [
  { value: 'recent', label: 'RECENT' },
  { value: 'saved', label: 'SAVED' },
]

/* ponytail: placeholder steps — monitor's five-step tour has no fxr copy yet. */
const WALKTHROUGH_STEPS = [
  { title: '1. Pick a chrome', text: ['Placeholder.'] },
  { title: 'Get Started', actions: true },
]

function HomeBody() {
  const { library } = useGeneratorLibrary()
  const [view, setView] = useState('recent')
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const navigate = useNavigate()

  /* Saved presets have no load path outside the editor (LibraryPage's ruling),
     so their cards are static — the library page is where they are managed. */
  const saved = (library.preset ?? []).map((p) => ({
    name: p.id,
    title: p.name || 'Untitled preset',
    detail: `${p.layers?.length ?? 0} layers · ${p.aspect ?? '1:1'} · ${fmtDate(p.savedAt)}`,
  }))
  const items = view === 'recent' ? CHROMES : saved

  /* Remember the pick, then leave for the chrome. */
  const enter = (id) => { setMode(id); navigate(withView(id)) }

  return (
    <CatalogPage
      header={{ title: 'Effexor FXR', subtitle: 'Pick a chrome. All three run the same engine.', size: 'sm', voice: 'mono' }}
      items={items}
      filtersTitle="All Chromes"
      views={VIEWS}
      view={view}
      onViewChange={setView}
      toCard={(c, { view: v }) => ({
        key: c.name,
        title: c.title,
        detail: c.detail,
        media: v === 'recent' ? <img src={`/previews/chromes/${c.name}.png`} alt={c.title} /> : undefined,
        onClick: v === 'recent' ? () => enter(c.name) : undefined,
      })}
      walkthrough={{
        open: showWalkthrough,
        steps: WALKTHROUGH_STEPS.map((s) => s.actions
          ? { ...s, actions: <Button variant="grey" size="md" onClick={() => { setShowWalkthrough(false); enter('editor') }}>Open Editor</Button> }
          : s),
      }}
      actions={
        <>
          {/* ponytail: New File is a placeholder — the editor has no "new document"
              door outside its own File menu yet; wire it when one exists. */}
          <Button variant="grey" size="md" onClick={() => {}}>New File</Button>
          <Button variant="grey" size="md" onClick={() => setShowWalkthrough(!showWalkthrough)}>
            {showWalkthrough ? 'Close' : 'Walkthrough'}
          </Button>
        </>
      }
    />
  )
}

export default function HomePage() {
  return (
    <GeneratorLibraryProvider>
      <HomeBody />
    </GeneratorLibraryProvider>
  )
}
