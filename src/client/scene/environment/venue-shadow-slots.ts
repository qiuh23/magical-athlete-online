import {Vector3,type SpotLight} from 'three';
import {poolIrradiance,venuePoolPhotometry} from './floodlight-pools.js';
export type ShadowLamp={id:string;receiver:Vector3;target:Vector3};
/** Two persistent shadow textures follow the most important fixed lamp sources,
 * never the actors. Small hysteresis avoids oscillating at overlapping pools. */
export function selectVenueShadowLamps(lamps:ReadonlyArray<ShadowLamp>,samples:ReadonlyArray<Vector3>,previous:ReadonlyArray<string>=[],budget=2){
 const scored=lamps.map((lamp,index)=>({id:lamp.id,index,score:samples.reduce((sum,p)=>sum+poolIrradiance(lamp.receiver,lamp.target,p),0)*(previous.includes(lamp.id)?1.12:1)})).sort((a,b)=>b.score-a.score||a.index-b.index);
 const selected=scored.slice(0,Math.min(budget,lamps.length)).map(x=>x.id);
 return [...previous.filter(id=>selected.includes(id)),...selected.filter(id=>!previous.includes(id))];
}
/** Reassign fixed sources to existing lights so at most two shadow maps can ever
 * be allocated. No per-lamp map cache and no moving/actor-following light source. */
export function assignVenueShadowSlots(slots:Array<{light:SpotLight;intensity:number}>,lamps:ReadonlyArray<ShadowLamp>,selected:ReadonlyArray<string>,lowQuality:boolean){
 const ordered=[...selected.map(id=>lamps.find(l=>l.id===id)!).filter(Boolean),...lamps.filter(l=>!selected.includes(l.id))];
 ordered.forEach((lamp,i)=>{const slot=slots[i]!;const p=venuePoolPhotometry(lamp.receiver,lamp.target,lowQuality);slot.light.name=`local-spot:${lamp.id}`;slot.light.position.copy(lamp.receiver);slot.light.target.position.copy(lamp.target);slot.light.distance=p.distance;slot.light.angle=p.angle;slot.light.penumbra=p.penumbra;slot.light.decay=p.decay;slot.intensity=p.intensity;slot.light.shadow.camera.far=p.distance;slot.light.shadow.needsUpdate=true;});
}
