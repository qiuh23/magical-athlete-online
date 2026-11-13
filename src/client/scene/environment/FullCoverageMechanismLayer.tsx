import {Component,Suspense,useCallback,useEffect,useMemo,type ReactNode} from 'react';
import {useGLTF} from '@react-three/drei';
import {useFrame,useThree} from '@react-three/fiber';
import {Group,Matrix4,Mesh,Quaternion,Vector3} from 'three';
import {boardPoint} from '../math.js';
import {pawnOccupancy} from '../camera.js';
import {pawnFallPose} from '../pawn-fall.js';
import type {MechanismActorBounds} from '../mechanisms/actor-bounds.js';
import {planTripSweep,type TripSweepPlan} from './trip-sweep.js';
import type {TrackId} from '../../../shared/tracks.js';
import type {Racer} from '../../../shared/types.js';
import type {PresentationBeat} from '../../presentation.js';
import type {PresentationClock} from '../../presentation-clock.js';
import {mechanismActions} from '../mechanisms/events.js';
import {MechanismPlayback} from '../mechanisms/playback.js';
import {buildDisplayFoundation,createDisplayBatch,createDisplayMechanism,displayTripParkHeight,displayPunchOutlet,DISPLAY_URLS,disposeDisplayFoundation,fullCoveragePlacements,type DisplayPlacement,type DisplayVariant} from './full-coverage.js';
export interface FullCoverageProps{onTripUnavailable?:(key:string,reason:'loading'|'space')=>void;actorBounds?:MechanismActorBounds;track:TrackId;compact:boolean;lowQuality:boolean;racers:Racer[];beat?:PresentationBeat;clock:PresentationClock;startedAt:number;durationMs:number;paused:boolean;reducedMotion:boolean;physicalVisible:(anchor:string)=>boolean;onFailure:()=>void;onReady?:()=>void;outlets?:Map<string,Vector3>}
class KindBoundary extends Component<{children:ReactNode;fallback:ReactNode;onFailure:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?this.props.fallback:this.props.children;}}
/** Every category loads independently and reuses the existing content-addressed
 * useGLTF cache. No actor, environment or pad readiness controls visual coverage. */
