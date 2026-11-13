/** Sampled surface check only: candidate full-size fade does not pass through a pipe. */
import {readFileSync,writeFileSync}from'node:fs';import{createRequire}from'node:module';import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';import{MeshoptDecoder}from'three/addons/libs/meshopt_decoder.module.js';import{Group,Mesh,Matrix4,MeshStandardMaterial}from'three';
import{createMechanismInstance}from'../src/client/scene/mechanisms/models.js';import{mechanismPlacements}from'../src/client/scene/mechanisms/placements.js';import{cloneToyModel}from'../src/client/scene/toy-model-instance.js';import{toyResources}from'../src/client/scene/pawn-materials.js';import{boardPoint}from'../src/client/scene/math.js';
const require=createRequire(import.meta.url),dreiRequire=createRequire(require.resolve('@react-three/drei/package.json')),{MeshBVH}=await import(dreiRequire.resolve('three-mesh-bvh'));
Object.assign(globalThis,{window:{location:{search:'?mechanisms=1'}}});
const load=async(file:string)=>{const b=readFileSync(file);return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const source=await load('public/models/mechanisms/warp_joint_action.glb'),reports=[];
for(const quality of['banana','banana-economy']){
 const asset=await load(`public/models/banana/${quality}.glb`),actor=new Group(),sculpture=new Group();sculpture.position.y=.164;sculpture.add(cloneToyModel(asset.scene.getObjectByName('toy_banana')!,false));actor.add(sculpture);const base=toyResources.baseGeometry(quality.endsWith('economy'));actor.add(new Mesh(base.body,new MeshStandardMaterial()),new Mesh(base.cap,new MeshStandardMaterial()));actor.scale.setScalar(1.65);const parts:Mesh[]=[];actor.traverse(n=>{if(n instanceof Mesh)parts.push(n);});const trees=new Map(parts.map(p=>[p,new MeshBVH(p.geometry)]));
 const hits:any[]=[];
 for(const placement of mechanismPlacements('whirly-world')){
  const instance=createMechanismInstance(source.scene,source.animations[0]!),holder=new Group();holder.position.fromArray(placement.position);holder.rotation.y=placement.yaw;holder.add(instance.object);const origin=boardPoint(placement.anchor.node,false,'whirly-world');actor.position.set(origin[0],origin[1]+.005,origin[2]);actor.updateMatrixWorld(true);const device:Mesh[]=[];instance.object.traverse(n=>{if(n instanceof Mesh)device.push(n);});const seen=new Set();
  for(let i=0;i<=50;i++){const t=i/50;instance.sample(t);holder.updateMatrixWorld(true);for(const d of device){d.geometry.computeBoundingBox();const box=d.geometry.boundingBox!.clone().applyMatrix4(d.matrixWorld);for(const a of parts){a.geometry.computeBoundingBox();if(!box.intersectsBox(a.geometry.boundingBox!.clone().applyMatrix4(a.matrixWorld)))continue;const relative=new Matrix4().copy(a.matrixWorld).invert().multiply(d.matrixWorld);if(trees.get(a).intersectsGeometry(d.geometry,relative)&&!seen.has(`${d.name}:${a.name}`)){seen.add(`${d.name}:${a.name}`);hits.push({node:placement.anchor.node,t,device:d.name,actor:a.name});}}}}
  instance.dispose();
 }
 reports.push({quality,samplesPerEndpoint:51,hardSurfaceCrossings:hits});
}
writeFileSync('docs/qa/map-mechanisms/warp-runtime-contact.json',JSON.stringify({method:'Native full-size bind banana body, .164/base/cap/+5mm, all12 Whirly endpoints, source hinge poses. Tests geometry even while fade could be transparent. Not full roster/containment/continuous proof.',reports},null,2));console.log(JSON.stringify(reports));
