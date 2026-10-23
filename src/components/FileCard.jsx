import { ActionButton, ContextMenu, MenuDropdownItem, useModal, downloadBlob } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { renameStored, duplicateStored, removeStored } from '../index.jsx'

/**
 * FileCard — the parts a saved-file card is built from, shared by Home (`AppLayout`) and `/library`
 * (plan 37). The card frame is the DS's (`CatalogPage` → `ContentCard`);
 * this is only what FXR puts in it: the verbs and the media.
 */

/* Home has no provider, so its verbs write storage directly (libraryOps); `/library` passes its
   provider's verbs instead so its state re-renders. Same three either way. */
export const storedVerbs = (kind, id, onChange) => ({
  rename: (name) => { renameStored(kind, id, name); onChange?.() },
  duplicate: () => { duplicateStored(kind, id); onChange?.() },
  remove: () => { removeStored(kind, id); onChange?.() },
})

/* The card's media: the save's own thumbnail (plan 26 § 9), or — for a file saved before thumbs
   (2026-10-09) — a placeholder until its next save writes one (plan 37 § 2.2, user ruling). */
export function FileThumb({ src, alt = '' }) {
  if (src) return <img src={src} alt={alt} className="size-full object-cover" />
  return (
    <div className="size-full flex items-center justify-center bg-oq-04 text-fg-24" aria-label="No preview yet">
      <Icon name="image" size={24} />
    </div>
  )
}

/* where a file opens: its stored `mode` (plan 09 — labs · editor · morph, a morph opens in labs);
   files from before carry none and keep the guess — a single generator layer is a labs file */
export const chromeOf = (p) => (p.mode === 'morph' ? 'morph' : p.mode === 'labs' ? 'labs' : p.mode === 'editor' ? 'editor' : (Array.isArray(p.layers) && p.layers.length === 1 && p.layers[0]?.type === 'loop' ? 'labs' : 'editor'))

/* THE APPROVED FILE CARD (2026-10-22, the Dev page proposal): the DS `file` card and row slotted the way
   kol-ds-ui's catalog reference slots the media card — download on the cover, the size in `size`, a cog
   over a trash stacked in the plate, the same verbs on right-click. These are the plate and the menu;
   the page owns the card. */

/* the dialogs live IN the plate and the menu: both render inside the shell's ModalProvider wherever
   the page sits, so Home (whose layout mounts the provider) and Library ask the same way */
const useAsk = () => {
  const modal = useModal()
  return {
    rename: async (item, verbs) => {
      const next = await modal.prompt('Rename:', item.name ?? '')
      if (next != null && next.trim() && next.trim() !== item.name) verbs.rename(next.trim())
    },
    remove: async (item, verbs) => {
      if (await modal.confirm(`Delete “${item.name || 'Untitled'}”?`, { okLabel: 'Delete' })) verbs.remove()
    },
  }
}

/* the plate's two actions, STACKED over its padded height — one ActionButton each, as the reference.
   `verbs` = { rename(name), duplicate(), remove() } — raw store writes; the dialog is asked here */
export function FilePlate({ item, verbs, onSettings }) {
  const ask = useAsk()
  return (
    <div className="flex h-full flex-col items-center justify-between" onClick={(e) => e.stopPropagation()}>
      <ActionButton chrome="inline" size="sm" icon="settings-01" confirmIcon="settings-01" label="Settings" onAction={onSettings} />
      <ActionButton chrome="inline" size="sm" icon="trash" confirmIcon="trash" label="Delete" onAction={() => ask.remove(item, verbs)} />
    </div>
  )
}

/* the one menu every card and row opens — the cog and right-click alike; `verbsFor(item)` gives the raw verbs */
export function FileMenu({ menu, verbsFor }) {
  const ask = useAsk()
  const glyph = (name) => <Icon name={name} size={14} />
  return (
    <ContextMenu menu={menu}>
      {(item) => {
        const v = item && verbsFor(item)
        return v ? (
          <>
            <MenuDropdownItem iconLeft={glyph('edit')} onClick={() => ask.rename(item, v)}>Rename</MenuDropdownItem>
            <MenuDropdownItem iconLeft={glyph('copy')} onClick={v.duplicate}>Duplicate</MenuDropdownItem>
            <MenuDropdownItem iconLeft={glyph('trash')} onClick={() => ask.remove(item, v)}>Delete</MenuDropdownItem>
          </>
        ) : null
      }}
    </ContextMenu>
  )
}

/* download the stored file as JSON — the cover's control */
export const downloadFile = (item) => downloadBlob(new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' }), `${item.name || item.id}.json`)

/* the ground both pages give the file card and row (ContentCardRowTone, kol-component 0.288.0) */
export const FILE_TONE = 'secondary'

/* the file card's date, the reference's ISO day (2026-09-28) — a short date wrapped beside the size at
   Home's six columns */
export const fileDate = (ms) => new Date(ms ?? Date.now()).toISOString().slice(0, 10)

/* the stored file's weight — what the size slot reads */
export const bytesOf = (item) => new Blob([JSON.stringify(item)]).size
