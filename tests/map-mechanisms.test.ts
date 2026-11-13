import assert from 'node:assert/strict';
import test from 'node:test';
import { TRACKS, type TrackId } from '../src/shared/tracks.js';
import type { Racer, RoomView, GameEvent } from '../src/shared/types.js';
import { createPlayback, receiveRoom, completeBeat } from '../src/client/presentation.js';
import { groupMechanismActions, mechanismActionSignature, eventScoreDelta, mechanismActions, mechanismAnchors, pawnFallPhase, isTrackPath } from '../src/client/scene/mechanisms/events.js';
import { mechanismLayout } from '../src/client/scene/mechanisms/layout.js';
import { trackConnections, trackNodeIds } from '../src/client/scene/math.js';
import { validatePublicEventBatch } from '../src/shared/public-events.js';
const racer=(id:string,position:number,tripped=false):Racer=>({id,playerId:id,characterId:'banana',position,tripped,finished:false,eliminated:false,flags:{}});
const room=(track:TrackId,racers:Racer[],logs:GameEvent[]=[],version=1):RoomView=>({code:'CHECK',track,racers,logs,version,round:1,phase:'race',players:[],hostId:'a',selfId:'a',maxPlayers:8,timeoutSeconds:0,deadline:null,results:[],rulesStatus:'fixture'});
function queue(track:TrackId,racers:Racer[],events:GameEvent[]) {const before=room(track,racers);return receiveRoom(createPlayback(before),{...before,logs:events,version:2});}

