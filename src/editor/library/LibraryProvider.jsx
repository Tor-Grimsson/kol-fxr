import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { mergeRemote } from './mergeRemote'
import { UnauthorizedError } from './libraryApi'

/**
 * Generator library — shared multi-asset store across the editor's modes.
 *
 * Each slot is an ARRAY of saved items. Save buttons append; clear can target
 * a single item or the whole slot. Items are versioned (`v: 1`) and carry an
 * `id` for stable React keys + targeted deletion.
 *
 *   library = {
 *     palette: [{ v:1, id, savedAt, ...spec }, ...],
 *     pattern: [...], type: [...], preset: [...]
 *   }
 *
 * Persisted to localStorage; cross-tab synced via the `storage` event.
 *
 * Migration history:
 *   v1 — single item per slot: `{ <slot>: { v:1, ...spec } | null }`
 *   v2 — multi-item slots: `{ palette, pattern, type, mark, layout, composition }`
 *   v3 — current. Slots collapse to `{ palette, pattern, type, preset }`.
 *        `preset` absorbs the legacy `layout` (Social-saved aspect+composition
 *        pointers) and `composition` (full-frame ComposeTopbar saves) slots.
 *        `mark` slot is dropped — logos are now a shape variant inside preset
 *        layer arrays. Layer-type strings within preset layers are renamed
 *        in the same pass: bg→background, image→photo, mark→shape (with
 *        kind: 'logo' added).
 */

const STORAGE_KEY = 'kol.editor.library.v3'

const SLOT_KEYS = ['palette', 'pattern', 'type', 'preset']

const EMPTY = SLOT_KEYS.reduce((acc, k) => { acc[k] = []; return acc }, {})

let nextItemId = 1
const newItemId = () => `i${Date.now().toString(36)}-${nextItemId++}`

const wrapItem = (raw) => ({
  ...raw,
  id:      raw.id ?? newItemId(),
  savedAt: raw.savedAt ?? Date.now(),
})

/* ── Per-slot validators ──────────────────────────────────────────────
 *
 * Save sites can drift — `library.pattern` historically held three
 * different shapes (pattern-mode, compose-pattern-layer save, type-lab
 * "Save SVG to library" sentinel). Validators normalize spec fields at
 * the `addItem` boundary AND filter on load so badly-shaped legacy
 * entries get dropped. Returning `null` rejects the spec entirely
 * (logged in dev). Envelope fields (`v`, `id`, `savedAt`, `updatedAt`,
 * `name`) are preserved separately by `addItem` / `sanitizeLoaded`.
 *
 * Type-lab's `shapeId: 'type-composition'` sentinel never resolved to a
 * renderable pattern shape (`getShapeSvg` returned null) — those
 * entries are explicitly rejected.
 */

const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v)

function validatePalette(spec) {
  if (!spec || !Array.isArray(spec.colors) || spec.colors.length === 0) return null
  return {
    colors:    spec.colors,
    bgEnabled: !!spec.bgEnabled,
    poolId:    spec.poolId ?? 'brand',
    modeId:    spec.modeId ?? 'random',
  }
}

function validatePattern(spec) {
  if (!spec) return null
  if (typeof spec.shapeId !== 'string') return null
  if (spec.shapeId === 'type-composition') return null  /* legacy type-lab misuse */
  return {
    shapeId:   spec.shapeId,
    customSvg: typeof spec.customSvg === 'string' ? spec.customSvg : '',
    cols:      isFiniteNum(spec.cols)    ? spec.cols    : 4,
    rows:      isFiniteNum(spec.rows)    ? spec.rows    : 4,
    gap:       isFiniteNum(spec.gap)     ? spec.gap     : 0,
    padding:   isFiniteNum(spec.padding) ? spec.padding : 0,
    stretch:   !!spec.stretch,
    overflow:  !!spec.overflow,
    bg:        spec.bg    ?? null,
    color:     spec.color ?? 'palette:secondary',
    rules:     Array.isArray(spec.rules) ? spec.rules : [],
    scale:     isFiniteNum(spec.scale)   ? spec.scale  : 256,
  }
}

