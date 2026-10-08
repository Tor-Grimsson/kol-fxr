import { useMemo } from 'react'
import { TimelineDock as DsTimelineDock } from '@kolkrabbi/kol-component'
import { useComposeState } from '../compose/state'
import { labelForLayer } from '../compose/labels'
import { EASING_OPTIONS } from './easing'
import { isBinding } from './resolve'
import { useTransport } from './transport'

/**
 * TimelineDock — the keyframe timeline under the canvas (the motion pack's `canvas.footer`), on
 * kol-component's `TimelineDock` (lifted from this file; editor DS sync phase 3c, 2026-09-27 —
 * this file carried its own ruler, lanes and key editor). What is the editor's: finding the tracks
 * (every prop bound to Keyframes, anywhere in the layer tree), the clock, and the write through
 * `updateLayer`. The dock renders nothing while there are no tracks.
 */

/* Walk the layer tree, collecting every keyframe-track binding. */
function collectTracks(layers, out = []) {
  for (const l of layers) {
    for (const k in l) {
      const v = l[k]
      if (isBinding(v) && v.bind === 'track') out.push({ id: `${l.id}:${k}`, layerId: l.id, key: k, label: `${labelForLayer(l)} · ${k}`, keys: v.keys })
    }
    if (Array.isArray(l.children)) collectTracks(l.children, out)
  }
  return out
}

export default function TimelineDock() {
  const { layers, updateLayer } = useComposeState()
  const { t, seek } = useTransport()
  const tracks = useMemo(() => collectTracks(layers), [layers])
  const onChange = (trackId, keys) => {
    const track = tracks.find((x) => x.id === trackId)
    if (track) updateLayer(track.layerId, { [track.key]: { bind: 'track', keys } })
  }
  return <DsTimelineDock tracks={tracks} t={t} onSeek={seek} onChange={onChange} easingOptions={EASING_OPTIONS} />
}
