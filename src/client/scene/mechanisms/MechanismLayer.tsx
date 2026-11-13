import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Group, InstancedMesh, Matrix4, Mesh, BufferGeometry, BufferAttribute, Line, LineDashedMaterial, Vector3, OctahedronGeometry, MeshBasicMaterial, Object3D } from 'three';
import type { Racer } from '../../../shared/types.js';
import type { TrackId } from '../../../shared/tracks.js';
import type { PresentationBeat } from '../../presentation.js';
import type { PresentationClock } from '../../presentation-clock.js';
import { CERTIFIED_TRIP_URL,certifiedTripMount, type CertifiedTripController } from './certified-trip.js';
import { TripController } from './trip-profile.js';
import { PunchController } from './punch-profile.js';
import { pawnOccupancy } from '../camera.js';
import { boardPoint } from '../math.js';
import { MechanismPlayback } from './playback.js';
import { scoreFlowCount,scoreFlowSample } from './score-flow.js';
import { groupMechanismActions, mechanismActionSignature, mechanismAnchors, mechanismActions, type MechanismAction, type MechanismKind } from './events.js';
import { mechanismPlacements } from './placements.js';
import { createMechanismInstance, MECHANISM_URLS, MECHANISM_PAD_URLS } from './models.js';

export function clearMechanismCache(track:TrackId){useGLTF.clear(CERTIFIED_TRIP_URL);const kinds=[...new Set(mechanismAnchors(track).map(a=>a.kind))];useGLTF.clear(kinds.map(kind=>MECHANISM_URLS[kind]));for(const url of Object.values(MECHANISM_PAD_URLS))useGLTF.clear(url);}
interface Props {certified:CertifiedTripController;trip:TripController;tripReady:()=>boolean;contactReady:()=>boolean;punch:PunchController;paused:boolean;onLoadState:(state:'loading'|'ready'|'failed')=>void;track:TrackId;compact:boolean;racers:Racer[];beat?:PresentationBeat;clock:PresentationClock;startedAt:number;durationMs:number;reducedMotion:boolean;lowQuality:boolean;root:RefObject<HTMLElement|null>}
/** One clock and one useFrame for the entire map. Idle copies are GPU instances;
 * only the current event's anchors own transform/morph clones and mixers. */
