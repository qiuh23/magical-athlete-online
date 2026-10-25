import assert from 'node:assert/strict';
import test from 'node:test';
import {applyGameAction,createGame,publicTrackState,resolveTasks,systemAction} from '../src/engine/index.js';
import {completeBeat,createPlayback,presentationActor,presentedTrackState,receiveRoom} from '../src/client/presentation.js';
import {immediateRoomAction} from '../src/shared/automation.js';
import {THIRD_EVENTS} from '../src/shared/special-events.js';
import type {GameState,Room,RoomView} from '../src/shared/types.js';

function fixture(ids:string[],positions:number[]){
  const players=ids.map((_,i)=>({id:`p${i}`,name:`玩家${i}`,seat:i,color:'#123',ready:true,connected:true,score:0,hand:[],used:[],selection:[]}));
  const game=createGame(players,123,'multiplayer','mixed');game.phase='race';game.round=1;game.currentRacerId='r0';
  game.racers=ids.map((characterId,i)=>({id:`r${i}`,playerId:`p${i}`,characterId,position:positions[i]!,tripped:false,finished:false,eliminated:false,flags:{}}));
  game.baseTurnOrder=game.racers.map(r=>r.id);game.queue=[{kind:'beginTurn',racerId:'r0'}];resolveTasks(game);return game;
}
function view(game:GameState,version=1):RoomView{return structuredClone({code:'DICE',version,hostId:'p0',selfId:'p0',maxPlayers:3,timeoutSeconds:0,deadline:null,phase:game.phase,round:game.round,track:game.track,players:[],racers:game.racers,currentRacerId:game.currentRacerId,logs:game.logs,results:game.results,lastRoll:game.lastRoll,rulesStatus:'',trackState:publicTrackState(game)});}
function roll(game:GameState,...faces:number[]){game.flags.testDice=faces;applyGameAction(game,'p0',{type:'roll'});}
function choose(game:GameState,optionId:string){assert(game.pending);applyGameAction(game,game.pending.playerId,{type:'choose',choiceId:game.pending.id,optionId});}

for(const response of ['use','skip'])test(`raw-die reaction precedes Suckerfish ${response}, and resuming it never rolls again`,()=>{
  let game=fixture(['banana','leaf-triangle-man','suckerfish'],[0,5,5]);
  const initial=view(game);roll(game,3);
  assert.equal(game.pending?.kind,'suckerfish');assert.equal(game.randomLog.length,1);
  let playback=receiveRoom(createPlayback(initial),view(game,2));
  assert.equal(playback.queue[0]?.kind,'dice');assert.equal(playback.queue[0]?.source,'r0');
  assert.equal(playback.queue[1]?.cause,'leaf-triangle-man');
  while(playback.queue.length)playback=completeBeat(playback);
  game=JSON.parse(JSON.stringify(game));choose(game,response);
  playback=receiveRoom(playback,view(game,3));
  assert(!playback.queue.some(beat=>beat.kind==='dice'));
  assert.equal(game.randomLog.length,1);assert.equal(game.logs.filter(e=>e.type==='die').length,1);
  const next=systemAction(game);assert(next);applyGameAction(game,next.playerId,next.action);
  assert.equal(game.flags.awaitRoll,true);assert.equal(game.randomLog.length,1);
  const room={code:'DICE',hostId:'p0',createdAt:0,updatedAt:0,version:3,maxPlayers:3,timeoutSeconds:0,deadline:null,game} as Room;
  assert.equal(immediateRoomAction(room,5000),undefined);
});

test('Mush shows its triggering die before the granted ability',()=>{
  const game=fixture(['mush','banana','banana'],[2,12,24]);game.deck=['hare'];
  const initial=view(game);roll(game,1);const playback=receiveRoom(createPlayback(initial),view(game,2));
  assert.equal(playback.queue[0]?.kind,'dice');
  const grant=playback.queue.findIndex(beat=>!!beat.abilityReveal);assert(grant>0);
  assert.deepEqual(playback.queue[grant]!.abilityReveal!.powers,['hare']);
});

test('Heads changes an existing face without a second throw animation',()=>{
  const game=fixture(['extra-mile-heads','banana','banana'],[2,12,24]);const initial=view(game);roll(game,2);
  assert.equal(game.pending?.kind,'em-heads');let playback=receiveRoom(createPlayback(initial),view(game,2));
  assert.equal(playback.queue[0]?.face,2);while(playback.queue.length)playback=completeBeat(playback);
  choose(game,'flip');playback=receiveRoom(playback,view(game,3));
  assert.equal(game.lastRoll?.face,5);assert.equal(game.randomLog.length,1);assert(!playback.queue.some(beat=>beat.kind==='dice'));
});

