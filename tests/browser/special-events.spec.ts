import {test,expect} from '@playwright/test';
import {createApplication} from '../../src/server/index.js';
import {createGame,resolveTasks} from '../../src/engine/index.js';

let app:ReturnType<typeof createApplication>,url:string;
test.beforeAll(async()=>{app=createApplication(':memory:');await new Promise<void>(resolve=>app.http.listen(0,'127.0.0.1',resolve));const a=app.http.address();if(!a||typeof a==='string')throw Error('no address');url=`http://127.0.0.1:${a.port}`;});
test.afterAll(async()=>app.close());

test('special event setup explains automatic events, validates rounds and saves the chosen settings',async({page},info)=>{
 await page.goto(url);await page.getByRole('tab',{name:'创建房间',exact:true}).click();
 await page.getByLabel('你的昵称').fill('特殊赛事设置');
 await expect(page.getByText(/规则待确认|尚未取得完整事件表|待开放内容/)).toHaveCount(0);
 await expect(page.locator('.event-status')).toContainText('当前关闭');
 await expect(page.locator('.event-instructions')).toContainText('系统自动抽取');
 await page.getByRole('checkbox',{name:'启用 36 项粉丝事件（网页适配）'}).check();
 await expect(page.getByRole('checkbox',{name:'第 3 场',exact:true})).toBeChecked();
 await expect(page.locator('.config-main .schedule-preview li').nth(2)).toContainText('Thrilling Thirds');
 await page.locator('.special-event-settings').screenshot({path:info.outputPath('special-event-controls.png')});
 await page.getByRole('checkbox',{name:'第 3 场',exact:true}).uncheck();
 await expect(page.locator('.event-status')).toContainText('至少勾选一场');
 await expect(page.getByRole('button',{name:'创建房间，召集朋友'})).toBeDisabled();
 await page.getByRole('checkbox',{name:'第 3 场',exact:true}).check();
 await page.getByRole('checkbox',{name:'第 1 场',exact:true}).check();
 await page.getByRole('button',{name:/返回首页（保留设置）/}).click();await page.getByRole('tab',{name:'创建房间',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'第 1 场',exact:true})).toBeChecked();await expect(page.getByRole('checkbox',{name:'第 3 场',exact:true})).toBeChecked();
 await expect(page.locator('.event-status')).toContainText('第 1、3 场各抽取 1 项');
 await page.screenshot({path:info.outputPath('special-event-setup-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:info.outputPath('special-event-setup-mobile.png'),fullPage:true});
 await page.getByRole('button',{name:'创建房间，召集朋友'}).click();await expect(page).toHaveURL(/\/room\/[CA]-[A-Z2-9]{6}$/);
 const code=page.url().split('/').at(-1)!.replace(/^[CA]-/,'');
 expect(app.rooms.get(code).game.config?.competition?.thrillingThirds).toEqual({enabled:true,rounds:[1,3]});
 await page.reload();await page.locator('.room-config-panel > summary').click();
 await expect(page.locator('.event-status')).toContainText('第 1、3 场各抽取 1 项');
 await page.getByRole('checkbox',{name:'启用 36 项粉丝事件（网页适配）'}).uncheck();
 await expect(page.getByRole('group',{name:'特殊赛事适用场次'})).toHaveCount(0);
 await expect(page.locator('.event-status')).toContainText('当前关闭');
 await page.getByRole('button',{name:'保存本房间设置',exact:true}).click();
 await expect.poll(()=>app.rooms.get(code).game.config?.competition?.thrillingThirds).toEqual({enabled:false,rounds:[]});
});

test('three browsers submit secret guesses, refresh and see one event reward',async({browser},info)=>{
 const made=app.rooms.create('事件房主',3,0),code=made.identity.roomCode,peers=[app.rooms.join(code,'猜测者甲'),app.rooms.join(code,'猜测者乙')];
 const room=app.rooms.get(code),s=createGame(room.game.players,41);s.phase='race';s.round=1;s.currentRacerId='r0';s.baseTurnOrder=['r0','r1','r2'];s.racers=s.players.map((p,i)=>({id:`r${i}`,playerId:p.id,characterId:'banana',position:2+i*8,finished:false,eliminated:false,tripped:false,flags:{}}));s.flags.thirds={id:'mastermind',round:1,held:{},extraCards:[]};s.scoreLedger=s.players.map(p=>({playerId:p.id,placement:0,map:0,skill:0,event:0,total:0}));s.queue=[{kind:'beginTurn',racerId:'r0'}];resolveTasks(s);s.flags.testDice=[4];room.game=s;room.version++;app.store.save(room);
 const contexts=await Promise.all([made,...peers].map(()=>browser.newContext()));const pages=await Promise.all(contexts.map(c=>c.newPage()));const errors:string[]=[];
 try{
  for(const [i,page] of pages.entries()){page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity));for(const key of ['reduced-motion','low-quality','muted'])localStorage.setItem(`magical-athlete:${key}`,'true');},[made,...peers][i]!.identity);await page.goto(`${url}/room/${code}`);await expect(page.getByTestId('special-event')).toContainText('特殊赛事');}
  await pages[1]!.getByRole('region',{name:'待处理技能'}).getByRole('button',{name:'4',exact:true}).click();await pages[1]!.reload();
  await expect(pages[2]!.getByRole('region',{name:'待处理技能'})).toBeVisible();await pages[2]!.getByRole('region',{name:'待处理技能'}).getByRole('button',{name:'2',exact:true}).click();
  await expect(pages[0]!.getByTestId('roll-button')).toBeEnabled();await pages[0]!.getByTestId('roll-button').click();
  await expect.poll(()=>app.rooms.get(code).game.players[1]!.score).toBe(1);const scored=app.rooms.get(code);expect(scored.game.scoreLedger![1]!.event).toBe(1);expect(scored.game.racers[0]!.position).toBe(6);
  for(const page of pages)await expect.poll(async()=>Number(await page.locator('.game-shell').getAttribute('data-room-version'))).toBeGreaterThanOrEqual(scored.version);
  await pages[0]!.setViewportSize({width:390,height:844});
  await expect(pages[0]!.getByTestId('special-event').getByText('本场生效；需要你选择时会自动提示，其余效果由系统结算。')).toBeVisible();
  await pages[0]!.getByTestId('special-event').locator('summary').click();await expect(pages[0]!.getByTestId('special-event')).not.toHaveAttribute('open','');
  await pages[0]!.getByTestId('special-event').locator('summary').click();
  await pages[0]!.screenshot({path:info.outputPath('event-mobile.png')});expect(await pages[0]!.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
 }finally{await Promise.all(contexts.map(c=>c.close()));}
});
