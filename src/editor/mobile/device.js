import { useSyncExternalStore } from 'react'
import { withView, navigateTo } from '../mode'

/* Mobile-chrome gating. Primary-pointer coarse + real touch = phone/tablet →
 * the generative MobileView; a tablet with a keyboard/trackpad reports a fine
 * primary pointer and gets the desktop editor natively. */
export const isMobileDevice = () =>
  window.matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0

/* THE FRAME FOLLOWS THE WINDOW AS WELL AS THE DEVICE (2026-10-05). Sheet or rail was
 * `isMobileDevice()` alone, so a desktop window narrowed to a phone's width kept the desk frame:
 * labs' two rails squeezed to strips either side of the stage, the randomiser's 264px rail beside
 * a 126px stage. Under 768 the tools take the frame a phone gets — the width kol-shell's
 * `AppShell` folds its own rail into a drawer at (`drawerBelow`), and for its reason: "a width,
 * not a pointer test … a narrow desktop window" has no room either. A touch device keeps the
 * sheet at any width, as before; this only adds the narrow window to it. */
export const NARROW_BELOW = 768
/* …and the compositor's own floor: two 320px panels and a menu bar want 1024 (at 768 the stage
 * was 80px wide, by 480 gone). Under it the editor shows a note, not a squeezed shell. */
export const EDITOR_BELOW = 1024
/* …and labs' (2026-10-06): labs has TWO rails that open together (the 2026-08-30 pairing), so at
 * 768 both open left the stage 240px wide, 496 at 1024. Under 1024 labs takes the sheet; the
 * randomiser, with one rail, keeps 768. */
export const LABS_BELOW = 1024
const below = new Map()
const queryBelow = (px) => { if (!below.has(px)) below.set(px, window.matchMedia(`(max-width: ${px - 1}px)`)); return below.get(px) }
export const useBelow = (px) => useSyncExternalStore(
  (cb) => { const mq = queryBelow(px); mq.addEventListener('change', cb); return () => mq.removeEventListener('change', cb) },
  () => queryBelow(px).matches,
  () => false,
)
export const useNarrow = () => useBelow(NARROW_BELOW)

/* Tablets get the "Use desktop editor" opt-in on the entry screen; phones
 * don't. ~600px shortest screen side is the phone/tablet line. */
export const isTabletSized = () =>
  Math.min(window.screen.width, window.screen.height) >= 600

/* The persisted tablet opt-in. `goMobile()` clears it (the way back). */
/* the key kol-shell's AppShell reads for its touch policy (0.8.0) */
const DESKTOP_KEY = 'kol-desktop'
export const wantsDesktop = () => {
  try { return localStorage.getItem(DESKTOP_KEY) === '1' } catch { return false }
}
export const setWantsDesktop = (on) => {
  try { on ? localStorage.setItem(DESKTOP_KEY, '1') : localStorage.removeItem(DESKTOP_KEY) } catch { /* storage blocked */ }
}

/* View switches — navigate to the explicit route rather than flag+reload. A
 * forced URL would survive a reload and loop, so the way OUT must set the URL,
 * not just the flag.
 *
 * BOTH of these own their flag write now. `goDesktop` always did; `goMobile`
 * used to lean on `?view=mobile` being a special branch in App.jsx that
 * cleared the opt-in as a side effect of routing. Under the router both
 * spellings resolve to `/randomiser`, so the clear moved to the function that
 * actually means "get me out of desktop on this tablet" — which is where it
 * belonged: routing should not mutate a preference. */
export const goDesktop = () => { setWantsDesktop(true); navigateTo(withView('desktop')) }
export const goMobile = () => { setWantsDesktop(false); navigateTo(withView('mobile')) }