test('all seven maps use actual nodes, specials, edge identities and six warp pairs',()=>{
 const counts:Record<TrackId,number>={mild:0,wild:10,squiggle:13,boardwalks:19,bridges:0,'twisty-twirl':0,'whirly-world':12};
 for(const track of Object.keys(TRACKS) as TrackId[]){const anchors=mechanismAnchors(track);assert.equal(anchors.length,counts[track]);assert.deepEqual(anchors.map(a=>a.node).sort((a,b)=>a-b),Object.keys(TRACKS[track].specials).map(Number).sort((a,b)=>a-b));assert.ok(anchors.every(a=>trackNodeIds(track).includes(a.node)));}
 assert.equal(trackNodeIds('boardwalks').length,59);assert.equal(trackConnections('boardwalks').length,61);
 assert.deepEqual(mechanismAnchors('whirly-world').filter(a=>a.node<a.destination!).map(a=>[a.node,a.destination]),[[3,5],[7,12],[10,15],[18,22],[20,23],[24,27]]);
 assert.deepEqual(TRACKS['twisty-twirl'].twistBoundary,{before:13,after:14});assert.equal(TRACKS.bridges.bridges?.length,4);
});
test('only real track targets animate, new event IDs do not replay an already-down state',()=>{
 const racers=[racer('a',5),racer('b',5,true),racer('unrelated',5)];
 let state=queue('wild',racers,[{id:1,type:'trip',source:'track',targets:['a','b'],text:'绊倒'},{id:2,type:'trip',source:'track',targets:['a'],text:'又一次绊倒'}]);
 assert.deepEqual(mechanismActions('wild',state.queue[0],state.racers).map(a=>a.targets),[['a']]);
 assert.equal(pawnFallPhase(state.queue[0],racers[1]!), 'down');assert.equal(pawnFallPhase(state.queue[0],racers[2]!),undefined);
 state=completeBeat(state);assert.deepEqual(mechanismActions('wild',state.queue[0],state.racers),[]);assert.equal(pawnFallPhase(state.queue[0],state.racers[0]!), 'down');
 const ability=queue('wild',racers,[{id:1,type:'trip',source:'hose',targets:['a'],text:'绊倒'}]);assert.deepEqual(mechanismActions('wild',ability.queue[0],racers),[]);
 const standing=racer('standing',5);assert.equal(pawnFallPhase({...state.queue[0]!,kind:'recover',targets:['standing']},standing),undefined);
});
test('arrow retains real branch path and down state; no added trip, no cross-board shortcut',()=>{
 const path=[8,31,32];assert.ok(isTrackPath('boardwalks',path));assert.ok(!isTrackPath('boardwalks',[8,32]));assert.ok(!isTrackPath('boardwalks',[30,31]));
 const racers=[racer('a',24,true),racer('old',22)];const state=queue('wild',racers,[{id:1,type:'move',cause:'track-arrow',source:'a',targets:['a'],before:[24],after:[22],paths:[[24,23,22]],text:'后退'}]);
 const actions=mechanismActions('wild',state.queue[0],racers);assert.deepEqual(actions[0]?.motions[0]?.path,[24,23,22]);assert.equal(actions[0]?.anchor.direction,-1);assert.equal(pawnFallPhase(state.queue[0],racers[0]!), 'down');assert.equal(completeBeat(state).racers[0]?.tripped,true);assert.equal(state.queue.length,1);
});
test('warp uses actual result and only the transported racer, not old destination occupants',()=>{
 const racers=[racer('a',3),racer('old',5)];const state=queue('whirly-world',racers,[{id:1,type:'warp',cause:'track-whirl',targets:['a'],source:'a',before:[3],after:[5],text:'传送'}]);
 assert.deepEqual(mechanismActions('whirly-world',state.queue[0],racers).map(a=>[a.anchor.node,a.role,a.targets]),[[3,'source',['a']],[5,'destination',['a']]]);
 assert.equal(completeBeat(state).racers[1]?.position,5);
});
test('actual score delta survives transport; old logs and zero-clamped debit are preserved',()=>{
 for(const [text,delta] of [['用户 -2分（赛道星格）',-2],['用户 +0分（赛道星格）',0],['用户 ＋1分（赛道星格）',1]] as const)assert.equal(eventScoreDelta({id:1,type:'score',text}),delta);
 const events:GameEvent[]=[{id:1,type:'score',source:'a',cause:'track-star',scoreDelta:-2,boardPosition:23,text:'用户 -2分（赛道星格）'}];
 assert.ok(validatePublicEventBatch(JSON.parse(JSON.stringify({afterId:0,latestId:1,events}))));
 const racers=[racer('a',23)];const state=queue('squiggle',racers,events);assert.equal(mechanismActions('squiggle',state.queue[0],racers)[0]?.scoreDelta,-2);assert.equal(mechanismActions('squiggle',state.queue[0],racers)[0]?.anchor.kind,'loss');
 const zero={...events[0]!,scoreDelta:0,text:'用户 +0分（赛道星格）'};const z=queue('squiggle',racers,[zero]);assert.equal(mechanismActions('squiggle',z.queue[0],racers)[0]?.scoreDelta,0);
});
test('reconnect and duplicate snapshots never replay mechanisms',()=>{
 const racers=[racer('a',5)],events:GameEvent[]=[{id:1,type:'trip',source:'track',targets:['a'],text:'绊倒'}];let state=queue('wild',racers,events);const next=room('wild',[racer('a',5,true)],events,3);
 state=receiveRoom(state,next);assert.equal(state.queue.length,1);state=completeBeat(state);assert.equal(receiveRoom(state,next).queue.length,0);assert.equal(receiveRoom(state,next,{reconnect:true}).queue.length,0);
});
test('candidate layout is uniform, data-driven and leaves no-special boards unchanged',()=>{
 for(const track of ['mild','bridges','twisty-twirl'] as const)assert.deepEqual(mechanismLayout(track),{scale:1,lift:0});
 for(const track of ['wild','squiggle','boardwalks','whirly-world'] as const){const l=mechanismLayout(track);assert.equal(l.lift,1.43);assert.ok(l.scale>=1);}
});

test('explicit pause freezes demand frames even with a non-freezing supplied clock',async()=>{
 const {MechanismPlayback}=await import('../src/client/scene/mechanisms/playback.js');const p=new MechanismPlayback();
 assert.equal(p.sample('a',200,0,1000,false,false),.2);assert.equal(p.sample('a',200,0,1000,true,false),.2);
 assert.equal(p.sample('a',900,0,1000,true,false),.2);assert.equal(p.sample('a',1000,0,1000,false,false),.2);assert.equal(p.sample('a',1100,0,1000,false,false),.3);
 const q=new MechanismPlayback();q.sample('a',200,0,1000,false,false);q.sample('a',200,0,1000,true,false);assert.equal(q.sample('a',200,0,1000,false,false),.2);assert.equal(q.sample('b',200,200,1000,false,true),1);
});

