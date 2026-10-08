import { useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContentRow, FullscreenOverlay } from '@kolkrabbi/kol-component'

/**
 * NewFileDialog — New File's four doors (plan 09): Editor · Labs · Randomiser · Morph. Opened
 * through a tiny store from Home's and Library's New File buttons, mounted once in AppLayout.
 * Editor and Labs open on an empty frame (`?new=1`); Morph opens labs with the first-step picker
 * (`?new=morph`); the Randomiser door just opens the randomiser (it never saves a file).
 */
let open = false
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
export function openNewFile() { open = true; emit() }
function close() { open = false; emit() }
const useOpen = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => open, () => open)

const DOORS = [
  { id: 'editor', label: 'Editor', detail: 'The full compositor — an empty frame.', to: '/editor?new=1' },
  { id: 'labs', label: 'Labs', detail: 'One generator on a standardized output.', to: '/labs?new=1' },
  { id: 'randomiser', label: 'Randomiser', detail: 'Roll the dice: pick a category and randomize.', to: '/randomiser' },
  { id: 'morph', label: 'Morph', detail: 'Tween between steps of one generator.', to: '/labs?new=morph' },
]

export default function NewFileDialog() {
  const isOpen = useOpen()
  const navigate = useNavigate()
  if (!isOpen) return null
  return (
    <FullscreenOverlay open scrim onClose={close}>
      <div className="kol-new-file flex flex-col gap-4" style={{ minWidth: 'min(520px, 90vw)' }}>
        <span className="kol-eyebrow text-meta">New file</span>
        <ul className="flex flex-col">
          {DOORS.map((d) => (
            <li key={d.id}>
              <ContentRow variant="default" media={false} title={d.label} detail={d.detail} onClick={() => { close(); navigate(d.to) }} />
            </li>
          ))}
        </ul>
      </div>
    </FullscreenOverlay>
  )
}
