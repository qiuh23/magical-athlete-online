/** Local-only real engine fixtures shared by pixel and component-motion QA. */
import { createGame, enqueueMove, resolveTasks } from '../src/engine/index.js';
import { completeBeat, createPlayback, receiveRoom } from '../src/client/presentation.js';
import { mechanismActions, mechanismAnchors } from '../src/client/scene/mechanisms/events.js';
import {TRACKS, type TrackId} from '../src/shared/tracks.js';
import type { Player, RoomView } from '../src/shared/types.js';
export const MOTION_ACTORS = [
 {id:'banana',label:'banana'}, {id:'coach',label:'coach'}, {id:'blimp',label:'blimp'},
 {id:'centaur',label:'centaur'}, {id:'kraken',label:'kraken'}, {id:'hotel',label:'hotel'},
 {id:'hog-knight',label:'hog-knight-mounted',mount:true}, {id:'bite-mark',label:'bite-mark-were',form:'were-mouth'},
] as const;
export const MOTION_CASES = [
 {id:'punch-forward',track:'wild',from:6,node:7,kind:'punch'},
 {id:'punch-r1-forward',track:'wild',from:22,node:23,kind:'punch'},
 {id:'punch-r1-backward',track:'wild',from:23,node:24,kind:'punch'},
 {id:'trip-native',track:'wild',from:4,node:5,kind:'trip'},
 {id:'trip-telescopic',track:'wild',from:16,node:17,kind:'trip'},
 {id:'gain',track:'wild',from:0,node:1,kind:'gain'},
 {id:'loss',track:'squiggle',from:22,node:23,kind:'loss'},
 {id:'warp',track:'whirly-world',from:2,node:3,kind:'warp'},
] as const;
export const ALL_MOTION_CASES=Object.keys(TRACKS).flatMap(track=>mechanismAnchors(track as TrackId).map(anchor=>({id:anchor.id,track:track as TrackId,from:anchor.node,node:anchor.node,kind:anchor.kind})));
export function motionFixture(caseId:string,actorLabel:string,count=1){
 const scenario=MOTION_CASES.find(c=>c.id===caseId)??ALL_MOTION_CASES.find(c=>c.id===caseId)??MOTION_CASES[0];
 const actor=MOTION_ACTORS.find(a=>a.label===actorLabel)??MOTION_ACTORS[0];
 const players=Array.from({length:count},(_,i)=>({id:`p${i}`,name:`选手${i+1}`,seat:i,color:'#dc795d',score:8,connected:true,isHost:i===0,hand:[],selected:[]})) as unknown as Player[];
 const game=createGame(players,731);Object.assign(game,{phase:'race',round:1,track:scenario.track,currentRacerId:'r0',baseTurnOrder:players.map((_,i)=>`r${i}`)});
 game.racers=players.map((p,i)=>({id:`r${i}`,playerId:p.id,characterId:actor.id,position:i===0?scenario.from:0,tripped:false,finished:false,eliminated:false,flags:{...('mount'in actor?{hogOwnerId:'mount-owner'}:{}),...('form'in actor?{form:actor.form}:{})}}));game.flags.awaitRoll=false;
 const room:RoomView={code:'MOTIONQA',version:1,hostId:'p0',selfId:'p0',maxPlayers:8,timeoutSeconds:0,deadline:null,phase:'race',round:1,track:scenario.track as TrackId,players:players.map(p=>({...p,handCount:0,selected:false})),racers:structuredClone(game.racers),currentRacerId:'r0',logs:[],results:[],rulesStatus:'development fixture'};
 if(caseId.includes(':'))game.queue.push({kind:'board',racerId:'r0'});else enqueueMove(game,'r0',1,'main');resolveTasks(game);
 let playback=receiveRoom(createPlayback(room),{...room,version:2,racers:structuredClone(game.racers),players:game.players.map(p=>({...p,handCount:p.hand.length,selected:false})),logs:game.logs,presentationEvents:game.logs});
 while(playback.queue[0]&&!mechanismActions(room.track,playback.queue[0],playback.racers).some(a=>a.anchor.node===scenario.node&&a.anchor.kind===scenario.kind))playback=completeBeat(playback);
 if(!playback.queue[0])throw Error(`Real engine did not generate ${caseId} for ${actorLabel}`);
 return {scenario,actor,room:playback.confirmed,racers:playback.racers,beat:playback.queue[0],queue:playback.queue};
}
