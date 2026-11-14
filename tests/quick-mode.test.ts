import test from 'node:test';
import assert from 'node:assert/strict';
import { applyGameAction, automaticAction, createGame, startGame } from '../src/engine/index.js';
import { roomRules } from '../src/engine/runtime.js';
import { decideAI } from '../src/engine/ai.js';
import { presetCompetition, type RaceCount } from '../src/shared/competition.js';
import { blockedMapCharacters, characterResources, enabledCharacterIds, legacyRoomConfig, racersPerPlayer, validateRoomConfig, type RoomConfig } from '../src/shared/room-config.js';
import { projectRoom } from '../src/shared/room-core.js';
import type { GameState, Player } from '../src/shared/types.js';

const players=(n:number):Player[]=>Array.from({length:n},(_,i)=>({id:`p${i}`,name:`玩家${i}`,seat:i,color:'blue',ready:true,connected:true,score:0,hand:[],used:[],selection:[]}));
function config(rounds:RaceCount=4):RoomConfig {
  return {...legacyRoomConfig('all'),characterPacks:{original:true,'second-wind':true,'extra-mile':true,'leaf-fan':true,wurstii:true},quickMode:true,competition:{...presetCompetition(),preset:'custom',raceCount:rounds}};
}
function game(n:number,c:RoomConfig,seed=2300):GameState {const s=createGame(players(n),seed);s.config=c;startGame(s);return s;}

test('quick mode is optional and strict; absent or false preserves the original draft',()=>{
  assert.equal(validateRoomConfig(legacyRoomConfig()).quickMode,undefined);
  for(const quickMode of [true,false])assert.equal(validateRoomConfig({...legacyRoomConfig(),quickMode}).quickMode,quickMode);
  for(const quickMode of ['true',1,null,{}])assert.throws(()=>validateRoomConfig({...legacyRoomConfig(),quickMode}),/快速模式/);
  for(const c of [legacyRoomConfig(),{...legacyRoomConfig(),quickMode:false}])assert.equal(game(2,c).phase,'draft');
});

for(const count of [2,3,4,5,6,7,8])for(const rounds of [4,6,8] as const)for(const double of count===3?[false,true]:[false])test(`quick ${count} players / ${rounds} races${double?' / double':''}: same legal shuffled allocation, reserves and draft-order abilities`,()=>{
  const c=config(rounds);if(double)c.threePlayerMode='double';
  const s=game(count,c),normal=game(count,{...c,quickMode:false});
  while(normal.phase==='draft'){const a=automaticAction(normal)!;applyGameAction(normal,a.playerId,a.action);}
  const cards=s.players.flatMap(p=>p.hand),perPlayer=rounds*racersPerPlayer(count,c);
  assert.equal(s.phase,'selection');assert.equal(s.draft,undefined);assert.equal(s.round,1);
  assert(s.players.every(p=>p.hand.length===perPlayer&&p.selection.length===0&&p.used.length===0));
  assert.equal(cards.length,count*perPlayer);assert.equal(new Set(cards).size,cards.length);
  assert.equal(new Set([...cards,...s.deck]).size,enabledCharacterIds(c).length);
  assert(s.deck.length>=characterResources(c,count).reserve);
  // Reusing the original batches preserves Snub's position even in classic
  // two-player and three-player-double drafts, not an invented global index.
  assert.deepEqual(s.players,normal.players);assert.deepEqual(s.deck,normal.deck);
  assert.deepEqual(s.flags,normal.flags);assert.deepEqual(s.randomLog,normal.randomLog);assert.equal(s.rngState,normal.rngState);
  assert.deepEqual(s.matchPlan,normal.matchPlan);
  assert.throws(()=>applyGameAction(s,'p0',{type:'draft',characterId:s.deck[0]!}),/不是选秀/);
  assert.throws(()=>applyGameAction(s,'p0',{type:'select',characterIds:[s.deck[0]!]}),/不同且未使用/);
  assert.equal(s.phase,'selection');assert(s.players.every(p=>!p.selection.length));
});

