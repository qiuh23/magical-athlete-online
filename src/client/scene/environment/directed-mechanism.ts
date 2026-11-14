import {rigidShapeEnvelopes} from '../mechanisms/rigid-shape-envelopes.js';
import {Box3,Matrix4,Mesh,Object3D,Vector3,type BufferGeometry} from 'three';
import {orientedSweep,orientedSeparation} from '../mechanisms/oriented-clearance.js';
import {punchWindStroke} from './force-presentation.js';

/** Frozen visible Pawn meshes, including ownership base, rider, form and fall.
 * Their IDs select the authority's target, never a character allowlist. */
export interface DirectedActor {id:string;bounds:Box3;parts:Box3[]}
export interface DirectedPlan {
 kind:'gain'|'punch';targetId:string;targetIds:string[];target:Vector3;boom:number;yaw:number;
 mode:'directed'|'hold';reason?:string;clearance:number;pressurePulse?:boolean;
}
const clamp=(t:number)=>Math.max(0,Math.min(1,t));
const smooth=(t:number)=>{t=clamp(t);return t*t*(3-2*t);};
const window=(t:number,a:number,b:number,c:number,d:number)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
const localBounds=new WeakMap<BufferGeometry,Box3>();
const frontPoints=new WeakMap<BufferGeometry,Vector3>();
/** Authored +X contact face vertices, cached before applying any rig/mount. */
export function authoredPunchFront(geometry:BufferGeometry){
 let point=frontPoints.get(geometry);if(!point){const p=geometry.getAttribute('position');let front=-Infinity,count=0;point=new Vector3();for(let i=0;i<p.count;i++)front=Math.max(front,p.getX(i));for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i)-front)<1e-6){point.add(new Vector3(p.getX(i),p.getY(i),p.getZ(i)));count++;}point.divideScalar(count);frontPoints.set(geometry,point);}return point.clone();
}
/** Compute static local bounds once per shared GLB geometry, not per frame. */
export function geometryBounds(geometry:BufferGeometry){
 let box=localBounds.get(geometry);if(!box){geometry.computeBoundingBox();box=geometry.boundingBox!.clone();localBounds.set(geometry,box);}return box;
}
export function boxSeparation(a:Box3,b:Box3){return Math.hypot(Math.max(0,a.min.x-b.max.x,b.min.x-a.max.x),Math.max(0,a.min.y-b.max.y,b.min.y-a.max.y),Math.max(0,a.min.z-b.max.z,b.min.z-a.max.z));}
export const DIRECTED_CLEARANCE=.10;
/** Stable outboard neutral, shared by idle batches and every active cycle. */
export const NATIVE_PUNCH_PARK_BOOM=-Math.PI/3;
/** A fixed set of outboard boom postures. No angular/path search, actors never
 * move to make room. The head's +X stroke is aimed independently of the boom. */
