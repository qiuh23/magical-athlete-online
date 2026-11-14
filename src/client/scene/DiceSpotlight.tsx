import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Avatar } from '../avatars.js';
import { wallPresentationClock, type PresentationClock } from '../presentation-clock.js';
import { diceTopRotation } from './math.js';
import { SceneBoundary } from './SceneBoundary.js';
import { createDicePips, DiceThrowPlayback } from './dice-rendering.js';

const clamp = THREE.MathUtils.clamp;
const ease = (value:number) => 1-Math.pow(1-clamp(value,0,1),3);
function Die({playback,pips,face,reducedMotion,side=0}:{playback:DiceThrowPlayback;pips:ReturnType<typeof createDicePips>;face:number;reducedMotion:boolean;side?:number}) {
  const die=useRef<THREE.Group>(null);
  useFrame(()=>{
    if(!die.current)return;
    const p=playback.progress,final=diceTopRotation(face);
    const throwTime=clamp(p/.82,0,1),remaining=1-ease(clamp((p-.15)/.68,0,1));
    const flight=p<.34?Math.sin(p/.34*Math.PI)*2.1:p<.59?Math.sin((p-.34)/.25*Math.PI)*.78:p<.75?Math.sin((p-.59)/.16*Math.PI)*.26:p<.83?Math.sin((p-.75)/.08*Math.PI)*.07:0;
    die.current.position.set(reducedMotion?0:(side||-1.4)*(1-ease(throwTime)),.44+(reducedMotion?0:flight),reducedMotion?0:Math.sin(p*Math.PI*2)*.28*(1-throwTime));
    const spin=side>0?-1:1;
    die.current.rotation.set(final[0]+(reducedMotion?0:spin*remaining*Math.PI*8),final[1]+(reducedMotion?0:spin*remaining*Math.PI*5),final[2]+(reducedMotion?0:spin*remaining*Math.PI*6));
  });
  return <group ref={die}><RoundedBox args={[1,1,1]} radius={.095} smoothness={3} castShadow receiveShadow><meshStandardMaterial color="#fff9e9" roughness={.3} metalness={.05}/></RoundedBox><mesh geometry={pips.redGeometry} material={pips.redMaterial} dispose={null}/><mesh geometry={pips.darkGeometry} material={pips.darkMaterial} dispose={null}/></group>;
}

/** The shared clock is sampled before every die; result UI and demand mode are
 * released only after Three has drawn all of their final poses. */
function DiceFrameGate({active,paused,clock,playback,durationMs,reducedMotion,onRendered,onFailure}:{active:boolean;paused:boolean;clock:PresentationClock;playback:DiceThrowPlayback;durationMs:number;reducedMotion:boolean;onRendered:()=>void;onFailure:()=>void}) {
  const {scene,gl,invalidate}=useThree();
  useFrame(()=>{if(active&&!paused)playback.sample(clock.now(),durationMs,reducedMotion);},-1);
  useEffect(()=>{
    const previous=scene.onAfterRender;
    const after:typeof previous=function(this:THREE.Scene,...args){previous.apply(this,args);if(active&&!paused&&playback.afterRender())onRendered();};
    scene.onAfterRender=after;
    if(active)invalidate();
    return()=>{if(scene.onAfterRender===after)scene.onAfterRender=previous;};
  },[scene,invalidate,active,paused,playback,onRendered]);
  useEffect(()=>{
    const lost=(event:Event)=>{event.preventDefault();onFailure();};
    gl.domElement.addEventListener('webglcontextlost',lost);
    return()=>gl.domElement.removeEventListener('webglcontextlost',lost);
  },[gl,onFailure]);
  return null;
}

