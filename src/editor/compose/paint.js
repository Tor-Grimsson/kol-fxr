/**
 * paint.js — per-paint alpha + visibility (the Figma fill/stroke row, T5
 * 2026-08-12). A layer's fill/stroke each carry `fillOpacity`/`strokeOpacity`
 * (0..1, default 1) and `fillHidden`/`strokeHidden` (the row's eye).
 *
 * Live render uses color-mix (vars + hexes both work); export prefers
 * rgba() from a hex so the SVG opens outside browsers.
 */
export function paintAlpha(color, opacity, hidden) {
  if (!color) return color
  const a = hidden ? 0 : (opacity ?? 1)
  if (a >= 1) return color
  return `color-mix(in srgb, ${color} ${Math.round(a * 100)}%, transparent)`
}

export function paintAlphaExport(color, opacity, hidden) {
  if (!color) return color
  const a = hidden ? 0 : (opacity ?? 1)
  if (a >= 1) return color
  const m = /^#([0-9a-f]{6})$/i.exec(color)
  if (!m) return paintAlpha(color, opacity, hidden)
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.round(a * 100) / 100})`
}
