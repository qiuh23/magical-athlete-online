import { readFileSync, writeFileSync } from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3,Vector3 } from 'three';
import { TRACKS, type TrackId } from '../src/shared/tracks.js';
import { createMechanismInstance, MECHANISM_FILES } from '../src/client/scene/mechanisms/models.js';
import { mechanismPlacements } from '../src/client/scene/mechanisms/placements.js';
import { mechanismLayout, MECHANISM_PAD_SIZE } from '../src/client/scene/mechanisms/layout.js';
import { boardPoint,trackNodeIds } from '../src/client/scene/math.js';
Object.assign(globalThis,{window:{location:{search:'?mechanisms=1'}}});
const bounds=new Map<string,Box3>();
for(const [kind,file]of Object.entries(MECHANISM_FILES)){
 const b=readFileSync(`public/models/mechanisms/${file}`),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const instance=createMechanismInstance(g.scene,g.animations[0]!);const box=new Box3();
 for(let i=0;i<=100;i++){instance.sample(i/100);box.union(new Box3().setFromObject(instance.object,true));}bounds.set(kind,box);instance.dispose();
}
const maps=[];
for(const track of Object.keys(TRACKS)as TrackId[]){
 const placements=mechanismPlacements(track);const nodes=trackNodeIds(track),collisions=[];
 const transformed=placements.map(p=>({...p,box:bounds.get(p.anchor.kind)!.clone().applyMatrix4(p.matrix)}));
 for(const p of transformed){for(const node of nodes){if(node===p.anchor.node)continue;const center=boardPoint(node,false,track),pad=new Box3(new Vector3(center[0]-MECHANISM_PAD_SIZE/2,center[1]-.15,center[2]-MECHANISM_PAD_SIZE/2),new Vector3(center[0]+MECHANISM_PAD_SIZE/2,center[1]+.03,center[2]+MECHANISM_PAD_SIZE/2));if(p.box.intersectsBox(pad))collisions.push({node:p.anchor.node,otherNode:node,kind:'other-pad-bounds'});}
 for(const q of transformed){if(q.anchor.node<=p.anchor.node)continue;if(p.box.intersectsBox(q.box))collisions.push({node:p.anchor.node,otherNode:q.anchor.node,kind:'other-device-bounds'});}}
 maps.push({track,layout:mechanismLayout(track),nodes:nodes.length,specials:placements.length,collisions,placements:transformed.map(p=>({node:p.anchor.node,kind:p.anchor.kind,yaw:p.yaw,min:p.box.min.toArray(),max:p.box.max.toArray()}))});
}
const result={method:'101 source-animation samples; conservative world AABBs vs all other raised pads and devices; not mesh-level actor/contact certification or mobile FPS',maps};
writeFileSync('docs/qa/map-mechanisms/placement-audit.json',JSON.stringify(result,null,2));console.log(maps.map(m=>({track:m.track,scale:m.layout.scale,specials:m.specials,collisions:m.collisions})));if(maps.some(m=>m.collisions.length))process.exitCode=1;
