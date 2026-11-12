import {Quaternion,Vector3} from 'three';
export interface FallDirection {x:number;z:number}
export interface DownPoseDescriptor {direction:FallDirection;geometryKey:string;eventId:number;kind:'geometry-supported'}
export interface FallSupport {direction:FallDirection;standing:[number,number,number,number];minAngle:number;maxAngle:number;angles:readonly number[];heights:readonly number[];errorMargin:number}
function unit(direction:FallDirection){const n=Math.hypot(direction.x,direction.z);if(!Number.isFinite(n)||n<1e-9)throw Error('A finite nonzero fall direction is required');return {x:direction.x/n,z:direction.z/n};}
/** +Y cross desired XZ direction is a horizontal axis. At angle0 this is the
 * unchanged standing pose; no artificial upright spin precedes falling. */
export function fallQuaternion(direction:FallDirection,angle:number,standing=new Quaternion()){
 const d=unit(direction);return new Quaternion().setFromAxisAngle(new Vector3(d.z,0,-d.x),angle).multiply(standing);
}
/** Input vertices include the full rigid/bind pawn body: base, cap, authored
 * sculpture transforms and mount. Rotation preserves triangular planes, so
 * minimum vertex Y also bounds every triangle. This is floor support only,
 * never proof against another pawn or machine. World scale is applied later. */
export function buildFallSupport(vertices:ArrayLike<number>,direction:FallDirection,standing=new Quaternion(),segments=128):FallSupport {
 if(vertices.length%3||vertices.length===0||!Number.isInteger(segments)||segments<8)throw Error('Invalid support geometry');
 const d=unit(direction),minAngle=-.1,maxAngle=Math.PI/2,step=(maxAngle-minAngle)/segments,p=new Vector3();let radius=0;
 for(let i=0;i<vertices.length;i+=3){p.set(vertices[i]!,vertices[i+1]!,vertices[i+2]!);if(!p.toArray().every(Number.isFinite))throw Error('Invalid vertex');radius=Math.max(radius,p.length());}
 const angles=[...new Set([...Array.from({length:segments+1},(_,sample)=>minAngle+step*sample),0])].sort((a,b)=>a-b);
 const heights=angles.map(angle=>{const q=fallQuaternion(d,angle,standing);let minY=Infinity;for(let i=0;i<vertices.length;i+=3){p.set(vertices[i]!,vertices[i+1]!,vertices[i+2]!).applyQuaternion(q);minY=Math.min(minY,p.y);}return Math.max(0,-minY);});
 // For each rotated point |d²y/dθ²|≤radius. Linear interpolation of the upper
 // endpoint envelope plus this bound cannot under-estimate required support.
 return {direction:d,standing:standing.toArray(),minAngle,maxAngle,angles,heights,errorMargin:radius*step*step/8+1e-6};
}
export function sampleSupportedFall(support:FallSupport,angle:number){
 const theta=Math.max(support.minAngle,Math.min(support.maxAngle,angle));let lo=0,hi=support.angles.length-1;while(hi-lo>1){const middle=(hi+lo)>>1;if(support.angles[middle]!<=theta)lo=middle;else hi=middle;}const index=lo,t=(theta-support.angles[index]!)/(support.angles[index+1]!-support.angles[index]!),margin=t<1e-12||t>1-1e-12?1e-6:support.errorMargin;
 return {quaternion:fallQuaternion(support.direction,theta,new Quaternion(...support.standing)),lift:support.heights[index]!*(1-t)+support.heights[index+1]!*t+margin};
}
interface SavedPose {racerId:string;pose:DownPoseDescriptor;status:'pending'|'down'}
/** No network/rule writes. A caller may persist dump() in this match's local
 * display cache. A new client without a matching ledger must independently
 * reconstruct a safe STATIC baseline; it must not replay a guessed old fall. */
export class DownPoseLedger {
 private entries=new Map<string,SavedPose>();
 constructor(readonly scope:string){}
 get(racerId:string){return this.entries.get(racerId)?.pose;}
 begin(racerId:string,alreadyDown:boolean,pose:DownPoseDescriptor){if(alreadyDown||this.entries.has(racerId))return false;const direction=unit(pose.direction);if(!pose.geometryKey||!Number.isInteger(pose.eventId))return false;this.entries.set(racerId,{racerId,pose:{...pose,direction},status:'pending'});return true;}
 /** The supplied pose must already have a current-layout static clearance proof.
  * Adoption never starts a fall animation or claims recovery of lost history. */
 adoptStaticBaseline(racerId:string,currentlyDown:boolean,pose:DownPoseDescriptor){if(!currentlyDown||this.entries.has(racerId)||!pose.geometryKey||!Number.isInteger(pose.eventId))return false;this.entries.set(racerId,{racerId,pose:{...pose,direction:unit(pose.direction)},status:'down'});return true;}
 confirm(racerId:string){const entry=this.entries.get(racerId);if(entry)entry.status='down';}
 recovered(racerId:string){this.entries.delete(racerId);}
 reconcile(racers:readonly {id:string;tripped:boolean;eliminated:boolean}[],activeTripTargets:readonly string[]=[]){for(const[id]of this.entries){const racer=racers.find(r=>r.id===id);if(!racer||racer.eliminated||(!racer.tripped&&!activeTripTargets.includes(id)))this.entries.delete(id);}}
 dump(){return JSON.stringify({version:1,scope:this.scope,entries:[...this.entries.values()].filter(e=>e.status==='down')});}
 restore(serialized:string){let data:any;try{data=JSON.parse(serialized);}catch{return false;}if(data?.version!==1||data.scope!==this.scope||!Array.isArray(data.entries))return false;const next=new Map<string,SavedPose>();try{for(const e of data.entries){if(typeof e.racerId!=='string'||e.status!=='down'||e.pose?.kind!=='geometry-supported'||typeof e.pose.geometryKey!=='string'||!Number.isInteger(e.pose.eventId)||next.has(e.racerId))return false;const pose={...e.pose,direction:unit(e.pose.direction)};next.set(e.racerId,{racerId:e.racerId,status:'down',pose});}}catch{return false;}this.entries=next;return true;}
}
