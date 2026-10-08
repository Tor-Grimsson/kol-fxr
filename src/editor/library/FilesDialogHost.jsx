import FilesDialog from './FilesDialog'
import { useFilesDialog, closeFiles } from './filesDialogStore'
import { useComposeState } from '../compose/state'
import { useComposeFile } from '../compose/useComposeFile'
import { useGeneratorLibrary } from './LibraryProvider'

/**
 * FilesDialogHost — binds `FilesDialog` to the editor's own verbs and mounts it
 * once, inside the provider stack.
 *
 * The dialog is deliberately ignorant of `loadPreset`, of the settings envelope
 * and of the compose frame: it knows a library, five verbs and two callbacks.
 * Everything editor-shaped is wired here, which is what keeps the dialog
 * testable and what would let it move to `kol-component` unchanged if a second
 * consumer ever earns it.
 */
export default function FilesDialogHost() {
  const { open, focusName } = useFilesDialog()
  const { loadPreset, setCurrentPresetId, setCurrentPresetName } = useComposeState()
  const { onLoadSettings, onSaveSettings, buildSpec } = useComposeFile()
  const { addItem } = useGeneratorLibrary()

  return (
    <FilesDialog
      open={open}
      onClose={closeFiles}
      /* OPENING A FILE ADOPTS ITS IDENTITY. Without these two the frame loads
       * and the next plain Save writes a SECOND copy instead of overwriting
       * what was just opened — the same silent-duplicate this dialog exists to
       * make visible. `loadPreset` sets the id itself for a preset; the name
       * follows it here so the topbar reads the right thing immediately. */
      onOpenItem={(item) => {
        loadPreset(item)
        setCurrentPresetId(item.id)
        setCurrentPresetName(item.name ?? null)
      }}
      onImportFile={onLoadSettings}
      /* Export the SELECTED item, not the live frame — a files dialog exports
       * what you picked in it. The stored item IS the spec (the library holds
       * validated specs), so it goes straight into the envelope. */
      onExportItem={(item, name) => onSaveSettings(name, item)}
      /* SAVE AS lands here instead of `modal.prompt` — the dialog shows the
       * names already taken while you pick one, which a prompt cannot. */
      onSaveCurrent={(name) => {
        const id = addItem('preset', buildSpec(name))
        if (!id) return
        setCurrentPresetId(id)
        setCurrentPresetName(name)
      }}
      focusName={focusName}
    />
  )
}
