import { useEffect, useState } from 'react'
import { Button, ColorSwatch, HueStrip, Input, LabeledControl, PopoverPanel, SBSquare, hexToHsva, hsvaToHex, usePopover } from '@kolkrabbi/kol-component'
import { resolveColor } from '../state'
import { useControlSize } from '../../params/controlSize'

/* Palette-ref grid shown in the swatch popover. */
export const PALETTE_REFS = [
  { value: 'palette:primary',   label: 'Primary' },
  { value: 'palette:secondary', label: 'Secondary' },
  { value: 'palette:light',     label: 'Light' },
  { value: 'palette:dark',      label: 'Dark' },
  { value: 'palette:accent',    label: 'Accent' },
  { value: 'palette:bg',        label: 'Background' },
]

/**
 * ColorField — swatch button + inline hex input. The swatch shows the
 * resolved color; the hex input lets the user type a literal hex without
 * opening anything. Click the swatch to open a popover with the palette-ref
 * grid. Extracted from LayerInspector so both it and the schema-driven
 * AutoControls can consume it without an import cycle.
 */
export function ColorField({ value, onChange, palette, label = 'Color', hideLabel = false, autoValue = null, inline = false }) {
  const cs = useControlSize()
  const isPaletteRef = typeof value === 'string' && value.startsWith('palette:')
  const isNone       = value == null
  /* A `var(--kol-*)` value is a themed token that flips with light/dark — the
   * swatch renders it live, but there's no meaningful hex to show. */
  const isVar        = typeof value === 'string' && value.startsWith('var(')
  const resolved     = resolveColor(value, palette) ?? '#FFFFFF'
  const subtitle     = isNone
    ? 'None'
    : isVar
      ? 'Theme'
      : isPaletteRef
        ? (PALETTE_REFS.find((r) => r.value === value)?.label ?? value)
        : resolved.toUpperCase()
  const isStroke     = label === 'Stroke'

  const [open, setOpen] = useState(false)
  /* THE SWATCH OPENS A REAL PICKER (plan 41 § 7.5, user 2026-10-26: "why dont you get the color picker,
     why is it limited by some 6 swatches?"). The working copy is HSV, taken when the popover opens, so
     the hue survives a drag into grey — the DS ColorPickerPopover's rule, on its own SBSquare/HueStrip. */
  const [hsv, setHsv] = useState(null)
  const popover = usePopover({
    open, placement: 'bottom-start', offset: 4,
    onOpenChange: (next) => {
      if (next) setHsv(hexToHsva(/^#[0-9a-f]{6}/i.test(resolved) ? resolved.slice(0, 7) : '#808080') ?? { hue: 0, sat: 0, val: 50, alpha: 1 })
      setOpen(next)
    },
  })
  const pick = (next) => { setHsv(next); onChange(hsvaToHex({ ...next, alpha: 1 })) }

  /* Hex typing commits on blur / Enter (the CanvasInspector SizeField idiom)
   * — a per-keystroke write would push a partial hex ('#F') into layer +
   * paint state and flood undo with one entry per character. Invalid drafts
   * revert to the current value; 3-digit shorthand expands. */
  const hexValue = (isNone || isVar) ? '' : resolved.replace(/^#/, '').toUpperCase()
  const [draft, setDraft] = useState(hexValue)
  useEffect(() => { setDraft(hexValue) }, [hexValue])
  const commitHex = () => {
    const clean = draft.replace(/^#/, '').trim().toUpperCase()
    const full  = /^[0-9A-F]{6}$/.test(clean)
      ? clean
      : /^[0-9A-F]{3}$/.test(clean)
        ? clean.split('').map((c) => c + c).join('')
        : null
    if (full) { onChange('#' + full); setDraft(full) }
    else      setDraft(hexValue)
  }

  /* Swatch opens the palette popover; hex commits on blur/Enter. Inline
   * (labs row) = [24px swatch] LABEL ……… #hex — the reference's exact order
   * and size (labs: 24×24 rounded-[2px], swatch leads the row). */
  /* In the paint bar (inline+hideLabel) the swatch BLEEDS the shell's
   * padding so the full-height 'control-sm' chip sits flush at the box
   * edge — the one-container anatomy. */
  const inBar = inline && hideLabel
  const swatchBtn = (
    <button
      type="button"
      ref={popover.refs.setReference}
      {...popover.getReferenceProps()}
      aria-label={`${label}: ${subtitle}`}
      className={inBar ? 'inline-flex items-center shrink-0 -ml-3 -my-1' : 'inline-flex items-center shrink-0'}
    >
      <ColorSwatch
        hex={resolved}
        size={inBar ? 'control-sm' : (inline ? 24 : 32)}
        showTransparent={isNone}
        transparentTone={isStroke ? 'error' : 'warning'}
        hoverable={false}
        /* hairline — a surface-colored hex (#111 on dark) vanishes on the
           rail without an edge; the DS chip is borderless by default */
        className="border border-oq-08"
      />
    </button>
  )
  /* None / themed show an empty field ('# –' via placeholder), not a
   * hex — a disabled fill claiming #FFFFFF reads as white, and a themed
   * token has no single hex. The sectioned-inspector bar (inline+hideLabel)
   * mounts the SWATCH INSIDE the shell via `slotLeft` (kol-component 0.35 —
   * the ColorSwatchFieldSizing anatomy: ONE container, Figma's paint bar). */
  const hexInput = (
    <Input
      variant="filled"
      size={cs}
      slotLeft={inline && hideLabel ? swatchBtn : undefined}
      prefix="#"
      chars={6}
      placeholder={isVar ? 'auto' : '–'}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commitHex}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
    />
  )

  const row = inline ? (
    <div className={hideLabel ? 'flex items-center gap-2' : 'flex items-center gap-3'}>
      {!hideLabel && swatchBtn}
      {/* the labs row: uppercase like every SettingsRow beside it (the
          editor's paint bar hides the label; its inspector is label-above) */}
      {!hideLabel && (
        <span className="kol-eyebrow text-meta whitespace-nowrap">{label}</span>
      )}
      {!hideLabel && <div className="flex-1" />}
      {hexInput}
      {hideLabel && <div className="flex-1" />}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      {swatchBtn}
      {hexInput}
    </div>
  )

  return (
    <LabeledControl label={inline || hideLabel ? null : label}>
      {row}
      <PopoverPanel
        popover={popover}
        panel={false}
        focus={false}
        className="bg-surface-secondary border border-oq-08 rounded p-2 flex flex-col gap-2 shadow-lg"
        style={{ width: 216 }}
      >
        {hsv && (
          <>
            <div className="rounded-[var(--kol-radius-xs)] overflow-hidden" style={{ height: 120 }}>
              <SBSquare hue={hsv.hue} sat={hsv.sat} val={hsv.val} onChange={(sat, val) => pick({ ...hsv, sat, val })} />
            </div>
            <HueStrip hue={hsv.hue} onChange={(hue) => pick({ ...hsv, hue })} />
          </>
        )}
        <div className="grid grid-cols-6 gap-1">
          {PALETTE_REFS.map((ref) => (
            <ColorSwatch
              key={ref.value}
              hex={resolveColor(ref.value, palette) ?? '#000000'}
              size="fill"
              selected={value === ref.value}
              title={ref.label}
              onClick={() => { onChange(ref.value); setOpen(false) }}
            />
          ))}
        </div>
        {/* Quick states: Theme (auto, flips with light/dark — only offered when the field has an
            autoValue) and None (disable → transparent). DS Buttons sharing the row, sunken so they read on the
            secondary panel (primary fill = the panel) — the inline Tag
            pill read as a stray chip (plan 41 § 7.5). */}
        <div className="flex gap-2">
          {autoValue && (
            <Button tone="sunken" size="sm" className="flex-1 min-w-0" pressed={isVar} onClick={() => { onChange(autoValue); setOpen(false) }}>Theme</Button>
          )}
          <Button tone="sunken" size="sm" className="flex-1 min-w-0" pressed={isNone} onClick={() => { onChange(null); setOpen(false) }}>None</Button>
        </div>
      </PopoverPanel>
    </LabeledControl>
  )
}
