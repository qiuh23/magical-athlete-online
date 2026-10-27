import assert from 'node:assert/strict';
import test from 'node:test';
import {applyGameAction,createGame,enqueueMove,resolveTasks} from '../src/engine/index.js';
import type {GameState,Player} from '../src/shared/types.js';

const E=(id:string)=>`extra-mile-${id}`;
function fixture(ids:string[],positions=ids.map((_,i)=>1+i*6)){
  const players:Player[]=ids.map((_,i)=>({id:`p${i}`,name:`玩家${i}`,seat:i,color:'#123',ready:true,connected:true,score:2,hand:[],used:[],selection:[]}));
  const s=createGame(players,456,'multiplayer','mixed');s.phase='race';s.round=1;s.currentRacerId='r0';
  s.racers=ids.map((characterId,i)=>({id:`r${i}`,playerId:`p${i}`,characterId,position:positions[i]!,tripped:false,finished:false,eliminated:false,flags:{}}));s.baseTurnOrder=s.racers.map(r=>r.id);return s;
}
function begin(s:GameState,id='r0'){s.currentRacerId=id;s.flags.needsBegin=false;s.queue.push({kind:'beginTurn',racerId:id});resolveTasks(s);}
function choose(s:GameState,id:string){assert(s.pending);applyGameAction(s,s.pending.playerId,{type:'choose',choiceId:s.pending.id,optionId:id});}
function moves(s:GameState,cause:string){return s.logs.filter(e=>e.type==='move'&&e.cause===cause);}

test('Moneybags is one completed ability: alone it does not meet Pooh second-ability threshold',()=>{
  const s=fixture([E('moneybags'),E('pooh'),'alchemist']);begin(s);choose(s,'4');
  assert.equal(s.players[0]!.score,1);assert.equal(s.racers[0]!.position,5);assert.equal(s.flags.fanTurnPowerCount,1);assert.equal(moves(s,E('pooh')).length,0);assert.equal(s.randomLog.length,0);
});

test('Moneybags and Gunk complete two abilities, then Pooh reacts once, including JSON recovery',()=>{
  let s=fixture([E('moneybags'),E('pooh'),'gunk']);begin(s);const choice=s.pending!.id;s=JSON.parse(JSON.stringify(s));assert.equal(s.pending!.id,choice);choose(s,'4');
  assert.equal(s.racers[0]!.position,4);assert.equal(s.racers[1]!.position,8);assert.equal(moves(s,E('pooh')).length,1);assert.equal(s.flags.fanTurnPowerCount,2);assert.equal(s.randomLog.length,0);
  const main=moves(s,'main')[0]!,bear=moves(s,E('pooh'))[0]!;assert(main.id<bear.id);
  begin(s);choose(s,'4');assert.equal(moves(s,E('pooh')).length,2);assert.equal(s.flags.fanTurnPowerCount,2,'completion counter resets each turn');
});

test('declining Moneybags, or having no point to pay, does not activate it or move Pooh',()=>{
  for(const score of [0,2]){const s=fixture([E('moneybags'),E('pooh'),'alchemist']);s.players[0]!.score=score;begin(s);if(score)choose(s,'skip');assert(s.flags.awaitRoll);assert.equal(s.flags.fanTurnPowerCount,0);assert.equal(moves(s,E('pooh')).length,0);assert.equal(s.players[0]!.score,score);}
});

test('blocked Moneybags does not count as completed; Fox alone cannot move Pooh',()=>{
  const s=fixture([E('moneybags'),E('pooh'),E('mr-fox')]);begin(s);choose(s,'4');assert.equal(s.pending?.kind,'em-fox');choose(s,'block');
  assert.equal(s.racers[0]!.position,1);assert.equal(s.flags.fanTurnPowerCount,1);assert.equal(moves(s,E('pooh')).length,0);assert(s.flags.awaitRoll);
});

