import test from'node:test';import assert from'node:assert/strict';import type{Racer}from'../src/shared/types.js';import type{PresentationBeat}from'../src/client/presentation.js';import{warpResidentLayout}from'../src/client/scene/mechanisms/warp-layout.js';import{warpOpacity}from'../src/client/scene/mechanisms/pawn-opacity.js';
const r=(id:string,position:number,tripped=false):Racer=>({id,playerId:id,characterId:'banana',position,tripped,finished:false,eliminated:false,flags:{}});
const beat={kind:'warp',cause:'track-whirl',motions:[{racerId:'target',from:3,to:5,path:[3,5]}]}as PresentationBeat;
test('warp resident candidate reflows only source/destination non-targets during fully hidden interval',()=>{
 for(const compact of[false,true])for(const down of[false,true])for(const first of[false,true]){const old=r('old',5,down),target=r('target',3),racers=first?[old,target]:[target,old],snapshot=JSON.stringify(racers);const before=warpResidentLayout('whirly-world',compact,beat,old,racers,.4)!,after=warpResidentLayout('whirly-world',compact,beat,old,racers,.6)!;assert.deepEqual(before,{x:0,z:0,scale:1.65});assert.ok(Math.abs(after.scale-1.14)<1e-12);assert.ok(Math.abs(Math.abs(after.x)-.45)<1e-12);for(const t of[.41,.5,.59])assert.equal(warpOpacity(t),0);assert.equal(JSON.stringify(racers),snapshot);assert.equal(warpResidentLayout('whirly-world',compact,beat,target,racers,.5),undefined);assert.equal(warpResidentLayout('whirly-world',compact,beat,r('other',12),racers,.5),undefined);}
});

test('unverified crowded reflow never reveals target at stale resident slots and completion clears the mode',async()=>{
 const{warpTransitionMode,warpTransitionOpacity,warpNeedsOpacity}=await import('../src/client/scene/mechanisms/warp-layout.js');
 const two=[r('target',3),r('old',5,true)];assert.equal(warpTransitionMode(beat,two),'single-resident-reflow');
 const many=[r('target',3),...Array.from({length:4},(_,i)=>r(`old${i}`,5,i%2===0))],snapshot=JSON.stringify(many);assert.equal(warpTransitionMode(beat,many),'hidden-until-snapshot');
 for(const t of[.4,.5,.6,.9,1])assert.equal(warpTransitionOpacity('hidden-until-snapshot',t),0);
 assert.equal(warpNeedsOpacity('hidden-until-snapshot',true),true);assert.equal(warpNeedsOpacity('single-resident-reflow',true),false);assert.equal(warpTransitionMode(undefined,many),'ordinary');assert.equal(JSON.stringify(many),snapshot);
 assert.equal(warpTransitionMode(beat,[r('target',3)]),'fade');assert.equal(warpTransitionOpacity('single-resident-reflow',1),1);
 for(const lowQuality of[false,true]){void lowQuality;assert.equal(warpTransitionMode(beat,two),'single-resident-reflow');}
});
