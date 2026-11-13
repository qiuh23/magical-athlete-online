import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AnimationMixer,Box3,Group,Mesh,Ray,SkinnedMesh,Vector3,type Object3D} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {MechanismActorBounds} from '../src/client/scene/mechanisms/actor-bounds.js';

/** Independent reference: evaluate every visible vertex, including skinning,
 * rather than reading either geometry.boundingBox or SkinnedMesh.boundingBox. */
function evaluatedBounds(root:Object3D){
 root.updateWorldMatrix(true,true);const box=new Box3(),point=new Vector3();
 root.traverse(node=>{
  if(!(node instanceof Mesh))return;
  for(let parent:Object3D|null=node;parent;parent=parent.parent)if(!parent.visible)return;
  for(let i=0;i<node.geometry.getAttribute('position').count;i++)box.expandByPoint(node.getVertexPosition(i,point).applyMatrix4(node.matrixWorld));
 });
 return box;
}
function close(actual:Vector3,expected:Vector3,label:string){assert.ok(actual.distanceTo(expected)<1e-8,`${label}: ${actual.toArray()} != ${expected.toArray()}`);}

test('real coach move GLBs target evaluated skin bounds through animation, crowd scale and down transforms',async()=>{
 for(const quality of ['','-economy']){
  const bytes=readFileSync(`public/models/toy-racers${quality}.glb`);
  const asset=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const model=clone(asset.scene.getObjectByName('toy_coach')!),root=new Group(),body=new Group();root.add(body);body.add(model);model.position.y+=.164;
  const mesh=model.getObjectByName('coach_sculpt');assert.ok(mesh instanceof SkinnedMesh,'test must exercise a real skinned mesh');
  const clip=asset.animations.find(c=>c.name==='coach-move');assert.ok(clip);
  const mixer=new AnimationMixer(model);mixer.clipAction(clip).play();
  const tracker=new MechanismActorBounds(),unbind=tracker.bind('coach',body);let bindPoseError=0;
  // Quarter turns preserve axis-aligned bounds exactly, while covering compact
  // rotation, the board's down pose, rider-height placement and crowd scaling.
  for(const [scale,turn,tilt,lift]of [[1,0,0,0],[.5,-Math.PI/2,0,.34],[.65,0,-Math.PI/2,.2]]){
   root.position.set(3,1.655,-7);root.rotation.y=turn!;root.scale.setScalar(scale!);body.rotation.x=tilt!;body.position.y=lift!;
   for(const seconds of [0,.1,.4,.8,1.2,1.9,.4]){
    mixer.setTime(seconds);const expected=evaluatedBounds(body),actual=tracker.bounds('coach');assert.ok(actual);
    close(actual.min,expected.min,`${quality} ${seconds} min`);close(actual.max,expected.max,`${quality} ${seconds} max`);
    const origin=expected.getCenter(new Vector3()).add(new Vector3(-3,1,2)),center=expected.getCenter(new Vector3());
    const hit=new Ray(origin,center.clone().sub(origin).normalize()).intersectBox(expected,new Vector3())!;
    close(tracker.surface('coach',origin,new Vector3(99,99,99)),hit,`${quality} ${seconds} feedback surface`);
    if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
    const stale=mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);
    bindPoseError=Math.max(bindPoseError,stale.min.distanceTo(expected.min),stale.max.distanceTo(expected.max));
   }
  }
  assert.ok(bindPoseError>.02,`test must distinguish current skin from bind pose: ${bindPoseError}`);
  unbind();assert.equal(tracker.bounds('coach'),undefined);mixer.stopAllAction();mixer.uncacheRoot(model);
 }
});
