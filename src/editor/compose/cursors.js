/* Tool cursors drawn as inline `data:` SVG (spec R8.2, the user's 4 and 5). The first attempt
 * failed on Vite's `?url` import (CanvasArea's old note), not on SVG cursors — an inline data URI
 * needs no asset pipeline. Each glyph is ink over a white halo so it reads on any canvas; each
 * string carries its hotspot and a keyword fallback. */
const svg = (body, x, y, fallback) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`,
  )}") ${x} ${y}, ${fallback}`

/* a path drawn twice: a wide white halo, then the ink */
const ink = (d) => `<path d="${d}" stroke="#fff" stroke-width="3.5"/><path d="${d}" stroke="#000" stroke-width="1.5"/>`

/* the pen nib, tip at 2,2 (Illustrator's pen) */
const NIB = 'M2 2l5.5 13 3-3 4.5 4.5 2-2-4.5-4.5 3-3z M2 2l5 5'

export const CURSORS = {
  pen: svg(ink(NIB), 2, 2, 'crosshair'),
  /* over the first anchor: the nib plus a small ○ — the click closes the path */
  penClose: svg(`${ink(NIB)}<circle cx="18.5" cy="18.5" r="3" stroke="#fff" stroke-width="3.5"/><circle cx="18.5" cy="18.5" r="3" stroke="#000" stroke-width="1.5"/>`, 2, 2, 'crosshair'),
  /* over a selected path's segment: the nib plus a + — the click adds an anchor there */
  penAdd: svg(`${ink(NIB)}${ink('M18.5 15.5v6 M15.5 18.5h6')}`, 2, 2, 'crosshair'),
  /* rotate: a three-quarter arc with its arrowhead (the selection's rotate handle) */
  rotate: svg(`${ink('M18 12a6 6 0 1 1-2.2-4.6')}${ink('M16.5 4.5l-.7 2.9 2.9.7')}`, 12, 12, 'grab'),
  /* eyedropper: the pipette, sampling at its tip (bottom-left) */
  eyedrop: svg(ink('M3 21l1.5-4.5 9-9 3 3-9 9z M13.5 7.5l2-2a2.1 2.1 0 0 1 3 3l-2 2'), 3, 21, 'crosshair'),
  /* orbit: an ellipse around a dot, centred */
  orbit: svg(`${ink('M3 12a9 4.5 0 1 0 18 0a9 4.5 0 1 0-18 0')}${ink('M12 3a4.5 9 0 1 0 0 18')}<circle cx="12" cy="12" r="1.5" fill="#000" stroke="#fff"/>`, 12, 12, 'grab'),
}
