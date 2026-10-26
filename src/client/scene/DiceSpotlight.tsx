import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Avatar } from '../avatars.js';
import { diceTopRotation } from './math.js';

const patterns: Record<number, [number, number][]> = {1:[[0,0]],2:[[-.24,.24],[.24,-.24]],3:[[-.24,.24],[0,0],[.24,-.24]],4:[[-.24,.24],[.24,.24],[-.24,-.24],[.24,-.24]],5:[[-.24,.24],[.24,.24],[0,0],[-.24,-.24],[.24,-.24]],6:[[-.24,.26],[.24,.26],[-.24,0],[.24,0],[-.24,-.26],[.24,-.26]]};
const clamp = THREE.MathUtils.clamp;
const ease = (value:number) => 1-Math.pow(1-clamp(value,0,1),3);
function Die({face,startedAt,durationMs,reducedMotion,side=0}:{face:number;startedAt:number;durationMs:number;reducedMotion:boolean;side?:number}) {
  const die=useRef<THREE.Group>(null);
  useFrame(()=>{
    if(!die.current)return;
    const p=clamp((performance.now()-startedAt)/Math.max(1,durationMs),0,1),final=diceTopRotation(face);
    const throwTime=clamp(p/.82,0,1),remaining=1-ease(clamp((p-.15)/.68,0,1));
    const flight=p<.34?Math.sin(p/.34*Math.PI)*2.1:p<.59?Math.sin((p-.34)/.25*Math.PI)*.78:p<.75?Math.sin((p-.59)/.16*Math.PI)*.26:p<.83?Math.sin((p-.75)/.08*Math.PI)*.07:0;
    die.current.position.set(reducedMotion?0:(side||-1.4)*(1-ease(throwTime)),.44+(reducedMotion?0:flight),reducedMotion?0:Math.sin(p*Math.PI*2)*.28*(1-throwTime));
    const spin=side>0?-1:1;
    die.current.rotation.set(final[0]+(reducedMotion?0:spin*remaining*Math.PI*8),final[1]+(reducedMotion?0:spin*remaining*Math.PI*5),final[2]+(reducedMotion?0:spin*remaining*Math.PI*6));
  });
  const sides:{value:number;position:[number,number,number];rotation:[number,number,number]}[]=[{value:1,position:[0,.501,0],rotation:[-Math.PI/2,0,0]},{value:6,position:[0,-.501,0],rotation:[Math.PI/2,0,0]},{value:2,position:[0,0,.501],rotation:[0,0,0]},{value:5,position:[0,0,-.501],rotation:[0,Math.PI,0]},{value:3,position:[.501,0,0],rotation:[0,Math.PI/2,0]},{value:4,position:[-.501,0,0],rotation:[0,-Math.PI/2,0]}];
  return <group ref={die}><RoundedBox args={[1,1,1]} radius={.095} smoothness={3} castShadow receiveShadow><meshStandardMaterial color="#fff9e9" roughness={.3} metalness={.05}/></RoundedBox>{sides.map(side=><group key={side.value} position={side.position} rotation={side.rotation}>{patterns[side.value]!.map(([x,y],index)=><mesh key={index} position={[x,y,.005]} scale={[1,1,.28]}><sphereGeometry args={[.065,12,8]}/><meshStandardMaterial color={side.value===1?'#ed6149':'#253e50'} roughness={.5}/></mesh>)}</group>)}</group>;
}

