import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const mode=process.argv[2]||'before';
const out=new URL('./',import.meta.url);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
for (const [name,width,height] of [['desktop',1440,1000],['portrait',390,844],['landscape',844,390]]) {
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.ATHLETE_REVIEW_URL||'http://127.0.0.1:5181/');
  await page.locator('.current-line').filter({hasText:'可用'}).waitFor();
  await page.screenshot({path:new URL(`athlete-${mode}-${name}.png`,out).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});
  console.log(JSON.stringify({name,mode,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),errors}));
  await context.close();
}
await browser.close();
