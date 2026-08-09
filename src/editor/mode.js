/**
 * Editor modes — which chrome the standalone app boots into (plan.md Phase
 * 11.5). Three, all over the same engine and the same provider stack:
 *
 *   editor     — the compositor (layers, frames, tools)
 *   labs       — standardized output, full capability, no compositor UI
 *   randomiser — the randomize-only playground (editor/mobile)
 *
 * The chooser writes the pick here; `?view=` always overrides it, so a link
 * can force a chrome without disturbing what the user chose. Standalone app
 * only — the embedded <DesignEditor /> is always the editor (src/index.jsx).
 */

export const MODES = [
  { id: 'editor', view: 'desktop', label: 'Editor', blurb: 'The full compositor — layers, frames, tools.' },
  { id: 'labs', view: 'labs', label: 'Labs', blurb: 'One generator or source on a standardized output. Effects, generative, modulation — no compositor.' },
  { id: 'randomiser', view: 'mobile', label: 'Randomiser', blurb: 'Roll the dice: pick a category and randomize.' },
]

export const modeById = (id) => MODES.find((m) => m.id === id) ?? null

/* Navigate by URL, never flag-and-reload: a forced `?view=` would survive the
 * reload and loop. The way OUT of a view has to set the URL. (This is the
 * lesson `mobile/device.js` already paid for — it imports `withView` here.) */
export const withView = (view) => `${window.location.pathname}?view=${view}`

const MODE_KEY = 'kol-editor:mode'

export const getMode = () => {
  try { return localStorage.getItem(MODE_KEY) } catch { return null }
}
export const setMode = (id) => {
  try { id ? localStorage.setItem(MODE_KEY, id) : localStorage.removeItem(MODE_KEY) } catch { /* storage blocked */ }
}

/* Pick a mode: remember it, then go. */
export const goMode = (id) => {
  const mode = modeById(id)
  if (!mode) return
  setMode(id)
  window.location.assign(withView(mode.view))
}

export const goEditor = () => goMode('editor')
export const goLabs = () => goMode('labs')
export const goRandomiser = () => goMode('randomiser')

/* Back to the chooser — forget the pick and drop the `?view=` override. */
export const goChooser = () => {
  setMode(null)
  window.location.assign(window.location.pathname)
}
