import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={viewports:[],states:[],errors:[]};
const shot=new URL('./',import.meta.url);
const url=process.env.ATHLETE_REVIEW_URL||'http://127.0.0.1:5181/';
for(const [name,width,height] of [['desktop',1440,1000],['portrait',390,844],['landscape',844,390],['small',320,700]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url);await expect(page.locator('.current-line')).toContainText('可用');
 await expect(page.getByRole('link',{name:'返回游戏大厅'})).toHaveAttribute('href','https://magical-athlete.qiuh23.workers.dev/lobby/');
 await expect(page.getByRole('button',{name:'开启提示音'})).toHaveAccessibleName('开启提示音');
 await page.getByRole('tab',{name:'创建房间',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'现有房间',exact:true})).toBeFocused();await expect(page.locator('#entry-form')).toHaveCount(0);await page.keyboard.press('Home');await page.keyboard.press('Enter');
 await page.getByLabel('你的昵称').fill('入口验收');await page.getByLabel('房间人数上限').selectOption('2');await page.getByLabel('每次操作时限').selectOption('60');
 await expect(page.getByRole('group',{name:'角色包',exact:true})).toBeVisible();await expect(page.getByRole('group',{name:'人数玩法',exact:true})).toBeVisible();
 const checkbox=page.getByRole('checkbox',{name:'Extra Mile',exact:true});await checkbox.check();await expect(checkbox).toBeChecked();
 await expect(page.getByRole('button',{name:'创建房间，召集朋友',exact:true})).toBeEnabled();
 await page.screenshot({path:new URL(`athlete-after-create-${name}.png`,shot).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);expect(overflow).toBe(false);
 const tiny=await checkbox.boundingBox();report.viewports.push({name,width,height,overflow,checkbox:tiny});
 await page.getByRole('button',{name:'← 返回首页（保留设置）',exact:true}).click();await expect(page.getByRole('tab',{name:'创建房间',exact:true})).toBeFocused();await page.getByRole('tab',{name:'创建房间',exact:true}).click();await expect(page.getByLabel('你的昵称')).toHaveValue('入口验收');await expect(checkbox).toBeChecked();await expect(page.getByLabel('房间人数上限')).toHaveValue('2');
 await page.getByRole('tab',{name:'自己练习',exact:true}).click();await expect(page.getByRole('button',{name:'开始自己练习',exact:true})).toBeEnabled();await expect(checkbox).not.toBeChecked();await page.getByRole('tab',{name:'人机对战',exact:true}).click();await expect(page.getByLabel('AI 人数',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'开始人机对战',exact:true})).toBeEnabled();
 await page.getByRole('tab',{name:'现有房间',exact:true}).click();await page.getByLabel('房间码',{exact:true}).fill('C-ABC234');await page.getByRole('radio',{name:/作为观战者/}).check();await expect(page.getByRole('button',{name:'进入房间观战',exact:true})).toBeEnabled();await expect(page.getByRole('region',{name:'现有房间',exact:true})).toBeVisible();
 await page.goto(url+'room/C-ABC234?spectate=1');await expect(page.getByRole('radio',{name:/作为观战者/})).toBeChecked();await expect(page.getByLabel('房间码',{exact:true})).toHaveValue('C-ABC234');await expect(page.locator('.setup-heading h2')).toBeFocused();
 await page.getByText('线路设置',{exact:true}).click();await expect(page.getByRole('button',{name:'当前线路 Cloudflare',exact:true})).toBeDisabled();
 await context.close();
}
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});const page=await context.newPage();await page.goto(url);await expect(page.locator('.current-line')).toContainText('可用');
const primary=page.getByRole('tab',{name:'创建房间',exact:true});
for(const state of ['default','hover','focus','disabled']){
 if(state==='hover')await primary.hover();if(state==='focus'){await page.mouse.move(0,0);await primary.focus();}if(state==='disabled')await primary.evaluate(e=>e.disabled=true);
 report.states.push(await primary.evaluate((e,state)=>{const c=getComputedStyle(e);return {state,color:c.color,background:c.backgroundColor,outline:c.outlineStyle,outlineWidth:c.outlineWidth};},state));
}
const luminance=color=>{const [r,g,b]=color.match(/\d+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return r*.2126+g*.7152+b*.0722;};for(const state of report.states){const a=luminance(state.color),b=luminance(state.background);state.contrast=Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2));expect(state.contrast).toBeGreaterThanOrEqual(4.5);}expect(report.states.find(s=>s.state==='focus').outline).toBe('solid');expect(report.errors).toEqual([]);await context.close();await browser.close();await writeFile(new URL('athlete-check-results.json',shot),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
