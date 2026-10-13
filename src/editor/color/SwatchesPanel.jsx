import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Button, Dropdown, SearchInput, Tooltip } from '@kolkrabbi/kol-component'
import { ColorSwatch } from '@kolkrabbi/kol-component'
import { resolveCssVar } from './cssVar'
import { useControlSize } from '../params/controlSize'

/**
 * SwatchesPanel — AC brand-token swatch picker.
 *
 * Default bank reads live from CSS custom properties so the panel stays in
 * sync with `kol-color.css` / `kol-opacity.css` / `kol-brand-color.css`. Five
 * sub-banks render in order:
 *   1. Foreground opacity ramp (14 stops)
 *   2. Red ramp (5 stops)
 *   3. Cream ramp (5 stops)
 *   4. Greyscale (10 stops)
 *   5. Absolutes (white + black)
 *
 * The dropdown switches between palettes — AC is the default; "Standard"
 * is a basic web-safe fallback for kicking off without brand context; "Custom" is the user's own
 * (the + beside the picker adds the live colour to it).
 */

const FG_STOPS    = ['01', '02', '04', '08', '12', '16', '24', '32', '40', '48', '64', '80', '88', '96']
const GREY_STOPS  = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
const RED_STOPS   = ['100', '200', '300', '400', '500']
const CREAM_STOPS = ['100', '200', '300', '400', '500']

const STANDARD_SWATCHES = [
  '#000000', '#262626', '#525252', '#737373', '#A3A3A3', '#D4D4D4', '#E5E5E5', '#FFFFFF',
  '#7F1D1D', '#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2',
  '#78350F', '#B45309', '#D97706', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7',
  '#14532D', '#15803D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0', '#DCFCE7',
  '#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE',
  '#581C87', '#7E22CE', '#9333EA', '#A855F7', '#C084FC', '#D8B4FE', '#E9D5FF', '#F3E8FF',
]

const PALETTES = [
  { value: 'ac',       label: 'AC'       },
  { value: 'standard', label: 'Standard' },
  { value: 'custom',   label: 'Custom'   },
]

/* AFFINITY'S SWATCHES TAB (plan 30 § 15, the user's reference): Recent, the palette picker with
 * add-swatch and the four fixed chips, the grid, Search. Recent is this session's last eight picks;
 * Custom is the user's own palette, kept across sessions. */
const CUSTOM_KEY = 'kol.editor.swatches'
const RECENT_MAX = 8
const FIXED = [
  { hex: null,      name: 'None'  },
  { hex: '#000000', name: 'Black' },
  { hex: '#808080', name: 'Grey'  },
  { hex: '#FFFFFF', name: 'White' },
]
let recent = []
let custom = (() => { try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)) ?? [] } catch { return [] } })()
const subs = new Set()
const emit = () => subs.forEach((f) => f())
const pushRecent = (hex) => { if (!hex) return; recent = [hex, ...recent.filter((h) => h !== hex)].slice(0, RECENT_MAX); emit() }
const addCustom = (hex) => {
  if (!hex || custom.includes(hex)) return
  custom = [...custom, hex]
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)) } catch { /* quota / private mode */ }
  emit()
}
const useSwatchStore = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => recent + '|' + custom)

export function SwatchesBody({ onPick, currentHex }) {
  const [palette, setPalette] = useState('ac')
  const [query, setQuery]     = useState('')
  const [tick, setTick]       = useState(0)
  const cs = useControlSize()
  useSwatchStore()

  /* Re-resolve when the document theme shifts (kol-system rebrand events). */
  useEffect(() => {
    const onTheme = () => setTick((t) => t + 1)
    window.addEventListener('kol:theme-change', onTheme)
    return () => window.removeEventListener('kol:theme-change', onTheme)
  }, [])

  /* `{ hex, name }` — the name is what Search reads beside the hex */
  const swatches = useMemo(() => {
    if (palette === 'ac') {
      const bank = (stops, v, label) => stops.map((st) => ({ hex: resolveCssVar(v(st)), name: `${label} ${st}` }))
      return [
        ...bank(FG_STOPS, (st) => `--kol-fg-${st}`, 'fg'),
        ...bank(RED_STOPS, (st) => `--kol-color-red-${st}`, 'red'),
        ...bank(CREAM_STOPS, (st) => `--kol-color-cream-${st}`, 'cream'),
        ...bank(GREY_STOPS, (st) => `--grey-${st}`, 'grey'),
        { hex: '#FFFFFF', name: 'white' }, { hex: '#000000', name: 'black' },
      ].filter((x) => x.hex)
    }
    if (palette === 'custom') return custom.map((hex) => ({ hex, name: hex }))
    return STANDARD_SWATCHES.map((hex) => ({ hex, name: hex }))
  }, [palette, tick, custom]) // eslint-disable-line react-hooks/exhaustive-deps

  const q = query.trim().toLowerCase()
  const shown = q ? swatches.filter((x) => x.name.toLowerCase().includes(q) || x.hex.toLowerCase().includes(q)) : swatches
  const pick = (hex) => { pushRecent(hex); onPick?.(hex) }

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="kol-helper-10 text-meta shrink-0">Recent</span>
        <div className="flex-1 min-w-0 h-5 flex items-center gap-1 rounded-[2px] bg-oq-04 px-0.5">
          {recent.map((hex) => (
            <ColorSwatch key={hex} hex={hex} size={16} radius="tight" frame={false} title={hex} onClick={() => pick(hex)} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Dropdown variant="subtle" size={cs} options={PALETTES} value={palette} onChange={setPalette} className="flex-1 min-w-0" />
        <Tooltip label="Add swatch">
          <Button tone="ghost" quiet size={cs} iconOnly="plus" aria-label="Add swatch" disabled={!currentHex}
            onClick={() => { addCustom(currentHex); setPalette('custom') }} />
        </Tooltip>
        {FIXED.map((f) => (
          <ColorSwatch key={f.name} hex={f.hex ?? undefined} showTransparent={!f.hex} size={16} radius="tight" title={f.name} onClick={() => pick(f.hex)} />
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1">
        {shown.map(({ hex, name }, i) => (
          <ColorSwatch
            key={`${hex}-${i}`}
            hex={hex}
            size="fill"
            radius="tight"
            frame={false}
            title={name}
            onClick={() => pick(hex)}
          />
        ))}
      </div>
      {palette === 'custom' && custom.length === 0 && (
        <span className="kol-helper-10 text-meta">Add the current colour with +</span>
      )}
      <SearchInput size={cs} value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} placeholder="Search" />
    </div>
  )
}

export default function SwatchesPanel(props) {
  return (
    <div
      className="bg-surface-primary border border-oq-08 rounded overflow-hidden"
      style={{ width: 320 }}
    >
      <SwatchesBody {...props} />
    </div>
  )
}
