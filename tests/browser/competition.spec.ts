import { test,expect,type Page } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import { decideAI } from '../../src/engine/ai.js';
import { CHARACTER_BY_ID } from '../../src/shared/characters.js';
import type { GameAction } from '../../src/shared/types.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';
import { io } from 'socket.io-client';
import { presetCompetition, expandedSchedule, REWARD_TIERS } from '../../src/shared/competition.js';
import { legacyRoomConfig } from '../../src/shared/room-config.js';
import { RACE_POINTS } from '../../src/shared/tracks.js';

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

test('all gameplay controls are visible, compact and usable on desktop and phones',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await expect(page.locator('.room-config-fields details')).toHaveCount(0);
  await expect(page.locator('.room-config-fields a')).toHaveCount(0);
  await expect(page.locator('.entry-submit-summary,.preset-description,.competition-current')).toHaveCount(0);
  for(const width of [320,360,390,430,768,1440]){
    await page.setViewportSize({width,height:900});
    for(const selector of ['.competition-settings','.map-settings','.pack-settings','.player-settings','.special-event-settings']){
      await expect(page.locator(selector)).toBeVisible();
    }
    for(const control of await page.locator('.preset-option,.map-card,.pack-option,.player-mode-options label,.event-toggle,.rotation-list button').all()){
      const box=await control.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByLabel('比赛场数')).toBeVisible();
    await expect(page.getByRole('checkbox',{name:'启用特殊赛事',exact:true})).toBeEnabled();
    await expect(page.locator('.map-card')).toHaveCount(7);
    const choices=await page.locator('.room-config-fields').boundingBox(),submit=await page.locator('.entry-submit').boundingBox();
    expect(submit!.width).toBeCloseTo(choices!.width,0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    if(width===390||width===1440){
      await page.locator('.room-config-fields').screenshot({path:info.outputPath('visible-options-'+width+'.png')});
      const grid=await page.locator('.map-options').boundingBox();
      expect(grid!.height).toBeLessThan(width===390?310:230);
    }
  }
  for(const name of ['基础角色包','Second Wind','Extra Mile','Leaf’s Fan Expansion','Wurstii A']){
    const checkbox=page.getByRole('checkbox',{name,exact:true}),checked=await checkbox.isChecked();
    await checkbox.setChecked(!checked);await expect(checkbox).toBeChecked({checked:!checked});
    await checkbox.setChecked(checked);
  }
  await page.getByRole('radio',{name:/官方巡回/}).check();
  await expect(page.locator('.rotation-list li')).toHaveCount(4);
  await expect(page.locator('.rotation-list li').nth(3)).toContainText('Whirly World');
  await expect(page.getByRole('button',{name:'添加 Whirly World',exact:true})).toContainText('网页适配');
  await page.getByRole('radio',{name:/扩展巡回/}).check();
  await expect(page.locator('.rotation-list li')).toHaveCount(8);
  await expect(page.getByRole('note')).toContainText('整局禁用');
  await page.getByRole('radio',{name:/经典赛/}).check();
  await page.getByRole('button',{name:'移除第1项',exact:true}).click();
  await page.getByRole('button',{name:'移除第1项',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('不能为空');
  await expect(page.getByRole('button',{name:'创建房间，召集朋友'})).toBeDisabled();
  await page.getByRole('button',{name:'添加 Wild Wilds',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('custom maps, duplicate entries and ordering survive preset switches and entry changes',async({page})=>{
  await page.goto(url);await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await page.getByRole('checkbox',{name:'Extra Mile',exact:true}).check();
  await page.getByLabel('比赛场数').selectOption('6');
  await page.getByRole('button',{name:'添加 Mild Mile',exact:true}).click();
  await page.getByRole('button',{name:'添加 Mild Mile',exact:true}).click();
  await page.getByRole('button',{name:'上移第3项',exact:true}).click();
  const rotation=await page.locator('.rotation-list li>span').allTextContents();
  await expect(page.getByRole('button',{name:'添加 Mild Mile',exact:true})).toContainText('已添加 ×3');
  await page.getByRole('radio',{name:/官方巡回/}).check();
  await expect(page.getByRole('status').filter({hasText:'自定义草稿已保留'})).toBeVisible();
  await page.getByRole('tab',{name:'自己练习',exact:true}).click();
  await expect(page.getByRole('radio',{name:/经典赛/})).toBeChecked();
  await expect(page.getByRole('checkbox',{name:'Extra Mile',exact:true})).not.toBeChecked();
  await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await page.getByRole('button',{name:/返回首页（保留设置）/}).click();
  await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await page.getByRole('radio',{name:'自定义积分赛',exact:true}).check();
  await expect(page.getByLabel('比赛场数')).toHaveValue('6');
  expect(await page.locator('.rotation-list li>span').allTextContents()).toEqual(rotation);
  await expect(page.getByRole('checkbox',{name:'Extra Mile',exact:true})).toBeChecked();
  await page.getByRole('radio',{name:/经典赛/}).check();
  await expect(page.locator('.rotation-list li')).toHaveCount(2);
  await page.getByRole('radio',{name:'自定义积分赛',exact:true}).check();
  expect(await page.locator('.rotation-list li>span').allTextContents()).toEqual(rotation);
});

test('shortening a match preserves maps and special-event rounds until explicitly repaired',async({page},info)=>{
  await page.setViewportSize({width:390,height:844});await page.goto(url);
  await page.getByRole('tab',{name:'创建房间',exact:true}).click();await page.getByLabel('你的昵称').fill('保留赛程');await page.getByLabel('房间人数上限').selectOption('3');
  await page.getByRole('radio',{name:/扩展巡回/}).check();

  await page.getByRole('checkbox',{name:'启用特殊赛事'}).check();
  await expect(page.getByRole('radio',{name:'自定义积分赛',exact:true})).toBeChecked();
  await expect(page.getByRole('radio',{name:'自定义积分赛',exact:true})).toBeChecked();
  await page.getByRole('checkbox',{name:'第 8 场',exact:true}).check();
  await page.getByLabel('比赛场数').selectOption('4');
  await expect(page.locator('.rotation-list li')).toHaveCount(8);
  await expect(page.getByRole('alert')).toContainText('地图轮换有 8 项');
  await expect(page.getByRole('alert')).toContainText('特殊赛事的第 8 场超出当前 4 场');
  await expect(page.getByRole('button',{name:'创建房间，召集朋友'})).toBeDisabled();
  await expect(page.getByRole('alert')).toBeVisible();

  await expect(page.getByRole('checkbox',{name:'第 8 场（超出当前 4 场）',exact:true})).toBeChecked();
  await page.locator('.competition-settings').screenshot({path:info.outputPath('incompatible-four-race-settings.png')});
  // Returning to eight races restores the exact choices, without reconstruction.
  await page.getByLabel('比赛场数').selectOption('8');await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('checkbox',{name:'第 8 场',exact:true})).toBeChecked();
  await page.getByLabel('比赛场数').selectOption('4');
  for(let i=0;i<4;i++)await page.getByRole('button',{name:'移除第5项',exact:true}).click();
  // The out-of-range control disappears as soon as it is unchecked.
  await page.getByRole('checkbox',{name:'第 8 场（超出当前 4 场）',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'第 8 场（超出当前 4 场）',exact:true})).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button',{name:'下移第1项',exact:true}).click();
  await page.getByRole('button',{name:'创建房间，召集朋友'}).click();await expect(page).toHaveURL(/\/room\/[CA]-[A-Z2-9]{6}$/);
  const code=page.url().split('/').at(-1)!.replace(/^[CA]-/,'');
  const saved=app.rooms.get(code).game.config!;
  expect(saved.competition).toEqual({...presetCompetition('official'),preset:'custom',rotation:['wild','mild','twisty-twirl','whirly-world'],thrillingThirds:{enabled:true,rounds:[3]}});
  expect(saved.characterPacks).toEqual(legacyRoomConfig().characterPacks);
});

test('switching presets retains event choices and all character-pack switches',async({page})=>{
  await page.goto(url);await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await page.getByLabel('你的昵称').fill('独立开关');await page.getByLabel('房间人数上限').selectOption('3');
  await page.getByRole('checkbox',{name:'Extra Mile',exact:true}).check();
  await page.getByRole('radio',{name:/扩展巡回/}).check();
  await page.getByRole('checkbox',{name:'启用特殊赛事'}).check();await page.getByRole('checkbox',{name:'第 8 场',exact:true}).check();
  await page.getByRole('radio',{name:/官方巡回/}).check();
  await expect(page.getByRole('alert')).toContainText('第 8 场超出当前 4 场');
  await expect(page.getByRole('checkbox',{name:'第 8 场（超出当前 4 场）',exact:true})).toBeChecked();
  await page.getByRole('radio',{name:/扩展巡回/}).check();await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('checkbox',{name:'Extra Mile',exact:true})).toBeChecked();
  for(const pack of ['Second Wind','Leaf’s Fan Expansion','Wurstii A'])await expect(page.getByRole('checkbox',{name:pack,exact:true})).not.toBeChecked();
  await page.getByRole('button',{name:'创建房间，召集朋友'}).click();await expect(page).toHaveURL(/\/room\/[CA]-[A-Z2-9]{6}$/);
  const code=page.url().split('/').at(-1)!.replace(/^[CA]-/,'');
  expect(app.rooms.get(code).game.config!.competition).toEqual({...presetCompetition('extended'),thrillingThirds:{enabled:true,rounds:[3,8]}});
  expect(app.rooms.get(code).game.config!.characterPacks).toEqual({...legacyRoomConfig().characterPacks,'extra-mile':true});
});

test('the rules menu contains maps, scoring, pack sources and all 36 events without changing configuration',async({page},info)=>{
  const made=app.rooms.create('只看设置',3,0),code=made.identity.roomCode;
  await page.addInitScript(identity=>localStorage.setItem('magical-athlete:identity:'+identity.roomCode,JSON.stringify(identity)),made.identity);
  await page.goto(url+'/room/'+code);await expect(page.locator('.connection.is-online')).toBeVisible();
  await page.locator('.room-config-panel > summary').click();
  const before=structuredClone(app.rooms.get(code).game.config),save=page.getByRole('button',{name:'保存本房间设置',exact:true});
  await expect(save).toBeDisabled();
  await page.getByRole('button',{name:'怎么玩',exact:true}).click();
  await page.getByRole('tab',{name:'地图与计分',exact:true}).click();
  const rules=page.getByRole('dialog',{name:'怎么玩',exact:true});
  await expect(rules).toContainText('停在端点才传送');
  await expect(rules).toContainText('最后一场不加倍');
  await expect(rules).toContainText('交叉处不能换层');
  const rewards=rules.locator('table').filter({has:page.getByRole('columnheader',{name:'场数',exact:true})}).filter({has:page.getByRole('columnheader',{name:'1',exact:true})});
  for(const count of [4,6,8] as const){
    const cells=await rewards.locator('tbody tr').filter({has:page.getByRole('cell',{name:String(count),exact:true})}).locator('td').allTextContents();
    expect(cells.slice(1,1+count)).toEqual(REWARD_TIERS[count].map(tier=>RACE_POINTS[tier]![0]+' / '+RACE_POINTS[tier]![1]));
  }
  await page.getByRole('tab',{name:'角色包与人数',exact:true}).click();
  await expect(rules).toContainText('Box 需要实体骰子入盒');
  await expect(rules.getByRole('link',{name:'作者发布页',exact:true})).toHaveAttribute('href',/boardgamegeek/);
  await expect(rules).toContainText('黏液怪不减速同一玩家');
  await rules.getByText('Second Wind：卡面核验与网页差异',{exact:true}).click();
  await expect(rules).toContainText('骰子先生六骰各异');
  await page.getByRole('tab',{name:'特殊赛事',exact:true}).click();
  await expect(rules).toContainText('不是同时启用36项');
  await expect(rules).toContainText('刷新不会重抽');
  await expect(rules).toContainText('六组会同时要求不同');
  const events=rules.locator('table').filter({has:page.getByRole('columnheader',{name:'本场规则',exact:true})});
  await expect(events.locator('tbody tr')).toHaveCount(36);
  await page.setViewportSize({width:390,height:844});
  await rules.screenshot({path:info.outputPath('rules-events-mobile.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await expect(save).toBeDisabled();expect(app.rooms.get(code).game.config).toEqual(before);
  await page.getByRole('button',{name:'下移第1项',exact:true}).click();
  await expect(page.getByRole('radio',{name:'自定义积分赛',exact:true})).toBeChecked();await expect(save).toBeEnabled();
  await save.click();await expect.poll(()=>app.rooms.get(code).game.config?.competition?.rotation).toEqual(['wild','mild']);
});

test('guest and spectator can inspect shared settings but cannot change them; a started host is locked',async({browser})=>{
  const made=app.rooms.create('权限房主',3,0),code=made.identity.roomCode;
  const guest=app.rooms.join(code,'普通玩家'),spectator=app.rooms.join(code,'观战玩家','spectator');
  const contexts=await Promise.all([made,guest,spectator].map(()=>browser.newContext({viewport:{width:390,height:844}})));
  try{
    const pages:Page[]=[];
    for(const [i,entry] of [made,guest,spectator].entries()){
      const context=contexts[i]!;await context.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:${identity.roomCode}${identity.role==='spectator'?':spectator':''}`,JSON.stringify(identity));localStorage.setItem('magical-athlete:low-quality','true');localStorage.setItem('magical-athlete:reduced-motion','true');},entry.identity);
      const page=await context.newPage();pages.push(page);await page.goto(`${url}/room/${code}${entry.identity.role==='spectator'?'?spectate=1':''}`);await expect(page.locator('.connection.is-online')).toBeVisible();
      await page.locator('.room-config-panel > summary').click();
      for(const radio of await page.getByRole('radio').all())if(i===0)await expect(radio).toBeEnabled();else await expect(radio).toBeDisabled();
      if(i!==0){
        for(const control of await page.locator('.room-config-fields :is(input,select,button)').all())await expect(control).toBeDisabled();
        await expect(page.getByRole('button',{name:'保存本房间设置',exact:true})).toHaveCount(0);
      }
      await expect(page.locator('.map-options .map-card')).toHaveCount(7);
    }
    const room=app.rooms.get(code),before=structuredClone(room.game.config);
    // Use an actual race phase to exercise the same shared component in the menu.
    const game=createGame(room.game.players,73);game.config=room.game.config;game.phase='race';game.round=1;game.currentRacerId='r0';game.baseTurnOrder=['r0','r1'];game.flags.awaitRoll=true;
    game.racers=game.players.map((p,i)=>({id:`r${i}`,playerId:p.id,characterId:'banana',position:i,tripped:false,finished:false,eliminated:false,flags:{}}));room.game=game;room.configFrozen=true;room.version++;app.store.save(room);
    const host=pages[0]!;await host.reload();await expect(host.getByTestId('presentation-settings')).toBeVisible();await host.getByTestId('presentation-settings').click();
    await host.locator('.room-config-panel > summary').click();
    await expect(host.getByText('本局配置已锁定至全部场次结束。', {exact:true})).toBeVisible();
    for(const control of await host.locator('.room-config-fields :is(input,select,button)').all())await expect(control).toBeDisabled();
    await expect(host.getByRole('button',{name:'保存本房间设置',exact:true})).toHaveCount(0);
    expect(app.rooms.get(code).game.config).toEqual(before);
  }finally{await Promise.all(contexts.map(context=>context.close()));}
});

for(const [preset,name,count] of [['classic','经典赛',4],['official','官方巡回',4],['extended','扩展巡回',8]] as const)test(`${preset} tour can be created from its radio and restored`,async({page})=>{
  await page.goto(url);await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await page.getByLabel('你的昵称').fill('巡回测试');await page.getByLabel('房间人数上限').selectOption('3');
  await page.getByRole('radio',{name:new RegExp(name)}).check();
  await page.getByRole('button',{name:'创建房间，召集朋友'}).click();
  await expect(page).toHaveURL(/\/room\/[CA]-[A-Z2-9]{6}$/);
  const code=page.url().split('/').at(-1)!.replace(/^[CA]-/,'');
  const competition=app.rooms.get(code).game.config!.competition!;
  expect(competition).toEqual(presetCompetition(preset));expect(competition.raceCount).toBe(count);
  expect(app.rooms.get(code).game.config!.characterPacks).toEqual(legacyRoomConfig().characterPacks);
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
  await page.getByLabel('比赛场数').selectOption('6');
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
    if(rounds!==4){await host.getByLabel('比赛场数').selectOption(String(rounds));await host.getByRole('button',{name:'添加 Mild Mile',exact:true}).click();}
    await host.getByLabel('房间可见性').selectOption('private');await host.getByRole('button',{name:'创建房间',exact:true}).click();await expect(host).toHaveURL(/\/room\/[CA]-[A-Z2-9]{6}$/);
    const code=host.url().split('/').at(-1)!.replace(/^[CA]-/,'');expect(app.rooms.list().some(r=>r.code===code)).toBe(false);
    for(const page of pages.slice(1)){await page.goto(`${url}/room/${code}`);await page.getByLabel('你的昵称').fill('同名');await page.getByRole('button',{name:'加入',exact:true}).click();await expect(page.getByRole('button',{name:'我准备好了',exact:true})).toBeVisible();}
    // Only seed the pre-game random generator; all draft/race actions use real UIs.
    const lobby=app.rooms.get(code);lobby.game.rngState=13000+rounds;delete lobby.game.randomStream;
    const ids=await Promise.all(pages.map(p=>p.evaluate(code=>JSON.parse(localStorage.getItem(`magical-athlete:identity:cloudflare:${code}`)!).playerId,code)));
    expect(new Set(ids).size).toBe(n);expect(new Set(lobby.game.players.map(p=>p.name)).size).toBe(n);
    for(const page of pages){await sync(page,app.rooms.get(code).version);await page.getByRole('button',{name:'我准备好了',exact:true}).click();await expect(page.getByRole('button',{name:'取消准备',exact:true})).toBeVisible();}
    if(!await host.locator('.room-config-panel').evaluate(panel=>(panel as HTMLDetailsElement).open))await host.locator('.room-config-panel > summary').click();await host.getByRole('checkbox',{name:'Extra Mile',exact:true}).check();await host.getByRole('button',{name:'保存本房间设置',exact:true}).click();
    for(const page of pages){await expect(page.getByRole('button',{name:'我准备好了',exact:true})).toBeVisible();await expect(page.locator('.room-config-panel > summary')).toContainText('2 个角色包');}
    // Return to the original-only fixture, verifying that a second edit also propagates.
    await host.getByRole('checkbox',{name:'Extra Mile',exact:true}).uncheck();await host.getByRole('button',{name:'保存本房间设置',exact:true}).click();if(await host.locator('.room-config-panel').evaluate(panel=>(panel as HTMLDetailsElement).open))await host.locator('.room-config-panel > summary').click();
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
