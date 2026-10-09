import { useColorTarget } from '../../color/useColorTarget'
import Pane from '../../components/Pane'
import { Dropdown, SettingsRow, ToggleSwitch } from '@kolkrabbi/kol-component'
import { useControlSize, RAIL_LABEL_W } from '../../params/controlSize'
import { useComposeState } from '../state'
import { ASPECTS } from '../../shell/aspects'
import { ColorField } from './LayerInspector'
import { NumberField } from './NumberField'

/**
 * CanvasInspector — properties for the canvas/frame "layer".
 *
 * The canvas is the bottom-most selectable item in the layer stack (and the
 * inspector's default when nothing is selected). Owns the output size
 * (preset or custom W×H px), grid visibility, background color + hex, and
 * fill opacity. The 1080-virtual coordinate space is unchanged — W×H drive
 * the frame ratio + export resolution only.
 */
const PRESET_OPTIONS = ASPECTS.map((a) => ({ value: a.id, label: a.label }))

export default function CanvasInspector() {
  /* writes through the colour target (editor review #12, 2026-09-27): setCanvasFill alone left the
   * shared paint pair stale, so the colour window showed white over a red canvas */
  const target = useColorTarget()
  const cs = useControlSize()
  const {
    aspect, setAspect,
    canvasW, canvasH, setCanvasSize,
    showGrid, toggleGrid,
    canvasFill, setCanvasFill,
    canvasFillOpacity, setCanvasFillOpacity,
    infiniteFill, setInfiniteFill,
    palette,
  } = useComposeState()

  const num = (v, fallback) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback
  }

  /* Purpose-divided sections (2026-08-12 restructure, the Figma model):
   * Frame (size + dimensions + grid) · Background (fill + opacity + the
   * infinite backdrop). */
  return (
    <div className="flex flex-col">
      <Pane label="Frame">
        <div className="flex flex-col gap-1">
          <Dropdown
            variant="subtle"
            size={cs}
            className="w-full"
            options={PRESET_OPTIONS}
            value={aspect}
            onChange={setAspect}
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-2 gap-2">
            <SizeField label="W" value={canvasW} onCommit={(w) => setCanvasSize(w, canvasH)} num={num} />
            <SizeField label="H" value={canvasH} onCommit={(h) => setCanvasSize(canvasW, h)} num={num} />
          </div>
        </div>

        {/* a switch row: label left, the switch at the row's end, on the rail's rung (spec R5.6, R6.3) */}
        <SettingsRow label="Grid" labelWidth={RAIL_LABEL_W}>
          <ToggleSwitch size={cs} checked={showGrid} onChange={toggleGrid} aria-label="Grid" />
        </SettingsRow>
      </Pane>

      <Pane label="Background">
        <ColorField
          label="Background"
          hideLabel
          value={canvasFill}
          onChange={target.setFill}
          palette={palette}
          autoValue="var(--kol-surface-ab-split)"
        />
        <SettingsRow label="Fill opacity" align="fill" labelWidth={RAIL_LABEL_W}>
          {/* Input, not a slider (user ruling 2026-08-12: one-shot values
            * are typed, not dragged). */}
          <NumberField
            variant="filled" size={cs} chars={3} suffix="%"
            value={Math.round((canvasFillOpacity ?? 1) * 100)}
            onCommit={(raw) => {
              const n = Number(raw)
              if (Number.isFinite(n)) setCanvasFillOpacity(Math.min(1, Math.max(0, n / 100)))
            }}
          />
        </SettingsRow>

        <ColorField
          inline
          label="Infinite"
          value={infiniteFill}
          onChange={setInfiniteFill}
          palette={palette}
          autoValue="var(--kol-surface-secondary)"
        />
      </Pane>
    </div>
  )
}

/* Dimension field — the shared NumberField draft/commit core (typing "1920"
 * doesn't reshape the canvas at "1", "19", "192") with the W/H letter as an
 * IN-SHELL prefix (the 2026-08-12 prefixed-input idiom). */
/* The property grid (spec R5.5): letter affordance, the field fills its cell. */
function SizeField({ label, value, onCommit, num }) {
  const cs = useControlSize()
  return (
    <NumberField
      variant="property"
      size={cs}
      affordance={label}
      className="w-full min-w-0"
      value={value}
      onCommit={(raw) => onCommit(num(raw, value))}
    />
  )
}
