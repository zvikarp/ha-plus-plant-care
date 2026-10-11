const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']}); const page=await browser.newPage();
 const src=process.argv[2], phase=process.argv[3]; const results=[];
 for(const width of [320,375,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  await page.setContent('<style>body{margin:0;font-family:Arial;--primary-color:#03a9f4;--card-background-color:white;--primary-text-color:#212121;--secondary-text-color:#666;--divider-color:#ccc;--secondary-background-color:#eee}ha-card{display:block;border:1px solid #ccc;border-radius:12px}ha-icon{display:inline-block;width:24px;height:24px}</style><plant-care-plus-card style="width:min(100%,320px)"></plant-care-plus-card>');
  await page.addScriptTag({content:fs.readFileSync(src,'utf8')});
  await page.evaluate(()=>{window.calls=[];window.infos=[];let card=document.querySelector('plant-care-plus-card');card.setConfig({entity:'sensor.plant_status'});card.hass={states:{'sensor.plant_status':{state:'needs_attention',attributes:{plant_name:'VeryLongPlantNameWithNoSpaces'.repeat(3),reason:'Check the soil before watering this plant today.',related_entities:{moisture:'sensor.moisture'}}},'sensor.moisture':{state:'42',attributes:{unit_of_measurement:'%'}}},callService:()=>new Promise(resolve=>{window.calls.push(1);window.finishWater=resolve})};card.addEventListener('hass-more-info',e=>window.infos.push(e.detail.entityId));});
  results.push(await page.evaluate(()=>{const card=document.querySelector('plant-care-plus-card'),s=card.shadowRoot;return {width:innerWidth,page:document.documentElement.scrollWidth,headerWidth:s.querySelector('.header').scrollWidth,cardWidth:card.clientWidth,columns:getComputedStyle(s.querySelector('.stats')).gridTemplateColumns};}));
  await page.screenshot({path:`/tmp/plant-care-responsive-plant-${phase}-${width}.png`,fullPage:true});
 }
 if(phase==='after'){
  await page.setViewportSize({width:320,height:1000});
  const header=page.locator('plant-care-plus-card .header');await header.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');
  page.once('dialog',d=>d.dismiss());await page.locator('plant-care-plus-card .water').click();
  if(await page.evaluate(()=>window.calls.length)!==0)throw Error('cancelled watering wrote data');
  page.once('dialog',d=>d.accept());await page.locator('plant-care-plus-card .water').click();
  if(!await page.locator('plant-care-plus-card .water').isDisabled())throw Error('pending action enabled');
  await page.evaluate(()=>window.finishWater()); await page.waitForFunction(()=>document.querySelector('plant-care-plus-card').shadowRoot.querySelector('.message').textContent==='Watering recorded');
  if(await page.evaluate(()=>window.calls.length)!==1)throw Error('duplicate water call');
  if(await page.evaluate(()=>window.infos.length)!==2)throw Error('keyboard header');
  await page.locator('plant-care-plus-card .stat[data-key=moisture]').click();
  await page.evaluate(()=>document.body.style.fontSize='32px');
  await page.screenshot({path:'/tmp/plant-care-responsive-plant-after-zoom.png'});
  results.push(await page.evaluate(()=>({zoomPage:document.documentElement.scrollWidth,width:innerWidth})));
 }
 fs.writeFileSync(`/tmp/plant-care-responsive-plant-${phase}.json`,JSON.stringify(results,null,2));console.log(results);await browser.close();
})();
