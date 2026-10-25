import { test,expect,type Page } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import { decideAI } from '../../src/engine/ai.js';
import { CHARACTER_BY_ID } from '../../src/shared/characters.js';
import type { GameAction } from '../../src/shared/types.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';
import { io } from 'socket.io-client';

let app:ReturnType<typeof createApplication>,url:string;
test.use({actionTimeout:20_000});
test.beforeAll(async()=>{app=createApplication(':memory:');await new Promise<void>(r=>app.http.listen(0,'127.0.0.1',r));const addr=app.http.address();if(!addr||typeof addr==='string')throw Error('no address');url=`http://127.0.0.1:${addr.port}`;});
test.afterAll(async()=>{await app.close();});
async function sync(page:Page,version:number){await expect.poll(async()=>Number(await page.locator('.game-shell').getAttribute('data-room-version'))).toBeGreaterThanOrEqual(version);}
async function clickAction(page:Page,action:GameAction,pending?:{options:{id:string;label:string}[]}){
  if(action.type==='draft'){
    await page.getByRole('button',{name:`选择${CHARACTER_BY_ID[action.characterId]!.nameZh}`,exact:true}).click();
    await page.getByRole('button',{name:/确认选择/}).click();
  }else if(action.type==='select'){
    for(const id of action.characterIds)await page.getByRole('button',{name:`选择${CHARACTER_BY_ID[id]!.nameZh}`,exact:true}).click();
    await page.getByRole('button',{name:'锁定上场角色',exact:true}).click();
  }else if(action.type==='choose'){
    await page.getByRole('region',{name:'待处理技能'}).getByRole('button',{name:pending!.options.find(o=>o.id===action.optionId)!.label,exact:true}).click();
  }else if(action.type==='next')await page.getByRole('button',{name:'前往下一场',exact:true}).click();
  else if(action.type==='roll')await page.getByTestId('roll-button').click();
  else throw Error(`unsupported browser intent ${action.type}`);
}