for(const [power,others,expected,count,responses] of [['blimp',[15,24],9,2,1],['hare',[15,24],8,2,1],['party-animal',[1,24],8,3,2],['gloth',[15,24],5,2,1],['icarus',[15,24],9,2,1],['overtaker',[15,24],8,2,1]] as const)test(`Pooh with acquired Moneybags counts its actual ${power} modifier`,()=>{
  const s=fixture([E('pooh'),'alchemist','alchemist'],[1,...others]);s.racers[0]!.flags.acquiredPowers=[E('moneybags'),power];begin(s);choose(s,'4');
  assert.equal(s.racers[0]!.position,expected);assert.equal(moves(s,E('pooh')).length,responses);assert.equal(s.flags.fanTurnPowerCount,count);assert.equal(s.randomLog.length,0);
});

for(const [ids,current,first] of [
  [['alchemist',E('pooh'),'scoocher'],'r0','r1'],
  [['alchemist','scoocher',E('pooh')],'r0','r1'],
  [['alchemist','scoocher',E('pooh')],'r2','r2'],
] as const)test(`Pooh and Scoocher share clockwise completion priority: ${ids}, active ${current}`,()=>{
  const s=fixture([...ids],[1,29,29]);s.currentRacerId=current;s.flags.fanTurnPowerCount=1;s.queue=[{kind:'powerDone',racerId:'r0',power:E('moneybags')}];resolveTasks(s);
  const reaction=s.logs.find(e=>e.type==='power');assert.equal(reaction?.source,first);assert.equal(s.results[0]?.placements[0]?.racerId,first);
});

test('a field die and Triangle finish before Moneybags is offered, and their real abilities link to Pooh',()=>{
  const s=fixture([E('moneybags'),E('pooh'),'leaf-triangle-man','alchemist'],[1,10,8,22]);
  s.flags.thirds={id:'mouth',round:1,held:{},extraCards:[],npc:{id:'mouth',position:30}};s.flags.testDice=[3];begin(s);
  assert.equal(s.pending?.kind,'em-moneybags');assert.equal(s.racers[2]!.position,9);assert.equal(s.racers[1]!.position,10);assert.equal(s.flags.fanTurnPowerCount,1);choose(s,'4');
  assert.equal(s.racers[1]!.position,11);assert.equal(s.randomLog.length,1);assert.equal(moves(s,E('pooh')).length,1);
  const npc=s.logs.find(e=>e.type==='event-marker')!,money=s.logs.find(e=>e.type==='power'&&e.cause===E('moneybags'))!;assert(npc.id<money.id);
});

test('an NPC field effect alone does not count as a racer ability for Pooh',()=>{
  const s=fixture([E('moneybags'),E('pooh'),'alchemist']);s.flags.thirds={id:'mouth',round:1,held:{},extraCards:[],npc:{id:'mouth',position:30}};s.flags.testDice=[4];begin(s);choose(s,'4');assert.equal(s.flags.fanTurnPowerCount,1);assert.equal(moves(s,E('pooh')).length,0);assert.equal(s.randomLog.length,1);
});

test('same landing resolves the event NPC before current-player Romantic',()=>{
  const s=fixture(['romantic','alchemist','alchemist'],[20,2,5]);s.flags.thirds={id:'baba-yaga',round:1,held:{},extraCards:[],npc:{id:'baba-yaga',position:5}};enqueueMove(s,'r1',3);resolveTasks(s);
  const trip=s.logs.find(e=>e.type==='trip'&&e.targets?.includes('r1'))!,romantic=s.logs.find(e=>e.type==='power'&&e.cause==='romantic')!;
  assert(trip&&romantic);assert(trip.id<romantic.id,'public field effects precede player abilities');
});

test('event choice opens before player reactions and survives a refresh',()=>{
  let s=fixture(['romantic','alchemist','alchemist'],[20,2,5]);s.flags.thirds={id:'duelist',round:1,held:{},extraCards:[]};enqueueMove(s,'r1',3);resolveTasks(s);
  assert.equal(s.pending?.kind,'thirds-duel');assert.equal(s.racers[0]!.position,20);s=JSON.parse(JSON.stringify(s));s.flags.testDice=[4];choose(s,'4');assert.equal(s.racers[0]!.position,22);assert.equal(s.randomLog.length,1);
});

