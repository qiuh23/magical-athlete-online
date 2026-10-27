import assert from 'node:assert/strict';
import test from 'node:test';
import { applyGameAction, createGame, enqueueMove, publicTrackState, resolveTasks } from '../src/engine/index.js';
import type { ThirdsState } from '../src/engine/special-events.js';
import type { TwistState } from '../src/engine/twist-cards.js';
import type { ThirdEventId } from '../src/shared/special-events.js';
import type { TwistCardId } from '../src/shared/twists.js';
import type { GameState } from '../src/shared/types.js';

function fixture(event:ThirdEventId,cards:TwistCardId[],positions=[12,5,22]){
  const s=createGame(positions.map((_,i)=>({id:`p${i}`,name:`玩家${i}`,seat:i,color:'#000',ready:true,connected:true,score:0,hand:[],used:[],selection:[]})),19);
  s.phase='race';s.round=1;s.track='twisty-twirl';s.currentRacerId='r0';
  s.racers=positions.map((position,i)=>({id:`r${i}`,playerId:`p${i}`,characterId:'banana',position,finished:false,eliminated:false,tripped:false,flags:{}}));
  s.baseTurnOrder=s.racers.map(r=>r.id);
  s.flags.thirds={id:event,round:1,held:{},extraCards:[]} satisfies ThirdsState;
  s.flags.twist={triggered:false,deck:cards,drawn:[]} satisfies TwistState;
  s.scoreLedger=s.players.map(p=>({playerId:p.id,placement:0,map:0,skill:0,event:0,total:0}));
  return s;
}
const twists=(s:GameState)=>s.flags.twist as TwistState;
const thirds=(s:GameState)=>s.flags.thirds as ThirdsState;
function move(s:GameState,id:string,n:number){enqueueMove(s,id,n);resolveTasks(s);}
function choose(s:GameState,id:string){assert(s.pending);applyGameAction(s,s.pending.playerId,{type:'choose',choiceId:s.pending.id,optionId:id});}
function roll(s:GameState,face:number){s.flags.needsBegin=false;s.queue.push({kind:'beginTurn',racerId:s.currentRacerId});resolveTasks(s);s.flags.testDice=[face];applyGameAction(s,s.racers.find(r=>r.id===s.currentRacerId)!.playerId,{type:'roll'});}

test('Lovable Loser excludes Season Finale and still awards the last two racers once',()=>{
  const s=fixture('lovable-loser',['season-finale','bonkbug'],[12,29,29,1]);
  move(s,'r0',2);assert.deepEqual(twists(s).drawn,['bonkbug']);assert.equal(twists(s).finale,undefined);
  move(s,'r0',16);move(s,'r1',1);assert.equal(s.phase,'race');assert(s.players.every(p=>p.score===0));
  move(s,'r2',1);assert.equal(s.phase,'results');assert.deepEqual(s.results[0]!.placements.map(p=>p.racerId),['r3','r2']);
  assert.deepEqual(s.players.map(p=>p.score),[0,0,1,3]);assert.deepEqual(s.results[0]!.scores!.map(p=>p.placement),[0,0,1,3]);
});

test('Legs excludes Season Finale and its timer settles the existing race without a restart',()=>{
  const s=fixture('legs',['season-finale','bonkbug']);thirds(s).npc={id:'legs',position:25};thirds(s).acted=['p0','p1'];
  move(s,'r0',2);assert.deepEqual(twists(s).drawn,['bonkbug']);
  s.queue.push({kind:'thirds',step:'turn-end',racerId:'r2'});resolveTasks(s);
  assert.equal(s.phase,'results');assert.deepEqual(s.results[0]!.placements.map(p=>p.racerId),['r2','r0']);
  assert.deepEqual(s.players.map(p=>p.score),[1,0,3]);assert.equal(twists(s).finale,undefined);
});

test('Cheerleader excludes Curse Wands and always gives the last racer the next turn',()=>{
  const s=fixture('cheerleader',['curse-wands','bonkbug']);move(s,'r0',2);
  s.queue.push({kind:'advance',racerId:'r0'});resolveTasks(s);
  assert.deepEqual(twists(s).drawn,['bonkbug']);assert.equal(s.currentRacerId,'r1');assert.equal(s.randomLog.length,0);
});

test('Skipper excludes Curse Wands so a five really reverses the next turn',()=>{
  const s=fixture('skipper',['curse-wands','bonkbug']);move(s,'r0',2);roll(s,5);
  assert.deepEqual(twists(s).drawn,['bonkbug']);assert.equal(thirds(s).direction,-1);assert.equal(s.currentRacerId,'r2');
  assert.deepEqual(s.randomLog.map(d=>d.value),[5]);
});

test('Leaptoad excludes Curse Wands and retains the extra turn from landing with another racer',()=>{
  const s=fixture('leaptoad',['curse-wands','bonkbug'],[12,16,22]);move(s,'r0',2);roll(s,2);
  assert.deepEqual(twists(s).drawn,['bonkbug']);assert.equal(s.racers[0]!.position,16);assert.equal(s.currentRacerId,'r0');assert(s.flags.needsBegin);
});

