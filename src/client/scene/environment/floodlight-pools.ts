import { Vector3 } from 'three';
import { spotDistanceAttenuation } from './floodlights.js';
export const VENUE_POOL_BUDGET={full:{spots:8,shadows:2},economy:{spots:4,shadows:0}} as const;
export function activeVenuePools<T extends {active:boolean}>(lamps:ReadonlyArray<T>,lowQuality=false){return lamps.filter(l=>!lowQuality||l.active);}
/** Local illumination is narrower than the former 68-degree half-angle wash.
 * Keep mount/aim geometry unchanged and leave readable cool ambient between pools. */
export function venuePoolPhotometry(position:Vector3,target:Vector3,lowQuality=false){
 const axis=target.clone().sub(position).normalize(),cosine=Math.max(.05,-axis.y),receivingDistance=position.distanceTo(target);
 const distance=receivingDistance*1.65,targetLux=lowQuality?1.05:.64;
 return {intensity:targetLux/(spotDistanceAttenuation(receivingDistance,distance)*cosine),distance,angle:.57,penumbra:.42,decay:2,targetLux,receivingDistance,cosine,position:position.toArray(),target:target.toArray()};
}
/** Unoccluded direct irradiance only: not a rendered pixel/visibility guarantee. */
export function poolIrradiance(position:Vector3,target:Vector3,point:Vector3,lowQuality=false){
 const p=venuePoolPhotometry(position,target,lowQuality),axis=target.clone().sub(position).normalize(),ray=point.clone().sub(position),r=ray.length();ray.normalize();
 const outer=Math.cos(p.angle),inner=Math.cos(p.angle*(1-p.penumbra)),t=Math.max(0,Math.min(1,(ray.dot(axis)-outer)/(inner-outer)));
 return p.intensity*spotDistanceAttenuation(r,p.distance)*Math.max(0,-ray.y)*t*t*(3-2*t);
}
