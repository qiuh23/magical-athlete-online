import fs from 'node:fs/promises';
import {CHARACTERS} from '../../src/shared/characters.js';
import {Box3,Vector3,Mesh,SkinnedMesh} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
const cache=new Map<string,any>();
async function decoded(path:string){if(cache.has(path))return cache.get(path);const b=await fs.readFile(path);const g=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');cache.set(path,{g,bytes:b.length});return cache.get(path)}
const manifests:any={};for(const e of ['original','second-wind','extra-mile','leaf','wurstii']){const p=e==='original'?'public/models/toy-racers.manifest.json':`public/models/${e}/manifest.json`;manifests[e]=JSON.parse(await fs.readFile(p,'utf8'))}
const rows:any[]=[];
for(const c of [...CHARACTERS,...[{id:'bite-mark-were',nameZh:'咬痕·变身',edition:'second-wind',module:true},{id:'hog-knight-hog',nameZh:'野猪骑士·坐骑',edition:'second-wind',module:true}]] as any[]){
const e=c.edition??'original';const m=manifests[e].models.find((x:any)=>x.id===c.id)??{};
const file=c.id==='banana'?'public/models/banana/banana.glb':e==='original'?'public/models/toy-racers.glb':`public/models/${e}/${c.id}.glb`;
const source=c.id==='banana'?'assets/blender/banana.blend':m.editableSource??(e==='original'?'assets/blender/toy-racers.blend':e==='wurstii'?`assets/blender/wurstii/blend/${c.id}.blend`:`assets/blender/${e}/${c.id}.blend`);
const {g,bytes}=await decoded(file);const root=g.scene.getObjectByName(`toy_${c.id}`);if(!root)throw Error('Missing '+c.id);root.updateMatrixWorld(true);let triangles=0,draws=0,bones=new Set<string>();root.traverse((o:any)=>{if(o instanceof Mesh){draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}if(o instanceof SkinnedMesh)for(const bone of o.skeleton.bones)bones.add(bone.uuid)});const box=new Box3().setFromObject(root,true);
rows.push({id:c.id,nameZh:c.nameZh,edition:e,itemType:c.module?'extra-module':'character',source,sourceExists:await fs.stat(source).then(()=>true).catch(()=>false),actualLoadFile:file,extraQualityFiles:e==='original'?[c.id==='banana'?'public/models/banana/banana-economy.glb':'public/models/toy-racers-economy.glb']:[],bundleAlias:c.id==='banana'?'public/models/toy-racers.glb':null,baseline:{triangles,draws,fileBytes:bytes,bones:bones.size,animations:g.animations.filter((x:any)=>e!=='original'||c.id==='banana'||x.name.startsWith(c.id+'-')).map((x:any)=>x.name),bounds:{min:box.min.toArray(),max:box.max.toArray(),size:box.getSize(new Vector3()).toArray()},root:{position:root.position.toArray(),quaternion:root.quaternion.toArray(),scale:root.scale.toArray()}},recognition:m.recognition??m.refinement??null,sourceReference:m.reference??c.sources??null,sourceInference:m.inferred??'Unreviewed; inspect available reference before sculpt.',status:'not-started',checks:{baselineDecoded:true,sculpt:false,reopenedBlend:false,reimportedGlb:false,visual:false,game:false}});
}
await fs.writeFile('docs/sculpt-20261024/coverage.json',JSON.stringify({baseline:'7467c208b3247af9d4348616366af63bac4f7311',actualBlender:'4.3.2',characterCount:CHARACTERS.length,logicalShapeCount:rows.length,rows},null,2));
console.log(JSON.stringify({characterCount:CHARACTERS.length,logicalShapeCount:rows.length,editions:rows.reduce((o:any,r:any)=>(o[r.edition]=(o[r.edition]??0)+1,o),{}),missingSources:rows.filter(r=>!r.sourceExists).map(r=>r.id)},null,2));
