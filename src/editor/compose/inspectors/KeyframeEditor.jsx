import { KeyframeEditor as DsKeyframeEditor } from '@kolkrabbi/kol-component'
import { EASE_OPTIONS } from '../../../loops/gl/primitiveEasing'
import { DEFAULT_KEYFRAMES } from '../../../loops/gl/primitiveKeyframes'
import { layerCycles } from '../../../loops/gl/phase'
import { transport } from '../../params/transport'

/**
 * KeyframeEditor — the layer's `keyframes` param on kol-component's `KeyframeEditor` (lifted from
 * this file 2026-09-03; editor DS sync phase 3b, 2026-09-27 — this file was a second copy).
 *
 * What is the editor's: the track is the layer's param, written through the panel's coalesced
 * `patch`; the engine's easings and default track; and the clock. The layer's phase runs `cycles`
 * engine loops per transport loop (phase.js), so a key's local `t` is the global playhead
 * `t / cycles`, and "Add @ playhead" stamps the local phase at the moment of the click.
 */
export default function KeyframeEditor({ layer, patch, defaultDuration = 8 }) {
  const cycles = () => layerCycles(layer.duration ?? defaultDuration, transport.getLoopSeconds())
  return (
    <DsKeyframeEditor
      keyframes={layer.keyframes}
      onChange={(next) => patch({ keyframes: next })}
      t={() => (transport.getT() * cycles()) % 1}
      onPause={() => transport.pause()}
      onSeek={(t) => transport.seek(t / cycles())}
      easeOptions={EASE_OPTIONS}
      defaultKeyframes={DEFAULT_KEYFRAMES}
    />
  )
}
