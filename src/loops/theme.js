import { resolveTheme } from './lib/themes.js'
import { themeAsPalette, resolvePalette } from '../editor/color/palette.js'

// Recolour a loop's params object by each colour-param's tagged `role`. A loop's
// `type:'color'` schema entries carry `role: 'bg' | 'fg' | 'accent' | 'dim' |
// 'warm'`; we resolve the chosen theme (+ invert) and patch every roled colour
// to the theme's slot. dim/warm complete the five-role penrose scheme (labs
// PenrosePage retints them per theme, accent-falling-back when a theme lacks
// them). Params without a role (or non-colour params) are left untouched, so
// structural values and any user edits to non-roled colours survive a switch.
// Since plan 37 § 5.3 this is the palette resolver with a theme as the palette —
// one resolver for themes, rolls and loaded palettes.
export function themeParams(params, paramSchema, themeId, invert) {
  return resolvePalette(params, paramSchema, themeAsPalette(resolveTheme(themeId, invert)))
}