test('home shows only playable presets, preserves drafts, rejects invalid rotations and fits desktop/mobile',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:900});await page.goto(url);
  await expect(page.getByRole('checkbox')).toHaveCount(0);await page.screenshot({path:info.outputPath('home.png'),fullPage:true});
  await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await expect(page.locator('.preset-select')).toHaveCount(3);
  for(const name of ['经典赛','官方巡回','扩展巡回'])await expect(page.locator('.preset-select').filter({hasText:name})).toBeEnabled();
  await expect(page.getByText(/社区锦标赛|规则待确认|待开放内容/)).toHaveCount(0);
  for(const [name,count] of [['官方巡回',4],['扩展巡回',8]] as const){
    await page.locator('.preset-select').filter({hasText:name}).click();
    await expect(page.locator('.preset-select').filter({hasText:name})).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('.config-main .schedule-preview li')).toHaveCount(count);
    await expect(page.locator('.config-main .schedule-preview li').nth(3)).toContainText('Whirly World');
    await expect(page.locator('.preset-select').filter({hasText:name})).toContainText('网页版布局');
  }
  await page.locator('.preset-select').filter({hasText:'经典赛'}).click();
  await expect(page.locator('.config-main .schedule-preview li')).toHaveCount(4);
  await page.getByRole('checkbox',{name:'Extra Mile',exact:true}).check();
  await page.getByRole('button',{name:'修改经典赛赛程',exact:true}).click();
  await page.getByLabel('比赛场数').selectOption('8');
  for(let i=0;i<6;i++)await page.getByRole('button',{name:'添加 Mild Mile',exact:true}).click();
  await expect(page.getByLabel('比赛场数')).toHaveValue('8');await expect(page.locator('.rotation-list li')).toHaveCount(8);
  await expect(page.getByRole('checkbox',{name:'Extra Mile',exact:true})).toBeChecked();
  await page.getByLabel('比赛场数').selectOption('4');await expect(page.locator('.rotation-list li')).toHaveCount(8);
  await expect(page.locator('.config-summary')).toContainText('长度不能超过');
  await expect(page.getByRole('button',{name:'创建房间，召集朋友'})).toBeDisabled();
  await page.getByRole('button',{name:'修改经典赛赛程',exact:true}).click();
  await page.getByRole('button',{name:'移除第1项',exact:true}).click();await page.getByRole('button',{name:'移除第1项',exact:true}).click();
  await expect(page.locator('.config-summary')).toContainText('不能为空');
  await page.getByRole('button',{name:'添加 Wild Wilds',exact:true}).click();await page.getByLabel('比赛场数').selectOption('6');
  await expect(page.locator('.config-main .schedule-preview li')).toHaveCount(6);
  await page.getByRole('button',{name:/返回首页（保留设置）/}).click();
  await page.getByRole('tab',{name:'创建房间',exact:true}).click();await expect(page.getByLabel('比赛场数')).toHaveValue('6');
  await expect(page.locator('.rotation-list li')).toHaveCount(1);await page.screenshot({path:info.outputPath('setup-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:info.outputPath('setup-mobile.png'),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.evaluate(()=>document.documentElement.style.fontSize='20px');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(errors).toEqual([]);
});

for(const [preset,name,count] of [['official','官方巡回',4],['extended','扩展巡回',8]] as const)test(`${preset} tour can be created from its card and restored`,async({page})=>{
  await page.goto(url);await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await page.getByLabel('你的昵称').fill('巡回测试');await page.getByLabel('房间人数上限').selectOption('3');
  await page.locator('.preset-select').filter({hasText:name}).click();
  await page.getByRole('button',{name:'创建房间，召集朋友'}).click();
  await expect(page).toHaveURL(/\/room\/[CA]-[A-Z2-9]{6}$/);
  const code=page.url().split('/').at(-1)!.replace(/^[CA]-/,'');
  const competition=app.rooms.get(code).game.config!.competition!;
  expect(competition.preset).toBe(preset);expect(competition.raceCount).toBe(count);expect(competition.rotation[3]).toBe('whirly-world');
  await page.reload();await expect(page.locator('.connection.is-online')).toBeVisible();
  await expect(page.locator('.room-config-panel > summary')).toContainText(name);
  expect(app.rooms.get(code).game.config!.competition).toEqual(competition);
});

for(const mode of ['practice','ai'] as const)test(`${mode} rematch returns to configuration and starts the saved six-race plan`,async({page})=>{
  const made=app.rooms.create('再来一局',2,0,mode,1,'mixed'),code=made.identity.roomCode;
  const previous=app.rooms.get(code);previous.game.phase='finished';previous.game.round=4;previous.version++;app.store.save(previous);
  await page.addInitScript(identity=>{
    localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity));
    localStorage.setItem('magical-athlete:reduced-motion','true');localStorage.setItem('magical-athlete:low-quality','true');
  },made.identity);
  await page.goto(`${url}/room/${code}`);await expect(page.locator('.connection.is-online')).toBeVisible();
  await page.locator('.room-config-panel > summary').click();
  await page.getByRole('button',{name:'修改经典赛赛程',exact:true}).click();await page.getByLabel('比赛场数').selectOption('6');
  await page.getByRole('button',{name:'保存本房间设置',exact:true}).click();
  await expect.poll(()=>app.rooms.get(code).game.config?.competition?.raceCount).toBe(6);
  expect(app.rooms.get(code).game.matchPlan?.raceCount).toBe(4);
  await page.getByRole('button',{name:'原房间，再来一局',exact:true}).click();
  await expect(page.getByRole('button',{name:'我准备好了',exact:true})).toBeVisible();
  expect(app.rooms.get(code).game.phase).toBe('lobby');expect(app.rooms.get(code).game.matchPlan).toBeUndefined();
  await page.reload();await expect(page.getByRole('button',{name:'我准备好了',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'我准备好了',exact:true}).click();
  await page.getByRole('button',{name:'开始选秀',exact:true}).click();
  await expect.poll(()=>app.rooms.get(code).game.matchPlan?.raceCount).toBe(6);
  expect(app.rooms.get(code).game.phase).toBe('draft');expect(app.rooms.get(code).game.players.every(p=>p.score===0&&p.used.length===0)).toBe(true);
  if(mode==='practice')await expect(page.getByRole('status').filter({hasText:'已选 0 / 6 张'})).toBeVisible();
  else await expect(page.locator('.draft-order span')).toHaveCount(4);
});