test('real engine arrivals preserve exact trip recipients, owner-clamped scores and track causes',async()=>{
 const {createGame,enqueueMove,resolveTasks}=await import('../src/engine/index.js');
 const players=Array.from({length:4},(_,seat)=>({id:`p${seat}`,name:`玩家${seat}`,seat,color:'#234',ready:true,connected:true,score:2,hand:[],used:[],selection:[]}));
 const game=createGame(players,456);game.phase='race';game.round=1;game.track='wild';game.currentRacerId='r0';game.queue=[];game.logs=[];
 game.racers=['alchemist','coach','lackey','dicemonger'].map((characterId,i)=>({...racer(`r${i}`,i<2?4:5,i===2),playerId:`p${i}`,characterId}));
 const project=(version:number):RoomView=>({...room(game.track,structuredClone(game.racers),structuredClone(game.logs),version),players:game.players.map(p=>({...p,handCount:p.hand.length,selected:false}))});
 let playback=createPlayback(project(1));enqueueMove(game,'r0',1,'main');resolveTasks(game);enqueueMove(game,'r1',1,'main');resolveTasks(game);playback=receiveRoom(playback,project(2));
 const actions=[];while(playback.queue.length){actions.push(...mechanismActions('wild',playback.queue[0],playback.racers));playback=completeBeat(playback);}
 assert.deepEqual(actions.filter(a=>a.anchor.kind==='trip').map(a=>a.targets),[['r0'],['r1']]);assert.equal(game.racers[2]!.tripped,true);assert.equal(game.racers[3]!.tripped,false);
 game.track='squiggle';game.queue=[];game.logs=[];game.pending=undefined;game.racers[0]!.position=22;game.racers[0]!.tripped=false;
 game.players[0]!.score=2;enqueueMove(game,'r0',1,'main');resolveTasks(game);
 const score=game.logs.find(e=>e.type==='score'&&e.cause==='track-star')!;assert.equal(game.players[0]!.score,0);assert.equal(score.scoreDelta,-2);assert.equal(score.boardPosition,23);assert.equal(eventScoreDelta(score),-2);
 const zeroGame=createGame(players,1);zeroGame.phase='race';zeroGame.round=1;zeroGame.track='squiggle';zeroGame.queue=[];zeroGame.logs=[];zeroGame.racers=[{...racer('r0',22),playerId:'p0',characterId:'coach'}];zeroGame.players[0]!.score=0;
 enqueueMove(zeroGame,'r0',1,'main');resolveTasks(zeroGame);assert.equal(zeroGame.logs.find(e=>e.type==='score')?.scoreDelta,0);
});

test('candidate shares camera, minimap and compact rigid transform at phone portrait and landscape sizes',async()=>{
 const {boardPoint,trackSvgLayout}=await import('../src/client/scene/math.js');const {cameraFrame,cameraProject}=await import('../src/client/scene/camera.js');const {mechanismPlacements}=await import('../src/client/scene/mechanisms/placements.js');
 const original=(globalThis as any).window;(globalThis as any).window={location:{search:'?mechanisms=1'}};
 try{for(const track of ['wild','squiggle','boardwalks','whirly-world'] as const){
   const map=trackSvgLayout(track,220,104,24);for(const id of map.nodes){const p=map.point(id);assert.ok(p.x>=23.99&&p.x<=196.01&&p.y>=23.99&&p.y<=80.01);}
   const a=mechanismPlacements(track),b=mechanismPlacements(track,true);a.forEach((p,i)=>{assert.deepEqual(b[i]!.position,[-p.position[2],p.position[1],p.position[0]]);assert.equal(b[i]!.yaw,p.yaw-Math.PI/2);});
   for(const [width,height,compact]of [[390,844,true],[844,390,false],[1280,900,false]]as const){const frame=cameraFrame([],compact,width,height,true,undefined,false,track);for(const id of trackNodeIds(track)){const p=boardPoint(id,compact,track);for(const y of [p[1],p[1]+2.65]){const v=cameraProject([p[0]-frame.x,y-frame.y,p[2]-frame.z],compact);assert.ok(Math.abs(v.x*frame.zoom)<width/2,`${track}:${id} width ${width}`);assert.ok(Math.abs(v.y*frame.zoom)<height/2,`${track}:${id} height ${height}`);}}}
 }}finally{if(original===undefined)delete (globalThis as any).window;else (globalThis as any).window=original;}
});


