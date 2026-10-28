import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, applyGameAction, resolveTasks, enqueueMove } from '../src/engine/index.js';
import { timeoutRoomAction } from '../src/engine/runtime.js';
import { createBrowserRoom, reduceRoomAction, projectRoom, setRoomDeadline, validateActionEnvelope } from '../src/shared/room-core.js';
import { immediateRoomAction } from '../src/shared/automation.js';
import { offerContinuation, applyContinuationAction } from '../src/shared/room-continuation.js';
import { PresentationClock } from '../src/client/presentation-clock.js';
import { createPlayback, receiveRoom, completeBeat, beatCompletionTime } from '../src/client/presentation.js';
import { Rooms } from '../src/server/rooms.js';
import { Store } from '../src/server/store.js';
import type { GameAction, Room } from '../src/shared/types.js';

function room(): Room {
  return createBrowserRoom({code:'ABC234',createdAt:1_000,authorityId:'p0',adminHostId:'p0',maxPlayers:3,timeoutSeconds:120,phase:'lobby',members:[0,1,2].map(seat=>({id:`p${seat}`,name:`玩家${seat}`,seat,connected:true}))},123,10_000);
}
const reduce = (state:Room, action:GameAction, now=20_000, playerId='p0', automatic=false) => reduceRoomAction(state,playerId,action,{now,rematchSeed:0,automatic});
const view = (state:Room, id='p0') => projectRoom(state,id,{authorityId:state.hostId,authorityOnline:true});
const persisted = <T>(value:T):T => JSON.parse(JSON.stringify(value));
function race(ids=['magician','suckerfish','banana'], positions=[2,12,20]): Room {
  const state=room(),game=createGame(state.game.players,123,'multiplayer','mixed');
  game.phase='race';game.round=1;game.currentRacerId='r0';game.players.forEach(p=>p.score=2);
  game.racers=ids.map((characterId,i)=>({id:`r${i}`,playerId:`p${i}`,characterId,position:positions[i]!,tripped:false,finished:false,eliminated:false,flags:{}}));
  game.baseTurnOrder=game.racers.map(r=>r.id);state.game=game;return state;
}
function begin(state:Room){state.game.queue.push({kind:'beginTurn',racerId:'r0'});resolveTasks(state.game);}

test('pause protocol is explicit, rejects extra fields, and preserves old actions',()=>{
  for(const type of ['pause','resume'] as const){assert.deepEqual(validateActionEnvelope({actionId:'request',expectedVersion:1,action:{type}}).action,{type});assert.throws(()=>validateActionEnvelope({actionId:'request',expectedVersion:1,action:{type,paused:true}}),/字段/);}
  assert.deepEqual(validateActionEnvelope({actionId:'old',expectedVersion:1,action:{type:'roll'}}).action,{type:'roll'});
});

test('only the host can pause/resume; lobby and rule-fault holds cannot be resumed as manual pauses',()=>{
  const state=room();assert.throws(()=>reduce(state,{type:'pause'}),/选卡或对局/);
  state.game.phase='draft';assert.throws(()=>reduce(state,{type:'pause'},20_000,'p1'),/只有房主/);
  state.spectators=[{id:'watch',name:'观众',connected:true}];assert.throws(()=>reduce(state,{type:'pause'},20_000,'watch'),/参赛席位/);
  const paused=reduce(state,{type:'pause'});assert.throws(()=>reduce(paused,{type:'resume'},20_000,'p1'),/只有房主/);
  assert.throws(()=>reduce(paused,{type:'pause'}),/已经暂停/);assert.throws(()=>reduce(state,{type:'resume'}),/没有暂停/);
  state.game.phase='paused';state.game.flags.ruleHold={message:'规则异常'};assert.throws(()=>reduce(state,{type:'pause'}),/选卡或对局/);assert.throws(()=>reduce(state,{type:'resume'}),/没有暂停/);assert.equal(state.game.phase,'paused');
});

for(const phase of ['draft','selection','race','results','finished'] as const)test(`pause in ${phase} freezes game, timeout, and all gameplay intents through serialization`,()=>{
  const original=room();original.game.phase=phase;original.deadline=45_000;
  const paused=reduce(original,{type:'pause'});assert.equal(paused.deadline,null);assert.equal(paused.pause?.remainingMs,25_000);assert.deepEqual(paused.game,original.game);assert.equal(original.pause,undefined);
  setRoomDeadline(paused,500_000);assert.equal(paused.deadline,null);assert.equal(immediateRoomAction(paused,500_000),undefined);
  for(const action of [{type:'draft',characterId:'banana'},{type:'practice-team',characterIds:['banana']},{type:'select',characterIds:['banana']},{type:'roll'},{type:'choose',choiceId:'old',optionId:'skip'},{type:'next'},{type:'rematch'},{type:'configure',config:original.game.config!}] satisfies GameAction[]){assert.throws(()=>reduce(paused,action,500_000),/暂停/);assert.throws(()=>reduce(paused,action,500_000,'p0',true),/暂停/);}
  assert(view(paused).pause);assert.equal(view(paused).phase,phase);assert.equal(view(paused,'p1').players[0]!.hand,undefined);
  const resumed=reduce(JSON.parse(JSON.stringify(paused)),{type:'resume'},500_000);assert.equal(resumed.deadline,525_000);assert.equal(resumed.pause,undefined);assert.deepEqual(resumed.game,original.game);
});

