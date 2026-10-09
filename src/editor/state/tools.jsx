import { createContext, useContext, useState } from 'react'

/**
 * Active editor tool — pointer mode for the canvas. One global value across
 * all modes; `select` is the default and the only one that supports the
 * existing select / drag / resize gestures. Other tools enter create mode:
 * mousedown + drag commits a new layer of the matching type.
 *
 * After a non-Select tool commits, the editor flips back to Select so the
 * user immediately gets normal selection gestures on the freshly-created
 * layer.
 */
export const TOOLS = ['select', 'text', 'pen', 'rect', 'ellipse', 'triangle', 'line', 'polygon', 'star', 'pattern', 'zoom', 'hand', 'orbit']

export const TOOL_META = {
  select:   { id: 'select',   label: 'Select',     icon: 'pointer',   shortcut: 'V' },
  text:     { id: 'text',     label: 'Text',       icon: 'type',     shortcut: 'T' },
  pen:      { id: 'pen',      label: 'Pen',        icon: 'pen',      shortcut: 'P' },
  rect:     { id: 'rect',     label: 'Rectangle',  icon: 'rectangle',     shortcut: 'R' },
  ellipse:  { id: 'ellipse',  label: 'Ellipse',    icon: 'circle',  shortcut: 'O' },
  triangle: { id: 'triangle', label: 'Triangle',   icon: 'triangle', shortcut: '' },
  line:     { id: 'line',     label: 'Line',       icon: 'line',     shortcut: '' },
  polygon:  { id: 'polygon',  label: 'Polygon',    icon: 'polygon',  shortcut: '' },
  star:     { id: 'star',     label: 'Star',       icon: 'star',     shortcut: '' },
  pattern:  { id: 'pattern',  label: 'Pattern',    icon: 'pattern-tool',  shortcut: '' },
  /* Zoom is a viewport tool, not a create tool — click zooms in at the
   * pointer, Alt+click zooms out. Never commits a layer. */
  zoom:     { id: 'zoom',     label: 'Zoom',       icon: 'search',          shortcut: 'Z' },
  /* Hand pans the viewport on drag — Space-drag as a tool (Affinity's H; `H` is hide here, so it
   * has no key). `direction-cross` stands in until a `hand` cut lands (plan 17). */
  hand:     { id: 'hand',     label: 'Hand',       icon: 'direction-cross', shortcut: '' },
  /* Orbit is a viewport tool for 3D layers — drag over a 3D-capable layer
   * (math 3D, Soft Forms 3D, GL scenes) rotates its camera, wheel zooms.
   * Layer move/marquee is off in this mode, so orbit never fights a drag. */
  /* `shape-torus`, not `camera` (spec R9.2, the user's 10): `camera` is the webcam on this screen,
   * and no glyph means two things. An `orbit` cut is owed (plan 17). */
  orbit:    { id: 'orbit',    label: 'Orbit',      icon: 'shape-torus',   shortcut: 'C' },
}

const ToolContext = createContext(null)

export function ToolProvider({ children }) {
  const [tool, setTool] = useState('select')
  return <ToolContext.Provider value={{ tool, setTool }}>{children}</ToolContext.Provider>
}

export function useTool() {
  const ctx = useContext(ToolContext)
  if (!ctx) return { tool: 'select', setTool: () => {} }
  return ctx
}
