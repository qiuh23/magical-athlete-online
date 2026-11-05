import { test, expect } from './fixtures.js';
import type { Page, Locator } from '@playwright/test';
import { parseRoomCode } from '../../src/client/backends.js';
import { enqueueMove, resolveTasks } from '../../src/engine/index.js';
import { mockDirection, landscapeCycle } from './direction-fixture.js';

const sizes=[[390,844],[844,390],[390,844],[667,375],[375,667],[568,320],[320,568],[800,360],[360,800],[932,430],[430,932],[1440,900]];
async function settle(page:Page) { await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())))); }
async function fits(page:Page,locator?:Locator) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(locator) await expect.poll(()=>locator.evaluate(n=>{const r=n.getBoundingClientRect();return r.width>=40&&r.height>=40&&r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1&&n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
}
test.beforeEach(async({page})=>{
  await mockDirection(page);
  await page.addInitScript(()=>{localStorage.setItem('magical-athlete:low-quality','true');localStorage.setItem('magical-athlete:reduced-motion','true');localStorage.setItem('magical-athlete:muted','true');localStorage.setItem('magical-athlete:animation-speed','4');});
});

test('建房草稿和可见玩法在连续旋转后保留，创建只提交一次',async({page,application},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await page.getByLabel('你的昵称').fill('旋转后仍是我');await page.getByLabel('房间人数上限').selectOption('2');
  await page.getByLabel('每次操作时限').selectOption('60');await page.getByLabel('房间可见性').selectOption('private');
  await page.getByRole('checkbox',{name:'Extra Mile',exact:true}).check();
  await landscapeCycle(page,page.locator('[data-landscape-control]').first());
  for(const [width,height] of sizes){
    await page.setViewportSize({width:width!,height:height!});await settle(page);
    await expect(page.getByLabel('你的昵称')).toHaveValue('旋转后仍是我');await expect(page.locator('.pack-settings')).toBeVisible();
    await expect(page.getByRole('checkbox',{name:'Extra Mile',exact:true})).toBeChecked();await fits(page);
  }
  await expect(page.locator('.pack-option').filter({has:page.getByRole('checkbox',{name:'Extra Mile',exact:true})})).toContainText('非官方');
  await page.setViewportSize({width:390,height:844});
  await page.locator('.setup-heading h2').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('compact-setup.png')});
  let creates=0;page.on('request',request=>{if(request.method()==='POST'&&new URL(request.url()).pathname==='/api/rooms')creates++;});
  const button=page.getByRole('button',{name:'创建房间，召集朋友',exact:true});await button.click();
  await expect(page.locator('.connection.is-online')).toBeVisible();const code=parseRoomCode(page.url().split('/').at(-1)!)!.code;
  const room=application.rooms.get(code);expect(room.game.config?.visibility).toBe('private');expect(room.game.config?.characterPacks['extra-mile']).toBe(true);
  const version=room.version,connections=[...application.io.sockets.sockets.values()].filter(s=>s.data.identity?.roomCode===code).map(s=>s.id);
  await page.getByRole('button',{name:'房间聊天',exact:true}).click();await page.locator('#room-chat-input').fill('未发送的聊天草稿');
  await page.locator('.room-config-panel>summary').click();
  await landscapeCycle(page,page.locator('[data-landscape-control]').first());
  for(const [width,height] of sizes.slice(0,9)){await page.setViewportSize({width:width!,height:height!});await settle(page);await fits(page);await expect(page.locator('#room-chat-input')).toHaveValue('未发送的聊天草稿');await expect(page.locator('.room-config-panel')).toHaveAttribute('open','');}
  expect(creates).toBe(1);expect(application.rooms.get(code).version).toBe(version);
  expect([...application.io.sockets.sockets.values()].filter(s=>s.data.identity?.roomCode===code).map(s=>s.id)).toEqual(connections);expect(errors).toEqual([]);
});

