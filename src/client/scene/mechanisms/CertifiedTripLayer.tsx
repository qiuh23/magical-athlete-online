import {Component,Suspense,useEffect,useMemo,type ReactNode,type RefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {Group,Mesh,InstancedMesh,Matrix4,Vector3} from 'three';
import type {Racer} from '../../../shared/types.js';
import type {TrackId} from '../../../shared/tracks.js';
import type {PresentationBeat} from '../../presentation.js';
import type {PresentationClock} from '../../presentation-clock.js';
import {mechanismPlacements} from './placements.js';
import {createTelescopicTripInstance} from './telescopic-trip.js';
import {CertifiedTripController,CERTIFIED_TRIP_URL,certifiedTripMount} from './certified-trip.js';
import {MechanismPlayback} from './playback.js';
interface Props {racers:Racer[];onFailure:()=>void;controller:CertifiedTripController;track:TrackId;compact:boolean;lowQuality:boolean;paused:boolean;reducedMotion:boolean;beat?:PresentationBeat;clock:PresentationClock;startedAt:number;durationMs:number;root:RefObject<HTMLElement|null>}
class Boundary extends Component<{controller:CertifiedTripController;onFailure:()=>void;children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}componentDidCatch(){this.props.controller.ready=false;this.props.controller.reason='rig-load-failed';this.props.onFailure();}render(){return this.state.failed?null:this.props.children;}}
export function CertifiedTripLayer(props:Props){return <Boundary key={props.track} controller={props.controller} onFailure={props.onFailure}><Suspense fallback={null}><Loaded {...props}/></Suspense></Boundary>;}
function Loaded({racers,controller,track,compact,lowQuality,paused,reducedMotion,beat,clock,startedAt,durationMs,root}:Props){
 const {scene}=useGLTF(CERTIFIED_TRIP_URL),playback=useMemo(()=>new MechanismPlayback(),[]);
 const activeAnchor=controller.active?.anchorId;
 const batch=useMemo(()=>{const group=new Group(),placements=mechanismPlacements(track,compact).filter(p=>certifiedTripMount(track,p.anchor.node)&&p.anchor.kind==='trip'),idle=placements.filter(p=>p.anchor.id!==activeAnchor),model=createTelescopicTripInstance(scene,lowQuality),meshes:InstancedMesh[]=[],idleParts:{mesh:InstancedMesh;local:Matrix4}[]=[];
 model.sample(controller.pose('__park__'));
 model.object.traverse(n=>{if(!(n instanceof Mesh)||!idle.length)return;const mesh=new InstancedMesh(n.geometry,n.material,idle.length);mesh.name=`certified-trip-idle:${n.name}`;mesh.castShadow=mesh.receiveShadow=!lowQuality;mesh.raycast=()=>{};idle.forEach((p,i)=>mesh.setMatrixAt(i,new Matrix4().multiplyMatrices(p.matrix,n.matrixWorld)));mesh.computeBoundingSphere();group.add(mesh);meshes.push(mesh);idleParts.push({mesh,local:n.matrixWorld.clone()});});
 const instances=placements.filter(p=>p.anchor.id===activeAnchor).map(p=>{const instance=createTelescopicTripInstance(scene,lowQuality),holder=new Group();holder.name=`certified-trip:${p.anchor.id}`;holder.position.fromArray(p.position);holder.rotation.y=p.yaw;holder.add(instance.object);group.add(holder);instance.sample(controller.pose(p.anchor.id));return{anchor:p.anchor.id,model:instance,holder};});
 return{group,instances,idle,idleParts,visibility:new Map<string,boolean>(),matrix:new Matrix4(),zero:new Vector3(0,0,0),dispose(){model.dispose();instances.forEach(m=>m.model.dispose());meshes.forEach(m=>m.dispose());}};},[scene,track,compact,lowQuality,controller,activeAnchor]);
 useEffect(()=>{controller.ready=true;return()=>{controller.ready=false;batch.dispose();};},[controller,batch]);
 useFrame(()=>{const t=playback.sample(beat?.key??'',clock.now(),startedAt,durationMs,paused,reducedMotion);const active=controller.active,actor=active&&controller.actors.get(active.racerId);controller.sample(t,!active||!!actor?.ready&&actor.staticBind&&actor.hash===active.fixture.actor.runtimeGeometryFingerprint);
  for(const item of batch.instances){item.holder.visible=!controller.disabled.has(item.anchor);item.model.sample(controller.pose(item.anchor));}
  batch.idle.forEach((p,i)=>{const visible=controller.parkVisible(track,p.anchor.node,compact,racers,beat);if(batch.visibility.get(p.anchor.id)===visible)return;batch.visibility.set(p.anchor.id,visible);for(const part of batch.idleParts){batch.matrix.multiplyMatrices(p.matrix,part.local);if(!visible)batch.matrix.scale(batch.zero);part.mesh.setMatrixAt(i,batch.matrix);part.mesh.instanceMatrix.needsUpdate=true;}});
  if(root.current){root.current.dataset.certifiedTrip=controller.active?.fixture.key??controller.reason;root.current.dataset.certifiedTripProgress=controller.progress.toFixed(4);}
 },-1);
 return <primitive object={batch.group} dispose={null}/>;
}
