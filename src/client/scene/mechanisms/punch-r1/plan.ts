import {Matrix4,Ray,Triangle,Vector3,type Object3D,Mesh}from'three';
import type {TrackId}from'../../../../shared/tracks.js';
import {nextTrackNodes}from'../../../../shared/track-topology.js';
import {TRACKS}from'../../../../shared/tracks.js';
import {boardPoint}from'../../math.js';
import type {ActorGeometrySnapshot}from'../actor-snapshot.js';
import {bindRebuildDriver,interpolate,type RebuildPose}from'../../../../../art/mechanisms/punch-rebuild-r1/driver.js';
export const R1_PARK:Readonly<RebuildPose>={boomYaw:Math.PI/2,headYaw:0,reach:0,stroke:0};
export const R1_ASSET='/models/mechanisms/punch-rebuild-r1.glb';
export const R1_SOFT='PUNCH_SLIDER_X__coral_fixed_batch';
export const R1_NODES=[23,24] as const;
export function r1Mount(track:TrackId,node:number,compact:boolean){
 if(track!=='wild'||!R1_NODES.includes(node as 23|24))return;
 const special=TRACKS[track].specials[node];if(special?.kind!=='arrow')return;
 const next=nextTrackNodes(TRACKS[track],node,Math.sign(special.move??1))[0];if(next===undefined)return;
 const origin=new Vector3(...boardPoint(node,compact,track)),dest=new Vector3(...boardPoint(next,compact,track)),direction=dest.sub(origin).normalize();
 const yaw=Math.atan2(-direction.z,direction.x),matrix=new Matrix4().makeRotationY(yaw),offset=new Vector3(-.55,0,node===23?-.36:-.25).applyMatrix4(matrix);matrix.setPosition(origin.clone().add(offset));
 return{node,track,compact,matrix,yaw,direction,origin,next};
}
export interface R1Solution {pose:RebuildPose;contactStroke:number;targetPoint:number[];fistPoint:number[];actorPart:string;actorTriangle:number;softTriangle:number;rigVersion:'punch-rebuild-r1';}
const v=()=>new Vector3();
/** Actual target triangle queries, never an AABB hit or pawn-origin proxy.
 * Bounds may cull candidates elsewhere. This creates candidates only; a separate
 * exact-input finite swept certificate is required by the runtime consumer. */
