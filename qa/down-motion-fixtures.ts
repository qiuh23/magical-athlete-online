/** Already-down device targets reached through real Party Animal turn-start movement. */
import { applyGameAction, createGame } from '../src/engine/index.js';
import { completeBeat, createPlayback, receiveRoom } from '../src/client/presentation.js';
import { mechanismActions, mechanismAnchors } from '../src/client/scene/mechanisms/events.js';
import type { Player, RoomView } from '../src/shared/types.js';
import type { TrackId } from '../src/shared/tracks.js';
import { MOTION_ACTORS } from './motion-fixtures.js';

export const DOWN_MOTION_CASES = [
 {id:'squiggle:1',track:'squiggle',from:0,node:1,kind:'gain',path:[1]},
 {id:'squiggle:14',track:'squiggle',from:13,node:14,kind:'punch',path:[14,15]},
 {id:'squiggle:19',track:'squiggle',from:18,node:19,kind:'gain',path:[19]},
 {id:'boardwalks:9',track:'boardwalks',from:8,node:9,kind:'punch',path:[9,10]},
 {id:'boardwalks:32',track:'boardwalks',from:31,node:32,kind:'punch',path:[32,31]},
 {id:'boardwalks:49',track:'boardwalks',from:48,node:49,kind:'gain',path:[49]},
 // Progress, not node number, controls Party Animal: pull backward from 51.
 {id:'boardwalks:50',track:'boardwalks',from:51,node:50,kind:'punch',path:[50,18,17]},
] as const;

export function downMotionFixture(anchorId:string,actorLabel:string,options:{residentParty?:boolean}={}){
 const scenario=DOWN_MOTION_CASES.find(c=>c.id===anchorId);
 if(!scenario)throw Error(`Unsupported down-motion anchor: ${anchorId}`);
 // Keep the legal force source visible, but away from the device by default.
 const soloPartyPositions:Record<string,number>={'squiggle:1':2,'squiggle:14':16,'squiggle:19':20,'boardwalks:9':11,'boardwalks:32':33,'boardwalks:49':24,'boardwalks:50':0};
 const partyPosition=options.residentParty?scenario.node:soloPartyPositions[anchorId]!;
 const actor=MOTION_ACTORS.find(a=>a.label===actorLabel);
 if(!actor)throw Error(`Unknown motion actor: ${actorLabel}`);
 const players=[0,1].map(i=>({id:`p${i}`,name:`选手${i+1}`,seat:i,color:'#dc795d',score:8,connected:true,isHost:i===0,hand:[],selected:[]})) as unknown as Player[];
 const game=createGame(players,731);
 Object.assign(game,{phase:'race',round:1,track:scenario.track,currentRacerId:'r1',baseTurnOrder:['r1','r0']});
 game.racers=[
  {id:'r0',playerId:'p0',characterId:actor.id,position:scenario.from,tripped:true,finished:false,eliminated:false,flags:{...('mount'in actor?{hogOwnerId:'mount-owner'}:{}),...('form'in actor?{form:actor.form}:{})}},
  {id:'r1',playerId:'p1',characterId:'party-animal',position:partyPosition,tripped:false,finished:false,eliminated:false,flags:{}},
 ];
 game.flags.needsBegin=true;game.flags.awaitRoll=false;
 const initialRacers=structuredClone(game.racers);
 const room:RoomView={code:'DOWNQA',version:1,hostId:'p0',selfId:'p0',maxPlayers:8,timeoutSeconds:0,deadline:null,phase:'race',round:1,track:scenario.track as TrackId,players:players.map(p=>({...p,handCount:0,selected:false})),racers:initialRacers,currentRacerId:'r1',logs:[],results:[],rulesStatus:'development fixture'};
 // Actual public action -> turn-start ability -> forced move -> normal landing -> board.
 applyGameAction(game,'p1',{type:'next'});
 if(game.pending?.kind==='track-branch')applyGameAction(game,game.pending.playerId,{type:'choose',choiceId:game.pending.id,optionId:String(scenario.node)});
 if(game.pending)throw Error(`Unresolved down-motion choice: ${game.pending.kind}`);
 let playback=receiveRoom(createPlayback(room),{...room,version:2,racers:structuredClone(game.racers),players:game.players.map(p=>({...p,handCount:p.hand.length,selected:false})),logs:game.logs,presentationEvents:game.logs});
 const anchor=mechanismAnchors(room.track).find(a=>a.id===anchorId)!;
 while(playback.queue[0]&&!mechanismActions(room.track,playback.queue[0],playback.racers).some(a=>a.anchor.id===anchor.id&&a.targets.includes('r0')))playback=completeBeat(playback);
 if(!playback.queue[0])throw Error(`Real engine did not generate down ${anchorId} for ${actorLabel}`);
 return {scenario,actor,room:playback.confirmed,racers:playback.racers,beat:playback.queue[0],queue:playback.queue,initialRacers,events:game.logs};
}
