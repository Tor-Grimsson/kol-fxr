/**
 * Hint — placeholder / empty-state prose. Nothing explanatory renders unless
 * the user asks for it with **I**.
 *
 * The rule (user, repeatedly): he knows what the surfaces do; he does not
 * want the app narrating itself at him. An empty rail stays empty. This is
 * not a special case for "helper text" versus "empty states" versus "hints" —
 * those distinctions were ours, and they were how the prose kept coming back.
 * If it is a sentence explaining the UI, it goes through here.
 *
 * THE GATE IS THE DESIGN SYSTEM'S NOW (kol-component 0.46.0 / kol-theme
 * 0.43.0 — the GatedEmptyState ticket). Everything that used to live in this
 * file is gone, and where it went:
 *
 *   - the preference + its persistence  → `usePlaceholders()` in kol-component
 *   - the hiding                        → `.kol-placeholder`, a CSS rule
 *     (`:root:not([data-kol-placeholders])`) rather than a render branch —
 *     which is why this component reads no state at all any more
 *   - the `I` binding                   → `state/useGlobalShortcuts.js`
 *
 * That last move deleted a duplicate: the binding was a module-scope window
 * listener here because hints render under three different shells — but
 * `useGlobalShortcuts` is already mounted by EditorShell for exactly that
 * reason, so the second listener was never needed.
 *
 * The DS deliberately ships NO keybind. `I` is ours to pick, and a design
 * system that grabbed a key would collide with every app that already used
 * it — which is precisely how the first attempt landed on `H`, already
 * `toggle-visibility` here.
 *
 * Because the gate is a class, this component is now optional: any element
 * wearing `kol-placeholder` is governed by the same switch, including prose
 * that is not a single line. Keep using this for the plain one-line case so
 * the type stays consistent.
 */
export default function Hint({ children, className = 'kol-mono-12 text-meta' }) {
  return <p className={`kol-placeholder ${className}`}>{children}</p>
}