function validateType(spec) {
  if (!spec || typeof spec.text !== 'string') return null
  const out = {
    text:       spec.text,
    width:      spec.width      ?? 'Tight',
    weight:     isFiniteNum(spec.weight)     ? spec.weight     : 600,
    italic:     !!spec.italic,
    size:       isFiniteNum(spec.size)       ? spec.size       : 96,
    tracking:   isFiniteNum(spec.tracking)   ? spec.tracking   : -0.01,
    lineHeight: isFiniteNum(spec.lineHeight) ? spec.lineHeight : 1.05,
    case:       spec.case      ?? 'original',
    color:      spec.color     ?? 'palette:dark',
    textAlign:  spec.textAlign ?? 'center',
  }
  /* Type-Lab axis frames carry extra morph fields. Preserve when present. */
  if (spec.axisOn !== undefined) {
    out.axisOn  = spec.axisOn
    out.width2  = spec.width2
    out.weight2 = spec.weight2
    out.blend   = spec.blend
  }
  return out
}

function validatePreset(spec) {
  if (!spec || !Array.isArray(spec.layers)) return null
  return {
    intent:  spec.intent  ?? 'whole',
    aspect:  spec.aspect  ?? '1:1',
    layers:  spec.layers,
    palette: spec.palette ?? null,
  }
}

const VALIDATORS = {
  palette: validatePalette,
  pattern: validatePattern,
  type:    validateType,
  preset:  validatePreset,
}

/* Envelope fields are preserved separately so validators stay focused on
 * spec shape. `name` is a user-given label valid on every slot. */
const ENVELOPE_KEYS = ['id', 'savedAt', 'updatedAt', 'name']
function pickEnvelope(item) {
  const out = {}
  for (const k of ENVELOPE_KEYS) {
    if (item?.[k] !== undefined) out[k] = item[k]
  }
  return out
}

/* On load, run every entry through its validator. Rejected entries are
 * dropped. Survivors keep their envelope (id / savedAt / updatedAt /
 * name) so library-tab UIs and the loaded-preset tracking stay stable. */
function sanitizeLoaded(library) {
  const out = SLOT_KEYS.reduce((acc, k) => { acc[k] = []; return acc }, {})
  for (const slot of SLOT_KEYS) {
    const validate = VALIDATORS[slot]
    const arr = Array.isArray(library?.[slot]) ? library[slot] : []
    out[slot] = arr
      .map((item) => {
        const validated = validate ? validate(item) : item
        if (!validated) {
          if (typeof console !== 'undefined' && import.meta?.env?.DEV) {
            console.warn(`library.${slot}: dropped invalid entry on load`, item)
          }
          return null
        }
        return { v: 1, ...pickEnvelope(item), ...validated }
      })
      .filter(Boolean)
  }
  return out
}

/* Rename legacy layer-type strings inside a saved-composition's layer array.
 * Mark layers gain `kind: 'logo'` so the unified shape layer-type knows
 * which variant kind to render. */
function renameLayerTypes(layers) {
  if (!Array.isArray(layers)) return layers
  return layers.map((l) => {
    if (!l?.type) return l
    if (l.type === 'bg')    return { ...l, type: 'background' }
    if (l.type === 'image') return { ...l, type: 'photo' }
    if (l.type === 'mark')  return { ...l, type: 'shape', kind: 'logo' }
    return l
  })
}

function migrateV1toV2(parsed) {
  /* v1 had each slot as { v:1, ...spec } | null (single item). Wrap as array. */
  const out = {}
  for (const key of ['palette', 'pattern', 'type', 'mark', 'layout', 'composition']) {
    const raw = parsed?.[key]
    if (Array.isArray(raw)) out[key] = raw
    else if (raw && typeof raw === 'object') out[key] = [wrapItem(raw)]
    else out[key] = []
  }
  return out
}

