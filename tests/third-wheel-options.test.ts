import assert from 'node:assert/strict';
import test from 'node:test';
import { applyGameAction, createGame, resolveTasks } from '../src/engine/index.js';
import type { GameState } from '../src/shared/types.js';

function fixture(positions:number[]):GameState {
  const game=createGame(positions.map((_,seat)=>({id:`p${seat}`,name:`玩家${seat}`,seat,color:'#000',ready:true,connected:true,score:0,hand:[],used:[],selection:[]})),137);
  game.phase='race';game.track='mild';game.round=1;game.currentRacerId='r0';
  game.racers=positions.map((position,index)=>({id:`r${index}`,playerId:`p${index}`,characterId:index?'banana':'third-wheel',position,tripped:false,finished:false,eliminated:false,flags:{}}));
  game.baseTurnOrder=game.racers.map(racer=>racer.id);
  return game;
}
function begin(game:GameState){game.queue.push({kind:'beginTurn',racerId:'r0'});resolveTasks(game);}
function choose(game:GameState,id:string){assert(game.pending);applyGameAction(game,game.pending.playerId,{type:'choose',choiceId:game.pending.id,optionId:id});}

test('Third Wheel goes directly to its main roll when there is no two-racer space',()=>{
  for(const positions of [[0],[0,0,0],[2,8,12]]){
    const game=fixture(positions);begin(game);
    assert.equal(game.pending,undefined);assert.equal(game.flags.awaitRoll,true);
    assert.equal(game.currentRacerId,'r0');assert.equal(game.turnCount,1);
    assert.equal(game.randomLog.length,0);
    assert(!game.logs.some(event=>event.type==='power'&&event.cause==='third-wheel'));
    game.flags.testDice=[3];applyGameAction(game,'p0',{type:'roll'});
    assert.equal(game.racers[0]!.position,positions[0]!+3);
    assert.equal(game.logs.filter(event=>event.type==='move'&&event.cause==='main').length,1);
  }
});

test('Third Wheel does not count finished or eliminated racers as a teleport destination',()=>{
  for(const status of ['finished','eliminated'] as const){
    const game=fixture([2,8,8]);game.racers[2]![status]=true;begin(game);
    assert.equal(game.pending,undefined);assert.equal(game.flags.awaitRoll,true);
    assert.equal(game.racers[0]!.position,2);
  }
});

test('Third Wheel retains a legal teleport and normal main roll after restoring a choice',()=>{
  let game=fixture([2,8,8]);begin(game);
  assert.equal(game.pending?.kind,'third-wheel');
  assert.deepEqual(game.pending!.options.map(option=>option.id),['8','skip']);
  game=JSON.parse(JSON.stringify(game)) as GameState;choose(game,'8');
  assert.equal(game.racers[0]!.position,8);assert.equal(game.flags.awaitRoll,true);
  game.flags.testDice=[3];applyGameAction(game,'p0',{type:'roll'});
  assert.equal(game.racers[0]!.position,11);
  assert.equal(game.logs.filter(event=>event.type==='move'&&event.cause==='main').length,1);
});

test('Third Wheel still allows declining a legal teleport',()=>{
  const game=fixture([2,8,8]);begin(game);choose(game,'skip');
  assert.equal(game.racers[0]!.position,2);assert.equal(game.pending,undefined);
  assert.equal(game.flags.awaitRoll,true);
});
