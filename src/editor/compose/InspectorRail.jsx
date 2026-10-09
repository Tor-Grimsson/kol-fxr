import { Button, Dropdown, Tooltip, glyphSize, InspectorRail as DsInspectorRail } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { NumberField } from './inspectors/NumberField'
import { BLEND_MODES } from './LayerStack'
import Pane from '../components/Pane'
import { useComposeState } from './state'
import { findLayerDeep } from './helpers'
import { useControlSize } from '../params/controlSize'
import LayerInspector   from './inspectors/LayerInspector'
import CanvasInspector  from './inspectors/CanvasInspector'
import AlignmentPanel   from './AlignmentPanel'

/**
 * InspectorRail — the editor's Tool Properties panel: kol-component's `InspectorRail` (the
 * selection routing, lifted from this file 2026-09-03) fed the compose store and the editor's
 * three panels. Editor DS sync phase 3b (2026-09-27): this file used to carry its own copy of the
 * routing; now it is the wiring only.
 *
 * Routes: canvas → CanvasInspector (wins over multi-select) · one layer → LayerInspector ·
 * two or more → the multi-select summary with Group · nothing → an empty rail.
 */
export default function InspectorRail() {
  const { selectedIds, layers } = useComposeState()
  return (
    <DsInspectorRail
      className="kol-compose-rail kol-compose-rail--inspector"
      selectedIds={selectedIds}
      canvasId="canvas"
      renderers={{
        canvas: () => <CanvasInspector />,
        single: (id) => {
          const layer = findLayerDeep(layers, id)
          return layer ? <LayerInspector layer={layer} /> : null
        },
        multi: (ids) => <MultiInspector ids={ids} />,
      }}
    />
  )
}

/* MULTI-SELECT SHOWS WHAT THE LAYERS SHARE (the walk: two rects selected left the rail empty but a
 * count; Figma shows the shared properties): alignment, then Opacity and Blend written to every
 * selected layer — a field whose layers disagree reads empty ("Mixed"). */
function MultiInspector({ ids }) {
  const cs = useControlSize()
  const { layers, groupLayers, updateLayer } = useComposeState()
  const sel = ids.map((id) => findLayerDeep(layers, id)).filter((l) => l && !l.locked)
  const same = (get) => (sel.length && sel.every((l) => get(l) === get(sel[0])) ? get(sel[0]) : null)
  const opacity = same((l) => Math.round((l.opacity ?? 1) * 100))
  const blend = same((l) => l.blend ?? 'normal')
  const writeAll = (patch) => sel.forEach((l) => updateLayer(l.id, patch))
  return (
    <>
      <Pane label="Transform">
        <p className="kol-mono-12 text-meta">{ids.length} layers selected.</p>
        <AlignmentPanel />
      </Pane>
      <Pane label="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <Tooltip label="Opacity" triggerClassName="flex min-w-0">
            <NumberField
              variant="property" size={cs} unit="%" className="w-full min-w-0"
              affordance={<Icon name="opacity" size={glyphSize(cs)} />}
              value={opacity ?? ''} placeholder="Mixed"
              onCommit={(raw) => {
                const n = Number(raw)
                if (raw !== '' && Number.isFinite(n)) writeAll({ opacity: Math.min(1, Math.max(0, n / 100)) })
              }}
            />
          </Tooltip>
          <Dropdown
            variant="subtle" size={cs} className="w-full"
            options={BLEND_MODES}
            value={blend ?? ''}
            onChange={(v) => writeAll({ blend: v })}
          />
        </div>
        <Button tone="primary" size={cs} className="w-full" iconLeft="component-01" onClick={() => groupLayers(ids)}>
          Group selection
        </Button>
      </Pane>
    </>
  )
}
