import { useState } from 'react'
import { Button } from '@kolkrabbi/kol-component'
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
 * NO LOAD ACTION, deliberately. Loading a preset is `loadPreset` on compose
 * state, which exists only inside the editor. Delete is here because removal
 * is pure store work.
 */

const SLOT_LABELS = {
  preset: 'Presets',
  palette: 'Palettes',
  pattern: 'Patterns',
  type: 'Type',
}

/* Slot order is presentation, not the store's — Type first (user, 2026-08-27). */
const SLOT_ORDER = ['type', 'preset', 'palette', 'pattern']

/* ponytail: the one check. SLOT_ORDER is hand-typed against the provider's
   SLOT_KEYS, so a fifth slot added there would silently never render a tab.
   Dev-only — a warn, not a throw; a missing tab is not worth a white screen. */
if (import.meta.env.DEV) {
  const missing = LIBRARY_SLOT_KEYS.filter((k) => !SLOT_ORDER.includes(k))
  if (missing.length) console.warn('LibraryPage: slots with no tab —', missing)
}

const fmtDate = (ms) =>
  new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

/* Every slot's items carry `{ id, savedAt, name? }`; only the spec differs, so
   one row shape covers all four and the detail line is the one slot-aware
   bit — a count that means something different per slot. */
function itemDetail(slot, item) {
  if (slot === 'preset') return `${item.layers?.length ?? 0} layers · ${item.aspect ?? '1:1'}`
  if (slot === 'palette') return `${item.colors?.length ?? 0} colors`
  if (slot === 'pattern') return `${item.shapeId} · ${item.cols}×${item.rows}`
  return item.text?.slice(0, 40) || 'Untitled'
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

const VIEWS = [
  { value: 'recent', label: 'RECENT' },
  { value: 'saved', label: 'SAVED' },
]
/* card media: the three chrome previews from Home, cycled (user, 2026-08-27) */
const PREVIEWS = ['editor', 'labs', 'randomiser']


function LibraryBody() {
  const { library, removeItem } = useGeneratorLibrary()
  const [view, setView] = useState('recent')

  /* placeholders only while the library holds NOTHING real (plan 08) — once anything is saved, an
     empty slot is just empty, not 16 fake cards burying the real ones */
  const anyReal = SLOT_ORDER.some((slot) => (library[slot] ?? []).length > 0)
  const pooled = SLOT_ORDER.flatMap((slot) => {
    const saved = library[slot] ?? []
    return (saved.length ? saved.map((item) => ({ ...item, slot })) : anyReal ? [] : placeholdersFor(slot))
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
    <CatalogPage
      header={{ title: 'Library', subtitle: 'Everything saved on this device.', size: 'sm', voice: 'mono' }}
      items={items}
      filtersTitle="All Saved"
      filterGroups={filterGroups}
      views={VIEWS}
      view={view}
      onViewChange={setView}
      toCard={(item) => ({
        key: item.id,
        title: item.name || `Untitled ${SLOT_LABELS[item.slot].slice(0, -1).toLowerCase()}`,
        detail: item.placeholder ? 'Placeholder' : `${itemDetail(item.slot, item)} · ${fmtDate(item.savedAt)}`,
        media: <img src={`/previews/chromes/${PREVIEWS[items.indexOf(item) % PREVIEWS.length]}.png`} alt="" />,
        actions: item.placeholder ? undefined : (
          <Button
            tone="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); removeItem(item.slot, item.id) }}
          >
            Delete
          </Button>
        ),
      })}
      actions={
        <Button tone="grey" size="md" onClick={openNewFile}>New File</Button>
      }
    />
  )
}

export default function LibraryPage() {
  return (
    <GeneratorLibraryProvider>
      <LibraryBody />
    </GeneratorLibraryProvider>
  )
}
