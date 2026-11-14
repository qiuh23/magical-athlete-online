import test from 'node:test';
import assert from 'node:assert/strict';
import { Rooms } from '../src/server/rooms.js';
import { Store } from '../src/server/store.js';
import { legacyRoomConfig } from '../src/shared/room-config.js';
import { CURRENT_RULES_VERSION, SECOND_WIND_V2_RULES_VERSION } from '../src/engine/runtime.js';
import type { RoomConfig } from '../src/shared/room-config.js';
import type { GameAction, GameMode } from '../src/shared/types.js';

const quick = ():RoomConfig => ({...legacyRoomConfig(),quickMode:true});
function fixture(config=quick(),mode:GameMode='multiplayer') {
  const store=new Store(':memory:'),clock={now:Date.now()};let rooms=new Rooms(store,0,()=>clock.now);
  const host=rooms.create('房主',2,0,mode,1,'original',config).identity;
  const peers=[host,...(mode==='multiplayer'?[rooms.join(host.roomCode,'朋友').identity]:[])];
  const code=host.roomCode;
  for(const p of peers)rooms.presence(code,p.playerId,true);
  const act=(i:number,action:GameAction)=>rooms.act(code,peers[i]!.playerId,{actionId:crypto.randomUUID(),expectedVersion:rooms.get(code).version,action});
  return {store,clock,host,peers,code,act,get rooms(){return rooms;},reload(){rooms=new Rooms(store,0,()=>clock.now);},ready(){for(const [i] of peers.entries())assert(act(i,{type:'ready',ready:true}).ok);}};
}

test('Node quick mode persists creation/configure and keeps old omitted and explicit false payloads in draft',()=>{
  for(const config of [legacyRoomConfig(),{...legacyRoomConfig(),quickMode:false},quick()]){
    const e=fixture(config);try{
      e.reload();assert.equal(e.rooms.get(e.code).game.config?.quickMode,config.quickMode);
      for(const p of e.peers)e.rooms.presence(e.code,p.playerId,true);
      e.ready();assert(e.act(0,{type:'start'}).ok);
      assert.equal(e.rooms.get(e.code).game.phase,config.quickMode?'selection':'draft');
    }finally{e.store.close();}
  }
  const e=fixture(legacyRoomConfig());try{
    e.ready();assert.equal(e.act(1,{type:'configure',config:quick()}).ok,false);
    assert(e.act(0,{type:'configure',config:quick()}).ok);
    assert(e.rooms.get(e.code).game.players.every(p=>!p.ready));e.reload();
    assert.equal(e.rooms.get(e.code).game.config?.quickMode,true);
    for(const invalid of ['true',1,null,{}]){
      const config={...quick(),quickMode:invalid} as RoomConfig;
      assert.throws(()=>e.rooms.create('非法',2,0,'multiplayer',1,'original',config),/快速模式/);
      assert.equal(e.act(0,{type:'configure',config}).ok,false);
      assert.equal(e.rooms.get(e.code).game.config?.quickMode,true);
    }
  }finally{e.store.close();}
});

test('Node quick start enforces host, readiness, connectivity and commits one deal with private projections across retries and reload',()=>{
  const e=fixture();try{
    assert.equal(e.act(0,{type:'start'}).ok,false);e.ready();
    assert.equal(e.act(1,{type:'start'}).ok,false);
    e.rooms.presence(e.code,e.peers[1]!.playerId,false);assert.equal(e.act(0,{type:'start'}).ok,false);
    e.rooms.presence(e.code,e.peers[1]!.playerId,true);e.ready();
    const envelope={actionId:crypto.randomUUID(),expectedVersion:e.rooms.get(e.code).version,action:{type:'start' as const}};
    assert(e.rooms.act(e.code,e.host.playerId,envelope).ok);
    const dealt=structuredClone(e.rooms.get(e.code).game);
    assert.equal(dealt.phase,'selection');assert.equal(dealt.draft,undefined);
    assert(dealt.players.every(p=>p.hand.length===8&&p.selection.length===0));
    assert.equal(new Set(dealt.players.flatMap(p=>p.hand)).size,16);
    const spectator=e.rooms.join(e.code,'观众','spectator').identity;
    for(const identity of [...e.peers,spectator]){
      const view=e.rooms.view(e.rooms.get(e.code),identity.playerId);
      assert.equal(view.config?.quickMode,true);assert.equal(view.draft,undefined);
      for(const p of view.players){assert.equal(p.handCount,8);assert.equal(p.hand?.length,p.id===identity.playerId?8:undefined);assert.equal(p.selection?.length,p.id===identity.playerId?0:undefined);}
      assert.equal((view as any).deck,undefined);assert.equal((view as any).randomStream,undefined);
    }
    assert.equal(e.act(0,{type:'draft',characterId:dealt.players[0]!.hand[0]!}).ok,false);
    assert.equal(e.act(0,{type:'assign',characterIds:[]} as unknown as GameAction).ok,false);
    assert(e.rooms.act(e.code,e.host.playerId,envelope).duplicate);e.reload();
    assert(e.rooms.act(e.code,e.host.playerId,envelope).duplicate);
    const restored=e.rooms.get(e.code).game;
    assert.deepEqual(restored.players.map(p=>p.hand),dealt.players.map(p=>p.hand));assert.deepEqual(restored.deck,dealt.deck);assert.deepEqual(restored.randomLog,dealt.randomLog);
    assert.equal(e.act(0,{type:'start'}).ok,false);
  }finally{e.store.close();}
});