function migrateV2toV3(parsed) {
  const out = SLOT_KEYS.reduce((acc, k) => { acc[k] = []; return acc }, {})

  const arrayOf = (raw) => {
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object') return [wrapItem(raw)]
    return []
  }

  out.palette = arrayOf(parsed?.palette)
  out.pattern = arrayOf(parsed?.pattern)
  out.type    = arrayOf(parsed?.type)

  /* preset = legacy `layout` (aspect+compositionId pointers; no internal
   * layer-type rename needed) + legacy `composition` (with internal
   * layer-type rename in layers array). */
  const legacyLayout      = arrayOf(parsed?.layout)
  const legacyComposition = arrayOf(parsed?.composition).map((item) => ({
    ...item,
    layers: renameLayerTypes(item.layers),
  }))
  out.preset = [...legacyLayout, ...legacyComposition]

  /* `mark` slot dropped — items there were logo-variant configs not
   * load-bearing in the new vocabulary. */

  return out
}

function loadFromStorage() {
  if (typeof window === 'undefined') return EMPTY
  try {
    /* v3 (current) — sanitize through per-slot validators so legacy bad
     * entries (e.g. type-lab pattern-slot misuse) are silently dropped. */
    const v3 = window.localStorage.getItem(STORAGE_KEY)
    if (v3) return sanitizeLoaded(JSON.parse(v3))
    /* v2 → v3 migration. Snapshot v2 to backup key for rollback safety. */
    const v2 = window.localStorage.getItem('kol.generator.library.v2')
    if (v2) {
      window.localStorage.setItem('kol.generator.library.v2._backup', v2)
      return sanitizeLoaded(migrateV2toV3(JSON.parse(v2)))
    }
    /* v1 → v2 → v3 migration. */
    const v1 = window.localStorage.getItem('kol.generator.library.v1')
    if (v1) {
      return sanitizeLoaded(migrateV2toV3(migrateV1toV2(JSON.parse(v1))))
    }
    return EMPTY
  } catch {
    return EMPTY
  }
}

/* THE READER, EXPORTED (library-reader-for-a-hub-home, kol-fxr 2026-10-07): a Hub Home
 * lists SAVED from `(view) => items`, evaluated in its own render, and the provider cannot
 * sit above the shell — `Editor.jsx` mounts its own, and a save there never reaches an
 * outer copy (`storage` fires cross-tab only). This is the same function the provider seeds
 * from — validators and migrations included — so a host reads fresh with no provider and
 * no second copy of the storage key. */
export { loadFromStorage as loadLibrary }

function saveToStorage(state) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* quota / private mode — silent */ }
}

const LibraryContext = createContext(null)

/* The two new list transforms, pure and exported so they are reachable by a
 * check — the callbacks above are `setLibrary` updaters and nothing else can
 * see inside them. (FilesDialog, kol-fxr 2026-09-04.)
 *
 * RENAME touches the name and nothing else. `updateItem` routes a whole spec
 * through the slot validator, which is right for an overwrite and wrong here:
 * a rename must not be able to fail validation, and it must not move `savedAt`.
 * An empty name stores `null`, not `"Untitled"` — that word is a LABEL the UI
 * shows for a nameless item, and writing it would make "not named yet"
 * indistinguishable from "called Untitled". */
export function applyRename(arr, id, name) {
  return arr.map((it) => (
    it.id === id ? { ...it, name: String(name ?? '').trim() || null, updatedAt: Date.now() } : it
  ))
}

/* DUPLICATE copies the STORED item — so duplicating something you have not
 * loaded still copies what is actually saved, not what is on screen. The copy
 * lands directly after its original: at the end of a long list it reads as
 * nothing having happened. `updatedAt` is dropped, because a fresh copy has
 * never been edited. */
