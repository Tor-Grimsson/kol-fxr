// The EFFECTS pack — the filter catalog (filters/) and the Effects tab, registered into the core
// through the seam (editor/packs.js). Owns the filter chain on photo and loop layers.
import { registerPack } from '../editor/packs'
import { FILTERS, filterById } from '../filters'
import { makeSweep } from '../filters/sweeps'
import { runChain, invalidateSource } from '../filters/fxCore'
import EffectsPanel from '../editor/compose/inspectors/EffectsPanel'
import { effectCategories } from '../editor/compose/inspectors/effectCategories'

export const effects = {
  FILTERS, filterById, makeSweep, runChain, invalidateSource, effectCategories, EffectsPanel,
  /* GPU tiers stay lazy — loaded when a chain first needs them */
  loadPixiPipeline: () => import('../filters/pixi/pipeline.js'),
  loadGlHost: () => import('../filters/gl/host.js'),
}

registerPack('effects', effects)
