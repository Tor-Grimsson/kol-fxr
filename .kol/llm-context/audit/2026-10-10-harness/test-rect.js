const L=require('./lib');
(async()=>{
  const {browser,page,errors}=await L.launch();
  await L.open(page); const f=await L.frameRect(page);
  await L.toolKey(page,'rect'); console.log('tool after R',await page.evaluate(()=>document.querySelector('[data-tool]')?.getAttribute('data-tool')));
  await L.drag(page,f.x+100,f.y+100,f.x+400,f.y+300);
  console.log('layers',await L.layers(page));
  const m=await L.measureRail(page,'right'); console.log(JSON.stringify(m,null,0).slice(0,6000));
  await L.railShot(page,'right','rail-right-rect.png'); await L.shot(page,'rect.png');
  console.log('errors',errors); await browser.close();
})();
