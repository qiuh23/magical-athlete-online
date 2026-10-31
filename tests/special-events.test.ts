import assert from 'node:assert/strict';
import test from 'node:test';
import {applyGameAction,createGame,enqueueMove,enqueueWarp,resolveTasks,automaticAction,startGame} from '../src/engine/index.js';
import {THIRD_EVENTS,type ThirdEventId} from '../src/shared/special-events.js';
import {type ThirdsState} from '../src/engine/special-events.js';
import {projectRoom} from '../src/shared/room-core.js';
import {legacyRoomConfig} from '../src/shared/room-config.js';
import {presetCompetition,createMatchPlan} from '../src/shared/competition.js';
import {roomRules} from '../src/engine/runtime.js';
import {MAPS_RULES_VERSION} from '../src/shared/rules-versions.js';
import type {GameState,Player,Room} from '../src/shared/types.js';

function fixture(id:ThirdEventId,positions=[2,10,20],cards=['banana','banana','banana']){
 const players:Player[]=positions.map((_,i)=>({id:`p${i}`,name:`玩家${i}`,seat:i,color:'#123',isAI:true,connected:true,ready:true,score:0,hand:[],used:[],selection:[]}));
 const s=createGame(players,275);s.phase='race';s.round=1;s.currentRacerId='r0';s.racers=positions.map((position,i)=>({id:`r${i}`,playerId:`p${i}`,characterId:cards[i]??'banana',position,finished:false,eliminated:false,tripped:false,flags:{}}));s.baseTurnOrder=s.racers.map(r=>r.id);
 s.flags.thirds={id,round:1,held:{},extraCards:[]} satisfies ThirdsState;s.scoreLedger=players.map(p=>({playerId:p.id,placement:0,map:0,skill:0,event:0,total:0}));return s;
}
const data=(s:GameState)=>s.flags.thirds as ThirdsState;
function run(s:GameState,kind:string,extra={}){s.queue.push({kind,...extra});resolveTasks(s);}
function choose(s:GameState,id:string){assert(s.pending);applyGameAction(s,s.pending.playerId,{type:'choose',choiceId:s.pending.id,optionId:id});}
function roll(s:GameState,face:number){s.flags.testDice=[face];applyGameAction(s,s.racers.find(r=>r.id===s.currentRacerId)!.playerId,{type:'roll'});}
function begin(s:GameState){run(s,'beginTurn',{racerId:s.currentRacerId});}
function move(s:GameState,n:number,id='r0'){enqueueMove(s,id,n);resolveTasks(s);}
function room(s:GameState):Room{return {code:'EVT234',hostId:'p0',createdAt:1,updatedAt:1,version:1,maxPlayers:s.players.length,timeoutSeconds:0,deadline:null,game:s};}

