/** Independent coarse review, not collision certification or browser QA.
 * Run: node --import tsx scripts/recovery/review-mechanism-motion-bounds.ts
 * [output.json]. Only the requested report is written. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {Box3,Group,Mesh,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import type {TrackId} from '../../src/shared/tracks.js';
Object.assign(globalThis,{window:{location:{search:'?mechanisms=1&environment=1'}}});
const {fullCoveragePlacements,createDisplayMechanism,DISPLAY_URLS}=await import('../../src/client/scene/environment/full-coverage.js');
const {TRACKS}=await import('../../src/shared/tracks.js');
const {boardPoint,trackNodeIds}=await import('../../src/client/scene/math.js');
const {CHARACTERS}=await import('../../src/shared/characters.js');
const {SECOND_WIND_CHARACTERS}=await import('../../src/shared/second-wind.js');
const {WURSTII_CHARACTERS}=await import('../../src/shared/wurstii.js');
const {expansionModels}=await import('../../src/client/scene/expansion-models.js');
const {cloneToyModel}=await import('../../src/client/scene/toy-model-instance.js');
const inputs:Record<string,string>={},hash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
for(const path of ['scripts/recovery/review-mechanism-motion-bounds.ts','src/client/scene/environment/full-coverage.ts','src/client/scene/mechanisms/models.ts','src/client/scene/mechanisms/placements.ts','src/client/scene/math.ts','src/client/scene/toy-model-instance.ts'])inputs[path]=hash(path);
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),cache=new Map<string,Awaited<ReturnType<GLTFLoader['parseAsync']>>>();
async function load(url:string){
 const path='public'+url.split('?')[0];inputs[path]??=hash(path);
 if(!cache.has(path)){const bytes=readFileSync(path);cache.set(path,await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''));}
 return cache.get(path)!;
}
function parts(model:ReturnType<typeof createDisplayMechanism>,placement:ReturnType<typeof fullCoveragePlacements>[number]){
 model.object.updateMatrixWorld(true);const out:{name:string;box:Box3}[]=[];
 model.object.traverse(n=>{if(n instanceof Mesh)out.push({name:n.name,box:new Box3().setFromObject(n,true).applyMatrix4(placement.matrix)});});return out;
}
const vector=new Vector3(),volume=(box:Box3)=>{box.getSize(vector);return vector.x*vector.y*vector.z;};
type Candidate={key:string;progress:number;volume:number;overlap:number[][]};
const coarse=[];let devices=0;
for(const track of Object.keys(TRACKS) as TrackId[]){
 const display=[];
 for(const p of fullCoveragePlacements(track)){const a=await load(DISPLAY_URLS[p.variant]),model=createDisplayMechanism(p.variant,a.scene,a.animations[0],false,p.anchor.id);model.sample(0);display.push({p,model,park:parts(model,p)});devices++;}
 const spaces=trackNodeIds(track).map(node=>{const p=boardPoint(node,false,track);return{node,box:new Box3(new Vector3(p[0]-.8,p[1]+.05,p[2]-.8),new Vector3(p[0]+.8,p[1]+1.4,p[2]+.8))};});
 const parked=new Set<string>(),candidates=new Map<string,Candidate>();
 const compare=(a:Box3,b:Box3,key:string,frame:number)=>{
  if(!a.intersectsBox(b))return;const overlap=a.clone().intersect(b),amount=volume(overlap);if(amount<=1e-9)return;
  if(frame===0)parked.add(key);
  else if(!parked.has(key)&&amount>(candidates.get(key)?.volume??0))candidates.set(key,{key,progress:frame/20,volume:amount,overlap:[overlap.min.toArray(),overlap.max.toArray()]});
 };
 for(const device of display){
  for(let frame=0;frame<=20;frame++){
   device.model.sample(frame/20,true);
   for(const a of parts(device.model,device.p)){
    for(const space of spaces)compare(a.box,space.box,`${device.p.anchor.id}|${a.name}|proxy-space:${space.node}`,frame);
    for(const other of display)if(other!==device)for(const b of other.park)compare(a.box,b.box,`${device.p.anchor.id}|${a.name}|${other.p.anchor.id}|${b.name}`,frame);
   }
  }
  device.model.sample(0);
 }
 coarse.push({track,newCandidates:[...candidates.values()].sort((a,b)=>b.volume-a.volume)});display.forEach(d=>d.model.dispose());
}
// Investigate the only substantial proxy-space candidate independently using
// every current selectable sculpture plus an explicit changed form and mount.
const placement=fullCoveragePlacements('wild').find(p=>p.anchor.node===23)!;
const asset=await load(DISPLAY_URLS[placement.variant]),device=createDisplayMechanism(placement.variant,asset.scene,asset.animations[0],false,placement.anchor.id);
const actors=[];
for(const character of [...CHARACTERS,{id:'bite-mark-were'},{id:'hog-knight-mounted'}]){
 const id=character.id.replace('-mounted',''),mounted=character.id.endsWith('-mounted');
 const url=SECOND_WIND_CHARACTERS.some(c=>c.id===id)||id==='bite-mark-were'?`/models/second-wind/${id}.glb`:WURSTII_CHARACTERS.some(c=>c.id===id)?`/models/wurstii/${id}.glb`:id==='banana'?'/models/banana/banana.glb':expansionModels[id]??'/models/toy-racers.glb';
 const a=await load(url),source=a.scene.getObjectByName(`toy_${id}`);if(!source)throw Error(`Missing original sculpture: ${id}`);
 const root=new Group(),holder=new Group();root.position.fromArray(boardPoint(23,false,'wild'));root.position.y+=.005;
 holder.position.set(0,.164+(mounted?.34:0),mounted?-.07:0);holder.scale.setScalar(mounted?.7:1);holder.add(cloneToyModel(source,false));root.add(holder);
 if(mounted){const h=await load('/models/second-wind/hog-knight-hog.glb'),mount=new Group();mount.position.y=.164;mount.add(cloneToyModel(h.scene.getObjectByName('toy_hog-knight-hog')!,false));root.add(mount);}
 actors.push({id:character.id,box:new Box3().setFromObject(root,true)});
}
const overlaps:{actor:string;node:number;part:string;progress:number;overlap:number[][]}[]=[];
const reference=new Vector3(...boardPoint(23,false,'wild'));
for(let frame=0;frame<=50;frame++){
 device.sample(frame/50,true);
 for(const part of parts(device,placement))for(const node of [22,23])for(const actor of actors){
  const actorBox=actor.box.clone().translate(new Vector3(...boardPoint(node,false,'wild')).sub(reference));
  if(part.box.intersectsBox(actorBox)){const overlap=part.box.clone().intersect(actorBox);if(volume(overlap)>1e-9)overlaps.push({actor:actor.id,node,part:part.name,progress:frame/50,overlap:[overlap.min.toArray(),overlap.max.toArray()]});}
 }
}
device.dispose();
const output=process.argv[2]??'docs/qa/mechanism-motion/reviewer-coarse-bounds.json';
const report={scope:'Independent coarse review at fixed desktop mounts. AABB separation can exclude collision; overlaps are candidates only.',limitations:['21 discrete mechanical poses per device, not a continuous sweep.','Other devices are parked; scenery, audience, lights, floor and support meshes are not included.','Proxy spaces are generic 1.6 x 1.35 x 1.6 m boxes, not actual occupied actors.','The targeted Wild23 check uses 153 static full-quality sculpture/form/mount combinations at single-racer centers on nodes 22 and 23; it does not certify animated, crowded, down, arbitrary future or all-map actor configurations.','No browser/GPU rendering is performed.'],inputs,coarse:{tracks:coarse.length,devices,framesPerDevice:21,reports:coarse},wild23:{actorCount:actors.length,nodes:[22,23],frames:51,overlaps,actorBounds:actors.map(a=>({id:a.id,boundsAtNode23:[a.box.min.toArray(),a.box.max.toArray()]}))}};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,devices,newCoarseCandidates:coarse.reduce((n,t)=>n+t.newCandidates.length,0),wild23Actors:actors.length,wild23DeviceActorAabbOverlaps:overlaps.length}));
