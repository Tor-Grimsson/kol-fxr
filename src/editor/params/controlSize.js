import { createContext, useContext } from 'react'

/**
 * The size group a rail renders at — 'sm' | 'md' | 'lg', the DS button ladder
 * (26 / 32 / 40) that Input, Dropdown, SegmentedToggle, ToggleSwitch, ViewToggle,
 * Textarea and Button all speak.
 *
 * 'sm' is the desktop inspector and needs no provider. LabsView provides 'md'
 * on touch so the whole params drawer is ONE group. Until 2026-09-01 the rail
 * was 'sm' everywhere and kol-theme 0.112.0's coarse-pointer floor pushed only
 * the INPUTS to 16px: a 16px number beside a 12px dropdown, boxes a third
 * wider than the rows were measured for, the slider squeezed to 32px and the
 * transport wrapping.
 *
 * WHY 'md' AND NOT 'lg' (user, 2026-09-01: "lg is taking too much space …
 * consistency!!"): 'md' is the one rung where the DS's ladders agree — Input,
 * Dropdown, SegmentedToggle, ToggleSwitch, ViewToggle and Button are all 32px
 * on mono-14. At 'lg' the dropdown trigger is 36 against the others' 40, at
 * 'sm' it is 28 against 26. The coarse-pointer input floor would still split
 * 'md' (16px in a 32px box); kol-labs.css switches it off in the touch rail
 * and index.html's `maximum-scale=1` closes the iOS focus-zoom it guarded.
 *
 * A context, not a prop: the rail is a dozen components deep and every one of
 * them wrote `size="sm"` as a literal.
 */
export const ControlSizeContext = createContext('sm')
export const useControlSize = () => useContext(ControlSizeContext)

/* THE STRIP MUST NEVER OVERFLOW (the mobile chrome's law, MobileOverlay). A
   `.kol-seg-cell` is `flex: 1` but a flex item's default `min-width: auto` pins
   it to its own nowrap text, so three lg cells (px-20, mono-16) push past a
   320 drawer and the last label clips ("Animat…", "Fil…"). `min-w-0` lets them
   share the track, px-1 (MobileOverlay's scope strips wear the same) keeps a
   9-char label whole in a third of the drawer. Every rung above 'sm' — the
   sm ladder fits its rails. The hover line: iOS keeps :hover on the last tapped
   cell, and kol-theme's rule is unguarded, so the rest ink wins where hover
   cannot exist — never on the ACTIVE cell, whose ink is the selection. */
export const STRIP_CLAMP = '[&_.kol-seg-cell]:min-w-0 [&_.kol-seg-cell]:px-1 [&_.kol-seg-cell]:overflow-hidden [@media(hover:none)]:[&_.kol-seg-cell:hover:not(.is-active)]:text-[var(--kol-oq-48)]'
export const stripClamp = (cs) => (cs === 'sm' ? undefined : STRIP_CLAMP)

/* The labs rail's inline label column — wide enough for "ORIGINAL COLOR".
   Shared by every row shape in the rail (AutoControls' schema rows, the
   picker stack, LoopFields' theme rows) so their controls start on one x. */
export const RAIL_LABEL_W = 96
