import{r1ActorPosition}from'../../../src/client/scene/mechanisms/punch-r1/motion.js';
/** Provisional actor-only replay; full scene evidence is explicitly separate. */
import{readFileSync,writeFileSync}from'node:fs';import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';import{MeshoptDecoder}from'three/addons/libs/meshopt_decoder.module.js';import{Group,Mesh,MeshStandardMaterial,Matrix4,Vector3}from'three';
import{cloneToyModel}from'../../../src/client/scene/toy-model-instance.js';import{toyResources}from'../../../src/client/scene/pawn-materials.js';import{captureActorGeometry,actorGeometryFingerprint}from'../../../src/client/scene/mechanisms/actor-snapshot.js';import{r1Mount,solveR1Surface,r1Pose,r1Route,R1_SOFT,r1Signature}from'../../../src/client/scene/mechanisms/punch-r1/plan.js';import{bindRebuildDriver}from'../../../art/mechanisms/punch-rebuild-r1/driver.js';import{boardPoint}from'../../../src/client/scene/math.js';import{pawnRoute,strideLift}from'../../../src/client/scene/pawn-motion.js';
import{resolve}from'node:path';import{pathToFileURL}from'node:url';
const {collect,collision,collider}=await import(pathToFileURL(resolve(process.env.R1_SCENE_ROOT??'.','scripts/recovery/scene-collision.ts')).href);
Object.assign(globalThis,{window:{location:{search:'?mechanisms=1&environment=1'}}});
const load=async(p:string)=>{const b=readFileSync(p);return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const character=process.env.R1_CHARACTER??'banana',reports=[];
for(const node of[23,24])for(const compact of[false,true])for(const lowQuality of(character==='banana'?[false,true]:[false])){
 const asset=await load(character==='banana'?`public/models/banana/banana${lowQuality?'-economy':''}.glb`:`public/models/toy-racers.glb`),actor=new Group(),sculpture=new Group();sculpture.position.y=.164;sculpture.userData.sculptureState='ready';sculpture.add(cloneToyModel(asset.scene.getObjectByName(`toy_${character}`)!,false));actor.add(sculpture);const base=toyResources.baseGeometry(lowQuality),body=new Mesh(base.body,new MeshStandardMaterial()),cap=new Mesh(base.cap,new MeshStandardMaterial());body.name='ownership-body';cap.name='ownership-cap';actor.remove(sculpture);actor.add(body,cap,sculpture);
 const snapshot=captureActorGeometry(actor)!;if(!snapshot)throw Error('Missing actor');const hash=await actorGeometryFingerprint(snapshot),mount=r1Mount('wild',node,compact)!,points=(node===23?[23,24,25]:[24,23,22]).map(n=>boardPoint(n,compact,'wild')),route=pawnRoute(points,true),actorWorld=new Matrix4().makeScale(1.65,1.65,1.65).setPosition(new Vector3(...points[0]!).add(new Vector3(0,.005,0))),actorLocal=mount.matrix.clone().invert().multiply(actorWorld);
 actor.matrixAutoUpdate=false;actor.matrix.copy(actorLocal);
 const gltf=await load('art/mechanisms/punch-rebuild-r1/punch-rebuild-r1.glb'),rig=gltf.scene,solution=solveR1Surface(rig,snapshot,actorLocal,mount.direction.clone().transformDirection(mount.matrix.clone().invert()),candidate=>{
  const d=bindRebuildDriver(rig);let clear=true;
  for(let k=0;k<=40&&clear;k++){
   const t=k/40,p=r1Route(t),point=r1ActorPosition(route,p,2);
   actor.matrix.copy(mount.matrix.clone().invert().multiply(new Matrix4().makeScale(1.65,1.65,1.65).setPosition(point)));
   d.sample(r1Pose(candidate,t));
   for(const x of collect(rig))for(const y of collect(actor)){
    if(!collision(x,y))continue;
    if(x.name!==R1_SOFT||t<.38||t>.46){clear=false;break;}
    const shifted=y.matrix.clone();shifted.elements[12]!+=.02;
    if(collision(x,collider(y.name,y.data.geometry,shifted))){clear=false;break;}
   }
  }
  actor.matrix.copy(actorLocal);return clear;
 });
 actor.matrixAutoUpdate=true;
 const row:any={character,node,compact,lowQuality,hash,solution,productionApproved:false,hard:[],soft:[],samples:401};
 if(solution){const driver=bindRebuildDriver(rig);rig.matrixAutoUpdate=false;rig.matrix.copy(mount.matrix);actor.scale.setScalar(1.65);for(let i=0;i<=400;i++){const t=i/400,p=r1Route(t);driver.sample(r1Pose(solution,t));actor.position.copy(r1ActorPosition(route,p,2));const ds=collect(rig),as=collect(actor);for(const d of ds)for(const a of as){const c=collision(d,a);if(!c)continue;if(d.name===R1_SOFT){const separated=(distance:number)=>{const moved=a.matrix.clone();moved.elements[12]!+=mount.direction.x*distance;moved.elements[14]!+=mount.direction.z*distance;return !collision(d,collider(a.name,a.data.geometry,moved));};let lo=0,hi=.05;if(!separated(hi))row.hard.push({t,reason:'soft-not-separated-within-50mm'});else{for(let n=0;n<18;n++){const mid=(lo+hi)/2;if(separated(mid))hi=mid;else lo=mid;}row.soft.push({t,kind:c.kind,translationToSeparate:hi});}}else row.hard.push({t,device:d.name,actor:a.name,...c});}}row.signature=r1Signature(solution);}
 reports.push(row);console.log(JSON.stringify({node,compact,lowQuality,solution,hard:row.hard.length,first:row.hard[0],soft:row.soft.length}));
}
writeFileSync(`docs/qa/punch-r1-contact/${character==='banana'?'actor-provisional':'actor-'+character}.json`,JSON.stringify({scope:'Actor-only provisional replay; not production or environment authorization',reports},null,2));