test('untimed and already-expired choices keep their exact remaining time across repeated pauses',()=>{
  for(const deadline of [null,19_000,20_000,30_000]){
    let state=race();state.deadline=deadline;
    for(const now of [20_000,50_000,90_000]){state=reduce(state,{type:'pause'},now);const remaining=state.pause!.remainingMs;state=reduce(state,{type:'resume'},now+10_000);assert.equal(state.deadline,remaining===null?null:now+10_000+remaining);}
  }
});

test('manual pause suppresses a due AI intent and gives it a normal think interval after resume',()=>{
  const state=race(['banana','banana','banana']);state.game.players[1]!.isAI=true;state.game.currentRacerId='r1';state.game.queue=[{kind:'beginTurn',racerId:'r1'}];resolveTasks(state.game);
  assert.equal(immediateRoomAction(state,20_000)?.reason,'ai');const paused=reduce(state,{type:'pause'});assert.equal(immediateRoomAction(paused,500_000),undefined);
  const resumed=reduce(paused,{type:'resume'},500_000);assert.equal(immediateRoomAction(resumed,501_199),undefined);assert.equal(immediateRoomAction(resumed,501_200)?.reason,'ai');
});

for(const kind of ['optional','six-dice','duel','field-choice','route'] as const)test(`pending ${kind} keeps IDs, private context, RNG, and exact continuation after pause`,()=>{
  const state=race(kind==='six-dice'?['mr-dice-guy','banana','banana']:kind==='duel'?['duelist','banana','banana']:['extra-mile-moneybags','extra-mile-pooh','gunk'],[4,5,20]);
  if(kind==='optional')begin(state);
  if(kind==='six-dice'){begin(state);state.game.flags.testDice=[2,2,3,4,5,6];const p=state.game.pending!;applyGameAction(state.game,'p0',{type:'choose',choiceId:p.id,optionId:'roll'});}
  if(kind==='duel'){enqueueMove(state.game,'r0',1);resolveTasks(state.game);if(state.game.pending?.kind!=='duel-roll'&&state.game.pending){const p=state.game.pending;applyGameAction(state.game,p.playerId,{type:'choose',choiceId:p.id,optionId:p.options.find(o=>!['skip','pass'].includes(o.id))!.id});}}
  if(kind==='field-choice'){state.game.flags.thirds={id:'duelist',round:1,held:{},extraCards:[]};enqueueMove(state.game,'r0',1);resolveTasks(state.game);}
  if(kind==='route'){state.game.track='boardwalks';state.game.racers[0]!.position=8;enqueueMove(state.game,'r0',3);resolveTasks(state.game);}
  assert(state.game.pending,`${kind} must exercise a real engine choice`);setRoomDeadline(state,10_000);
  const pending=state.game.pending!,action:GameAction={type:'choose',choiceId:pending.id,optionId:pending.options[0]!.id};
  const expected=reduce(state,action,500_000,pending.playerId);
  const paused=reduce(state,{type:'pause'});assert.deepEqual(paused.game,state.game);assert.equal(view(paused,pending.playerId).pending?.id,pending.id);
  const restored=reduce(JSON.parse(JSON.stringify(paused)),{type:'resume'},500_000);
  const actual=reduce(restored,action,500_000,pending.playerId);assert.deepEqual(persisted(actual.game),persisted(expected.game));
});

test('pausing around every intent in a complete race leaves score, placements, logs and randomness identical',()=>{
  let baseline=race(['magician','suckerfish','banana'],[23,23,24]);begin(baseline);let interrupted=structuredClone(baseline),actions=0;
  while(!['results','finished'].includes(baseline.game.phase)){
    assert(actions++<250,'race must settle');const now=30_000+actions*1_000;
    const next=immediateRoomAction(baseline,now)??timeoutRoomAction(baseline.game);assert(next,'race must offer a legal continuation');
    baseline=reduce(baseline,next.action,now,next.playerId);
    interrupted=reduce(reduce(JSON.parse(JSON.stringify(interrupted)),{type:'pause'},now),{type:'resume'},now+500);
    interrupted=reduce(interrupted,next.action,now+500,next.playerId);assert.deepEqual(persisted(interrupted.game),persisted(baseline.game));
  }
  assert(baseline.game.results.length);assert.deepEqual(interrupted.game.results,baseline.game.results);assert.deepEqual(interrupted.game.players.map(p=>p.score),baseline.game.players.map(p=>p.score));
});