test('public event guesses survive JSON recovery and are not visible to other players',()=>{
 let s=fixture('mastermind');begin(s);assert.equal(s.pending?.kind,'thirds-guess');choose(s,'4');
 const view=projectRoom(room(s),'p2',{authorityId:'p0',authorityOnline:true});assert(!JSON.stringify(view).includes('values'));assert(!view.logs.some(l=>l.type==='event-guesses'));assert.equal(data(s).guesses!.values.r1,4);
 s=JSON.parse(JSON.stringify(s));choose(s,'2');roll(s,4);assert.deepEqual(s.players.map(p=>p.score),[0,1,0]);assert.equal(s.scoreLedger![1]!.event,1);assert.equal(s.racers[0]!.position,6);
});
test('guessing rewards still settle if main movement ends the race',()=>{
 const s=fixture('mastermind',[28,30,15]);s.racers[1]!.finished=true;s.racers[1]!.rank=1;s.flags.placements=[{racerId:'r1',playerId:'p1',characterId:'banana',rank:1,points:3}];begin(s);choose(s,'2');roll(s,2);assert.equal(s.phase,'results');assert.equal(s.players[2]!.score,1);assert.equal(s.results[0]!.scores![2]!.event,1);
});
test('Genius uses secret two/four/six and the correct beneficiary without a die',()=>{
 const s=fixture('genius');begin(s);choose(s,'6');assert(!JSON.stringify(projectRoom(room(s),'p1',{authorityId:'p0',authorityOnline:true})).includes('"secret":6'));choose(s,'6');assert.equal(s.racers[0]!.position,2);assert.equal(s.racers[1]!.position,16);assert.equal(s.randomLog.length,0);
});
test('Sisyphus event pays once, charges actual rerolls and preserves ledger after recovery',()=>{
 let s=fixture('sisyphus');run(s,'thirds',{step:'setup'});assert(s.players.every(p=>p.score===3));begin(s);roll(s,4);assert.equal(s.pending?.kind,'thirds-pay');s=JSON.parse(JSON.stringify(s));s.flags.testDice=[2];choose(s,'use');for(let i=0;i<3;i++)choose(s,'skip');assert.deepEqual(s.players.map(p=>p.score),[2,3,3]);assert.equal(s.racers[0]!.position,4);assert.deepEqual(s.scoreLedger!.map(e=>e.event),[2,3,3]);
});
test('Lovable Loser continues past first two finishes then awards only the last two',()=>{
 const s=fixture('lovable-loser',[29,29,29,1]);move(s,1);assert.equal(s.phase,'race');assert(s.players.every(p=>p.score===0));move(s,1,'r1');assert.equal(s.phase,'race');move(s,1,'r2');assert.equal(s.phase,'results');assert.deepEqual(s.results[0]!.placements.map(p=>p.racerId),['r3','r2']);assert.deepEqual(s.players.map(p=>p.score),[0,0,1,3]);
});
test('Legs time marker awards leading racers, resolves ties, and never enters racer list',()=>{
 const s=fixture('legs',[15,15,5]);data(s).npc={id:'legs',position:25};data(s).acted=['p0','p1'];s.flags.testDice=[2,6];run(s,'thirds',{step:'turn-end',racerId:'r2'});assert.equal(s.phase,'results');assert.equal(s.racers.length,3);assert.deepEqual(s.results[0]!.placements.map(p=>p.racerId),['r1','r0']);
});
test('Huge Baby resolves the push before main movement; Gunk rerolls before moving',()=>{
 const s=fixture('huge-baby');run(s,'thirds',{step:'setup'});begin(s);roll(s,1);assert.equal(s.racers[0]!.position,1);assert.equal(data(s).npc!.position,2);
 const g=fixture('gunk');begin(g);g.flags.testDice=[5,2];applyGameAction(g,'p0',{type:'roll'});assert.equal(g.racers[0]!.position,3);assert.deepEqual(g.randomLog.map(l=>l.value),[5,2]);
});
test('Third-wheel and Romantic exchange cards and private resources but retain turn ownership',()=>{
 const s=fixture('romantic',[2,4,20],['banana','legs','sisyphus']);s.racers[0]!.flags.thirdsReady=true;s.racers[1]!.flags.secretLeafHand=['coach'];move(s,2);assert.equal(s.racers[0]!.characterId,'legs');assert.deepEqual(s.racers[0]!.flags.secretLeafHand,['coach']);assert.equal(s.racers[0]!.playerId,'p0');assert.equal(s.racers[0]!.flags.thirdsReady,true);assert.equal(s.racers[1]!.flags.thirdsReady,undefined);
 const t=fixture('third-wheel',[2,9,20],['banana','legs','sisyphus']);move(t,3);assert.deepEqual(t.racers.map(r=>r.characterId),['sisyphus','banana','legs']);
});
test('Inchworm makes 15 the actual start for backward movement and return-to-start skills',()=>{
 const s=fixture('inchworm',[0,0,0],['sisyphus','banana','banana']);run(s,'thirds',{step:'setup'});move(s,-10);assert.equal(s.racers[0]!.position,15);s.racers[0]!.position=20;begin(s);roll(s,6);assert.equal(s.racers[0]!.position,15);
});
test('event NPC stops and trampolines execute normal movement, trip and event income',()=>{
 const p=fixture('party-animal');run(p,'thirds',{step:'setup'});move(p,1);assert.equal(p.players[0]!.score,1);assert.equal(p.scoreLedger![0]!.event,1);assert.equal(data(p).npc!.position,6);
 const e=fixture('egg');run(e,'thirds',{step:'setup'});move(e,3);assert.equal(e.racers[0]!.position,0);assert.equal(data(e).npc!.position,10);
 const b=fixture('banana');data(b).trampolines=[4,15,25];move(b,2);assert.equal(b.racers[0]!.position,6);assert(b.racers[0]!.tripped);
});
test('new plans persist selected event rounds and old maps-v1 cannot execute them',()=>{
 const c={...legacyRoomConfig(),competition:{...presetCompetition(),thrillingThirds:{enabled:true,rounds:[3]}}};const s=createGame(fixture('stickler').players);s.config=c;startGame(s);assert.deepEqual(s.matchPlan!.races.map(r=>r.specialEvent),[null,null,'thrilling-thirds',null]);const old=structuredClone(s);old.rulesVersion=MAPS_RULES_VERSION;assert.throws(()=>roomRules(old),/不兼容/);
});

