// The GENERATORS pack — the loop catalog (loops/) and the inspectors that edit it, registered
// into the core through the seam (editor/packs.js). Owns the `loop` and `misc` layer types.
import { registerPack } from '../editor/packs'
import {
  loopById, loopDrawParams, resolveCameraKeys, loopBgToggleable, presetById, presetParams,
  presetsInGroup, presetsInSub, presetLayerPatch, isToolPreset, groupById,
} from '../loops/registry'
import { drawLoopFrame } from '../loops/lib/viewport'
import { GENERATIVE_TREE, MISC_TREE } from '../loops/taxonomy'
import { THEME_OPTIONS } from '../loops/lib/themes'
import { buildParatypeFlattenGroup } from '../loops/paratype/flatten.js'
import { LoopPicker } from '../editor/compose/inspectors/LoopPicker'
import { LoopFields } from '../editor/compose/inspectors/LoopFields'

export const generators = {
  layerTypes: ['loop', 'misc'],
  loopById, loopDrawParams, resolveCameraKeys, loopBgToggleable, presetById, presetParams,
  presetsInGroup, presetsInSub, presetLayerPatch, isToolPreset, groupById,
  drawLoopFrame, GENERATIVE_TREE, MISC_TREE, THEME_OPTIONS, buildParatypeFlattenGroup,
  LoopPicker, LoopFields,
  /* the three.js engines stay lazy — loaded when an engine layer first renders */
  loadGlHost: () => import('../loops/gl/host.js'),
}

registerPack('generators', generators)