test('host transfer preserves pause; the new host can resume and dissolution stays available',()=>{
  const paused=reduce(race(),{type:'pause'}),transferred=reduce(paused,{type:'transfer',playerId:'p1'});
  assert.deepEqual(transferred.pause,paused.pause);assert.throws(()=>reduce(transferred,{type:'resume'}),/只有房主/);assert.equal(reduce(transferred,{type:'resume'},500_000,'p1').pause,undefined);assert.equal(reduce(transferred,{type:'close'},500_000,'p1').closedAt,500_000);
});

test('owner-away unanimous continuation replaces manual pause and keeps the pending choice',()=>{
  let paused=reduce(race(),{type:'pause'});begin(paused);const game=structuredClone(paused.game);paused.game.players[0]!.connected=false;
  assert(offerContinuation(paused,30_000));assert(paused.pause);assert.equal(immediateRoomAction(paused,100_000),undefined);
  const id=paused.continuation!.id;for(const playerId of ['p1','p2'])applyContinuationAction(paused,playerId,{type:'continue-vote',continuationId:id,continue:true},30_001);
  assert.equal(paused.continuation!.stage,'playing');assert.equal(paused.pause,undefined);assert.deepEqual(paused.game.pending,game.pending);
});

test('SQLite authority persists pause receipts, rejects a stale skill click, and does not tick until resumed',()=>{
  const store=new Store(':memory:'),clock={now:10_000};let rooms=new Rooms(store,120,()=>clock.now);
  try{
    const created=rooms.create('房主',3,120),code=created.identity.roomCode,guest=rooms.join(code,'同学');let state=rooms.get(code);
    state.game=race(['extra-mile-moneybags','banana','gunk']).game;state.game.players.forEach((p,i)=>p.id=i===0?created.identity.playerId:i===1?guest.identity.playerId:p.id);state.game.racers.forEach((r,i)=>r.playerId=state.game.players[i]!.id);begin(state);state.deadline=45_000;delete state.hostLeftAt;
    const pending=state.game.pending!,envelope={actionId:'pause-once',expectedVersion:state.version,action:{type:'pause'} as GameAction};
    assert(rooms.act(code,state.hostId,envelope).ok);const frozen=structuredClone(rooms.get(code).game);clock.now=100_000;assert.deepEqual(rooms.tick(),[]);assert.deepEqual(rooms.get(code).game,frozen);
    assert(rooms.act(code,state.hostId,envelope).duplicate);assert(!rooms.act(code,state.hostId,{actionId:'old-click',expectedVersion:state.version,action:{type:'choose',choiceId:pending.id,optionId:pending.options[0]!.id}}).ok);
    rooms=new Rooms(store,120,()=>clock.now);state=rooms.get(code);assert(state.pause);assert.deepEqual(state.game.pending,pending);
    const resumed=rooms.act(code,state.hostId,{actionId:'resume-once',expectedVersion:state.version,action:{type:'resume'}});assert(resumed.ok);assert.equal(rooms.get(code).deadline,135_000);
  }finally{store.db.close();}
});

test('visual clock freezes movement and die reading time, retaining queued beats on pause snapshots',()=>{
  let real=1_000;const clock=new PresentationClock(()=>real),state=race();begin(state);const initial=view(state),playback=createPlayback(initial);
  state.game.flags.testDice=[3];applyGameAction(state.game,'p0',{type:'roll'});state.version++;let playing=receiveRoom(playback,view(state));assert(playing.queue.length);
  const beat=playing.queue[0]!,started=clock.now();real+=300;clock.setPaused(true);const frozen=clock.now();real+=50_000;assert.equal(clock.now(),frozen);clock.setPaused(true);assert.equal(clock.now(),frozen);
  const paused=reduce(state,{type:'pause'});playing=receiveRoom(playing,view(paused));assert.equal(playing.queue[0]!.key,beat.key);assert.equal(playing.queue[0]!.face,beat.face);assert.equal(playing.confirmed.pause?.at,paused.pause?.at);
  clock.setPaused(false);assert.equal(clock.now(),frozen);real+=700;assert.equal(clock.now()-started,1_000);assert(beatCompletionTime(beat,started,2_000,clock.now())!>clock.now(),'a confirmed die still receives its reading window');
  const before=playing.queue.length;playing=completeBeat(playing);assert.equal(playing.queue.length,before-1);
});
