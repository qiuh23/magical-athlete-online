import {createDirectedMechanism,NATIVE_PUNCH_PARK_BOOM,authoredPunchFront} from './directed-mechanism.js';
import {createTripSweepRig,sampleTripSweep,type TripSweepPlan} from './trip-sweep.js';
import {boardPoint} from '../math.js';
import {Box3,BoxGeometry,Group,InstancedMesh,Matrix4,Mesh,MeshStandardMaterial,Object3D,Vector3,type AnimationClip} from 'three';
import type {TrackId} from '../../../shared/tracks.js';
import {mechanismPlacements,type MechanismPlacement} from '../mechanisms/placements.js';
import {createMechanismInstance,MECHANISM_URLS} from '../mechanisms/models.js';
import {createTelescopicTripInstance} from '../mechanisms/telescopic-trip.js';
import {CERTIFIED_TRIP_URL} from '../mechanisms/certified-trip.js';
import {SCENE_MECHANISMS} from './scene-mechanisms.js';
import {PARKED_FALLBACKS} from './parked-fallbacks/visibility.js';
import {R1_ASSET,R1_PARK,r1Mount} from '../mechanisms/punch-r1/plan.js';
import {punchWindStroke} from './force-presentation.js';
import {r1FootBounds} from '../mechanisms/punch-r1/support.js';
import {buildWild13GroundTongue} from './deck-runtime.js';
import {bindRebuildDriver} from '../../../../art/mechanisms/punch-rebuild-r1/driver.js';
import type {MechanismAction,MechanismKind} from '../mechanisms/events.js';
export type DisplayVariant=MechanismKind|'telescopic-trip'|'punch-r1';
export const DISPLAY_URLS:Record<DisplayVariant,string>={...MECHANISM_URLS,'telescopic-trip':CERTIFIED_TRIP_URL,'punch-r1':R1_ASSET};
export function displayContactCompatible(anchor:string){return !['wild:23','wild:24','boardwalks:19','boardwalks:23'].includes(anchor);}
export function displayTripParkHeight(placement:DisplayPlacement,track:TrackId,compact:boolean){const tile=new Vector3(...boardPoint(placement.anchor.node,compact,track)).applyMatrix4(placement.matrix.clone().invert());return Math.max(tile.y+.30,-1.175);}
export interface DisplayPlacement extends MechanismPlacement {variant:DisplayVariant;foundationBottom:number}
/** Visual coverage is independent of actor readiness, occupancy and physical
 * admission. Existing published mounts and art remain authoritative inputs. */
export function fullCoveragePlacements(track:TrackId,compact=false):DisplayPlacement[]{
 return mechanismPlacements(track,compact).map(p=>{
  const parked=PARKED_FALLBACKS.fixtures.find(f=>f.anchor===p.anchor.id),proof=SCENE_MECHANISMS.approved.find(f=>f.anchor===p.anchor.id),r1=r1Mount(track,p.anchor.node,compact);
  const matrix=r1?.matrix.clone()??(parked?new Matrix4().fromArray(parked.mount):p.matrix.clone());
  if(parked&&compact)matrix.premultiply(new Matrix4().makeRotationY(-Math.PI/2));
  // Display parking has its own finite clearance evidence. Contact consumers
  // continue to use the untouched certified mount, never this offset.
  if(track==='boardwalks'&&[19,23].includes(p.anchor.node))matrix.multiply(new Matrix4().makeTranslation(p.anchor.node===23?.70:0,0,.45));
  if(r1)matrix.multiply(new Matrix4().makeTranslation(0,0,1.2));
  // Native punch cabinets need a stable outboard stand-off from the existing
  // world-space crowd grid. Every display consumer uses this same mount.
  if(p.anchor.kind==='punch'&&!r1)matrix.multiply(new Matrix4().makeTranslation(0,0,p.anchor.id==='boardwalks:9'?.80:['squiggle:14','boardwalks:32','boardwalks:50'].includes(p.anchor.id)?.70:.35));
  const variant:DisplayVariant=r1?'punch-r1':p.anchor.kind==='trip'&&SCENE_MECHANISMS.fixtures.some(f=>f.key.startsWith(`${track}/${p.anchor.node}/`))?'telescopic-trip':p.anchor.kind;
  return{...p,matrix,variant,foundationBottom:r1?.104:parked?.foundation.bottom??proof?.foundationBottom??.02};
 });
}
const clampUnit=(value:number)=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;
const smoothUnit=(value:number)=>{const t=clampUnit(value);return t*t*(3-2*t);};
const motionWindow=(t:number,riseStart:number,riseEnd:number,fallStart:number,fallEnd:number)=>smoothUnit((t-riseStart)/(riseEnd-riseStart))*(1-smoothUnit((t-fallStart)/(fallEnd-fallStart)));
/** Trip uses a visible single-arm sweep adapter and a geometry-derived plan.
 * Other categories keep their non-contact outboard cycle. All roots and fixed
 * foundations stay stationary, and cached authored assets are never changed. */
