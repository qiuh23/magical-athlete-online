import { Component, useEffect, useMemo, Suspense, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, Group, Vector3, BoxGeometry, CanvasTexture, SRGBColorSpace, CylinderGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Object3D } from 'three';
import type { TrackId } from '../../../shared/tracks.js';
import { nextTrackNodes } from '../../../shared/track-topology.js';
import { TRACKS } from '../../../shared/tracks.js';
import { boardPoint, trackConnections, trackNodeIds, TILE } from '../math.js';
import { ExpansionScenery } from '../ExpansionScenery.js';
import { specialTileTexture } from '../tile-art.js';
import { mechanismPlacements } from './placements.js';
import { MECHANISM_PAD_SIZE } from './layout.js';
import { mechanismPadUrl } from './models.js';
import { deckSupportBottom } from './static-support.js';
import { StadiumAssets, StadiumDecor } from '../stadium/StadiumAssets.js';

/** Raised, open-sided run deck. A 1.43 m lift lets the supplied 1.45 m feet
 * land at Y=.20 on the existing ground; no moving assembly is distorted. */
export function MechanismCourse({track,compact,lowQuality,showTallDecor,onPadFailure}:{onPadFailure:()=>void;track:TrackId;compact:boolean;lowQuality:boolean;showTallDecor:boolean}) {
  return <group rotation={[0,compact?-Math.PI/2:0,0]} name="mechanism-course-candidate">
    <ExpansionScenery track={track} lowQuality={lowQuality}/>
    <DeckStructure track={track} lowQuality={lowQuality}/>
    <DeviceFoundations track={track}/>
    <PadBoundary onFailure={onPadFailure}><Suspense fallback={null}><ApprovedDeckPads track={track} lowQuality={lowQuality}/></Suspense></PadBoundary>
    {trackNodeIds(track).map(node=><DeckMark key={node} track={track} node={node}/>)}
    {track==='wild'&&<Suspense fallback={null}><StadiumAssets fallback={null}>{models=><StadiumDecor models={models} showTallDecor={showTallDecor} infieldOnly/>}</StadiumAssets></Suspense>}
  </group>;
}
function DeckStructure({track,lowQuality}:{track:TrackId;lowQuality:boolean}) {
  const kit=useMemo(()=>{
    const geometry=new BoxGeometry(1,1,1),pole=new CylinderGeometry(.09,.13,1,10),material=new MeshStandardMaterial({color:'#263f4b',roughness:.75}),edge=new MeshStandardMaterial({color:'#638c83',roughness:.8});
    const nodes=trackNodeIds(track),connections=trackConnections(track),pads=new InstancedMesh(geometry,material,nodes.length),roads=new InstancedMesh(geometry,material,connections.length+1),supports=new InstancedMesh(pole,edge,nodes.length*4);
    const trimmedPole=new CylinderGeometry(.09,.13-(.13-.09)*(.40-.18)/(1.5-.18),1,10),trimmedSupports=new InstancedMesh(trimmedPole,edge,track==='squiggle'?1:0);
    const dummy=new Object3D();
    const set=(mesh:InstancedMesh,i:number,p:number[],scale:number[],angle=0)=>{dummy.position.set(p[0]!,p[1]!,p[2]!);dummy.rotation.set(0,angle,0);dummy.scale.set(scale[0]!,scale[1]!,scale[2]!);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);};
    nodes.forEach((node,i)=>{const p=boardPoint(node,false,track);set(pads,i,[p[0],p[1]-.075,p[2]],[MECHANISM_PAD_SIZE,.15,MECHANISM_PAD_SIZE]);
      [-1,1].forEach((x,a)=>[-1,1].forEach((z,b)=>{const bottom=deckSupportBottom(track,node,x,z),h=p[1]-.15-bottom;set(supports,i*4+a*2+b,[p[0]+x*.88,bottom+h/2,p[2]+z*.88],bottom===.40?[0,0,0]:[1,h,1]);if(bottom===.40)set(trimmedSupports,0,[p[0]+x*.88,bottom+h/2,p[2]+z*.88],[1,h,1]);}));});
    connections.forEach(([a,b],i)=>{const p=boardPoint(a,false,track),q=boardPoint(b,false,track);set(roads,i,[(p[0]+q[0])/2,(p[1]+q[1])/2-.085,(p[2]+q[2])/2],[MECHANISM_PAD_SIZE,.13,Math.hypot(q[0]-p[0],q[2]-p[2])],Math.atan2(q[0]-p[0],q[2]-p[2]));});
    const p=boardPoint(0,false,track);set(roads,connections.length,[p[0]-TILE*1.5,p[1]-.085,p[2]],[TILE*3,.13,MECHANISM_PAD_SIZE]);
    for(const mesh of [pads,roads,supports,trimmedSupports]){mesh.castShadow=!lowQuality;mesh.receiveShadow=true;mesh.raycast=()=>{};mesh.computeBoundingSphere();}
    return {geometry,pole,trimmedPole,material,edge,pads,roads,supports,trimmedSupports};
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
function ApprovedDeckPads({track,lowQuality}:{track:TrackId;lowQuality:boolean}) {
  const {scene}=useGLTF(mechanismPadUrl(lowQuality));
  const group=useMemo(()=>{const root=new Group(),dummy=new Object3D(),matrix=new Matrix4(),nodes=trackNodeIds(track),yawByNode=new Map(mechanismPlacements(track).map(p=>[p.anchor.node,p.deckYaw]));scene.updateMatrixWorld(true);
    scene.traverse((node:Object3D)=>{if(!(node instanceof Mesh))return;const mesh=new InstancedMesh(node.geometry,node.material,nodes.length);
      nodes.forEach((id,i)=>{dummy.position.fromArray(boardPoint(id,false,track));dummy.rotation.y=yawByNode.get(id)??0;dummy.scale.set(MECHANISM_PAD_SIZE/2,1,MECHANISM_PAD_SIZE/2);dummy.updateMatrix();matrix.multiplyMatrices(dummy.matrix,node.matrixWorld);mesh.setMatrixAt(i,matrix);});
      mesh.name=`approved-pad:${node.name}`;mesh.castShadow=!lowQuality;mesh.receiveShadow=true;mesh.raycast=()=>{};mesh.computeBoundingSphere();root.add(mesh);});return root;
  },[scene,track,lowQuality]);
  useEffect(()=>()=>group.traverse(node=>{if(node instanceof InstancedMesh)node.dispose();}),[group]);
  return <primitive object={group} dispose={null}/>;
}

function DeviceFoundations({track}:{track:TrackId}){
 const kit=useMemo(()=>{const placements=mechanismPlacements(track),geometry=new BoxGeometry(2.35,.1,1.1),material=new MeshStandardMaterial({color:'#526b64',roughness:.85}),mesh=new InstancedMesh(geometry,material,placements.length),matrix=new Matrix4(),offset=new Matrix4().makeTranslation(0,-1.5,1.65);
 placements.forEach((p,i)=>{const local=p.anchor.kind==='punch'?new Matrix4().makeTranslation(0,-1.5,1.95).scale(new Vector3(1,1,1.4/1.1)):offset;mesh.setMatrixAt(i,matrix.multiplyMatrices(p.matrix,local));});mesh.raycast=()=>{};mesh.receiveShadow=true;mesh.castShadow=true;mesh.computeBoundingSphere();return {geometry,material,mesh};},[track]);
 useEffect(()=>()=>{kit.mesh.dispose();kit.geometry.dispose();kit.material.dispose();},[kit]);return <primitive object={kit.mesh} dispose={null}/>;
}

class PadBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?<group name="approved-pad-load-failed"/>:this.props.children;}
}
