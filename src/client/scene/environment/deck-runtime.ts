import {BoxGeometry,CylinderGeometry,InstancedMesh,MeshStandardMaterial,Object3D,Group,Mesh,Matrix4} from 'three';
import type {TrackId} from '../../../shared/tracks.js';
import {boardPoint,trackConnections,trackNodeIds,TILE} from '../math.js';
import {MECHANISM_PAD_SIZE} from '../mechanisms/layout.js';
import {mechanismPlacements} from '../mechanisms/placements.js';
import {deckSupportBottom} from '../mechanisms/static-support.js';

/** Shared rendering/audit source. Geometry and instance transforms are not proxies. */
export function buildRebuiltDeck(track:TrackId,lowQuality:boolean){
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
}

export function buildRebuiltPads(scene:Group,track:TrackId,lowQuality:boolean){const root=new Group(),dummy=new Object3D(),matrix=new Matrix4(),nodes=trackNodeIds(track),yawByNode=new Map(mechanismPlacements(track).map(p=>[p.anchor.node,p.deckYaw]));scene.updateMatrixWorld(true);
    scene.traverse((node:Object3D)=>{if(!(node instanceof Mesh))return;const mesh=new InstancedMesh(node.geometry,node.material,nodes.length);
      nodes.forEach((id,i)=>{dummy.position.fromArray(boardPoint(id,false,track));dummy.rotation.y=yawByNode.get(id)??0;dummy.scale.set(MECHANISM_PAD_SIZE/2,1,MECHANISM_PAD_SIZE/2);dummy.updateMatrix();matrix.multiplyMatrices(dummy.matrix,node.matrixWorld);mesh.setMatrixAt(i,matrix);});
      mesh.name=`approved-pad:${node.name}`;mesh.castShadow=!lowQuality;mesh.receiveShadow=true;mesh.raycast=()=>{};mesh.computeBoundingSphere();root.add(mesh);});return root;
  }

/** An explicit solid base, never a shortened machine. Audit supplies the actual
 * ground datum. Footprints match each original foot plus a 20 mm border,
 * not the oversize legacy slab; the upper plane meets the source foot at .20 m. */
export function buildDeviceFoundation(matrix:Matrix4,bottom:number,trip=false){const geometry=new BoxGeometry(trip?1.34:1.69,.2-bottom,trip?.84:.89),material=new MeshStandardMaterial({color:'#526b64',roughness:.85}),mesh=new Mesh(geometry,material);mesh.name='device-foundation';mesh.matrixAutoUpdate=false;mesh.matrix.copy(matrix).multiply(new Matrix4().makeTranslation(0,(bottom+.2)/2-1.65,trip?1.62:1.65));mesh.receiveShadow=true;mesh.raycast=()=>{};return mesh;}

/** Wild13's outboard foot lies beyond the existing ground. This short solid
 * tongue joins the existing base over its inner 1.05 metres and supports the real
 * foot; it never moves the cabinet, changes route or rescales working parts. */
export function buildWild13GroundTongue(matrix:Matrix4){const mesh=new Mesh(new BoxGeometry(1,.30,2.2),new MeshStandardMaterial({color:'#526b64',roughness:.9}));mesh.name='wild13-ground-tongue';mesh.matrixAutoUpdate=false;mesh.matrix.copy(matrix).multiply(new Matrix4().makeTranslation(0,-1.695,1.1));mesh.receiveShadow=true;mesh.raycast=()=>{};return mesh;}