export function createDisplayMechanism(variant:DisplayVariant,source:Group,clip:AnimationClip|undefined,low=false,anchor='',tripHeight=.22){
 if(variant==='telescopic-trip'||variant==='trip'){
  const model=variant==='telescopic-trip'?createTelescopicTripInstance(source,low):createMechanismInstance(source,clip!,low);
  if('sampleTripPose' in model)model.sample(0);if(anchor==='wild:5'&&variant==='trip')model.fitWild5Foot();
  const sweep=createTripSweepRig(model.object,tripHeight,low);
  return{object:model.object,sweep,dispose(){sweep.dispose();model.dispose();},sample(t:number,active=false,motionScale=1,plan?:TripSweepPlan){
   t=active?clampUnit(t):0;
   if(plan)sweep.sample(sampleTripSweep(plan,t));
   else{sweep.sample({yaw:-Math.PI/3*clampUnit(motionScale)*motionWindow(t,0,.20,.76,1),reach:.46+.55*clampUnit(motionScale)*motionWindow(t,.20,.44,.58,.76),height:tripHeight});}
  }};
 }
 if(variant==='punch-r1'){
  const object=source.clone(true),driver=bindRebuildDriver(object);
  object.traverse(n=>{if(n instanceof Mesh){n.castShadow=n.receiveShadow=!low;n.raycast=()=>{};}});
  return{object,dispose(){},sample(t:number,active=false,motionScale=1){
   t=active?clampUnit(t):0;const scale=clampUnit(motionScale);
   // Telescope first, fire from .08 to .38, retract the fist before the arm.
   // R1 display mounts already move the whole static foundation 1.2m outboard.
   driver.sample({...R1_PARK,reach:.25*scale*motionWindow(t,0,.08,.38,.64),stroke:.35*scale*punchWindStroke(t)});
  }};
 }
 if(!clip)throw Error(`Missing authored clip for ${variant}`);
 const model=createMechanismInstance(source,clip,low);model.sample(0);if(anchor==='wild:5')model.fitWild5Foot();
 const joint=(name:string)=>{const node=model.object.getObjectByName(name);if(!node)throw Error(`Missing display joint ${name}`);return node;};
 // Absolute writes are essential: repeatedly sampling the same mixer time does
 // not restore manual edits when Three's property mixer skips unchanged values.
 const shoulder=variant==='gain'?joint('GAIN_SHOULDER_X'):undefined,elbow=variant==='gain'?joint('GAIN_ELBOW_X'):undefined;
 const bell=variant==='loss'?joint('LOSS_HEAD_X'):undefined;
 const leftDoor=variant==='warp'?joint('WARP_DOOR_L_Z'):undefined,rightDoor=variant==='warp'?joint('WARP_DOOR_R_Z'):undefined;
 const base=new Map([shoulder,elbow,bell,leftDoor,rightDoor].filter((n):n is Object3D=>!!n).map(n=>[n,n.rotation.clone()]));
 const directional=variant==='gain'||variant==='punch'?createDirectedMechanism(variant,model.object):undefined;
 return{object:model.object,directional,dispose:model.dispose,sample(t:number,active=false,motionScale=1){
  t=active?clampUnit(t):0;const scale=clampUnit(motionScale);
  if(variant==='punch'){
   const aim=-NATIVE_PUNCH_PARK_BOOM+Math.PI/6*scale*motionWindow(t,0,.08,.40,.76),stroke=scale*punchWindStroke(t);
   model.samplePunchPose({boom:-aim,counter:aim,slider:.35+.35*stroke,spring:stroke,route:0});

  }else if(shoulder&&elbow){
   const lift=scale*motionWindow(t,.02,.38,.60,.94);
   shoulder.rotation.copy(base.get(shoulder)!);shoulder.rotation.x+=65*Math.PI/180*lift;
   elbow.rotation.copy(base.get(elbow)!);elbow.rotation.x-=Math.PI/6*lift;
  }else if(bell){
   bell.rotation.copy(base.get(bell)!);bell.rotation.x+=t<=0||t>=1?0:(22*Math.PI/180)*scale*Math.sin(6*Math.PI*t)*Math.sin(Math.PI*t)**2;
  }else if(leftDoor&&rightDoor){
   const open=70*Math.PI/180*scale*motionWindow(t,.02,.25,.72,.98);
   leftDoor.rotation.copy(base.get(leftDoor)!);leftDoor.rotation.y-=open;
   rightDoor.rotation.copy(base.get(rightDoor)!);rightDoor.rotation.y+=open;
  }
  model.object.updateMatrixWorld(true);
 }};
}
/** Actual authored glove surface in the model's local mount coordinates.
 * Read after sampling the release pose; callers apply the same display mount.
 * This stays correct for adapted stroke/aim and for a transformed parent. */
