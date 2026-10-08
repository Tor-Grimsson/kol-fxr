import { useMemo } from 'react'
import MorphDialog from './MorphDialog'
import { useMorphDialog, closeMorph } from './morphDialogStore'
import { buildMorph, loopSnapshot } from './buildMorph'
import { useComposeState } from '../compose/state'
import { useGeneratorLibrary } from '../library/LibraryProvider'
import { findLayerDeep } from '../compose/helpers'
import { pack } from '../packs'
import { transport, useTransport } from '../params/transport'

/**
 * MorphDialogHost — binds `MorphDialog` to the editor: the generator on the
 * stage (labs' one loop layer, or the selected loop layer in the compositor),
 * the library's presets of that generator, and the one write — P1's params
 * with tracks where the N differ — as ONE history entry. Mounted once inside
 * the provider stack, in labs and in the editor; the File tab opens it
 * through the store.
 */
export default function MorphDialogHost() {
  const { open } = useMorphDialog()
  const { layers, selectedId, updateLayer, beginTransaction, commitTransaction } = useComposeState()
  const { library } = useGeneratorLibrary()
  const { loopSeconds } = useTransport()

  const selected = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const current = selected?.type === 'loop' ? selected : (layers.find((l) => l.type === 'loop') ?? null)
  const def = current ? pack('generators')?.loopById?.(current.loopId) ?? null : null
  const schema = def?.params ?? []
  const presets = useMemo(
    () => (current ? (library.preset ?? []).filter((it) => loopSnapshot(it, current.loopId)) : []),
    [library, current?.loopId], // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (!open) return null

  const onBuild = ({ snapshots, curve, cycle, seconds }) => {
    const { patch } = buildMorph({ snapshots, schema, curve, cycle })
    beginTransaction()
    updateLayer(current.id, patch)
    commitTransaction()
    if (Number.isFinite(seconds) && seconds > 0) transport.setLoopSeconds(seconds)
    closeMorph()
  }

  return (
    <MorphDialog
      open
      onClose={closeMorph}
      presets={presets}
      current={current}
      loopLabel={def?.label ?? current?.loopId ?? ''}
      schema={schema}
      defaultLoopSeconds={loopSeconds}
      onBuild={onBuild}
    />
  )
}
