import { useEffect, useState } from 'react'
import { Button, ModalProvider } from '@kolkrabbi/kol-component'
import { useBelow, EDITOR_BELOW } from './mobile/device'
import { SPREAD } from './mobile/CategoryScreen'
import { MODE_ICONS } from './labs/catalog'
import { goLabs, goRandomiser, modeById } from './mode'
import EditorErrorBoundary from './EditorErrorBoundary'
import { ToolProvider }       from './state/tools'
import { GeneratorLibraryProvider } from './library/LibraryProvider'
import { useGlobalShortcuts } from './state/useGlobalShortcuts'
import { ComposeStateProvider, useComposeState } from './compose/state'
import { transport } from './params/transport'
import { getAppSettings } from './lib/appSettings'
import { PaletteStateProvider } from './modes/palette/state'
import { PatternStateProvider } from './modes/pattern/state'
import { TypeStateProvider }    from './modes/type/state'
import PaletteModal from './color/PaletteModal.jsx'
import FilesDialogHost from './library/FilesDialogHost'
import MorphDialogHost from './morph/MorphDialogHost'
import Compose from './Compose'

/**
 * Editor — the whole app, mounted at `/`.
 *
 * Always renders the compose body. The palette / pattern / type state
 * providers stay mounted (nesting order preserved from the old registry:
 * ToolProvider > Compose > Palette > Pattern > Type) — the color modal and
 * library flows read palette state, and pattern / type state can still back
 * library items. PaletteModal (the palette generator; NOT color/ColorModal,
 * which is the per-layer color panel in the left rail) mounts inside the
 * stack so it sees palette + compose state; opens on `kol:open-color-modal`.
 */
function EditorBody() {
  /* Global shortcuts (undo / redo / deselect) — mounted here so keyboard
   * works everywhere, not just inside CanvasArea. */
  useGlobalShortcuts()

  /* appSettings boot (labs parity): seed the canvas frame from the global
   * default aspect and start the transport if autoplay is on. Runs once at
   * mount — a draft-restore (async, behind a confirm) still overrides the
   * aspect afterward. The loop-theme + clip-to-frame defaults seed at
   * layer-create time (see appSettings.js consumers). */
  const { setAspect } = useComposeState()
  useEffect(() => {
    const s = getAppSettings()
    if (s.autoplay) transport.play()
    if (s.defaultAspect && s.defaultAspect !== 'custom') setAspect(s.defaultAspect)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Compose />
      <PaletteModal />
      {/* mounted once, inside the providers — the two File surfaces open it
          through a store rather than owning it (FilesDialog, kol-fxr) */}
      <FilesDialogHost />
      <MorphDialogHost />
    </>
  )
}

/**
 * EditorProviders — the full context stack (error boundary + library > tool >
 * compose > palette > pattern > type), shared by the editor, the chromeless
 * output window (`./OutputView`), the mobile chrome and labs mode
 * (`./labs/LabsView`) so every chrome renders off identical state. Nesting
 * order is load-bearing (see EditorBody). Library outermost — MenuTop
 * (File > Open) and every save-to-library flow read it.
 *
 * `persistDraft` / `draftKey` are the draft-surface knobs: off entirely for
 * ephemeral chromes, or pointed at a separate slot so a second persisting
 * chrome (labs) can autosave without touching the editor's composition.
 */
export function EditorProviders({ children, persistDraft = true, draftKey }) {
  return (
    <EditorErrorBoundary>
      {/* ModalProvider outermost of the state stack — WITHOUT it every
        * useModal() (draft restore, discard confirms, save prompts) silently
        * falls back to the NATIVE browser dialog. */}
      <ModalProvider>
        <GeneratorLibraryProvider>
          <ToolProvider>
            <ComposeStateProvider persistDraft={persistDraft} draftKey={draftKey}>
              <PaletteStateProvider>
                <PatternStateProvider>
                  <TypeStateProvider>
                    {children}
                  </TypeStateProvider>
                </PatternStateProvider>
              </PaletteStateProvider>
            </ComposeStateProvider>
          </ToolProvider>
        </GeneratorLibraryProvider>
      </ModalProvider>
    </EditorErrorBoundary>
  )
}

/* UNDER 1024 THE COMPOSITOR STANDS DOWN (2026-10-05, decided on the recommendation for review).
 * Its two 320px panels left an 80px stage at 768 and none at 480, with the menu bar clipped —
 * and the render gate had carried a written exemption for it ("no phone layout yet"). Rather
 * than a squeezed shell, a card: the two chromes that do work at this width as doors, and a way
 * through for whoever wants the shell anyway (this session only). */
export default function Editor() {
  const narrow = useBelow(EDITOR_BELOW)
  const [anyway, setAnyway] = useState(false)
  return (
    <EditorProviders>
      {narrow && !anyway ? <NarrowWindowNote onContinue={() => setAnyway(true)} /> : <EditorBody />}
    </EditorProviders>
  )
}

function NarrowWindowNote({ onContinue }) {
  return (
    <div className="fixed inset-y-0 right-0 left-[var(--fxr-rail,0px)] kol-overlay-scrim flex flex-col items-center justify-center p-6" style={{ zIndex: 'var(--kol-z-modal)' }}>
      <div className="w-full max-w-sm rounded p-8 flex flex-col gap-6" style={{ background: 'var(--kol-surface-primary)' }}>
        <div className="flex flex-col gap-2">
          <span className="kol-eyebrow text-body">{modeById('editor').label}</span>
          <span className="kol-mono-16 text-emphasis">Needs a window at least {EDITOR_BELOW} wide</span>
          <span className="kol-mono-12 text-meta">Labs and the randomiser work at this size.</span>
        </div>
        <div className="flex flex-col gap-2">
          <Button tone="primary" size="lg" className={SPREAD} iconLeft={MODE_ICONS.labs} iconRight={MODE_ICONS.labs} onClick={goLabs}>{modeById('labs').label}</Button>
          <Button tone="primary" size="lg" className={SPREAD} iconLeft={MODE_ICONS.randomiser} iconRight={MODE_ICONS.randomiser} onClick={goRandomiser}>{modeById('randomiser').label}</Button>
          <Button tone="outline" size="lg" onClick={onContinue}>Open the editor anyway</Button>
        </div>
      </div>
    </div>
  )
}
