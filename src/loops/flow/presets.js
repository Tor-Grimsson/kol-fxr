// Flow loops — the effects intake's field family (plan 37 W6): one vector field core
// (fieldCore.js) under streamlines (obstacles, charges), a glyph instancer (vortex) and a
// Voronoi study; plus the letter-gap type study, its own group. A preset names a base loop
// + a partial param override.

import obstacleFlow from './obstacleFlow.js'
import chargeLines from './chargeLines.js'
import glyphVortex from './glyphVortex.js'
import voronoiPulse from './voronoiPulse.js'
import letterGap from './letterGap.js'

export const FLOW_LOOPS = [obstacleFlow, chargeLines, glyphVortex, voronoiPulse, letterGap]

const P = (id, label, loop, params = {}, sub) => ({ id, label, loop, params, sub })

export const FLOW_PRESETS = [
  P('flow-obstacles', 'Obstacle flow', 'flow-obstacles', {}, 'Streamlines'),
  P('flow-obstacles-dense', 'Obstacle flow · dense', 'flow-obstacles', { lines: 110, obstacles: 5, radius: 0.06, rings: 6 }, 'Streamlines'),
  P('flow-charges', 'Charge lines', 'flow-charges', {}, 'Streamlines'),
  P('flow-charges-pair', 'Charge lines · pair', 'flow-charges', { positive: 1, negative: 1, perCharge: 36, arrows: 2 }, 'Streamlines'),
  P('flow-glyphs', 'Glyph vortex', 'flow-glyphs', {}, 'Glyphs'),
  P('flow-glyphs-n', 'Glyph vortex · n', 'flow-glyphs', { glyph: 'n', cols: 40, vortices: 3, scaleBy: 0.8 }, 'Glyphs'),
  P('flow-voronoi', 'Voronoi pulse', 'flow-voronoi', {}, 'Cells'),
  P('flow-voronoi-fine', 'Voronoi pulse · fine', 'flow-voronoi', { points: 120, inset: 0.006, round: 0.01, reach: 0.1 }, 'Cells'),
  P('flow-letter-gap', 'Letter gap · rule', 'flow-letter-gap', {}, 'Letter gap'),
  P('flow-letter-gap-box', 'Letter gap · box', 'flow-letter-gap', { decor: 'box', gap: 0.9 }, 'Letter gap'),
  P('flow-letter-gap-dot', 'Letter gap · dot', 'flow-letter-gap', { decor: 'dot', breathe: 1 }, 'Letter gap'),
]
