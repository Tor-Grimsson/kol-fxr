import { groupById } from '../../loops/registry'
import { resolvedChain } from '../compose/filterChain'

/* What labs' touch sheet reads for the one layer — the generator's two forms: `group · preset` on
 * the open panel's header, the preset alone on the collapsed pill (user ruling 2026-08-12). */
export function sheetLabels(layer) {
  if (!layer) return { title: 'Labs', pill: 'Labs' }
  if (layer.type === 'loop' || layer.type === 'misc') {
    return { title: `${groupById(layer.loopGroup)?.label ?? 'Labs'} · ${layer.presetLabel}`, pill: layer.presetLabel }
  }
  if (layer.type === 'photo') {
    const fx = resolvedChain(layer)[0]?.def?.label ?? 'Media'
    return { title: fx, pill: fx }
  }
  const name = layer.presetLabel ?? 'Labs'
  return { title: name, pill: name }
}