test('Inchworm excludes Mirror World even when a saved draw was already queued',()=>{
  let s=fixture('inchworm',['mirror-world','bonkbug'],[15,20,25]);s.flags.thirdsStart=15;thirds(s).newStart=15;
  twists(s).triggered=true;s.queue.push({kind:'twist',step:'draw',triggerId:'r0'});s=JSON.parse(JSON.stringify(s));resolveTasks(s);
  assert.deepEqual(twists(s).drawn,['bonkbug']);assert(!s.flags.twistReversed);assert.equal(s.flags.thirdsStart,15);assert.equal(s.phase,'race');
});

test('Conveyor uses Inchworm\'s actual start and backward movement still stops at that start',()=>{
  const s=fixture('inchworm',['conveyor'],[20,18,23]);s.flags.thirdsStart=15;thirds(s).newStart=15;
  twists(s).triggered=true;s.queue.push({kind:'twist',step:'draw',triggerId:'r0'});resolveTasks(s);
  assert.deepEqual(twists(s).drawn,['conveyor']);assert.deepEqual(s.racers.map(r=>r.position),[16,16,16]);
  move(s,'r0',-5);assert.equal(s.racers[0]!.position,15);roll(s,1);assert.equal(s.lastRoll?.distance,4);assert.equal(s.racers[0]!.position,19);
});

test('Fans draws two compatible cards across a private choice and JSON recovery without spending a draw on exclusions',()=>{
  let s=fixture('lovable-loser',['fans','season-finale','swap-meet','conveyor']);s.deck=['coach','legs','alchemist'];
  move(s,'r0',2);assert.equal(s.pending?.kind,'twist-swap');assert.deepEqual(twists(s).drawn,['fans','swap-meet']);
  s=JSON.parse(JSON.stringify(s));choose(s,'keep');choose(s,'keep');choose(s,'keep');
  assert.deepEqual(twists(s).drawn,['fans','swap-meet','conveyor']);assert.deepEqual(s.racers.map(r=>r.position),[1,1,1]);
  assert.equal(twists(s).finale,undefined);assert.equal(s.pending,undefined);assert.equal(s.phase,'race');
  assert(!s.logs.some(e=>e.type==='twist'&&e.cause==='season-finale'));assert.deepEqual(publicTrackState(s).twist!.drawn,twists(s).drawn);
});

test('An exhausted compatible deck does not apply the forbidden card or invent a replacement',()=>{
  const s=fixture('lovable-loser',['season-finale']);move(s,'r0',2);
  assert.deepEqual(twists(s).drawn,[]);assert.deepEqual(twists(s).deck,[]);assert.equal(twists(s).finale,undefined);assert.equal(s.phase,'race');assert.equal(s.randomLog.length,0);
});

test('The same athlete ability does not exclude Season Finale when the public event is compatible',()=>{
  const s=fixture('stickler',['season-finale'],[12,25,10]);s.racers[2]!.characterId='lovable-loser';
  move(s,'r0',2);assert.deepEqual(twists(s).drawn,['season-finale']);assert.equal(twists(s).finale!.stage,'qualifying');
  move(s,'r0',16);move(s,'r1',5);assert.equal(twists(s).finale!.stage,'duel');assert.equal(s.currentRacerId,'r0');
  assert.deepEqual(s.racers.slice(0,2).map(r=>r.position),[15,15]);assert(s.players.every(p=>p.score===0));
});

test('Cheerleader keeps the announced first finalist, then gives the trailing finalist the next turn',()=>{
  const s=fixture('cheerleader',['season-finale'],[12,25,10]);move(s,'r0',2);move(s,'r0',16);move(s,'r1',5);
  assert.equal(twists(s).finale!.stage,'duel');assert.equal(s.currentRacerId,'r0');
  roll(s,1);assert.equal(s.racers[0]!.position,16);assert.equal(s.currentRacerId,'r1');assert.equal(s.phase,'race');
});

test('Fixed effect dice still allow Cheerleader and the Legs timer to break ties with real comparison dice',()=>{
  const c=fixture('cheerleader',[],[15,5,5]);twists(c).fixedFaces={p0:4,p1:4,p2:4};c.flags.testDice=[2,6];
  c.queue.push({kind:'advance',racerId:'r0'});resolveTasks(c);assert.equal(c.currentRacerId,'r2');assert.deepEqual(c.randomLog.map(d=>d.value),[2,6]);
  const l=fixture('legs',[],[15,15,5]);twists(l).fixedFaces={p0:4,p1:4,p2:4};l.flags.testDice=[2,6];
  thirds(l).npc={id:'legs',position:25};thirds(l).acted=['p0','p1'];l.queue.push({kind:'thirds',step:'turn-end',racerId:'r2'});resolveTasks(l);
  assert.equal(l.phase,'results');assert.deepEqual(l.results[0]!.placements.map(p=>p.racerId),['r1','r0']);assert.deepEqual(l.randomLog.map(d=>d.value),[2,6]);
});

test('The public event description explains the applicable card restriction without showing the deck',()=>{
  const s=fixture('lovable-loser',['season-finale','bonkbug']);const shown=publicTrackState(s);
  assert.match(shown.event!.description,/季终决战/);assert(!JSON.stringify(shown).includes('"deck"'));
  s.track='mild';assert.doesNotMatch(publicTrackState(s).event!.description,/季终决战/);
});
