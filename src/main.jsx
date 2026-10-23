import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { hideLoaderApp } from '@kolkrabbi/kol-framework/src/loaderApp.js'
import './index.css'

/* ONE-TIME CLEAN (plan 37 § 4.1): the saves the 2026-10-08 walk scripts left in this browser
   (`Plan08 …`, `Sync A <ms>`, `Morph W <ms>`) leave the library; a copy stays under a backup key. */
try {
  const KEY = 'kol.editor.library.v3', DONE = 'kol.editor.plan08-clean'
  const lib = !localStorage.getItem(DONE) && JSON.parse(localStorage.getItem(KEY) ?? 'null')
  if (lib?.preset) {
    const test = (p) => /^(Plan08 |Sync [A-Z] \d{13}|Morph [A-Z] \d{13})/.test(p?.name ?? '')
    const gone = lib.preset.filter(test)
    if (gone.length) {
      localStorage.setItem('kol.editor.library.plan08-backup', JSON.stringify(gone))
      localStorage.setItem(KEY, JSON.stringify({ ...lib, preset: lib.preset.filter((p) => !test(p)) }))
    }
  }
  localStorage.setItem(DONE, '1')
} catch { /* storage blocked — nothing to clean */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* The app loader (kol-framework's loaderApp, written into index.html by vite.config.js) leaves once React has painted. */
hideLoaderApp()
