import type {RoomView} from '../shared/types.js';
import type {PresentationClock} from './presentation-clock.js';
/** Nine visible race minutes: day → dusk → night → dawn. Independent of turns. */
export const SCENE_LIGHT_CYCLE_MS=540_000;
const LEGACY_LIGHT_CYCLE_MS=180_000;
/** One local room identity, deliberately independent of round, track or snapshot version. */
export function sceneLightingRoomKey(room:RoomView|null,backend=''){return room?JSON.stringify([room.backendId??backend,room.code,room.createdAt??'unversioned']):'no-room';}
export function sceneLightingRunning(room:RoomView|null,online:boolean,visible:boolean){return !!room&&room.phase==='race'&&!room.closedAt&&!room.pause&&online&&visible;}
export function automaticLightPhase(elapsed:number){const t=((elapsed%SCENE_LIGHT_CYCLE_MS)+SCENE_LIGHT_CYCLE_MS)%SCENE_LIGHT_CYCLE_MS;return 1-Math.cos(2*Math.PI*t/SCENE_LIGHT_CYCLE_MS);}
interface Storage {getItem(key:string):string|null;setItem(key:string,value:string):void}
/** PresentationClock measures real visible match seconds, not beat duration/speed.
 * Store only a bounded local phase. No offline elapsed time or protocol changes. */
export class RoomLightingClock {
 private elapsed=0;private last:number;private lastSaved:number;private running=false;
 readonly storageKey:string;
 constructor(readonly roomKey:string,private clock:Pick<PresentationClock,'now'>,private storage?:Storage){
  this.storageKey=`magical-athlete:room-lighting-v1:${roomKey}`;this.last=this.lastSaved=clock.now();
  try{const saved=JSON.parse(storage?.getItem(this.storageKey)??'null');if(saved?.version===1&&Number.isFinite(saved.elapsed)&&saved.elapsed>=0){const savedCycle=Number.isFinite(saved.cycleMs)&&saved.cycleMs>0?saved.cycleMs:LEGACY_LIGHT_CYCLE_MS;this.elapsed=(saved.elapsed%savedCycle)/savedCycle*SCENE_LIGHT_CYCLE_MS;}}catch{/* Optional local display state. */}
 }
 now(){const at=this.clock.now(),delta=Math.max(0,at-this.last);this.last=at;if(this.running)this.elapsed=(this.elapsed+delta)%SCENE_LIGHT_CYCLE_MS;if(at-this.lastSaved>=5000)this.persist(at);return this.elapsed;}
 setRunning(running:boolean){this.now();this.running=running;if(!running)this.persist(this.last);}
 save(){this.now();this.persist(this.last);}
 private persist(at:number){this.lastSaved=at;try{this.storage?.setItem(this.storageKey,JSON.stringify({version:1,elapsed:this.elapsed,cycleMs:SCENE_LIGHT_CYCLE_MS}));}catch{/* Storage failure cannot stop a match. */}}
}
