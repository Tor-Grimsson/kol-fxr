import { useCallback } from 'react'
import { useComposeState } from '../compose/state'

/**
 * Labs' one-layer invariant — the composition IS a single layer, so picking
 * from the nav SWAPS it rather than stacking a new one. Adding layers is
 * exactly the compositor model labs mode drops (plan.md Phase 11.2).
 *
 *   same type → patch in place (LoopPicker's type-hop semantics: a preset is
 *               a full param RESET, and lingering off-schema keys are the
 *               accepted model there)
 *   new type  → replace it
 *
 * Either way it's one undo entry, and any stray layers are reaped first so a
 * labs document can never accumulate a stack.
 */
export function useLabsLayer() {
  const {
    layers, addLayer, removeLayer, updateLayer, select,
    beginTransaction, commitTransaction,
  } = useComposeState()

  const setOnly = useCallback((type, patch) => {
    const [keep, ...strays] = layers
    beginTransaction()
    for (const l of strays) removeLayer(l.id)
    let id
    if (keep && keep.type === type) {
      updateLayer(keep.id, patch)
      select(keep.id)
      id = keep.id
    } else {
      if (keep) removeLayer(keep.id)
      id = addLayer(type, patch)   /* addLayer already selects the new layer */
    }
    commitTransaction()
    return id
  }, [layers, addLayer, removeLayer, updateLayer, select, beginTransaction, commitTransaction])

  return { layer: layers[0] ?? null, setOnly }
}
