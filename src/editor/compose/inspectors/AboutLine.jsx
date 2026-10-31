import { aboutOf } from '../../../loops/about'

/** WHAT THIS IS, under Preset (plan 49 6.1): kind · engine · 2D/3D, then what it is built on. */
export default function AboutLine({ def, isFilter = false }) {
  const a = aboutOf(def, isFilter)
  if (!a) return null
  return (
    <p className="kol-helper-12 text-meta px-1 pt-1 pb-2">
      <span className="text-emphasis">{a.kind} · {a.engine} · {a.dimension}</span>
      {a.basis && <><br />{a.basis}</>}
    </p>
  )
}
