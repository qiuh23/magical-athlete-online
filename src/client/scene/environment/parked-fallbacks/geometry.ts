import {BoxGeometry,InstancedMesh,Matrix4,Mesh,MeshStandardMaterial,type AnimationClip,type Group} from 'three';
import {createMechanismInstance} from '../../mechanisms/models.js';
export interface ParkSource {scene:Group;animations:AnimationClip[]}
export interface FoundationSpec {matrix:number[];size:number[];bottom:number;top:number}
/** The only pose API deliberately freezes a native source at its published PARK. */
export function createParkSource(anchor:string,source:ParkSource,lowQuality=false){
 const model=createMechanismInstance(source.scene,source.animations[0]!,lowQuality);model.sample(0);
 if(anchor==='wild:5'){model.fitWild5Foot();model.sampleTripPose({angle:Math.PI/4,reach:0});}
 return {object:model.object,dispose:()=>model.dispose()};
}
/** Shared by audit and renderer: no separately approximated runtime support. */
export function buildParkFoundation(spec:FoundationSpec,compact=false,lowQuality=false){
 const mesh=new Mesh(new BoxGeometry(spec.size[0],spec.size[1],spec.size[2]),new MeshStandardMaterial({color:'#526b64',roughness:.85}));
 mesh.name='footprint-solid';mesh.matrixAutoUpdate=false;mesh.matrix.fromArray(spec.matrix);if(compact)mesh.matrix.premultiply(new Matrix4().makeRotationY(-Math.PI/2));mesh.castShadow=mesh.receiveShadow=!lowQuality;mesh.raycast=()=>{};return mesh;
}

/** Allocate morph rows before hiding the batch; Three sizes them from count. */
export function createParkBatch(source:Mesh,capacity:number,lowQuality=false){
 const mesh=new InstancedMesh(source.geometry,source.material,capacity);mesh.name='park-only:'+source.name;mesh.castShadow=mesh.receiveShadow=!lowQuality;mesh.raycast=()=>{};mesh.frustumCulled=false;
 if(source.morphTargetInfluences){for(let i=0;i<capacity;i++)mesh.setMorphAt(i,source);if(mesh.morphTexture)mesh.morphTexture.needsUpdate=true;}
 mesh.count=0;return mesh;
}
