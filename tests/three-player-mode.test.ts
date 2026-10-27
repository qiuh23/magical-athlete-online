import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { BrowserAuthority } from '../src/browser/authority.js';
import { applyGameAction, createGame, startGame } from '../src/engine/index.js';
import { decideAI } from '../src/engine/ai.js';
import { CURRENT_RULES_VERSION, LEGACY_RULES_VERSION, systemRoomAction } from '../src/engine/runtime.js';
import { Store } from '../src/server/store.js';
import { Rooms } from '../src/server/rooms.js';
import { characterResources, legacyRoomConfig, racersPerPlayer, requiredCharacterCount, validateRoomConfig, validateRoomConfigForPlayers, type ThreePlayerMode } from '../src/shared/room-config.js';
import { presetCompetition, type RaceCount } from '../src/shared/competition.js';
import { projectRoom, reduceRoomAction, validateActionEnvelope } from '../src/shared/room-core.js';
import type { ActionEnvelope, GameAction, Player, Room } from '../src/shared/types.js';
import type { RelayMetadata } from '../src/shared/relay.js';

const players=():Player[]=>Array.from({length:3},(_,seat)=>({id:`p${seat}`,name:`玩家${seat}`,seat,color:'blue',isAI:true,ready:true,connected:true,score:0,hand:[],used:[],selection:[]}));
const options={now:10000,rematchSeed:15};
const config=(threePlayerMode:ThreePlayerMode,rounds:RaceCount=4)=>({...legacyRoomConfig('mixed'),threePlayerMode,competition:{...presetCompetition(),preset:'custom' as const,raceCount:rounds}});
const room=(game=createGame(players(),31),maxPlayers=8):Room=>({code:'ABC234',hostId:'p0',createdAt:1000,updatedAt:1000,version:1,maxPlayers,timeoutSeconds:0,deadline:null,game});

test('three-player options normalize strictly, preserve old defaults and reserve cards for six racers',()=>{
  assert.equal(validateRoomConfig(legacyRoomConfig()).threePlayerMode,undefined);
  assert.equal(racersPerPlayer(3),1);assert.equal(racersPerPlayer(3,config('double')),2);
  assert.equal(racersPerPlayer(2,config('single')),2);assert.equal(racersPerPlayer(4,config('double')),1);
  assert.equal(requiredCharacterCount(3,false,4,'double'),24);
  assert.throws(()=>validateRoomConfig({...config('single'),threePlayerMode:'triple'}),/三人玩法/);
  const scarce={...config('double',6),characterPacks:legacyRoomConfig().characterPacks};
  assert.throws(()=>validateRoomConfigForPlayers(scarce,3),/选秀36名/);
  assert.doesNotThrow(()=>validateRoomConfigForPlayers({...scarce,threePlayerMode:'single'},3));
  const single=config('single'),double=config('double');single.competition.thrillingThirds={enabled:true,rounds:[1]};double.competition.thrillingThirds={enabled:true,rounds:[1]};
  assert.equal(characterResources(double,3).drafted,24);
  assert.equal(characterResources(double,3).reserve-characterResources(single,3).reserve,3);
  for(const mode of ['single','double'] as const){const envelope={actionId:'start',expectedVersion:1,action:{type:'start',threePlayerMode:mode}};assert.deepEqual(validateActionEnvelope(envelope),envelope);}
  assert.throws(()=>validateActionEnvelope({actionId:'bad',expectedVersion:1,action:{type:'start',threePlayerMode:3}}),/三人玩法/);
});

for(const rounds of [4,6,8] as const)for(const mode of ['single','double'] as const)test(`three-player ${mode}: ${rounds} races finish with unique drafts, private ordered selections and restored scoring`,()=>{
  let s=createGame(players(),1300+rounds+(mode==='double'?100:0));s.config=config(mode,rounds);startGame(s);
  const n=mode==='double'?2:1,plan=structuredClone(s.matchPlan);let restored=false,steps=0;
  while(s.phase!=='finished'){
    assert(++steps<15000,`stalled at ${s.round}/${s.phase}/${s.pending?.kind}`);
    const system=systemRoomAction(s);
    const id=s.pending?.playerId??(s.phase==='draft'?s.draft!.order[s.draft!.cursor]!:s.phase==='selection'?s.players.find(p=>!p.selection.length)!.id:s.phase==='results'?'p0':s.racers.find(r=>r.id===s.currentRacerId)?.playerId??'p0');
    const action=system?.action??decideAI(projectRoom(room(s),id,{authorityId:'p0',authorityOnline:true}));
    assert(action,`no action at ${s.phase}`);
    if(s.phase==='selection'){
      assert.equal(action.type,'select');if(action.type==='select')assert.equal(action.characterIds.length,n);
      if(!restored){
        assert(s.players.every(p=>p.hand.length===rounds*n));
        assert.equal(new Set(s.players.flatMap(p=>p.hand)).size,3*rounds*n);
        applyGameAction(s,id,action);s=JSON.parse(JSON.stringify(s));restored=true;
        const view=projectRoom(room(s),'p1',{authorityId:'p0',authorityOnline:true});
        assert.equal(view.players[0]!.selection,undefined);assert.equal(view.players[0]!.hand,undefined);assert.equal(view.players[0]!.selected,true);
        assert.equal(racersPerPlayer(view.players.length,view.config),n);continue;
      }
    }
    const wasSelection=s.phase==='selection',selections=s.players.map(p=>[...p.selection]);
    if(wasSelection&&action.type==='select')selections[s.players.findIndex(p=>p.id===id)]=action.characterIds;
    applyGameAction(s,system?.playerId??id,action);
    if(wasSelection&&s.phase==='race'){
      assert.equal(s.racers.length,3*n);assert.equal(s.baseTurnOrder!.length,3*n);
      for(const [i,p] of s.players.entries())assert.deepEqual(s.baseTurnOrder!.map(id=>s.racers.find(r=>r.id===id)!).filter(r=>r.playerId===p.id).map(r=>r.characterId),selections[i]);
    }
  }
  assert.deepEqual(s.matchPlan,plan);assert.equal(s.results.length,rounds);
  for(const p of s.players){assert.equal(p.hand.length,0);assert.equal(p.used.length,rounds*n);assert.equal(p.score,s.results.reduce((sum,r)=>sum+r.scores!.find(e=>e.playerId===p.id)!.total,0));}
});

