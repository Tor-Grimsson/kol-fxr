import { useEffect, useRef, useState } from 'react'
import { ToolProvider } from '../state/tools'
import { ComposeStateProvider, useComposeState } from '../compose/state'
import { PaletteStateProvider } from '../modes/palette/state'
import { PatternStateProvider } from '../modes/pattern/state'
import { TypeStateProvider } from '../modes/type/state'
import { useComposeFile } from '../compose/useComposeFile'
import { OutputCanvas } from '../OutputView'
import { transport } from '../params/transport'
import { liveQueue, setHostKick, deliver, wanted } from './FileCover'

/**
 * CoverHost — the live half of FileCover: the covers only a mounted engine can draw (GL loops, kinetic type, a whole
 * composition) render here, ONE AT A TIME, off the page — the output stack with no chrome, captured through the same
 * `captureThumb` a save uses. Mounted once by AppLayout, lazily (it pulls the output stack, which the shell tier
 * otherwise never carries); idle when nothing is queued.
 *
 * No GeneratorLibraryProvider in the stack, deliberately: one would hydrate per file when signed in. `useGeneratorLibrary`
 * falls back to a no-op without it.
 */
const PAINT_MS = 1500   /* generators and the lazy GL engines need a few frames before the picture is the picture */

function Capture({ file, onFrame }) {
  const { loadPreset } = useComposeState()
  /* the freshest capture — the one from the first render would see the frame BEFORE the file loaded (UrlIntents' idiom) */
  const fileRef = useRef(null)
  fileRef.current = useComposeFile()
  useEffect(() => {
    loadPreset(file)
    transport.play()
    const t = setTimeout(async () => onFrame(await fileRef.current.captureThumb()), PAINT_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export default function CoverHost() {
  const [job, setJob] = useState(null)
  const busy = useRef(false)
  /* the pop lives OUTSIDE a state updater — StrictMode runs updaters twice, and a shift in one dropped every other job */
  const kick = useRef(() => {
    if (busy.current) return
    while (liveQueue.length) {
      const next = liveQueue.shift()
      if (wanted(next.key)) { busy.current = true; setJob(next); return }
    }
  }).current
  useEffect(() => { setHostKick(kick); kick(); return () => setHostKick(null) }, [kick])
  /* a finished frame frees the host and takes the next — the ONLY place busy clears (an effect on `job` cleared it on
     mount too, and the second pop replaced a job already taken) */
  const done = (url) => { deliver(job.key, url ?? null); busy.current = false; setJob(null); kick() }
  if (!job) return null
  return (
    <div aria-hidden style={{ position: 'fixed', left: -10000, top: 0, width: 320, height: 320, pointerEvents: 'none' }}>
      <ToolProvider>
        <ComposeStateProvider persistDraft={false}>
          <PaletteStateProvider>
            <PatternStateProvider>
              <TypeStateProvider>
                <OutputCanvas />
                <Capture key={job.key} file={job.file} onFrame={done} />
              </TypeStateProvider>
            </PatternStateProvider>
          </PaletteStateProvider>
        </ComposeStateProvider>
      </ToolProvider>
    </div>
  )
}
