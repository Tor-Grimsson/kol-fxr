import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { hideLoaderApp } from '@kolkrabbi/kol-framework/src/loaderApp.js'
import './index.css'
import { dropStoredShipped } from './editor/library/shipped'
import { isWalkSave } from './editor/library/mergeRemote'

/* THE WALK SAVES LEAVE (plan 37 § 4.1, again in plan 40 § 2.1): the saves the 2026-10-08 walk scripts left in this browser
   (`Plan08 …`, `Sync A <ms>`, `Morph W <ms>`) leave the library on every load — a signed-in merge used to bring the cloud
   copies back after the one-time clean, and mergeRemote now refuses them and removes them up there. A copy of each
   stays under the backup key. */
try {
  const KEY = 'kol.editor.library.v3', BACKUP = 'kol.editor.library.plan08-backup'
  const lib = JSON.parse(localStorage.getItem(KEY) ?? 'null')
  const gone = lib?.preset?.filter(isWalkSave) ?? []
  if (gone.length) {
    const kept = JSON.parse(localStorage.getItem(BACKUP) ?? '[]')
    localStorage.setItem(BACKUP, JSON.stringify([...kept.filter((k) => !gone.some((g) => g.id === k.id)), ...gone]))
    localStorage.setItem(KEY, JSON.stringify({ ...lib, preset: lib.preset.filter((p) => !isWalkSave(p)) }))
  }
} catch { /* storage blocked — nothing to clean */ }

/* the shipped files an earlier build wrote into localStorage leave it again (they are built in memory now) */
dropStoredShipped()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* The app loader (kol-framework's loaderApp, written into index.html by vite.config.js) leaves once React has painted. */
hideLoaderApp()