test('quick mode respects pack-only pools, map exclusions and insufficient-resource rejection',()=>{
  const c=config();c.characterPacks={original:false,'second-wind':true,'extra-mile':false,'leaf-fan':false,wurstii:false};
  c.competition!.rotation=['squiggle','boardwalks','bridges'];
  const s=game(3,c),legal=new Set(enabledCharacterIds(c)),blocked=blockedMapCharacters(c);
  assert(s.players.flatMap(p=>p.hand).every(id=>legal.has(id)&&!blocked.includes(id)));
  assert(s.deck.every(id=>legal.has(id)&&!blocked.includes(id)));
  assert.throws(()=>game(8,{...legacyRoomConfig(),quickMode:true,competition:config(8).competition}),/至少需要/);
});

test('practice remains free team selection, even when handed a shared quick config',()=>{
  const s=createGame(players(1),321,'practice');s.config=config(6);startGame(s);
  assert.equal(s.phase,'draft');assert.equal(s.players[0]!.hand.length,0);
  const a=automaticAction(s)!;assert.equal(a.action.type,'practice-team');applyGameAction(s,a.playerId,a.action);
  assert.equal(s.phase,'selection');assert.equal(s.players[0]!.hand.length,6);
});

for(const [count,rounds,double] of [[2,4,false],[3,6,true],[8,8,false]] as const)test(`quick ${count} players finish ${rounds} rounds through manual lineups and saved rules`,()=>{
  const c=config(rounds);c.characterPacks=legacyRoomConfig('mixed').characterPacks;if(double)c.threePlayerMode='double';
  const s=game(count,c,12000+count*100+rounds),plan=structuredClone(s.matchPlan),initial=s.players.map(p=>[...p.hand]),slots=racersPerPlayer(count,c);
  let version=1,steps=0;
  while(s.phase!=='finished'){
    assert(++steps<15000,`stalled at ${s.phase} round ${s.round}`);
    if(s.phase==='selection'){
      const restored=JSON.parse(JSON.stringify(s)) as GameState;assert.deepEqual(roomRules(restored),roomRules(s));
      assert(restored.players.every(p=>!p.selection.length));
      // Exercise both hand orders and double-racer order; allocation never
      // silently confirms a lineup for humans.
      for(const [i,p] of s.players.entries()){
        const selected=(count===8?p.hand:p.hand.toReversed()).slice(0,slots);
        applyGameAction(s,p.id,{type:'select',characterIds:selected});
        assert.deepEqual(p.selection,selected);
        if(i<count-1)assert.equal(s.phase,'selection');
      }
      assert(s.racers.length>=count*slots);
      continue;
    }
    const system=s.phase==='race'&&!s.pending&&(s.flags.needsBegin||s.flags.continuation)?automaticAction(s):undefined;
    if(system){applyGameAction(s,system.playerId,system.action);continue;}
    const id=s.pending?.playerId??(s.phase==='results'?'p0':s.racers.find(r=>r.id===s.currentRacerId)?.playerId??'p0');
    const a=decideAI(projectRoom({code:'ABC234',hostId:'p0',version:version++,createdAt:1,updatedAt:1,maxPlayers:count,timeoutSeconds:0,deadline:null,game:s},id,{authorityId:'p0',authorityOnline:true}));
    assert(a,`no legal action ${s.phase}/${s.pending?.kind}`);applyGameAction(s,id,a);
  }
  assert.equal(s.results.length,rounds);assert.deepEqual(s.matchPlan,plan);
  for(const p of s.players){
    assert.equal(p.hand.length,0);assert.equal(p.used.length,rounds*slots);
  }
  // Switcharoo may exchange teams during the match; preserve that rule while
  // checking every originally assigned physical card was used exactly once.
  assert.deepEqual(s.players.flatMap(p=>p.used).toSorted(),initial.flat().toSorted());
});