test('练习完整选角流程保留选牌与弹窗；比赛横竖屏、聊天和技能可操作',async({page,application},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByRole('tab',{name:'自己练习',exact:true}).click();await page.getByRole('button',{name:'开始自己练习',exact:true}).click();
  await expect(page.locator('.practice-pool')).toBeVisible();const code=parseRoomCode(page.url().split('/').at(-1)!)!.code;
  for(const id of ['alchemist','legs','banana','genius'])await page.locator(`[data-character-id="${id}"] .character-pick`).click();
  await landscapeCycle(page,page.locator('[data-landscape-control]').first());
  await page.setViewportSize({width:844,height:390});await page.setViewportSize({width:390,height:844});await expect(page.locator('.practice-pool .character-pick[aria-pressed="true"]')).toHaveCount(4);
  await page.getByRole('button',{name:'确认练习阵容',exact:true}).click();await page.locator('[data-character-id="alchemist"] .character-pick').click();
  await page.locator('[data-character-id="alchemist"] .detail-button').click();
  for(const [width,height] of sizes.slice(0,7)){await page.setViewportSize({width:width!,height:height!});await expect(page.getByRole('dialog',{name:/炼金/})).toBeVisible();await fits(page);}
  await page.getByRole('button',{name:'关闭',exact:true}).click();await expect(page.locator('.hand-selection .character-pick[aria-pressed="true"]')).toHaveCount(1);
  await page.getByRole('button',{name:'锁定上场角色',exact:true}).click();await expect(page.getByTestId('board-3d')).toBeVisible();
  // Deterministic test-only dice reach a real engine choice. No product endpoint.
  const room=structuredClone(application.rooms.get(code)),game=room.game;game.flags.testDice=[1];
  room.version++;application.rooms.rooms.set(code,room);application.store.save(room);
  for(const socket of application.io.sockets.sockets.values())if(socket.data.identity?.roomCode===code)socket.emit('snapshot',application.rooms.view(room,socket.data.identity.playerId));
  await expect(page.getByTestId('roll-button')).toBeEnabled({timeout:20000});await page.getByTestId('roll-button').tap();
  await expect(page.locator('.floating-choice')).toBeVisible({timeout:20000});
  await page.getByRole('button',{name:'房间聊天',exact:true}).click();await page.locator('#room-chat-input').fill('比赛中未发送');
  const pending=application.rooms.get(code).game.pending?.id,version=application.rooms.get(code).version;
  for(const [width,height] of sizes.slice(0,11)){
    await page.setViewportSize({width:width!,height:height!});await settle(page);await fits(page);
    await expect(page.locator('#room-chat-input')).toHaveValue('比赛中未发送');await fits(page,page.locator('.room-chat form button'));
    const option=page.locator('.floating-choice .choice-options button').first();await option.scrollIntoViewIfNeeded();await fits(page,option);
    if([568,844,390].includes(width!))await page.screenshot({path:info.outputPath(`choice-chat-${width}.png`)});
  }
  expect(application.rooms.get(code).game.pending?.id).toBe(pending);expect(application.rooms.get(code).version).toBe(version);
  await page.getByRole('button',{name:'收起聊天',exact:true}).click();
  await page.getByRole('button',{name:'比赛菜单',exact:true}).click();
  const scores=page.getByRole('dialog',{name:'比赛菜单',exact:true}).locator('details').filter({has:page.locator('summary').filter({hasText:'累计积分'})});
  await scores.locator('summary').tap();
  await landscapeCycle(page,page.locator('[data-landscape-control]').last());
  await expect(scores).toHaveAttribute('open','');
  await expect(page.locator('dialog.screen-direction')).toHaveCount(0);
  await expect(page.getByRole('dialog',{name:'比赛菜单',exact:true})).toBeVisible();await page.getByRole('button',{name:'关闭',exact:true}).click();
  await page.locator('.floating-choice .choice-options button').first().click();await expect(page.locator('.floating-choice')).toHaveCount(0);expect(errors).toEqual([]);
});

