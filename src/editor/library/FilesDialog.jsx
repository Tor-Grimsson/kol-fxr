import { useMemo, useRef, useState } from 'react'
import { Button, FullscreenOverlay, Input, useModal } from '@kolkrabbi/kol-component'
import MediaLibrary from '@kolkrabbi/kol-component/organisms/MediaLibrary'
import { SETTINGS_BASE } from '@kolkrabbi/kol-component/organisms/MediaLibraryPages'
import { useGeneratorLibrary } from './LibraryProvider'
import { getLibraryApi } from './libraryApi'

/**
 * FilesDialog — the editor's files: open · rename · duplicate · delete · export · import · save
 * the current frame, over the stored library.
 *
 * ON THE DS BROWSE SURFACE (plan 10 § 3, 2026-10-08). Consumed, not copied — the DS session's
 * ruling: *"consume, don't copy … where fxr's browser differs, fxr files the missing seam."* It is
 * picker A's shape (kol-ds-ui `apps/media/picker`): `FullscreenOverlay scrim` around
 * `MediaLibrary variant="browse"`, the selection reported by `onPickFile` (kol-component 0.242.0),
 * the act in a footer. The 2026-09-04 hand-built twin (ContentFilters + rows + cards) is in
 * `_tmp/2026-10-08-filesdialog-before-browse/FilesDialog.2026-09-04.jsx`.
 *
 * THE STORE AS A CLIENT. The surface reads a bucket; the library becomes one: a folder per kind
 * (`preset/` `palette/` `pattern/` `type/`), a file per item keyed `kind/id` — names are not
 * unique, ids are — with `displayName` carrying the name every view, Quick Look and search show
 * (kol-component 0.243.0, filed from here as `browse-surface-honours-display-name`). Delete is the surface's
 * own verb (`fileActions.remove`); Rename, Duplicate and Export are `fileActions.items`, because
 * the built-in rename prompts with the key's last segment, which here is an id. No `mediaUrl`: a
 * stored preset has no URL, so the surface offers no Copy URL / Download and Quick Look says
 * *No preview* (kol-component 0.244.0, `browse-views-label-by-display-name`).
 *
 * @param {boolean}  open          mounted and visible
 * @param {Function} onClose       dismissal — scrim, Esc, close button
 * @param {string[]} kinds         which slots to show (default: all four)
 * @param {string}   initialKind   the folder it opens in (default `preset`)
 * @param {Function} onOpenItem    (item) => void — the load verb; the host calls `loadPreset`
 * @param {'rows'|'columns'|'grid'|'list'} view   controlled view; uncontrolled when omitted
 * @param {Function} onViewChange  (view) => void
 * @param {Function} onImportFile  (File) => Promise — the host's `onLoadSettings`
 * @param {Function} onExportItem  (item, name) => void — the host's `onSaveSettings`
 * @param {Function} onSaveCurrent (name) => void — save the LIVE frame under a name; omitted, no row
 * @param {boolean}  focusName     open with the save field focused (Save As opens the dialog here)
 */

const ALL_KINDS = ['preset', 'palette', 'pattern', 'type']
/* the bucket is the crumb's second step, after the dialog's title — named for WHAT it holds, so the
   crumb reads FILES / LIBRARY / PRESET and not FILES / FILES / PRESET (audit A10) */
const BUCKET = [{ id: 'files', label: 'Library', writable: true }]
/* ponytail: hand-measured header + count line + footer, as picker A; tune if the chrome changes */
const CHROME = 300

/* `Untitled` is a LABEL, never a stored name (see the 2026-09-04 dialog) */
const labelOf = (it) => it.name || 'Untitled'
const keyOf = (kind, id) => `${kind}/${id}`
const parseKey = (key) => { const i = key.indexOf('/'); return { kind: key.slice(0, i), id: key.slice(i + 1) } }

