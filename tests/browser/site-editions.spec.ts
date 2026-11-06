import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { createApplication } from '../../src/server/index.js';
import { resolveTasks } from '../../src/engine/index.js';
import { SITE_NICKNAMES } from '../../src/shared/site-policy.js';
import type { GameState } from '../../src/shared/types.js';
let application:ReturnType<typeof createApplication>,url:string;
const old={SITE_EDITION:process.env.SITE_EDITION,BACKEND_ID:process.env.BACKEND_ID};
test.beforeAll(async()=>{process.env.SITE_EDITION='cn';process.env.BACKEND_ID='aliyun';application=createApplication(':memory:');await new Promise<void>(resolve=>application.http.listen(0,'127.0.0.1',resolve));const address=application.http.address();if(!address||typeof address==='string')throw Error('No test address');url=`http://127.0.0.1:${address.port}`;mkdirSync('test-results/site-editions',{recursive:true});});
test.afterAll(async()=>{await application.close();for(const key of ['SITE_EDITION','BACKEND_ID'] as const){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}});

test('domestic home ignores forged storage and URL policy and exposes only fixed names and same-site invitation errors',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('magical-athlete:name','旧自由昵称绝不可公开');localStorage.setItem('magical-athlete:backend-preference:v1','cloudflare');localStorage.setItem('SITE_EDITION','global');});
 await page.goto(url+'/?SITE_EDITION=global&backend=cloudflare');
 await expect(page.locator('.current-line')).toContainText('已连接');
 const name=await page.locator('.fixed-nickname strong').innerText();expect(SITE_NICKNAMES.map(value=>value.name)).toContain(name);
 await page.getByRole('button',{name:'更换随机昵称',exact:true}).click();await expect(page.locator('.fixed-nickname strong')).not.toHaveText(name);
 await page.getByRole('tab',{name:'创建房间',exact:true}).click();await expect(page.locator('input[name="name"]')).toHaveCount(0);
 await expect(page.locator('.server-choices,input[name="server"],.room-chat')).toHaveCount(0);
 await expect(page.getByText('旧自由昵称绝不可公开',{exact:true})).toHaveCount(0);
 await page.goto(url+'/room/C-ABC234?SITE_EDITION=global');await expect(page.getByText('此邀请不属于当前站点，请向房主确认原始邀请链接。',{exact:true})).toBeVisible();
 expect(new URL(page.url()).origin).toBe(url);
 await page.screenshot({path:'test-results/site-editions/cn-foreign-invite.png',fullPage:true});
});

test('domestic multiplayer, spectator, refresh and landscape race retain controls with no communication UI',async({browser})=>{
 const host=application.rooms.create('追风',2,0,'multiplayer',3,'original',undefined,undefined,'athlete-01');
 const guest=application.rooms.join(host.identity.roomCode,'冲线','player','athlete-02');
 const watcher=application.rooms.join(host.identity.roomCode,'接力','spectator','athlete-03');
 const room=structuredClone(application.rooms.get(host.identity.roomCode));
 const game:GameState={phase:'race',round:1,track:'mild',players:room.game.players,deck:[],discard:[],turn:0,turnCount:0,currentRacerId:'r0',queue:[],logs:[],results:[],rngState:1234,randomLog:[],flags:{testDice:[3]},racers:[host.identity,guest.identity].map((identity,index)=>({id:`r${index}`,playerId:identity.playerId,characterId:['banana','centaur'][index]!,position:0,tripped:false,finished:false,eliminated:false,flags:{}}))};
 game.queue.push({kind:'beginTurn',racerId:'r0'});resolveTasks(game);room.game=game;room.version++;room.deadline=null;application.rooms.rooms.set(room.code,room);application.store.save(room);
 for(const [identity,role] of [[host.identity,'host'],[watcher.identity,'spectator']] as const){
  const context=await browser.newContext({viewport:{width:844,height:390}});const page=await context.newPage();
  await context.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:aliyun:${identity.roomCode}`,JSON.stringify({...identity,backendId:'aliyun'}));localStorage.setItem('magical-athlete:low-quality','true');localStorage.setItem('magical-athlete:reduced-motion','true');},identity);
  await page.goto(`${url}/room/A-${room.code}${role==='spectator'?'?spectate=1':''}`);await expect(page.getByTestId('board-3d')).toBeVisible();
  await expect(page.locator('.room-chat,.room-community,.chat-toggle,.chat-notice,.chat-notice-region,input[name="name"]')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'更换随机昵称',exact:true})).toHaveCount(0);
  const geometry=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,hud:getComputedStyle(document.documentElement).getPropertyValue('--race-hud-height')}));expect(geometry.width).toBeLessThanOrEqual(geometry.viewport+1);expect(geometry.hud).not.toBe('');
  if(role==='host'){await expect(page.getByTestId('roll-button')).toBeEnabled();await page.getByTestId('roll-button').click();await expect.poll(()=>application.rooms.get(room.code).game.racers[0]!.position).toBeGreaterThan(0);}
  else await expect(page.getByText('观战中 · 赛况自动同步',{exact:true})).toBeVisible();
  await page.reload();await expect(page.getByTestId('board-3d')).toBeVisible();expect(application.rooms.get(room.code).game.players[0]!.name).toBe('追风');
  await page.screenshot({path:`test-results/site-editions/cn-landscape-${role}.png`});await context.close();
 }
});

test('each local lobby artifact contains three own-site entry links and never redirects a foreign invitation',async({page})=>{
 await page.goto(url+'/lobby/');await expect(page.locator('[data-game][href]')).toHaveCount(3);await expect(page.locator('input[name="server"]')).toHaveCount(0);
 const hrefs=await page.locator('[data-game]').evaluateAll(links=>links.map(link=>(link as HTMLAnchorElement).href));expect(hrefs.every(value=>new URL(value).hostname.endsWith('.magical-athlete-online.cn'))).toBeTruthy();
 await page.goto(url+'/lobby/?game=athlete&room=C-ABC234');await expect(page.locator('#status')).toHaveText('此邀请不属于当前站点，请向房主确认原始邀请链接。');expect(new URL(page.url()).origin).toBe(url);
});
