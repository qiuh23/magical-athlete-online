import test from 'node:test';
import assert from 'node:assert/strict';
import { Rooms } from '../src/server/rooms.js';
import { Store } from '../src/server/store.js';
import { createGame } from '../src/engine/index.js';
import { validateActionEnvelope } from '../src/shared/room-core.js';
import { PAUSED_OWNER_AWAY_MS, ROOM_OWNER_AWAY_MS, PRACTICE_OWNER_AWAY_MS, roomExpiry } from '../src/shared/room-lifecycle.js';
import { CONTINUE_VOTE_MS } from '../src/shared/room-continuation.js';
import type { GameAction } from '../src/shared/types.js';

function fixture(race=false){
  const clock={now:Date.now()},store=new Store(':memory:'),rooms=new Rooms(store,30,()=>clock.now);
  const host=rooms.create('房主',3,30).identity,peers=[host,rooms.join(host.roomCode,'朋友甲').identity,rooms.join(host.roomCode,'朋友乙').identity];
  for(const p of peers)rooms.presence(host.roomCode,p.playerId,true);
  const code=host.roomCode;
  if(race){
    const room=rooms.get(code),game=createGame(room.game.players,42);game.phase='race';game.round=1;game.currentRacerId='r0';game.baseTurnOrder=['r0','r1','r2'];game.flags.awaitRoll=true;
    game.racers=game.players.map((p,i)=>({id:`r${i}`,playerId:p.id,characterId:'banana',position:i*6,tripped:false,finished:false,eliminated:false,flags:{}}));room.game=game;room.deadline=clock.now+25_000;store.save(room);
  }
  const act=(i:number,action:GameAction,expectedVersion=rooms.get(code).version,actionId=crypto.randomUUID())=>rooms.act(code,peers[i]!.playerId,{actionId,expectedVersion,action});
  const away=(paused=false)=>{if(paused)assert(act(0,{type:'pause'}).ok);rooms.presence(code,host.playerId,false);clock.now+=paused?PAUSED_OWNER_AWAY_MS:ROOM_OWNER_AWAY_MS;rooms.expire(code);return rooms.get(code).continuation!;};
  return {clock,store,rooms,host,peers,code,act,away};
}

test('kick protocol rejects extra fields; only a host can remove another lobby seat and revoke its credentials atomically',()=>{
  const e=fixture();try{
    assert.throws(()=>validateActionEnvelope({actionId:'kick',expectedVersion:1,action:{type:'kick',playerId:e.peers[1]!.playerId,ban:true}}),/字段/);
    const watcher=e.rooms.join(e.code,'观众','spectator').identity,initial=structuredClone(e.rooms.get(e.code));
    for(const [actor,target] of [[1,2],[0,0]] as const)assert.equal(e.act(actor,{type:'kick',playerId:e.peers[target]!.playerId}).ok,false);
    assert.equal(e.rooms.act(e.code,watcher.playerId,{actionId:crypto.randomUUID(),expectedVersion:initial.version,action:{type:'kick',playerId:e.peers[1]!.playerId}}).ok,false);
    assert.equal(e.act(0,{type:'kick',playerId:'missing'}).ok,false);assert.deepEqual(e.rooms.get(e.code),initial);
    assert(e.act(1,{type:'ready',ready:true}).ok);
    const target=e.peers[1]!,version=e.rooms.get(e.code).version,id=crypto.randomUUID(),action:GameAction={type:'kick',playerId:target.playerId};
    assert(e.act(0,action,version,id).ok);const after=structuredClone(e.rooms.get(e.code));
    assert(!after.game.players.some(p=>p.id===target.playerId));assert.equal(e.store.identity(e.code,target.playerId),undefined);assert.equal(after.game.players.length,2);
    assert.match(after.chat!.messages.at(-1)!.text,/朋友甲.*踢出/);assert(e.act(0,action,version,id).duplicate);assert.deepEqual(e.rooms.get(e.code),after);
    assert.equal(e.act(1,{type:'ready',ready:true}).ok,false);assert.throws(()=>e.rooms.authenticate(target),/身份已失效/);
    const replacement=e.rooms.join(e.code,'新朋友');assert.equal(replacement.room.players.find(p=>p.id===replacement.identity.playerId)!.seat,1);assert.notEqual(replacement.identity.playerId,target.playerId);
    const restored=new Rooms(e.store,30,()=>e.clock.now);assert.throws(()=>restored.authenticate(target),/身份已失效/);assert.equal(restored.get(e.code).game.players.find(p=>p.id===replacement.identity.playerId)!.ready,false);
  }finally{e.store.close();}
});

