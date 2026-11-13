import {useEffect,useMemo,useState} from 'react';
import type {RoomView} from '../shared/types.js';
import type {PresentationClock} from './presentation-clock.js';
import {RoomLightingClock,sceneLightingRoomKey,sceneLightingRunning} from './scene-lighting-clock.js';
/** App-owned: Race/Board unmounts between rounds, this room clock does not. */
export function useSceneLightingClock(room:RoomView|null,presentationClock:PresentationClock,online:boolean,backend:string){
 const [visible,setVisible]=useState(()=>typeof document==='undefined'||!document.hidden);
 const key=sceneLightingRoomKey(room,backend);
 const clock=useMemo(()=>{let storage:Storage|undefined;try{if(room&&Number.isFinite(room.createdAt))storage=sessionStorage;}catch{}return new RoomLightingClock(key,presentationClock,storage);},[key,presentationClock]);
 const running=sceneLightingRunning(room,online,visible);
 useEffect(()=>{clock.setRunning(running);return()=>clock.setRunning(false);},[clock,running]);
 useEffect(()=>{
  const changed=()=>{if(document.hidden)clock.setRunning(false);setVisible(!document.hidden);};
  const save=()=>clock.setRunning(false);
  const resume=()=>clock.setRunning(running&&!document.hidden);
  document.addEventListener('visibilitychange',changed);window.addEventListener('pagehide',save);window.addEventListener('pageshow',resume);
  return()=>{document.removeEventListener('visibilitychange',changed);window.removeEventListener('pagehide',save);window.removeEventListener('pageshow',resume);clock.save();};
 },[clock,running]);
 return {clock,running};
}
