import { HARMONIES, harmonyColors, hexToHsl, hslToHex } from '@kolkrabbi/kol-component'
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

/* WCAG relative luminance — the contrast check warns, never enforces (ticket § Wiring 4) */
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }

/**
 * Roll a palette from a seeded rng — the same rng gives the same palette (plan 37 § 5.5). The hues
 * come from the DS harmony; FXR adds the spread: a ground near black or white, an ink on the far
 * side of it, accents at the base's own saturation.
 */
export function rollPalette(rng, relation) {
  const rel = relation ?? RELATIONS[Math.floor(rng() * RELATIONS.length)].id
  const hue = rng() * 360
  const s = 45 + rng() * 40
  const l = 48 + rng() * 14
  const dark = rng() < 0.7
  let hues
  if (rel === 'monochromatic') hues = Array(5).fill(hue)
  else if (rel === 'random') hues = Array.from({ length: 5 }, () => rng() * 360)
  else hues = harmonyColors(hue, rel, { saturation: s, lightness: l }).map((hex) => hexToHsl(hex).h)
  const [h0, h1, h2, h3, h4] = hues
  const roles = {
    bg: hslToHex(h0, s * 0.35, dark ? 6 + rng() * 6 : 92 + rng() * 5),
    fg: hslToHex(h1 ?? h0, s * 0.25, dark ? 90 + rng() * 6 : 8 + rng() * 6),
    accent: hslToHex(h2 ?? h0, s, l),
    dim: hslToHex(h3 ?? h0, s * 0.6, dark ? 30 + rng() * 10 : 62 + rng() * 10),
    warm: hslToHex(h4 ?? h0, s, dark ? l + 12 : l - 12),
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