test('end-of-turn event marker waits for Moneybags and Pooh consequences',()=>{
  const s=fixture([E('moneybags'),E('pooh'),'gunk']);s.flags.thirds={id:'legs',round:1,held:{},extraCards:[],npc:{id:'legs',position:0},acted:['p1','p2']};begin(s);choose(s,'4');
  const bear=moves(s,E('pooh'))[0]!,marker=s.logs.find(e=>e.type==='event-marker')!;assert(bear&&marker);assert(bear.id<marker.id);assert.equal(s.racers[1]!.position,8);
});

test('a landing replaced by a track effect cannot replay its old Romantic or event contact',()=>{
  const s=fixture(['romantic','alchemist','alchemist'],[20,26,28]);s.track='twisty-twirl';
  s.flags.twist={triggered:true,deck:[],drawn:[],bonkbug:true};s.flags.thirds={id:'baba-yaga',round:1,held:{},extraCards:[],npc:{id:'baba-yaga',position:28}};
  enqueueMove(s,'r1',2);resolveTasks(s);assert.equal(s.racers[1]!.position,23);assert.equal(s.racers[1]!.tripped,false);assert.equal(s.racers[0]!.position,20);assert.equal(moves(s,'romantic').length,0);
});

test('a field marker move replaces the landing before character stop effects are inspected',()=>{
  const s=fixture(['romantic','alchemist','alchemist'],[20,2,5]);s.flags.thirds={id:'blimp',round:1,held:{},extraCards:[],npc:{id:'blimp',position:5}};enqueueMove(s,'r1',3);resolveTasks(s);assert.equal(s.racers[1]!.position,6);assert.equal(s.racers[0]!.position,20);assert.equal(moves(s,'romantic').length,0);
});

for(const first of ['r1','r2'])test(`same-player completion observers keep the fixed racer order: ${first}`,()=>{
  const s=fixture(['alchemist',E('pooh'),'scoocher'],[1,29,29]);s.racers[2]!.playerId='p1';s.baseTurnOrder=['r0',first,first==='r1'?'r2':'r1'];s.flags.fanTurnPowerCount=1;s.queue=[{kind:'powerDone',racerId:'r0',power:E('moneybags')}];resolveTasks(s);assert.equal(s.logs.find(e=>e.type==='power')?.source,first);
});

test('a modifier with no applicable bonus does not invent an extra completion for Pooh',()=>{
  const s=fixture([E('pooh'),'alchemist','alchemist'],[15,2,4]);s.racers[0]!.flags.acquiredPowers=[E('moneybags'),'overtaker'];begin(s);choose(s,'4');assert.equal(s.racers[0]!.position,19);assert.equal(s.flags.fanTurnPowerCount,1);assert.equal(moves(s,E('pooh')).length,0);
});

test('field card swaps and an arrow close a real forced response loop without losing the remaining turn',()=>{
  const s=fixture(['wurstii-piranha-plant','wurstii-mr-game-and-watch','alchemist'],[17,17,5]);s.track='boardwalks';s.currentRacerId='r2';s.flags.thirds={id:'romantic',round:1,held:{},extraCards:[]};const rng=s.rngState;
  s.queue=[{kind:'ability',racerId:'r1',power:'wurstii-mr-game-and-watch',effects:[{kind:'move',racerId:'r1',distance:1,cause:'wurstii-mr-game-and-watch'}]},{kind:'mainReady',racerId:'r2'}];resolveTasks(s);
  for(let action=0;s.pending?.kind==='track-branch'&&action<10;action++)choose(s,s.pending.options.some(o=>o.id==='17')?'17':s.pending.options[0]!.id);
  assert.equal(s.phase,'race');assert(s.logs.some(e=>e.type==='loop'));assert.equal(s.flags.awaitRoll,true);assert.equal(s.rngState,rng);assert.equal(s.randomLog.length,0);assert.equal(s.queue.length,0);
});
