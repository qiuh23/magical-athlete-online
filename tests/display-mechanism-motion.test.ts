import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Group, Mesh, Vector3, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createDisplayMechanism, DISPLAY_URLS, displayPunchOutlet, type DisplayVariant } from '../src/client/scene/environment/full-coverage.js';

const variants=Object.keys(DISPLAY_URLS) as DisplayVariant[];
const cache=new Map<string,Awaited<ReturnType<GLTFLoader['parseAsync']>>>();
async function asset(variant:DisplayVariant){
 const url=DISPLAY_URLS[variant];
 if(!cache.has(url)){const bytes=readFileSync('public'+url);cache.set(url,await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''));}
 return cache.get(url)!;
}
function pose(root:Object3D){
 const values:number[]=[];root.updateMatrixWorld(true);
 root.traverse(node=>{values.push(...node.matrix.elements);if(node instanceof Mesh&&node.morphTargetInfluences)values.push(...node.morphTargetInfluences);});
 return values;
}
function close(actual:number[],expected:number[],label:string){
 assert.equal(actual.length,expected.length,label);actual.forEach((n,i)=>assert.ok(Math.abs(n-expected[i]!)<1e-9,`${label}: component ${i}: ${n} != ${expected[i]}`));
}
function centers(root:Object3D){const result=new Map<string,Vector3>();root.traverse(node=>{if(node instanceof Mesh)result.set(node.name,new Box3().setFromObject(node,true).getCenter(new Vector3()));});return result;}

test('all seven authored devices have a visible complete cycle and a fixed root in both quality modes',async()=>{
 for(const variant of variants)for(const low of [false,true])for(const scale of [1,.65]){
  const source=await asset(variant),model=createDisplayMechanism(variant,source.scene,source.animations[0],low);
  model.sample(0);const park=pose(model.object),initial=centers(model.object),root=model.object.matrix.clone(),sourcePark=pose(source.scene);
  const foot=model.object.getObjectByName(variant==='punch'||variant==='punch-r1'?'PUNCH_ROOT__teal_fixed_batch':variant==='telescopic-trip'||variant==='trip'?'TRIP_FIXED_FOOT':`${variant.toUpperCase()}_FOOT`);
  assert.ok(foot,`${variant} has authored fixed hardware`);const footWorld=foot.matrixWorld.clone();let movement=0;
  for(let frame=0;frame<=60;frame++){
   model.sample(frame/60,true,scale);assert.deepEqual(model.object.matrix.elements,root.elements,variant);
   close(foot.matrixWorld.elements,footWorld.elements,`${variant} fixed foundation`);
   for(const [name,point]of centers(model.object))movement=Math.max(movement,point.distanceTo(initial.get(name)!));
  }
  assert.ok(movement>(variant==='loss'?.045:.20),`${variant} moves actual hardware: ${movement}`);
  close(pose(model.object),park,`${variant} exact terminal park`);
  close(pose(source.scene),sourcePark,`${variant} cached GLB is unchanged`);model.dispose();
 }
});

test('sampling is independent of frame count, repeated time, reverse time and the previous cycle',async()=>{
 for(const variant of variants){
  const source=await asset(variant),model=createDisplayMechanism(variant,source.scene,source.animations[0]);
  model.sample(0);const park=pose(model.object);
  for(const t of [.1,.22,.4,.63,.88]){
   model.sample(t,true);const expected=pose(model.object);
   for(let i=0;i<20;i++)model.sample(t,true);close(pose(model.object),expected,`${variant} pause ${t}`);
   model.sample(.98,true);model.sample(.01,true);model.sample(t,true);close(pose(model.object),expected,`${variant} reverse ${t}`);
   model.sample(1,true);model.sample(0);model.sample(t,true);close(pose(model.object),expected,`${variant} repeat ${t}`);
  }
  model.sample(.4,true);model.sample(.63,false);close(pose(model.object),park,`${variant} inactive resets`);
  model.sample(.4,true);model.sample(.5,true,0);close(pose(model.object),park,`${variant} zero amplitude`);
  model.dispose();
 }
});

test('complete display sweeps stay on the local cabinet side instead of entering the running lane',async()=>{
 const cabinetMin:Record<DisplayVariant,number>={punch:1.005,trip:1.22,gain:1.205,loss:1.225,warp:1.225,'telescopic-trip':1.22,'punch-r1':1.105};
 for(const variant of variants){
  const source=await asset(variant),model=createDisplayMechanism(variant,source.scene,source.animations[0]);
  for(const scale of [1,.65])for(let frame=0;frame<=100;frame++){
   model.sample(frame/100,true,scale);const bounds=new Box3().setFromObject(model.object,true);
   // R1's existing display placement has a fixed 1.2m outboard offset.
   const shiftedMin=bounds.min.z+(variant==='punch-r1'?1.2:0);
   assert.ok(shiftedMin>=cabinetMin[variant]-1e-5,`${variant} t=${frame/100}: ${shiftedMin}`);
   assert.ok([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite));
  }
  model.dispose();
 }
});

test('glove release uses the real sampled surface and is independent of parent world transform',async()=>{
 for(const variant of ['punch','punch-r1'] as const){
  const source=await asset(variant),model=createDisplayMechanism(variant,source.scene,source.animations[0]);
  for(const scale of [1,.65]){
   model.sample(.22,true,scale);const outlet=displayPunchOutlet(model.object);
   const glove=model.object.getObjectByName('PUNCH_SLIDER_X__coral_fixed_batch')!,bounds=new Box3().setFromObject(glove,true),center=bounds.getCenter(new Vector3());
   close(outlet.toArray(),[bounds.max.x,center.y,center.z],`${variant} actual front`);
   const holder=new Group();holder.position.set(12,4,-7);holder.rotation.y=.8;holder.add(model.object);holder.updateMatrixWorld(true);
   close(displayPunchOutlet(model.object).toArray(),outlet.toArray(),`${variant} mount-independent outlet`);holder.remove(model.object);model.object.updateMatrixWorld(true);
   model.sample(.08,true,scale);const retracted=displayPunchOutlet(model.object);assert.ok(outlet.x-retracted.x>.22*scale,`${variant} complete visible fist stroke`);
  }
  model.dispose();
 }
});
