import { useState } from 'react'
import { Button } from '@kolkrabbi/kol-component'
import { FILTERS } from '../../filters'
import { effectHost, flatCategories } from '../compose/inspectors/effectCategories'
import { SPREAD, useSheetChrome } from './CategoryScreen'

/**
 * EffectScreen — the mobile "Add effect" picker, CategoryScreen's card.
 *
 * The Effects TAB owns the chain (what's applied, remove, randomize); this
 * sheet is only the two-level browse that adds one, exactly as the Generate
 * tab's "Generator" button opens the generator list. Two taps beats one
 * 60-button scroll on a phone, and it mirrors the desktop panel's
 * Category → Effect pair.
 *
 * The catalog and the host rule come from `effectCategories.js`
 * (`effectHost` / `flatCategories`), the same functions the desktop Effects
 * panel reads, so the two surfaces cannot disagree about what a layer hosts.
 */
export default function EffectScreen({ layer, chain, onPick, onBack }) {
  const [catId, setCatId] = useState(null)
  useSheetChrome(onBack)

  const { engineHost } = effectHost(layer)
  /* One GL stage max, and only on a host whose live pixels can feed it. */
  const engineOk = engineHost && !chain.some((s) => s.def?.kind === 'engine')
  const available = FILTERS.filter((f) => f.kind !== 'engine' || engineOk)
  const categories = flatCategories(available)
  const category = categories.find((c) => c.id === catId) ?? null

  return (
    <div className="fixed inset-y-0 right-0 left-[var(--fxr-rail,0px)] kol-overlay-scrim flex flex-col items-center overflow-y-auto p-6" style={{ zIndex: 'var(--kol-z-modal)' }}>
      <div
        className="my-auto w-full max-w-sm rounded p-8 flex flex-col gap-6"
        style={{ background: 'var(--kol-surface-primary)' }}
      >
        <div className="kol-eyebrow text-body">{category ? category.label : 'Pick an effect'}</div>
        <div className="flex flex-col gap-2">
          {(category ? category.filters : categories).map((item) => (
            <Button
              key={item.id}
              variant="primary"
              size="lg"
              className={SPREAD}
              iconLeft={category ? 'filter' : 'chevron-right'}
              iconRight={category ? 'filter' : 'chevron-right'}
              onClick={() => (category ? onPick(item.id) : setCatId(item.id))}
            >
              {item.label}
            </Button>
          ))}
        </div>
        {/* Back unwinds one level: out of a category first, then out of the
            sheet — the phone has no second way out. */}
        <Button
          variant="grey"
          size="lg"
          className={SPREAD}
          iconLeft="arrow-left"
          iconRight="arrow-left"
          onClick={() => (category ? setCatId(null) : onBack())}
        >
          Back
        </Button>
      </div>
    </div>
  )
}
