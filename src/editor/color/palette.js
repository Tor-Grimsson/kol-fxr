import { HARMONIES, harmonyColors, hexToHsl } from '@kolkrabbi/kol-component'
import { THEMES } from '../../loops/lib/themes.js'

/**
 * palette — ONE palette shape every layer reads (plan 37 W5, lobby `color-pass-one-palette-for-every-layer`).
 *
 *   { id, name, colors: [hex…], roles: { bg, fg, accent, dim, warm }, source, relation?, seed? }
 *
 * THE ENGINE IS THE DS'S (plan 37 § 5.4 research): kol-component's `colorMath` — the harmony rules
 * the styleguide's ColorLab and `PaletteHarmonyWheel` run on — not a lift of this repo's Combo Lab
 * (`modes/palette/colorMath.js`, the copy the DS one was raided from). What is FXR's: the seeded roll,
 * the role spread a generator needs (a ground, an ink, accents), and the resolver.
 */

/* the five roles the loop schemas already tag (loops/theme.js) */
export const ROLES = ['bg', 'fg', 'accent', 'dim', 'warm']

/* the relationships a roll can take — the DS harmonies plus the two that are not hue offsets */
export const RELATIONS = [
  ...HARMONIES.map((h) => ({ id: h.id, label: h.label })),
  { id: 'monochromatic', label: 'Monochromatic' },
  { id: 'random', label: 'Random' },
]

/* a theme IS a palette — its five roles, its colours in role order */
export const themeAsPalette = (t) => ({
  id: `theme:${t.id}`, name: t.label, source: 'theme',
  roles: { bg: t.bg, fg: t.fg, accent: t.accent, dim: t.dim ?? t.accent, warm: t.warm ?? t.accent },
  colors: [t.bg, t.fg, t.accent, t.dim ?? t.accent, t.warm ?? t.accent],
})

/* a bare list of hex (editor swatches, a Combo Lab save) as a palette: roles by order, darkest = ground */
export function colorsAsPalette(colors, { id, name, source }) {
  const byL = [...colors].sort((a, b) => hexToHsl(a).l - hexToHsl(b).l)
  const rest = colors.filter((c) => c !== byL[0] && c !== byL[byL.length - 1])
  return {
    id, name, source, colors,
    roles: { bg: byL[0], fg: byL[byL.length - 1], accent: rest[0] ?? byL[byL.length - 1], dim: rest[1] ?? byL[0], warm: rest[2] ?? rest[0] ?? byL[byL.length - 1] },
  }
}

/* THE STORE: themes · the editor's swatches · the library's saved palettes, all one shape */
const readSwatches = () => { try { return JSON.parse(localStorage.getItem('kol.editor.swatches') ?? '[]') } catch { return [] } }
export function allPalettes(library = {}) {
  const swatches = readSwatches().map((s) => (typeof s === 'string' ? s : s?.hex)).filter(Boolean)
  return [
    ...THEMES.map(themeAsPalette),
    ...(swatches.length >= 2 ? [colorsAsPalette(swatches, { id: 'swatches', name: 'Swatches', source: 'editor' })] : []),
    ...(library.palette ?? []).filter((p) => Array.isArray(p.colors) && p.colors.length)
      .map((p) => colorsAsPalette(p.colors.map((c) => (typeof c === 'string' ? c : c.hex)), { id: p.id, name: p.name || 'Palette', source: 'local' })),
  ]
}

/* OKLCH → hex (plan 39 § 4.3 — the roll generates in OKLCH so equal L reads as equal lightness across
   hues, which HSL does not: an HSL yellow and blue at the same L are nowhere near each other). Björn
   Ottosson's OKLab matrices; out-of-gamut colours keep L and h and give up chroma until they fit. */
const toLinear = (L, C, h) => {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
}
const inGamut = (rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)
export function oklchToHex(L, C, h) {
  let lo = 0, hi = C, rgb = toLinear(L, C, h)
  if (!inGamut(rgb)) { for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (inGamut(toLinear(L, mid, h))) lo = mid; else hi = mid } rgb = toLinear(L, lo, h) }
  const enc = (v) => { const x = Math.min(1, Math.max(0, v)); return Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)) }
  return '#' + rgb.map((v) => enc(v).toString(16).padStart(2, '0')).join('')
}
/* a hex's OKLab lightness — what the check measures the roll by */
export function okL(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  const l = Math.cbrt(0.4122214708 * r + 0.5363015620 * g + 0.0514770613 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
}

/* WCAG relative luminance — the contrast check warns, never enforces (ticket § Wiring 4) */
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }

/**
 * Roll a palette from a seeded rng — the same rng gives the same palette (plan 37 § 5.5). The hues
 * come from the DS harmony; FXR adds the spread, IN OKLCH (plan 39 § 4.3): a ground near black or
 * white, an ink on the far side of it, accents at one perceived lightness whatever their hue.
 * Stored as hex.
 */
export function rollPalette(rng, relation) {
  const rel = relation ?? RELATIONS[Math.floor(rng() * RELATIONS.length)].id
  const hue = rng() * 360
  const C = 0.09 + rng() * 0.1
  const L = 0.62 + rng() * 0.08
  const dark = rng() < 0.7
  let hues
  if (rel === 'monochromatic') hues = Array(5).fill(hue)
  else if (rel === 'random') hues = Array.from({ length: 5 }, () => rng() * 360)
  else hues = harmonyColors(hue, rel, { saturation: 70, lightness: 55 }).map((hex) => hexToHsl(hex).h)
  const [h0, h1, h2, h3, h4] = hues
  const roles = {
    bg: oklchToHex(dark ? 0.14 + rng() * 0.05 : 0.95 + rng() * 0.03, C * 0.25, h0),
    fg: oklchToHex(dark ? 0.93 + rng() * 0.04 : 0.2 + rng() * 0.05, C * 0.2, h1 ?? h0),
    accent: oklchToHex(L, C, h2 ?? h0),
    dim: oklchToHex(dark ? 0.4 + rng() * 0.06 : 0.74 + rng() * 0.06, C * 0.6, h3 ?? h0),
    warm: oklchToHex(dark ? L + 0.1 : L - 0.1, C, h4 ?? h0),
  }
  const colors = ROLES.map((r) => roles[r])
  return { id: 'rolled', name: 'Rolled', source: 'generated', relation: rel, roles, colors, contrastOk: contrast(roles.bg, roles.fg) >= 4.5 }
}

/**
 * The resolver — `themeParams()` generalised (plan 37 § 5.3). A colour param with a `role` takes the
 * palette's role; one without takes the palette's colours in turn (ROTATION) when `rotate` is on,
 * else keeps its value — themes switch roled params only, so a user's own colours survive.
 */
export function resolvePalette(params, schema, palette, { rotate = false } = {}) {
  const out = { ...params }
  let i = 0
  for (const p of schema || []) {
    if (p?.type !== 'color') continue
    if (p.role && palette.roles?.[p.role]) out[p.key] = palette.roles[p.role]
    else if (rotate && palette.colors?.length) out[p.key] = palette.colors[i++ % palette.colors.length]
  }
  return out
}
