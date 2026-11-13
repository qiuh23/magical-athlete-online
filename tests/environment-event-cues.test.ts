import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { Matrix4 } from 'three';
import type { GameEvent, Racer, RoomView } from '../src/shared/types.js';
import type { TrackId } from '../src/shared/tracks.js';
import { createPlayback, receiveRoom, completeBeat } from '../src/client/presentation.js';
import { mechanismAnchors } from '../src/client/scene/mechanisms/events.js';
import { MechanismPlayback } from '../src/client/scene/mechanisms/playback.js';
import { boardPoint } from '../src/client/scene/math.js';
import { buildEnvironmentEventCueGeometry, environmentEventCues } from '../src/client/scene/environment/event-cues.js';
const racer=(id:string,position:number,tripped=false):Racer=>({id,playerId:id,characterId:'banana',position,tripped,finished:false,eliminated:false,flags:{}});
function queue(track:TrackId,racers:Racer[],events:GameEvent[]) {
  const before:RoomView={code:'CHECK',track,racers,logs:[],version:1,round:1,phase:'race',players:[],hostId:'a',selfId:'a',maxPlayers:8,timeoutSeconds:0,deadline:null,results:[],rulesStatus:'fixture'};
  return receiveRoom(createPlayback(before),{...before,logs:events,version:2});
}
test('cue-only trip and arrow show exactly real recipients and legal route, including compact mode',()=>{
  const racers=[racer('a',5),racer('down',5,true),racer('bystander',5)];
  const state=queue('wild',racers,[{id:1,type:'trip',source:'track',targets:['a','down'],text:'绊倒'}]);
  const cues=environmentEventCues('wild',state.queue[0],racers,false,false);assert.deepEqual(cues.map(c=>c.targetId),['a']);assert.equal(cues[0]!.action.anchor.kind,'trip');
  assert.deepEqual(environmentEventCues('wild',undefined,racers,false,false),[]);
  const moving=[racer('a',24,true),racer('other',22)], move=queue('wild',moving,[{id:1,type:'move',cause:'track-arrow',source:'a',targets:['a'],before:[24],after:[22],paths:[[24,23,22]],text:'后退'}]);
  for(const compact of [false,true]){const [cue]=environmentEventCues('wild',move.queue[0],moving,compact,false);assert.equal(cue!.targetId,'a');assert.deepEqual(cue!.points.map(p=>[p.x,p.z]),[24,23,22].map(n=>{const p=boardPoint(n,compact,'wild');return[p[0],p[2]];}));assert.equal(moving[0]!.tripped,true);}
  const forwardRacers=[racer('a',7)],forward=queue('wild',forwardRacers,[{id:1,type:'move',cause:'track-arrow',source:'a',targets:['a'],before:[7],after:[10],paths:[[7,8,9,10]],text:'前进'}]);
  for(const compact of [false,true]){const [cue]=environmentEventCues('wild',forward.queue[0],forwardRacers,compact,false);assert.equal(cue!.action.anchor.direction,1);assert.deepEqual(cue!.points.map(p=>[p.x,p.z]),[7,8,9,10].map(n=>{const p=boardPoint(n,compact,'wild');return[p[0],p[2]];}));}

});
test('warp cue connects only actual source/destination once, not destination occupants',()=>{
  const racers=[racer('a',3),racer('other',5)],state=queue('whirly-world',racers,[{id:1,type:'warp',cause:'track-whirl',source:'a',targets:['a'],before:[3],after:[5],text:'传送'}]);
  const cues=environmentEventCues('whirly-world',state.queue[0],racers,false,false);assert.equal(cues.length,1);assert.equal(cues[0]!.targetId,'a');assert.deepEqual(cues[0]!.points.map(p=>[p.x,p.z]),[3,5].map(n=>{const p=boardPoint(n,false,'whirly-world');return[p[0],p[2]];}));
});
test('gain/loss cues preserve actual signed and zero-clamped delta with global particle caps',()=>{
  for(const kind of ['gain','loss'] as const)for(const delta of [0,kind==='gain'?2:-2,kind==='gain'?500:-500])for(const low of [false,true]){
    const node=mechanismAnchors('squiggle').find(a=>a.kind===kind)!.node,racers=[racer('a',node)],state=queue('squiggle',racers,[{id:1,type:'score',source:'a',cause:'track-star',boardPosition:node,scoreDelta:delta,text:`用户 ${delta}分（赛道星格）`}]);
    const cues=environmentEventCues('squiggle',state.queue[0],racers,false,low);assert.equal(cues[0]!.action.scoreDelta,delta);assert.equal(cues[0]!.count,delta===0?0:Math.min(low?8:16,Math.abs(delta)*3));
    const kit=buildEnvironmentEventCueGeometry(cues);assert.equal(kit.labels[0]!.delta,delta);kit.sample(.2,false);assert.ok(kit.particles.count<=(low?16:32));if(delta===0)assert.equal(kit.particles.count,0);else {const m=new Matrix4();kit.particles.getMatrixAt(0,m);const from=delta>0?cues[0]!.points[0]!:cues[0]!.points.at(-1)!;assert.ok(Math.abs(m.elements[12]!-from.x)<.16);}
    kit.dispose();
  }
  const node=mechanismAnchors('squiggle').find(a=>a.kind==='gain')!.node,racers=Array.from({length:8},(_,i)=>racer(`r${i}`,node)),state=queue('squiggle',racers,racers.map((r,i)=>({id:i+1,type:'score',source:r.id,cause:'track-star',boardPosition:node,scoreDelta:50,text:'用户 +50分（赛道星格）'})));
  for(const low of [false,true]){const aggregate={...state.queue[0]!,events:state.queue.flatMap(beat=>beat.events)};const cues=environmentEventCues('squiggle',aggregate,racers,false,low);assert.equal(cues.length,8);assert.equal(cues.reduce((sum,c)=>sum+c.count,0),low?16:32);}
});
test('cue clock pauses, skip/reduced motion remove particles, duplicate events do not replay, resources dispose once',()=>{
  const node=mechanismAnchors('squiggle').find(a=>a.kind==='gain')!.node,racers=[racer('a',node)],event:GameEvent={id:1,type:'score',source:'a',cause:'track-star',boardPosition:node,scoreDelta:2,text:'用户 +2分（赛道星格）'},state=queue('squiggle',racers,[event,event]);
  const cues=environmentEventCues('squiggle',state.queue[0],racers,false,false);assert.equal(cues.length,1);
  const clock=new MechanismPlayback(),kit=buildEnvironmentEventCueGeometry(cues);kit.sample(clock.sample('a',400,0,1000,false,false),false);const before=Array.from(kit.particles.instanceMatrix.array);kit.sample(clock.sample('a',400,0,1000,true,false),false);kit.sample(clock.sample('a',900,0,1000,true,false),false);assert.deepEqual(Array.from(kit.particles.instanceMatrix.array),before);
  kit.sample(1,true);assert.equal(kit.particles.count,0);assert.ok(kit.lines.every(l=>l.visible));assert.ok(kit.labels.every(l=>l.mesh.visible));kit.sample(1,false);assert.equal(kit.particles.count,0);assert.ok(kit.lines.every(l=>!l.visible));
  let disposed=0;kit.lines[0]!.geometry.addEventListener('dispose',()=>disposed++);kit.dispose();kit.dispose();assert.equal(disposed,1);
  const fresh=buildEnvironmentEventCueGeometry(cues);assert.notEqual(fresh.root,kit.root);fresh.dispose();
  const completed=completeBeat(state);assert.equal(environmentEventCues('squiggle',completed.queue[0],completed.racers,false,false).length,0);
  const component=readFileSync('src/client/scene/environment/EnvironmentEventCues.tsx','utf8'),pure=readFileSync('src/client/scene/environment/event-cues.ts','utf8'),board=readFileSync('src/client/scene/Board3D.tsx','utf8');
  assert.doesNotMatch(component+pure,/useGLTF|requestAnimationFrame|setInterval|\.enter\(|\.restore\(/);assert.match(component,/textures\.forEach\(texture=>texture\.dispose\(\)\)/);assert.match(board,/mechanismCandidate&&environmentCandidate&&<EnvironmentEventCues/);
});