export default function FilesDialog({
  open,
  onClose,
  kinds = ALL_KINDS,
  initialKind = 'preset',
  onOpenItem,
  view,
  onViewChange,
  onImportFile,
  onExportItem,
  onSaveCurrent,
  focusName = false,
}) {
  const { library, removeItem, renameItem, duplicateItem } = useGeneratorLibrary()
  const modal = useModal()
  const fileRef = useRef(null)
  const saveRef = useRef(null)
  const [picked, setPicked] = useState(null)
  const [prefix, setPrefix] = useState(`${initialKind}/`)
  const [error, setError] = useState('')
  const [saveName, setSaveName] = useState('')
  const [settings, setSettings] = useState(() => ({ ...SETTINGS_BASE, columnHeight: `calc(var(--kol-media-picker-h) - ${CHROME}px)` }))

  const find = (key) => { const { kind, id } = parseKey(key); return (library[kind] ?? []).find((x) => x.id === id) ?? null }

  /* the library as a bucket — rebuilt when the library changes, which is also the re-list signal */
  const objects = useMemo(() => kinds.flatMap((kind) => (library[kind] ?? []).map((it) => ({
    key: keyOf(kind, it.id),
    displayName: labelOf(it),
    contentType: 'application/json',
    size: JSON.stringify(it).length,
    uploaded: new Date(it.updatedAt ?? it.savedAt ?? 0).toISOString(),
  }))), [library, kinds])
  const client = useMemo(() => ({
    buckets: () => BUCKET,
    listMedia: async () => objects,
  }), [objects])
  /* a saved frame's thumbnail (useComposeFile `captureThumb`); older files keep the glyph */
  const thumbnailFor = (o) => { const src = find(o.key)?.thumb; return src ? <img src={src} alt="" className="size-full object-cover" /> : null }
  const refreshKey = useMemo(() => objects.map((o) => `${o.key}:${o.displayName}:${o.uploaded}`).join('|'), [objects])

  const fileActions = {
    remove: async (path) => { const { kind, id } = parseKey(path); removeItem(kind, id); if (picked?.key === path) setPicked(null) },
    items: [
      { label: 'Rename', icon: 'edit', when: (t) => t.type === 'file', run: async (t) => {
        const it = find(t.path); if (!it) return
        const name = await modal.prompt('Rename file:', it.name ?? '', { okLabel: 'Rename' })
        if (name?.trim() && name.trim() !== it.name) renameItem(parseKey(t.path).kind, it.id, name.trim())
      } },
      { label: 'Duplicate', icon: 'copy', when: (t) => t.type === 'file', run: async (t) => { const { kind, id } = parseKey(t.path); duplicateItem(kind, id) } },
      ...(onExportItem ? [{ label: 'Export', icon: 'download', when: (t) => t.type === 'file', run: async (t) => {
        const it = find(t.path); if (!it) return
        const name = await modal.prompt('Export as:', labelOf(it), { okLabel: 'Export' })
        if (name !== null) onExportItem({ ...it, kind: parseKey(t.path).kind }, name.trim() || labelOf(it))
      } }] : []),
    ],
  }

  const pickedItem = picked ? find(picked.key) : null
  const openPicked = () => { if (!pickedItem) return; onOpenItem?.({ ...pickedItem, kind: parseKey(picked.key).kind }); onClose?.() }
  const save = () => { if (!saveName.trim()) return; onSaveCurrent(saveName.trim()); setSaveName(''); onClose?.() }
  const pickImport = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' /* the same file twice in a row must still fire */
    if (!file || !onImportFile) return
    onImportFile(file).then(() => { setError(''); onClose?.() }).catch((ex) => setError(ex?.message || 'Import failed'))
  }

  if (!open) return null
  return (
    <FullscreenOverlay open scrim onClose={onClose} initialFocus={focusName ? saveRef : undefined}>
      <div className="kol-media-picker kol-files-dialog gap-4">
        <MediaLibrary
          variant="browse"
          client={client}
          title="Files"
          searchPlaceholder="Search files"
          refreshKey={refreshKey}
          prefix={prefix}
          onPrefix={setPrefix}
          view={view}
          onViewChange={onViewChange}
          settings={settings}
          onSettingsChange={setSettings}
          fileActions={fileActions}
          onPickFile={setPicked}
          thumbnailFor={thumbnailFor}
        />
        {error && <p className="kol-mono-12 text-ui-error">{error}</p>}
        {/* a build without VITE_FXR_API has no cloud and used to say nothing (audit F2) */}
        {!getLibraryApi() && <p className="kol-mono-12 text-meta">Cloud sync is not configured — files stay on this device.</p>}
        <div className="mt-auto flex items-center gap-2 flex-wrap pt-3 border-t border-oq-08">
          <Button tone="grey" size="sm" iconLeft="upload" onClick={() => fileRef.current?.click()}>Import</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={pickImport} />
          {onSaveCurrent && (
            <>
              {/* the ref rides a wrapper: whether a DS atom forwards a ref is not this file's to depend on */}
              <span ref={saveRef} className="inline-flex">
                <Input size="sm" chars={18} placeholder="Name" value={saveName} onChange={(e) => setSaveName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') save() }} />
              </span>
              <Button tone="grey" size="sm" disabled={!saveName.trim()} onClick={save}>Save current</Button>
            </>
          )}
          <span className="kol-mono-12 text-fg-48 truncate ms-auto">{pickedItem ? labelOf(pickedItem) : 'Select a file'}</span>
          <Button size="sm" disabled={!pickedItem} onClick={openPicked}>Open</Button>
        </div>
      </div>
    </FullscreenOverlay>
  )
}
