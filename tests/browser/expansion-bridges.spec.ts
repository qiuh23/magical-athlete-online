import { setCameraView } from './camera-controls.js';
import { writeFileSync } from 'node:fs';
import { bridgeProfile } from '../../src/client/scene/bridges-layout.js';
import { Vector3, Line3 } from 'three';
import { test, expect } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';
import { boardPoint, trackNodeIds } from '../../src/client/scene/math.js';
import type { TrackId } from '../../src/shared/tracks.js';

let app: ReturnType<typeof createApplication>, url: string;
test.beforeAll(async () => {
  app = createApplication(':memory:');
  await new Promise<void>(resolve => app.http.listen(0, '127.0.0.1', resolve));
  const address = app.http.address(); if (!address || typeof address === 'string') throw Error('No test address');
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => { await app.close(); });


test('Bridges actual scene: all crossing pairs, desktop and narrow phone', async ({page},info)=>{
 const made=app.rooms.create('桥梁验收',8,0), code=made.identity.roomCode;
 for(let i=1;i<8;i++)app.rooms.join(code,`选手${i+1}`);
 const room=app.rooms.get(code),game=createGame(room.game.players,731);
 game.phase='race';game.round=1;game.track='bridges';game.currentRacerId='r0';
 const positions=[3,8,10,13,15,18,20,23];
 game.racers=game.players.map((p,i)=>({id:`r${i}`,playerId:p.id,characterId:i===0?'leaf-revolutionary':'coach',position:positions[i]!,tripped:false,finished:false,eliminated:false,flags:{awaitRoll:true}}));
 game.baseTurnOrder=game.racers.map(r=>r.id);room.game=game;room.version++;app.store.save(room);
 await page.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity));for(const [key,value]of Object.entries({'reduced-motion':'true','low-quality':'true',muted:'true'}))localStorage.setItem(`magical-athlete:${key}`,value)},made.identity);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of [[1280,900],[390,844],[360,800]]){
  await page.setViewportSize({width:width!,height:height!});await page.goto(`${url}/room/${code}`);
  const board=page.getByTestId('board-3d');await expect(board).toBeVisible();await expect(board.locator('.scene-fallback')).toHaveCount(0);
  await expect(board).toHaveAttribute('data-loaded-models',/[1-9]/);
  await setCameraView(board, '总览');await page.waitForTimeout(1500);
  await page.screenshot({path:`test-results/expansion-dioramas/bridges-overview-${width}.png`});
  for(let i=0;i<8;i++){const expected=boardPoint(positions[i]!,width!<600,'bridges');const label=board.locator(`[data-racer-id="r${i}"].pawn-seat`);await expect.poll(async()=>Number(await label.getAttribute('data-world-y'))).toBeCloseTo(expected[1]+.005,3);}
  await setCameraView(board, '自己');await page.waitForTimeout(1500);
  await page.screenshot({path:`test-results/expansion-dioramas/bridges-self-${width}.png`});
 }
 expect(errors).toEqual([]);
});

for(const center of [3,8,10,13,15,18,20,23])test(`Bridges live travel ${center-1} → ${center} → ${center+1}`,async({page})=>{
 const made=app.rooms.create('行走验收',2,0),code=made.identity.roomCode;app.rooms.join(code,'桥层观察');
 const room=app.rooms.get(code),game=createGame(room.game.players,731);
 game.phase='race';game.round=1;game.track='bridges';game.currentRacerId='r0';game.baseTurnOrder=['r0','r1'];
 game.racers=game.players.map((p,i)=>({id:`r${i}`,playerId:p.id,characterId:i?'coach':'leaf-revolutionary',position:i?center-2:center-1,tripped:false,finished:false,eliminated:false,flags:{}}));
 game.flags.testDice=[2];game.queue=[{kind:'beginTurn',racerId:'r0'}];resolveTasks(game);room.game=game;room.version++;app.store.save(room);
 await page.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity));localStorage.setItem('magical-athlete:muted','true');localStorage.setItem('magical-athlete:low-quality','true');localStorage.setItem('magical-athlete:reduced-motion','false');},made.identity);
 await page.setViewportSize({width:390,height:844});await page.goto(`${url}/room/${code}`);
 const board=page.getByTestId('board-3d');await expect(board).toHaveAttribute('data-loaded-models','2');await expect(board).toHaveAttribute('data-model-fallbacks','0');
 await page.getByTestId('roll-button').click();await expect(board).toHaveAttribute('data-phase','move');
 const samples:number[][]=[];
 for(let sample=0;sample<3;sample++){
  await page.waitForTimeout(180);
  const p=await board.locator('.pawn-seat[data-racer-id="r0"]').evaluate(e=>['x','y','z'].map(k=>Number(e.getAttribute('data-world-'+k))));samples.push(p);
  const nodes=[center-1,center,center+1].map(n=>boardPoint(n,true,'bridges'));
  const segments=nodes.slice(1).flatMap((n,i)=>{const leg=bridgeProfile(nodes[i]!,n);return leg.slice(1).map((v,j)=>new Line3(new Vector3(...leg[j]!),new Vector3(...v)))});
  const point=new Vector3(...p),nearest=new Vector3();const distance=Math.min(...segments.map(line=>line.closestPointToPoint(point,true,nearest).distanceTo(point)));
  expect(distance).toBeLessThan(.09);
  await page.screenshot({path:`test-results/expansion-dioramas/bridge-${center}-moving-${sample}.png`});
 }
 writeFileSync(`test-results/expansion-dioramas/bridge-${center}-samples.json`,JSON.stringify(samples,null,2));
 await expect(board).toHaveAttribute('data-phase','idle');expect(app.rooms.get(code).game.racers[0]!.position).toBe(center+1);
 const label=board.locator('.pawn-seat[data-racer-id="r0"]');const end=boardPoint(center+1,true,'bridges');await expect.poll(async()=>Number(await label.getAttribute('data-world-y'))).toBeCloseTo(end[1]+.005,3);
});

