import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button, ContentCard, ContentFilters, ContentRow,
  EmptyState, FullscreenOverlay, Input, useModal, Tooltip } from '@kolkrabbi/kol-component'
import { useGeneratorLibrary } from './LibraryProvider'

/**
 * FilesDialog — the editor's files dialog: one list over the whole generator
 * library, with the five verbs on it (open · rename · duplicate · delete ·
 * export) and import beside them.
 *
 * Asked for by kol-fxr's user directly — *"a proper save load import export
 * delete files dialog"*. Before this the editor could do all five and had no
 * single place to do any of them: save was a `modal.prompt`, load was a click
 * on a rail thumbnail, import and export were two buttons in a footer tab, and
 * delete was reachable only from the library rail. Nothing could rename or
 * duplicate at all.
 *
 * MEDIALIBRARY'S TWIN, deliberately (FilesDialog spec, kol-fxr 2026-09-04):
 * `FullscreenOverlay` for the scrim and dismissal, `ContentFilters` for the
 * search / kind chips / view toggle / N-of-M, `ContentRow` and `ContentCard` at
 * `variant="default"` for the two views. If a difference between the two
 * appears, it is a defect here, not a variant.
 *
 * WHY THE WRITE VERBS LIVE HERE, where MediaLibrary's do not: that organism is
 * read-only because a remote bucket write needs credentials a browser-shipped
 * package must not carry. This store is `localStorage`, owned by this package
 * and already mutated by it on every save — there is no auth boundary to cross.
 *
 * THE FOUR SLOTS ARE ONE LIST with `kind` as a filter, not four tabs. The ask
 * was a files dialog, not a slot browser.
 *
 * @param {boolean}  open          mounted and visible
 * @param {Function} onClose       dismissal — scrim, Esc, close button
 * @param {string[]} kinds         which slots to show (default: all four)
 * @param {string}   initialKind   the chip selected on open (default `preset`)
 * @param {Function} onOpenItem    (item) => void — the load verb; the host calls `loadPreset`
 * @param {'list'|'grid'} view     controlled view; uncontrolled when omitted
 * @param {Function} onViewChange  (view) => void
 * @param {Function} onImportFile  (File) => Promise — the host's `onLoadSettings`
 * @param {Function} onExportItem  (item, name) => void — the host's `onSaveSettings`
 * @param {Function} onSaveCurrent  (name) => void — save the LIVE frame under a name. Omitted, the
 *                                 save row does not render; this is what replaces `modal.prompt`
 * @param {boolean}  focusName     open with the save field focused (Save As opens the dialog here)
 */

const ALL_KINDS = ['preset', 'palette', 'pattern', 'type']

const VIEW_OPTIONS = [
  { value: 'grid', icon: 'grid', label: 'Grid' },
  { value: 'list', icon: 'view-list', label: 'List' },
]

