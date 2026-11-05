import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
// Production-shaped URLs are fulfilled entirely from disk; no live room or
// production server is contacted. Run from the repository root.
const [source = 'lobby', phase = 'after'] = process.argv.slice(2);
const directory = resolve(source);
const output = resolve('docs/qa/lobby-polish');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({channel:'msedge'});
const page = await browser.newPage({deviceScaleFactor:1});
const origin = 'https://magical-athlete-online.cn/';
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'application/javascript','.json':'application/json','.svg':'image/svg+xml'};
const errors = [];
page.on('pageerror', e=>errors.push(e.message));
page.on('response', r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
await page.route('**/*', async route=>{
  const url = new URL(route.request().url());
  if(url.origin !== new URL(origin).origin) return route.abort();
  const file = resolve(directory, '.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(directory+'\\') && !file.startsWith(directory+'/'))return route.abort();
  try {await route.fulfill({body:await readFile(file),contentType:types[extname(file)]||'text/plain'});}
  catch {await route.fulfill({status:404,body:''});}
});
const results=[];
for(const [width,height] of [[1440,900],[1366,768],[390,844],[320,720],[844,390]]){
  await page.setViewportSize({width,height});
  await page.goto(origin);
  await page.locator('#choices:not([aria-busy])').waitFor();
  await page.locator('.art img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  await page.waitForTimeout(250);
  const geometry=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth>innerWidth,
    cards:[...document.querySelectorAll('.game')].map(e=>{const r=e.getBoundingClientRect();const a=e.querySelector('.action').getBoundingClientRect();return {bottom:r.bottom,button:{width:a.width,height:a.height},href:e.getAttribute('href')};})
  }));
  if(geometry.overflow)throw Error(`Overflow at ${width}`);
  await page.screenshot({path:resolve(output,`${phase}-${width}x${height}.png`),fullPage:true});
  results.push({width,height,...geometry});
}
await page.setViewportSize({width:1440,height:900});
await page.locator('[data-game="athlete"]').hover();
await page.waitForTimeout(250);
await page.screenshot({path:resolve(output,`${phase}-hover.png`),fullPage:true});
await browser.close();
console.log(JSON.stringify({phase,results,errors},null,2));
await writeFile(resolve(output,`${phase}-geometry.json`),JSON.stringify({phase,results,errors},null,2)+'\n');
if(errors.length)process.exitCode=1;
