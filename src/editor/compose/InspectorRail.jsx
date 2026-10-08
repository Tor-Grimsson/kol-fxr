import { Button, InspectorSection, InspectorRail as DsInspectorRail } from '@kolkrabbi/kol-component'
import { useComposeState } from './state'
import { findLayerDeep } from './helpers'
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
  const { selectedIds, layers, groupLayers } = useComposeState()
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
        multi: (ids) => (
          <InspectorSection pane>
            <p className="kol-helper-12 text-meta">{ids.length} layers selected.</p>
            <AlignmentPanel />
            <Button
              tone="primary"
              size="sm"
              className="w-full"
              iconLeft="component-01"
              onClick={() => groupLayers(ids)}
            >
              Group selection
            </Button>
          </InspectorSection>
        ),
      }}
    />
  )
}
