import {test,expect,type Browser} from '@playwright/test';
import {createApplication} from '../../src/server/index.js';
import {createGame,resolveTasks} from '../../src/engine/index.js';
import type {GameState} from '../../src/shared/types.js';
import {observePresentation,presentationRecords,waitForPresentationRecord} from './presentation-observer.js';

let app:ReturnType<typeof createApplication>,url:string;
test.beforeAll(async()=>{app=createApplication(':memory:');await new Promise<void>(resolve=>app.http.listen(0,'127.0.0.1',resolve));const a=app.http.address();if(!a||typeof a==='string')throw Error('Missing address');url=`http://127.0.0.1:${a.port}`;});
test.afterAll(async()=>app.close());
async function fixture(browser:Browser,ids:string[],positions:number[],configure?:(game:GameState)=>void){
  const made=app.rooms.create('能力顺序验收',3,0,'multiplayer',0,'mixed'),code=made.identity.roomCode;app.rooms.join(code,'第二名');app.rooms.join(code,'第三名');
  const room=structuredClone(app.rooms.get(code)),game=createGame(room.game.players,732,'multiplayer','mixed');
  game.phase='race';game.round=1;game.currentRacerId='r0';game.players.forEach(p=>p.score=2);game.racers=ids.map((characterId,index)=>({id:`r${index}`,playerId:game.players[index]!.id,characterId,position:positions[index]!,tripped:false,finished:false,eliminated:false,flags:{}}));game.baseTurnOrder=game.racers.map(r=>r.id);game.queue=[{kind:'beginTurn',racerId:'r0'}];resolveTasks(game);configure?.(game);
  room.game=game;room.version++;room.updatedAt=Date.now()+60_000;app.rooms.rooms.set(code,room);app.store.save(room);
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity));localStorage.setItem('magical-athlete:animation-speed','4');for(const key of ['low-quality','reduced-motion','muted'])localStorage.setItem(`magical-athlete:${key}`,'true');},made.identity);
  const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`${url}/room/${code}`);await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase','idle');await expect(page.locator('[data-testid="scene-racer"]')).toHaveCount(3);await observePresentation(page);return{context,page,code,errors};
}

test('Moneybags payment and modified main movement visibly precede Pooh response, with no die',async({browser})=>{
  const f=await fixture(browser,['extra-mile-moneybags','extra-mile-pooh','gunk'],[1,10,20]);
  try{
    await f.page.getByTestId('skill-choice').getByRole('button',{name:'支付1分，移动4格',exact:true}).click();
    await expect.poll(()=>app.rooms.get(f.code).game.logs.some(e=>e.type==='move'&&e.cause==='extra-mile-pooh')).toBe(true);
    const game=app.rooms.get(f.code).game,bear=game.logs.find(e=>e.type==='move'&&e.cause==='extra-mile-pooh')!;expect(bear).toBeDefined();
    await waitForPresentationRecord(f.page,r=>r.phase==='move'&&r.eventIds.includes(bear.id)&&r.positions.r0?.position===4&&r.positions.r1?.position===10&&r.positions.r1.target===11,'Pooh must move only after the paid main movement finishes');
    await expect(f.page.getByTestId('board-3d')).toHaveAttribute('data-phase','idle',{timeout:20000});
    const records=await presentationRecords(f.page);expect(records.some(r=>r.phase==='dice')).toBe(false);expect(game.randomLog).toHaveLength(0);expect(game.players[0]!.score).toBe(1);expect(f.errors).toEqual([]);
  }finally{await f.context.close();}
});

test('field NPC trip visibly resolves before current-player Romantic reacts to the landing',async({browser})=>{
  const f=await fixture(browser,['romantic','alchemist','alchemist'],[20,2,5],game=>{game.flags.thirds={id:'baba-yaga',round:1,held:{},extraCards:[],npc:{id:'baba-yaga',position:5}};});
  try{
    const room=app.rooms.get(f.code),game=room.game;game.flags.awaitRoll=false;game.queue=[{kind:'move',racerId:'r1',distance:3},{kind:'mainReady',racerId:'r0'}];resolveTasks(game);room.version++;app.store.save(room);
    for(const socket of app.io.sockets.sockets.values())if(socket.data.identity?.roomCode===f.code)socket.emit('snapshot',app.rooms.view(room,socket.data.identity.playerId));
    const trip=game.logs.find(e=>e.type==='trip'&&e.targets?.includes('r1'))!,romantic=game.logs.find(e=>e.type==='power'&&e.cause==='romantic')!;expect(trip.id).toBeLessThan(romantic.id);
    const skill=await waitForPresentationRecord(f.page,r=>r.phase==='skill'&&r.eventIds.includes(romantic.id),'Romantic must visibly activate after the field trip');
    expect((await presentationRecords(f.page)).some(r=>r.seq<skill.seq&&r.phase==='trip'&&r.eventIds.includes(trip.id))).toBe(true);
    await expect(f.page.getByTestId('board-3d')).toHaveAttribute('data-phase','idle',{timeout:20000});expect(f.errors).toEqual([]);
  }finally{await f.context.close();}
});
