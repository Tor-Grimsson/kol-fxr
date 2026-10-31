/**
 * WHAT EVERY PATCH IS (plan 49 6.1, user 2026-10-31: "EVERY SINGLE 'file patch generation effect whatever' in FXR needs a
 * description.. like is it genearative? what kind of math, is it based on something? (like game of life) what tools does
 * it use three.js or shader? is it 3d object or 2d").
 *
 *   kind       generative · effect                              — which registry it is in
 *   basis      the maths / source it is built on                — BASIS below (Penrose sims: their own repo + summary)
 *   engine     canvas 2D · WebGL shader · three.js · PixiJS     — derived from the def, never typed
 *   dimension  2D · 3D                                          — the registry's is3D (plan 49 3.3)
 */
const BASIS = {
  /* Loops › Simple */
  'morph-circle': 'Shape interpolation — a circle eased into polygons, point by point',
  'square-circle': 'Superellipse morph between a square and a circle',
  'star-morph': 'Star polygon whose inner radius and point count are tweened',
  blob: 'Noise-displaced closed curve — a circle pushed by periodic noise',
  lissajous: 'Lissajous figures — two perpendicular sine oscillations at an integer ratio',
  spiral: 'Archimedean and logarithmic spirals',
  'rose-curve': 'Rose curves (rhodonea) — r = cos(kθ)',
  'ring-pulse': 'Concentric rings pulsing on a phase offset',
  'concentric-arcs': 'Concentric arc segments rotating at harmonic rates',
  'bars-wave': 'A row of bars sampling a travelling sine wave',
  'wave-grid': 'A grid displaced by a 2D sine field',
  'checker-pulse': 'Checkerboard whose cells scale on a phase wave',
  'grid-rotor': 'A grid of marks each rotating with a phase offset',
  'arc-sweep': 'Arcs sweeping on staggered timing',
  'radial-bars': 'Bars arranged radially, lengths driven by a wave',
  'orbit-dots': 'Dots on circular orbits at harmonic speeds',
  'sliced-solid': 'Sliced solid — a solid of revolution cut into translucent discs that drift along its axis',
  /* Pattern */
  'pattern-rules': 'Rule-based repeat patterns — stripes, tiles and lattices from a small rule set',
  /* Field */
  stripes: 'Periodic stripe field — a sine of position, thresholded',
  'checker-field': 'Checkerboard field from two crossed square waves',
  halftone: 'Halftone — dot size follows a field value, as in print screening',
  'gradient-field': 'Multi-stop colour gradient field',
  plasma: 'Plasma — summed sines of position and time (the demoscene effect)',
  'rings-field': 'Concentric ring field — sine of the distance from a centre',
  interference: 'Wave interference — summed circular waves from several sources',
  swirl: 'Swirl — a field rotated by an angle that falls off with distance',
  moire: 'Moiré — two fine line patterns overlaid at an offset',
  contour: 'Contour lines (isolines) of a noise field',
  /* Scanline · Optic · Abstract */
  scanline: 'Scanline art — rows of marks displaced and sized by a field',
  'optic-halftone': 'Op-art halftone matrix — dot screens with optical interference',
  'optic-moire': 'Op-art moiré — line grids interfering',
  'optic-reaction': 'Reaction-diffusion pattern (Gray-Scott) in op-art tones',
  meshgradient: 'Mesh gradient — colour points blended over a deformable mesh',
  'abstract-rd': 'Reaction-diffusion — Gray-Scott chemistry (spots, stripes, coral)',
  'abstract-mstp': 'Multi-scale Turing patterns (Jonathan McCabe)',
  /* Math */
  'math-expression': 'Oscilloscope — a typed expression traced like an XY scope',
  'math-waveform': 'Waveform plots — stacked periodic functions',
  'math-curves': 'Parametric curves in 3D — epicycles, knots, harmonographs',
  'math-spinner': 'Spinners — rotating epicycle stacks',
  'math-threads': 'String art — chords between points on a circle by a multiplication rule',
  'math-surface': 'Parametric surface z = f(x, y), drawn as a 3D wireframe',
  'math-field': 'Vector field plot — direction marks over a function of position',
  'math-orbits': 'Orbital paths — bodies on Keplerian and harmonic orbits',
  'math-pendulum': 'Pendulum wave — N pendulums whose swing counts differ by one; in-phase groups form at every rational fraction of the cycle',
  /* Para-type · Vector · Flow */
  'paratype-glyph': 'Parametric type — glyphs built from adjustable strokes',
  'modulator-rings': 'Modulated rings — circles displaced by stacked oscillators',
  'vector-distress': 'Vector distress — SVG paths roughened by noise and erosion',
  'flow-obstacles': 'Flow field around obstacles — particles following a curl-noise field',
  'flow-charges': 'Electric field lines between point charges',
  'flow-glyphs': 'Glyph vortex — characters carried by a rotating flow',
  'flow-ascii': 'ASCII field — characters chosen by a noise field’s value',
  'flow-voronoi': 'Voronoi diagram whose cells pulse',
  'flow-growth': 'Differential growth — one closed line that grows, splits and repels (Anders Hoff’s differential line)',
  'flow-letter-gap': 'Letter-gap flow — lines that route around set type',
  /* Drift · Gradients · Soft forms · 3D */
  'drift-air': 'Clouds and sky — fractal noise with domain warping',
  'drift-water': 'Water — Gerstner-style waves and caustics',
  'drift-cloth': 'Cloth — folded sine sheets with lighting',
  iridescent: 'Thin-film iridescence — colour from viewing angle over gradient forms',
  softforms: 'Soft forms — 2D signed-distance shapes, smooth-unioned and lit',
  softforms3d: '3D soft forms — ray-marched signed-distance shapes with metaball blending',
  scene3d: '3D scene — primitive meshes, lighting and a camera',
  forms3d: '3D forms — instanced shapes arranged in space',
  environment: 'Environment — a 3D landscape scene (terrain, tunnel)',
  ribbon: 'Ribbon — a swept 3D surface along a curve',
  'life-game': 'Conway’s Game of Life and eight other B/S cellular automata (from kol-monitor)',

  /* Effects */
  glass: 'Glass — refraction through a distorted lens surface',
  dither: 'Ordered and error-diffusion dithering (Bayer, Floyd–Steinberg)',
  'fx-chromatic': 'Chromatic aberration — RGB channels offset',
  'fx-edge': 'Edge detection — Sobel gradient magnitude',
  'fx-posterize': 'Posterize — colour levels quantised',
  'fx-pixelsort': 'Pixel sorting — runs of pixels sorted by brightness',
  'fx-mirror': 'Mirror — the frame reflected about an axis',
  'fx-kaleido': 'Kaleidoscope — a wedge mirrored around a centre',
  'fx-threshold': 'Threshold — two tones split at a brightness level',
  'fx-blocks': 'Block glitch — rectangles displaced and repeated',
  'fx-media': 'Media motion — the image moved, scaled and rotated over time',
  'fx-ascii': 'ASCII art — brightness mapped to characters',
  'fx-halftone-dither': 'Halftone dither — print screens and ordered dither',
  'fx-bitmap': '1-bit bitmap — threshold with a dither pattern',
  'fx-growth': 'Differential growth line drawn over the image’s brightness',
  'fx-slice-wave': 'Slice wave — horizontal slices offset by a sine',
  'fx-riso': 'Risograph — two spot-colour layers with misregistration and grain',
  'fx-hsl': 'HSL colour adjustment', 'fx-hsv': 'HSV colour adjustment',
  'fx-brightness': 'Brightness adjustment', 'fx-contrast': 'Contrast adjustment', 'fx-rgb': 'Per-channel RGB levels',
  'fx-invert': 'Colour inversion', 'fx-sepia': 'Sepia toning', 'fx-grayscale': 'Greyscale (luma)',
  'fx-enhance': 'Enhance — local contrast and saturation', 'fx-blur': 'Gaussian blur', 'fx-pixelate': 'Pixelate — mosaic blocks',
  'fx-solarize': 'Solarisation — tones above a level inverted', 'fx-emboss': 'Emboss — a directional relief kernel', 'fx-noise': 'Film grain noise',
  'gl-trails': 'Feedback trails — the previous frame fed back and faded',
  'gl-scan': 'Rutt-Etra — scanlines displaced by brightness (the 1970s video synthesiser)',
  'gl-slitscan': 'Slit-scan — time smeared across the frame, a row at a time',
  'gl-disco': 'Disco — a mirror-ball facet shader', 'gl-distort': 'Distortion — noise-driven UV displacement', 'gl-lens': 'Lens — barrel and pincushion distortion',
  'filter-adjustment': 'Gamma, saturation, contrast and brightness adjustment', 'filter-hsl-adjustment': 'HSL adjustment',
  'filter-color-gradient': 'Gradient map overlay', 'filter-color-map': 'Colour lookup (LUT) mapping', 'filter-color-overlay': 'Flat colour overlay',
  'filter-color-replace': 'Replace one colour with another', 'filter-multi-color-replace': 'Replace several colours',
  'filter-radial-blur': 'Radial (spin) blur', 'filter-zoom-blur': 'Zoom blur', 'filter-motion-blur': 'Directional motion blur',
  'filter-kawase-blur': 'Kawase blur — a fast multi-pass blur', 'filter-tilt-shift': 'Tilt-shift — a band of focus', 'filter-backdrop-blur': 'Backdrop blur',
  'filter-displacement': 'Displacement map — pixels pushed by a second image', 'filter-twist': 'Twist — a swirl distortion',
  'filter-bulge-pinch': 'Bulge / pinch lens distortion', 'filter-shockwave': 'Shockwave — an expanding ring of refraction',
  'filter-ascii': 'ASCII characters by brightness', 'filter-cross-hatch': 'Cross-hatching by brightness', 'filter-dot': 'Dot screen (halftone)',
  'filter-crt': 'CRT — scanlines, curvature and vignette', 'filter-old-film': 'Old film — scratches, grain and sepia', 'filter-glitch': 'Glitch — slices offset with colour shift',
  'filter-rgb-split': 'RGB split', 'filter-simplex-noise': 'Simplex noise overlay', 'filter-bloom': 'Bloom — bright areas glow',
  'filter-advanced-bloom': 'Bloom with threshold and brightness control', 'filter-glow': 'Glow around edges', 'filter-godray': 'God rays — volumetric light shafts',
  'filter-simple-lightmap': 'Light map — a texture multiplies the light', 'filter-bevel': 'Bevel — edges lit as relief', 'filter-drop-shadow': 'Drop shadow',
  'filter-outline': 'Outline around shapes', 'filter-reflection': 'Water reflection with waves', 'filter-convolution': 'Custom 3×3 convolution kernel',
}

