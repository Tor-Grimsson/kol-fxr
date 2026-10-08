import { WIDTHS, WEIGHTS, familyFor } from './cuts'

/**
 * families.js — the font model (the 2026-08-12 typography-pass foundation).
 *
 * A text layer's FONT is a (family, style) pair, Figma-shaped:
 *   family — the typeface: Right Grotesk (the brand cut system), JetBrains
 *            Mono (shipped statics), or a Google family (webfont).
 *   style  — the family's own named variants. For Right Grotesk that is the
 *            cut × weight matrix ("Tight Dark", "Spatial Black"); for the
 *            others a weight list. A style resolves to a layer patch
 *            ({ width, weight }) so the storage model stays width/weight —
 *            nothing downstream breaks.
 *
 * Migration is READ-TIME: layers carry no `family` until touched, and the
 * legacy fake "Mono" width cut resolves to the JetBrains family — no data
 * sweep, old drafts keep working.
 *
 * Capability: only Right Grotesk ships parseable TTFs, so morph + vector
 * export are gated on `isOutlineFamily`. JetBrains (woff2-only) and Google
 * families (woff2 via the css2 API, no key needed) are RENDER families —
 * they draw live and export via the foreignObject fallback. Upgrading a
 * Google face to morphable needs its TTF (developer-API key or a proxy) —
 * that is the documented ceiling of this pass, not an oversight.
 */

/* ── the curated Google catalog (v1) ─────────────────────────────────────
 * Static so no API key is needed: the css2 endpoint serves any family
 * without one; only the full-catalog LISTING requires a key. Weights are
 * each family's real ranges, trimmed to the common stops. */
const GF = (css, weights) => ({ id: `google:${css}`, label: css, css, weights })
export const GOOGLE_FAMILIES = [
  GF('Inter', [100, 300, 400, 500, 600, 700, 900]),
  GF('Roboto', [100, 300, 400, 500, 700, 900]),
  GF('Open Sans', [300, 400, 500, 600, 700, 800]),
  GF('Montserrat', [100, 300, 400, 500, 600, 700, 900]),
  GF('Poppins', [100, 300, 400, 500, 600, 700, 900]),
  GF('Lato', [100, 300, 400, 700, 900]),
  GF('Oswald', [200, 300, 400, 500, 600, 700]),
  GF('Raleway', [100, 300, 400, 500, 600, 700, 900]),
  GF('Playfair Display', [400, 500, 600, 700, 800, 900]),
  GF('Merriweather', [300, 400, 700, 900]),
  GF('Lora', [400, 500, 600, 700]),
  GF('EB Garamond', [400, 500, 600, 700, 800]),
  GF('Libre Baskerville', [400, 700]),
  GF('Cormorant Garamond', [300, 400, 500, 600, 700]),
  GF('DM Sans', [100, 300, 400, 500, 600, 700, 900]),
  GF('DM Serif Display', [400]),
  GF('Space Grotesk', [300, 400, 500, 600, 700]),
  GF('Space Mono', [400, 700]),
  GF('IBM Plex Sans', [100, 300, 400, 500, 600, 700]),
  GF('IBM Plex Mono', [100, 300, 400, 500, 600, 700]),
  GF('Fira Code', [300, 400, 500, 600, 700]),
  GF('Source Code Pro', [200, 300, 400, 500, 600, 700, 900]),
  GF('Work Sans', [100, 300, 400, 500, 600, 700, 900]),
  GF('Manrope', [200, 300, 400, 500, 600, 700, 800]),
  GF('Sora', [100, 300, 400, 500, 600, 700, 800]),
  GF('Outfit', [100, 300, 400, 500, 600, 700, 900]),
  GF('Plus Jakarta Sans', [200, 300, 400, 500, 600, 700, 800]),
  GF('Figtree', [300, 400, 500, 600, 700, 900]),
  GF('Instrument Serif', [400]),
  GF('Fraunces', [100, 300, 400, 500, 600, 700, 900]),
  GF('Bricolage Grotesque', [200, 300, 400, 500, 600, 700, 800]),
  GF('Archivo', [100, 300, 400, 500, 600, 700, 900]),
  GF('Archivo Black', [400]),
  GF('Bebas Neue', [400]),
  GF('Anton', [400]),
  GF('Barlow', [100, 300, 400, 500, 600, 700, 900]),
  GF('Barlow Condensed', [100, 300, 400, 500, 600, 700, 900]),
  GF('Chivo', [100, 300, 400, 500, 600, 700, 900]),
  GF('Syne', [400, 500, 600, 700, 800]),
  GF('Unbounded', [200, 300, 400, 500, 600, 700, 900]),
  GF('Major Mono Display', [400]),
  GF('VT323', [400]),
  GF('Press Start 2P', [400]),
  GF('Caveat', [400, 500, 600, 700]),
  GF('Permanent Marker', [400]),
]