test('multiple score owners share one hardware anchor and updated data changes signature',()=>{
 const racers=[racer('a',23),racer('b',23)],events:GameEvent[]=[{id:1,type:'score',source:'a',cause:'track-star',boardPosition:23,scoreDelta:-2,text:'A -2分（赛道星格）'},{id:2,type:'score',source:'b',cause:'track-star',boardPosition:23,scoreDelta:0,text:'B +0分（赛道星格）'}];
 const beat={...queue('squiggle',racers,events).queue[0]!,events,targets:['a','b']};
 const actions=mechanismActions('squiggle',beat,racers),groups=groupMechanismActions(actions);assert.equal(actions.length,2);assert.equal(groups.length,1);assert.deepEqual(groups[0]!.actions.map(a=>a.scoreDelta),[-2,0]);
 assert.notEqual(mechanismActionSignature(actions),mechanismActionSignature(actions.map(a=>({...a,scoreDelta:3,targets:['b']}))));
});

test('Wild24 punch requires observed empty preparation, then normalized true path and retract-before-turn',async()=>{
 const {PunchController,punchProfile,punchPose}=await import('../src/client/scene/mechanisms/punch-profile.js');
 const previous=globalThis.window;Object.assign(globalThis,{window:{location:{search:'?mechanisms=1'}}});
 try {
 const entry=queue('wild',[racer('a',23)],[{id:1,type:'move',source:'a',targets:['a'],before:[23],after:[24],paths:[[23,24]],text:'move'}]).queue[0]!;
 const fire=queue('wild',[racer('a',24)],[{id:1,type:'move',source:'a',targets:['a'],before:[24],after:[22],paths:[[24,23,22]],cause:'track-arrow',text:'move'}]).queue[0]!;entry.key='entry';fire.key='fire';entry.chainId=fire.chainId='same-turn';
 const controller=new PunchController();assert.equal(controller.enter('wild',fire,[racer('a',24)],0,0,1000,true),undefined);
 assert.equal(controller.enter('wild',entry,[racer('a',23)],1000,1000,1000,true)?.kind,'prepare');controller.sample(.1);assert.equal(controller.route(.1,'a'),0);controller.sample(.3);assert.equal(controller.pose.boom,Math.PI/2);assert.ok(controller.route(.3,'a')!>0);
 assert.equal(controller.enter('wild',fire,[racer('a',24)],2000,2000,1000,true)?.kind,'fire');controller.sample(12/93);assert.equal(controller.pose.slider,.7);controller.sample(26/93);assert.equal(controller.pose.slider,.35);assert.equal(controller.pose.boom,Math.PI/2);controller.sample(1);assert.equal(controller.pose.boom,0);assert.equal(controller.route(1,'a'),1);
 for(let i=0;i<=100;i++){const pose=punchPose(i/100);if(pose.boom<Math.PI/2)assert.equal(pose.spring,0);}
 assert.equal(punchProfile('wild',fire,[racer('a',24,true)]),undefined);assert.equal(punchProfile('wild',fire,[racer('a',24),racer('b',23)]),undefined);assert.equal(punchProfile('wild',fire,[{...racer('a',24),characterId:'rocket'}]),undefined);
 const late=new PunchController();assert.equal(late.enter('wild',entry,[racer('a',23)],1200,1000,1000,true),undefined);
 const interrupted=new PunchController();interrupted.enter('wild',entry,[racer('a',23)],0,0,1000,true);interrupted.sample(.1);const yaw=interrupted.pose.boom;interrupted.enter('wild',undefined,[racer('a',23)],200,200,1000,true);assert.equal(interrupted.pose.boom,yaw);assert.equal(interrupted.pose.spring,0);assert.equal(interrupted.enter('wild',fire,[racer('a',24)],300,300,1000,true),undefined);
 const unobserved=new PunchController();unobserved.enter('wild',entry,[racer('a',23)],0,0,1000,true);assert.equal(unobserved.enter('wild',fire,[racer('a',24)],1000,1000,1000,true),undefined);
 const changed=new PunchController();changed.enter('wild',entry,[racer('a',23)],0,0,1000,true);changed.sample(.3);changed.enter('wild',entry,[racer('a',23),racer('b',24)],400,0,1000,true);assert.equal(changed.plan,undefined);
 }finally{Object.assign(globalThis,{window:previous});}
});

