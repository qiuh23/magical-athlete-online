import {mkdirSync} from 'node:fs';
import {test,expect,type Browser} from '@playwright/test';
import {createApplication} from '../../src/server/index.js';
import {createGame,resolveTasks} from '../../src/engine/index.js';
import {CHARACTERS} from '../../src/shared/characters.js';
import type {GameState,Identity} from '../../src/shared/types.js';
import {observePresentation,presentationRecords,waitForPresentationRecord} from './presentation-observer.js';

let app:ReturnType<typeof createApplication>,url:string;
test.beforeAll(async()=>{app=createApplication(':memory:');await new Promise<void>(resolve=>app.http.listen(0,'127.0.0.1',resolve));const address=app.http.address();if(!address||typeof address==='string')throw Error('Missing address');url=`http://127.0.0.1:${address.port}`;});
test.afterAll(async()=>app.close());
async function open(browser:Browser,identity:Identity,phone=false){
  const context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1280,height:900}});
  await context.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity));localStorage.setItem('magical-athlete:low-quality','true');localStorage.setItem('magical-athlete:muted','true');localStorage.setItem('magical-athlete:reduced-motion','false');},identity);
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${url}/room/${identity.roomCode}`);await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase','idle');await observePresentation(page);
  return{context,page,errors};
}
async function fixture(browser:Browser,ids:string[],positions:number[],faces:number[],phone=false,configure?:(game:GameState)=>void){
  const made=app.rooms.create('交互验收',3,0,'multiplayer',0,'mixed'),code=made.identity.roomCode;
  app.rooms.join(code,'第二名');app.rooms.join(code,'第三名');const watcher=app.rooms.join(code,'观战者','spectator');
  const room=structuredClone(app.rooms.get(code)),game=createGame(room.game.players,732,'multiplayer','mixed');
  game.phase='race';game.round=1;game.currentRacerId='r0';game.racers=ids.map((characterId,index)=>({id:`r${index}`,playerId:game.players[index]!.id,characterId,position:positions[index]!,tripped:false,finished:false,eliminated:false,flags:{}}));
  game.baseTurnOrder=game.racers.map(racer=>racer.id);game.flags.testDice=[...faces];game.queue=[{kind:'beginTurn',racerId:'r0'}];configure?.(game);resolveTasks(game);
  room.game=game;room.updatedAt=Date.now()+60_000;room.version++;app.rooms.rooms.set(code,room);app.store.save(room);
  return{...await open(browser,made.identity,phone),code,watcher:watcher.identity};
}
async function screenshot(page:Awaited<ReturnType<typeof open>>['page'],name:string){
  if(process.env.CI)return;
  mkdirSync('docs/qa/interaction-feedback',{recursive:true});await page.screenshot({path:`docs/qa/interaction-feedback/${name}.png`});
}

for(const [phone,faces,distance] of [[false,[5,2],2],[true,[4,4],8]] as const)test(`Broken Clock displays two dice and one movement on ${phone?'phone':'desktop'}`,async({browser})=>{
  const f=await fixture(browser,['extra-mile-broken-clock','alchemist','blimp'],[1,14,24],[...faces],phone);
  try{
    await f.page.getByTestId('roll-button').click();
    const settled=await waitForPresentationRecord(f.page,record=>record.phase==='dice'&&record.dice?.mode==='multi'&&record.dice.faces===faces.join(',')&&record.positions.r0?.position===1,'both physical dice must settle before movement');
    expect(settled.dice!.valueCount).toBe(2);
    expect(settled.dice!.resultText).toContain(phone?'双同点相加 · 基础移动 8 格':'取较小值 · 基础移动 2 格');
    await screenshot(f.page,phone?'clock-phone':'clock-desktop');
    await expect(f.page.getByTestId('board-3d')).toHaveAttribute('data-phase','idle',{timeout:20000});
    await expect(f.page.locator('[data-testid="scene-racer"][data-racer-id="r0"]')).toHaveAttribute('data-position',String(1+distance));
    const throws=new Set((await presentationRecords(f.page)).filter(record=>record.phase==='dice'&&record.dice?.visible).map(record=>record.dice!.eventKey));
    expect(throws.size).toBe(1);expect(app.rooms.get(f.code).game.randomLog).toHaveLength(2);expect(f.errors).toEqual([]);
  }finally{await f.context.close();}
});

for(const phone of [false,true])test(`drawn ability details are inspectable without choosing or revealing private cards on ${phone?'phone':'desktop'}`,async({browser})=>{
  const f=await fixture(browser,['egg','alchemist','blimp'],[2,14,24],[],phone,game=>{game.deck=['legs','gunk','banana'];game.queue.unshift({kind:'beforeRace',racerId:'r0'});});
  const watcher=await open(browser,f.watcher,phone);
  try{
    const choice=app.rooms.get(f.code).game.pending!;expect(choice.kind).toBe('egg');
    const version=app.rooms.get(f.code).version;
    await expect(watcher.page.locator('.choice-character')).toHaveCount(0);
    for(const option of choice.options){
      const card=CHARACTERS.find(card=>card.id===option.id)!;
      await f.page.getByRole('button',{name:`查看${card.nameZh}详情`,exact:true}).click();
      const dialog=f.page.getByRole('dialog',{name:card.nameZh,exact:true});await expect(dialog).toBeVisible();await expect(dialog.locator('.full-ability')).toContainText(card.ability);
      expect(app.rooms.get(f.code).game.pending!.id).toBe(choice.id);expect(app.rooms.get(f.code).version).toBe(version);
      if(option===choice.options[0])await screenshot(f.page,phone?'draw-detail-phone':'draw-detail-desktop');
      await dialog.getByRole('button',{name:'关闭',exact:true}).click();
    }
    await screenshot(f.page,phone?'draw-options-phone':'draw-options-desktop');
    await f.page.getByTestId('skill-choice').getByRole('button',{name:choice.options[0]!.label,exact:true}).click();
    await expect.poll(()=>app.rooms.get(f.code).game.racers[0]!.flags.eggCardId).toBe(choice.options[0]!.id);
    expect([...f.errors,...watcher.errors]).toEqual([]);
  }finally{await watcher.context.close();await f.context.close();}
});

test('Duelist event dice explain the same-cell cause and required number before trip settlement',async({browser})=>{
  const f=await fixture(browser,['alchemist','coach','blimp'],[2,5,24],[3,2],false,game=>{game.flags.thirds={id:'duelist',round:1,held:{},extraCards:[]};});
  try{
    await f.page.getByTestId('roll-button').click();
    await f.page.getByTestId('skill-choice').getByRole('button',{name:'4',exact:true}).click();
    const settled=await waitForPresentationRecord(f.page,record=>record.phase==='dice'&&record.dice?.face==='2'&&record.dice.label==='教练正在掷决斗家事件骰','event die must identify the reacting racer');
    expect(settled.dice!.reason).toBe('决斗家事件：与炼金术士同格，须掷出4点，否则绊倒。');
    await screenshot(f.page,'duelist-event');
    await expect(f.page.getByTestId('board-3d')).toHaveAttribute('data-phase','idle',{timeout:20000});
    const logs=app.rooms.get(f.code).game.logs,die=logs.find(event=>event.cause==='thirds-duel')!;
    expect(die.rollReason).toContain('须掷出4点');
    // The following turn can already have recovered Coach. Verify the actual
    // trip event and its visible beat, rather than a later snapshot's flag.
    const trip=logs.find(event=>event.id>die.id&&event.type==='trip'&&event.targets?.includes('r1'));
    expect(trip).toBeDefined();expect((await presentationRecords(f.page)).some(record=>record.phase==='trip'&&record.eventIds.includes(trip!.id))).toBe(true);expect(f.errors).toEqual([]);
  }finally{await f.context.close();}
});
