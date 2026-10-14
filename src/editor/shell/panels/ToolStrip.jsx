import { ToolPalette as DsToolPalette, SwatchStack } from '@kolkrabbi/kol-component'
import { useTool } from '../../state/tools'
import { useComposeState } from '../../compose/state'
import { useColorTarget } from '../../color/useColorTarget'
import { pack } from '../../packs'
import { key, tool, variant, SHAPES, DIVIDER } from './toolItems'

/**
 * ToolStrip — THE TOOLS, one icon wide, at the far left of the grid (plan 31 § 2; Affinity's Tools):
 * the creation folds, a divider, the navigation fold, and the fill/stroke pair at the foot — the
 * Color pane's own `SwatchStack`, reading the active paint; a press opens that paint's tab. The
 * actions (rotate · boolean · image · crop · duplicate) are the band's (`ActionBar`), never here.
 *
 * `orientation="vertical"` is kol-component's (0.256.0, `ToolPaletteVertical` filed from here): a
 * one-button-wide column, hairline dividers across it, folds opening to its right.
 */
export default function ToolStrip() {
  const { tool: active, setTool } = useTool()
  const { addLayer } = useComposeState()
  const target = useColorTarget()

  /* related tools fold (spec R9.3); no glyph meaning two things (R9.2) */
  const items = [
    { kind: 'split', id: 'select-fold', label: 'Select', variants: [
      variant('select'),
      /* Node select = A (edit the selection's nodes); a one-shot row until it is a tool. The glyph is
         a stand-in — a `node-select` cut is owed (plan 17). */
      { id: 'node', label: 'Node select', icon: 'arrow-upleft', shortcut: key('node-edit'), action: true },
    ] },
    /* Line rides the pen's fold (R9.3): both draw a stroke between points */
    { kind: 'split', id: 'pen-fold', label: 'Pen', variants: [variant('pen'), variant('line')] },
    { kind: 'split', id: 'shape-fold', label: 'Shape', variants: SHAPES },
    { kind: 'split', id: 'text-fold', label: 'Text', variants: [
      variant('text'),
      /* kinetic type is the motion pack's (editor/packs.js) — a one-shot row in the tool fold;
         `type-02`, because `type` is the Text tool (R9.2) */
      ...(pack('motion') ? [{ id: 'kinetic', label: 'Kinetic type', icon: 'type-02', action: true }] : []),
    ] },
    tool('pattern'),
    DIVIDER,
    { kind: 'split', id: 'zoom-fold', label: 'Zoom', variants: [variant('zoom'), variant('hand'), variant('orbit')] },
  ]

  const onAction = (id) => {
    if (id === 'kinetic') addLayer('kinetic')
    else if (id === 'node') window.dispatchEvent(new CustomEvent('kol:node-edit'))
  }
  /* a tool fold's one-shot rows land here too when the trigger re-arms them */
  const onSelect = (id) => (id === 'node' || id === 'kinetic' ? onAction(id) : setTool(id))
  const openPaint = () => window.dispatchEvent(new CustomEvent('kol:open-color-pane', { detail: { tab: target.activePaint === 'stroke' ? 'Stroke' : 'Colour' } }))

  return (
    <>
      <DsToolPalette items={items} activeId={active} onSelect={onSelect} onAction={onAction}
        size="md" orientation="vertical" className="py-2" />
      <div className="mt-auto flex justify-center pb-3 cursor-pointer" onClick={openPaint} title="Fill / Stroke">
        <SwatchStack fillColor={target.fillHex ?? '#FFFFFF'} strokeColor={target.strokeHex ?? '#000000'} activePaint={target.activePaint} onSwap={target.swap} />
      </div>
    </>
  )
}