test('Trip native profile is limited to noncompact left-new/right-down arrivals and safe state edges',async()=>{
 const {TripController,tripEntryProfile,tripPose,residentReflow}=await import('../src/client/scene/mechanisms/trip-profile.js');
 const previous=globalThis.window;Object.assign(globalThis,{window:{location:{search:'?mechanisms=1'}}});
 try {
 const initial=[racer('a',4),racer('b',5,true)],atTile=[racer('a',5),racer('b',5,true)];
 const entry=queue('wild',initial,[{id:1,type:'move',targets:['a'],source:'a',before:[4],after:[5],paths:[[4,5]],text:'move'}]).queue[0]!;entry.key='entry';entry.chainId='turn';
 const reaction=queue('wild',atTile,[{id:1,type:'trip',source:'track',targets:['a'],text:'trip'}]).queue[0]!;reaction.key='trip';reaction.chainId='turn';
 assert.deepEqual(tripEntryProfile('wild',false,entry,initial),{newId:'a',oldId:'b'});assert.equal(tripEntryProfile('wild',true,entry,initial),undefined);assert.equal(tripEntryProfile('wild',false,entry,[...initial,racer('c',4)]),undefined);assert.equal(tripEntryProfile('wild',false,entry,[...initial].reverse()),undefined);
 const c=new TripController();assert.equal(c.enter('wild',false,entry,initial,0,0,800,true)?.kind,'entry');c.sample(.35,false);assert.ok(c.protects('b'));assert.deepEqual(residentReflow(.35),{x:.45,scale:1.14});assert.equal(c.enter('wild',false,reaction,atTile,800,800,850,true)?.kind,'trip');c.sample(.16,false);assert.equal(c.pose.reach,.4365);c.sample(.30,false);assert.equal(c.pose.reach,0);assert.equal(c.pose.angle,1.044169055361146);c.sample(1,false);assert.equal(c.pose.angle,Math.PI/4);
 for(let i=1;i<=10000;i++){const a=tripPose((i-1)/10000,true),b=tripPose(i/10000,true);if(a.reach>0||b.reach>0)assert.ok(Math.abs(a.angle-b.angle)<1e-10);}
 const changed=new TripController();changed.enter('wild',false,entry,initial,0,0,800,true);changed.sample(.4,false);changed.enter('wild',true,entry,initial,400,0,800,true);assert.equal(changed.plan,undefined);assert.equal(changed.pose.reach,0);assert.equal(changed.enter('wild',true,reaction,atTile,800,800,850,true),undefined);
 const merged=new TripController();merged.enter('wild',false,entry,initial,0,0,800,true);merged.enter('wild',false,{...entry,motions:[...entry.motions,{racerId:'b',from:5,to:6,path:[5,6]}]},initial,100,0,800,true);assert.equal(merged.plan,undefined);
 const replay=new TripController();assert.equal(replay.enter('wild',false,reaction,atTile,0,0,850,true),undefined);
 }finally{Object.assign(globalThis,{window:previous});}
});

test('prepared history clears across a gap and explicit match identity changes; READY pose protection remains',async()=>{
 const {PunchController}=await import('../src/client/scene/mechanisms/punch-profile.js');const {mechanismScope}=await import('../src/client/scene/mechanisms/scope.js');
 const previous=globalThis.window;Object.assign(globalThis,{window:{location:{search:'?mechanisms=1'}}});
 try{
 const entry=queue('wild',[racer('a',23)],[{id:1,type:'move',targets:['a'],source:'a',before:[23],after:[24],paths:[[23,24]],text:'move'}]).queue[0]!;entry.key='entry';
 const fire=queue('wild',[racer('a',24)],[{id:1,type:'move',targets:['a'],source:'a',before:[24],after:[22],paths:[[24,23,22]],cause:'track-arrow',text:'move'}]).queue[0]!;fire.key='fire';
 const c=new PunchController();c.enter('wild',entry,[racer('a',23)],0,0,800,true);c.sample(1);c.enter('wild',undefined,[racer('a',24)],800,800,1,true);assert.ok(c.protects('a'));assert.equal(c.pose.boom,Math.PI/2);assert.equal(c.enter('wild',fire,[racer('a',24)],900,900,800,true),undefined);assert.ok(c.protects('a'));c.enter('wild',undefined,[racer('a',22)],1700,1700,1,true);assert.equal(c.protects('a'),false);
 const base=room('wild',[racer('a',24)]),scope=mechanismScope(base);for(const changed of [{createdAt:123},{contentRevision:2},{backendId:'cloudflare' as const},{round:2}])assert.notEqual(scope,mechanismScope({...base,...changed}));
 const unavailable=new PunchController();unavailable.enter('wild',entry,[racer('a',23)],0,0,800,false);assert.equal(unavailable.plan,undefined);unavailable.enter('wild',entry,[racer('a',23)],300,0,800,true);assert.equal(unavailable.plan,undefined);
 }finally{Object.assign(globalThis,{window:previous});}
});

