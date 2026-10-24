import { ContentCard, ContentRow, SectionText } from '@kolkrabbi/kol-component'
import { loopDefaults } from '../loops/contract.js'
import obstacleFlow from '../loops/flow/obstacleFlow.js'
import voronoiPulse from '../loops/flow/voronoiPulse.js'
import letterGap from '../loops/flow/letterGap.js'

/**
 * DevCards — the Dev page's Cards tab (plan 37 § 1.1): every state a saved-file card can be in on
 * Home, on the same DS `app` card and row Home passes (kol-component `variant="app"`), so a card fix
 * shows here first. The verbs are inert — nothing here writes the library.
 *
 * THE DEV PAGE IS THE USER'S AND STAYS, EVEN EMPTY (user, 2026-10-23: *"I told you to put it in EVEN IF
 * ITS EMPTY ITS MY TAB"*). It was retired to `_tmp/` in plan 37 and restored the same week. Never retire it.
 */

const fmtDate = (ms) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const inert = { rename: () => {}, duplicate: () => {}, remove: () => {} }
const detailOf = (f) => `${f.layers?.length ?? 0} layers · ${f.aspect ?? '1:1'} · ${fmtDate(f.updatedAt ?? f.savedAt ?? Date.now())}`

/* SAMPLE FILES WITH REAL OUTPUT (the user: *"how am I looking at this without a fucking image"*): three
   FXR generators drawn at one frame into a thumbnail, the way a save's `thumb` would look. */
function outputThumb(loop, params = {}, u = 0.3) {
  const c = document.createElement('canvas')
  c.width = 240; c.height = 300
  try { loop.draw(c.getContext('2d'), u, 240, 300, { ...loopDefaults(loop), ...params }) } catch { return undefined }
  return c.toDataURL('image/webp', 0.85)
}
let SAMPLES = null
function samples() {
  SAMPLES ??= [
    { id: 'dev-a', name: 'Obstacle flow', layers: [{}], aspect: '4:5', savedAt: Date.now(), thumb: outputThumb(obstacleFlow) },
    { id: 'dev-b', name: 'Voronoi pulse', layers: [{}, {}], aspect: '4:5', savedAt: Date.now() - 864e5, thumb: outputThumb(voronoiPulse) },
    { id: 'dev-c', name: 'Morph W 1791484577796 - a name far longer than the card', layers: [{}], aspect: '4:5', savedAt: Date.now() - 2 * 864e5, thumb: outputThumb(letterGap) },
  ]
  return SAMPLES
}

const Grid = ({ children }) => <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">{children}</div>

/* a section of the Dev page: the DS's content-level header (DevSectionHeader → `SectionText level="content"`,
   kol-component 0.285.0) over its body */
function Section({ eyebrow, title, note, children }) {
  return (
    <section>
      <SectionText level="content" eyebrow={eyebrow} headline={title} body={note} />
      {children}
    </section>
  )
}

const homeCard = (f) => ({
  variant: 'app',
  title: f.name || 'Untitled preset',
  date: f.updatedAt ?? f.savedAt,
  size: new Blob([JSON.stringify(f)]).size,
  media: f.thumb,
  verbs: inert,
  download: () => {},
})

export default function DevCards() {
  const files = [...samples(), { id: 'dev-d', name: 'No cover yet', layers: [{}], aspect: '4:5', savedAt: Date.now() - 3 * 864e5 }]
  return (
    <div className="flex flex-col gap-12 pb-24">
      <Section eyebrow="Home" title="Grid — app" note="What Home renders today: cover · long name · no cover (placeholder until it opens, plan 39 § 3.1).">
        <Grid>{files.map((f) => <ContentCard key={f.id} {...homeCard(f)} />)}</Grid>
      </Section>

      <Section eyebrow="Home" title="List">
        <div className="flex flex-col gap-2">{files.map((f) => <ContentRow key={f.id} {...homeCard(f)} />)}</div>
      </Section>
    </div>
  )
}