test('two browsers preserve a pending choice and reject both duplicate and previous-round packets',async({browser})=>{
  const made=app.rooms.create('等待技能',2,0),code=made.identity.roomCode,joins=[made,app.rooms.join(code,'旁观等待的对手')];
  const room=app.rooms.get(code);
  function fixture(round:number){
    const g=createGame(room.game.players,27);g.phase='race';g.round=round;g.currentRacerId='r0';g.baseTurnOrder=['r0','r1'];
    g.racers=['genius','coach'].map((characterId,i)=>({id:`r${i}`,playerId:g.players[i]!.id,characterId,position:3+i,tripped:false,finished:false,eliminated:false,flags:{}}));
    g.queue=[{kind:'beginTurn',racerId:'r0'}];resolveTasks(g);expect(g.pending?.kind).toBe('genius');return g;
  }
  room.game=fixture(1);room.version++;app.store.save(room);
  const contexts=await Promise.all(joins.map(()=>browser.newContext()));const pages:Page[]=[];
  const socket=io(url,{auth:made.identity,transports:['websocket']});
  try{
    for(const [i,context] of contexts.entries()){
      await context.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity));localStorage.setItem('magical-athlete:reduced-motion','true');localStorage.setItem('magical-athlete:animation-speed','4');localStorage.setItem('magical-athlete:low-quality','true');},joins[i]!.identity);
      const page=await context.newPage();pages.push(page);await page.goto(`${url}/room/${code}`);await expect(page.locator('.connection.is-online')).toBeVisible();
    }
    await expect(pages[0]!.getByTestId('skill-choice')).toBeVisible();await expect(pages[1]!.getByTestId('skill-choice')).toHaveCount(0);
    const oldId=app.rooms.get(code).game.pending!.id;await pages[0]!.reload();await expect(pages[0]!.getByTestId('skill-choice')).toBeVisible();expect(app.rooms.get(code).game.pending!.id).toBe(oldId);
    const envelope={actionId:crypto.randomUUID(),expectedVersion:app.rooms.get(code).version,action:{type:'choose' as const,choiceId:oldId,optionId:'4'}};
    const submit=(e= envelope)=>new Promise<any>((resolve,reject)=>socket.timeout(5000).emit('action',e,(error:Error|null,reply:any)=>error?reject(error):resolve(reply)));
    expect((await submit()).ok).toBe(true);
    const next=app.rooms.get(code);next.game=fixture(2);next.version++;app.store.save(next);
    for(const client of app.io.sockets.sockets.values())if(client.data.identity?.roomCode===code)client.emit('snapshot',app.rooms.view(next,client.data.identity.playerId));
    const newId=next.game.pending!.id;expect(newId).not.toBe(oldId);const state=JSON.stringify(next.game);
    expect((await submit()).duplicate).toBe(true);
    expect((await submit({...envelope,actionId:crypto.randomUUID(),expectedVersion:app.rooms.get(code).version})).ok).toBe(false);
    expect(JSON.stringify(app.rooms.get(code).game)).toBe(state);
    await expect(pages[0]!.getByTestId('skill-choice')).toBeVisible();await pages[0]!.getByTestId('skill-choice').getByRole('button',{name:'4',exact:true}).click();
    await expect.poll(()=>app.rooms.get(code).game.pending?.id).not.toBe(newId);
  }finally{socket.disconnect();await Promise.all(contexts.map(c=>c.close()));}
});