export interface DiceContender {racerId:string;characterId:string;name:string;face:number}
interface Props {rendererResetKey?:number;onRetryRenderer?:()=>void;clock?:PresentationClock;paused?:boolean;active:boolean;beatKey?:string;contenders?:DiceContender[];face:number;faces?:number[];cause?:string;triggered?:boolean;reason?:string;detail?:string;sourceRacerId?:string;sourceCharacterId?:string;stageActor?:boolean;startedAt:number;durationMs:number;resultReadMs:number;reducedMotion:boolean;lowQuality:boolean;source:string;onDetail:(id:string,racerId?:string)=>void;onSettled?:(key:string)=>void}
/** One shared canvas shows only public, authority-confirmed dice. */
export function DiceSpotlight({rendererResetKey=0,onRetryRenderer=()=>{},clock=wallPresentationClock,paused=false,active,beatKey,contenders,face,faces,cause,triggered,reason,detail,sourceRacerId,sourceCharacterId,stageActor,startedAt,durationMs,resultReadMs,reducedMotion,lowQuality,source,onDetail,onSettled}:Props) {
  const [settledKey,setSettledKey]=useState<string>();
  const [rendererFailed,setRendererFailed]=useState(false);
  const failed=useCallback(()=>setRendererFailed(true),[]);
  const pips=useMemo(createDicePips,[]);
  useEffect(()=>()=>pips.dispose(),[pips]);
  const playback=useMemo(()=>new DiceThrowPlayback(),[beatKey,rendererResetKey]);
  useEffect(()=>setRendererFailed(false),[rendererResetKey]);
  const rendered=useCallback(()=>{if(active&&beatKey&&!clock.paused)setSettledKey(beatKey);},[active,beatKey,clock]);
  const announcedKey=useRef<string|undefined>(undefined);
  const paired=contenders?.length===2,multiple=!paired&&(faces?.length??0)>1,sixDice=multiple&&faces?.length===6,brokenClock=multiple&&cause==='extra-mile-broken-clock',eventDuel=cause==='thirds-duel',ability=cause==='nemesis'||cause==='the-hose';
  const rollReason=reason??(eventDuel?'决斗家事件：同格选手指定点数，须掷出该点数，否则绊倒。':undefined);
  const batchResult=brokenClock?faces?.[0]===faces?.[1]?`双同点相加 · 基础移动 ${faces![0]!+faces![1]!} 格`:`取较小值 · 基础移动 ${Math.min(...faces!)} 格`:sixDice?new Set(faces).size===6?'六骰均不同 · 等待重掷整组':'六骰已公开 · 选择重复点数':cause==='leaf-philanthropist'?'双骰已公开 · 选择使用与赠出的点数':'多骰点数确认 · 即将结算';
  const revealAfterMs=reducedMotion?0:Math.max(0,Math.min(paired?1800:durationMs,durationMs-resultReadMs));
  const settled=active&&!!beatKey&&(revealAfterMs===0||settledKey===beatKey);
  useEffect(()=>{if(!active){announcedKey.current=undefined;setSettledKey(undefined);}},[active]);
  useEffect(()=>{
    if(!active||!beatKey||paused||settled)return;
    let timer:ReturnType<typeof setTimeout>,wakeUntil=0;
    const page=typeof document==='undefined'?undefined:document,windowHost=typeof window==='undefined'?undefined:window;
    const remaining=()=>rendererFailed?Math.max(0,startedAt+revealAfterMs-clock.now()):playback.fallbackRemaining(clock.now(),startedAt,revealAfterMs);
    const delay=()=>Math.max(remaining(),rendererFailed?0:wakeUntil-clock.now());
    const check=()=>{if(clock.paused||page?.hidden)return;const wait=delay();if(wait>0){timer=setTimeout(check,wait);return;}setRendererFailed(true);setSettledKey(beatKey);};
    // Background tabs and BFCache suspend frames by design. They are not a failed
    // GPU: allow a resumed draw before considering the bounded fallback again.
    const wake=()=>{clearTimeout(timer);if(page?.hidden)return;wakeUntil=clock.now()+2000;timer=setTimeout(check,delay());};
    if(!page?.hidden)timer=setTimeout(check,delay());
    page?.addEventListener('visibilitychange',wake);windowHost?.addEventListener('pageshow',wake);
    return()=>{clearTimeout(timer);page?.removeEventListener('visibilitychange',wake);windowHost?.removeEventListener('pageshow',wake);};
  },[rendererFailed,active,beatKey,startedAt,revealAfterMs,paused,clock,playback,settled]);
  useEffect(()=>{
    if(paused||!settled||!beatKey||!onSettled||announcedKey.current===beatKey)return;
    // The result has committed. Two one-shot frames leave a paint opportunity
    // before its reading clock can let the presentation advance.
    let second:number|undefined;
    const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{if(clock.paused)return;announcedKey.current=beatKey;onSettled(beatKey);});});
    return()=>{cancelAnimationFrame(first);if(second!==undefined)cancelAnimationFrame(second);};
  },[settled,beatKey,onSettled,paused,clock]);
  const frameloop=!active?'never':paused||reducedMotion||settled?'demand':'always';
  const rendererFallback=<div className="dice-renderer-fallback"><span>3D 骰子动画暂时无法显示</span><button onClick={onRetryRenderer}>重新载入骰子动画</button></div>;
  const label=brokenClock?'主移动双骰':sixDice?'六颗主移动骰':multiple?'双骰':eventDuel?'决斗家事件骰':stageActor?triggered?'赛场效果骰 · 触发三角人':'赛场效果骰':triggered?'三角人触发骰':cause?.startsWith('twist-')?'赛场效果骰':cause==='nemesis'?'跟掷骰':cause==='the-hose'?'回合结束 · 水管范围骰':cause==='show-off'?'追加骰':cause&&cause!=='main'?'技能骰':'主移动骰';
  const avatar=(characterId:string,racerId?:string)=>stageActor?<span className="dice-source-avatar" aria-label={source}><Avatar id={characterId}/></span>:<button type="button" className="dice-source-avatar" onClick={()=>onDetail(characterId,racerId)} aria-label={`查看${source}技能与当前玩家`}><Avatar id={characterId}/></button>;
  return <div hidden={!active} className={`dice-spotlight ${settled?'is-settled':''} ${paired?'is-duel':''} ${multiple?'is-multi':''} ${rollReason?'has-reason':''}`} role="status" aria-label={paired?`${contenders[0]!.name}与${contenders[1]!.name}的决斗骰`:`${source}正在掷${label}`} data-dice-event-key={active?beatKey:''} data-frameloop={frameloop} data-dice-mode={paired?'duel':multiple?'multi':'single'} data-up-face={!paired&&!multiple&&settled?face:''} data-up-faces={settled?paired?contenders.map(contender=>contender.face).join(','):multiple?faces!.join(','):'':''} data-result-read-ms={active?resultReadMs:undefined}>
    {paired?<div className="duel-contenders">{contenders.map((contender,index)=><div key={contender.racerId} data-duel-racer-id={contender.racerId}>{avatar(contender.characterId,contender.racerId)}<strong>{contender.name}</strong><small>{index?'应战方':'挑战方'}</small></div>)}<b>VS</b></div>:<div className="dice-caption">{sourceCharacterId&&avatar(sourceCharacterId,sourceRacerId)}<span>{source} · {label}<strong>{settled?'点数确认':'好戏，掷出来！'}</strong></span></div>}
    {rollReason&&<p className="dice-reason" data-testid="dice-reason">{rollReason}</p>}
    {/* Keep confirmed numeric results and their read-clock effects mounted if only WebGL fails. */}
    <SceneBoundary resetKey={rendererResetKey} retry={onRetryRenderer} onFailure={failed} fallback={rendererFallback}>
    {rendererFailed?rendererFallback:<Canvas key={rendererResetKey} frameloop={frameloop} shadows={!lowQuality} dpr={lowQuality?1:[1,1.5]} camera={{position:[3.7,6.5,5],fov:38}} gl={{alpha:true,antialias:!lowQuality}}><ambientLight intensity={1.5}/><directionalLight position={[-3,8,4]} intensity={3} castShadow shadow-mapSize={[512,512]} shadow-normalBias={.02}/><RoundedBox args={[4.2,.18,3.6]} position={[0,-.15,0]} radius={.2} smoothness={3} receiveShadow><meshStandardMaterial color="#315c62" roughness={.9}/></RoundedBox>{[-1,1].map(side=><group key={side}><mesh position={[side*2.04,.03,0]}><boxGeometry args={[.1,.3,3.7]}/><meshStandardMaterial color="#e4b569"/></mesh><mesh position={[0,.03,side*1.78]}><boxGeometry args={[4.1,.3,.1]}/><meshStandardMaterial color="#e4b569"/></mesh></group>)}
      <DiceFrameGate active={active} paused={paused} clock={clock} playback={playback} durationMs={Math.max(1,revealAfterMs)} reducedMotion={reducedMotion||revealAfterMs===0||settled} onRendered={rendered} onFailure={failed}/>
      {paired?contenders.map((contender,index)=><group key={contender.racerId} position={[(index?1:-1)*.95,0,0]} scale={.82}><Die playback={playback} pips={pips} face={contender.face} reducedMotion={reducedMotion||revealAfterMs===0||settled} side={index?1:-1}/></group>):multiple?faces!.map((value,index)=><group key={index} position={sixDice?[(index%3-1)*1.08,0,(Math.floor(index/3)-.5)*1.25]:[(index-(faces!.length-1)/2)*1.8,0,0]} scale={sixDice ? .63 : .82}><Die playback={playback} pips={pips} face={value} reducedMotion={reducedMotion||revealAfterMs===0||settled} side={index%2?.35:-.35}/></group>):<Die playback={playback} pips={pips} face={face} reducedMotion={reducedMotion||revealAfterMs===0||settled}/>}
    </Canvas>}
    </SceneBoundary>
    <div className={`dice-result ${paired?'duel-result':''} ${multiple?'batch-result':''} ${ability?'ability-result':''}`} data-testid={active?paired?'duel-dice-value':multiple?'multi-dice-value':'dice-value':undefined}>{paired?<><span className="duel-values"><b>{settled?contenders[0]!.face:'·'}</b><i>:</i><b>{settled?contenders[1]!.face:'·'}</b></span><span>{settled?'双方点数确认 · 即将结算':'两人已投骰 · 同时揭晓'}</span></>:multiple?<><span className="dice-batch-values">{faces!.map((value,index)=><b key={index} aria-label={settled?`第${index+1}骰 ${value}点`:`第${index+1}骰投掷中`}>{settled?value:'·'}</b>)}</span><span>{settled?batchResult:sixDice?'六颗骰子同时投出':'两颗骰子同时投出'}</span></>:settled?<><b>{face}</b><span>{triggered?'点 · 触发三角人':stageActor||cause?.startsWith('twist-')?'点 · 即将结算赛场效果':cause?.startsWith('thirds-')?'点 · 即将结算事件':cause==='nemesis'||cause==='the-hose'?'点 · 即将结算能力':'点 · 即将出发'}</span>{ability&&detail&&<small className="dice-ability-detail">{detail}</small>}</>:<span>抛出 · 弹跳 · 停稳</span>}</div>
  </div>;
}