export function displayPunchOutlet(object:Object3D){
 object.updateWorldMatrix(true,true);
 const glove=object.getObjectByName('PUNCH_SLIDER_X__coral_fixed_batch');
 if(!(glove instanceof Mesh))throw Error('Missing authored punch glove surface');
 const toLocal=object.matrixWorld.clone().invert().multiply(glove.matrixWorld);
 return authoredPunchFront(glove.geometry).applyMatrix4(toLocal);
}
/** Static support for every displayed assembly, including previously unsupported
 * Wild16. Exact foot geometry supplies the top and footprint; the extension
 * joins existing terrain, rather than floating a base beyond it. */
export function buildDisplayFoundation(placement:DisplayPlacement,model:Group,compact:boolean){
 const root=new Group();root.name=`display-foundation:${placement.anchor.id}`;
 const footName=placement.variant==='punch'?'PUNCH_ROOT__teal_fixed_batch':placement.variant==='punch-r1'?'PUNCH_FIXED_FOOT':`${placement.anchor.kind.toUpperCase()}_FOOT`;
 let foot=model.getObjectByName(footName)??model.getObjectByName('TRIP_FIXED_FOOT');
 if(placement.variant==='punch-r1')foot=model.getObjectByName('PUNCH_FIXED_FOOT')??model.getObjectByName('PUNCH_ROOT__teal_fixed_batch');
 if(!foot){model.traverse(n=>{if(!foot&&n.name.includes('FOOT'))foot=n;});}
 if(!foot)return root;
 model.updateMatrixWorld(true);const local=placement.variant==='punch-r1'?r1FootBounds(model):new Box3().setFromObject(foot),min=local.min.clone(),max=local.max.clone();
 // The old punch batches its column and foot; its true bottom 35 mm is the foot.
 if(placement.variant==='punch')max.y=min.y+.035;
 const bottom=placement.anchor.id==='boardwalks:19'?.14:placement.anchor.id==='boardwalks:23'?0:placement.foundationBottom,worldTop=new Vector3(0,min.y,0).applyMatrix4(placement.matrix).y;
 // Squiggle14's decorative 2cm lip alone enters the moss edge after the
 // native stand-off. Keep the complete authored foot footprint, omit that lip.
 const border=['boardwalks:19','squiggle:14'].includes(placement.anchor.id)?0:.04;
 const size=new Vector3(max.x-min.x+border,Math.max(.02,worldTop-bottom),max.z-min.z+border),center=new Vector3((min.x+max.x)/2,min.y-size.y/2,(min.z+max.z)/2);
 const material=new MeshStandardMaterial({color:'#65857b',roughness:.8});
 const slab=(name:string,dimensions:Vector3,at:Vector3)=>{const mesh=new Mesh(new BoxGeometry(...dimensions.toArray() as[number,number,number]),material);mesh.matrixAutoUpdate=false;mesh.matrix.copy(placement.matrix).multiply(new Matrix4().makeTranslation(...at.toArray() as[number,number,number]));mesh.name=name;mesh.receiveShadow=true;root.add(mesh);};
 if(placement.anchor.id==='squiggle:14'){
  // The outboard moss is 0.12m high. Keep the complete authored foot on an
  // upper plate; a ground-bearing lower step ends 10mm before the actual moss
  // footprint at local Z=1.9647168. No terrain cut or floating full-height base.
  const mossTop=.120000020,rootY=placement.matrix.elements[13]!,lowerEnd=1.9647168-.01;
  slab('coverage-footprint-plinth',new Vector3(size.x,worldTop-mossTop,size.z),new Vector3(center.x,(worldTop+mossTop)/2-rootY,center.z));
  slab('squiggle14-ground-step',new Vector3(size.x,mossTop-bottom,lowerEnd-min.z),new Vector3(center.x,(mossTop+bottom)/2-rootY,(min.z+lowerEnd)/2));
 }else slab('coverage-footprint-plinth',size,center);
 if(placement.anchor.id==='boardwalks:19'){
  for(const [x,z]of [[-.6,1.27],[-.6,1.97],[.6,1.27],[.6,1.67]]){const post=new Mesh(new BoxGeometry(.08,.141,.08),material);post.name='meadow-clear-bridge-post';post.matrixAutoUpdate=false;post.matrix.copy(placement.matrix).multiply(new Matrix4().makeTranslation(x!,-1.5805,z!));root.add(post);}
 }
 if(placement.anchor.id==='wild:13')root.add(buildWild13GroundTongue(placement.matrix));
 if(placement.anchor.id==='wild:24'){
  // The current ground outline ends at row Z + margin + 0.07 m bevel:
  // grass 1.42 m / cream 1.72 m. Join those real outer faces, rather than
  // burying a second slab through the existing grass and cream solids.
  const row=-.95,far=max.z+.05,x=(min.x+max.x)/2,rootY=placement.matrix.elements[13]!;
  for(const [name,near,bottom,top]of [
   ['wild24-ground-extension',row+1.42+.07,.02,placement.foundationBottom],
   ['wild24-ground-extension-base',row+1.72+.07,-.18,.02],
  ] as const){
   const tongue=new Mesh(new BoxGeometry(1,top-bottom,far-near),material);tongue.name=name;tongue.matrixAutoUpdate=false;
   tongue.matrix.copy(placement.matrix).multiply(new Matrix4().makeTranslation(x,(top+bottom)/2-rootY,(near+far)/2));root.add(tongue);
  }
 }
 if(placement.anchor.id==='wild:16'){
  const tongue=new Mesh(new BoxGeometry(1.10,.28,2.2),material);tongue.name='wild16-ground-extension';tongue.matrixAutoUpdate=false;tongue.matrix.copy(placement.matrix).multiply(new Matrix4().makeTranslation(-.58,-1.77,1.3));root.add(tongue);
 }
 return root;
}
export function disposeDisplayFoundation(root:Group){const geometry=new Set<import('three').BufferGeometry>(),material=new Set<import('three').Material>();root.traverse(n=>{if(n instanceof Mesh){geometry.add(n.geometry);const m=Array.isArray(n.material)?n.material:[n.material];m.forEach(x=>material.add(x));}});geometry.forEach(g=>g.dispose());material.forEach(m=>m.dispose());}
/** A shared geometry/material batch per authored part, rather than a full clone
 * with a draw call per idle machine. Animated current-event machines are separate. */
export function createDisplayBatch(source:Mesh,count:number){const mesh=new InstancedMesh(source.geometry,source.material,count);mesh.name=`coverage-idle:${source.name}`;mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;mesh.frustumCulled=false;mesh.raycast=()=>{};if(source.morphTargetInfluences){for(let i=0;i<count;i++)mesh.setMorphAt(i,source);if(mesh.morphTexture)mesh.morphTexture.needsUpdate=true;}return mesh;}
