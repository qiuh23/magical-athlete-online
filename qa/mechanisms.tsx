/** Development-only harness: real engine arrival -> receiveRoom -> Board3D.
 * No network action or production fixture gate; Vite serves this HTML locally. */
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createGame,enqueueMove,resolveTasks} from '../src/engine/index.js';
import {createPlayback,receiveRoom,completeBeat} from '../src/client/presentation.js';
import {PresentationClock} from '../src/client/presentation-clock.js';
import {Board3D} from '../src/client/scene/Board3D.js';
import {TRACKS,type TrackId} from '../src/shared/tracks.js';
import type {Player,Racer,RoomView} from '../src/shared/types.js';
import '../src/client/styles.css';
const clock=new PresentationClock();
function fixture(track:TrackId,from:number,count=2,tripResident=false,warpResidents=false){
 const players=Array.from({length:count},(_,i)=>({id:`p${i}`,name:`选手${i+1}`,seat:i,color:['#ec795d','#579bb5','#7ba85c','#c792cb'][i%4],score:2,connected:true,isHost:i===0,hand:[],selected:[]})) as unknown as Player[];
 const game=createGame(players,731);Object.assign(game,{phase:'race',round:1,track,currentRacerId:'r0',baseTurnOrder:players.map((_,i)=>`r${i}`)});
 game.racers=players.map((p,i)=>({id:`r${i}`,playerId:p.id,characterId:'banana',position:i===0?from:(tripResident&&i===1)||warpResidents?5:0,tripped:(tripResident&&i===1)||(warpResidents&&i%2===1),finished:false,eliminated:false,flags:{}}));game.flags.awaitRoll=true;
 const room:RoomView={code:'LOCALQA',version:1,hostId:'p0',selfId:'p0',maxPlayers:8,timeoutSeconds:0,deadline:null,phase:'race',round:1,track,players:players.map(p=>({...p,handCount:0,selected:false})),racers:structuredClone(game.racers),currentRacerId:'r0',logs:[],results:[],rulesStatus:'development fixture'};
 return {game,room};
}
function App(){
 const [track,setTrack]=useState<TrackId>('wild'),[source,setSource]=useState(0),[count,setCount]=useState(2),[paused,setPaused]=useState(false),[low,setLow]=useState(false);
 const [initial,setInitial]=useState(()=>fixture('wild',0)),[state,setState]=useState(()=>createPlayback(initial.room)),[startedAt,setStartedAt]=useState(clock.now()),[detail,setDetail]=useState('');
 const beat=state.queue[0];
 const reset=(t:TrackId,n=0,c=count)=>{const f=fixture(t,n,c);setInitial(f);setState(createPlayback(f.room));setStartedAt(clock.now());setTrack(t);setSource(n);};
 useEffect(()=>{if(!beat||paused)return;const timer=setTimeout(()=>{setState(s=>completeBeat(s));setStartedAt(clock.now());},Math.max(0,beat.durationMs-(clock.now()-startedAt)));return()=>clearTimeout(timer);},[beat?.key,paused,startedAt]);
 return <><div style={{position:'fixed',top:0,left:0,right:0,zIndex:1000,display:'flex',gap:6,flexWrap:'wrap',padding:5,background:'#fffc'}}>
 <select aria-label="地图" value={track} onChange={e=>reset(e.target.value as TrackId)}>{Object.keys(TRACKS).map(t=><option key={t} value={t}>{t}</option>)}</select>
 <select aria-label="人数" value={count} onChange={e=>{setCount(Number(e.target.value));reset(track,source,Number(e.target.value));}}>{[2,4,8].map(n=><option key={n}>{n}</option>)}</select>
 <button onClick={()=>reset('wild',6)}>前进7</button><button onClick={()=>reset('wild',23)}>后退24</button><button onClick={()=>reset('wild',4)}>绊倒5</button><button onClick={()=>reset('wild',16)}>认证绊倒17</button><button onClick={()=>{const f=fixture('wild',4,2,true);setInitial(f);setState(createPlayback(f.room));setStartedAt(clock.now());setTrack('wild');setSource(4);setCount(2);}}>原生双人绊倒5</button><button onClick={()=>reset('wild',0)}>得分1</button><button onClick={()=>reset('squiggle',22)}>扣分23</button><button onClick={()=>reset('whirly-world',2)}>传送3</button>
 {[2,5].map(n=><button key={n} onClick={()=>{const f=fixture('whirly-world',2,n,false,true);setInitial(f);setState(createPlayback(f.room));setStartedAt(clock.now());setTrack('whirly-world');setSource(2);setCount(n);}}>{n===2?'传送双人5':'传送五人5'}</button>)}
 <button onClick={()=>{setState(s=>completeBeat(s));setStartedAt(clock.now());}}>跳过当前段</button>
 <button onClick={()=>{enqueueMove(initial.game,'r0',1,'main');resolveTasks(initial.game);setState(s=>receiveRoom(s,{...initial.room,version:initial.room.version+1,racers:structuredClone(initial.game.racers),players:initial.game.players.map(p=>({...p,handCount:p.hand.length,selected:false})),logs:initial.game.logs,presentationEvents:initial.game.logs}));setStartedAt(clock.now());}}>真实到达事件</button>
 <button onClick={()=>{clock.setPaused(!paused);setPaused(!paused);}}>{paused?'继续':'暂停'}</button><button onClick={()=>setLow(!low)}>{low?'经济画质':'标准画质'}</button><span>{beat?.kind??'idle'} {detail}</span>
 </div><Board3D room={state.confirmed} racers={state.racers} queue={state.queue} beat={beat} clock={clock} paused={paused} startedAt={startedAt} durationMs={beat?.durationMs??0} lowQuality={low} reducedMotion={false} muted onDetail={(id,rid)=>setDetail(`点击${rid}:${id}`)}/></>;
}
createRoot(document.getElementById('root')!).render(<App/>);