const fmtDate = (ms) => {
  if (!ms) return ''
  const d = new Date(ms)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

/* `Untitled` is a LABEL, never a stored name: an item whose name is null shows
 * this and still renames to whatever the user types. Writing it into the store
 * on save would make "has no name yet" indistinguishable from "is called
 * Untitled", and the rename field would open pre-filled with a word nobody
 * chose. */
const labelOf = (it) => it.name || 'Untitled'

export default function FilesDialog({
  open,
  onClose,
  kinds = ALL_KINDS,
  initialKind = 'preset',
  onOpenItem,
  view: viewProp,
  onViewChange,
  onImportFile,
  onExportItem,
  onSaveCurrent,
  focusName = false,
}) {
  const { library, removeItem, renameItem, duplicateItem } = useGeneratorLibrary()
  const modal = useModal()
  const fileRef = useRef(null)
  /* the node the overlay hands focus to when Save As opened it — a child's
   * own `autoFocus` loses the race with the overlay's mount focus */
  const saveRef = useRef(null)

  const [ownView, setOwnView] = useState('list')
  const view = viewProp ?? ownView
  const setView = (v) => { setOwnView(v); onViewChange?.(v) }

  const [selectedId, setSelectedId] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [error, setError] = useState('')
  const [exportName, setExportName] = useState('')
  const [saveName, setSaveName] = useState('')

  /* Every slot flattened into ONE list, `kind` carried as a field so the chips
   * filter it. Newest first — a files dialog opens on what you were just
   * working on, not on what you saved in March.
   *
   * SO A DUPLICATE APPEARS AT THE TOP, not beside its original. `applyDuplicate`
   * inserts it directly after the item it copied, which is true of the STORE
   * and, under this sort, not of the view (kol-fxr, design-editor 0.10.0). The
   * sort is the one that stays: a fresh copy IS the newest thing, and it is
   * selected on creation, so it is never lost — reordering the list around a
   * duplicate would move every other row to keep one promise about adjacency. */
  const items = useMemo(() => kinds
    .flatMap((slot) => (library[slot] ?? []).map((it) => ({
      ...it,
      kind: slot,
      /* ContentFilters searches `searchKeys` — the label, not the raw name, so
       * an unnamed item is still findable by what it says on screen. */
      label: labelOf(it),
    })))
    .sort((a, b) => (b.updatedAt ?? b.savedAt ?? 0) - (a.updatedAt ?? a.savedAt ?? 0)),
  [library, kinds])

  const selected = items.find((it) => it.id === selectedId) ?? null

  /* The export name follows the selection until the user types into it. Their
   * text is never overwritten — an edited field that resets when the selection
   * changes underneath it is how a typed filename gets silently lost. */
  const touchedName = useRef(false)
  useEffect(() => {
    if (!touchedName.current) setExportName(selected ? labelOf(selected) : '')
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* A dialog reopens clean: a stale selection from last time drives the footer's
   * Export at something the user is no longer looking at. */
  useEffect(() => {
    if (!open) { setSelectedId(null); setRenamingId(null); setError(''); setSaveName(''); touchedName.current = false }
  }, [open])

  if (!open) return null

  const openItem = (it) => { onOpenItem?.(it); onClose?.() }

  const onDelete = async (it) => {
    const ok = await modal.confirm(`Delete “${labelOf(it)}”?`, { okLabel: 'Delete' })
    if (!ok) return
    removeItem(it.kind, it.id)
    if (selectedId === it.id) setSelectedId(null)
  }

  const onDuplicate = (it) => {
    const id = duplicateItem(it.kind, it.id)
    if (id) setSelectedId(id)
  }

  const commitRename = (it, next) => {
    setRenamingId(null)
    const name = String(next ?? '').trim()
    if (!name || name === labelOf(it)) return
    renameItem(it.kind, it.id, name)
  }

  const pickImport = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' /* the same file twice in a row must still fire */
    if (!file || !onImportFile) return
    onImportFile(file)
      .then(() => { setError(''); onClose?.() })
      .catch((ex) => setError(ex?.message || 'Import failed'))
  }

  /* Quiet ghost buttons, not `ActionButton`: that atom is the HOLD-TO-CONFIRM
   * control (icon flips to `confirmIcon` on `onAction`), which fits Copy URL
   * and Download. Rename opens a field and Delete opens the modal confirm, so
   * neither has anything to flip to. */
  const rowAction = (icon, label, run) => (
    <Tooltip label={label}><Button
      tone="ghost" quiet size="sm" iconOnly={icon}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); run() }}
    /></Tooltip>
  )
  const rowActions = (it) => (
    <span className="flex items-center gap-1">
      {rowAction('edit', 'Rename', () => setRenamingId(it.id))}
      {rowAction('copy', 'Duplicate', () => onDuplicate(it))}
      {rowAction('trash', 'Delete', () => onDelete(it))}
    </span>
  )

  /* The rename field replaces the NAME, in the row, where the name is —
   * `modal.prompt` is what this dialog exists to get rid of. Enter commits,
   * Esc cancels, blur commits (a click elsewhere is not a cancel). */
  const nameCell = (it) => (renamingId === it.id ? (
    <Input
      size="sm"
      autoFocus
      defaultValue={labelOf(it)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') commitRename(it, e.target.value)
        if (e.key === 'Escape') setRenamingId(null)
      }}
      onBlur={(e) => commitRename(it, e.target.value)}
    />
  ) : labelOf(it))

  const body = (filtered) => {
    if (items.length === 0) {
      return (
        <EmptyState
          eyebrow="Files"
          title="Nothing saved yet"
          body="Save a frame from the File menu, or import one you exported earlier."
        />
      )
    }
    if (filtered.length === 0) {
      return <EmptyState eyebrow="Files" title="Nothing matches" body="No saved file matches this search." />
    }
    return view === 'grid' ? (
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {filtered.map((it) => (
          /* DOUBLE-CLICK OPENS, and it rides a wrapper: neither card nor row
           * takes `onDoubleClick`, and their prop rest lands in ContentText —
           * which warns on an unknown slot since 0.210.0, so passing it there
           * would trip the warning this repo just shipped. */
          <div key={it.id} onDoubleClick={() => openItem(it)}>
          <ContentCard
            variant="default"
            /* NO COVER, NOT A MISSING ONE (kol-component 0.210.0): a palette or
             * a type spec has no thumbnail and never will, and the dashed
             * MISSING plate is for an asset that failed, not for one that does
             * not exist. */
            media={false}
            title={nameCell(it)}
            eyebrow={it.kind}
            date={fmtDate(it.updatedAt ?? it.savedAt)}
            selected={selectedId === it.id}
            onClick={() => setSelectedId(it.id)}
            actions={rowActions(it)}
          />
          </div>
        ))}
      </div>
    ) : (
      <ul className="flex flex-col">
        {filtered.map((it) => (
          <li key={it.id} onDoubleClick={() => openItem(it)}>
          <ContentRow
            variant="default"
            media={false}
            title={nameCell(it)}
            eyebrow={it.kind}
            date={fmtDate(it.updatedAt ?? it.savedAt)}
            selected={selectedId === it.id}
            onClick={() => setSelectedId(it.id)}
            actions={rowActions(it)}
          />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <FullscreenOverlay open={open} onClose={onClose} initialFocus={focusName ? saveRef : undefined}>
      <div className="kol-files-dialog flex flex-col gap-4" style={{ minWidth: 'min(880px, 90vw)' }}>
        <ContentFilters
          items={items}
          title="Files"
          titleIcon="folder"
          totalCount={items.length}
          searchKeys={['label']}
          viewMode={view}
          onViewModeChange={setView}
          viewModeOptions={VIEW_OPTIONS}
          mutuallyExclusiveFilters={['kind']}
          filterGroups={kinds.length > 1 ? [{ label: 'Kind', key: 'kind', values: kinds }] : []}
          /* opens on one chip — `initialFilters` is seeded, so the user can
             clear it to see everything and the dialog stays ONE list */
          initialFilters={initialKind && kinds.includes(initialKind) ? [`kind:${initialKind}`] : undefined}
          renderItem={(filtered) => body(filtered)}
        />

        {error && <span className="kol-helper-10 text-ui-error">{error}</span>}

        {/* SAVE THE LIVE FRAME, under a name typed here. This is the row that
            retires `modal.prompt` for Save As: a prompt asks for a name with
            no sight of the names already taken, which is how three files end
            up called `test`. Only renders when the host passes the verb. */}
        {onSaveCurrent && (
          <div className="flex items-center gap-2 pt-3 border-t border-oq-08">
            <span className="kol-helper-10 text-meta">Save current frame</span>
            {/* the ref rides a WRAPPER, not the Input: whether a DS atom
                forwards a ref is a detail this file should not depend on, and
                the overlay takes the first focusable inside whatever it is
                given */}
            <span ref={saveRef} className="ms-auto inline-flex">
            <Input
              size="sm"
              chars={18}
              placeholder="Name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && saveName.trim()) { onSaveCurrent(saveName.trim()); onClose?.() } }}
            />
            </span>
            <Button
              tone="primary" size="sm"
              disabled={!saveName.trim()}
              onClick={() => { onSaveCurrent(saveName.trim()); onClose?.() }}
            >
              Save
            </Button>
          </div>
        )}

        {/* THE FOOTER — import · export the selection under a name · open.
            The export name is a FIELD because `onSaveSettings` hardcoded
            `kol-design-editor.json` for every file anyone ever exported. */}
        <div className="flex items-center gap-2 pt-3 border-t border-oq-08">
          <Button tone="primary" size="sm" iconLeft="upload" onClick={() => fileRef.current?.click()}>
            Import
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={pickImport} />

          <span className="flex items-center gap-2 ms-auto">
            <Input
              size="sm"
              chars={18}
              placeholder="File name"
              value={exportName}
              disabled={!selected}
              onChange={(e) => { touchedName.current = true; setExportName(e.target.value) }}
            />
            <Button
              tone="primary" size="sm" iconLeft="download"
              disabled={!selected}
              onClick={() => onExportItem?.(selected, exportName.trim() || labelOf(selected))}
            >
              Export
            </Button>
            <Button
              tone="primary" size="sm"
              disabled={!selected}
              onClick={() => selected && openItem(selected)}
            >
              Open
            </Button>
          </span>
        </div>
      </div>
    </FullscreenOverlay>
  )
}