export function FullCoverageMechanismLayer(props:FullCoverageProps){
 const placements=useMemo(()=>fullCoveragePlacements(props.track,props.compact),[props.track,props.compact]);
 const variants=useMemo(()=>[...new Set(placements.map(p=>p.variant))].map(variant=>({variant,items:placements.filter(p=>p.variant===variant)})),[placements]);
 const loaded=useMemo(()=>new Set<DisplayVariant>(),[props.track,props.lowQuality,variants]);
 const ready=useCallback((variant:DisplayVariant)=>{loaded.add(variant);if(variants.every(v=>loaded.has(v.variant)))props.onReady?.();},[variants,loaded,props.onReady]);
 useEffect(()=>{if(!variants.length)props.onReady?.();},[variants,props.onReady]);
 return <group name="complete-special-tile-hardware">{variants.map(({variant,items})=>{const fallback=<LoadingOutline placements={items}/>;return <KindBoundary key={variant} onFailure={props.onFailure} fallback={fallback}><Suspense fallback={fallback}><LoadedKind {...props} onKindReady={ready} variant={variant} placements={items}/></Suspense></KindBoundary>;})}</group>;
}
function LoadedKind({variant,placements,track,lowQuality,racers,beat,clock,startedAt,durationMs,paused,reducedMotion,physicalVisible,compact,onKindReady,outlets,actorBounds,onTripUnavailable}:FullCoverageProps&{variant:DisplayVariant;placements:DisplayPlacement[];onKindReady:(variant:DisplayVariant)=>void}){
 const asset=useGLTF(DISPLAY_URLS[variant]),invalidate=useThree(s=>s.invalidate),playback=useMemo(()=>new MechanismPlayback(),[]);
 const actions=useMemo(()=>mechanismActions(track,beat,racers),[track,beat,racers]);
 const activeIds=new Set(actions.map(a=>a.anchor.id)),signature=[...activeIds].sort().join('|');
 const kit=useMemo(()=>{
  const root=new Group(),models:ReturnType<typeof createDisplayMechanism>[]=[],foundations:Group[]=[],batches:{mesh:ReturnType<typeof createDisplayBatch>;local:Matrix4;placements:DisplayPlacement[]}[]=[],active:{placement:DisplayPlacement;holder:Group;model:ReturnType<typeof createDisplayMechanism>;outlet?:Vector3;plan?:TripSweepPlan;aborted?:boolean}[]=[];
  // Wild5 has an individual static-foot adapter and park, so it is never silently
  // batched with another native trip's different transforms.
  const groups=(variant==='trip'||variant==='telescopic-trip')?placements.map(p=>[p]):[placements];
  for(const group of groups){const idle=group.filter(p=>!activeIds.has(p.anchor.id));
   const source=createDisplayMechanism(variant,asset.scene,asset.animations[0],lowQuality,group[0]?.anchor.id,displayTripParkHeight(group[0]!,track,compact));models.push(source);source.sample(0);
   if(idle.length)source.object.traverse(n=>{if(!(n instanceof Mesh))return;for(let parent:import('three').Object3D|null=n;parent;parent=parent.parent)if(!parent.visible)return;const mesh=createDisplayBatch(n,idle.length);root.add(mesh);batches.push({mesh,local:n.matrixWorld.clone(),placements:idle});});
   for(const p of group){const foundation=buildDisplayFoundation(p,source.object,compact);foundation.userData.anchor=p.anchor.id;root.add(foundation);foundations.push(foundation);}
   for(const p of group.filter(p=>activeIds.has(p.anchor.id))){const model=createDisplayMechanism(variant,asset.scene,asset.animations[0],lowQuality,p.anchor.id,displayTripParkHeight(p,track,compact)),holder=new Group();holder.name=`coverage-active:${p.anchor.id}`;holder.userData.mechanismAnchor=p.anchor.id;holder.matrixAutoUpdate=false;holder.matrix.copy(p.matrix);holder.add(model.object);root.add(holder);models.push(model);
    let outlet:Vector3|undefined;if(p.anchor.kind==='punch'){model.sample(.22,true);outlet=displayPunchOutlet(model.object).applyMatrix4(p.matrix);model.sample(0);}
    active.push({placement:p,holder,model,outlet});}
  }
  let visibility:string|undefined;const matrix=new Matrix4();
  return{root,active,update(physical:(id:string)=>boolean,t:number,reduced:boolean){const hidden=placements.filter(p=>physical(p.anchor.id)).map(p=>p.anchor.id),key=hidden.join('|');
   if(key!==visibility){visibility=key;for(const batch of batches){let count=0;for(const p of batch.placements)if(!hidden.includes(p.anchor.id)){matrix.multiplyMatrices(p.matrix,batch.local);batch.mesh.setMatrixAt(count++,matrix);}batch.mesh.count=count;batch.mesh.instanceMatrix.needsUpdate=true;}for(const f of foundations)f.visible=!hidden.includes(f.userData.anchor);}
   for(const a of active){
    a.holder.visible=!hidden.includes(a.placement.anchor.id);if(!a.holder.visible)continue;
    if(a.placement.anchor.kind==='trip'&&actorBounds){
     a.plan??=actorBounds.tripPlans(beat?.key??'').find(plan=>plan.anchor===a.placement.anchor.id);
     if(!a.plan&&!a.aborted&&!reduced&&t>.12){a.aborted=true;a.holder.userData.tripSweepUnavailable='Geometry was not ready before deployment';onTripUnavailable?.(beat?.key??'','loading');}
     if(!a.plan&&!a.aborted&&!reduced){
      const targetIds=new Set(actions.filter(action=>action.anchor.id===a.placement.anchor.id).flatMap(action=>action.targets));
      const relevant=racers.filter(r=>!r.eliminated),snapshots=relevant.map(r=>{
       const p=boardPoint(r.position,compact,track),o=pawnOccupancy(r,racers,r.position,compact,track),fall=r.tripped?pawnFallPose(1,'down'):undefined;
       const world=new Matrix4().compose(new Vector3(p[0]+o.x,p[1]+.005+(fall?.lift??0)*o.scale,p[2]+o.z),new Quaternion().setFromAxisAngle(new Vector3(1,0,0),fall?.tilt??0),new Vector3(o.scale,o.scale,o.scale));
       return actorBounds.capture(r.id,world);
      });
      const targets=snapshots.filter((x):x is NonNullable<typeof x>=>!!x&&targetIds.has(x.id));
      if(targets.length===targetIds.size&&snapshots.every(Boolean)){
       a.plan=planTripSweep(beat?.key??'',a.placement.anchor.id,a.placement.matrix,displayTripParkHeight(a.placement,track,compact),targets,snapshots.filter((x):x is NonNullable<typeof x>=>!!x&&!targetIds.has(x.id)));
       if(a.plan){a.holder.userData.tripSweep=a.plan;if(a.plan.bystanders.length||a.plan.unreached.length){a.aborted=true;a.holder.userData.tripSweepUnavailable='No clear sweep through all authorized targets';onTripUnavailable?.(beat?.key??'','space');}else actorBounds.setTripSweep(a.plan);}
      }else if(t>.12){a.aborted=true;a.holder.userData.tripSweepUnavailable='Actor geometry was not ready before deployment';}
     }
     a.model.sample(reduced?0:t,!reduced&&!!a.plan&&!a.aborted,1,a.plan);
    }else a.model.sample(reduced?0:t,!reduced);
   }
  },dispose(){models.forEach(m=>m.dispose());batches.forEach(b=>b.mesh.dispose());foundations.forEach(disposeDisplayFoundation);}};
 },[asset,variant,placements,signature,lowQuality,compact,beat?.key,actorBounds]);
 useEffect(()=>{
  const owned=new Map<string,Vector3>();
  for(const item of kit.active)if(item.outlet){
   owned.set(item.placement.anchor.id,item.outlet);outlets?.set(item.placement.anchor.id,item.outlet);
  }
  return()=>{for(const [anchor,point]of owned)if(outlets?.get(anchor)===point)outlets.delete(anchor);};
 },[kit,outlets]);
 useEffect(()=>{onKindReady(variant);},[onKindReady,variant]);
 // Only replacement/unmount owns GPU and adapter disposal. A fresh registry or
 // ready callback must not dispose the still-mounted model during a room update.
 useEffect(()=>{invalidate();return()=>kit.dispose();},[kit,invalidate]);
 // Original physical drivers sample at priority -1. This display follows their
 // current state so exactly one complete assembly owns the anchor in each frame.
 useFrame(()=>kit.update(physicalVisible,playback.sample(beat?.key??'',clock.now(),startedAt,durationMs,paused,reducedMotion),reducedMotion));
 return <primitive object={kit.root} dispose={null}/>;
}
/** Only a temporary same-footprint loading silhouette. The original authored
 * GLB replaces each category independently, never an economy-only substitute. */
function LoadingOutline({placements}:{placements:DisplayPlacement[]}){return <group name="hardware-loading-outline">{placements.map(p=><group key={p.anchor.id} matrix={p.matrix} matrixAutoUpdate={false}>
 <mesh position={[0,-.60,1.65]}><boxGeometry args={[.55,1.60,.55]}/><meshStandardMaterial color="#527e7a" roughness={.65}/></mesh>
 <mesh position={[0,.40,1.65]}><boxGeometry args={[1.05,.55,.65]}/><meshStandardMaterial color={p.anchor.kind==='gain'?'#efd17a':p.anchor.kind==='loss'?'#d190b0':p.anchor.kind==='warp'?'#93dce0':'#dc7d65'} roughness={.45}/></mesh>
 </group>)}</group>;}

export function clearFullCoverageCache(track:TrackId){for(const variant of new Set(fullCoveragePlacements(track).map(p=>p.variant)))useGLTF.clear(DISPLAY_URLS[variant]);}