test('Revolutionary standing, fall, recovery and crowded tile in the actual scene',async({page})=>{
 const made=app.rooms.create('革命家验收',4,0),code=made.identity.roomCode;for(let i=1;i<4;i++)app.rooms.join(code,`队员${i}`);
 const room=app.rooms.get(code),game=createGame(room.game.players,731);game.phase='race';game.round=1;game.track='bridges';game.currentRacerId='r0';game.baseTurnOrder=['r0','r1','r2','r3'];
 game.racers=game.players.map((p,i)=>({id:`r${i}`,playerId:p.id,characterId:i?'coach':'leaf-revolutionary',position:i?6:3,tripped:false,finished:false,eliminated:false,flags:{}}));
 game.flags.awaitRoll=true;room.game=game;room.version++;app.store.save(room);
 await page.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity));localStorage.setItem('magical-athlete:muted','true');localStorage.setItem('magical-athlete:reduced-motion','false');},made.identity);
 await page.setViewportSize({width:390,height:844});await page.goto(`${url}/room/${code}`);const board=page.getByTestId('board-3d');await expect(board).toHaveAttribute('data-loaded-models','4');
 await setCameraView(board, '自己');await page.waitForTimeout(1800);await page.screenshot({path:'test-results/expansion-dioramas/revolutionary-game-standing.png'});
 const emit=()=>{room.version++;app.rooms.rooms.set(code,room);app.store.save(room);for(const socket of app.io.sockets.sockets.values())if(socket.data.identity?.roomCode===code)socket.emit('snapshot',app.rooms.view(room,socket.data.identity.playerId));};
 room.game.racers[0]!.tripped=true;room.game.logs.push({id:1,type:'trip',source:'r0',targets:['r0'],text:'验收：绊倒'});emit();
 await expect(board).toHaveAttribute('data-phase','trip');await page.waitForTimeout(450);await page.screenshot({path:'test-results/expansion-dioramas/revolutionary-game-fall.png'});await expect(board).toHaveAttribute('data-phase','idle');
 await page.screenshot({path:'test-results/expansion-dioramas/revolutionary-game-down.png'});
 room.game.racers[0]!.tripped=false;room.game.logs.push({id:2,type:'recover',source:'r0',targets:['r0'],text:'验收：起立'});emit();await expect(board).toHaveAttribute('data-phase','recover');await page.waitForTimeout(300);await page.screenshot({path:'test-results/expansion-dioramas/revolutionary-game-recover.png'});await expect(board).toHaveAttribute('data-phase','idle');
 for(const r of room.game.racers)r.position=3;emit();await page.reload();await expect(board).toHaveAttribute('data-loaded-models','4');await expect(board.locator('.pawn-seat')).toHaveCount(4);await expect.poll(()=>app.rooms.get(code).game.racers.map(r=>r.position)).toEqual([3,3,3,3]);await page.waitForTimeout(1500);await page.screenshot({path:'test-results/expansion-dioramas/revolutionary-game-crowded.png'});
});

for(const [upper,lower] of [[3,8],[10,13],[15,18],[20,23]])test(`readable crossing ${upper}/${lower} close view`,async({page})=>{
 const made=app.rooms.create('桥层近景',2,0),code=made.identity.roomCode;app.rooms.join(code,'下层选手');
 const room=app.rooms.get(code),game=createGame(room.game.players,731);game.phase='race';game.round=1;game.track='bridges';game.currentRacerId='r0';game.baseTurnOrder=['r0','r1'];
 game.racers=game.players.map((p,i)=>({id:`r${i}`,playerId:p.id,characterId:i?'coach':'leaf-revolutionary',position:(i?lower:upper)!,tripped:false,finished:false,eliminated:false,flags:{}}));room.game=game;room.version++;app.store.save(room);
 await page.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity));for(const key of ['muted','low-quality','reduced-motion'])localStorage.setItem(`magical-athlete:${key}`,'true')},made.identity);
 await page.setViewportSize({width:390,height:844});await page.goto(`${url}/room/${code}`);const board=page.getByTestId('board-3d');await expect(board).toHaveAttribute('data-loaded-models','2');await setCameraView(board, '自己');await page.waitForTimeout(1200);await page.screenshot({path:`test-results/expansion-dioramas/crossing-${upper}-${lower}.png`});
});