const SHADER_ENGINES = new Set(['drift', 'iridescent', 'softforms', 'mesh'])
const THREE_ENGINES = new Set(['scene', 'forms', 'environment', 'ribbon'])

export function engineOf(def, isFilter = false) {
  if (isFilter) return def.pixi || /^filter-/.test(def.id) ? 'WebGL shader (PixiJS)' : def.kind === 'engine' || /^gl-/.test(def.id) ? 'WebGL shader' : 'canvas 2D'
  if (def.group === 'field' && def.id !== 'halftone' || def.id === 'optic-moire') return 'WebGL shader' /* the field GL pass (field/fieldGL.js) */
  if (THREE_ENGINES.has(def.engine)) return 'three.js'
  if (def.engine === 'softforms3d') return 'WebGL shader (ray-marched)'
  if (SHADER_ENGINES.has(def.engine)) return 'WebGL shader'
  return 'canvas 2D'
}

/** `{ kind, basis, engine, dimension }` for a loop def (or a filter def with `isFilter`) */
export function aboutOf(def, isFilter = false) {
  if (!def) return null
  const own = def.about ?? {}
  return {
    kind: own.kind ?? (isFilter ? 'effect' : 'generative'),
    basis: own.basis ?? BASIS[def.id] ?? null,
    engine: own.engine ?? engineOf(def, isFilter),
    dimension: own.dimension ?? (def.is3D ? '3D' : '2D'),
  }
}
