// Flow loops — the effects intake's field family (plan 37 W6): one vector field core
// (fieldCore.js) under streamlines (obstacles, charges), a glyph instancer (vortex) and a
// Voronoi study; plus the letter-gap type study, its own group. A preset names a base loop
// + a partial param override.

import obstacleFlow from './obstacleFlow.js'
import chargeLines from './chargeLines.js'
import glyphVortex from './glyphVortex.js'
import asciiField from './asciiField.js'
import voronoiPulse from './voronoiPulse.js'
import letterGap from './letterGap.js'
import growthLine from './growthLine.js'

export const FLOW_LOOPS = [obstacleFlow, chargeLines, glyphVortex, asciiField, voronoiPulse, letterGap, growthLine]

const P = (id, label, loop, params = {}, sub) => ({ id, label, loop, params, sub })

export const FLOW_PRESETS = [
  P('flow-obstacles', 'Obstacle flow', 'flow-obstacles', {}, 'Streamlines'),
  P('flow-obstacles-dense', 'Obstacle flow dense', 'flow-obstacles', { lines: 110, obstacles: 5, radius: 0.06, rings: 6 }, 'Streamlines'),
  P('flow-charges', 'Charge lines', 'flow-charges', {}, 'Streamlines'),
  P('flow-charges-pair', 'Charge lines pair', 'flow-charges', { positive: 1, negative: 1, perCharge: 36, arrows: 2 }, 'Streamlines'),
  P('flow-glyphs', 'Glyph vortex', 'flow-glyphs', {}, 'Glyphs'),
  P('flow-glyphs-n', 'Glyph vortex n', 'flow-glyphs', { glyph: 'n', cols: 40, vortices: 3, scaleBy: 0.8 }, 'Glyphs'),
  P('flow-ascii-noise', 'ASCII noise', 'flow-ascii', {}, 'Glyphs'),
  P('flow-ascii-plasma', 'ASCII plasma', 'flow-ascii', { field: 'plasma', charset: 'blocks', cols: 56, accentMix: 1, accent: '#ff4fd8', ink: '#3ad8ff' }, 'Glyphs'),
  P('flow-ascii-rings', 'ASCII rings', 'flow-ascii', { field: 'rings', charset: 'extended', cols: 96, speed: 2 }, 'Glyphs'),
  P('flow-ascii-vortex', 'Katakana vortex', 'flow-ascii', { field: 'vortex', charset: 'katakana', cols: 64, ink: '#3fff8a', accent: '#d8ffe8', accentMix: 0.8 }, 'Glyphs'),
  P('flow-voronoi', 'Voronoi pulse', 'flow-voronoi', {}, 'Cells'),
  P('flow-voronoi-fine', 'Voronoi pulse fine', 'flow-voronoi', { points: 120, inset: 0.006, round: 0.01, reach: 0.1 }, 'Cells'),
  /* the growing line (plan 43 § 4.1) — one loop filling a built-in image; Effects › Growing line takes a photo */
  P('flow-growth', 'Growing line', 'flow-growth', {}, 'Growth'),
  P('flow-growth-orb', 'Growing orb', 'flow-growth', { source: 'orb', maxGap: 26 }, 'Growth'),
  P('flow-growth-rings', 'Growing rings', 'flow-growth', { source: 'rings', minGap: 3.5, maxGap: 16 }, 'Growth'),
  P('flow-letter-gap', 'Rule', 'flow-letter-gap', {}, 'Letter gap'),
  P('flow-letter-gap-box', 'Box', 'flow-letter-gap', { decor: 'box', gap: 0.9 }, 'Letter gap'),
  P('flow-letter-gap-dot', 'Dot', 'flow-letter-gap', { decor: 'dot', breathe: 1 }, 'Letter gap'),
]