test('two-player Centaur reserves one card per controller and grants it to both racers',()=>{const s=fixture('centaur',[0,0,0,0]);s.players=s.players.slice(0,2);s.racers.forEach((r,i)=>r.playerId=`p${Math.floor(i/2)}`);s.deck=['coach','legs','hare'];run(s,'thirds',{step:'setup'});assert.deepEqual(data(s).extraCards,['coach','legs']);assert.deepEqual(s.racers.map(r=>r.flags.acquiredPowers),[['coach'],['coach'],['legs'],['legs']]);assert.deepEqual(s.deck,['hare']);});
test('Copycat returns its previous event card and never draws another racer or private hand',()=>{const s=fixture('copycat');s.deck=['banana','legs','coach','hare'];s.racers[1]!.flags.secretLeafHand=['legs'];begin(s);assert.equal(data(s).held.r0,'coach');assert.equal(s.racers[0]!.flags.power,'coach');begin(s);assert.equal(data(s).held.r0,'hare');assert(s.discard.includes('coach'));assert.deepEqual(s.racers[1]!.flags.secretLeafHand,['legs']);});
test('Rocket option uses both dice once then trips; Flip-Flop swaps others before the main move',()=>{const s=fixture('rocket-scientist');begin(s);s.flags.testDice=[2,3];choose(s,'use');assert.equal(s.racers[0]!.position,7);assert(s.racers[0]!.tripped);assert.deepEqual(s.randomLog.map(l=>l.value),[2,3]);const f=fixture('flip-flop');begin(f);choose(f,'r1');choose(f,'r2');assert.deepEqual(f.racers.map(r=>r.position),[2,20,10]);assert(f.flags.awaitRoll);});
test('Rocket replacement is rolled main movement, so a tripped Penguin doubles it and then recovers',()=>{
 const s=fixture('rocket-scientist',[2,15,20],['penguin','banana','banana']);s.racers[0]!.tripped=true;begin(s);s.flags.testDice=[2,3];choose(s,'use');
 assert.equal(s.racers[0]!.position,12);assert.equal(s.lastRoll?.distance,10);assert.equal(s.racers[0]!.tripped,false);assert.deepEqual(s.randomLog.map(l=>l.value),[2,3]);
});
test('event Duel uses retained dice and Suckerfish persists a followed branch',()=>{const d=fixture('duelist',[2,5,20]);move(d,3);assert.equal(d.pending?.kind,'thirds-duel');d.flags.testDice=[2];choose(d,'3');assert(d.racers[1]!.tripped);let f=fixture('suckerfish',[2,2,20]);move(f,3);assert.equal(f.pending?.kind,'thirds-fish');f=JSON.parse(JSON.stringify(f));choose(f,'r1');assert.deepEqual(f.racers.map(r=>r.position),[5,5,20]);});
test('Suckerfish event carries from the start and partners can carry each other on consecutive turns after recovery',()=>{
 let s=fixture('suckerfish',[0,0,0]);begin(s);roll(s,3);
 assert.equal(s.pending?.kind,'thirds-fish');assert.equal(s.pending?.playerId,'p0');assert.deepEqual(s.pending?.options.map(o=>o.id),['skip','r1','r2']);
 assert.deepEqual(s.racers.map(r=>r.position),[0,0,0],'the first move waits for the starting-line passenger choice');
 s=JSON.parse(JSON.stringify(s));choose(s,'r1');assert.deepEqual(s.racers.map(r=>r.position),[3,3,0]);assert.equal(s.currentRacerId,'r1');
 applyGameAction(s,'p0',{type:'next'});roll(s,2);
 assert.equal(s.pending?.kind,'thirds-fish');assert.equal(s.pending?.playerId,'p1');assert.deepEqual(s.pending?.options.map(o=>o.id),['skip','r0']);
 s=JSON.parse(JSON.stringify(s));choose(s,'r0');assert.deepEqual(s.racers.map(r=>r.position),[5,5,0]);
 assert.deepEqual(s.logs.filter(l=>l.type==='move').map(l=>l.targets),[['r0','r1'],['r1','r0']]);assert.equal(s.phase,'race');assert(!s.logs.some(l=>l.type==='loop'));
});
test('Suckerfish event carries only one live same-space passenger and awards the moving leader first at the finish',()=>{
 const s=fixture('suckerfish',[29,29,29,20]);s.racers[2]!.eliminated=true;move(s,1,'r1');
 assert.equal(s.pending?.kind,'thirds-fish');assert.equal(s.pending?.playerId,'p1');assert.deepEqual(s.pending?.options.map(o=>o.id),['skip','r0']);choose(s,'r0');
 assert.equal(s.phase,'results');assert.deepEqual(s.results[0]!.placements.map(p=>p.racerId),['r1','r0']);assert.equal(s.racers[3]!.position,20);
});
test('Suckerfish event can decline at the start and does not carry passengers on warps or zero movement',()=>{
 const skipped=fixture('suckerfish',[0,0,0]);move(skipped,2);choose(skipped,'skip');assert.deepEqual(skipped.racers.map(r=>r.position),[2,0,0]);assert.equal(skipped.pending,undefined);
 const warped=fixture('suckerfish',[0,0,0]);enqueueWarp(warped,'r0',4);resolveTasks(warped);assert.equal(warped.pending,undefined);assert.deepEqual(warped.racers.map(r=>r.position),[4,0,0]);
 const still=fixture('suckerfish',[0,0,0]);move(still,0);assert.equal(still.pending,undefined);assert.deepEqual(still.racers.map(r=>r.position),[0,0,0]);
});
test('same Boardwalks fork selected repeatedly cannot reset public Blimp or Whisper loop detection',()=>{
 for(const whisper of [false,true]){const s=fixture(whisper?'stickler':'blimp',[17,17,25],[whisper?'extra-mile-whisper':'banana','banana','banana']);s.track='boardwalks';if(!whisper)data(s).npc={id:'blimp',position:17};move(s,1);for(let i=0;s.pending&&i<12;i++)choose(s,'18');assert.equal(s.pending,undefined);assert.equal(s.phase,'race');assert(s.logs.some(l=>l.type==='loop'));assert(s.logs.length<100);}
});

for(const id of Object.keys(THIRD_EVENTS) as ThirdEventId[])test(`event ${id}: complete a race through serialized choices and the normal game scheduler`,()=>{
 let s=fixture(id,[2,10,20],['banana','romantic','scoocher']);s.deck=['coach','hare','alchemist','legs','rocket-scientist','duelist','inchworm','huge-baby'];run(s,'thirds',{step:'setup'});s.flags.needsBegin=true;
 for(let steps=0;s.phase==='race';steps++){
   assert(steps<1000,`${id}: stuck ${s.pending?.kind}/${s.racers.map(r=>r.position)}`);
   if(steps%7===0)s=JSON.parse(JSON.stringify(s));
   const next=automaticAction(s);assert(next,`${id}: no legal action`);applyGameAction(s,next.playerId,next.action);
   assert.notEqual(s.phase,'paused',JSON.stringify(s.flags.ruleHold));
 }
 assert.equal(s.phase,'results');assert.equal(s.results.length,1);assert(s.scoreLedger!.every(e=>e.total===s.players.find(p=>p.id===e.playerId)!.score));assert.deepEqual(data(s).held,{});assert.deepEqual(data(s).extraCards,[]);
});
