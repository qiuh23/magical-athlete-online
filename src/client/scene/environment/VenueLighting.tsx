import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { TrackId } from '../../../shared/tracks.js';
import type { SceneAppearance } from '../../scene-appearance.js';
import {automaticLightPhase,type RoomLightingClock} from '../../scene-lighting-clock.js';
import {scheduleLightingFrames,lightingFrameDelay} from './lighting-demand.js';
import { createSkyEnvironment, SKY_SOURCE_DIRECTIONS } from '../sky-environment.mjs';
import { activeMechanismLayout } from '../mechanisms/layout.js';
import { FLOODLIGHT_ASSETS, floodlightUrl, buildFloodlightGeometry } from './floodlights.js';
import { createVenueLightingState, stepVenueLighting, applyVenueSpotState } from './venue-lighting-state.js';
import type { EnvironmentModels } from './runtime.js';
import { createFloodlightBeams } from './floodlight-beams.js';
import { FLOODLIGHT_COLOR, applyFloodlightColor } from './floodlight-color.js';
import { venuePoolPhotometry, activeVenuePools, VENUE_POOL_BUDGET } from './floodlight-pools.js';
import { selectVenueShadowLamps, assignVenueShadowSlots } from './venue-shadow-slots.js';
const URLS=FLOODLIGHT_ASSETS.map(floodlightUrl);
export function clearFloodlightCache(){useGLTF.clear(URLS);}
class LightBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?null:this.props.children;}}
/** Shared continuous lighting. Optional fixture hardware mounts only after environment readiness. */
export function VenueLighting({track,compact,lowQuality,mode,lightingClock,lightingRunning,fixturesEnabled,paused,onFailure,boardExtent}:{track:TrackId;compact:boolean;lowQuality:boolean;mode:SceneAppearance;lightingClock:RoomLightingClock;lightingRunning:boolean;fixturesEnabled:boolean;paused:boolean;onFailure:()=>void;boardExtent:{width:number;depth:number;x:number;z:number}}){
  const {gl,scene,camera,invalidate,frameloop}=useThree(),[ready,setReady]=useState(false);
  const state=useRef(createVenueLightingState(mode==='auto'?automaticLightPhase(lightingClock.now()):mode)),factor=useRef({nightFactor:0}),sky=useRef<ReturnType<typeof createSkyEnvironment>|undefined>(undefined);
  const ambient=useRef<THREE.AmbientLight>(null),hemi=useRef<THREE.HemisphereLight>(null),key=useRef<THREE.DirectionalLight>(null),fill=useRef<THREE.DirectionalLight>(null);
  const keyTarget=useMemo(()=>new THREE.Object3D(),[]),ownedEnvironment=useRef<THREE.Texture|null>(null),lastExposure=useRef<number|undefined>(undefined),lastEnvironmentIntensity=useRef<number|undefined>(undefined);
  const extent=Math.max(boardExtent.width,boardExtent.depth)/2+5;
  useEffect(()=>{scene.add(keyTarget);return()=>{scene.remove(keyTarget);};},[scene,keyTarget]);
  useEffect(()=>{
    const controller=createSkyEnvironment({THREE,scene,camera,style:'physical',profile:'athlete',starMode:'diorama',lowQuality,state:{from:'day',to:'day',mix:0},directions:SKY_SOURCE_DIRECTIONS.athlete});sky.current=controller;invalidate();
    return()=>{controller.dispose();if(sky.current===controller)sky.current=undefined;};
  },[scene,camera,invalidate]);
  useEffect(()=>{sky.current?.setQuality(lowQuality);invalidate();},[lowQuality,mode,ready,paused,invalidate]);
  useEffect(()=>{if(mode!=='auto'||!lightingRunning||paused||frameloop!=='demand')return;return scheduleLightingFrames(invalidate,lightingFrameDelay(lowQuality));},[mode,lightingRunning,paused,lowQuality,invalidate,frameloop]);
  useEffect(()=>{
    const previous={exposure:gl.toneMappingExposure,mapping:gl.toneMapping,colorSpace:gl.outputColorSpace,shadowType:gl.shadowMap.type};
    gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.shadowMap.type=THREE.PCFShadowMap;gl.shadowMap.needsUpdate=true;invalidate();
    return()=>{if(gl.toneMappingExposure===lastExposure.current)gl.toneMappingExposure=previous.exposure;if(gl.toneMapping===THREE.ACESFilmicToneMapping)gl.toneMapping=previous.mapping;if(gl.outputColorSpace===THREE.SRGBColorSpace)gl.outputColorSpace=previous.colorSpace;if(gl.shadowMap.type===THREE.PCFShadowMap)gl.shadowMap.type=previous.shadowType;};
  },[gl,invalidate]);
  useEffect(()=>{
    const previous={map:scene.environment,intensity:scene.environmentIntensity};let target:THREE.WebGLRenderTarget|undefined;
    if(!lowQuality){let generator:THREE.PMREMGenerator|undefined,studio:RoomEnvironment|undefined;try{generator=new THREE.PMREMGenerator(gl);studio=new RoomEnvironment();target=generator.fromScene(studio,.06);}catch(error){console.warn('[VenueLighting] Environment unavailable; direct lighting retained.',error);}finally{studio?.dispose();generator?.dispose();}}
    const map=target?.texture??null;ownedEnvironment.current=map;scene.environment=map;scene.environmentIntensity=0;lastEnvironmentIntensity.current=0;invalidate();
    return()=>{if(scene.environment===map){scene.environment=previous.map;if(scene.environmentIntensity===lastEnvironmentIntensity.current)scene.environmentIntensity=previous.intensity;}if(ownedEnvironment.current===map)ownedEnvironment.current=null;target?.dispose();};
  },[gl,scene,lowQuality,invalidate]);
  useEffect(()=>{if(!key.current)return;const c=key.current.shadow.camera;c.left=-extent;c.right=extent;c.top=extent;c.bottom=-extent;c.far=Math.max(65,extent*4);c.updateProjectionMatrix();gl.shadowMap.needsUpdate=true;invalidate();},[extent,gl,invalidate]);
  useFrame((_,delta)=>{
    const preset=stepVenueLighting(state.current,mode==='auto'?automaticLightPhase(lightingClock.now()):mode,ready&&fixturesEnabled,delta,paused);factor.current.nightFactor=preset.nightFactor;
    sky.current?.update({camera,state:preset.sky});
    const direction=sky.current?.getLightingState().direction;
    if(key.current&&direction){keyTarget.position.set(boardExtent.x,0,boardExtent.z);keyTarget.updateMatrixWorld();key.current.target=keyTarget;key.current.position.copy(direction).multiplyScalar(Math.max(28,extent*2)).add(keyTarget.position);key.current.color.copy(preset.key);key.current.intensity=preset.keyPower;key.current.shadow.intensity=preset.shadow;}
    if(ambient.current)ambient.current.intensity=preset.ambient;
    if(hemi.current){hemi.current.color.copy(preset.skyColor);hemi.current.groundColor.copy(preset.ground);hemi.current.intensity=preset.hemi;}
    if(fill.current){fill.current.color.copy(preset.fill);fill.current.intensity=preset.fillPower;}
    gl.toneMappingExposure=preset.exposure;lastExposure.current=preset.exposure;
    if(scene.environment===ownedEnvironment.current){scene.environmentIntensity=scene.environment&&!lowQuality?preset.env:0;lastEnvironmentIntensity.current=scene.environmentIntensity;}
    // Auto demand frames are bounded by the scoped scheduler; manual catch-up is finite.
    if(preset.active&&!paused&&(mode!=='auto'||!lightingRunning)&&!document.hidden)invalidate();
  },-2);
  const failed=useCallback(()=>{setReady(false);onFailure();},[onFailure]);
  return <>
    <ambientLight ref={ambient}/><hemisphereLight ref={hemi}/>
    <directionalLight ref={key} castShadow={!lowQuality} shadow-mapSize={compact?[1024,1024]:[2048,2048]} shadow-camera-near={.5} shadow-camera-far={Math.max(65,extent*4)} shadow-normalBias={.018} shadow-bias={-.00012} shadow-radius={compact?.7:1.4}/>
    <directionalLight ref={fill} position={[8,8,-7]}/>
    <LightBoundary key={`${track}:${fixturesEnabled}`} onFailure={failed}><Suspense fallback={null}>{fixturesEnabled&&<VenueFixtures {...{track,compact,lowQuality,factor}} onReady={setReady}/>}</Suspense></LightBoundary>
  </>;
}
function VenueFixtures({track,compact,lowQuality,factor,onReady}:{track:TrackId;compact:boolean;lowQuality:boolean;factor:React.RefObject<{nightFactor:number}>;onReady:(ready:boolean)=>void}){
  const loaded=useGLTF(URLS),{invalidate,scene,camera}=useThree();
  const selection=useRef<string[]>([]),selectionClock=useRef(1),sample=new THREE.Vector3(),projected=new THREE.Vector3();
  const models=useMemo(()=>Object.fromEntries(FLOODLIGHT_ASSETS.map((name,i)=>[name,loaded[i]!.scene])) as EnvironmentModels,[loaded]);
  const {scale,lift}=activeMechanismLayout(track),options=useMemo(()=>({scale,lift,lowQuality}),[scale,lift,lowQuality]);
  const [kit,setKit]=useState<{geometry:ReturnType<typeof buildFloodlightGeometry>;spots:{light:THREE.SpotLight;intensity:number}[];beams:ReturnType<typeof createFloodlightBeams>}>();
  useEffect(()=>{
    const geometry=buildFloodlightGeometry(track,models,options),spots=activeVenuePools(geometry.layout,lowQuality).map((lamp,i)=>{
      const photo=venuePoolPhotometry(lamp.receiver,lamp.target,lowQuality),light=new THREE.SpotLight(FLOODLIGHT_COLOR,0,photo.distance,photo.angle,photo.penumbra,photo.decay);light.visible=false;light.name=`local-spot:${lamp.id}`;light.position.copy(lamp.receiver);light.target.position.copy(lamp.target);light.castShadow=i<VENUE_POOL_BUDGET[lowQuality?'economy':'full'].shadows;light.shadow.mapSize.set(compact?512:1024,compact?512:1024);light.shadow.camera.near=.15;light.shadow.camera.far=photo.distance;light.shadow.normalBias=.009;light.shadow.bias=-.00008;light.shadow.radius=1.5;geometry.root.add(light,light.target);return{light,intensity:photo.intensity};
    });selection.current=[];selectionClock.current=1;applyFloodlightColor(geometry.lenses);const beams=createFloodlightBeams(geometry.layout);geometry.root.add(beams.mesh);setKit({geometry,spots,beams});onReady(true);invalidate();
    return()=>{onReady(false);spots.forEach(({light})=>light.dispose());beams.dispose();geometry.dispose();};
  },[track,models,options,lowQuality,compact,onReady,invalidate]);
  useFrame((_,delta)=>{if(!kit)return;
    selectionClock.current+=delta;
    if(!lowQuality&&factor.current.nightFactor>0&&selectionClock.current>=.4){
      selectionClock.current=0;const points:THREE.Vector3[]=[];kit.geometry.root.updateWorldMatrix(true,false);camera.updateWorldMatrix(true,false);
      scene.traverse(object=>{if(!object.userData.racerModel||points.length>=16)return;sample.set(0,.8,0);object.localToWorld(sample);projected.copy(sample).project(camera);if(Math.abs(projected.x)>1.1||Math.abs(projected.y)>1.1||Math.abs(projected.z)>1)return;points.push(kit.geometry.root.worldToLocal(sample.clone()));});
      const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),camera);const hit=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),sample);if(hit)points.push(kit.geometry.root.worldToLocal(hit.clone()));
      const lamps=activeVenuePools(kit.geometry.layout,false),next=selectVenueShadowLamps(lamps,points,selection.current,VENUE_POOL_BUDGET.full.shadows);
      if(next.join('|')!==selection.current.join('|')){assignVenueShadowSlots(kit.spots,lamps,next,false);selection.current=next;}
    }
    kit.geometry.setNightFactor(factor.current.nightFactor);kit.beams.setNightFactor(factor.current.nightFactor);for(const spot of kit.spots)applyVenueSpotState(spot.light,spot.intensity,factor.current.nightFactor);},-1);
  return kit?<group rotation={[0,compact?-Math.PI/2:0,0]}><primitive object={kit.geometry.root} dispose={null}/></group>:null;
}
