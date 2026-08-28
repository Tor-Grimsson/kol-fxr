import { withView, navigateTo } from '../mode'

/* Mobile-chrome gating. Primary-pointer coarse + real touch = phone/tablet →
 * the generative MobileView; a tablet with a keyboard/trackpad reports a fine
 * primary pointer and gets the desktop editor natively. */
export const isMobileDevice = () =>
  window.matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0

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