for(const maxPlayers of [3,8])for(const mode of ['single','double'] as const)test(`Node start with ${maxPlayers} seats and three actual players freezes ${mode} atomically`,()=>{
  const store=new Store(':memory:'),rooms=new Rooms(store,0);
  try{
    const host=rooms.create('房主',maxPlayers,0),code=host.identity.roomCode;
    const members=[host,rooms.join(code,'朋友甲'),rooms.join(code,'朋友乙')];
    for(const m of members)rooms.presence(code,m.identity.playerId,true);
    const act=(id:string,action:GameAction)=>rooms.act(code,id,{actionId:crypto.randomUUID(),expectedVersion:rooms.get(code).version,action});
    for(const m of members)assert(act(m.identity.playerId,{type:'ready',ready:true}).ok);
    const before=JSON.stringify(rooms.get(code));assert.equal(act(members[1]!.identity.playerId,{type:'start',threePlayerMode:mode}).ok,false);assert.equal(JSON.stringify(rooms.get(code)),before);
    const envelope:ActionEnvelope={actionId:crypto.randomUUID(),expectedVersion:rooms.get(code).version,action:{type:'start',threePlayerMode:mode}};
    assert(rooms.act(code,host.identity.playerId,envelope).ok);assert(rooms.act(code,host.identity.playerId,envelope).duplicate);
    const current=rooms.get(code);assert.equal(current.game.config!.threePlayerMode,mode);assert.equal(current.configFrozen,true);assert.equal(current.game.phase,'draft');
    assert.equal(act(host.identity.playerId,{type:'configure',config:config(mode==='single'?'double':'single')}).ok,false);
    assert.equal(rooms.view(current,members[2]!.identity.playerId).config!.threePlayerMode,mode);
  }finally{store.close();}
});

test('failed starts preserve state; roster changes invalidate the three-player choice; legacy explicit edits upgrade only before draft',()=>{
  const original=room();original.game.config={...config('single',6),characterPacks:legacyRoomConfig().characterPacks};
  const before=JSON.stringify(original);assert.throws(()=>reduceRoomAction(original,'p0',{type:'start',threePlayerMode:'double'},options),/选秀36名/);assert.equal(JSON.stringify(original),before);
  original.game.players.push({...original.game.players[0]!,id:'p3',seat:3});
  assert.throws(()=>reduceRoomAction(original,'p0',{type:'start',threePlayerMode:'single'},options),/实际入座3人/);
  const old=room();old.game.rulesVersion=LEGACY_RULES_VERSION;
  const started=reduceRoomAction(old,'p0',{type:'start',threePlayerMode:'double'},options);assert.equal(started.game.rulesVersion,CURRENT_RULES_VERSION);assert.equal(started.game.config!.threePlayerMode,'double');
  const previous=reduceRoomAction(old,'p0',{type:'start'},options);assert.equal(previous.game.rulesVersion,LEGACY_RULES_VERSION);assert.equal(previous.game.config?.threePlayerMode,undefined);
});

test('browser authority keeps a three-player choice and its receipt across IndexedDB reload',async()=>{
  const meta:RelayMetadata={code:'ABC234',authorityId:'p0',adminHostId:'p0',maxPlayers:8,timeoutSeconds:0,phase:'lobby',createdAt:1000,members:players().map(({id,name,seat})=>({id,name,seat,connected:true}))};
  const opts={indexedDB:new IDBFactory(),databaseName:crypto.randomUUID(),now:()=>10000,randomSeed:()=>18};
  let authority=await BrowserAuthority.create(meta,opts);
  try{
    for(const m of meta.members)assert((await authority.action(m.id,{actionId:crypto.randomUUID(),expectedVersion:authority.view(m.id).version,action:{type:'ready',ready:true}})).ok);
    const envelope:ActionEnvelope={actionId:crypto.randomUUID(),expectedVersion:authority.view('p0').version,action:{type:'start',threePlayerMode:'double'}};
    assert((await authority.action('p0',envelope)).ok);const view=authority.view('p0');authority.dispose();
    authority=await BrowserAuthority.load({...meta,phase:'draft',config:view.config,configFrozen:true},opts);
    assert.equal(authority.view('p2').config!.threePlayerMode,'double');assert.deepEqual(authority.view('p0').draft,view.draft);assert((await authority.action('p0',envelope)).duplicate);
  }finally{authority.dispose();}
});
