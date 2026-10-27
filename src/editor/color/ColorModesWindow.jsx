import { useEffect, useState } from 'react'
import { CloseButton, FullscreenOverlay } from '@kolkrabbi/kol-component'
import { PaletteBody } from './PaletteBody'

/**
 * COLOR MODES — the palette generator as a TOOL WINDOW (plan 39 § 4.1; the user's colour-modes tool,
 * Adobe's colour tool the reference): opened from Tools · Edit · Window › Color Modes and from Labs'
 * Color row (plan 41 § 6.1), never a tab.
 * One generator in the app — it replaced both the colour pane's Palette tab and the old PaletteModal
 * (retired to `_tmp/2026-10-23-palette-modal-retired/`). The body is `PaletteBody`: one base colour,
 * a relationship and a count; roll · lock · edit · delete · load · save, applied to the selected
 * generator or to the document palette.
 *
 * Opened by `kol:open-color-modes`. `scrim` like Layer Effects: the canvas stays visible under it,
 * so every apply is seen live.
 */
export const OPEN_COLOR_MODES = 'kol:open-color-modes'
export const openColorModes = () => window.dispatchEvent(new CustomEvent(OPEN_COLOR_MODES))

export default function ColorModesWindow() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setOpen(true)
    window.addEventListener(OPEN_COLOR_MODES, on)
    return () => window.removeEventListener(OPEN_COLOR_MODES, on)
  }, [])
  if (!open) return null
  const close = () => setOpen(false)
  return (
    <FullscreenOverlay open onClose={close} closeButton={false} scrim>
      {/* keep-selection: the overlay portals outside the shell, and the canvas's click-away would
          otherwise deselect the generator this window applies to */}
      <div aria-label="Color Modes" data-editor-keep-selection className="kol-design-editor kol-popover w-[360px] max-w-full flex flex-col">
        <div className="relative flex h-10 items-center justify-center border-b border-oq-08 px-4">
          <span className="font-sans text-[13px] text-emphasis">Color Modes</span>
          <CloseButton onClick={close} size="sm" className="!absolute right-3" />
        </div>
        <PaletteBody />
      </div>
    </FullscreenOverlay>
  )
}
