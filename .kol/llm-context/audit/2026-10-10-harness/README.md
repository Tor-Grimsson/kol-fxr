# Audit browser harness (kol-fxr, plan 22)

Preview server of the BUILT bundle is already running at http://localhost:4173 (do not start another). Chromium is at /opt/pw-browsers; `playwright-core@1.56.1` is installed in THIS directory. Run scripts from this directory: `cd <this dir> && node yourscript.js`. Never write files into /home/user/kol-fxr except where a task says so; screenshots go here or in a subfolder here.

## lib.js
```js
const L=require('./lib'); const S=require('./states');
const {browser,page,errors}=await L.launch({width:1600,height:1000});   // errors[] collects console errors/warnings + pageerrors
await L.open(page,'/editor');            // clears localStorage/sessionStorage first (no draft-restore), waits for networkidle
await L.toolKey(page,'rect');            // v select · t text · p pen · r rect · o ellipse · z zoom · c orbit (keys, see src/editor/state/keymap.js)
await L.tool(page,'Flip horizontal');    // toolbar button by aria-label/title: Select, Text, Pen, Rectangle, Pattern, Zoom, Orbit, Flip horizontal, Flip vertical, Rotate 90° left, Rotate 90° right, Unite, Insert image, Crop image, Duplicate
const f=await L.frameRect(page);         // the artboard's bounding box in page px ({x,y,width,height}) — at 1600×1000 it is ~ x474 y121 684×855 for the 4:5 default
await L.drag(page,x1,y1,x2,y2);          // mouse drag in page coords
await L.tab(page,'Parameters');          // click a rail tab by its label: Stroke Color Swatches | Layers Assets | Inspector Parameters Effects
const rows=await L.measureRail(page,'right'); // every text node + control inside a rail: {tag,text,cls,x,y,w,h,fs,lh,tt(text-transform),ls,fw,color}
await L.railShot(page,'right','name.png'); await L.shot(page,'full.png');
await L.layers(page);                    // [{id,text}] from [data-layer-id] (layer rows AND canvas elements share the id; rows have text)
await L.cursorAt(page,x,y);              // {cursor, el} computed cursor at a point
await L.dialogs(page);                   // visible dialogs/overlays
```
Footer tabs (Transport · Output · File) are inside `.kol-editor-rail-footer`; left rail root `.kol-editor-left`, right `.kol-editor-right`, topbar `.kol-editor-topbar`, toolbar `.kol-tool-palette`, canvas `main.kol-editor-canvas`. Layer rows: `.kol-editor-left .kol-layer-stack-row[data-layer-id]`, selected rows carry `.is-active`. Inspector section headings are `h3.kol-inspector-pane-title`.

## states.js — selection-state recipes (each starts from a fresh `L.open(page)`)
```js
await S.rect(page)        // R + drag → 'Rectangle' selected   (args dx,dy,w,h relative to the frame)
await S.ellipse(page)     // O + drag → 'Ellipse'
await S.shape(page,'Triangle'|'Polygon'|'Star'|'Line')   // via the shape fold's corner menu (Line: drag creates NOTHING — click-click does; see finding)
await S.path(page,true)   // pen: 4 clicks, close on the first point → 'path'  (false → Enter to leave it open)
await S.text(page)        // T + click, Esc, then click the 'New text' row → Typography section
await S.pattern(page)     // Pattern tool + click → 'Pattern'
await S.loop(page,'Drift','Cumulus')  // Generative menu is an inline accordion: category then preset → a loop layer named after the preset
await S.image(page)       // drops a generated PNG on the canvas → 'Photo'
await S.multi(page)       // two rects, Shift held + click on the first → both rows .is-active (inspector shows NO sections)
await S.group(page)       // multi then Control+g → 'Group'
await S.bool(page)        // multi then toolbar Unite → 'Unite' bool layer
await S.locked(page)      // rect then L
await S.canvasSel(page)   // click the Canvas row → Frame · Background sections
await S.menu(page,'File'); await S.menuItems(page); await S.menuItem(page,'Save…')   // top-bar menus render as [role=menu] button
await S.activeRows(page)  // selected layer-row texts
```
Modifiers: use `page.keyboard.down('Shift')` around `page.mouse.click` (page.mouse.click takes no modifiers). Mod = Control on this Linux Chromium (Control+g group, Control+d duplicate, Control+z undo).
Keys worth knowing (keymap.js): A node-edit (paths only), L lock, H hide, G grid, Shift+R rulers, I eyedropper, M modulation dots, S or ? shortcuts overlay, D default paint, X toggle fill/stroke focus, Shift+X swap, N clear paint, 1–9/0 opacity, Escape deselect, `,` settings drawer, Backspace delete.
