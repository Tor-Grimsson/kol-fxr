// Selection-state recipes for the kol-fxr audit. Each takes a page already opened at /editor and leaves the state selected.
const L=require('./lib');
async function frame(page){ return L.frameRect(page); }
async function menu(page,label){ await page.click(`.kol-editor-topbar button:has-text("${label}")`); await page.waitForTimeout(350); }
async function menuItem(page,text){ await page.click(`[role=menu] button:has-text("${text}"), [role=menu] [role=menuitem]:has-text("${text}")`); await page.waitForTimeout(400); }
async function menuItems(page){ return page.evaluate(()=>[...document.querySelectorAll('[role=menu] button, [role=menu] [role=menuitem]')].map(e=>e.textContent.trim().slice(0,40))); }
async function shapeVariant(page,name){ // Rectangle|Ellipse|Triangle|Line|Polygon|Star via the shape fold's corner
  const b=await page.$('.kol-tool-palette button[aria-label="Rectangle"], .kol-tool-palette button[title="Rectangle"], .kol-tool-palette button[aria-label="Ellipse"], .kol-tool-palette button[aria-label="Triangle"], .kol-tool-palette button[aria-label="Polygon"], .kol-tool-palette button[aria-label="Star"], .kol-tool-palette button[aria-label="Line"]');
  const bb=await b.boundingBox(); await page.mouse.click(bb.x+bb.width-4,bb.y+bb.height-4); await page.waitForTimeout(250);
  await page.click(`[role=menu] button:has-text("${name}")`); await page.waitForTimeout(200);
}
async function rect(page,dx=100,dy=100,w=300,h=200){ const f=await frame(page); await L.toolKey(page,'rect'); await L.drag(page,f.x+dx,f.y+dy,f.x+dx+w,f.y+dy+h); }
async function ellipse(page,dx=100,dy=100,w=300,h=200){ const f=await frame(page); await L.toolKey(page,'ellipse'); await L.drag(page,f.x+dx,f.y+dy,f.x+dx+w,f.y+dy+h); }
async function shape(page,name,dx=100,dy=100,w=300,h=200){ const f=await frame(page); await shapeVariant(page,name); await L.drag(page,f.x+dx,f.y+dy,f.x+dx+w,f.y+dy+h); }
async function path(page,close=true){ const f=await frame(page); await L.toolKey(page,'pen'); const pts=[[150,150],[400,180],[380,420],[160,380]]; for(const [x,y] of pts){ await page.mouse.click(f.x+x,f.y+y); await page.waitForTimeout(120);} if(close){ await page.mouse.click(f.x+150,f.y+150); } else { await page.keyboard.press('Enter'); } await page.waitForTimeout(300); }
async function text(page){ const f=await frame(page); await L.toolKey(page,'text'); await page.mouse.click(f.x+200,f.y+200); await page.waitForTimeout(400); await page.keyboard.press('Escape'); await page.waitForTimeout(200); await page.click('.kol-editor-left [data-layer-id]:has-text("New text")'); await page.waitForTimeout(200); }
async function pattern(page){ const f=await frame(page); await page.click('.kol-tool-palette button[aria-label="Pattern"], .kol-tool-palette button[title="Pattern"]'); await page.mouse.click(f.x+200,f.y+200); await page.waitForTimeout(400); }
async function loop(page,category='Drift',itemText='Cumulus'){ await menu(page,'Generative'); await menuItem(page,category); await menuItem(page,itemText); await page.waitForTimeout(900); }
async function image(page){ // drop a generated PNG onto the canvas
  const f=await frame(page);
  await page.evaluate(async ([x,y])=>{ const c=document.createElement('canvas'); c.width=320;c.height=200; const g=c.getContext('2d'); g.fillStyle='#c84'; g.fillRect(0,0,320,200); g.fillStyle='#248'; g.fillRect(40,40,120,120); const blob=await new Promise(r=>c.toBlob(r,'image/png')); const file=new File([blob],'drop.png',{type:'image/png'}); const dt=new DataTransfer(); dt.items.add(file); const el=document.elementFromPoint(x,y); for(const t of ['dragenter','dragover','drop']){ const ev=new DragEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y,dataTransfer:dt}); el.dispatchEvent(ev);} },[f.x+300,f.y+300]);
  await page.waitForTimeout(800);
}
async function selectLayerRow(page,text,mods){ await page.click(`.kol-editor-left [data-layer-id]:has-text("${text}") >> nth=0`,{modifiers:mods||[]}); await page.waitForTimeout(200); }
async function two(page){ await rect(page,60,60,220,160); await rect(page,340,360,220,160); }
async function multi(page){ await two(page); const f=await frame(page); await page.keyboard.down('Shift'); await page.mouse.click(f.x+150,f.y+140); await page.keyboard.up('Shift'); await page.waitForTimeout(250); }
async function activeRows(page){ return page.evaluate(()=>[...document.querySelectorAll('.kol-editor-left .kol-layer-stack-row.is-active')].map(e=>e.textContent.trim().slice(0,20))); }
async function group(page){ await multi(page); await page.keyboard.press('Control+g'); await page.waitForTimeout(300); }
async function bool(page){ await multi(page); await page.click('.kol-tool-palette button[aria-label="Unite"], .kol-tool-palette button[title="Unite"]'); await page.waitForTimeout(400); }
async function locked(page){ await rect(page); await page.keyboard.press('l'); await page.waitForTimeout(200); }
async function canvasSel(page){ await page.click('.kol-editor-left [data-layer-id="canvas"]'); await page.waitForTimeout(200); }
module.exports={activeRows,frame,menu,menuItem,menuItems,shapeVariant,rect,ellipse,shape,path,text,pattern,loop,image,selectLayerRow,two,multi,group,bool,locked,canvasSel};
