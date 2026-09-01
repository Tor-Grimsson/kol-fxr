import { useEffect, useRef, useState } from 'react'
import { Button } from '@kolkrabbi/kol-component'
import { useComposeState } from '../compose/state'
import { useLabsLayer } from '../labs/useLabsLayer'
import { buildLabsCatalog, SECTION_ICONS } from '../labs/catalog'
import { SPREAD, useSheetChrome } from './CategoryScreen'

/**
 * LabsBrowseScreen — the labs CATALOG as a mobile sheet (plan
 * 02-labs-mobile-and-vector step 5). The same `buildLabsCatalog` stream the
 * desktop rail folds into NavRail renders here as EffectScreen's two-level
 * card: level 1 = the groups under their section eyebrows, level 2 = a
 * group's category leaves. A leaf press runs the CATALOG's own dispatch —
 * the swap-not-stack pick desktop labs does — so the two chromes cannot
 * disagree about what a pick means.
 *
 * Modulation is deliberately absent: its entry points are the params rail's
 * bind dots, which the mobile chrome does not render.
 */
export default function LabsBrowseScreen({ onPicked, onBack }) {
  const [groupId, setGroupId] = useState(null)
  useSheetChrome(() => (groupId ? setGroupId(null) : onBack()))

  const { addFilter, patchFilter } = useComposeState()
  const { layer, setOnly } = useLabsLayer()

  /* The carried-source policy, same as LabsNav: the media a photo layer holds
   * survives a hop through generative picks and re-seeds the next effect. */
  const lastSourceRef = useRef(null)
  useEffect(() => {
    if (layer?.type === 'photo' && layer.src) {
      lastSourceRef.current = { src: layer.src, srcType: layer.srcType, fit: layer.fit }
    }
  }, [layer?.type, layer?.src, layer?.srcType, layer?.fit])
  const carriedSource = () => (
    layer?.type === 'photo'
      ? { src: layer.src, srcType: layer.srcType, fit: layer.fit }
      : (lastSourceRef.current ?? {})
  )

  const stream = buildLabsCatalog({ layer, setOnly, addFilter, patchFilter, carriedSource })

  /* Fold the stream into sections, dropping Modulation (no bind dots here). */
  const sections = []
  for (const entry of stream) {
    if (entry.id.startsWith('sec:')) {
      sections.push({ key: entry.id.slice(4), label: entry.label, groups: [] })
      continue
    }
    sections[sections.length - 1]?.groups.push(entry)
  }
  const visible = sections.filter((s) => s.key !== 'modulation' && s.groups.some((g) => g.pages?.length))

  const group = visible.flatMap((s) => s.groups).find((g) => g.id === groupId) ?? null
  /* Nested generative rows ({ label, children }) flatten to "Group · Category". */
  const leaves = group
    ? (group.pages ?? []).flatMap((p) => (p.children ? p.children.map((c) => ({ ...c, label: `${p.label} · ${c.label}` })) : [p]))
    : []

  const pick = (leaf) => {
    leaf.onSelect?.()
    onPicked?.()
  }

  return (
    <div className="fixed inset-y-0 right-0 left-[var(--fxr-rail,0px)] kol-overlay-scrim flex flex-col items-center overflow-y-auto p-6" style={{ zIndex: 'var(--kol-z-modal)' }}>
      <div
        className="my-auto w-full max-w-sm rounded p-8 flex flex-col gap-6"
        style={{ background: 'var(--kol-surface-primary)' }}
      >
        {group ? (
          <>
            <div className="kol-eyebrow text-body">{group.label}</div>
            <div className="flex flex-col gap-2">
              {leaves.map((leaf) => (
                <Button
                  key={leaf.label}
                  variant="primary"
                  size="lg"
                  className={SPREAD}
                  iconLeft={group.icon}
                  iconRight={group.icon}
                  onClick={() => pick(leaf)}
                >
                  {leaf.label}
                </Button>
              ))}
            </div>
          </>
        ) : (
          visible.map((s) => (
            <div key={s.key} className="flex flex-col gap-2">
              <div className="kol-eyebrow text-body">{s.label}</div>
              {s.groups.map((g) => (
                <Button
                  key={g.id}
                  variant="primary"
                  size="lg"
                  className={SPREAD}
                  iconLeft={g.icon ?? SECTION_ICONS[s.key] ?? 'square'}
                  iconRight={g.icon ?? SECTION_ICONS[s.key] ?? 'square'}
                  onClick={() => setGroupId(g.id)}
                >
                  {g.label}
                </Button>
              ))}
            </div>
          ))
        )}
        {/* Back unwinds one level: out of a group first, then out of the sheet. */}
        <Button
          variant="grey"
          size="lg"
          className={SPREAD}
          iconLeft="arrow-left"
          iconRight="arrow-left"
          onClick={() => (group ? setGroupId(null) : onBack())}
        >
          Back
        </Button>
      </div>
    </div>
  )
}
