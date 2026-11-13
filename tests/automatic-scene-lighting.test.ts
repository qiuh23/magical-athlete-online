import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';
import {PresentationClock} from '../src/client/presentation-clock.js';
import {RoomLightingClock,SCENE_LIGHT_CYCLE_MS,automaticLightPhase,sceneLightingRoomKey,sceneLightingRunning} from '../src/client/scene-lighting-clock.js';
import {createVenueLightingState,stepVenueLighting,venueFixtureNightFactor,VENUE_LIGHT_ONSET_PHASE,applyVenueSpotState} from '../src/client/scene/environment/venue-lighting-state.js';
import {scheduleLightingFrames,lightingFrameDelay} from '../src/client/scene/environment/lighting-demand.js';
import {createSkyEnvironment,SKY_SOURCE_DIRECTIONS} from '../src/client/scene/sky-environment.mjs';
import type {RoomView} from '../src/shared/types.js';
const room={backendId:'cloudflare',code:'DAY',createdAt:123,phase:'race',round:1,track:'wild'} as RoomView;
const close=(a:number,b:number,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
function storage(){const m=new Map<string,string>();return{m,getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);}};}
test('180-second continuous cycle exposes distinct lighting within a quick match and loops without jumps',()=>{
 assert.equal(SCENE_LIGHT_CYCLE_MS,180000);[0,1,2,1,0].forEach((p,i)=>close(automaticLightPhase(i*45000),p));
 assert.ok(automaticLightPhase(15000)>.13);assert.ok(automaticLightPhase(30000)>.49);
 for(let t=0;t<360000;t+=50)assert.ok(Math.abs(automaticLightPhase(t+50)-automaticLightPhase(t))<.00175);
 close(automaticLightPhase(180000-.1),automaticLightPhase(.1));
});
test('room clock continues across rounds/tracks/snapshots, pauses correctly and refresh restores no offline time',()=>{
 let real=100;const p=new PresentationClock(()=>real),s=storage(),key=sceneLightingRoomKey(room),clock=new RoomLightingClock(key,p,s);clock.setRunning(true);real+=45000;close(clock.now(),45000);
 assert.equal(sceneLightingRoomKey({...room,round:2,track:'boardwalks',version:22}),key);clock.setRunning(false);real+=60000;clock.setRunning(true);real+=15000;close(clock.now(),60000);
 p.setPaused(true);clock.setRunning(false);real+=50000;close(clock.now(),60000);p.setPaused(false);clock.setRunning(true);real+=10000;close(clock.now(),70000);
 clock.setRunning(false);let refreshedReal=500;const fresh=new RoomLightingClock(key,new PresentationClock(()=>refreshedReal),s);close(fresh.now(),70000);refreshedReal+=50000;close(fresh.now(),70000);fresh.setRunning(true);refreshedReal+=5000;close(fresh.now(),75000);
 for(const other of [{...room,backendId:'china' as RoomView['backendId']},{...room,createdAt:124},{...room,code:'OTHER'}])assert.notEqual(sceneLightingRoomKey(other),key);
});
test('online room phase, visibility and pause gates freeze display time; beat speed never enters its clock',()=>{
 for(const [r,online,visible] of [[{...room,closedAt:1000},true,true],[{...room,phase:'results'},true,true],[{...room,phase:'selection'},true,true],[room,false,true],[room,true,false],[{...room,pause:{at:100,playerId:'p',remainingMs:null}},true,true]] as const)assert.equal(sceneLightingRunning(r as RoomView,online,visible),false);
 assert.equal(sceneLightingRunning(room,true,true),true);
 let real=0;const p=new PresentationClock(()=>real),c=new RoomLightingClock('speed-independent',p);c.setRunning(true);for(const speed of [1,2,4]){void speed;real+=10000;}close(c.now(),30000);
 const hook=readFileSync('src/client/useSceneLightingClock.ts','utf8'),app=readFileSync('src/client/App.tsx','utf8');assert.match(app,/const lighting=useSceneLightingClock\(room,presentation.clock,online,/);assert.match(app,/<Race lightingClock=\{lighting.clock\} lightingRunning=\{lighting.running\}/);assert.match(hook,/\[key,presentationClock\]/);assert.match(hook,/Number.isFinite\(room.createdAt\)/);assert.match(hook,/pagehide/);assert.match(hook,/pageshow/);assert.doesNotMatch(hook,/animationSpeed|durationMs|room.round|room.track/);
});
test('invalid storage fails open as a day start; saved phase is bounded and storage is optional',()=>{
 const s=storage(),key='invalid',storageKey=`magical-athlete:room-lighting-v1:${key}`;
 for(const text of ['bad','{"version":2,"elapsed":90000}','{"version":1,"elapsed":-1}','{"version":1,"elapsed":"bad"}']){s.setItem(storageKey,text);const c=new RoomLightingClock(key,{now:()=>0},s);assert.equal(c.now(),0);}
 s.setItem(storageKey,JSON.stringify({version:1,elapsed:SCENE_LIGHT_CYCLE_MS+1234}));close(new RoomLightingClock(key,{now:()=>0},s).now(),1234);
 const c=new RoomLightingClock('denied',{now:()=>0},{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});c.setRunning(true);c.save();assert.equal(c.now(),0);
});
test('scoped demand scheduling is bounded, cancellable, and never a new animation RAF',()=>{
 for(const low of [false,true]){const jobs=new Map<number,()=>void>(),delays:number[]=[],cancelled:number[]=[];let id=0,frames=0;
 const stop=scheduleLightingFrames(()=>frames++,lightingFrameDelay(low),(fn,ms)=>{delays.push(ms);jobs.set(++id,fn);return id;},v=>{cancelled.push(v as number);jobs.delete(v as number);});
 for(let i=0;i<5;i++){const [key,fn]=jobs.entries().next().value!;jobs.delete(key);fn();}assert.equal(frames,5);assert.ok(delays.every(d=>d===(low?100:50)));const stale=[...jobs.values()][0]!;stop();stale();assert.equal(frames,5);assert.equal(jobs.size,0);assert.equal(cancelled.length,1);}
 const source=readFileSync('src/client/scene/environment/VenueLighting.tsx','utf8');assert.match(source,/mode!=='auto'\|\|!lightingRunning\|\|paused\|\|frameloop!=='demand'/);assert.doesNotMatch(source,/requestAnimationFrame|setInterval/);
});
test('actual sky source and main-light input share every continuous phase; missing fixtures never force a reset',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,100),sky=createSkyEnvironment({THREE,scene,camera,profile:'athlete',style:'physical',directions:SKY_SOURCE_DIRECTIONS.athlete,state:{mode:'day'},lowQuality:true});
 let previous:THREE.Vector3|undefined;const state=createVenueLightingState(0);
 for(let i=0;i<=3600;i++){const target=automaticLightPhase(i*50),p=stepVenueLighting(state,target,true,.05);sky.update({camera,state:p.sky});const lighting=sky.getLightingState();assert.ok(lighting.direction.toArray().every(Number.isFinite));close(lighting.direction.length(),1);if(previous)assert.ok(previous.angleTo(lighting.direction)<.01);previous=lighting.direction;}
 close(state.phase,0);const atNight=createVenueLightingState(2);let p=stepVenueLighting(atNight,2,false,0);close(p.keyPower,2);assert.equal(p.nightFactor,0);assert.deepEqual(p.sky,{from:'dusk',to:'night',mix:1});for(let i=0;i<20;i++)p=stepVenueLighting(atNight,2,true,.05);close(p.nightFactor,1);close(p.keyPower,.65);sky.dispose();
 const source=readFileSync('src/client/scene/environment/VenueLighting.tsx','utf8'),board=readFileSync('src/client/scene/Board3D.tsx','utf8');assert.match(source,/sky.current\?\.update\(\{camera,state:preset.sky\}\)/);assert.match(source,/getLightingState\(\).direction/);assert.match(source,/key.current.position.copy\(direction\)/);assert.match(source,/key.current.shadow.intensity=preset.shadow/);assert.match(source,/fixturesEnabled&&<VenueFixtures/);assert.match(board,/<VenueLighting[^>]*fixturesEnabled=\{environmentReady\}/);assert.doesNotMatch(board,/<StudioLightingV7/);
});
test('manual and auto changes converge smoothly while preserving the independently running room cycle',()=>{
 const state=createVenueLightingState(0);let previous=0;for(let i=0;i<30;i++){stepVenueLighting(state,2,true,.05);assert.ok(state.phase-previous<=.0900001);previous=state.phase;}close(state.phase,2);
 const target=automaticLightPhase(45000);stepVenueLighting(state,target,true,.05);assert.ok(state.phase>target);for(let i=0;i<30;i++)stepVenueLighting(state,target,true,.05);close(state.phase,target);const snapshot=structuredClone(state);stepVenueLighting(state,0,true,1,true);assert.deepEqual(state,snapshot);
});