export function applyDuplicate(arr, id, newId) {
  const at = arr.findIndex((it) => it.id === id)
  if (at === -1) return arr
  const src = arr[at]
  const copy = { ...src, id: newId, name: `${src.name || 'Untitled'} copy`, savedAt: Date.now() }
  delete copy.updatedAt
  return [...arr.slice(0, at + 1), copy, ...arr.slice(at + 1)]
}

export function GeneratorLibraryProvider({ children }) {
  const [library, setLibrary] = useState(loadFromStorage)

  useEffect(() => { saveToStorage(library) }, [library])

  /* THE SYNC SEAM (plan 07, 2026-10-08). localStorage stays the session's truth; a backend
   * `{ hydrate(), push(op) }` is a write-behind target connected on SIGN-IN, never on mount —
   * a visitor is never asked for anything and the app runs exactly as before without one.
   * Every explicit verb pushes one op after its local write, fire-and-forget: a failed push
   * warns and is reconciled by the next sign-in's merge. The draft autosave lives in
   * compose/state and never comes near this. clearSlot / clearAll / replaceAll are local bulk
   * resets and push nothing. */
  const libRef = useRef(library)
  libRef.current = library
  const backendRef = useRef(null)
  const [syncState, setSyncState] = useState('off')
  const push = useCallback((op) => {
    const b = backendRef.current
    if (!b) return
    b.push(op).catch((e) => {
      if (e instanceof UnauthorizedError) { backendRef.current = null; setSyncState('off') }
      if (typeof console !== 'undefined') console.warn('library sync: push failed —', e?.message || e)
    })
  }, [])
  const connectBackend = useCallback(async (backend) => {
    const rows = await backend.hydrate() /* throws → the caller says so; nothing here changes */
    const { next, pushes } = mergeRemote(libRef.current, rows)
    backendRef.current = backend
    setLibrary({ ...EMPTY, ...next })
    setSyncState('on')
    for (const op of pushes) push(op)
  }, [push])
  const disconnectBackend = useCallback(() => { backendRef.current = null; setSyncState('off') }, [])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return
      setLibrary(loadFromStorage())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addItem = useCallback((slot, spec) => {
    if (!SLOT_KEYS.includes(slot) || !spec) return null
    const validate = VALIDATORS[slot]
    const validated = validate ? validate(spec) : spec
    if (!validated) {
      if (typeof console !== 'undefined' && import.meta?.env?.DEV) {
        console.warn(`library.${slot}: rejected invalid save`, spec)
      }
      return null
    }
    const id = newItemId()
    const item = {
      v: 1,
      id,
      savedAt: Date.now(),
      ...(typeof spec.name === 'string' ? { name: spec.name } : {}),
      ...validated,
    }
    setLibrary((prev) => ({ ...prev, [slot]: [...(prev[slot] ?? []), item] }))
    push({ op: 'put', kind: slot, item })
    return id
  }, [push])

  const removeItem = useCallback((slot, id) => {
    setLibrary((prev) => ({
      ...prev,
      [slot]: (prev[slot] ?? []).filter((it) => it.id !== id),
    }))
    push({ op: 'remove', kind: slot, id })
  }, [push])

  /* Replace an existing item's fields by id. Preserves the original `id`
   * and `savedAt`, sets `updatedAt: Date.now()`. Used by phase-8 named
   * Save to overwrite a loaded preset. Routes through the slot validator
   * so an overwrite can't reintroduce a malformed spec. */
  const updateItem = useCallback((slot, id, spec) => {
    if (!SLOT_KEYS.includes(slot) || !id || !spec) return
    const validate = VALIDATORS[slot]
    const validated = validate ? validate(spec) : spec
    if (!validated) {
      if (typeof console !== 'undefined' && import.meta?.env?.DEV) {
        console.warn(`library.${slot}: rejected invalid update`, spec)
      }
      return
    }
    const now = Date.now()
    const rewrite = (it) => ({
      ...it,
      ...(typeof spec.name === 'string' ? { name: spec.name } : {}),
      ...validated,
      id: it.id,
      savedAt: it.savedAt,
      updatedAt: now,
    })
    setLibrary((prev) => ({
      ...prev,
      [slot]: (prev[slot] ?? []).map((it) => (it.id === id ? rewrite(it) : it)),
    }))
    const current = (libRef.current[slot] ?? []).find((it) => it.id === id)
    if (current) push({ op: 'put', kind: slot, item: rewrite(current) })
  }, [push])

  /* RENAME — the name only. `updateItem` routes through the slot validator and
   * rewrites the whole spec, which is right for an overwrite and wrong for a
   * rename: a rename must not be able to fail validation, and it must not touch
   * `savedAt`. (FilesDialog, kol-fxr 2026-09-04.) */
  const renameItem = useCallback((slot, id, name) => {
    if (!SLOT_KEYS.includes(slot) || !id) return
    setLibrary((prev) => ({ ...prev, [slot]: applyRename(prev[slot] ?? [], id, name) }))
    const it = applyRename(libRef.current[slot] ?? [], id, name).find((x) => x.id === id)
    if (it) push({ op: 'put', kind: slot, item: it })
  }, [push])

  /* DUPLICATE — a real copy under a new id, `<name> copy`, saved NOW. Returns
   * the new id so the caller can select what it just made. The copy is taken
   * from the stored item rather than rebuilt from the editor, so duplicating
   * something you have not loaded still copies what is actually on disk. */
  const duplicateItem = useCallback((slot, id) => {
    if (!SLOT_KEYS.includes(slot) || !id) return null
    const newId = newItemId()
    setLibrary((prev) => ({ ...prev, [slot]: applyDuplicate(prev[slot] ?? [], id, newId) }))
    const copy = applyDuplicate(libRef.current[slot] ?? [], id, newId).find((x) => x.id === newId)
    if (copy) push({ op: 'put', kind: slot, item: copy })
    return newId
  }, [push])

  const clearSlot = useCallback((slot) => {
    setLibrary((prev) => ({ ...prev, [slot]: [] }))
  }, [])

  const clearAll = useCallback(() => setLibrary(EMPTY), [])

  const replaceAll = useCallback((next) => setLibrary({ ...EMPTY, ...next }), [])

  /* Back-compat: read "the most recently saved item" per slot. New consumers
   * should ideally pick from the array directly via `library.<slot>[i]`. */
  const selected = useMemo(() => SLOT_KEYS.reduce((acc, k) => {
    const arr = library[k] ?? []
    acc[k] = arr.length ? arr[arr.length - 1] : null
    return acc
  }, {}), [library])

  const value = {
    library,
    selected,
    addItem,
    removeItem,
    updateItem,
    renameItem,
    duplicateItem,
    clearSlot,
    clearAll,
    replaceAll,
    syncState,
    connectBackend,
    disconnectBackend,
    savePalette: (spec) => addItem('palette', spec),
    savePattern: (spec) => addItem('pattern', spec),
    saveType:    (spec) => addItem('type',    spec),
    savePreset:  (spec) => addItem('preset',  spec),
  }

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useGeneratorLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) {
    return {
      library:     EMPTY,
      selected:    SLOT_KEYS.reduce((acc, k) => { acc[k] = null; return acc }, {}),
      addItem:     () => null,
      removeItem:  () => {},
      updateItem:  () => {},
      clearSlot:   () => {},
      clearAll:    () => {},
      replaceAll:  () => {},
      syncState:   'off',
      connectBackend: async () => {},
      disconnectBackend: () => {},
      savePalette: () => null,
      savePattern: () => null,
      saveType:    () => null,
      savePreset:  () => null,
    }
  }
  return ctx
}

export const LIBRARY_SLOT_KEYS = SLOT_KEYS