test('failed kick persistence leaves the seat, credential and receipt unchanged and the same request can retry',()=>{
  const e=fixture();try{
    const original=structuredClone(e.rooms.get(e.code)),save=e.store.save.bind(e.store),id=crypto.randomUUID(),action:GameAction={type:'kick',playerId:e.peers[1]!.playerId};
    e.store.save=()=>{throw Error('模拟写入失败');};assert.equal(e.act(0,action,original.version,id).ok,false);e.store.save=save;
    assert.deepEqual(e.rooms.get(e.code),original);assert(e.store.identity(e.code,e.peers[1]!.playerId));assert.equal(e.store.receipt(e.code,e.host.playerId,id),undefined);assert(e.act(0,action,original.version,id).ok);
  }finally{e.store.close();}
});

for(const kickFirst of [true,false])test(`kick/start race: ${kickFirst?'kick':'start'} commits first and the stale competing request cannot alter it`,()=>{
  const e=fixture();try{
    for(const i of [0,1,2])assert(e.act(i,{type:'ready',ready:true}).ok);
    const version=e.rooms.get(e.code).version,kick:GameAction={type:'kick',playerId:e.peers[1]!.playerId},start:GameAction={type:'start'};
    assert(e.act(0,kickFirst?kick:start,version).ok);assert.equal(e.act(0,kickFirst?start:kick,version).ok,false);
    if(kickFirst)assert.equal(e.rooms.get(e.code).game.phase,'lobby');else{assert.equal(e.rooms.get(e.code).game.phase,'draft');assert.equal(e.act(0,kick).ok,false);}
  }finally{e.store.close();}
});

test('one manual pause has one fixed four-hour offline deadline across reconnects and restart, while an online owner never expires',()=>{
  const e=fixture(true);try{
    assert(e.act(0,{type:'pause'}).ok);e.rooms.presence(e.code,e.host.playerId,false);
    const until=e.clock.now+PAUSED_OWNER_AWAY_MS;assert.equal(roomExpiry(e.rooms.get(e.code)),until);
    e.clock.now+=30*60_000;e.rooms.presence(e.code,e.host.playerId,true);assert.equal(e.rooms.view(e.rooms.get(e.code),e.host.playerId).expiresAt,undefined);
    const restored=new Rooms(e.store,30,()=>e.clock.now);assert.equal(roomExpiry(restored.get(e.code)),until);for(const peer of e.peers)restored.presence(e.code,peer.playerId,true);
    const act=(action:GameAction)=>restored.act(e.code,e.host.playerId,{actionId:crypto.randomUUID(),expectedVersion:restored.get(e.code).version,action});
    e.clock.now=until+60_000;restored.tick();assert(restored.get(e.code).pause);assert.equal(restored.get(e.code).hostLeftAt,undefined);
    // The same pause has already used its retention, so another departure gets no extension.
    restored.presence(e.code,e.host.playerId,false);assert.equal(roomExpiry(restored.rooms.get(e.code)!),until);assert.equal(restored.get(e.code).continuation?.stage,'voting');
    restored.presence(e.code,e.host.playerId,true);assert(restored.get(e.code).pause);assert.equal(restored.get(e.code).continuation,undefined);
    assert(act({type:'resume'}).ok);assert(act({type:'pause'}).ok);restored.presence(e.code,e.host.playerId,false);assert.equal(roomExpiry(restored.get(e.code)),e.clock.now+PAUSED_OWNER_AWAY_MS);
  }finally{e.store.close();}
});

for(const mode of ['practice','ai'] as const)test(`paused ${mode} retains its original offline limit`,()=>{
  const clock={now:Date.now()},store=new Store(':memory:'),rooms=new Rooms(store,30,()=>clock.now);
  try{const {identity}=rooms.create('练习',2,30,mode,1);rooms.presence(identity.roomCode,identity.playerId,true);const r=rooms.get(identity.roomCode);assert(rooms.act(r.code,identity.playerId,{actionId:crypto.randomUUID(),expectedVersion:r.version,action:{type:'pause'}}).ok);rooms.presence(r.code,identity.playerId,false);const limit=mode==='practice'?PRACTICE_OWNER_AWAY_MS:ROOM_OWNER_AWAY_MS;assert.equal(roomExpiry(rooms.get(r.code)),clock.now+limit);clock.now+=limit;rooms.tick();assert(rooms.closed(r.code));}finally{store.close();}
});

