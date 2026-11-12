import {Matrix4,Mesh,SkinnedMesh,Vector3,type Object3D} from 'three';
export interface ActorGeometryPart {name:string;positions:Float32Array;indices:Uint32Array}
export interface ActorGeometrySnapshot {parts:readonly ActorGeometryPart[];vertices:Float32Array;requiresSkeletonFreeze:boolean}
/** Caller passes Pawn's complete body subtree, not just its visible sculpture.
 * Its outer position/scale/fall pose are stripped; authored child transforms,
 * base/cap/.164 layer/mount and currently evaluated morph/skin vertices remain.
 * Pending/failed models cannot be substituted with a fallback capsule. */
export function captureActorGeometry(body:Object3D):ActorGeometrySnapshot|undefined {
 body.updateWorldMatrix(true,true);let unavailable=false,sculptures=0,requiresSkeletonFreeze=false;
 body.traverse(node=>{if(node.userData.sculptureState){sculptures++;if(node.userData.sculptureState!=='ready'||!node.visible)unavailable=true;}});
 if(unavailable||!sculptures)return;
 const inverse=body.matrixWorld.clone().invert(),parts:ActorGeometryPart[]=[],all:number[]=[],point=new Vector3();
 body.traverse(node=>{
  if(!(node instanceof Mesh)||!node.visible)return;
  if(node instanceof SkinnedMesh)requiresSkeletonFreeze=true;
  const relative=new Matrix4().multiplyMatrices(inverse,node.matrixWorld),attribute=node.geometry.getAttribute('position'),positions=new Float32Array(attribute.count*3);
  for(let i=0;i<attribute.count;i++){node.getVertexPosition(i,point).applyMatrix4(relative);positions.set(point.toArray(),i*3);all.push(point.x,point.y,point.z);}
  const index=node.geometry.index,indices=Uint32Array.from({length:index?.count??attribute.count},(_,i)=>index?index.getX(i):i);
  parts.push({name:node.name,positions,indices});
 });
 return {parts,vertices:new Float32Array(all),requiresSkeletonFreeze};
}
/** Real geometry identity, not just a character name or a bounding box. Micron
 * quantization removes harmless matrix roundoff across room positions. The
 * collision geometry itself is not quantized. No data leaves the browser. */
export async function actorGeometryFingerprint(snapshot:ActorGeometrySnapshot){
 const length=snapshot.parts.reduce((sum,p)=>sum+2+p.positions.length+p.indices.length,0),data=new Int32Array(length);let at=0;
 for(const part of snapshot.parts){data[at++]=part.positions.length;data[at++]=part.indices.length;for(const p of part.positions)data[at++]=Math.round(p*1e6);for(const i of part.indices)data[at++]=i;}
 const hash=await crypto.subtle.digest('SHA-256',data.buffer);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
