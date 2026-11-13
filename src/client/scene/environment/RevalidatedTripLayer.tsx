import {SCENE_MECHANISMS,SceneMechanismController} from './scene-mechanisms.js';
import {Component,Suspense,useEffect,useMemo,type ReactNode,type RefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {Group} from 'three';
import type {Racer} from '../../../shared/types.js';
import type {TrackId} from '../../../shared/tracks.js';
import type {PresentationBeat} from '../../presentation.js';
import type {PresentationClock} from '../../presentation-clock.js';
import {mechanismPlacements} from '../mechanisms/placements.js';
import {createTelescopicTripInstance} from '../mechanisms/telescopic-trip.js';
import {CertifiedTripController,CERTIFIED_TRIP_URL,certifiedTripMount} from '../mechanisms/certified-trip.js';
import {MechanismPlayback} from '../mechanisms/playback.js';
interface Props {racers:Racer[];onFailure:()=>void;controller:SceneMechanismController;track:TrackId;compact:boolean;lowQuality:boolean;paused:boolean;reducedMotion:boolean;beat?:PresentationBeat;clock:PresentationClock;startedAt:number;durationMs:number;root:RefObject<HTMLElement|null>}
class Boundary extends Component<{controller:SceneMechanismController;onFailure:()=>void;children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}componentDidCatch(){this.props.controller.ready=false;this.props.controller.reason='rig-load-failed';this.props.onFailure();}render(){return this.state.failed?null:this.props.children;}}
export function RevalidatedTripLayer(props:Props){return <Boundary key={props.track} controller={props.controller} onFailure={props.onFailure}><Suspense fallback={null}><Loaded {...props}/></Suspense></Boundary>;}
function Loaded({racers,controller,track,compact,lowQuality,paused,reducedMotion,beat,clock,startedAt,durationMs,root}:Props){
 const {scene}=useGLTF(CERTIFIED_TRIP_URL),playback=useMemo(()=>new MechanismPlayback(),[]);
 const activeAnchor=controller.active?.anchorId;
 const batch=useMemo(()=>{const group=new Group(),placements=mechanismPlacements(track,compact).filter(p=>p.anchor.kind==='trip'&&SCENE_MECHANISMS.approved.some(a=>a.anchor===p.anchor.id)&&SCENE_MECHANISMS.fixtures.some(f=>f.key.startsWith(`${track}/${p.anchor.node}/`)));
  // Validate the loaded joint structure even while no contact is admitted.
  const probe=createTelescopicTripInstance(scene,lowQuality);probe.sample(controller.pose('__park__'));
  const instances=placements.filter(p=>p.anchor.id===activeAnchor).map(p=>{const model=createTelescopicTripInstance(scene,lowQuality),holder=new Group();holder.name=`certified-trip:${p.anchor.id}`;holder.position.fromArray(p.position);holder.rotation.y=p.yaw;holder.add(model.object);group.add(holder);model.sample(controller.pose(p.anchor.id));return{anchor:p.anchor.id,model,holder};});
  return{group,instances,dispose(){probe.dispose();instances.forEach(m=>m.model.dispose());}};
 },[scene,track,compact,lowQuality,controller,activeAnchor]);
 useEffect(()=>{controller.ready=true;return()=>{controller.ready=false;batch.instances.forEach(i=>controller.renderedHardware.delete(i.anchor));batch.dispose();};},[controller,batch]);
 useFrame(()=>{const t=playback.sample(beat?.key??'',clock.now(),startedAt,durationMs,paused,reducedMotion);const active=controller.active,actor=active&&controller.actors.get(active.racerId);controller.sample(t,!active||!!actor?.ready&&actor.staticBind&&actor.hash===active.fixture.actor.runtimeGeometryFingerprint);
  for(const item of batch.instances){item.holder.visible=!controller.disabled.has(item.anchor)&&controller.hardwareVisible(item.anchor,track,compact,racers,beat);if(item.holder.visible)controller.renderedHardware.add(item.anchor);else controller.renderedHardware.delete(item.anchor);item.model.sample(controller.pose(item.anchor));}
  if(root.current){root.current.dataset.certifiedTrip=controller.active?.fixture.key??controller.reason;root.current.dataset.certifiedTripProgress=controller.progress.toFixed(4);}
 },-1);
 return <primitive object={batch.group} dispose={null}/>;
}
