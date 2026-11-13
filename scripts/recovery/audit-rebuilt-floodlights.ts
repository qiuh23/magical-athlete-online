import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Box3,InstancedMesh,Matrix4,Mesh} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {TRACKS,type TrackId} from '../../src/shared/tracks.js';
import {mechanismLayout} from '../../src/client/scene/mechanisms/layout.js';
import {FLOODLIGHT_ASSETS,FLOODLIGHT_REVISION,floodlightUrl,buildFloodlightGeometry,venueSpotPhotometry,blenderSpotWatts} from '../../src/client/scene/environment/floodlights.js';
import type {EnvironmentModels} from '../../src/client/scene/environment/runtime.js';
const models:EnvironmentModels={},sources=[];
for(const name of FLOODLIGHT_ASSETS){const bytes=readFileSync(`public${floodlightUrl(name)}`);models[name]=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;sources.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
const reports=[];
for(const track of Object.keys(TRACKS) as TrackId[])for(const mechanisms of [false,true])for(const lowQuality of [false,true]){
 const options={...(mechanisms?mechanismLayout(track):{scale:1,lift:0}),lowQuality},kit=buildFloodlightGeometry(track,models,options),entities=[],hash=createHash('sha256');let triangles=0,draws=0,shadowTriangles=0,shadowDraws=0;
 kit.root.traverse(node=>{if(!(node instanceof Mesh))return;const p=node.geometry.getAttribute('position'),idx=node.geometry.index;hash.update(Buffer.from(p.array.buffer,p.array.byteOffset,p.array.byteLength));if(idx)hash.update(Buffer.from(idx.array.buffer,idx.array.byteOffset,idx.array.byteLength));hash.update(JSON.stringify(node.matrixWorld.elements));const instances=[];if(node instanceof InstancedMesh)for(let i=0;i<node.count;i++){const m=new Matrix4();node.getMatrixAt(i,m);instances.push(m.elements);}hash.update(JSON.stringify(instances));const t=(idx?.count??p.count)/3*(node instanceof InstancedMesh?node.count:1);triangles+=t;draws++;if(node.castShadow){shadowTriangles+=t;shadowDraws++;}entities.push({name:node.name,role:node.userData.environmentRole,worldMatrix:node.matrixWorld.elements,instanceMatrices:instances});});
 const box=new Box3().setFromObject(kit.root,true);
 reports.push({track,mechanisms,options,geometrySha256:hash.digest('hex'),bounds:[box.min.toArray(),box.max.toArray()],newFixtureBudget:{triangles,draws,shadowTriangles,shadowDraws,mainPlusTwoShadowDrawUpperBound:draws+2*shadowDraws},lights:kit.layout.map(l=>{const photo=venueSpotPhotometry(l.receiver,l.target);return{id:l.id,node:l.node,targetNode:l.targetNode,base:l.base.toArray(),head:l.head.toArray(),rotation:l.rotation.toArray(),active:l.active,photo,blenderWatts:blenderSpotWatts(photo)};}),entities});kit.dispose();
}
mkdirSync('docs/qa/floodlights-rebuild-v3',{recursive:true});writeFileSync('docs/qa/floodlights-rebuild-v3/geometry-lighting-audit.json',JSON.stringify({revision:FLOODLIGHT_REVISION,scope:'Same actual fixed mesh builder as runtime, unrotated world coordinates. Compact parent rotates all hardware/spots/targets -pi/2 Y. All hardware and foundations included, no role exemption. No collision/FPS/browser certificate. Main+two-shadow figure bounds only these fixtures, not the whole scene.',sources,reports},null,2));console.log(reports.filter(r=>r.mechanisms&&!r.options.lowQuality).map(r=>({track:r.track,budget:r.newFixtureBudget,lights:r.lights.map(l=>({node:l.node,base:l.base,head:l.head,candela:l.photo.intensity,watts:l.blenderWatts}))})));