test('resuming after a refresh with a trimmed throw log cannot replay its linked confirmation',()=>{
  const game=fixture(['banana','suckerfish','banana'],[2,2,24]);
  const initial=view(game);initial.logs=[{id:150,type:'note',text:'较早的投骰已不在短日志窗口中'}];
  const confirmed={...initial,version:2,logs:[...initial.logs,{id:151,type:'roll',source:'r0',faces:[5],rollId:20,text:'确认已有主骰'}]};
  assert.equal(receiveRoom(createPlayback(initial),confirmed).queue.length,0);
});

test('Stunner announces the throw before its face-changing ability',()=>{
  const game=fixture(['banana','stunner','banana'],[2,3,24]);const initial=view(game);roll(game,4);
  const playback=receiveRoom(createPlayback(initial),view(game,2));
  assert.deepEqual(playback.queue.slice(0,2).map(beat=>beat.kind),['dice','skill']);assert.equal(game.lastRoll?.face,1);
});

test('a stage Mouth die and its cell change belong to Mouth, not the starting Suckerfish',()=>{
  const game=fixture(['suckerfish','banana','banana'],[2,12,20]);
  game.flags.thirds={id:'mouth',round:1,held:{},extraCards:[],npc:{id:'mouth',position:30}};
  const initial=view(game);game.flags.testDice=[4];game.queue=[{kind:'beginTurn',racerId:'r0'}];resolveTasks(game);roll(game,3);const confirmed=view(game,2);
  let playback=receiveRoom(createPlayback(initial),confirmed);
  const dice=playback.queue.filter(beat=>beat.kind==='dice');assert.equal(dice.length,2);
  const npcDie=dice[0]!;assert.equal(npcDie.cause,'thirds-npc');assert.equal(npcDie.source,undefined);
  assert.equal(presentationActor(npcDie,game.racers).characterId,'mouth');assert.equal(presentationActor(npcDie,game.racers).racerId,undefined);
  while(playback.queue[0]!==npcDie)playback=completeBeat(playback);
  assert.equal(presentedTrackState(confirmed,playback.queue)?.event?.npc?.position,30);
  playback=completeBeat(playback);assert.equal(playback.queue[0]?.events[0]?.type,'event-marker');
  assert.equal(playback.queue[0]?.actor?.characterId,'mouth');
  playback=completeBeat(playback);assert.equal(presentedTrackState(confirmed,playback.queue)?.event?.npc?.position,26);
  assert.equal(game.logs.filter(e=>e.type==='die'&&e.source==='r0').length,1);
});

test('neutral Twist monster rolls and moves with its own identity and delayed position',()=>{
  const game=fixture(['suckerfish','banana','banana'],[5,15,20]);game.track='twisty-twirl';
  game.flags.twist={triggered:true,deck:[],drawn:['alchemy-lab'],monster:{position:1}};
  const initial=view(game);roll(game,3,4);const confirmed=view(game,2);
  let playback=receiveRoom(createPlayback(initial),confirmed);
  while(playback.queue[0]?.cause!=='twist-alchemy-lab')playback=completeBeat(playback);
  assert.equal(playback.queue[0]?.kind,'dice');assert.equal(playback.queue[0]?.actor?.name,'游荡巨口');
  assert.equal(presentedTrackState(confirmed,playback.queue)?.twist?.monster?.position,1);
  playback=completeBeat(playback);assert.equal(playback.queue[0]?.events[0]?.type,'twist-monster');
  playback=completeBeat(playback);assert.equal(presentedTrackState(confirmed,playback.queue)?.twist?.monster?.position,5);
});

test('an unowned die never falls back to the current racer, including old NPC events',()=>{
  const game=fixture(['suckerfish','banana','banana'],[2,12,20]),initial=view(game);
  const confirmed={...initial,version:2,logs:[...initial.logs,{id:initial.logs.at(-1)!.id+1,type:'ability-dice',text:'骰面',faces:[4],cause:'thirds-npc',source:'r0'}],trackState:{reversed:false,event:{id:'mouth' as const,description:THIRD_EVENTS.mouth,npc:{id:'mouth',position:26},direction:1,newStart:undefined,trampolines:undefined}}};
  const beat=receiveRoom(createPlayback(initial),confirmed).queue[0]!;
  assert.equal(beat.source,undefined);assert.equal(presentationActor(beat,game.racers).characterId,'mouth');
  assert.equal(presentationActor({...beat,actor:undefined},game.racers).characterId,undefined);
});
