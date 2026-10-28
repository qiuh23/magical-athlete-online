import { test, expect, type Browser, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { createApplication } from '../../src/server/index.js';
import { createGame, resolveTasks, enqueueMove, applyGameAction } from '../../src/engine/index.js';
import { CHARACTERS } from '../../src/shared/characters.js';
import type { Identity, Room, GameAction } from '../../src/shared/types.js';

let app:ReturnType<typeof createApplication>,url:string;
test.beforeAll(async()=>{app=createApplication(':memory:');await new Promise<void>(resolve=>app.http.listen(0,'127.0.0.1',resolve));const address=app.http.address();if(!address||typeof address==='string')throw Error('No server address');url=`http://127.0.0.1:${address.port}`;mkdirSync('docs/qa/host-match-pause',{recursive:true});});
test.afterAll(async()=>app.close());
test.use({actionTimeout:15_000});
const name=(id:string)=>CHARACTERS.find(c=>c.id===id)!.nameZh;
function publish(room:Room){app.store.save(room);for(const socket of app.io.sockets.sockets.values())if(socket.data.identity?.roomCode===room.code)socket.emit('snapshot',app.rooms.view(room,socket.data.identity.playerId));}
function command(code:string,id:string,action:GameAction){const room=app.rooms.get(code),reply=app.rooms.act(code,id,{actionId:crypto.randomUUID(),expectedVersion:room.version,action});expect(reply.ok,reply.error).toBe(true);return app.rooms.get(code);}
async function connect(browser:Browser,identity:Identity,mobile=false){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000}});
  await context.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:cloudflare:${identity.roomCode}`,JSON.stringify({...identity,backendId:'cloudflare'}));localStorage.setItem('magical-athlete:low-quality','true');localStorage.setItem('magical-athlete:reduced-motion','false');localStorage.setItem('magical-athlete:animation-speed','1');localStorage.setItem('magical-athlete:muted','true');},identity);
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());await page.goto(`${url}/room/C-${identity.roomCode}`);await expect(page.locator('.connection.is-online').first()).toBeVisible();return{context,page,errors};
}
async function fit(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);const button=page.getByRole('button',{name:'恢复比赛',exact:true});if(await button.count()){const box=await button.boundingBox();expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);}}
async function pause(page:Page){await page.getByRole('button',{name:'暂停比赛',exact:true}).click();await expect(page.getByTestId('room-pause-notice')).toBeVisible();await expect(page.getByRole('button',{name:'恢复比赛',exact:true})).toHaveCSS('background-color','rgb(52, 121, 108)');}
async function resume(page:Page){await page.getByRole('button',{name:'恢复比赛',exact:true}).click();await expect(page.getByTestId('room-pause-notice')).toHaveCount(0);}
function gameFixture(code:string,ids=['magician','banana','banana'],positions=[2,14,22]){
  const room=app.rooms.get(code),game=createGame(room.game.players,123,'multiplayer','mixed');game.phase='race';game.round=1;game.currentRacerId='r0';
  game.racers=ids.map((characterId,i)=>({id:`r${i}`,playerId:game.players[i]!.id,characterId,position:positions[i]!,tripped:false,finished:false,eliminated:false,flags:{}}));game.baseTurnOrder=game.racers.map(r=>r.id);game.flags.testDice=[3,5];room.game=game;room.version++;room.updatedAt=Date.now();room.deadline=null;return room;
}

test('draft and secret selection pause for host, mobile guest and spectator, retaining local picks after resume',async({browser})=>{
  const host=app.rooms.create('暂停房主',3,30),code=host.identity.roomCode,guest=app.rooms.join(code,'手机选手'),third=app.rooms.join(code,'第三位'),watch=app.rooms.join(code,'观众','spectator');
  const clients=await Promise.all([connect(browser,host.identity),connect(browser,guest.identity,true),connect(browser,watch.identity,true)]);
  try{
    const [owner,other,spectator]=clients.map(c=>c.page) as [Page,Page,Page];
    await expect(owner.getByRole('button',{name:'暂停比赛',exact:true})).toBeDisabled();expect(await other.getByRole('button',{name:'暂停比赛',exact:true}).count()).toBe(0);
    const room=app.rooms.get(code);room.game.players.forEach(p=>{p.ready=true;p.connected=true;});command(code,host.identity.playerId,{type:'start',threePlayerMode:'single'});publish(app.rooms.get(code));
    await expect(owner.getByRole('button',{name:'暂停比赛',exact:true})).toBeEnabled();await pause(owner);
    for(const page of [other,spectator])await expect(page.getByTestId('room-pause-notice')).toBeVisible();
    const frozen=structuredClone(app.rooms.get(code).game);app.rooms.tick(Date.now()+60_000);expect(app.rooms.get(code).game).toEqual(frozen);
    for(const page of [owner,other])for(const button of await page.getByRole('button',{name:/^选择.+/}).all())await expect(button).toBeDisabled();
    await fit(owner);await owner.screenshot({path:'docs/qa/host-match-pause/draft-desktop.png'});
    await other.reload();await expect(other.getByTestId('room-pause-notice')).toBeVisible();await expect(spectator.getByRole('button',{name:'恢复比赛',exact:true})).toHaveCount(0);await resume(owner);
    while(app.rooms.get(code).game.phase==='draft'){const r=app.rooms.get(code),d=r.game.draft!;command(code,d.order[d.cursor]!,{type:'draft',characterId:d.market[0]!});}publish(app.rooms.get(code));
    const picked=app.rooms.get(code).game.players[0]!.hand[0]!;await owner.getByRole('button',{name:`选择${name(picked)}`,exact:true}).click();await pause(owner);
    await expect(owner.getByRole('button',{name:`取消选择${name(picked)}`,exact:true})).toBeDisabled();await expect(owner.getByRole('button',{name:'锁定上场角色',exact:true})).toBeDisabled();
    await expect(other.getByTestId('room-pause-notice')).toBeVisible();await fit(other);await other.screenshot({path:'docs/qa/host-match-pause/selection-mobile.png'});
    await resume(owner);await expect(owner.getByRole('button',{name:`取消选择${name(picked)}`,exact:true})).toHaveAttribute('aria-pressed','true');await owner.getByRole('button',{name:'锁定上场角色',exact:true}).click();expect(app.rooms.get(code).game.players[0]!.selection).toEqual([picked]);
    for(const client of clients)expect(client.errors).toEqual([]);
  }finally{await Promise.all(clients.map(c=>c.context.close()));}
});

test('dice throw, result reading and movement freeze then resume without a reroll or a lost optional skill',async({browser})=>{
  const host=app.rooms.create('动效房主',3,0),code=host.identity.roomCode;app.rooms.join(code,'对手一');app.rooms.join(code,'对手二');const room=gameFixture(code);room.game.queue=[{kind:'beginTurn',racerId:'r0'}];resolveTasks(room.game);publish(room);
  const client=await connect(browser,host.identity),page=client.page,board=page.getByTestId('board-3d');
  try{
    await expect(board).toHaveAttribute('data-phase','idle');await expect.poll(async()=>Number(await board.getAttribute('data-triangles'))).toBeGreaterThan(100);
    await page.getByTestId('roll-button').click();await expect(board).toHaveAttribute('data-phase','dice');await pause(page);await expect(board).toHaveAttribute('data-playback-paused','true');
    const event=await board.getAttribute('data-event-ids'),game=structuredClone(app.rooms.get(code).game);await page.waitForTimeout(1_600);await expect(board).toHaveAttribute('data-event-ids',event!);await expect(page.locator('.dice-spotlight')).not.toHaveClass(/is-settled/);expect(app.rooms.get(code).game).toEqual(game);await expect(page.getByTestId('skip-animation')).toBeDisabled();
    await page.screenshot({path:'docs/qa/host-match-pause/dice-desktop.png'});await resume(page);await expect(page.locator('.dice-spotlight')).toHaveAttribute('data-up-face','3');await pause(page);
    await page.waitForTimeout(1_300);await expect(board).toHaveAttribute('data-phase','dice');await expect(page.locator('.dice-spotlight')).toHaveAttribute('data-up-face','3');await resume(page);await expect(page.getByTestId('skill-choice')).toBeVisible();
    const pending=app.rooms.get(code).game.pending!;expect(pending.kind).toBe('reroll');await pause(page);for(const b of await page.getByTestId('skill-choice').locator('.choice-options button').all())await expect(b).toBeDisabled();await resume(page);expect(app.rooms.get(code).game.pending!.id).toBe(pending.id);
    // Catch the short movement window before any screenshots or remote waits.
    await page.evaluate(()=>{const observer=new MutationObserver(()=>{if(document.querySelector('[data-testid="board-3d"]')?.getAttribute('data-phase')==='move'){observer.disconnect();(document.querySelector('button[aria-label="暂停比赛"]') as HTMLButtonElement)?.click();}});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-phase']});});
    const keep=pending.options.find(o=>o.id==='keep')!;await page.getByTestId('skill-choice').getByRole('button',{name:keep.label,exact:true}).click();await expect(page.getByTestId('room-pause-notice')).toBeVisible();await expect(board).toHaveAttribute('data-phase','move');await expect(board).toHaveAttribute('data-frameloop','demand');
    const positions=()=>page.locator('.pawn-seat').evaluateAll(items=>items.map(e=>[e.getAttribute('data-racer-id'),(e as HTMLElement).dataset.worldX,(e as HTMLElement).dataset.worldY,(e as HTMLElement).dataset.worldZ]));
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));const before=await positions();await page.waitForTimeout(1_200);expect(await positions()).toEqual(before);const draws=app.rooms.get(code).game.randomLog.length;expect(draws).toBe(1);await resume(page);await expect(board).toHaveAttribute('data-phase','idle');expect(app.rooms.get(code).game.randomLog.length).toBe(draws);expect(app.rooms.get(code).game.logs.filter(e=>e.type==='die')).toHaveLength(1);expect(client.errors).toEqual([]);
    await page.setViewportSize({width:390,height:844});await pause(page);await fit(page);await page.screenshot({path:'docs/qa/host-match-pause/race-mobile.png'});
  }finally{await client.context.close();}
});

test('paused duel still requires each human to click their own die after refresh and resume',async({browser})=>{
  const host=app.rooms.create('决斗房主',3,30),code=host.identity.roomCode,guest=app.rooms.join(code,'应战选手');app.rooms.join(code,'旁观选手');const room=gameFixture(code,['duelist','banana','banana'],[4,5,20]);enqueueMove(room.game,'r0',1);resolveTasks(room.game);const target=room.game.pending!;applyGameAction(room.game,target.playerId,{type:'choose',choiceId:target.id,optionId:'r1'});const first=room.game.pending!;applyGameAction(room.game,first.playerId,{type:'choose',choiceId:first.id,optionId:'roll'});publish(room);
  const owner=await connect(browser,host.identity),other=await connect(browser,guest.identity,true);
  try{
    expect(app.rooms.get(code).game.pending?.kind).toBe('duel-roll');await expect(other.page.getByTestId('skill-choice')).toBeVisible();await pause(owner.page);const pending=structuredClone(app.rooms.get(code).game.pending),draws=app.rooms.get(code).game.randomLog.length;
    await expect(other.page.getByTestId('skill-choice').getByRole('button',{name:/掷/})).toBeDisabled();await other.page.reload();await expect(other.page.getByTestId('room-pause-notice')).toBeVisible();expect(app.rooms.get(code).game.pending).toEqual(pending);app.rooms.tick(Date.now()+60_000);expect(app.rooms.get(code).game.randomLog.length).toBe(draws);
    await resume(owner.page);await expect(other.page.getByTestId('skill-choice').getByRole('button',{name:/掷/})).toBeEnabled();await other.page.getByTestId('skill-choice').getByRole('button',{name:/掷/}).click();await expect.poll(()=>app.rooms.get(code).game.randomLog.length).toBe(draws+1);expect(app.rooms.get(code).game.logs.filter(e=>e.type==='duel-dice')).toHaveLength(1);expect(owner.errors).toEqual([]);expect(other.errors).toEqual([]);
  }finally{await owner.context.close();await other.context.close();}
});

test('six-die readback remains visible during pause and choosing an existing die never throws again',async({browser})=>{
  const host=app.rooms.create('六骰房主',3,0),code=host.identity.roomCode;app.rooms.join(code,'对手一');app.rooms.join(code,'对手二');const room=gameFixture(code,['mr-dice-guy','banana','banana']);room.game.flags.testDice=[2,2,3,4,5,6];room.game.queue=[{kind:'beginTurn',racerId:'r0'}];resolveTasks(room.game);publish(room);
  const client=await connect(browser,host.identity),page=client.page;
  try{
    await page.getByTestId('skill-choice').getByRole('button',{name:'掷六骰',exact:true}).click();await expect(page.locator('.dice-spotlight')).toHaveAttribute('data-up-faces','2,2,3,4,5,6');await pause(page);
    await page.waitForTimeout(1_950);await expect(page.locator('.dice-spotlight')).toHaveAttribute('data-up-faces','2,2,3,4,5,6');expect(app.rooms.get(code).game.randomLog).toHaveLength(6);await resume(page);await expect(page.getByTestId('skill-choice')).toBeVisible();
    const pending=app.rooms.get(code).game.pending!,option=pending.options[0]!;await page.getByTestId('skill-choice').getByRole('button',{name:option.label,exact:true}).click();await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase','idle');expect(app.rooms.get(code).game.randomLog).toHaveLength(6);expect(app.rooms.get(code).game.logs.filter(e=>e.type==='multi-dice')).toHaveLength(1);expect(client.errors).toEqual([]);
  }finally{await client.context.close();}
});

test('pausing a confirmed race reveal holds the entrants tour until resume',async({browser})=>{
  const host=app.rooms.create('入场房主',3,0),code=host.identity.roomCode;app.rooms.join(code,'对手一');app.rooms.join(code,'对手二');const room=app.rooms.get(code);
  room.game.phase='selection';room.game.round=1;room.game.players.forEach((p,i)=>{p.hand=[['banana','alchemist','legs'][i]!];p.connected=true;});room.version++;publish(room);
  const client=await connect(browser,host.identity),page=client.page,board=page.getByTestId('board-3d');
  try{
    const first=room.game.players[0]!;await page.getByRole('button',{name:`选择${name(first.hand[0]!)}`,exact:true}).click();await page.getByRole('button',{name:'锁定上场角色',exact:true}).click();
    for(const p of app.rooms.get(code).game.players.slice(1))command(code,p.id,{type:'select',characterIds:p.hand});publish(app.rooms.get(code));
    await expect(board).toHaveAttribute('data-phase','intro');await expect(board).toHaveAttribute('data-intro-ready','true');const draws=app.rooms.get(code).game.randomLog.length;await pause(page);const step=await page.getByTestId('race-intro').getAttribute('data-intro-index');await page.waitForTimeout(1_700);await expect(page.getByTestId('race-intro')).toHaveAttribute('data-intro-index',step!);await expect(page.getByTestId('skip-animation')).toBeDisabled();await resume(page);await expect(board).toHaveAttribute('data-phase','idle');expect(app.rooms.get(code).game.randomLog).toHaveLength(draws);expect(client.errors).toEqual([]);
  }finally{await client.context.close();}
});
