import { CurveEditor as DsCurveEditor } from '@kolkrabbi/kol-component'
import { CLIPS, CURVE_KINDS, defaultCustomFor, forkClipDef } from '../../../loops/math/curves'
import { isValidVars } from '../../../loops/math/mathfn'

/**
 * CurveEditor — the math-curves loop's curve on kol-component's `CurveEditor` (lifted from this
 * file 2026-09-03; editor DS sync phase 3b, 2026-09-27 — this file was a second copy).
 *
 * What is the editor's: the engine's kinds, defaults, stock clips and expression compiler, and the
 * write. Fork-on-edit stays exactly as it was: while the layer shows a stock clip the editor shows
 * that clip, and the first commit writes `{ clip: 'custom', custom, ...extras }` — `extras` being
 * the copies / spiral the stock clip authored, unless the layer already moved them.
 */
export default function CurveEditor({ layer, patch }) {
  const isCustom = layer.clip === 'custom'
  const fork = isCustom ? null : forkClipDef(layer.clip)
  const stock = isCustom ? null : {
    label: (CLIPS.find((c) => c.id === layer.clip) || CLIPS[0]).label,
    copies: fork.copies,
    spiral: fork.spiral,
    layerCopies: layer.copies,
    layerSpiral: layer.spiral,
  }
  return (
    <DsCurveEditor
      value={isCustom ? (layer.custom ?? defaultCustomFor('polar')) : fork.def}
      stock={stock}
      onChange={(next, { extras }) => patch({ clip: 'custom', ...extras, custom: next })}
      validate={isValidVars}
      kinds={CURVE_KINDS}
      defaultFor={defaultCustomFor}
    />
  )
}
