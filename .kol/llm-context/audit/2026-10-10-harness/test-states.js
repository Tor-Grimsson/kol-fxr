const L=require('./lib'); const S=require('./states');
(async()=>{
  const {browser,page,errors}=await L.launch();
  const run=async(name,fn)=>{ await L.open(page); try{ await fn(page);}catch(e){ console.log(name,"ERR",e.message.split("\n")[0], await L.dialogs(page)); } const ls=await L.layers(page); const sel=await page.evaluate(()=>[...document.querySelectorAll('.kol-editor-left [data-layer-id][class*=selected],.kol-editor-left [data-layer-id][aria-selected=true],.kol-editor-left [data-layer-id].is-active')].map(e=>e.textContent.trim().slice(0,20))); const secs=await page.evaluate(()=>[...document.querySelectorAll('.kol-editor-right h3')].map(h=>h.textContent.trim())); console.log(name,'| layers',ls.filter(l=>l.text).map(l=>l.text).join(','),'| sel',sel.join(','),'| sections',secs.join(',')); await L.shot(page,`state-${name}.png`); };
  await run('rect',S.rect); await run('ellipse',S.ellipse); await run('triangle',p=>S.shape(p,'Triangle')); await run('polygon',p=>S.shape(p,'Polygon')); await run('star',p=>S.shape(p,'Star')); await run('line',p=>S.shape(p,'Line'));
  await run('path',S.path); await run('text',S.text); await run('pattern',S.pattern); await run('loop',S.loop); await run('image',S.image);
  await run('multi',S.multi); await run('group',S.group); await run('bool',S.bool); await run('locked',S.locked); await run('canvas',S.canvasSel);
  console.log('errors',errors.slice(0,10)); await browser.close();
})();
