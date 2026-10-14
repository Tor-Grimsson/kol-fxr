import { useRef, useState } from 'react'
import { Button, ColorSwatch, PopoverPanel, Tooltip, usePopover } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { useComposeState } from '../compose/state'
import { useLayerEdit } from '../compose/useLayerEdit'
import AutoControls from '../params/AutoControls'
import MediaPickerDialog from '../library/MediaPickerDialog'
import { proxied } from '../library/mediaLibrary'
import { ColourBody } from './ColourPanel'
import { PAINT_TYPES, PAINT_DEFAULTS, PAINT_SCHEMAS, paintBackground } from '../compose/paintFill'

/**
 * PaintPopover — a paint swatch that opens its picker WHERE IT IS (plan 34 § 1; the user: "fill and
 * stroke here should open color picker WHERE SWATCH IS"). Spec R6.6 had read his 15 as "opens the Color
 * pane"; the pane stays a pane, the swatch opens this.
 *
 * Fill carries Figma's row of paint types across the top (plan 34 § 2): Solid · Gradient · Pattern ·
 * Image · Video. Solid is the Color pane's own body (`ColourBody` — square · hue · view · opacity ·
 * pipette) on the active paint; the others edit `layer.fill` through their schema rows. Stroke is Solid.
 */
export default function PaintPopover({ layer, paint, label, hex, none, palette }) {
  const { setActivePaint } = useComposeState()
  const edit = useLayerEdit(layer.locked ? null : layer.id, { history: 'coalesce' })
  const [open, setOpen] = useState(false)
  const popover = usePopover({ open, onOpenChange: (v) => { if (v) setActivePaint(paint); setOpen(v) }, placement: 'left-start', offset: 8 })
  const [picker, setPicker] = useState(null)  /* 'image' | 'video' while the media library is open */
  const fileRef = useRef(null)

  const isFill = paint === 'fill'
  const fill = isFill ? layer.fill : null
  const type = fill?.type ?? 'solid'
  const setType = (t) => edit.patch({ fill: t === 'solid' ? null : { ...PAINT_DEFAULTS[t], ...(fill?.type === t ? fill : {}) } })
  const setParam = (k, v) => edit.patch({ fill: { ...PAINT_DEFAULTS[type], ...fill, [k]: v } })
  const params = { ...PAINT_DEFAULTS[type], ...fill }

  /* a picked file: an image becomes a data URL (it travels in the file); a video plays from an object
     URL — ponytail: a file-picked video fill lasts the session, a library video persists */
  const onFile = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (type === 'video') { setParam('src', URL.createObjectURL(f)); return }
    const r = new FileReader()
    r.onload = () => setParam('src', r.result)
    r.readAsDataURL(f)
  }

  const swatchStyle = isFill && type !== 'solid' ? paintBackground(fill, palette) : null
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" ref={popover.refs.setReference} {...popover.getReferenceProps()} aria-label={`${label} paint`} title={label}
        className="inline-flex shrink-0 rounded-[3px] overflow-hidden">
        {swatchStyle
          ? <span className="block size-6 border border-oq-08 rounded-[3px] bg-center bg-cover" style={swatchStyle} />
          : <ColorSwatch hex={none ? undefined : (hex ?? '#FFFFFF')} size={24} showTransparent={none} hoverable={false} />}
      </button>
      <span className="kol-helper-10 tracking-widest text-meta">{label.toUpperCase()}</span>

      <PopoverPanel popover={popover} panel={false} focus={false}
        className="kol-popover w-[288px] flex flex-col" data-editor-keep-selection>
        <div className="flex items-center justify-between h-10 px-3 border-b border-oq-08">
          <span className="text-[13px] text-emphasis font-sans">{label}</span>
          <Button tone="ghost" quiet size="xs" iconOnly="x" aria-label="Close" onClick={() => setOpen(false)} />
        </div>
        {isFill && (
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-oq-08" role="tablist" aria-label="Paint type">
            {PAINT_TYPES.map((t) => (
              <Tooltip key={t.value} label={t.label}>
                <Button tone="ghost" quiet size="sm" role="tab" aria-selected={type === t.value} pressed={type === t.value}
                  iconOnly={t.icon} aria-label={t.label} onClick={() => setType(t.value)} />
              </Tooltip>
            ))}
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto">
          {type === 'solid' && <ColourBody />}
          {type !== 'solid' && (
            <div className="p-3 flex flex-col gap-3">
              {(type === 'image' || type === 'video') && (
                <div className="flex flex-col gap-2">
                  <div className="h-28 rounded border border-oq-08 bg-surface-secondary bg-center bg-contain bg-no-repeat flex items-center justify-center overflow-hidden"
                    style={type === 'image' && params.src ? { backgroundImage: `url("${params.src}")` } : undefined}>
                    {type === 'video' && params.src
                      ? <video src={params.src} muted autoPlay loop playsInline className="max-h-full max-w-full" />
                      : !params.src && <Icon name={type === 'video' ? 'video' : 'image'} size={20} className="text-meta" />}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => fileRef.current?.click()}>Choose {type}…</Button>
                    <Button size="sm" className="flex-1" onClick={() => setPicker(type)}>Library…</Button>
                  </div>
                  <input ref={fileRef} type="file" accept={type === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={onFile} />
                </div>
              )}
              <AutoControls schema={PAINT_SCHEMAS[type]} layer={params} setProp={setParam} palette={palette} />
            </div>
          )}
        </div>
      </PopoverPanel>
      {picker && (
        <MediaPickerDialog open accept={[picker]} onClose={() => setPicker(null)}
          onSelect={(url) => { setParam('src', proxied(url)); setPicker(null) }} />
      )}
    </span>
  )
}