export interface DiceContender {racerId:string;characterId:string;name:string;face:number}
interface Props {active:boolean;beatKey?:string;contenders?:DiceContender[];face:number;faces?:number[];cause?:string;triggered?:boolean;reason?:string;detail?:string;sourceRacerId?:string;sourceCharacterId?:string;stageActor?:boolean;startedAt:number;durationMs:number;resultReadMs:number;reducedMotion:boolean;lowQuality:boolean;source:string;onDetail:(id:string,racerId?:string)=>void;onSettled?:(key:string)=>void}
/** One shared canvas shows only public, authority-confirmed dice. */
export function DiceSpotlight({active,beatKey,contenders,face,faces,cause,triggered,reason,detail,sourceRacerId,sourceCharacterId,stageActor,startedAt,durationMs,resultReadMs,reducedMotion,lowQuality,source,onDetail,onSettled}:Props) {
  const [settledKey,setSettledKey]=useState<string>();
  const announcedKey=useRef<string|undefined>(undefined);
  const paired=contenders?.length===2,multiple=!paired&&(faces?.length??0)>1,sixDice=multiple&&faces?.length===6,brokenClock=multiple&&cause==='extra-mile-broken-clock',eventDuel=cause==='thirds-duel',ability=cause==='nemesis'||cause==='the-hose';
  const rollReason=reason??(eventDuel?'决斗家事件：同格选手指定点数，须掷出该点数，否则绊倒。':undefined);
  const batchResult=brokenClock?faces?.[0]===faces?.[1]?`双同点相加 · 基础移动 ${faces![0]!+faces![1]!} 格`:`取较小值 · 基础移动 ${Math.min(...faces!)} 格`:sixDice?new Set(faces).size===6?'六骰均不同 · 等待重掷整组':'六骰已公开 · 选择重复点数':cause==='leaf-philanthropist'?'双骰已公开 · 选择使用与赠出的点数':'多骰点数确认 · 即将结算';
  const revealAfterMs=reducedMotion?0:Math.max(0,Math.min(paired?1800:durationMs,durationMs-resultReadMs));
  const settled=active&&!!beatKey&&(revealAfterMs===0||settledKey===beatKey);
  useEffect(()=>{if(!active){announcedKey.current=undefined;setSettledKey(undefined);}},[active]);
  useEffect(()=>{if(!active||!beatKey)return;const timer=setTimeout(()=>setSettledKey(beatKey),Math.max(0,startedAt+revealAfterMs-performance.now()));return()=>clearTimeout(timer);},[active,beatKey,startedAt,revealAfterMs]);
  useEffect(()=>{
    if(!settled||!beatKey||!onSettled||announcedKey.current===beatKey)return;
    // The result has committed. Two one-shot frames leave a paint opportunity
    // before its reading clock can let the presentation advance.
    let second:number|undefined;
    const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{announcedKey.current=beatKey;onSettled(beatKey);});});
    return()=>{cancelAnimationFrame(first);if(second!==undefined)cancelAnimationFrame(second);};
  },[settled,beatKey,onSettled]);
  const label=brokenClock?'主移动双骰':sixDice?'六颗主移动骰':multiple?'双骰':eventDuel?'决斗家事件骰':stageActor?triggered?'赛场效果骰 · 触发三角人':'赛场效果骰':triggered?'三角人触发骰':cause?.startsWith('twist-')?'赛场效果骰':cause==='nemesis'?'跟掷骰':cause==='the-hose'?'回合结束 · 水管范围骰':cause==='show-off'?'追加骰':cause&&cause!=='main'?'技能骰':'主移动骰';
  const avatar=(characterId:string,racerId?:string)=>stageActor?<span className="dice-source-avatar" aria-label={source}><Avatar id={characterId}/></span>:<button type="button" className="dice-source-avatar" onClick={()=>onDetail(characterId,racerId)} aria-label={`查看${source}技能与当前玩家`}><Avatar id={characterId}/></button>;
  return <div hidden={!active} className={`dice-spotlight ${settled?'is-settled':''} ${paired?'is-duel':''} ${multiple?'is-multi':''} ${rollReason?'has-reason':''}`} role="status" aria-label={paired?`${contenders[0]!.name}与${contenders[1]!.name}的决斗骰`:`${source}正在掷${label}`} data-dice-event-key={active?beatKey:''} data-frameloop={active?reducedMotion?'demand':'always':'never'} data-dice-mode={paired?'duel':multiple?'multi':'single'} data-up-face={!paired&&!multiple&&settled?face:''} data-up-faces={settled?paired?contenders.map(contender=>contender.face).join(','):multiple?faces!.join(','):'':''} data-result-read-ms={active?resultReadMs:undefined}>
    {paired?<div className="duel-contenders">{contenders.map((contender,index)=><div key={contender.racerId} data-duel-racer-id={contender.racerId}>{avatar(contender.characterId,contender.racerId)}<strong>{contender.name}</strong><small>{index?'应战方':'挑战方'}</small></div>)}<b>VS</b></div>:<div className="dice-caption">{sourceCharacterId&&avatar(sourceCharacterId,sourceRacerId)}<span>{source} · {label}<strong>{settled?'点数确认':'好戏，掷出来！'}</strong></span></div>}
    {rollReason&&<p className="dice-reason" data-testid="dice-reason">{rollReason}</p>}
    <Canvas frameloop={active?reducedMotion?'demand':'always':'never'} shadows={!lowQuality} dpr={lowQuality?1:[1,1.5]} camera={{position:[3.7,6.5,5],fov:38}} gl={{alpha:true,antialias:!lowQuality}}><ambientLight intensity={1.5}/><directionalLight position={[-3,8,4]} intensity={3} castShadow shadow-mapSize={[512,512]} shadow-normalBias={.02}/><RoundedBox args={[4.2,.18,3.6]} position={[0,-.15,0]} radius={.2} smoothness={3} receiveShadow><meshStandardMaterial color="#315c62" roughness={.9}/></RoundedBox>{[-1,1].map(side=><group key={side}><mesh position={[side*2.04,.03,0]}><boxGeometry args={[.1,.3,3.7]}/><meshStandardMaterial color="#e4b569"/></mesh><mesh position={[0,.03,side*1.78]}><boxGeometry args={[4.1,.3,.1]}/><meshStandardMaterial color="#e4b569"/></mesh></group>)}
      {paired?contenders.map((contender,index)=><group key={contender.racerId} position={[(index?1:-1)*.95,0,0]} scale={.82}><Die face={contender.face} startedAt={startedAt} durationMs={Math.max(1,revealAfterMs)} reducedMotion={reducedMotion||revealAfterMs===0} side={index?1:-1}/></group>):multiple?faces!.map((value,index)=><group key={index} position={sixDice?[(index%3-1)*1.08,0,(Math.floor(index/3)-.5)*1.25]:[(index-(faces!.length-1)/2)*1.8,0,0]} scale={sixDice ? .63 : .82}><Die face={value} startedAt={startedAt} durationMs={Math.max(1,revealAfterMs)} reducedMotion={reducedMotion||revealAfterMs===0} side={index%2?.35:-.35}/></group>):<Die face={face} startedAt={startedAt} durationMs={Math.max(1,revealAfterMs)} reducedMotion={reducedMotion||revealAfterMs===0}/>}
    </Canvas>
    <div className={`dice-result ${paired?'duel-result':''} ${multiple?'batch-result':''} ${ability?'ability-result':''}`} data-testid={active?paired?'duel-dice-value':multiple?'multi-dice-value':'dice-value':undefined}>{paired?<><span className="duel-values"><b>{settled?contenders[0]!.face:'·'}</b><i>:</i><b>{settled?contenders[1]!.face:'·'}</b></span><span>{settled?'双方点数确认 · 即将结算':'两人已投骰 · 同时揭晓'}</span></>:multiple?<><span className="dice-batch-values">{faces!.map((value,index)=><b key={index} aria-label={settled?`第${index+1}骰 ${value}点`:`第${index+1}骰投掷中`}>{settled?value:'·'}</b>)}</span><span>{settled?batchResult:sixDice?'六颗骰子同时投出':'两颗骰子同时投出'}</span></>:settled?<><b>{face}</b><span>{triggered?'点 · 触发三角人':stageActor||cause?.startsWith('twist-')?'点 · 即将结算赛场效果':cause?.startsWith('thirds-')?'点 · 即将结算事件':cause==='nemesis'||cause==='the-hose'?'点 · 即将结算能力':'点 · 即将出发'}</span>{ability&&detail&&<small className="dice-ability-detail">{detail}</small>}</>:<span>抛出 · 弹跳 · 停稳</span>}</div>
  </div>;
}