for(const [rounds,n] of [[4,2],[6,3],[8,2]] as const)test(`${n} independent browsers finish ${rounds} races with UI actions, reconnect and score audit`,async({browser},info)=>{
  // CI's software WebGL took almost ten minutes to finish eight races, leaving
  // no time for the final result captures and rematch. Budget by race count;
  // individual action/assertion timeouts still catch a stalled control promptly.
  test.setTimeout(Math.max(600_000,rounds*120_000));
  const startedAt=Date.now();
  const contexts=await Promise.all(Array.from({length:n},(_,i)=>browser.newContext({viewport:i?{width:390,height:844}:{width:1440,height:900}})));
  const pages:Page[]=[],errors:string[]=[],observations:unknown[]=[];
  try{
    for(const context of contexts){
      await context.addInitScript(()=>{for(const [key,value] of Object.entries({'animation-speed':'4','reduced-motion':'true','low-quality':'true','muted':'true'}))localStorage.setItem(`magical-athlete:${key}`,value);});
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      // The full-match check exercises every real action and score. Skills keep
      // 1.5–3 second reading pauses even at 4× speed; use the player's skip button
      // while waiting for the next control, as separate tests cover the playback.
      await page.addLocatorHandler(page.getByTestId('skip-animation'),async skip=>{
        // A short beat can finish between pointer actionability checks. Activate
        // the currently displayed button atomically; an ended beat needs no skip.
        await skip.evaluateAll(buttons=>(buttons[0] as HTMLButtonElement|undefined)?.click());
      },{noWaitAfter:true});
      pages.push(page);
    }
    const host=pages[0]!;await host.goto(url);await host.getByRole('tab',{name:'创建房间',exact:true}).click();
    await host.getByLabel('你的昵称').fill('同名');await host.getByLabel('房间人数上限').selectOption(String(n));await host.getByLabel('每次操作时限').selectOption('0');
    if(rounds!==4){await host.getByRole('button',{name:'修改经典赛赛程',exact:true}).click();await host.getByLabel('比赛场数').selectOption(String(rounds));await host.getByRole('button',{name:'添加 Mild Mile',exact:true}).click();}
    await host.getByLabel('房间可见性').selectOption('private');await host.getByRole('button',{name:'创建房间，召集朋友'}).click();await expect(host).toHaveURL(/\/room\/[CA]-[A-Z2-9]{6}$/);
    const code=host.url().split('/').at(-1)!.replace(/^[CA]-/,'');expect(app.rooms.list().some(r=>r.code===code)).toBe(false);
    for(const page of pages.slice(1)){await page.goto(`${url}/room/${code}`);await page.getByLabel('你的昵称').fill('同名');await page.getByRole('button',{name:'加入这场胡闹',exact:true}).click();await expect(page.getByRole('button',{name:'我准备好了',exact:true})).toBeVisible();}
    // Only seed the pre-game random generator; all draft/race actions use real UIs.
    const lobby=app.rooms.get(code);lobby.game.rngState=13000+rounds;delete lobby.game.randomStream;
    const ids=await Promise.all(pages.map(p=>p.evaluate(code=>JSON.parse(localStorage.getItem(`magical-athlete:identity:cloudflare:${code}`)!).playerId,code)));
    expect(new Set(ids).size).toBe(n);expect(new Set(lobby.game.players.map(p=>p.name)).size).toBe(n);
    for(const page of pages){await sync(page,app.rooms.get(code).version);await page.getByRole('button',{name:'我准备好了',exact:true}).click();await expect(page.getByRole('button',{name:'取消准备',exact:true})).toBeVisible();}
    await host.locator('.room-config-panel > summary').click();await host.getByRole('checkbox',{name:'Extra Mile',exact:true}).check();await host.getByRole('button',{name:'保存本房间设置',exact:true}).click();
    for(const page of pages){await expect(page.getByRole('button',{name:'我准备好了',exact:true})).toBeVisible();await expect(page.locator('.room-config-panel > summary')).toContainText('2 个角色包');}
    // Return to the original-only fixture, verifying that a second edit also propagates.
    await host.getByRole('checkbox',{name:'Extra Mile',exact:true}).uncheck();await host.getByRole('button',{name:'保存本房间设置',exact:true}).click();await host.locator('.room-config-panel > summary').click();
    for(const page of pages){await sync(page,app.rooms.get(code).version);await page.getByRole('button',{name:'我准备好了',exact:true}).click();await expect(page.getByRole('button',{name:'取消准备',exact:true})).toBeVisible();}
    await sync(host,app.rooms.get(code).version);await host.getByRole('button',{name:'开始选秀',exact:true}).click();await expect.poll(()=>app.rooms.get(code).game.phase).toBe('draft');
    const plan=structuredClone(app.rooms.get(code).game.matchPlan);let actions=0,reloaded=false;const captured=new Set<number>();
    while(app.rooms.get(code).game.phase!=='finished'){
      const room=app.rooms.get(code),g=room.game,version=room.version;
      if(++actions>4000)throw Error(`execution budget ${g.phase}/${g.round}`);
      expect(g.phase,JSON.stringify(g.flags.ruleHold)).not.toBe('paused');
      if(g.phase==='race'&&!g.pending&&(g.flags.needsBegin||g.flags.continuation)){await expect.poll(()=>app.rooms.get(code).version).toBeGreaterThan(version);continue;}
      const actor=g.pending?.playerId??(g.phase==='draft'?g.draft!.order[g.draft!.cursor]!:g.phase==='selection'?g.players.find(p=>!p.selection.length)!.id:g.phase==='results'?room.hostId:g.racers.find(r=>r.id===g.currentRacerId)!.playerId);
      const page=pages[ids.indexOf(actor)]!;await sync(page,version);
      if(g.pending&&!reloaded){const id=g.pending.id;await page.reload();await expect(page.locator('.connection.is-online')).toBeVisible();expect(app.rooms.get(code).game.pending?.id).toBe(id);reloaded=true;}
      if(g.phase==='race'&&!captured.has(g.round)){
        console.log(`Match ${n}p/${rounds}: race ${g.round}, ${actions} actions, ${Math.round((Date.now()-startedAt)/1000)}s elapsed`);
        await sync(host,version);await expect(host.getByTestId('board-3d').locator('.board-webgl canvas')).toBeVisible();
        await host.getByTestId('board-3d').screenshot({path:info.outputPath(`round-${g.round}-${g.track}.png`)});
        observations.push({round:g.round,track:g.track,stats:await host.evaluate(()=>({heap:(performance as any).memory?.usedJSHeapSize,canvases:document.querySelectorAll('canvas').length,resources:performance.getEntriesByType('resource').length}))});captured.add(g.round);
      }
      const view=app.rooms.view(room,actor),action=decideAI(view);expect(action,`${g.phase}/${g.pending?.kind}`).toBeTruthy();
      await clickAction(page,action!,view.pending);await expect.poll(()=>app.rooms.get(code).version).toBeGreaterThan(version);await page.waitForTimeout(270);
    }
    const final=app.rooms.get(code).game;expect(final.results).toHaveLength(rounds);expect(final.round).toBe(rounds);expect(final.matchPlan).toEqual(plan);expect(reloaded).toBe(true);
    console.log(`Match ${n}p/${rounds}: all races finished, ${actions} actions, ${Math.round((Date.now()-startedAt)/1000)}s elapsed; checking results and rematch`);
    const k=n===2?2:1;expect(final.players.every(p=>p.hand.length===0&&p.used.length===rounds*k)).toBe(true);
    for(const p of final.players)expect(p.score).toBe(final.results.reduce((sum,r)=>sum+r.scores!.find(s=>s.playerId===p.id)!.total,0));
    for(const page of pages){await sync(page,app.rooms.get(code).version);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
    for(const page of pages){await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase','idle',{timeout:60_000});await expect(page.locator('.race-results-overlay .results-panel')).toBeVisible();}
    await host.locator('.score-audit > summary').click();
    await expect(host.locator('.score-audit table')).toHaveCount(rounds);
    await host.screenshot({path:info.outputPath('final-desktop.png'),fullPage:true});await pages[1]!.screenshot({path:info.outputPath('final-mobile.png'),fullPage:true});
    await info.attach('complete-match',{body:JSON.stringify({seed:13000+rounds,actions,plan,results:final.results,players:final.players.map(({id,name,score,used})=>({id,name,score,used})),observations,errors},null,2),contentType:'application/json'});
    expect(errors).toEqual([]);await host.getByRole('button',{name:'原房间，再来一局',exact:true}).click();await expect(host.getByRole('button',{name:'我准备好了',exact:true})).toBeVisible();expect(app.rooms.get(code).game.matchPlan).toBeUndefined();
  }finally{await Promise.all(contexts.map(c=>c.close()));}
});
