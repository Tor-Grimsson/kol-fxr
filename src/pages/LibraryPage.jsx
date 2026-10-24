import { useMemo, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { EmptyState } from '@kolkrabbi/kol-component'
import { CHROMES, bytesOf, downloadFile } from '../components/FileCard'
import FileCover, { setUploadedCover } from '../editor/library/FileCover'
import { saveSpot, readSpot, writeSpot, useRestoreScroll } from '../editor/library/returnSpot'
import { listShipped, readShippedRaw, subscribeShipped, renameShipped, removeShipped } from '../editor/library/shipped'
import { CatalogPage, StudioDetail } from '@kolkrabbi/kol-shell'
import {
  GeneratorLibraryProvider,
  useGeneratorLibrary,
  LIBRARY_SLOT_KEYS,
} from '../index.jsx'

/**
 * LibraryPage — `/library`, WHAT FXR SHIPS, by chrome (plan home-library-detail-one-card § 2, user 2026-10-24:
 * *"each category in labs IS A CATEGORY … THESE ARE ALL SAVED PRESETS IN LABS"* · *"EVERY CARD HAS THE SAME FIELDS
 * AND ICONS"*). Home is the user's saves; the Library is the shipped files (`editor/library/shipped.js`), the view
 * strip the chromes — EDITOR · LABS · RANDOMISER · MORPH — landing on LABS, filtered by Group and Category.
 *
 * EDITOR also lists the user's Type · Palettes · Patterns saves (the provider's slots, plan 39) under a Kind group:
 * they are parts of editor files, not a view of their own, and do not open on a click.
 *
 * THE PROVIDER IS MOUNTED HERE and is the page's one reader and writer — this page is outside every chrome, so it
 * wraps itself. Its verbs re-render it; a write around it (libraryOps) would be overwritten by its next save.
 *
 * `/library/<chrome>/<id>` is a file's own page, on kol-shell's `StudioDetail`; Open lands in the chrome.
 */

const SLOT_LABELS = {
  preset: 'Presets',
  palette: 'Palettes',
  pattern: 'Patterns',
  type: 'Type',
}

/* Slot order is presentation, not the store's — Type first (user, 2026-08-27). The `preset` slot is files: the
   user's on Home, the shipped ones in the views below. */
const SLOT_ORDER = ['type', 'palette', 'pattern']

/* ponytail: the one check. SLOT_ORDER is hand-typed against the provider's
   SLOT_KEYS, so a fifth slot added there would silently never render a tab.
   Dev-only — a warn, not a throw; a missing tab is not worth a white screen. */
if (import.meta.env.DEV) {
  const missing = LIBRARY_SLOT_KEYS.filter((k) => k !== 'preset' && !SLOT_ORDER.includes(k))
  if (missing.length) console.warn('LibraryPage: slots with no tab —', missing)
}

/* A CHROME SAVE'S COVER (plan 39): a palette is its colours, a type save its own text in its face; a pattern keeps the
   placeholder until it carries a thumb. A shipped file is drawn from its engine (FileCover). */
const hexOf = (c) => (typeof c === 'string' ? c : c?.hex)
const coverOf = (item) => {
  /* a shipped file's cover is drawn on demand from the engine (FileCover) — never stored */
  if (item.shipped) return <FileCover file={item} />
  if (item.thumb) return item.thumb
  if (item.slot === 'palette' && item.colors?.length) {
    return <div className="size-full flex">{item.colors.map(hexOf).filter(Boolean).map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}</div>
  }
  if (item.slot === 'type' && item.text) {
    return <div className="size-full flex items-center justify-center p-4 text-[32px] leading-tight text-center text-emphasis overflow-hidden" style={{ fontFamily: item.family, fontWeight: item.weight, fontStyle: item.italic ? 'italic' : undefined }}>{item.text}</div>
  }
  return undefined
}

const VIEWS = ['editor', 'labs', 'randomiser', 'morph'].map((v) => ({ value: v, label: CHROMES[v].label.toUpperCase() }))

/* the cog's rail — every card the same rows */
const detailsOf = (item) => [
  ...(item.group ? [{ label: 'Group', value: item.group }] : []),
  ...(item.sub ? [{ label: 'Category', value: item.sub }] : []),
  ...(item.slot ? [{ label: 'Kind', value: item.kind }] : [{ label: 'Layers', value: item.layers?.length ?? 0 }, { label: 'Aspect', value: item.aspect ?? '1:1' }]),
  ...(item.morph?.steps ? [{ label: 'Steps', value: item.morph.steps.length }] : []),
]

/* the filter groups a view has — Category only where its files carry one */
const filterGroupsOf = (items, view) => {
  const values = (key) => [...new Set(items.map((i) => i[key]).filter(Boolean))]
  return [
    ...(view === 'editor' ? [{ label: 'Kind', key: 'kind', stack: true, values: values('kind') }] : []),
    { label: 'Group', key: 'group', stack: view !== 'editor', values: values('group') },
    ...(values('sub').length ? [{ label: 'Category', key: 'sub', values: values('sub') }] : []),
  ]
}

function FilePage({ item, chrome, onDuplicate }) {
  const navigate = useNavigate()
  if (!item) return <StudioDetail notFound={{ title: 'File not found', subtitle: chrome }} />
  const label = CHROMES[chrome]?.label ?? 'Editor'
  const where = [item.group, item.sub].filter(Boolean).join(' › ')
  return (
    <StudioDetail
      back={{ onClick: () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/library')) }}
      title={item.name}
      subtitle={where ? `${label} — ${where}` : label}
      description={item.mode === 'morph'
        ? `A ${label} file: ${item.morph?.steps?.length ?? 0} steps of one generator, tweened.`
        : `A ${label} file of ${item.layers?.length ?? 0} ${item.layers?.length === 1 ? 'layer' : 'layers'}, shipped with FXR.`}
      sections={[
        { label: 'Specifications', rows: detailsOf(item).map((d) => ({ label: d.label, value: String(d.value) })) },
        ...(item.morph?.steps ? [{ label: 'Steps', rows: item.morph.steps.map((s, i) => ({ label: `${i + 1}`, value: s.presetLabel })) }] : []),
        ...(item.tags?.length ? [{ label: 'Tags', text: item.tags.join(', ') }] : []),
      ]}
      preview={<FileCover file={item} />}
      actions={[
        { label: 'Open', onClick: () => navigate(`/${chrome}?open=${encodeURIComponent(item.id)}`) },
        { label: 'Duplicate', onClick: onDuplicate },
      ]}
    />
  )
}

function LibraryBody() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { library, removeItem, renameItem, duplicateItem, addItem, setThumb } = useGeneratorLibrary()
  /* Back lands on the card (plan 40 § 2.2): the view is remembered for the tab, the scroll restored on a Back */
  const [view, setViewState] = useState(() => readSpot('library').view ?? 'labs')
  const setView = (v) => { writeSpot('library', { view: v }); setViewState(v) }
  useRestoreScroll('library', !/^\/library\/[^/]+\/[^/]+$/.test(pathname))
  /* ponytail: tags and notes are this session's until the library carries them (it has no write for either) */
  const [extra, setExtra] = useState({})
  const edit = (key, patch) => setExtra((x) => ({ ...x, [key]: { ...x[key], ...patch } }))

  /* the shipped files are built in memory (library/shipped.js); only this device's removals and renames are stored */
  const shippedRaw = useSyncExternalStore(subscribeShipped, readShippedRaw, () => null)
  const shipped = useMemo(() => listShipped(), [shippedRaw])
  /* Duplicate makes it the user's: a real save in the library, listed on Home */
  const copyShipped = (item) => {
    const { id: _id, shipped: _s, savedAt: _a, updatedAt: _u, ...spec } = item
    return addItem('preset', { ...spec, name: `${item.name} copy` })
  }
  const verbsOf = (item, slot) => (item.shipped
    ? { rename: (name) => renameShipped(item.id, name), duplicate: () => copyShipped(item), remove: () => removeShipped(item.id) }
    : { rename: (name) => renameItem(slot, item.id, name), duplicate: () => duplicateItem(slot, item.id), remove: () => removeItem(slot, item.id) })

  /* `/library/<chrome>/<id>` — a file's own page */
  const m = /^\/library\/(editor|labs|randomiser|morph)\/([^/]+)$/.exec(pathname)
  if (m) {
    const id = decodeURIComponent(m[2])
    const item = shipped.find((p) => p.id === id)
    return <FilePage item={item && { ...item, ...extra[id] }} chrome={m[1]} onDuplicate={() => item && copyShipped(item)} />
  }

  const slotSaves = view === 'editor'
    ? SLOT_ORDER.flatMap((slot) => (library[slot] ?? []).map((item) => ({ ...item, slot, kind: SLOT_LABELS[slot], mode: 'editor' })))
    : []
  const items = [
    ...shipped.filter((p) => p.mode === view).map((p) => ({ ...p, slot: null, kind: view === 'editor' ? 'Files' : null })),
    ...slotSaves,
  ].map((it) => ({ ...it, ...extra[`${it.slot ?? 'preset'}:${it.id}`] }))

  return (
    <>
    <CatalogPage
      /* a chip from one view must not survive into the next and filter everything out */
      key={view}
      header={{ title: 'Library', subtitle: 'Everything saved on this device.' }}
      items={items}
      filtersTitle={`All ${CHROMES[view].label}`}
      filterGroups={filterGroupsOf(items, view)}
      views={VIEWS}
      view={view}
      onViewChange={setView}
      /* THE ONE CARD (user 2026-10-24): title · date · size · cover with download · cog (the rail) · trash, the chrome
         as the cover's mark. A shipped file opens its page; a Type · Palette · Pattern save has no chrome to open in. */
      preset="app"
      toCard={(item) => {
        const slot = item.slot ?? 'preset'
        const key = `${slot}:${item.id}`
        return {
          key,
          title: item.name || `Untitled ${SLOT_LABELS[slot].slice(0, -1).toLowerCase()}`,
          date: item.updatedAt ?? item.savedAt,
          size: bytesOf(item),
          media: coverOf(item),
          mark: CHROMES[item.mode] ?? CHROMES.editor,
          details: detailsOf(item),
          tags: item.tags,
          onTags: (tags) => edit(key, { tags }),
          note: item.note,
          onNote: (note) => edit(key, { note }),
          /* Upload image on EVERY file (user: every card the same fields) — a shipped file's upload goes on the covers
             shelf in IndexedDB (FileCover), a save's into its `thumb` as before */
          onCover: (src) => (item.shipped ? setUploadedCover(item.id, src) : setThumb(slot, item.id, src)),
          verbs: verbsOf(item, slot),
          download: () => downloadFile(item),
          ...(item.slot ? {} : { onClick: () => { saveSpot('library'); navigate(`/library/${item.mode}/${encodeURIComponent(item.id)}`) } }),
        }
      }}
    />
    {/* the empty state the page had none of (audit A6) — the header and its strip stay above it */}
    {items.length === 0 && (
      <EmptyState className="px-6" eyebrow="Library" title="Nothing saved yet" body="Save… in any chrome keeps a file here. Signed in, it syncs to the cloud library." />
    )}
    </>
  )
}

export default function LibraryPage() {
  return (
    <GeneratorLibraryProvider>
      <LibraryBody />
    </GeneratorLibraryProvider>
  )
}
