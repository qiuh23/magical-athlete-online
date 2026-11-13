import test from 'node:test';
import assert from 'node:assert/strict';
import { afterPresentationPaint } from '../src/client/presentation-completion.js';
import { beatDuration, completeBeat, createPlayback, receiveRoom, skipPlayback } from '../src/client/presentation.js';
import { displayTripFallProgress, pawnFallPose } from '../src/client/scene/pawn-fall.js';
import { mechanismActions, pawnFallPhase } from '../src/client/scene/mechanisms/events.js';
import { PresentationClock } from '../src/client/presentation-clock.js';
import type { GameEvent, Racer, RoomView } from '../src/shared/types.js';

const racer=(id:string,tripped=false):Racer=>({id,playerId:id,characterId:'banana',position:5,tripped,finished:false,eliminated:false,flags:{}});
const room=(version:number,logs:GameEvent[],racers:Racer[]):RoomView=>({code:'TIME',version,hostId:'a',selfId:'a',maxPlayers:8,timeoutSeconds:0,deadline:null,phase:'race',round:1,track:'wild',players:[],racers,currentRacerId:version===1?'a':'next',logs,results:[],rulesStatus:'test'});
function tripPlayback(count=1){
 const racers=Array.from({length:count},(_,i)=>racer(`r${i}`));
 racers.push(racer('already-down',true));
 const event:GameEvent={id:1,type:'trip',source:'track',text:'赛道绊倒',targets:racers.map(r=>r.id)};
 const final=room(2,[event],racers.map(r=>({...r,tripped:true})));
 return {state:receiveRoom(createPlayback(room(1,[],racers)),final),final};
}

test('one, two and eight targets wait for their measured sweep contact before falling, with earlier fallen pawns held down',()=>{
 for(const count of [1,2,8]){
  const {state,final}=tripPlayback(count),beat=state.queue[0]!;
  assert.equal(beat.kind,'trip');
  assert.equal(beatDuration(beat),2000);
  const actions=mechanismActions('wild',beat,state.racers);
  assert.equal(actions.length,1);assert.equal(actions[0]!.targets.length,count);
  for(const id of actions[0]!.targets){
   const r=state.racers.find(r=>r.id===id)!;
   assert.equal(pawnFallPhase(beat,r),'trip');
   for(const t of [0,.16,.4,.5])assert.equal(pawnFallPose(displayTripFallProgress(t,.5),'trip').tilt,0);
   assert(pawnFallPose(displayTripFallProgress(.72,.5),'trip').tilt<0);
   assert.equal(pawnFallPose(displayTripFallProgress(.92,.5),'trip').tilt,-Math.PI/2);
  }
  assert.equal(pawnFallPhase(beat,state.racers.at(-1)!),'down');
  assert.equal(completeBeat(state).queue.length,0);
  assert.deepEqual(completeBeat(state).racers,final.racers);
  assert.deepEqual(skipPlayback(state,final).racers,final.racers);
 }
});

test('speed preserves a readable mechanism cycle, reduced motion retains its immediate endpoint',()=>{
 const {state}=tripPlayback(2),beat=state.queue[0]!;
 for(const speed of [.5,1,2,4,8]){
  assert(beatDuration(beat,{speed})>=1000);
  assert.equal(pawnFallPose(displayTripFallProgress(0,.5),'trip',true).tilt,-Math.PI/2);
 }
 assert.equal(beatDuration(beat,{reducedMotion:true}),500);
});

function frames(){
 let serial=0;const callbacks=new Map<number,FrameRequestCallback>();
 return {request:(fn:FrameRequestCallback)=>{callbacks.set(++serial,fn);return serial;},cancel:(id:number)=>{callbacks.delete(id);},paint:()=>{const batch=[...callbacks.values()];callbacks.clear();batch.forEach(fn=>fn(0));}};
}
test('completion keeps the old beat through a terminal render and paint opportunity',()=>{
 const raf=frames();let completed=0;
 afterPresentationPaint(()=>completed++,raf.request,raf.cancel);
 assert.equal(completed,0);
 raf.paint();assert.equal(completed,0,'first frame can still render the terminal mechanism and pawn');
 raf.paint();assert.equal(completed,1,'only the following frame releases the next prompt');
 raf.paint();assert.equal(completed,1);
});
test('pause, skip, reconnect or replacing a beat cancels either pending frame',()=>{
 for(const framesBeforeCancel of [0,1]){
  const raf=frames();let completed=0;
  const cancel=afterPresentationPaint(()=>completed++,raf.request,raf.cancel);
  if(framesBeforeCancel)raf.paint();
  cancel();raf.paint();raf.paint();assert.equal(completed,0);
 }
});
test('paused presentation time preserves the mechanism and all target poses',()=>{
 let now=0;const clock=new PresentationClock(()=>now);
 now=800;clock.setPaused(true);const before=displayTripFallProgress(clock.now()/1600,.5);
 now=15000;assert.equal(displayTripFallProgress(clock.now()/1600,.5),before);
 clock.setPaused(false);now+=400;
 assert.equal(clock.now(),1200);assert(displayTripFallProgress(clock.now()/1600,.5)>before);
});
