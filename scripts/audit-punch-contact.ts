/** Finite sampled actual Three geometry, not a browser/FPS or continuous proof. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {Box3,Group,Mesh,Matrix4,BufferAttribute,Vector3,MeshStandardMaterial} from 'three';
import {createMechanismInstance} from '../src/client/scene/mechanisms/models.js';
import {punchPose,PunchController} from '../src/client/scene/mechanisms/punch-profile.js';
import {mechanismPlacements} from '../src/client/scene/mechanisms/placements.js';
import {cloneToyModel} from '../src/client/scene/toy-model-instance.js';
import {toyResources} from '../src/client/scene/pawn-materials.js';
import {boardPoint} from '../src/client/scene/math.js';
import {strideLift} from '../src/client/scene/pawn-motion.js';
const require=createRequire(import.meta.url),dreiRequire=createRequire(require.resolve('@react-three/drei/package.json')),{MeshBVH}=await import(dreiRequire.resolve('three-mesh-bvh'));
Object.assign(globalThis,{window:{location:{search:'?mechanisms=1'}}});
const load=async(file:string)=>{const b=readFileSync(file);return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const source=await load('public/models/mechanisms/punch_outboard_joint.glb'),model=createMechanismInstance(source.scene,source.animations[0]!);model.sample(0);
const p=mechanismPlacements('wild').find(p=>p.anchor.node===24)!,holder=new Group();holder.position.fromArray(p.position);holder.rotation.y=p.yaw;holder.add(model.object);
const reports=[];
for(const quality of ['banana','banana-economy']){
 const asset=await load(`public/models/banana/${quality}.glb`),actor=new Group(),sculpture=new Group();sculpture.position.y=.164;sculpture.add(cloneToyModel(asset.scene.getObjectByName('toy_banana')!,false));actor.add(sculpture);const base=toyResources.baseGeometry(quality.endsWith('economy'));actor.add(new Mesh(base.body,new MeshStandardMaterial()),new Mesh(base.cap,new MeshStandardMaterial()));actor.scale.setScalar(1.65);
 const parts:Mesh[]=[];actor.traverse(n=>{if(n instanceof Mesh)parts.push(n);});const device:Mesh[]=[];model.object.traverse(n=>{if(n instanceof Mesh)device.push(n);});
 const trees=new Map(parts.map(part=>[part,new MeshBVH(part.geometry)])),hits:any[]=[],soft:any[]=[],seen=new Set();
 const origin=boardPoint(24,false,'wild');
 for(const phase of ['prepare','entry','fire']as const)for(let i=0;i<=250;i++){
  const t=i/250,pose=phase==='prepare'?{boom:Math.PI/2*t,counter:-Math.PI/2*t,slider:.35,spring:0,route:0}:phase==='entry'?{boom:Math.PI/2,counter:-Math.PI/2,slider:.35,spring:0,route:0}:punchPose(t);
  model.samplePunchPose(pose);holder.updateMatrixWorld(true);
  const f=t*t*(3-2*t),x=phase==='prepare'?2.05:phase==='entry'?2.05*(1-f):4.1*pose.route;
  actor.position.set(origin[0]+x,origin[1]+.005+(phase==='entry'?strideLift(f,1):phase==='fire'?strideLift(pose.route,2):0),origin[2]);actor.updateMatrixWorld(true);
  for(const d of device){let geometry=d.geometry,owned=false;if(d.morphTargetInfluences?.some(v=>v!==0)){geometry=d.geometry.clone();const pos=geometry.getAttribute('position'),arr=new Float32Array(pos.count*3),v=new Vector3();for(let j=0;j<pos.count;j++){d.getVertexPosition(j,v);v.toArray(arr,j*3);}geometry.setAttribute('position',new BufferAttribute(arr,3));owned=true;}
   geometry.computeBoundingBox();const box=geometry.boundingBox!.clone().applyMatrix4(d.matrixWorld);
   for(const a of parts){a.geometry.computeBoundingBox();if(!box.intersectsBox(a.geometry.boundingBox!.clone().applyMatrix4(a.matrixWorld)))continue;const relative=new Matrix4().copy(a.matrixWorld).invert().multiply(d.matrixWorld);if(trees.get(a).intersectsGeometry(geometry,relative)){const row={phase,t,device:d.name,actor:a.name};if(d.name==='PUNCH_SLIDER_X__coral_fixed_batch'){let lo=0,hi=.05;const crosses=(distance:number)=>{const moved=a.matrixWorld.clone();moved.elements[12]!+=distance;return trees.get(a).intersectsGeometry(geometry,moved.invert().multiply(d.matrixWorld));};if(crosses(hi))throw new Error('Soft contact not separated within 50mm');for(let n=0;n<22;n++){const mid=(lo+hi)/2;if(crosses(mid))lo=mid;else hi=mid;}soft.push({...row,travelTranslationToSeparateM:hi});}else if(!seen.has(`${phase}:${d.name}:${a.name}`)){seen.add(`${phase}:${d.name}:${a.name}`);hits.push(row);}}}
   if(owned)geometry.dispose();
  }
 }
 reports.push({quality,samplesPerPhase:251,hardSurfaceCrossings:hits,softContactSamples:soft.length,maxTravelTranslationToSeparateM:Math.max(0,...soft.map(s=>s.travelTranslationToSeparateM)),softContactRange:soft.length?[soft[0],soft.at(-1)]:[]});
 console.log(quality,reports.at(-1));
}
writeFileSync('docs/qa/map-mechanisms/punch-runtime-contact.json',JSON.stringify({method:'Actual native ToyCharacter hierarchy including .164 sculpture lift, base/cap, scale1.65, pawn root +.005, static bind pose. Direct runtime actuators and original2.05 Wild path; 251 samples each empty deployment/entry/fire, both full/economy. Triangle surface crossings only, no continuous or penetration-depth proof.',reports},null,2));
