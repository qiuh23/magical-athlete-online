import {readFileSync,writeFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3,BoxGeometry,BufferAttribute,Matrix4,Mesh,Object3D,Vector3} from 'three';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),dreiRequire=createRequire(require.resolve('@react-three/drei/package.json'));
const {MeshBVH}=await import(dreiRequire.resolve('three-mesh-bvh'));
import {tripPose} from '../src/client/scene/mechanisms/trip-profile.js';
import {punchPose} from '../src/client/scene/mechanisms/punch-profile.js';
import {MECHANISM_FILES,createMechanismInstance} from '../src/client/scene/mechanisms/models.js';
import {mechanismPlacements} from '../src/client/scene/mechanisms/placements.js';
import {boardPoint,trackConnections,trackNodeIds} from '../src/client/scene/math.js';
import type {TrackId} from '../src/shared/tracks.js';
const load=async(file:string)=>{const b=readFileSync(file);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const assets=new Map();for(const [kind,file]of Object.entries(MECHANISM_FILES))assets.set(kind,await load('public/models/mechanisms/'+file));
const tile=await load('public/models/mechanisms/approved_soft_track_tile.glb');tile.scene.updateMatrixWorld(true);
const tileParts:{name:string;geometry:Mesh['geometry'];local:Matrix4;tree:any}[]=[];
tile.scene.traverse(n=>{if(n instanceof Mesh)tileParts.push({name:n.name,geometry:n.geometry,local:n.matrixWorld.clone(),tree:new MeshBVH(n.geometry)});});
const output=[];
for(const track of ['wild','whirly-world','squiggle','boardwalks'] as TrackId[]){
 const spacing=track==='boardwalks'?2.3:2.05;Object.assign(globalThis,{window:{location:{search:`?mechanisms=1&mechanismSpacing=${spacing}`}}});
 const statics:{name:string;node?:number;edge?:number[];tree:any;matrix:Matrix4;inverse:Matrix4;box:Box3}[]=[];
 const yawByNode=new Map(mechanismPlacements(track).map(p=>[p.anchor.node,p.deckYaw]));
 for(const node of trackNodeIds(track)){const p=boardPoint(node,false,track),placement=new Matrix4().makeRotationY(yawByNode.get(node)??0);placement.setPosition(new Vector3(...p));for(const part of tileParts){const matrix=new Matrix4().multiplyMatrices(placement,part.local);part.geometry.computeBoundingBox();statics.push({name:part.name,node,tree:part.tree,matrix,inverse:matrix.clone().invert(),box:part.geometry.boundingBox!.clone().applyMatrix4(matrix)});}}
 const geo=new BoxGeometry(2,.13,1),tree=new MeshBVH(geo),dummy=new Object3D();geo.computeBoundingBox();
 for(const [a,b]of trackConnections(track)){const p=boardPoint(a,false,track),q=boardPoint(b,false,track);dummy.position.set((p[0]+q[0])/2,(p[1]+q[1])/2-.085,(p[2]+q[2])/2);dummy.rotation.y=Math.atan2(q[0]-p[0],q[2]-p[2]);dummy.scale.set(1,1,Math.hypot(q[0]-p[0],q[2]-p[2]));dummy.updateMatrix();const matrix=dummy.matrix.clone();statics.push({name:'route',edge:[a,b],tree,matrix,inverse:matrix.clone().invert(),box:geo.boundingBox!.clone().applyMatrix4(matrix)});}
 const hits:unknown[]=[],seen=new Set<string>();
 for(const placement of mechanismPlacements(track)){
  const source=assets.get(placement.anchor.kind),model=createMechanismInstance(source.scene,source.animations[0]);if(track==='wild'&&placement.anchor.node===5)model.fitWild5Foot();
  const parts:Mesh[]=[];model.object.traverse(n=>{if(n instanceof Mesh)parts.push(n);});
  const phases=track==='wild'&&placement.anchor.node===24?['prepare','fire']:['default'];
  for(const phase of phases)for(let i=0;i<=50;i++){model.sample(i/50);if(track==='wild'&&placement.anchor.node===5)model.sampleTripPose(tripPose(i/50,true));if(track==='wild'&&placement.anchor.node===24)model.samplePunchPose(phase==='fire'?punchPose(i/50):{boom:Math.PI/2*i/50,counter:-Math.PI/2*i/50,slider:.35,spring:0,route:0});
   for(const part of parts){let geometry=part.geometry;let owned=false;
    if(part.morphTargetInfluences?.some(v=>v!==0)){geometry=part.geometry.clone();const pos=geometry.getAttribute('position'),values=new Float32Array(pos.count*3),v=new Vector3();for(let k=0;k<pos.count;k++){part.getVertexPosition(k,v);v.toArray(values,k*3);}geometry.setAttribute('position',new BufferAttribute(values,3));owned=true;}
    geometry.computeBoundingBox();const matrix=new Matrix4().multiplyMatrices(placement.matrix,part.matrixWorld),box=geometry.boundingBox!.clone().applyMatrix4(matrix);
    for(const target of statics){const key=`${placement.anchor.node}:${part.name}:${target.node??target.edge?.join('-')}:${target.name}`;if(seen.has(key)||!box.intersectsBox(target.box))continue;
      const relative=new Matrix4().multiplyMatrices(target.inverse,matrix);if(target.tree.intersectsGeometry(geometry,relative)){seen.add(key);hits.push({node:placement.anchor.node,kind:placement.anchor.kind,part:part.name,targetNode:target.node,targetEdge:target.edge,targetPart:target.name,phase,progress:i/50});}
    }if(owned)geometry.dispose();
   }
  }model.dispose();
 }
 output.push({track,spacing,samples:51,hits});console.log(track,hits.length);writeFileSync('docs/qa/map-mechanisms/aligned-mesh-audit.json',JSON.stringify({method:'51 poses per phase (Wild24 prepare/fire, Wild5 actual actuator/economy maximum stroke; others original source clip), exact exported triangles including morph positions versus full approved MOD25 and 2 m wide real edge roads. Surface crossings, not continuous or containment proof. Actor meshes excluded.',maps:output},null,2));
}