export function solveR1Surface(rig:Object3D,snapshot:ActorGeometrySnapshot,actorInMount:Matrix4,pathDirectionInMount:Vector3,acceptCandidate:(s:R1Solution)=>boolean=()=>true):R1Solution|undefined{
 const rawHeading=Math.atan2(-pathDirectionInMount.z,pathDirectionInMount.x);
 if(rawHeading<-1e-10||rawHeading>Math.PI/6+1e-10||Math.abs(pathDirectionInMount.y)>1e-6)return;
 const heading=Math.max(0,Math.min(Math.PI/6,rawHeading));
 const driver=bindRebuildDriver(rig),soft=rig.getObjectByName(R1_SOFT);if(!(soft instanceof Mesh))throw Error('Missing real soft fist');
 const target=snapshot.parts.map(part=>({part,vertices:Array.from({length:part.positions.length/3},(_,i)=>new Vector3().fromArray(part.positions,i*3).applyMatrix4(actorInMount))}));
 const tri=new Triangle(),a=v(),b=v(),c=v(),normal=v(),hit=v(),direction=new Vector3(Math.cos(heading),0,-Math.sin(heading));
 // Small bounded search; arm does not turn while telescoped. Each returned
 // witness is an actual soft-triangle point and a real target-triangle hit.
 for(const boomYaw of [Math.PI*80/180,Math.PI*85/180,Math.PI/2])for(const reach of [.15,.10,.05,0,.20,.25,.30]){
  const pose={...R1_PARK,boomYaw,headYaw:heading,reach};driver.sample(pose);rig.updateMatrixWorld(true);
  const matrix=rig.matrixWorld.clone().invert().multiply(soft.matrixWorld),positions=soft.geometry.getAttribute('position'),index=soft.geometry.index;
  let best:{distance:number;point:Vector3;start:Vector3;part:string;triangle:number;softTriangle:number}|undefined;
  for(let i=0;i<(index?.count??positions.count);i+=3){
   const ids=[0,1,2].map(j=>index?.getX(i+j)??i+j);soft.getVertexPosition(ids[0]!,a).applyMatrix4(matrix);soft.getVertexPosition(ids[1]!,b).applyMatrix4(matrix);soft.getVertexPosition(ids[2]!,c).applyMatrix4(matrix);tri.set(a,b,c).getNormal(normal);if(normal.dot(direction)<.65)continue;
   const start=tri.getMidpoint(v()),ray=new Ray(start,direction);
   for(const {part,vertices}of target)for(let j=0;j<part.indices.length;j+=3){
    const p=ray.intersectTriangle(vertices[part.indices[j]!]!,vertices[part.indices[j+1]!]!,vertices[part.indices[j+2]!]!,false,hit);if(!p)continue;
    const d=p.distanceTo(start);if(d<.035||d>.335)continue;if(!best||d<best.distance)best={distance:d,point:p.clone(),start:start.clone(),part:part.name,triangle:j/3,softTriangle:i/3};
   }
  }
  if(best){const candidate:R1Solution={pose,contactStroke:best.distance,targetPoint:best.point.toArray(),fistPoint:best.start.toArray(),actorPart:best.part,actorTriangle:best.triangle,softTriangle:best.softTriangle,rigVersion:'punch-rebuild-r1'};if(acceptCandidate(candidate)){driver.sample(R1_PARK);return candidate;}}
 }
 driver.sample(R1_PARK);return;
}
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
export function r1Route(t:number){return smooth((t-.43)/.39);}
export function r1Pose(solution:R1Solution,t:number){
 const aim={...solution.pose,reach:0,stroke:0},reach={...solution.pose,stroke:0},contact={...solution.pose,stroke:solution.contactStroke+.005};
 const steps=[{end:.12,pose:aim},{end:.30,pose:reach},{end:.43,pose:contact},{end:.57,pose:reach},{end:.82,pose:reach},{end:.90,pose:aim},{end:1,pose:{...R1_PARK}}];
 let start=0,from={...R1_PARK};for(const step of steps){if(t<=step.end)return interpolate(from,step.pose,(t-start)/(step.end-start));start=step.end;from=step.pose;}return{...R1_PARK};
}
export function r1Signature(s:R1Solution){return JSON.stringify([s.rigVersion,...Object.values(s.pose),s.contactStroke,...s.targetPoint,...s.fistPoint,s.actorPart,s.actorTriangle,s.softTriangle].map(x=>typeof x==='number'?Math.round(x*1e6)/1e6:x));}

/** Cheap action-time re-evaluation of an audited witness: real soft triangle to
 * the real actor triangle. No broad search/BVH in the 650 ms presentation beat.
 * Exact full actor hash and scene/mount/path evidence remain mandatory. */
export function verifyR1Witness(rig:Object3D,snapshot:ActorGeometrySnapshot,actorInMount:Matrix4,expected:R1Solution):R1Solution|undefined{
 const part=snapshot.parts.find(p=>p.name===expected.actorPart);if(!part||expected.actorTriangle*3+2>=part.indices.length)return;
 const driver=bindRebuildDriver(rig);driver.sample({...expected.pose,stroke:0});
 const soft=rig.getObjectByName(R1_SOFT);if(!(soft instanceof Mesh))return;
 const pos=soft.geometry.getAttribute('position'),index=soft.geometry.index,i=expected.softTriangle*3;if(i+2>=(index?.count??pos.count))return;
 const matrix=rig.matrixWorld.clone().invert().multiply(soft.matrixWorld),vertices=[0,1,2].map(j=>soft.getVertexPosition(index?.getX(i+j)??i+j,new Vector3()).applyMatrix4(matrix));
 const start=new Triangle(...vertices as[Vector3,Vector3,Vector3]).getMidpoint(new Vector3()),direction=new Vector3(Math.cos(expected.pose.headYaw),0,-Math.sin(expected.pose.headYaw)),triangle=[0,1,2].map(j=>new Vector3().fromArray(part.positions,part.indices[expected.actorTriangle*3+j]!*3).applyMatrix4(actorInMount)),hit=new Ray(start,direction).intersectTriangle(...triangle as[Vector3,Vector3,Vector3],false,new Vector3());driver.sample(R1_PARK);
 if(!hit)return;const actual={...expected,contactStroke:hit.distanceTo(start),targetPoint:hit.toArray(),fistPoint:start.toArray()};return r1Signature(actual)===r1Signature(expected)?actual:undefined;
}
