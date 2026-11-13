/** Finite follow-up of conservative route AABB warnings, not a contact certificate.
 * Run from repository root: node --import tsx scripts/recovery/audit-display-route-clearance.ts
 * COMPACT=1 rotates layout. OUT selects output. Original banana geometry only. */
import {readFileSync,writeFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {Group,Mesh,MeshStandardMaterial,Vector3} from 'three';
import {fullCoveragePlacements,createDisplayMechanism,DISPLAY_URLS} from '../../src/client/scene/environment/full-coverage.js';
import {boardPoint} from '../../src/client/scene/math.js';
import {pawnRoute,strideLift} from '../../src/client/scene/pawn-motion.js';
import {cloneToyModel} from '../../src/client/scene/toy-model-instance.js';
import {toyResources} from '../../src/client/scene/pawn-materials.js';
import {collect,collision} from './scene-collision.js';
import type {TrackId} from '../../src/shared/tracks.js';
const compact=process.env.COMPACT==='1';
const input=JSON.parse(readFileSync(process.env.INPUT??`/tmp/display-final-clearance-${compact?1:0}.json`,'utf8'));
const load=async(url:string)=>{const b=readFileSync('public'+url);return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const banana=await load('/models/banana/banana.glb'),body=new Group(),holder=new Group(),sculpture=new Group(),base=toyResources.baseGeometry(false);
sculpture.position.y=.164;sculpture.add(cloneToyModel(banana.scene.getObjectByName('toy_banana')!,false));body.add(sculpture,new Mesh(base.body,new MeshStandardMaterial()),new Mesh(base.cap,new MeshStandardMaterial()));holder.add(body);holder.scale.setScalar(1.65);
const records=[];
for(const item of input.filter((r:any)=>r.runningSweptAabb.length)){
 const track=item.anchor.split(':')[0] as TrackId,p=fullCoveragePlacements(track,compact).find(p=>p.anchor.id===item.anchor)!,asset=await load(DISPLAY_URLS[p.variant]),model=createDisplayMechanism(p.variant,asset.scene,asset.animations[0],false,p.anchor.id),poses=[];
 for(let i=0;i<=50;i++){model.sample(i/50,true);poses.push(...collect(model.object,`${item.anchor}:pose${i}:`,p.matrix));}
 let samples=0;const hits=[];
 for(const pair of item.runningSweptAabb)for(const reverse of[false,true])for(const down of[false,true]){
  const nodes=reverse?[...pair].reverse():pair,route=pawnRoute(nodes.map((n:number)=>boardPoint(n,compact,track)),true),point=new Vector3();
  for(let i=0;i<=40;i++){const u=i/40;route.getPointAt(u,point);holder.position.copy(point);holder.position.y+=.005+strideLift(u,1);body.rotation.set(down?-Math.PI/2:0,down?0:Math.sin(u*Math.PI*2)*(reverse?-.055:.045),0);samples++;
   let hit;for(const actor of collect(holder,'actor:')){for(const part of poses){const detail=collision(actor,part);if(detail){hit={actor:actor.name,part:part.name,detail};break;}}if(hit)break;}
   if(hit)hits.push({nodes,down,u,...hit});
  }
 }
 records.push({anchor:item.anchor,compact,actorSamples:samples,devicePoses:51,hits});model.dispose();
}
const result={scope:'Finite actual-triangle banana center-route audit at maximum solo scale 1.65, both directions, stand/legacy-down, 41 fractions, against all 51 fixed-display poses. No all-character, endpoint occupancy reflow, full animation or continuous-collision proof.',records};
writeFileSync(process.env.OUT??`/tmp/display-route-clearance-${compact?1:0}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(records.map(r=>({anchor:r.anchor,actorSamples:r.actorSamples,hits:r.hits.length})),null,2));if(records.some(r=>r.hits.length))process.exitCode=1;
