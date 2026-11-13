/** Measured layout inputs, not a collision/support authorization. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DoubleSide,Ray,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import type {TrackId} from '../../src/shared/tracks.js';
import {environmentAssets,environmentUrl,environmentPoint} from '../../src/client/scene/environment/layout.js';
import {buildEnvironmentGeometry,type EnvironmentModels} from '../../src/client/scene/environment/runtime.js';
import {activeMechanismLayout} from '../../src/client/scene/mechanisms/layout.js';
import {trackNodeIds} from '../../src/client/scene/math.js';
import {collect} from './scene-collision.js';
Object.assign(globalThis,{window:{location:{search:'?mechanisms=1&environment=1'}}});
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex'),inputs:Record<string,string>={},measured:any[]=[];
const tracks:Record<string,unknown>={};
const load=async(p:string)=>{inputs[p]=sha(p);const b=readFileSync(p);return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
for(const track of ['squiggle','boardwalks','bridges'] as TrackId[]){
 const options={...activeMechanismLayout(track),lowQuality:false},models:EnvironmentModels={};
 for(const n of environmentAssets(track))models[n]=(await load('public'+environmentUrl(n))).scene;
 const env=buildEnvironmentGeometry(track,models,options),terrain=collect(env.root).filter(c=>c.name.includes('_base:'));
 const xs=trackNodeIds(track).map(n=>environmentPoint(track,n,options).x),minX=Math.min(...xs),span=Math.max(...xs)-minX,fixtures=[];
 const ray=(x:number,y:number,side:number)=>{const origin=new Vector3(x,y,side*100),direction=new Vector3(0,0,-side),hits=terrain.flatMap(c=>c.data.tree.raycast(new Ray(origin.clone().applyMatrix4(c.inverse),direction.clone().transformDirection(c.inverse)),DoubleSide,0,Infinity).map((h:any)=>({target:c.name,point:h.point.clone().applyMatrix4(c.matrix)}))).sort((a,b)=>b.point.z*side-a.point.z*side);assert.ok(hits.length,`${track} missing side surface at x=${x} y=${y}`);return hits[0]!;};
 for(const [row,side] of [-1,1].entries())for(const [column,fraction] of [.08,.36,.64,.92].entries()){
  const x=minX+span*fraction,center=ray(x,-.55,side),corners=[];
  for(const y of [-.55,-.35])for(const dx of [-.15,.15]){
   const hit=ray(x+dx,y,side),inner=hit.point.clone();inner.z-=side*.015;
   corners.push([inner.x/options.scale,y,inner.z/options.scale]);
   measured.push({track,fixture:row*4+column,side,sourceScale:options.scale,target:hit.target,surface:hit.point.toArray(),inner:inner.toArray(),inset:.015});
  }
  fixtures.push({x:x/options.scale,edgeZ:center.point.z/options.scale,innerCorners:corners});
 }
 tracks[track]={referenceScale:options.scale,fixtures};env.dispose();
}
const output='src/client/scene/environment/floodlight-edge-mounts.json';
writeFileSync(output,JSON.stringify({version:1,tracks},null,2)+'\n');
for(const p of ['scripts/recovery/export-floodlight-edge-mounts.ts','scripts/recovery/scene-collision.ts','src/client/scene/environment/layout.ts','src/client/scene/environment/runtime.ts','src/client/scene/environment/source-layout.json','src/client/scene/mechanisms/layout.ts','src/client/scene/math.ts','src/shared/tracks.ts','src/shared/leaf-tracks.ts'])inputs[p]=sha(p);
writeFileSync('docs/qa/floodlight-rows/edge-mount-inputs.json',JSON.stringify({scope:'Measured layout input only. No new collision, ground attachment, mechanism authorization or load-bearing certificate.',output,sha256:sha(output),coordinateContract:'XYZ corners: X and Z divided by referenceScale, Y unchanged. Multiply XZ by the matching referenceScale to recover actual sampled standard-layout coordinates. Physical x offsets +/-0.15m, inset15mm toward terrain, y=-.55/- .35. Fixture order negative-Z row columns0..3, positive-Z row columns0..3. Corner order bottom-left, bottom-right, top-left, top-right. Coordinates are certified only as these measured inputs; arbitrary spacing needs new ray sampling.',inputs,measured},null,2)+'\n');
console.log(JSON.stringify({output,tracks:Object.keys(tracks),fixtures:24,corners:measured.length}));