for(const paused of [true,false])test(`owner returning during voting cancels the vote and retains ${paused?'manual pause':'the frozen timer'}, rejecting delayed votes`,()=>{
  const e=fixture(true);try{
    const c=e.away(paused),vote:GameAction={type:'continue-vote',continuationId:c.id,continue:true};
    const receiptId=crypto.randomUUID();assert(e.act(1,vote,undefined,receiptId).ok);const before=structuredClone(e.rooms.get(e.code)),rng=structuredClone(before.game.randomLog);
    e.rooms.presence(e.code,e.host.playerId,true);const returned=e.rooms.get(e.code);
    assert.equal(returned.continuation,undefined);assert.equal(!!returned.pause,paused);assert.deepEqual(returned.game.racers,before.game.racers);assert.deepEqual(returned.game.randomLog,rng);
    assert.equal(returned.deadline,paused?null:e.clock.now+c.remainingMs!);assert.equal(e.act(2,vote).ok,false);assert(e.act(1,vote,undefined,receiptId).duplicate);assert.equal(e.rooms.get(e.code).continuation,undefined);
  }finally{e.store.close();}
});

test('owner returning after unanimous continuation preserves committed game progress and removes dissolution even on the results screen',()=>{
  const e=fixture(true);try{
    const c=e.away(true);for(const i of [1,2])assert(e.act(i,{type:'continue-vote',continuationId:c.id,continue:true}).ok);
    assert.equal(e.rooms.get(e.code).pause,undefined);assert(e.act(0,{type:'roll'}).ok);
    const before=structuredClone(e.rooms.get(e.code));assert(before.game.randomLog.length>0);e.rooms.presence(e.code,e.host.playerId,true);
    const returned=e.rooms.get(e.code);assert.equal(returned.continuation,undefined);assert.deepEqual(returned.game.racers,before.game.racers);assert.deepEqual(returned.game.randomLog,before.game.randomLog);assert.deepEqual(returned.game.logs,before.game.logs);assert.equal(returned.deadline,before.deadline);
    e.rooms.presence(e.code,e.host.playerId,false);e.clock.now+=ROOM_OWNER_AWAY_MS;const again=e.rooms.get(e.code).continuation!;for(const i of [1,2])assert(e.act(i,{type:'continue-vote',continuationId:again.id,continue:true}).ok);
    const room=e.rooms.get(e.code);room.game.phase='results';room.game.results.push({round:1,placements:[]});e.rooms.expire(e.code);e.rooms.tick();assert.equal(e.rooms.get(e.code).continuation!.stage,'results');e.rooms.presence(e.code,e.host.playerId,true);assert.equal(e.rooms.get(e.code).continuation,undefined);assert.equal(e.rooms.get(e.code).game.phase,'results');
  }finally{e.store.close();}
});

for(const returnFirst of [true,false])for(const agree of [true,false])test(`owner return / last ${agree?'agreement':'refusal'} serializes, return first=${returnFirst}`,()=>{
  const e=fixture(true);try{
    const c=e.away(),vote:GameAction={type:'continue-vote',continuationId:c.id,continue:agree};assert(e.act(1,{...vote,continue:true}).ok);
    if(returnFirst)e.rooms.presence(e.code,e.host.playerId,true);
    assert.equal(e.act(2,vote).ok,!returnFirst);
    if(!returnFirst)e.rooms.presence(e.code,e.host.playerId,true);
    if(!returnFirst&&!agree){assert(e.rooms.closed(e.code));assert.throws(()=>e.rooms.authenticate(e.host),/关闭/);assert.equal(e.rooms.rooms.has(e.code),false);}
    else{assert.equal(e.rooms.get(e.code).continuation,undefined);assert.equal(e.rooms.get(e.code).hostLeftAt,undefined);}
  }finally{e.store.close();}
});

test('voting timeout closes permanently and legacy paused saves derive the fixed deadline from the original departure',()=>{
  const e=fixture(true);try{
    assert(e.act(0,{type:'pause'}).ok);e.rooms.presence(e.code,e.host.playerId,false);const room=e.rooms.get(e.code);delete room.mode;delete room.pause!.offlineExpiresAt;e.store.save(room);
    const restored=new Rooms(e.store,30,()=>e.clock.now);assert.equal(roomExpiry(restored.get(e.code)),e.clock.now+PAUSED_OWNER_AWAY_MS);
    e.clock.now+=PAUSED_OWNER_AWAY_MS;e.rooms.get(e.code);e.clock.now+=CONTINUE_VOTE_MS;e.rooms.tick();assert(e.rooms.closed(e.code));e.rooms.presence(e.code,e.host.playerId,true);assert.equal(e.rooms.rooms.has(e.code),false);assert.throws(()=>new Rooms(e.store,30,()=>e.clock.now).authenticate(e.host),/关闭/);
  }finally{e.store.close();}
});
