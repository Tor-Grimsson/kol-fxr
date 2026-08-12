/**
 * Section — the Inspector's purpose-divider (2026-08-12 restructure, Figma
 * model): a hairline-topped block with a header, so the rail reads as
 * Position / Layout / Appearance / Typography / Fill / Stroke / Effects
 * instead of one flat control pile. `first` drops the divider + top pad.
 * `actions` renders right-aligned in the header row (Figma's eye / drop /
 * plus affordances).
 */
export function Section({ label, first = false, actions = null, children }) {
  return (
    <div className={first ? 'flex flex-col gap-3 pb-4' : 'flex flex-col gap-3 pb-4'}>
      {/* Full-bleed divider (Figma): spans the whole rail, not the padded
        * content box — the body pads 16px, the divider cancels it. */}
      {!first && <div className="border-t border-fg-08 -mx-4 mb-4" aria-hidden="true" />}
      <div className="flex items-center gap-2">
        <span className="kol-helper-12 text-emphasis flex-1">{label}</span>
        {actions}
      </div>
      {children}
    </div>
  )
}