test('安全区与键盘视觉视口收缩后聊天草稿和发送按钮仍可用',async({page,application},info)=>{
  await page.route(/\/assets\/.*\.css$/,async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('env(safe-area-inset-left)','44px').replaceAll('env(safe-area-inset-right)','44px').replaceAll('env(safe-area-inset-bottom)','21px')});});
  await page.addInitScript(()=>{const viewport=new EventTarget() as EventTarget&{height:number;offsetTop:number};Object.assign(viewport,{height:844,offsetTop:0});Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});(window as any).__keyboard=(height:number)=>{viewport.height=height;viewport.dispatchEvent(new Event('resize'));};});
  await page.goto('/');await page.locator('[data-screen-direction]').tap();await page.getByRole('tab',{name:'自己练习',exact:true}).click();await page.getByRole('button',{name:'开始自己练习',exact:true}).click();await expect(page.locator('.practice-pool')).toBeVisible();
  for(const id of ['legs','alchemist','banana','genius'])await page.locator(`[data-character-id="${id}"] .character-pick`).click();
  await page.getByRole('button',{name:'确认练习阵容',exact:true}).click();await page.locator('[data-character-id="legs"] .character-pick').click();
  await page.getByRole('button',{name:'锁定上场角色',exact:true}).click();await expect(page.getByTestId('board-3d')).toBeVisible();
  await page.getByRole('button',{name:'房间聊天',exact:true}).click();await page.locator('#room-chat-input').fill('键盘打开的草稿');
  await page.evaluate(()=>(window as any).__direction.leave());
  await expect(page.locator('#room-chat-input')).toHaveValue('键盘打开的草稿');
  for(const [width,height,visual] of [[390,844,400],[844,390,210],[568,320,190],[320,568,270],[390,300,300]]){
    await page.setViewportSize({width:width!,height:height!});await page.locator('#room-chat-input').focus();await page.evaluate(h=>(window as any).__keyboard(h),visual);await settle(page);
    await expect(page.locator('#room-chat-input')).toHaveValue('键盘打开的草稿');await fits(page,page.locator('.room-chat form button'));await fits(page,page.locator('.room-chat'));
    for(const selector of ['#room-chat-input','.room-chat form button'])expect(await page.locator(selector).evaluate((node,visual)=>{const r=node.getBoundingClientRect();return r.top>=0&&r.bottom<=visual!+1;},visual)).toBe(true);
    if(width===568)await page.screenshot({path:info.outputPath('keyboard-safe-short.png')});
  }
});

test('八人比赛横竖屏保留 HUD、镜头与操作，成绩面板可滚动并保留展开状态',async({page,application},info)=>{
  const made=application.rooms.create('八人横屏房主',8,0),code=made.identity.roomCode;
  for(let i=1;i<8;i++)application.rooms.join(code,`长昵称运动员${i}`);
  const room=structuredClone(application.rooms.get(code)),game=room.game;
  game.phase='race';game.round=1;game.track='mild';game.currentRacerId='r0';game.turn=0;game.turnCount=0;
  game.racers=game.players.map((p,i)=>({id:`r${i}`,playerId:p.id,characterId:['coach','alchemist','banana','gunk','genius','hare','egg','centaur'][i]!,position:0,tripped:false,finished:false,eliminated:false,flags:{}}));
  game.baseTurnOrder=game.racers.map(r=>r.id);game.queue=[{kind:'beginTurn',racerId:'r0'}];resolveTasks(game);
  const publish=()=>{room.version=Math.max(room.version,application.rooms.get(code).version)+1;application.rooms.rooms.set(code,room);application.store.save(room);for(const socket of application.io.sockets.sockets.values())if(socket.data.identity?.roomCode===code)socket.emit('snapshot',application.rooms.view(room,socket.data.identity.playerId));};
  publish();await page.addInitScript(identity=>localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity)),made.identity);
  await page.goto(`/room/${code}`);await expect(page.getByTestId('board-3d')).toBeVisible();
  await page.getByRole('button',{name:'比赛菜单',exact:true}).tap();await page.locator('[data-screen-direction]').last().tap();await page.getByRole('button',{name:'关闭',exact:true}).tap();
  for(const [width,height] of sizes.slice(0,11)){
    await page.setViewportSize({width:width!,height:height!});await settle(page);await fits(page,page.getByRole('button',{name:'比赛菜单',exact:true}));
    await fits(page,page.getByTestId('roll-button'));await fits(page,page.locator('.scene-camera-modes button').first());
    if(width===568)await page.screenshot({path:info.outputPath('eight-racers-landscape.png')});
  }
  // Finish two racers through the engine, then exercise the retained result UI.
  enqueueMove(game,'r0',100,'layout fixture');resolveTasks(game);enqueueMove(game,'r1',100,'layout fixture');resolveTasks(game);expect(game.phase).toBe('results');publish();
  await expect(page.locator('.race-results-overlay .results-panel')).toBeVisible({timeout:20000});
  await page.locator('.score-audit>summary').click();
  await page.evaluate(()=>(window as any).__direction.leave());
  for(const [width,height] of sizes.slice(0,9)){
    await page.setViewportSize({width:width!,height:height!});await settle(page);await fits(page);await expect(page.locator('.score-audit')).toHaveAttribute('open','');
    const next=page.getByRole('button',{name:'前往下一场',exact:true});await next.scrollIntoViewIfNeeded();await fits(page,next);
    if(width===568)await page.screenshot({path:info.outputPath('race-results-landscape.png')});
  }
});
