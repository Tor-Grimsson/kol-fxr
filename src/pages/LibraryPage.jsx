import { useState } from 'react'
import { Button, EmptyState, usePlaceholders } from '@kolkrabbi/kol-component'
import { bytesOf, downloadFile } from '../components/FileCard'
import { CatalogPage } from '@kolkrabbi/kol-shell'
import { openNewFile } from '../components/NewFileDialog'
import {
  GeneratorLibraryProvider,
  useGeneratorLibrary,
  LIBRARY_SLOT_KEYS,
} from '../index.jsx'

/**
 * LibraryPage — `/library`, on kol-shell's `CatalogPage` (ShellHomeSystem,
 * shipped 2026-08-27 from this repo's own hand-rolled version): one pooled list
 * of the four saved slots, each slot a FILTER GROUP with its own tag chips,
 * RECENT / SAVED in the header, LIST / GRID below.
 *
 * It surfaces the store that already existed: `LibraryProvider`'s four
 * localStorage slots (palette · pattern · type · preset). See
 * `docs/documentation/11-persistence/03-saved-library.md`. NOT the CDN media
 * library (`editor/library/mediaLibrary.js`).
 *
 * THE PROVIDER IS MOUNTED HERE. `Editor.jsx` mounts its own inside the compose
 * stack; this page is outside every chrome, so it wraps itself.
 *
 * Your files (the `preset` slot) list on Home, not here (plan 39). Palettes, patterns and type have no
 * chrome of their own and do not open on a click. Rename · duplicate · delete
 * are store work, on the cog, the trash and right-click (the approved file card, 2026-10-22).
 */

const SLOT_LABELS = {
  preset: 'Presets',
  palette: 'Palettes',
  pattern: 'Patterns',
  type: 'Type',
}

/* Slot order is presentation, not the store's — Type first (user, 2026-08-27). The `preset` slot is your
   FILES and lists on Home, not here (plan 39, user 2026-10-23: *"Library is saved presets … you can set
   different chrome saves in library that you wouldnt in USER HOME"*) — Library is the chrome saves. */
const SLOT_ORDER = ['type', 'palette', 'pattern']

/* ponytail: the one check. SLOT_ORDER is hand-typed against the provider's
   SLOT_KEYS, so a fifth slot added there would silently never render a tab.
   Dev-only — a warn, not a throw; a missing tab is not worth a white screen. */
if (import.meta.env.DEV) {
  const missing = LIBRARY_SLOT_KEYS.filter((k) => k !== 'preset' && !SLOT_ORDER.includes(k))
  if (missing.length) console.warn('LibraryPage: slots with no tab —', missing)
}


/* Display-only stand-ins for an empty slot (user, 2026-08-27) — never written
   to the store, no Delete, so the page has a body before anything is saved. */
/* placeholder TAG counts per group — 3 · 8 · 16 · 8 in SLOT_ORDER (user, 2026-08-27);
   one item per tag, so every chip has something behind it */
const PLACEHOLDER_TAGS = { type: 3, preset: 8, palette: 16, pattern: 8 }
const placeholdersFor = (slot) => Array.from({ length: PLACEHOLDER_TAGS[slot] ?? 6 }, (_, i) => ({
  id: `${slot}-placeholder-${i + 1}`,
  name: `Placeholder ${i + 1}`,
  slot,
  placeholder: true,
  tag: `Placeholder ${i + 1}`,
}))

/* EACH CATEGORY IS A FILTER GROUP with its own tag chips (user, 2026-08-27):
   the group key is the slot, the chip value is the item's own field. */
const tagOf = (slot, item) => {
  if (item.placeholder) return item.tag
  if (slot === 'preset') return item.aspect ?? '1:1'
  if (slot === 'palette') return `${item.colors?.length ?? 0} colors`
  if (slot === 'pattern') return item.shapeId ?? 'Pattern'
  return item.family ?? 'Type'
}

/* A CHROME SAVE'S COVER (plan 39): a palette is its colours, a type save its own text in its face; a pattern keeps the
   placeholder until it carries a thumb */
