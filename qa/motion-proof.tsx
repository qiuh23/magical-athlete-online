/** Local browser QA only. Real Board3D, engine events, original character GLBs. */
import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {_roots} from '@react-three/fiber';
import {Mesh,InstancedMesh} from 'three';
import {Board3D} from '../src/client/scene/Board3D.js';
import {RoomLightingClock} from '../src/client/scene-lighting-clock.js';
import type {PresentationClock} from '../src/client/presentation-clock.js';
import {MOTION_ACTORS,MOTION_CASES,motionFixture} from './motion-fixtures.js';
import '../src/client/styles.css';
const lightingClock=new RoomLightingClock('motion-proof',{now:()=>0});
const visible=(n:any)=>{for(let p=n;p;p=p.parent)if(!p.visible)return false;return true;};
function snapshot(){
 const canvas=document.querySelector('canvas');const scene=canvas?_roots.get(canvas)?.store.getState().scene:undefined;
 const meshes:any[]=[];scene?.updateMatrixWorld(true);scene?.traverse(n=>{if(n instanceof Mesh&&visible(n))meshes.push({name:n.name,parent:n.parent?.name,anchor:(()=>{for(let p:any=n;p;p=p.parent)if(p.name.startsWith('coverage-active:'))return p.name.slice(16);return undefined;})(),matrix:n.matrixWorld.toArray(),morph:n.morphTargetInfluences??[],instances:n instanceof InstancedMesh?n.count:undefined});});
 return{meshes,ready:!!scene,actorReady:document.querySelector('.pawn-seat[data-racer-id="r0"]')?.getAttribute('data-model-ready')==='true'};
}
function App(){
 const params=new URLSearchParams(location.search),[scenario,setScenario]=useState(params.get('case')??MOTION_CASES[0].id),[actor,setActor]=useState(params.get('actor')??MOTION_ACTORS[0].label),[progress,setProgress]=useState(0),[low,setLow]=useState(params.get('low')==='1');
 const f=useMemo(()=>motionFixture(scenario,actor),[scenario,actor]);const clock=useMemo(()=>({now:()=>progress*f.beat.durationMs}) as PresentationClock,[progress,f]);
 useEffect(()=>{Object.assign(window,{__motionProof:{snapshot,setProgress}});for(const r of _roots.values())r.store.getState().invalidate();},[progress]);
 return <><div style={{position:'fixed',top:0,zIndex:1000,background:'#fff',padding:6,display:'flex',gap:8,flexWrap:'wrap'}}>
 <label>事件 <select aria-label="事件" value={scenario} onChange={e=>{setScenario(e.target.value);setProgress(0);}}>{MOTION_CASES.map(c=><option key={c.id}>{c.id}</option>)}</select></label>
 <label>角色 <select aria-label="角色" value={actor} onChange={e=>{setActor(e.target.value);setProgress(0);}}>{MOTION_ACTORS.map(a=><option key={a.label}>{a.label}</option>)}</select></label>
 <label>进度 <input aria-label="进度" type="range" min="0" max="1" step=".01" value={progress} onChange={e=>setProgress(Number(e.target.value))}/></label>
 {[0,.22,.5,1].map(t=><button key={t} onClick={()=>setProgress(t)}>{t}</button>)}
 <button onClick={()=>setLow(!low)}>{low?'经济画质':'标准画质'}</button><span>{f.beat.kind} {progress.toFixed(2)} · 真实引擎事件，手动抽帧</span>
 </div><Board3D key={`${scenario}:${actor}`} room={f.room} racers={f.racers} beat={f.beat} queue={f.queue} clock={clock} startedAt={0} durationMs={f.beat.durationMs} paused={false} lightingClock={lightingClock} lightingRunning={false} appearanceMode="day" lowQuality={low} reducedMotion={false} muted onDetail={()=>{}}/></>;
}
createRoot(document.getElementById('root')!).render(<App/>);
