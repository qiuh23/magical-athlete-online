import test from 'node:test';
import assert from 'node:assert/strict';
import { applyGameAction, createGame, enqueueMove, resolveTasks } from '../src/engine/index.js';
import { legacyRoomConfig } from '../src/shared/room-config.js';
import { projectRoom } from '../src/shared/room-core.js';
import type { ThirdEventId } from '../src/shared/special-events.js';
import type { ThirdsState } from '../src/engine/special-events.js';
import type { TwistCardId, TwistState } from '../src/engine/twist-cards.js';
import type { GameState, Player, Room } from '../src/shared/types.js';

function fixture(event?:ThirdEventId,twists:TwistCardId[]=[]){
  const players:Player[]=Array.from({length:3},(_,seat)=>({id:`p${seat}`,name:`玩家${seat}`,seat,color:'blue',ready:true,connected:true,score:0,hand:[],used:[],selection:[]}));
  const s=createGame(players,275);s.config={...legacyRoomConfig('mixed'),threePlayerMode:'double'};s.phase='race';s.round=1;s.currentRacerId='r0';
  s.racers=['alchemist','banana','blimp','skipper','legs','cheerleader'].map((characterId,i)=>({id:`r${i}`,identityPlayerId:`p${Math.floor(i/2)}`,playerId:`p${Math.floor(i/2)}`,characterId,position:[12,5,22,7,18,25][i]!,finished:false,eliminated:false,tripped:false,flags:{}}));
  s.baseTurnOrder=s.racers.map(r=>r.id);s.flags.roundStartScores={p0:0,p1:0,p2:0};s.scoreLedger=players.map(p=>({playerId:p.id,placement:0,map:0,skill:0,event:0,total:0}));
  if(event)s.flags.thirds={id:event,round:1,held:{},extraCards:[]} satisfies ThirdsState;
  if(twists.length){s.track='twisty-twirl';s.flags.twist={triggered:false,deck:twists,drawn:[]} satisfies TwistState;}
  return s;
}
const thirds=(s:GameState)=>s.flags.thirds as ThirdsState;
const twist=(s:GameState)=>s.flags.twist as TwistState;
function choose(s:GameState,id:string){assert(s.pending);applyGameAction(s,s.pending.playerId,{type:'choose',choiceId:s.pending.id,optionId:id});}
function move(s:GameState,id:string,distance:number){enqueueMove(s,id,distance);resolveTasks(s);}
function task(s:GameState,kind:string,extra={}){s.queue.push({kind,...extra});resolveTasks(s);}
function begin(s:GameState,id='r0'){s.flags.needsBegin=false;s.currentRacerId=id;task(s,'beginTurn',{racerId:id});}
function roll(s:GameState,face:number){s.flags.testDice=[face];applyGameAction(s,s.racers.find(r=>r.id===s.currentRacerId)!.playerId,{type:'roll'});}
const asRoom=(s:GameState):Room=>({code:'ABC234',hostId:'p0',createdAt:1,updatedAt:1,version:1,maxPlayers:8,timeoutSeconds:0,deadline:null,game:s});

test('three double: player rewards and shared abilities apply once per player, to both controlled racers',()=>{
  const s=fixture('sisyphus');task(s,'thirds',{step:'setup'});assert.deepEqual(s.players.map(p=>p.score),[3,3,3]);assert.deepEqual(s.scoreLedger!.map(e=>e.event),[3,3,3]);
  const c=fixture('centaur');c.deck=['coach','hare','twin'];task(c,'thirds',{step:'setup'});assert.equal(thirds(c).extraCards.length,3);
  for(const [i,p] of c.players.entries())for(const r of c.racers.filter(r=>r.playerId===p.id))assert.deepEqual(r.flags.acquiredPowers,[thirds(c).extraCards[i]]);
});

test('three double: guesses are private, exclude the acting player and pay each other player once',()=>{
  let s=fixture('mastermind');begin(s);assert.equal(s.pending?.playerId,'p1');choose(s,'4');
  const hidden=projectRoom(asRoom(s),'p0',{authorityId:'p0',authorityOnline:true});assert(!hidden.logs.some(e=>e.type==='event-guesses'));assert(!JSON.stringify(hidden).includes('"values"'));
  s=JSON.parse(JSON.stringify(s));assert.equal(s.pending?.playerId,'p2');choose(s,'4');assert.equal(s.pending,undefined);roll(s,4);
  assert.deepEqual(s.players.map(p=>p.score),[0,1,1]);assert.deepEqual(s.scoreLedger!.map(e=>e.event),[0,1,1]);assert.equal(s.logs.filter(e=>e.type==='event-guesses').length,1);
});