export function MechanismLayer(props:Props) {
  return <MechanismBoundary key={props.track} onFailure={()=>props.onLoadState('failed')}><Suspense fallback={<LoadState value="loading" report={props.onLoadState}/>}><LoadedMechanisms {...props}/></Suspense></MechanismBoundary>;
}
export function physicalMotionEligibility(action:MechanismAction,racers:Racer[],punch?:PunchController,trip?:TripController) {
  if(action.anchor.id==='wild:5'&&trip?.plan?.kind==='trip'&&action.targets.length===1&&action.targets[0]===trip.plan.newId)return 'enabled';
  if(action.anchor.id==='wild:24'&&punch?.plan?.kind==='fire'&&action.targets.length===1&&action.targets[0]===punch.plan.racerId)return 'enabled';
  if(action.anchor.kind==='trip'||action.anchor.kind==='punch')return 'contact-profile-pending';
  const occupying=racers.filter(r=>r.position===action.anchor.node&&!r.eliminated);
  if(action.anchor.kind!=='loss'&&occupying.some(r=>!action.targets.includes(r.id)))return 'shared-cell-clearance-pending';
  return 'enabled';
}
function LoadState({value,report}:{value:'loading'|'ready';report:Props['onLoadState']}){useEffect(()=>report(value),[value,report]);return null;}
class MechanismBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?null:this.props.children;}
}
function LoadedMechanisms({certified,trip,tripReady,contactReady,punch,paused,onLoadState,track,compact,racers,beat,clock,startedAt,durationMs,reducedMotion,lowQuality,root}:Props) {
  const placements=useMemo(()=>mechanismPlacements(track,compact),[track,compact]);
  const kinds=useMemo(()=>[...new Set(placements.map(p=>p.anchor.kind))],[placements]);
  const gltfs=useGLTF(kinds.map(kind=>MECHANISM_URLS[kind]));
  const playback=useRef(new MechanismPlayback());
  const actions=useMemo(()=>mechanismActions(track,beat,racers),[track,beat,racers]);
  const active=actions.filter(action=>physicalMotionEligibility(action,racers,punch,trip)==='enabled');
  const activeKey=mechanismActionSignature(actions);
  const scenesKey=gltfs.map(g=>g.scene.uuid).join('|');
  const sources=new Map(kinds.map((kind,i)=>[kind,gltfs[i]!]));
  const batch=useMemo(()=>{
    const group=new Group();group.name='map-mechanisms';
    const models:ReturnType<typeof createMechanismInstance>[]=[];
    const meshes:InstancedMesh[]=[];const idleByKind=new Map<MechanismKind,ReturnType<typeof createMechanismInstance>>();
    for(const kind of kinds){
      const selected=placements.filter(p=>p.anchor.kind===kind&&!(kind==='trip'&&certifiedTripMount(track,p.anchor.node))&&!active.some(a=>a.anchor.id===p.anchor.id)&&!(track==='wild'&&[5,24].includes(p.anchor.node)));
      // Do not submit zero-scale placeholders: they still cost vertex work.
      if(!selected.length)continue;
      const source=sources.get(kind)!;
      const model=createMechanismInstance(source.scene,source.animations[0]!,lowQuality);model.sample(0);models.push(model);idleByKind.set(kind,model);
      model.object.traverse(node=>{
        if(!(node instanceof Mesh))return;
        const mesh=new InstancedMesh(node.geometry,node.material,selected.length);mesh.name=`idle:${kind}:${node.name}`;mesh.raycast=()=>{};mesh.castShadow=mesh.receiveShadow=!lowQuality;
        selected.forEach((placement,i)=>{
          const matrix=new Matrix4().multiplyMatrices(placement.matrix,node.matrixWorld);
          mesh.setMatrixAt(i,matrix);
          if(node.morphTargetInfluences)mesh.setMorphAt(i,node);
        });
        mesh.computeBoundingSphere();group.add(mesh);meshes.push(mesh);
      });
    }
    const playing=groupMechanismActions(active.filter(a=>!['wild:24','wild:5'].includes(a.anchor.id))).flatMap(({anchor})=>{
      const placement=placements.find(p=>p.anchor.id===anchor.id),source=sources.get(anchor.kind);
      if(!placement||!source)return [];
      const model=createMechanismInstance(source.scene,source.animations[0]!,lowQuality);model.sample(0);models.push(model);
      const holder=new Group();holder.name=`active:${anchor.id}`;holder.position.fromArray(placement.position);holder.rotation.y=placement.yaw;holder.add(model.object);group.add(holder);
      return [{anchor,model}];
    });
    const punchMount=track==='wild'?placements.find(p=>p.anchor.node===24):undefined;
    let contact:ReturnType<typeof createMechanismInstance>|undefined;
    if(punchMount){const source=sources.get('punch')!;contact=createMechanismInstance(source.scene,source.animations[0]!,lowQuality);contact.sample(0);contact.samplePunchPose(punch.pose);models.push(contact);const holder=new Group();holder.name='persistent:wild:24';holder.position.fromArray(punchMount.position);holder.rotation.y=punchMount.yaw;holder.add(contact.object);group.add(holder);}
    const tripMount=track==='wild'?placements.find(p=>p.anchor.node===5):undefined;
    let tripContact:ReturnType<typeof createMechanismInstance>|undefined;
    if(tripMount){const source=sources.get('trip')!;tripContact=createMechanismInstance(source.scene,source.animations[0]!,lowQuality);tripContact.sample(0);tripContact.fitWild5Foot();tripContact.sampleTripPose(trip.pose);models.push(tripContact);const holder=new Group();holder.name='persistent:wild:5';holder.position.fromArray(tripMount.position);holder.rotation.y=tripMount.yaw;holder.add(tripContact.object);group.add(holder);}
    const cues=groupMechanismActions(actions.filter(a=>a.anchor.kind==='trip'&&certified.active?.anchorId!==a.anchor.id&&physicalMotionEligibility(a,racers,punch,trip)!=='enabled')).map(({anchor,actions:pending})=>{
      const placement=placements.find(p=>p.anchor.id===anchor.id)!,source=sources.get('trip')!,pivot=source.scene.getObjectByName('TRIP_ROTOR_Z')!,start=new Vector3().setFromMatrixPosition(pivot.matrixWorld).applyMatrix4(placement.matrix);
      const targets=[...new Set(pending.flatMap(a=>a.targets))].flatMap(id=>{const racer=racers.find(r=>r.id===id);if(!racer)return [];const p=boardPoint(anchor.node,compact,track),o=pawnOccupancy(racer,racers,anchor.node,compact,track);return [new Vector3(p[0]+o.x,p[1]+.24,p[2]+o.z)];});
      const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array(6),3));const material=new LineDashedMaterial({color:'#ffe08b',dashSize:.09,gapSize:.07,transparent:true,opacity:.7,depthWrite:false});const line=new Line(geometry,material);line.name=`non-contact-target-cue:${anchor.id}`;line.raycast=()=>{};group.add(line);return {line,geometry,material,start,targets};
    });
    // One bounded instance batch for all score owners; no per-particle timer.
    let remainingFlow=lowQuality?16:32;
    const flowGeometry=new OctahedronGeometry(1,0),flowMaterial=new MeshBasicMaterial({color:'#ffe496',transparent:true,opacity:.8,depthWrite:false,toneMapped:false}),flowRecords=actions.filter(a=>['gain','loss'].includes(a.anchor.kind)).flatMap(action=>{
      const placement=placements.find(p=>p.anchor.id===action.anchor.id)!,source=sources.get(action.anchor.kind)!,outlet=(idleByKind.get(action.anchor.kind)?.object??source.scene).getObjectByName(action.anchor.kind==='gain'?'GAIN_PALM':'LOSS_LIP') as Mesh,racer=racers.find(r=>r.id===action.targets[0]),count=Math.min(remainingFlow,scoreFlowCount(action.scoreDelta,lowQuality));
      if(!racer||!count||!outlet)return [];remainingFlow-=count;
      outlet.geometry.computeBoundingBox();const localCenter=outlet.geometry.boundingBox!.getCenter(new Vector3()),device=localCenter.clone().applyMatrix4(outlet.matrixWorld).applyMatrix4(placement.matrix),p=boardPoint(racer.position,compact,track),o=pawnOccupancy(racer,racers,racer.position,compact,track),target=new Vector3(p[0]+o.x,p[1]+(racer.tripped?.4:.8)*o.scale,p[2]+o.z);
      return [{action,count,placement,localCenter,device,target,outletName:outlet.name}];
    });
    const flowCount=flowRecords.reduce((sum,r)=>sum+r.count,0),flow=new InstancedMesh(flowGeometry,flowMaterial,Math.max(1,flowCount));flow.name='actual-score-flow';flow.count=flowCount;flow.raycast=()=>{};flow.renderOrder=15;flow.frustumCulled=false;group.add(flow);const flowDummy=new Object3D();
    return {group,playing,contact,tripContact,cues,flow,flowDummy,flowRecords,dispose(){models.forEach(m=>m.dispose());meshes.forEach(m=>m.dispose());cues.forEach(c=>{c.geometry.dispose();c.material.dispose();});flow.dispose();flowGeometry.dispose();flowMaterial.dispose();}};
  },[placements,scenesKey,activeKey,lowQuality]);
  useEffect(()=>()=>batch.dispose(),[batch]);
  useEffect(()=>()=>{if(root.current)for(const key of ['mechanismCount','mechanismNodes','mechanismActions','mechanismHeld','mechanismProgress','punchState','tripState'])delete root.current.dataset[key];},[root]);
  useEffect(()=>{
    if(!root.current)return;
    root.current.dataset.mechanismCount=String(placements.length);
    root.current.dataset.mechanismNodes=placements.map(p=>p.anchor.node).join(',');
    root.current.dataset.mechanismActions=actions.map(a=>`${a.anchor.node}:${a.anchor.kind}:${a.targets.join('+')}`).join(',');
    root.current.dataset.mechanismHeld=actions.filter(a=>certified.active?.anchorId!==a.anchor.id&&physicalMotionEligibility(a,racers,punch,trip)!=='enabled').map(a=>`${a.anchor.node}:${physicalMotionEligibility(a,racers,punch,trip)}`).join(',');
  },[placements,actions,root]);
  useFrame(()=>{
    const t=playback.current.sample(beat?.key??'',clock.now(),startedAt,durationMs,paused,reducedMotion);
    for(const playing of batch.playing){if(playing.anchor.kind==='warp')playing.model.sampleWarp(t);else playing.model.sample(t);}
    let flowIndex=0;
    for(const record of batch.flowRecords){const live=batch.playing.find(p=>p.anchor.id===record.action.anchor.id)?.model.object.getObjectByName(record.outletName);if(live){live.updateWorldMatrix(true,false);record.device.copy(record.localCenter).applyMatrix4(live.matrixWorld);}
      for(let i=0;i<record.count;i++){const sample=reducedMotion?undefined:scoreFlowSample(t,i,record.count),from=record.action.anchor.kind==='gain'?record.device:record.target,to=record.action.anchor.kind==='gain'?record.target:record.device;
        batch.flowDummy.position.copy(from);if(sample){batch.flowDummy.position.lerp(to,sample.u);batch.flowDummy.position.y+=sample.arc;}batch.flowDummy.scale.setScalar(sample?.scale??0);batch.flowDummy.updateMatrix();batch.flow.setMatrixAt(flowIndex++,batch.flowDummy.matrix);}
    }
    batch.flow.instanceMatrix.needsUpdate=true;
    if(batch.contact){punch.validate(contactReady());batch.contact.samplePunchPose(punch.sample(t));}
    for(const cue of batch.cues){const phase=t*cue.targets.length,index=Math.min(cue.targets.length-1,Math.floor(phase)),local=phase-index,extension=local<.22?0:local<.5?(local-.22)/.28:local<.85?1-(local-.5)/.35:0,target=cue.targets[index];cue.line.visible=!!target&&extension>0&&!reducedMotion;if(target){const end=cue.start.clone().lerp(target,extension),positions=cue.geometry.getAttribute('position');positions.setXYZ(0,cue.start.x,cue.start.y,cue.start.z);positions.setXYZ(1,end.x,end.y,end.z);positions.needsUpdate=true;cue.geometry.computeBoundingSphere();cue.line.computeLineDistances();}}
    if(batch.tripContact){trip.validate(tripReady());batch.tripContact.sampleTripPose(trip.sample(t,lowQuality));}
    if(root.current){root.current.dataset.tripState=trip.plan?.kind??'held';root.current.dataset.mechanismProgress=t.toFixed(4);root.current.dataset.punchState=punch.plan?.kind??'held';}
  },-1); // Shared actuator/route clock is sampled before every Pawn (priority 0).
  return <><LoadState value="ready" report={onLoadState}/><primitive object={batch.group} dispose={null}/></>;
}
