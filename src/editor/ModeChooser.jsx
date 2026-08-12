import { Button } from '@kolkrabbi/kol-component'
import { MODES, goMode } from './mode'

/**
 * ModeChooser — the front door (plan.md Phase 11.5). Shown on a first visit
 * with no remembered pick and no `?view=` override; the choice is persisted,
 * so it appears once, not every session. "Mode → Choose on next open" in a
 * chrome's topbar brings it back.
 *
 * Standalone app only — the embedded <DesignEditor /> never sees this
 * (src/index.jsx mounts the editor directly), same stance as `?view=output`.
 */
export default function ModeChooser() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--kol-surface-primary)' }}>
      <div className="w-full max-w-md flex flex-col gap-3">
        {MODES.map((m) => (
          <Button
            key={m.id}
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => goMode(m.id)}
          >
            {m.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