export const DIRECTED_BOOMS=[-Math.PI/3,-Math.PI/4,-Math.PI/6,0,-5*Math.PI/12,-Math.PI/2] as const;
export function createDirectedMechanism(kind:'gain'|'punch',object:Object3D){
 const require=(name:string)=>{const node=object.getObjectByName(name);if(!node)throw Error(`Missing directed mechanism joint ${name}`);return node;};
 const shoulder=kind==='gain'?require('GAIN_SHOULDER_X'):undefined,elbow=kind==='gain'?require('GAIN_ELBOW_X'):undefined;
 const boom=kind==='punch'?require('PUNCH_BOOM_Z'):undefined,counter=kind==='punch'?require('PUNCH_COUNTER_YAW'):undefined,slider=kind==='punch'?require('PUNCH_SLIDER_X'):undefined,spring=kind==='punch'?require('PUNCH_SPRING') as Mesh:undefined;
 const original=new Map([shoulder,elbow,boom,counter,slider].filter((x):x is Object3D=>!!x).map(n=>[n,{rotation:n.rotation.clone(),position:n.position.clone()}]));
 const parts:Mesh[]=[];object.traverse(n=>{if(n instanceof Mesh)parts.push(n);});
 // Build immutable rigid envelopes at asset/rig preparation, never per frame.
 parts.forEach(n=>rigidShapeEnvelopes(n.geometry));
 const sample=(plan:DirectedPlan,t:number)=>{
  t=clamp(t);if(plan.mode==='hold')t=0;
  if(shoulder&&elbow){
   // The authored arm rises along +Y. +X rotation bends it toward +Z;
   // rotate that bending plane toward the real target, not the tile center.
   const aim=window(t,0,.14,.78,1),lift=window(t,.14,.38,.60,.78);
   shoulder.rotation.set(original.get(shoulder)!.rotation.x+65*Math.PI/180*lift,plan.yaw*aim,0,'YXZ');
   elbow.rotation.copy(original.get(elbow)!.rotation);elbow.rotation.x-=Math.PI/6*lift;
  }else if(boom&&counter&&slider&&spring){
   const aim=window(t,0,.08,.40,.76),stroke=punchWindStroke(t);
   boom.rotation.set(0,NATIVE_PUNCH_PARK_BOOM+(plan.boom-NATIVE_PUNCH_PARK_BOOM)*aim,0);counter.rotation.set(0,-NATIVE_PUNCH_PARK_BOOM+(plan.yaw-plan.boom+NATIVE_PUNCH_PARK_BOOM)*aim,0);
   const travel=plan.pressurePulse?.25:.35;slider.position.x=.35+travel*stroke;if(spring.morphTargetInfluences)spring.morphTargetInfluences[0]=stroke*travel/.35;
  }
  object.updateMatrixWorld(true);
 };
 const inverse=new Matrix4(),matrix=new Matrix4(),point=new Vector3();
 const matrices=(mount:Matrix4)=>{object.updateWorldMatrix(true,true);inverse.copy(object.matrixWorld).invert();return parts.map(n=>mount.clone().multiply(inverse).multiply(n.matrixWorld));};
 const bounds=(mount:Matrix4)=>matrices(mount).map((m,i)=>geometryBounds(parts[i]!.geometry).clone().applyMatrix4(m));
 const surface=()=>{
  const mesh=require(kind==='punch'?'PUNCH_SLIDER_X__coral_fixed_batch':'GAIN_PALM') as Mesh;
  object.updateWorldMatrix(true,true);const p=kind==='punch'?authoredPunchFront(mesh.geometry):geometryBounds(mesh.geometry).getCenter(point);
  return p.clone().applyMatrix4(matrix.copy(object.matrixWorld).invert().multiply(mesh.matrixWorld));
 };
 // A radius bound from the real cached part corners and translation lengths
 // along its joint chain. Triangle inequality makes it valid at every yaw.
 const joints=[shoulder,elbow,boom,counter].filter((n):n is Object3D=>!!n);
 const radii=parts.map(mesh=>{
  let rotating=false,radius=0;const box=geometryBounds(mesh.geometry);
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])radius=Math.max(radius,new Vector3(x,y,z).multiply(mesh.scale).length());
  for(let n:Object3D|null=mesh;n&&n!==object;n=n.parent){if(n!==mesh)radius*=Math.max(Math.abs(n.scale.x),Math.abs(n.scale.y),Math.abs(n.scale.z));radius+=n.position.length();if(joints.includes(n))rotating=true;}
  return rotating?radius:0;
 });
 const ancestors=parts.map(mesh=>joints.flatMap((joint,i)=>{for(let n:Object3D|null=mesh;n&&n!==object;n=n.parent)if(n===joint)return [i*3,i*3+1,i*3+2];return [];}));
 const angles=()=>joints.flatMap(n=>[n.rotation.x,n.rotation.y,n.rotation.z]);
 // Each phase varies either translation/morph or rotations with ONE common
 // smooth parameter. Phase boundaries may not be crossed by an audit interval.
 const boundaries=kind==='punch'?[0,.08,.22,.38,.40,.76,1]:[0,.14,.38,.60,.78,1];
 const times=[0,...boundaries.slice(1).flatMap((end,i)=>Array.from({length:32},(_,j)=>boundaries[i]!+(end-boundaries[i]!)*(j+1)/32))];
 function audit(plan:DirectedPlan,mount:Matrix4,actors:readonly DirectedActor[]){
  let minimum=Infinity,previous:Box3[]|undefined,previousAngles:number[]|undefined,previousMatrices:Matrix4[]|undefined;
  const e=mount.elements,columns=[0,4,8].map(i=>new Vector3(e[i],e[i+1],e[i+2]));
  // Current mounts are rigid. For any future scaled/sheared mount, use the
  // Frobenius norm as a conservative upper bound on its largest linear scale.
  const rigid=columns.every(v=>Math.abs(v.lengthSq()-1)<1e-10)&&columns.every((v,i)=>columns.every((w,j)=>i===j||Math.abs(v.dot(w))<1e-10));
  const mountScale=rigid?1:Math.sqrt(columns.reduce((sum,v)=>sum+v.lengthSq(),0));
  // Fixed scene clearance is audited separately. An unchanged cabinet/hub
  // cannot move into an actor; do not suppress moving hardware merely because
  // a conservative box around an already-close fixed solid overlaps a pawn.
  sample(plan,0);const rest=matrices(mount),restMorph=parts.map(p=>[...(p.morphTargetInfluences??[])]),moving=parts.map(()=>false);
  for(const t of boundaries.slice(1)){sample(plan,t);const poses=matrices(mount);parts.forEach((part,i)=>{if(poses[i]!.elements.some((v,j)=>v!==rest[i]!.elements[j])||(part.morphTargetInfluences??[]).some((v,j)=>v!==restMorph[i]![j]))moving[i]=true;});}
  for(const t of times){
   sample(plan,t);const transforms=matrices(mount),current=transforms.map((m,i)=>geometryBounds(parts[i]!.geometry).clone().applyMatrix4(m)),currentAngles=angles();
   for(let j=0;j<current.length;j++){
    if(!moving[j])continue;
    const turn=previousAngles?ancestors[j]!.reduce((sum,i)=>sum+Math.abs(currentAngles[i]!-previousAngles![i]!),0):0;
    const sweep=current[j]!.clone();if(previous)sweep.union(previous[j]!);
    // For a chain of rotations linear in the common phase parameter, the
    // second derivative norm is <= R*(sum |joint angle delta|)^2. Linear
    // interpolation error is <= max|f''|/8. Endpoint box union plus this real
    // lever-derived padding therefore covers the intervening arc. Slider and
    // morph phases are axial/linear and their cached bounds contain the sweep.
    const bow=radii[j]!*mountScale*turn*turn/8+1e-9;sweep.expandByScalar(bow);
    let oriented:ReturnType<typeof orientedSweep>|undefined,refined:ReturnType<typeof orientedSweep>[]|undefined;
    for(const actor of actors){if(boxSeparation(sweep,actor.bounds)>=DIRECTED_CLEARANCE)continue;for(const part of actor.parts){
     let distance=boxSeparation(sweep,part);
     if(distance<DIRECTED_CLEARANCE){oriented??=orientedSweep(geometryBounds(parts[j]!.geometry),transforms[j]!,previousMatrices?.[j],bow);if(oriented)distance=Math.max(distance,orientedSeparation(oriented,part));}
     if(distance<DIRECTED_CLEARANCE){
      refined??=rigidShapeEnvelopes(parts[j]!.geometry).map(box=>orientedSweep(box,transforms[j]!,previousMatrices?.[j],bow));
      if(refined.every(Boolean))distance=Math.max(distance,Math.min(...refined.map(q=>orientedSeparation(q!,part))));
     }
     minimum=Math.min(minimum,distance);if(distance<DIRECTED_CLEARANCE)return {safe:false,minimum};
    }}
   }
   previous=current;previousAngles=currentAngles;previousMatrices=transforms;
  }
  return {safe:true,minimum};
 }
 function plan(mount:Matrix4,target:DirectedActor|readonly DirectedActor[],actors:readonly DirectedActor[]):DirectedPlan{
  const targets=Array.isArray(target)?target:[target as DirectedActor];if(!targets.length)throw Error('Directed mechanism requires an authorized target');
  const centers=targets.map(a=>a.bounds.getCenter(new Vector3())),targetWorld=centers.reduce((sum,v)=>sum.add(v),new Vector3()).divideScalar(centers.length),local=targetWorld.clone().applyMatrix4(mount.clone().invert());
  let first:DirectedPlan|undefined;
  const postures=kind==='punch'?[...DIRECTED_BOOMS.map(boom=>({boom,pulse:false})),{boom:NATIVE_PUNCH_PARK_BOOM,pulse:true}]:[{boom:0,pulse:false}];
  for(const posture of postures){const angle=posture.boom;
   const origin=kind==='punch'?new Vector3(-.85+.85*Math.cos(angle),.35,1.3-.85*Math.sin(angle)):shoulder!.position;
   const targetYaw=kind==='punch'?Math.atan2(origin.z-local.z,local.x-origin.x):Math.atan2(local.x-origin.x,local.z-origin.z);
   // One bounded non-contact pressure posture keeps a substantial targetward pressure stroke
   // when turning the complete housing toward a down body cannot clear it.
   const yaw=posture.pulse?Math.max(-Math.PI/4,Math.min(Math.PI/4,targetYaw)):targetYaw;
   const candidate:DirectedPlan={kind,targetId:targets[0]!.id,targetIds:targets.map(a=>a.id),target:targetWorld.clone(),boom:angle,yaw,mode:'directed',clearance:Infinity,pressurePulse:posture.pulse};first??=candidate;
   sample(candidate,0);const parked=surface().applyMatrix4(mount);sample(candidate,kind==='punch'?.08:.14);const from=surface().applyMatrix4(mount);sample(candidate,kind==='punch'?.22:.38);const to=surface().applyMatrix4(mount);
   if(!centers.every(center=>to.distanceToSquared(center)<from.distanceToSquared(center)&&to.distanceToSquared(center)<parked.distanceToSquared(center)))continue;
   const result=audit(candidate,mount,actors);candidate.clearance=result.minimum;
   if(result.safe){sample(candidate,0);return candidate;}
  }
  const held={...first!,mode:'hold' as const,reason:'Conservative visible-mesh sweep could not establish clearance'};sample(held,0);return held;
 }
 return{kind,sample,plan,bounds,surface};
}
