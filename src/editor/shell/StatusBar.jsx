import { useState } from 'react'
import { Button, Input } from '@kolkrabbi/kol-component'
import NavigatorPanel from './NavigatorPanel'
import { useZoom } from './zoomStore'
import { useComposeState } from '../compose/state'

/**
 * StatusBar — the thin strip under the canvas (spec R1.2, the user's 8). The file name left the
 * top bar for it, the way Affinity shows `<Untitled> @ 130%` and Illustrator its artboard: the
 * top bar holds the mode door, the menus and the cog, nothing else (R1.1). Click the name to
 * rename; the zoom readout sits beside it (the DS chip is hidden while this bar is mounted, until
 * the canvas grows a `showZoomChip` seam — plan 17).
 */
export default function StatusBar() {
  const { currentPresetName, setCurrentPresetName } = useComposeState()
  const [navOpen, setNavOpen] = useState(false)
  const zoom = useZoom()
  /* the viewport's own reset (⌘0) — it listens on the window */
  const resetZoom = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: '0', metaKey: true, ctrlKey: true }))
  return (
    <div className="kol-editor-statusbar relative flex items-center h-6 px-2 border-t border-oq-08 bg-surface-primary">
      {/* the Navigator (G7) floats above the bar's right end while open */}
      {navOpen && <div className="absolute bottom-full right-2 mb-2 z-[5]"><NavigatorPanel /></div>}
      <Input
        variant="ghost"
        size="xs"
        value={currentPresetName ?? ''}
        onCommit={(next) => setCurrentPresetName(next.trim() || null)}
        placeholder="Untitled"
        chars={Math.max(10, (currentPresetName ?? "").length + 2)}
        title="Rename"
        aria-label="Frame name"
        inputClassName="kol-helper-10 text-emphasis"
      />
      {/* the zoom readout lives here (spec R1.2 — Affinity's `@ 130%`); the canvas chip is hidden in
          kol-editor.css while a status bar is mounted. Click resets, as the chip did. */}
      <Button tone="ghost" quiet size="xs" onClick={resetZoom} title="Reset zoom">{`${Math.round(zoom * 100)}%`}</Button>
      <span className="flex-1" />
      <Button tone="ghost" quiet size="xs" pressed={navOpen} onClick={() => setNavOpen((v) => !v)}>Navigator</Button>
    </div>
  )
}
