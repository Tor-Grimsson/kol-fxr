// The MOTION pack — kinetic type (kinetic/) and the timeline dock, registered into the core through
// the seam (editor/packs.js). Owns the `kinetic` layer type and the `canvas.footer` timeline slot.
// The clock (params/transport) and bindings (params/resolve) are NOT here: every generator is a
// function of time, so they are core. The clock's CONTROLS are (TransportBar — editor review #1,
// 2026-09-27): a core without motion shows no time controls.
import { registerPack } from '../editor/packs'
import { kineticPresetById, presetComp } from '../kinetic/presets'
import KineticType from '../kinetic/KineticType'
import { loadFonts, warmFontCss, kineticFontCss } from '../kinetic/fonts'
import KineticPanel from '../editor/compose/inspectors/KineticPanel'
import TimelineDock from '../editor/params/TimelineDock'
import TransportFab from '../editor/params/TransportFab'
import TransportBar from '../editor/params/TransportBar'

export const motion = {
  layerTypes: ['kinetic'],
  kineticPresetById, presetComp, KineticType, loadFonts, warmFontCss, kineticFontCss,
  KineticPanel, TimelineDock, TransportBar, TransportFab,
}

registerPack('motion', motion)