test('automatic fixtures stay fully absent in daylight and fade continuously at dusk and dawn',()=>{
 const light=new THREE.SpotLight('white',0);light.castShadow=true;const scene=new THREE.Scene();scene.add(light);
 for(const p of [0,.1,.5,.79,VENUE_LIGHT_ONSET_PHASE]){const factor=venueFixtureNightFactor(p);assert.equal(factor,0);applyVenueSpotState(light,70,factor);assert.equal(light.intensity,0);assert.equal(light.visible,false);const shadowLights:THREE.Object3D[]=[];scene.traverseVisible(o=>{if(o===light&&light.castShadow)shadowLights.push(o);});assert.equal(shadowLights.length,0);}
 close(venueFixtureNightFactor(1),.12);close(venueFixtureNightFactor(2),1);
 for(const boundary of [VENUE_LIGHT_ONSET_PHASE,1,2])assert.ok(Math.abs(venueFixtureNightFactor(boundary+1e-6)-venueFixtureNightFactor(boundary-1e-6))<1e-8);
 let previous=0;let off=0;const state=createVenueLightingState(0);for(let ms=0;ms<=SCENE_LIGHT_CYCLE_MS;ms+=50){const phase=automaticLightPhase(ms),p=stepVenueLighting(state,phase,true,.05);applyVenueSpotState(light,70,p.nightFactor);assert.ok(Math.abs(p.nightFactor-previous)<.003);previous=p.nightFactor;close(venueFixtureNightFactor(phase),venueFixtureNightFactor(automaticLightPhase(SCENE_LIGHT_CYCLE_MS-ms)));if(ms<=39000||ms>=141000){assert.equal(p.nightFactor,0);assert.equal(light.visible,false);off++;}if(ms===45000||ms===135000)close(p.nightFactor,.12);if(ms===90000)close(p.nightFactor,1);}
 assert.ok(off>1500);assert.equal(previous,0);light.dispose();
});