test('full-size warp fades only its target with owned material copies and restores cached state',async()=>{
 const {PawnOpacity,warpOpacity}=await import('../src/client/scene/mechanisms/pawn-opacity.js');const {Group,Mesh,BoxGeometry,MeshStandardMaterial}=await import('three');
 const material=new MeshStandardMaterial({opacity:.8}),target=new Mesh(new BoxGeometry(),material),old=new Mesh(target.geometry,material),root=new Group();target.castShadow=true;target.renderOrder=3;root.add(target);
 const effect=new PawnOpacity();effect.apply(root,.25);assert.notEqual(target.material,material);assert.equal(old.material,material);assert.equal(material.opacity,.8);assert.equal((target.material as InstanceType<typeof MeshStandardMaterial>).opacity,.2);assert.equal(target.castShadow,false);effect.restore();assert.equal(target.material,material);assert.equal(target.castShadow,true);assert.equal(target.renderOrder,3);
 effect.apply(root,.2);const replacement=new MeshStandardMaterial({opacity:.6});target.material=replacement;effect.apply(root,.4);assert.notEqual(target.material,replacement);assert.equal((target.material as InstanceType<typeof MeshStandardMaterial>).opacity,.24);effect.restore();assert.equal(target.material,replacement);assert.equal(target.castShadow,true);assert.equal(target.renderOrder,3);effect.apply(root,.2);const finalMaterial=new MeshStandardMaterial();target.material=finalMaterial;effect.restore();assert.equal(target.material,finalMaterial);assert.equal(target.castShadow,true);assert.equal(target.renderOrder,3);
 assert.equal(warpOpacity(0),1);assert.equal(warpOpacity(.4),0);assert.equal(warpOpacity(.5),0);assert.equal(warpOpacity(.6),0);assert.equal(warpOpacity(1),1);
});

test('all score and warp anchors preserve actual recipients across 1/2/4/8-person cells',()=>{
 let cases=0;
 for(const track of Object.keys(TRACKS) as TrackId[])for(const anchor of mechanismAnchors(track).filter(a=>['gain','loss','warp'].includes(a.kind)))for(const count of[1,2,4,8]){
  const racers=Array.from({length:count},(_,i)=>({...racer(`r${i}`,anchor.node,i>0),characterId:['banana','coach','alchemist','werewolf'][i%4]!}));
  if(anchor.kind==='warp'){
   const destination=anchor.destination!,resident={...racer('old-destination',destination,true),characterId:'big-baby'},all=[...racers,resident];
   const event:GameEvent={id:1,type:'warp',source:'r0',targets:['r0'],cause:'track-whirl',before:[anchor.node],after:[destination],text:'warp'};
   const state=receiveRoom(createPlayback(room(track,all)),room(track,all.map(r=>r.id==='r0'?{...r,position:destination}:r),[event,event],2)),actions=mechanismActions(track,state.queue[0],all);
   assert.deepEqual(actions.map(a=>[a.anchor.node,a.targets]),[[anchor.node,['r0']],[destination,['r0']]]);
   const after=completeBeat(state);assert.equal(after.racers.find(r=>r.id==='old-destination')!.tripped,true);assert.equal(after.racers.find(r=>r.id==='old-destination')!.position,destination);assert.equal(after.racers.find(r=>r.id==='r0')!.position,destination);
  }else{
   for(const delta of anchor.kind==='loss'?[-2,0]:[1,2]){
    const event:GameEvent={id:1,type:'score',source:'r0',cause:'track-star',boardPosition:anchor.node,scoreDelta:delta,text:`score ${delta}`};
    const state=queue(track,racers,[event,event]),actions=mechanismActions(track,state.queue[0],racers);
    assert.equal(actions.length,1);assert.deepEqual(actions[0]!.targets,['r0']);assert.equal(actions[0]!.scoreDelta,delta);
    assert.deepEqual(racers.slice(1).map(r=>r.tripped),Array(count-1).fill(true));
   }
  }
  cases++;
 }
 assert.equal(cases,27*4);
});
