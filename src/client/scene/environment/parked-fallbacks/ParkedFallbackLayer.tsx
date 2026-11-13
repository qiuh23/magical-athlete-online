import {Component,Suspense,useEffect,useMemo,type ReactNode} from 'react';
import {useGLTF} from '@react-three/drei';import {useFrame} from '@react-three/fiber';
import {Group,InstancedMesh,Matrix4,Mesh} from 'three';
import type {Racer} from '../../../../shared/types.js';import type {TrackId} from '../../../../shared/tracks.js';import type {PresentationBeat} from '../../../presentation.js';import type {SceneMechanismController} from '../scene-mechanisms.js';
import {MECHANISM_URLS} from '../../mechanisms/models.js';import {createParkSource,buildParkFoundation,createParkBatch} from './geometry.js';import {PARKED_FALLBACKS,parkVisible,type ParkFixture} from './visibility.js';
export interface ParkedFallbackProps {track:TrackId;compact:boolean;lowQuality:boolean;racers:Racer[];beat?:PresentationBeat;controller:SceneMechanismController;onFailure?:()=>void}
class Boundary extends Component<{children:ReactNode;onFailure?:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}componentDidCatch(){this.props.onFailure?.();}render(){return this.state.failed?null:this.props.children;}}
/** No playback or contact API. True event cues remain owned by the existing layer. */
export function ParkedFallbackLayer(props:ParkedFallbackProps){if(!PARKED_FALLBACKS.fixtures.some(f=>f.anchor.startsWith(props.track+':')))return null;return <Boundary key={props.track} onFailure={props.onFailure}><Suspense fallback={null}><Loaded {...props}/></Suspense></Boundary>;}
function Loaded({track,compact,lowQuality,racers,beat,controller}:ParkedFallbackProps){
 const punch=useGLTF(MECHANISM_URLS.punch),trip=useGLTF(MECHANISM_URLS.trip);
 const kit=useMemo(()=>{const root=new Group(),fixtures=PARKED_FALLBACKS.fixtures.filter(f=>f.anchor.startsWith(track+':')),models:ReturnType<typeof createParkSource>[]=[],batches:{mesh:InstancedMesh;fixtures:ParkFixture[];local:Matrix4}[]=[],fixed:{fixture:ParkFixture;holder:Group}[]=[],foundations=fixtures.map(f=>{const mesh=buildParkFoundation(f.foundation,compact,lowQuality);mesh.visible=false;root.add(mesh);return{fixture:f,mesh};});
 const punches=fixtures.filter(f=>f.kind==='punch');if(punches.length){const model=createParkSource(punches[0]!.anchor,punch,lowQuality);models.push(model);model.object.traverse(n=>{if(!(n instanceof Mesh))return;const mesh=createParkBatch(n,punches.length,lowQuality);root.add(mesh);batches.push({mesh,fixtures:punches,local:n.matrixWorld.clone()});});}
 for(const f of fixtures.filter(f=>f.kind==='trip')){const model=createParkSource(f.anchor,trip,lowQuality),holder=new Group();models.push(model);holder.matrixAutoUpdate=false;holder.matrix.fromArray(f.mount);if(compact)holder.matrix.premultiply(new Matrix4().makeRotationY(-Math.PI/2));holder.visible=false;holder.add(model.object);root.add(holder);fixed.push({fixture:f,holder});}
 return {root,batches,fixed,foundations,dispose(){models.forEach(m=>m.dispose());batches.forEach(b=>b.mesh.dispose());foundations.forEach(f=>{f.mesh.geometry.dispose();f.mesh.material.dispose();});}};
 },[track,compact,lowQuality,punch,trip]);
 useEffect(()=>()=>kit.dispose(),[kit]);useFrame(()=>{const visible=(f:ParkFixture)=>parkVisible(f,controller,track,compact,racers,beat);for(const b of kit.batches){let count=0;for(const f of b.fixtures)if(visible(f)){const mount=new Matrix4().fromArray(f.mount);if(compact)mount.premultiply(new Matrix4().makeRotationY(-Math.PI/2));b.mesh.setMatrixAt(count++,mount.multiply(b.local));}b.mesh.count=count;b.mesh.instanceMatrix.needsUpdate=true;}for(const f of kit.fixed)f.holder.visible=visible(f.fixture);for(const f of kit.foundations)f.mesh.visible=visible(f.fixture);},-1);
 return <primitive object={kit.root} dispose={null}/>;
}
export function clearParkedFallbackCache(){useGLTF.clear(MECHANISM_URLS.punch);useGLTF.clear(MECHANISM_URLS.trip);}
