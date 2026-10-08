// Distressor — the kol-svg-distress port (plan 02-labs-mobile-and-vector
// step 3). One base loop; presets are mode looks over it, categorised per
// the hierarchy law. `svgSrc` (off-schema) carries the art — a URL or inline
// markup — set by the source picker; without it the engine's default art
// renders so a preset is never a blank stage.

import engine from './engine.js'

export const DISTRESS_LOOPS = [engine]

const P = (id, label, loop, params = {}, sub) => ({ id, label, loop, params, sub })

export const DISTRESS_PRESETS = [
  // Erosion — edge-eating looks
  P('dst-press', 'Print press', 'vector-distress', {}, 'Erosion'),
  P('dst-roughen', 'Roughen', 'vector-distress', { mode: 'roughen', amount: 32, smoothness: 8 }, 'Erosion'),
  P('dst-tear', 'Torn edge', 'vector-distress', { mode: 'tear', amount: 40, frequency: 45, smoothness: 12 }, 'Erosion'),
  // Wobble — line-quality looks
  P('dst-hand', 'Hand-drawn', 'vector-distress', { mode: 'hand', amount: 18, frequency: 22, smoothness: 40 }, 'Wobble'),
  P('dst-noise', 'Noise crawl', 'vector-distress', { mode: 'noise', amount: 14, frequency: 60, smoothness: 30 }, 'Wobble'),
  P('dst-jitter', 'Jitter', 'vector-distress', { mode: 'jitter', amount: 22, smoothness: 0 }, 'Wobble'),
  // Print — press-artefact looks
  P('dst-ink', 'Ink spread', 'vector-distress', { mode: 'ink-spread', amount: 30, smoothness: 55 }, 'Print'),
  P('dst-misregister', 'Misregister', 'vector-distress', { mode: 'offset', amount: 26, smoothness: 35 }, 'Print'),
]
