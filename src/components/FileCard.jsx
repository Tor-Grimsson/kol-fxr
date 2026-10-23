import { downloadBlob } from '@kolkrabbi/kol-component'
import { renameStored, duplicateStored, removeStored } from '../index.jsx'

/**
 * FileCard — the parts a saved-file card is built from, shared by Home (`AppLayout`) and `/library`
 * (plan 37). The card is the DS's — `CatalogPage preset="app"` (kol-shell 0.75.0) draws the cover,
 * plate and menu; this is only what FXR hands it: the verbs, where a file opens, its download and size.
 */

/* Home has no provider, so its verbs write storage directly (libraryOps); `/library` passes its
   provider's verbs instead so its state re-renders. Same three either way. */
export const storedVerbs = (kind, id, onChange) => ({
  rename: (name) => { renameStored(kind, id, name); onChange?.() },
  duplicate: () => { duplicateStored(kind, id); onChange?.() },
  remove: () => { removeStored(kind, id); onChange?.() },
})

/* where a file opens: its stored `mode` (plan 09 — labs · editor · morph, a morph opens in labs);
   files from before carry none and keep the guess — a single generator layer is a labs file */
export const chromeOf = (p) => (p.mode === 'morph' ? 'morph' : p.mode === 'labs' ? 'labs' : p.mode === 'editor' ? 'editor' : (Array.isArray(p.layers) && p.layers.length === 1 && p.layers[0]?.type === 'loop' ? 'labs' : 'editor'))

/* download the stored file as JSON — the cover's control */
export const downloadFile = (item) => downloadBlob(new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' }), `${item.name || item.id}.json`)

/* the stored file's weight — what the size slot reads */
export const bytesOf = (item) => new Blob([JSON.stringify(item)]).size
