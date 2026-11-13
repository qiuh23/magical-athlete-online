export {buildRebuiltDeck as createRebuiltDeckStructureKit} from './deck-runtime.js';
import {buildRebuiltDeck,buildRebuiltPads} from './deck-runtime.js';
/** Candidate-only deck/scenery composition. No legacy contact hardware or certificate. */
import { Component, useEffect, useMemo, Suspense, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, Group, BoxGeometry, CanvasTexture, SRGBColorSpace, CylinderGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Object3D } from 'three';
import type { TrackId } from '../../../shared/tracks.js';
import { nextTrackNodes } from '../../../shared/track-topology.js';
import { TRACKS } from '../../../shared/tracks.js';
import { boardPoint, trackConnections, trackNodeIds, TILE } from '../math.js';
import { RebuiltScenery } from './RebuiltScenery.js';
import { specialTileTexture } from '../tile-art.js';
import { mechanismPlacements } from '../mechanisms/placements.js';
import { MECHANISM_PAD_SIZE } from '../mechanisms/layout.js';
import { mechanismPadUrl } from '../mechanisms/models.js';
import { deckSupportBottom } from '../mechanisms/static-support.js';
import { isNaturalMap } from './layout.js';
import { StadiumAssets, StadiumDecor } from '../stadium/StadiumAssets.js';

/** Raised, open-sided run deck. A 1.43 m lift lets the supplied 1.45 m feet
 * land at Y=.20 on the existing ground; no moving assembly is distorted. */
export function RebuiltMechanismCourse({track,compact,lowQuality,showTallDecor,onPadFailure,onPadReady,environmentReady=false}:{environmentReady?:boolean;onPadFailure:()=>void;onPadReady:(ready:boolean)=>void;track:TrackId;compact:boolean;lowQuality:boolean;showTallDecor:boolean}) {
  return <group rotation={[0,compact?-Math.PI/2:0,0]} name="mechanism-course-candidate">
    {(!environmentReady||!isNaturalMap(track))&&<RebuiltScenery track={track} lowQuality={lowQuality} mode={environmentReady?'ground':'all'}/>}
    <DeckStructure track={track} lowQuality={lowQuality}/>
    <PadBoundary onFailure={onPadFailure}><Suspense fallback={null}><ApprovedDeckPads track={track} lowQuality={lowQuality} onReady={onPadReady}/></Suspense></PadBoundary>
    {trackNodeIds(track).map(node=><DeckMark key={node} track={track} node={node}/>)}
    {track==='wild'&&!environmentReady&&<Suspense fallback={null}><StadiumAssets fallback={null}>{models=><StadiumDecor models={models} showTallDecor={showTallDecor} infieldOnly/>}</StadiumAssets></Suspense>}
  </group>;
}
function DeckStructure({track,lowQuality}:{track:TrackId;lowQuality:boolean}) {
  const kit=useMemo(()=>{
    return buildRebuiltDeck(track,lowQuality);
  },[track,lowQuality]);
  useEffect(()=>()=>{kit.geometry.dispose();kit.pole.dispose();kit.trimmedPole.dispose();kit.material.dispose();kit.edge.dispose();kit.pads.dispose();kit.roads.dispose();kit.supports.dispose();kit.trimmedSupports.dispose();},[kit]);
  return <group name="raised-route">{[kit.pads,kit.roads,kit.supports,kit.trimmedSupports].map((object,i)=><primitive key={i} object={object} dispose={null}/>)}</group>;
}
function DeckMark({track,node}:{track:TrackId;node:number}) {
  const special=TRACKS[track].specials[node],p=boardPoint(node,false,track);
  const texture=useMemo(()=>{
    if(!special)return;
    const next=nextTrackNodes(TRACKS[track],node,Math.sign(special.move??1))[0],q=boardPoint(next??node,false,track);
    return specialTileTexture(special.kind,special.move,node,Math.atan2(-(q[0]-p[0]),-(q[2]-p[2])),special.points,special.to);
  },[track,node,special]);
  const number=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;
    c.fillStyle='#173f37';c.fillRect(0,32,256,192);c.fillStyle='#fff5cf';c.font='bold 156px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(node).padStart(2,'0'),128,135);
    const number=new CanvasTexture(canvas);number.colorSpace=SRGBColorSpace;return number;
  },[node]);
  useEffect(()=>()=>{texture?.dispose();number.dispose();},[texture,number]);
  return <group>
    <mesh name={`mechanism-node-${node}`} position={[p[0]-.58,p[1]+.016,p[2]-.6]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><planeGeometry args={[.72,.72]}/><meshBasicMaterial map={number} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} toneMapped={false}/></mesh>
    {texture&&<mesh name={`mechanism-symbol-${node}`} position={[p[0]+.43,p[1]+.015,p[2]-.6]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><planeGeometry args={[.8,.8]}/><meshBasicMaterial map={texture} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} toneMapped={false}/></mesh>}
  </group>;
}

/** Approved MOD_25 soft mat, colored edge and bronze fasteners. Only the static
 * pad keeps its original 2.0 m XZ footprint; no actor or working head is rescaled. */
function ApprovedDeckPads({track,lowQuality,onReady}:{track:TrackId;lowQuality:boolean;onReady:(ready:boolean)=>void}) {
  const {scene}=useGLTF(mechanismPadUrl(lowQuality));
  const group=useMemo(()=>buildRebuiltPads(scene,track,lowQuality),[scene,track,lowQuality]);
  useEffect(()=>{onReady(true);return()=>{onReady(false);group.traverse(node=>{if(node instanceof InstancedMesh)node.dispose();});};},[group,onReady]);
  return <primitive object={group} dispose={null}/>;
}

class PadBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?<group name="approved-pad-load-failed"/>:this.props.children;}
}