test('three double: racer effects include a teammate, while Gunk preserves the dual-racer teammate exemption',()=>{
  const c=fixture('coach');c.racers.forEach(r=>r.characterId='alchemist');[2,2,2,14,18,22].forEach((p,i)=>c.racers[i]!.position=p);begin(c);roll(c,4);assert.equal(c.lastRoll?.distance,6);
  for(const opposing of [false,true]){const s=fixture();s.racers.forEach(r=>r.characterId='alchemist');s.racers[1]!.characterId='gunk';if(opposing)s.racers[2]!.characterId='gunk';begin(s);roll(s,4);assert.equal(s.lastRoll?.distance,opposing?3:4);}
});

test('three double: fixed dice are drawn three times and shared by both racers of each current controller',()=>{
  const s=fixture(undefined,['randomness-ceased']);s.flags.testDice=[4,2,3];move(s,'r0',2);assert.deepEqual(twist(s).fixedFaces,{p0:4,p1:2,p2:3});assert.equal(s.randomLog.length,3);
  const before=s.randomLog.length;begin(s);applyGameAction(s,'p0',{type:'roll'});assert.equal(s.lastRoll?.face,4);
  begin(s,'r1');applyGameAction(s,'p0',{type:'roll'});assert.equal(s.lastRoll?.face,4);assert.equal(s.randomLog.length,before);
});

test('three double: Swap Meet offers three private cards, permits either owned racer and reveals only after all three choices',()=>{
  let s=fixture(undefined,['swap-meet']);s.deck=['coach','hare','twin'];move(s,'r0',2);assert.equal(twist(s).swap!.length,3);assert(s.pending!.options.some(o=>o.id==='swap:r1'));
  choose(s,'swap:r1');assert.equal(s.racers[1]!.characterId,'banana');s=JSON.parse(JSON.stringify(s));
  assert.equal(s.pending?.playerId,'p1');choose(s,'swap:r3');assert.equal(s.racers[3]!.characterId,'skipper');
  const hidden=projectRoom(asRoom(s),'p0',{authorityId:'p0',authorityOnline:true});assert(!JSON.stringify(hidden).includes('"cardId"'));assert(!hidden.logs.some(e=>e.type==='twist-swap'));
  assert.equal(s.pending?.playerId,'p2');choose(s,'keep');assert.equal(s.racers.length,6);assert.equal(s.racers[1]!.characterId,'coach');assert.equal(s.racers[3]!.characterId,'hare');assert.equal(s.racers[1]!.playerId,'p0');assert.equal(s.racers[3]!.playerId,'p1');assert(s.discard.includes('twin'));assert.equal(s.logs.filter(e=>e.type==='twist-swap').length,1);
});

test('three double: Season Finale admits two racers owned by the same player and awards the shared score once',()=>{
  const s=fixture(undefined,['season-finale']);move(s,'r0',2);s.racers[0]!.position=29;s.racers[1]!.position=29;move(s,'r0',1);move(s,'r1',1);
  assert.deepEqual(twist(s).finale!.qualifiers,['r0','r1']);assert.equal(twist(s).finale!.stage,'duel');assert.equal(s.currentRacerId,'r0');assert(s.racers.slice(2).every(r=>r.eliminated));
  move(s,'r0',15);assert.equal(s.phase,'results');assert.deepEqual(s.players.map(p=>p.score),[4,0,0]);assert.deepEqual(s.results[0]!.scores!.map(e=>e.total),[4,0,0]);
});

test('three double: last-two event filters incompatible Finale and can award both placements to the same player',()=>{
  const s=fixture('lovable-loser',['season-finale','conveyor']);move(s,'r0',2);assert.deepEqual(twist(s).drawn,['conveyor']);s.racers.forEach(r=>r.position=29);
  for(let i=0;i<5;i++)move(s,`r${i}`,1);
  assert.equal(s.phase,'results');assert.deepEqual(s.results[0]!.placements.map(p=>p.racerId),['r5','r4']);assert.deepEqual(s.players.map(p=>p.score),[0,0,4]);
});

test('three double: Time Imp adds a seventh racer next race without replacing or consuming either ordinary selection',()=>{
  let s=fixture(undefined,['time-imp']);move(s,'r0',2);assert(s.racers[0]!.eliminated);s=JSON.parse(JSON.stringify(s));
  s.round=2;s.phase='selection';s.queue=[];s.pending=undefined;
  const hands=[['banana','alchemist'],['coach','hare'],['legs','skipper']];s.players.forEach((p,i)=>{p.hand=[...hands[i]!];p.selection=[];});
  for(const p of s.players)applyGameAction(s,p.id,{type:'select',characterIds:[...p.hand]});
  assert.equal(s.racers.length,7);assert.equal(s.baseTurnOrder!.length,7);assert.equal(s.racers.filter(r=>r.playerId==='p0').length,3);assert.equal(s.racers.filter(r=>r.flags.timeImpExtra).length,1);assert(s.players.every(p=>p.used.length===2&&p.hand.length===0));assert.deepEqual(s.flags.twistNextRaceExtras,[]);
});