const hexOf = (c) => (typeof c === 'string' ? c : c?.hex)
const coverOf = (item) => {
  if (item.thumb) return item.thumb
  if (item.slot === 'palette' && item.colors?.length) {
    return <div className="size-full flex">{item.colors.map(hexOf).filter(Boolean).map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}</div>
  }
  if (item.slot === 'type' && item.text) {
    return <div className="size-full flex items-center justify-center p-4 text-[32px] leading-tight text-center text-emphasis overflow-hidden" style={{ fontFamily: item.family, fontWeight: item.weight, fontStyle: item.italic ? 'italic' : undefined }}>{item.text}</div>
  }
  return undefined
}

const VIEWS = [
  { value: 'recent', label: 'RECENT' },
  { value: 'saved', label: 'SAVED' },
]


function LibraryBody() {
  const { library, removeItem, renameItem, duplicateItem } = useGeneratorLibrary()
  /* the provider's verbs for one item — the DS `app` card asks before it acts */
  const verbsFor = (item) => ({
    rename: (name) => renameItem(item.slot, item.id, name),
    duplicate: () => duplicateItem(item.slot, item.id),
    remove: () => removeItem(item.slot, item.id),
  })
  const [view, setView] = useState('recent')

  /* placeholders only while the library holds NOTHING real (plan 08) — once anything is saved, an
     empty slot is just empty, not 16 fake cards burying the real ones */
  const anyReal = SLOT_ORDER.some((slot) => (library[slot] ?? []).length > 0)
  /* …and only while the DS's placeholder switch is ON (`I`-era `toggle-hints`, now ⇧I): off — the
     default — an empty library is an empty state, not seventy stand-ins a signed-out user reads as
     real (audit A6, 2026-10-09). The stand-ins keep the 2026-08-27 shape for whoever switches them on. */
  const { shown: placeholdersOn } = usePlaceholders()
  const pooled = SLOT_ORDER.flatMap((slot) => {
    const saved = library[slot] ?? []
    return (saved.length ? saved.map((item) => ({ ...item, slot })) : (anyReal || !placeholdersOn) ? [] : placeholdersFor(slot))
      .map((item) => ({ ...item, [slot]: tagOf(slot, item) }))
  })
  /* RECENT = newest first; SAVED = store order */
  const items = view === 'recent' ? [...pooled].sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0)) : pooled
  /* THE PRINTS SHAPE (user, 2026-08-27, kol-website /prints): the FIRST group
     hugs its chips — narrow — and every group after it flows across the rest
     of the row. Pinned explicitly so chip counts never change the shape. */
  const filterGroups = SLOT_ORDER.map((slot, i) => ({
    label: SLOT_LABELS[slot],
    key: slot,
    stack: i === 0,
    values: [...new Set(pooled.filter((i) => i.slot === slot).map((i) => i[slot]))],
  }))

  return (
    <>
    <CatalogPage
      header={{ title: 'Library', subtitle: 'Everything saved on this device.', size: 'sm', voice: 'mono' }}
      items={items}
      filtersTitle="All Saved"
      filterGroups={filterGroups}
      views={VIEWS}
      view={view}
      onViewChange={setView}
      /* THE APPROVED FILE CARD (2026-10-22), the DS's since 0.291.0 (CatalogAppVariant): `preset="app"`
         draws download on the cover, the size, cog over trash and the one menu on right-click. Nothing here
         opens on a click — palettes, patterns and type have no chrome to open in. */
      preset="app"
      toCard={(item) => {
        if (item.placeholder) return { key: item.id, title: item.name, detail: 'Placeholder' }
        return {
          key: item.id,
          title: item.name || `Untitled ${SLOT_LABELS[item.slot].slice(0, -1).toLowerCase()}`,
          date: item.updatedAt ?? item.savedAt,
          size: bytesOf(item),
          media: coverOf(item),
          verbs: verbsFor(item),
          download: () => downloadFile(item),
        }
      }}
      actions={
        <Button tone="grey" size="md" onClick={openNewFile}>New File</Button>
      }
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
