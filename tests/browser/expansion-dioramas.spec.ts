import { setCameraView } from './camera-controls.js';
import { writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';
import type { TrackId } from '../../src/shared/tracks.js';
let app:ReturnType<typeof createApplication>,url:string;
const stage=process.env.ART_STAGE??'after';
const dir='test-results/expansion-dioramas';
test.beforeAll(async()=>{app=createApplication(':memory:');await new Promise<void>(r=>app.http.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${(app.http.address() as {port:number}).port}`});
test.afterAll(async()=>{await app.close()});
for(const track of ['mild','wild','squiggle','boardwalks','bridges','twisty-twirl'] as TrackId[])test(`${track} matched presentation`,async({page})=>{
 const made=app.rooms.create('场景验收',4,0),code=made.identity.roomCode;for(let i=1;i<4;i++)app.rooms.join(code,`选手${i+1}`);
 const room=app.rooms.get(code),game=createGame(room.game.players,731);game.phase='race';game.round=1;game.track=track;game.currentRacerId='r0';game.baseTurnOrder=['r0','r1','r2','r3'];
 const pos=track==='bridges'?3:track==='boardwalks'?8:track==='twisty-twirl'?13:14;
 game.racers=game.players.map((p,i)=>({id:`r${i}`,playerId:p.id,characterId:i===0?'leaf-revolutionary':'coach',position:i<3?pos:track==='bridges'?8:pos+3,tripped:false,finished:false,eliminated:false,flags:{}}));game.flags.awaitRoll=true;
 if(track==='twisty-twirl')game.flags.twist={triggered:false,deck:['conveyor'],drawn:[]};
 room.game=game;room.version++;app.store.save(room);
 await page.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity));for(const [k,v]of Object.entries({'reduced-motion':'true','low-quality':'false',muted:'true'})){if(k!=='low-quality'||localStorage.getItem(`magical-athlete:${k}`)===null)localStorage.setItem(`magical-athlete:${k}`,v)}},made.identity);
 await page.addInitScript(()=>{
 const w=window as unknown as {renderSamples:{calls:number;triangles:number}[]};w.renderSamples=[];let calls=0,triangles=0;
 const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{calls=0;triangles=0;cb(t);if(calls){w.renderSamples.push({calls,triangles});if(w.renderSamples.length>100)w.renderSamples.shift()}});
 for(const proto of [WebGLRenderingContext.prototype,WebGL2RenderingContext.prototype])for(const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){
 const p=proto as unknown as Record<string,(...args:number[])=>void>,original=p[name];if(!original||!Object.prototype.hasOwnProperty.call(proto,name))continue;
 p[name]=function(...args:number[]){calls++;const count=name.startsWith('drawArrays')?args[2]!:args[1]!,instances=name.endsWith('Instanced')?args[4]??args[3]??1:1;triangles+=(args[0]===4?count/3:args[0]===5||args[0]===6?Math.max(0,count-2):0)*instances;return original.apply(this,args)};
 }
 });
 const metrics:unknown[]=[];
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [w,h]of [[1280,900],[390,844],[360,800]]){
 await page.setViewportSize({width:w!,height:h!});await page.goto(`${url}/room/${code}`);const b=page.getByTestId('board-3d');await expect(b).toHaveAttribute('data-loaded-models','4');await expect(b.locator('.scene-fallback')).toHaveCount(0);
 for(const view of ['总览','自己']){await setCameraView(b, view);await page.waitForTimeout(1300);await page.screenshot({path:`${dir}/${stage}-${track}-${w}-${view==='总览'?'overview':'close'}.png`});metrics.push({width:w,view,quality:await b.getAttribute('data-quality'),frames:await page.evaluate(()=>(window as unknown as {renderSamples:unknown[]}).renderSamples.slice(-3))});}
 }
 await page.evaluate(()=>localStorage.setItem('magical-athlete:low-quality','true'));await page.reload();await expect(page.getByTestId('board-3d')).toHaveAttribute('data-loaded-models','4');await expect(page.getByTestId('board-3d')).toHaveAttribute('data-quality','economy');await setCameraView(page, '总览');await page.waitForTimeout(1200);await page.screenshot({path:`${dir}/${stage}-${track}-360-low.png`});metrics.push({width:360,view:'low-overview',quality:await page.getByTestId('board-3d').getAttribute('data-quality'),frames:await page.evaluate(()=>(window as unknown as {renderSamples:unknown[]}).renderSamples.slice(-3))});writeFileSync(`${dir}/${stage}-${track}-render.json`,JSON.stringify(metrics,null,2));expect(errors).toEqual([]);
});
