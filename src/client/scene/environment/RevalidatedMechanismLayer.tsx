import {buildDeviceFoundation,buildWild13GroundTongue} from './deck-runtime.js';
import {Component,Suspense,useEffect,useMemo,type ReactNode} from 'react';
import {useGLTF} from '@react-three/drei';import {useFrame} from '@react-three/fiber';import {Group,InstancedMesh,Matrix4,Mesh,Vector3} from 'three';
import type {Racer} from '../../../shared/types.js';import type {TrackId} from '../../../shared/tracks.js';import type {PresentationBeat} from '../../presentation.js';import type {PresentationClock} from '../../presentation-clock.js';
import {createMechanismInstance,MECHANISM_URLS} from '../mechanisms/models.js';import {mechanismPlacements} from '../mechanisms/placements.js';import {mechanismActions,type MechanismKind} from '../mechanisms/events.js';import {MechanismPlayback} from '../mechanisms/playback.js';import {SCENE_MECHANISMS,type SceneMechanismController} from './scene-mechanisms.js';
type Props={controller:SceneMechanismController;track:TrackId;compact:boolean;racers:Racer[];beat?:PresentationBeat;clock:PresentationClock;startedAt:number;durationMs:number;paused:boolean;reducedMotion:boolean;lowQuality:boolean;onFailure:()=>void;onReady:()=>void};
class Boundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?null:this.props.children;}}
/** New allowlisted consumer. Never mounts the legacy Punch/native Trip layer. */
export function RevalidatedMechanismLayer(props:Props){return <Boundary key={props.track} onFailure={props.onFailure}><Suspense fallback={null}><Loaded {...props}/></Suspense></Boundary>;}
function Loaded({controller,track,compact,racers,beat,clock,startedAt,durationMs,paused,reducedMotion,lowQuality,onReady}:Props){
 const placements=useMemo(()=>mechanismPlacements(track,compact).filter(p=>p.anchor.kind!=='trip'&&SCENE_MECHANISMS.approved.some(a=>a.anchor===p.anchor.id)),[track,compact]);
 const kinds=useMemo(()=>[...new Set(placements.map(p=>p.anchor.kind))],[placements]);const assets=useGLTF(kinds.map(k=>MECHANISM_URLS[k]));const playback=useMemo(()=>new MechanismPlayback(),[]);
 const actions=mechanismActions(track,beat,racers),activeIds=new Set(actions.filter(a=>controller.actionAllowed(a,track,compact,racers,beat)&&!reducedMotion).map(a=>a.anchor.id));const key=[...activeIds].sort().join('|');
 const kit=useMemo(()=>{const root=new Group(),instances:ReturnType<typeof createMechanismInstance>[]=[],batches:{mesh:InstancedMesh;placements:typeof placements;local:Matrix4}[]=[],active:{anchor:string;holder:Group;model:ReturnType<typeof createMechanismInstance>;kind:MechanismKind}[]=[];
  for(const[i,kind]of kinds.entries()){const source=assets[i]!,idle=placements.filter(p=>p.anchor.kind===kind&&!activeIds.has(p.anchor.id));if(idle.length){const model=createMechanismInstance(source.scene,source.animations[0]!,lowQuality);model.sample(0);instances.push(model);model.object.traverse(n=>{if(!(n instanceof Mesh))return;const mesh=new InstancedMesh(n.geometry,n.material,idle.length);mesh.name=`new-scene-idle:${kind}:${n.name}`;mesh.castShadow=mesh.receiveShadow=!lowQuality;mesh.raycast=()=>{};mesh.frustumCulled=false;mesh.count=0;if(n.morphTargetInfluences)idle.forEach((_,i)=>mesh.setMorphAt(i,n));root.add(mesh);batches.push({mesh,placements:idle,local:n.matrixWorld.clone()});});}
   for(const p of placements.filter(p=>p.anchor.kind===kind&&activeIds.has(p.anchor.id))){const model=createMechanismInstance(source.scene,source.animations[0]!,lowQuality),holder=new Group();holder.matrixAutoUpdate=false;holder.matrix.copy(p.matrix);holder.add(model.object);root.add(holder);instances.push(model);active.push({anchor:p.anchor.id,holder,model,kind});}
  }
  return{root,active,batches,dispose(){instances.forEach(i=>i.dispose());batches.forEach(b=>b.mesh.dispose());}};
 },[track,compact,assets,key,lowQuality]);
 useEffect(()=>{onReady();return()=>kit.dispose();},[kit,onReady]);
 useFrame(()=>{const t=playback.sample(beat?.key??'',clock.now(),startedAt,durationMs,paused,reducedMotion),matrix=new Matrix4();for(const b of kit.batches){let count=0;for(const p of b.placements)if(controller.hardwareVisible(p.anchor.id,track,compact,racers,beat)){matrix.multiplyMatrices(p.matrix,b.local);b.mesh.setMatrixAt(count++,matrix);}b.mesh.count=count;b.mesh.instanceMatrix.needsUpdate=true;}
  for(const a of kit.active){const action=actions.find(x=>x.anchor.id===a.anchor);a.holder.visible=!!action&&controller.actionAllowed(action,track,compact,racers,beat);if(a.kind==='warp')a.model.sampleWarp(t);else a.model.sample(t);}
 },-1);
 return <primitive object={kit.root} dispose={null}/>;
}

export function RevalidatedFoundations({controller,track,compact,racers,beat}:Pick<Props,'controller'|'track'|'compact'|'racers'|'beat'>){
 const kit=useMemo(()=>{const root=new Group(),items=mechanismPlacements(track,compact).flatMap(p=>{const proof=SCENE_MECHANISMS.approved.find(a=>a.anchor===p.anchor.id);if(!proof||p.anchor.kind==='trip'&&!SCENE_MECHANISMS.fixtures.some(f=>f.key.startsWith(`${track}/${p.anchor.node}/`)))return[];const mesh=buildDeviceFoundation(p.matrix,proof.foundationBottom,p.anchor.kind==='trip');mesh.visible=false;root.add(mesh);const tongue=p.anchor.id==='wild:13'?buildWild13GroundTongue(p.matrix):undefined;if(tongue){tongue.visible=false;root.add(tongue);}return[{mesh,anchor:p.anchor.id},...(tongue?[{mesh:tongue,anchor:p.anchor.id}]:[])];});return{root,items};},[track,compact]);
 useEffect(()=>()=>kit.items.forEach(({mesh})=>{mesh.geometry.dispose();mesh.material.dispose();}),[kit]);useFrame(()=>{for(const item of kit.items)item.mesh.visible=controller.hardwareVisible(item.anchor,track,compact,racers,beat);},-1);return <primitive object={kit.root} dispose={null}/>;
}

export function clearRevalidatedMechanismCache(track:TrackId){const kinds=[...new Set(mechanismPlacements(track).filter(p=>p.anchor.kind!=='trip'&&SCENE_MECHANISMS.approved.some(a=>a.anchor===p.anchor.id)).map(p=>p.anchor.kind))];useGLTF.clear(kinds.map(k=>MECHANISM_URLS[k]));}
