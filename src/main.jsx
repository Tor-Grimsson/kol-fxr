import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Dev-only favicon — big E so the dev tab is unmistakable. Dead-code-eliminated
// from production builds; prod keeps /favicon/favicon.svg from index.html.
// The numbers are solved, not eyeballed: the glyph's INK box sits 2px off all
// four sides of the 32 box. font-size sets the cap height (2px top + bottom at
// the baseline y=30); textLength/x are the ink width and centre — textLength is
// the ADVANCE, so it overshoots 32 to make the ink 28, and x offsets the E's
// uneven side bearings. Measured, not derived: re-solve if the letter changes.
if (import.meta.env.DEV) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#ffe32e"/><text x="15.45" y="30" font-family="Arial Black, Arial, sans-serif" font-size="39.1" font-weight="900" text-anchor="middle" textLength="33.65" lengthAdjust="spacingAndGlyphs" fill="#000">E</text></svg>`
  const link = document.querySelector('link[rel="icon"]')
  if (link) {
    link.type = 'image/svg+xml'
    link.href = 'data:image/svg+xml,' + encodeURIComponent(svg)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* The boot curtain (index.html) leaves once React has painted: two frames after the first commit,
   a 240ms fade (none under reduced motion — the CSS drops the transition), then out of the DOM. */
const boot = document.getElementById('fxr-boot')
if (boot) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    boot.classList.add('is-done')
    setTimeout(() => boot.remove(), 300)
  }))
}