const googleById = new Map(GOOGLE_FAMILIES.map((f) => [f.id, f]))

/* ── family registry ────────────────────────────────────────────────── */
export const FAMILY_RG = 'right-grotesk'
export const FAMILY_JB = 'jetbrains-mono'

/* Family dropdown options — brand families first, then the Google shelf. */
export const FAMILY_OPTIONS = [
  { value: FAMILY_RG, label: 'Right Grotesk' },
  { value: FAMILY_JB, label: 'JetBrains Mono' },
  ...GOOGLE_FAMILIES.map((f) => ({ value: f.id, label: f.label })),
]

/* Read-time migration: `family` wins; the legacy fake "Mono" width cut IS
 * the JetBrains family; everything else is Right Grotesk. */
export function layerFamily(layer) {
  if (layer?.family) return layer.family
  return layer?.width === 'mono' ? FAMILY_JB : FAMILY_RG
}

/* The CSS font-family stack for a layer (or a {family,width} shaped value). */
export function familyCssFor(value) {
  const fam = layerFamily(value)
  if (fam === FAMILY_RG) return `'${familyFor(value.width)}', 'Right Grotesk', sans-serif`
  if (fam === FAMILY_JB) return `'JetBrains Mono', monospace`
  const gf = googleById.get(fam)
  return gf ? `'${gf.css}', sans-serif` : `'Right Grotesk', sans-serif`
}

/* Only Right Grotesk ships parseable TTFs — morph, Flatten and the vector
 * export path are gated on this. */
export const isOutlineFamily = (fam) => fam === FAMILY_RG

const weightLabel = (w) => WEIGHTS.find((x) => x.id === w)?.label ?? String(w)
const RG_WIDTHS = WIDTHS.filter((w) => w.id !== 'mono')

/* Styles per family — [{ value, label, patch }]. patch is what picking the
 * style writes onto the layer (width/weight); family is written separately. */
export function stylesFor(familyId) {
  if (familyId === FAMILY_RG) {
    const out = []
    for (const w of RG_WIDTHS) {
      for (const wt of WEIGHTS) {
        out.push({
          value: `${w.id}/${wt.id}`,
          label: `${w.label} ${wt.label}`,
          patch: { width: w.id, weight: wt.id },
        })
      }
    }
    return out
  }
  if (familyId === FAMILY_JB) {
    /* The shipped statics: Regular / Medium / SemiBold (+ italics via the
     * Italic toggle). width stays 'mono' so legacy consumers keep working. */
    return [400, 500, 600].map((wt) => ({
      value: `mono/${wt}`,
      label: wt === 400 ? 'Regular' : wt === 500 ? 'Medium' : 'SemiBold',
      patch: { width: 'mono', weight: wt },
    }))
  }
  const gf = googleById.get(familyId)
  if (!gf) return []
  return gf.weights.map((wt) => ({
    value: `g/${wt}`,
    label: weightLabel(wt),
    patch: { weight: wt },
  }))
}

/* The style value a layer currently sits on (for the Style dropdown). */
export function styleValueFor(layer) {
  const fam = layerFamily(layer)
  if (fam === FAMILY_RG) return `${layer.width ?? 'Tight'}/${layer.weight ?? 600}`
  if (fam === FAMILY_JB) return `mono/${[400, 500, 600].includes(layer.weight) ? layer.weight : 400}`
  return `g/${layer.weight ?? 400}`
}

/* Human name of the resolved font — the Inspector's Font line. */
export function fontNameFor(layer) {
  const fam = layerFamily(layer)
  if (fam === FAMILY_RG) return `${familyFor(layer.width)} · ${weightLabel(layer.weight)}${layer.italic ? ' · Italic' : ''}`
  if (fam === FAMILY_JB) return `JetBrains Mono · ${weightLabel(layer.weight)}${layer.italic ? ' · Italic' : ''}`
  const gf = googleById.get(fam)
  return `${gf?.label ?? fam} · ${weightLabel(layer.weight)}${layer.italic ? ' · Italic' : ''}`
}

/* ── Google webfont loading (render path) ───────────────────────────────
 * css2 <link> injection, deduped per family — serves woff2, no key needed.
 * Loads ALL the family's curated weights + italics in one request so style
 * hopping never pops. */
const loaded = new Set()
export function ensureFamilyLoaded(familyId) {
  if (!familyId?.startsWith?.('google:') || loaded.has(familyId)) return
  const gf = googleById.get(familyId)
  if (!gf || typeof document === 'undefined') return
  loaded.add(familyId)
  const axis = gf.weights.map((w) => `0,${w}`).concat(gf.weights.map((w) => `1,${w}`)).join(';')
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(gf.css).replace(/%20/g, '+')}:ital,wght@${axis}&display=swap`
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.kolFont = familyId
  document.head.appendChild(link)
}
