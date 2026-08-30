import { Dropdown, LabeledControl, ToggleSwitch } from '@kolkrabbi/kol-component'
import { useComposeState } from '../state'
import { ASPECTS } from '../../shell/aspects'
import { ColorField } from './LayerInspector'
import { NumberField } from './NumberField'
import { Section } from './Section'

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
      <Section label="Frame" first>
        <LabeledControl label="Size">
          <Dropdown
            variant="subtle"
            size="sm"
            className="w-full"
            options={PRESET_OPTIONS}
            value={aspect}
            onChange={setAspect}
          />
        </LabeledControl>

        <LabeledControl label="Dimensions">
          <div className="grid grid-cols-2 gap-2">
            <SizeField label="W" value={canvasW} onCommit={(w) => setCanvasSize(w, canvasH)} num={num} />
            <SizeField label="H" value={canvasH} onCommit={(h) => setCanvasSize(canvasW, h)} num={num} />
          </div>
        </LabeledControl>

        <ToggleSwitch variant="plain" label="Grid" checked={showGrid} onChange={toggleGrid} />
      </Section>

      <Section label="Background">
        <ColorField
          label="Background"
          hideLabel
          value={canvasFill}
          onChange={setCanvasFill}
          palette={palette}
          autoValue="var(--kol-surface-ab-split)"
        />
        <LabeledControl label="Fill opacity">
          {/* Input, not a slider (user ruling 2026-08-12: one-shot values
            * are typed, not dragged). */}
          <NumberField
            variant="filled" size="sm" chars={4} suffix="%"
            value={Math.round((canvasFillOpacity ?? 1) * 100)}
            onCommit={(raw) => {
              const n = Number(raw)
              if (Number.isFinite(n)) setCanvasFillOpacity(Math.min(1, Math.max(0, n / 100)))
            }}
          />
        </LabeledControl>

        <ColorField
          label="Infinite"
          value={infiniteFill}
          onChange={setInfiniteFill}
          palette={palette}
          autoValue="var(--kol-surface-secondary)"
        />
      </Section>
    </div>
  )
}

/* Dimension field — the shared NumberField draft/commit core (typing "1920"
 * doesn't reshape the canvas at "1", "19", "192") with the W/H letter as an
 * IN-SHELL prefix (the 2026-08-12 prefixed-input idiom). */
function SizeField({ label, value, onCommit, num }) {
  return (
    <NumberField
      variant="filled"
      size="sm"
      chars={5}
      prefix={label}
      className="w-full min-w-0"
      value={value}
      onCommit={(raw) => onCommit(num(raw, value))}
    />
  )
}
