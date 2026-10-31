/* THE BOOT INTRO's switch (plan 45 W4). `index.html` stamps `fxr-intro` on <html> before anything paints — a load of `/`,
 * motion allowed — and the static loader drops its mark for it. Signed-out Home's stage claims it and grows the one line
 * from the mark to the full screen; nothing claims it (signed in, no API) → main.jsx lets the plain loader go. */
export const INTRO = typeof document !== 'undefined' && document.documentElement.classList.contains('fxr-intro')
let claimed = false, ended = false
/* true while the intro is the stage's to play — StrictMode's second mount gets it again */
export const claimIntro = () => { if (!INTRO || ended) return false; claimed = true; return true }
export const introClaimed = () => claimed
export const endIntro = () => { ended = true; document.documentElement.classList.remove('fxr-intro') }
