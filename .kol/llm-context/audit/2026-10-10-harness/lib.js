// Shared Playwright harness for the kol-fxr audit. Preview server: http://localhost:4173
const {chromium}=require('playwright-core');
const BASE='http://localhost:4173';
async function launch(opts={}){
  const browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:opts.width||1600,height:opts.height||1000},deviceScaleFactor:opts.dpr||1});
  const errors=[]; page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(m.type()+': '+m.text().slice(0,300))}); page.on('pageerror',e=>errors.push('PAGEERROR '+e.message));
  return {browser,page,errors};
}
async function open(page,route='/editor',opts={}){ await page.goto(BASE+route,{waitUntil:'networkidle'}); if(!opts.keep){ await page.evaluate(()=>{try{localStorage.clear();sessionStorage.clear()}catch(e){}}); await page.goto(BASE+route,{waitUntil:'networkidle'}); } await page.waitForTimeout(800); }
async function dialogs(page){ return page.evaluate(()=>[...document.querySelectorAll('[role=dialog],[role=alertdialog],.kol-modal,[class*=overlay]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.className.toString().slice(0,60)+' :: '+e.textContent.trim().slice(0,80))); }
// toolbar tool by its title attribute: Select, Text, Pen, Rectangle, Pattern, Zoom, Orbit, Flip horizontal, Flip vertical, Rotate 90° left, Rotate 90° right, Unite, Insert image, Crop image, Duplicate
const TOOL_KEYS={select:'v',text:'t',pen:'p',rect:'r',ellipse:'o',zoom:'z',orbit:'c'};
async function key(page,k){ await page.keyboard.press(k); await page.waitForTimeout(150); }
async function toolKey(page,name){ await page.keyboard.press(TOOL_KEYS[name]); await page.waitForTimeout(150); }
async function tool(page,title){ await page.click(`.kol-editor-canvas-column button[title="${title}"], .kol-editor-canvas-column button[aria-label="${title}"]`); await page.waitForTimeout(150); }
// canvas main is .kol-editor-canvas; the frame (artboard) is inside it. drag in page coords
async function drag(page,x1,y1,x2,y2,mods={}){ await page.mouse.move(x1,y1); await page.mouse.down(); await page.mouse.move(x2,y2,{steps:12}); await page.mouse.up(); await page.waitForTimeout(250); }
async function frameRect(page){ return page.evaluate(()=>{const m=document.querySelector('main.kol-editor-canvas'); const f=[...m.querySelectorAll('div.shrink-0')].find(e=>e.getBoundingClientRect().width>300); return f?f.getBoundingClientRect().toJSON():null}); }
async function tab(page,label){ await page.click(`.kol-mono-12:text-is("${label}")`); await page.waitForTimeout(200); }
// Measure everything text-like and control-like inside a rail: side = 'left'|'right'
async function measureRail(page,side){
  return page.evaluate((side)=>{
    const root=document.querySelector(side==='left'?'.kol-editor-left':'.kol-editor-right'); if(!root) return null;
    const out=[]; const seen=new Set();
    const walk=(el)=>{ for(const c of el.children){ const r=c.getBoundingClientRect(); if(r.width===0||r.height===0){continue;}
      const cs=getComputedStyle(c); const own=[...c.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ').trim();
      const isCtl=['INPUT','BUTTON','SELECT','TEXTAREA'].includes(c.tagName)||c.getAttribute('role')==='slider'||c.getAttribute('role')==='switch'||c.getAttribute('role')==='tab';
      if(own||isCtl){ out.push({tag:c.tagName,text:(own||c.value||c.title||c.getAttribute('aria-label')||c.textContent.trim()).slice(0,40),cls:c.className.toString().split(' ').filter(k=>/^kol-|^text-|^uppercase|^font-|^w-|^h-|^px-|^min-w|^max-w|^flex-1|^grow|^basis/.test(k)).join(' ').slice(0,120),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),fs:cs.fontSize,lh:cs.lineHeight,tt:cs.textTransform,ls:cs.letterSpacing,fw:cs.fontWeight,color:cs.color}); }
      walk(c);} };
    walk(root); return out; },side);
}
async function shot(page,name){ await page.screenshot({path:name}); }
async function railShot(page,side,name){ const el=await page.$(side==='left'?'.kol-editor-left':'.kol-editor-right'); await el.screenshot({path:name}); }
async function layers(page){ return page.evaluate(()=>[...document.querySelectorAll('[data-layer-id]')].map(e=>({id:e.getAttribute('data-layer-id'),text:e.textContent.trim().slice(0,30)}))); }
async function cursorAt(page,x,y){ await page.mouse.move(x,y); await page.waitForTimeout(80); return page.evaluate(([x,y])=>{const el=document.elementFromPoint(x,y); return {cursor:getComputedStyle(el).cursor,el:el.tagName+'.'+el.className.toString().slice(0,50)}},[x,y]); }
module.exports={dialogs,key,toolKey,TOOL_KEYS,launch,open,tool,drag,frameRect,tab,measureRail,shot,railShot,layers,cursorAt,BASE};