test('three double: controller-targeted abilities use current owners, including both opponents and excluding the controlled teammate',()=>{
  const s=fixture();s.racers[0]!.characterId='leaf-loan-shark';s.racers[1]!.playerId='p1';s.racers[2]!.playerId='p0';
  task(s,'beforeRace',{racerId:'r0'});
  assert.equal(s.racers[2]!.flags.leafLoanTokens,undefined);
  for(const i of [1,3,4,5])assert.deepEqual(s.racers[i]!.flags.leafLoanTokens,{r0:true});
});

test('three double: Curse Wands skips fixed racer seats across players rather than skipping player identities',()=>{
  const s=fixture(undefined,['curse-wands']);twist(s).triggered=true;twist(s).curseWands=true;twist(s).fixedFaces={p0:1,p1:2,p2:3};task(s,'endTurn',{racerId:'r0'});assert.equal(s.currentRacerId,'r2');assert.equal(s.flags.needsBegin,true);
});

test('three double: the timed event counts each active player once per marker step, rather than once per racer',()=>{
  const s=fixture('legs');task(s,'thirds',{step:'setup'});
  for(const id of ['r0','r1','r2','r3'])task(s,'thirds',{step:'turn-end',racerId:id});assert.equal(thirds(s).npc!.position,0);
  task(s,'thirds',{step:'turn-end',racerId:'r4'});assert.equal(thirds(s).npc!.position,5);
  task(s,'thirds',{step:'turn-end',racerId:'r5'});assert.equal(thirds(s).npc!.position,5);assert.equal(s.racers.length,6);
});

test('three double: Alchemy Lab NPC acts after each racer turn without acquiring an extra player seat',()=>{
  const s=fixture(undefined,['alchemy-lab']);move(s,'r0',2);assert.equal(s.racers.length,6);s.flags.testDice=[1,2];
  task(s,'endTurn',{racerId:'r0'});assert.equal(twist(s).monster!.position,1);
  task(s,'endTurn',{racerId:'r1'});assert.equal(twist(s).monster!.position,3);assert.equal(s.racers.length,6);assert.equal(s.players.length,3);
});

test('three double: Bonkbug applies independently to the acting player’s teammate and an opposing racer',()=>{
  const s=fixture(undefined,['bonkbug']);move(s,'r0',2);move(s,'r1',23);move(s,'r3',21);assert.equal(s.racers[1]!.position,23);assert.equal(s.racers[3]!.position,23);
});

test('three double: Fans draws both compatible cards, filters event conflicts and Conveyor resets all six racers',()=>{
  const s=fixture('skipper',['fans','curse-wands','conveyor','bonkbug']);move(s,'r0',2);assert.deepEqual(twist(s).drawn,['fans','conveyor','bonkbug']);assert(s.racers.every(r=>r.position===1));assert.equal(s.racers.length,6);
});

test('three double: Mirror World keeps positions, reverses the finish and credits the owning players',()=>{
  const s=fixture(undefined,['mirror-world']);s.racers[1]!.position=0;s.racers[2]!.position=0;move(s,'r0',2);
  assert.equal(s.flags.twistReversed,true);assert.equal(s.racers[0]!.position,14);assert.equal(s.phase,'results');assert.deepEqual(s.players.map(p=>p.score),[3,1,0]);assert.equal(s.results[0]!.placements.length,2);
});

test('three double: Scrying Pool checks the modified racer move and leaves the same player’s other racer active',()=>{
  const s=fixture(undefined,['scrying-pool']);move(s,'r0',2);twist(s).conveyor=true;begin(s);roll(s,4);
  assert.equal(s.racers[0]!.eliminated,true);assert.equal(s.racers[1]!.eliminated,false);assert.equal(s.racers.filter(r=>!r.eliminated).length,5);
});

test('three double: Pinata excludes every occupied racer space and adds a chip to the correct player ledger',()=>{
  const s=fixture(undefined,['pinata']);[17,18,19,20,21].forEach((position,i)=>s.racers[i+1]!.position=position);move(s,'r0',2);
  for(const position of [14,17,18,19,20,21])assert(!twist(s).chips!.includes(position));assert.equal(s.players[0]!.score,0);
  move(s,'r0',1);assert.equal(s.players[0]!.score,1);assert.equal(s.scoreLedger![0]!.map,1);
});

test('three double: Roast Chicken advances all tied last racers, including the triggering player’s teammate',()=>{
  const s=fixture(undefined,['roast-chicken']);s.racers[2]!.position=5;move(s,'r0',2);assert.equal(s.racers[1]!.position,12);assert.equal(s.racers[2]!.position,12);assert.equal(s.racers[0]!.position,14);
});