test('Node failed quick start persistence rolls back cards and receipts and safely retries',()=>{
  const e=fixture();try{
    e.ready();const before=structuredClone(e.rooms.get(e.code)),save=e.store.save.bind(e.store);
    const envelope={actionId:crypto.randomUUID(),expectedVersion:before.version,action:{type:'start' as const}};
    e.store.save=()=>{throw Error('simulated write failure');};assert.equal(e.rooms.act(e.code,e.host.playerId,envelope).ok,false);e.store.save=save;
    assert.deepEqual(e.rooms.get(e.code),before);assert.equal(e.store.receipt(e.code,e.host.playerId,envelope.actionId),undefined);
    assert(e.rooms.act(e.code,e.host.playerId,envelope).ok);assert.equal(e.rooms.get(e.code).game.phase,'selection');
  }finally{e.store.close();}
});

test('Node quick AI waits for a manual human lineup and practice retains free draft',()=>{
  const e=fixture(quick(),'ai');try{
    assert.equal(e.rooms.get(e.code).game.phase,'selection');
    for(let i=0;i<5;i++){e.clock.now+=2_000;e.rooms.tick();}
    const game=e.rooms.get(e.code).game;
    assert.equal(game.phase,'selection');assert.equal(game.players.find(p=>p.id===e.host.playerId)!.selection.length,0);
    assert.equal(game.players.find(p=>p.isAI)!.selection.length,2);
    assert(e.act(0,{type:'select',characterIds:game.players.find(p=>p.id===e.host.playerId)!.hand.slice(0,2)}).ok);
    assert.equal(e.rooms.get(e.code).game.phase,'race');
  }finally{e.store.close();}
  const p=fixture(quick(),'practice');try{assert.equal(p.rooms.get(p.code).game.phase,'draft');assert.equal(p.rooms.get(p.code).game.players[0]!.hand.length,0);assert(p.rooms.get(p.code).game.draft!.market.length>0);}finally{p.store.close();}
});

test('Node next-round transition preserves the remaining quick-dealt teams after persisted results',()=>{
  const e=fixture();try{
    e.ready();assert(e.act(0,{type:'start'}).ok);
    const room=e.rooms.get(e.code),hands=room.game.players.map(p=>[...p.hand]);
    // Load a completed first-race checkpoint; full race resolution is covered
    // separately by engine tests. The backend must not redeal on next/reload.
    room.game.phase='results';room.game.round=1;room.game.results=[{round:1,placements:[]}];
    room.game.players.forEach((p,i)=>{p.used=hands[i]!.slice(0,2);p.hand=hands[i]!.slice(2);p.selection=hands[i]!.slice(0,2);});
    e.store.save(room);e.reload();
    const before=structuredClone(e.rooms.get(e.code).game);
    assert(e.act(0,{type:'next'}).ok);const game=e.rooms.get(e.code).game;
    assert.equal(game.phase,'selection');assert.equal(game.round,2);assert.equal(game.draft,undefined);
    assert.deepEqual(game.players.map(p=>p.hand),hands.map(hand=>hand.slice(2)));assert(game.players.every(p=>p.selection.length===0));
    assert.deepEqual(game.deck,before.deck);assert.deepEqual(game.randomLog,before.randomLog);assert.equal(game.config?.quickMode,true);
  }finally{e.store.close();}
});

test('Node explicit old-lobby quick edit upgrades rules; rematch retains quick mode with fresh readiness',()=>{
  const e=fixture(legacyRoomConfig());try{
    const old=e.rooms.get(e.code);old.game.rulesVersion=SECOND_WIND_V2_RULES_VERSION;
    const entropy=structuredClone(old.game.randomStream);e.store.save(old);
    assert(e.act(0,{type:'configure',config:quick()}).ok);
    assert.equal(e.rooms.get(e.code).game.rulesVersion,CURRENT_RULES_VERSION);
    assert.deepEqual(e.rooms.get(e.code).game.randomStream,entropy);
    e.ready();assert(e.act(0,{type:'start'}).ok);
    const room=e.rooms.get(e.code);assert.equal(room.game.phase,'selection');
    assert.equal(e.act(0,{type:'configure',config:legacyRoomConfig()}).ok,false);
    room.game.phase='finished';e.store.save(room);
    assert(e.act(0,{type:'rematch'}).ok);
    const next=e.rooms.get(e.code);assert.equal(next.game.phase,'lobby');assert.equal(next.game.config?.quickMode,true);
    assert(next.game.players.every(p=>!p.ready&&!p.hand.length));assert.equal(next.configFrozen,false);
    assert.equal(e.act(0,{type:'start'}).ok,false);e.ready();assert(e.act(0,{type:'start'}).ok);
    assert.equal(e.rooms.get(e.code).game.phase,'selection');
  }finally{e.store.close();}
});
