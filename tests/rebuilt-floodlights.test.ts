import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Box3,InstancedMesh,Matrix4,Mesh,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {TRACKS,type TrackId} from '../src/shared/tracks.js';
import {mechanismLayout} from '../src/client/scene/mechanisms/layout.js';
import {FLOODLIGHT_ASSETS,floodlightUrl,buildFloodlightGeometry,floodlightLayout,spotDistanceAttenuation,venueSpotPhotometry,blenderSpotWatts,VENUE_LIGHT_BUDGET} from '../src/client/scene/environment/floodlights.js';
import {createVenueLightingState,stepVenueLighting,applyVenueSpotState} from '../src/client/scene/environment/venue-lighting-state.js';
import {ENVIRONMENT_LOCAL_OFFSETS,environmentTrees,environmentVenueOffset,environmentPoint} from '../src/client/scene/environment/layout.js';
import {trackNodeIds} from '../src/client/scene/math.js';
import type {EnvironmentModels} from '../src/client/scene/environment/runtime.js';
const models:EnvironmentModels={};
async function load(){for(const name of FLOODLIGHT_ASSETS)if(!models[name]){const b=readFileSync(`public${floodlightUrl(name)}`);models[name]=(await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}return models;}
test('five new light parts match manifest, retain fixed scale/opaque material and small geometry budget',async()=>{
 const manifest=JSON.parse(readFileSync('public/models/floodlights-rebuilt-v3/asset-manifest.json','utf8'));await load();let triangles=0,bytes=0;
 for(const name of FLOODLIGHT_ASSETS){const b=readFileSync(`public${floodlightUrl(name)}`);bytes+=b.length;const asset=manifest.assets.find((a:{name:string})=>a.name===name);assert.equal(createHash('sha256').update(b).digest('hex'),asset.sha256);
 models[name]!.traverse(node=>{assert.ok(!('isLight'in node));if(!(node instanceof Mesh))return;triangles+=(node.geometry.index?.count??node.geometry.getAttribute('position').count)/3;for(const mat of Array.isArray(node.material)?node.material:[node.material])assert.equal(mat.transparent,false);});}
 assert.equal(bytes,57888);assert.equal(triangles,992);const pole=new Box3().setFromObject(models.pole!);assert.equal(pole.min.y,0);assert.equal(pole.max.y,1);
});
test('all seven fixed layouts share real head axes and receiver-calibrated local illuminance',async()=>{
 await load();let cachedDisposals=0;for(const source of Object.values(models))source.traverse(node=>{if(node instanceof Mesh){node.geometry.addEventListener('dispose',()=>cachedDisposals++);for(const m of Array.isArray(node.material)?node.material:[node.material])m.addEventListener('dispose',()=>cachedDisposals++);}});
 for(const track of Object.keys(TRACKS) as TrackId[])for(const raised of [false,true])for(const lowQuality of [false,true]){
  const options={...(raised?mechanismLayout(track):{scale:1,lift:0}),lowQuality},kit=buildFloodlightGeometry(track,models,options);assert.equal(kit.layout.length,8);assert.equal(kit.layout.filter(l=>l.active).length,lowQuality?4:6);
  for(const lamp of kit.layout){assert.ok(lamp.height>.16);const normal=new Vector3(0,0,-1).applyQuaternion(lamp.rotation);assert.ok(normal.distanceTo(lamp.target.clone().sub(lamp.receiver).normalize())<1e-8);
   const photo=venueSpotPhotometry(lamp.receiver,lamp.target,lowQuality);assert.ok(Math.abs(photo.intensity*spotDistanceAttenuation(photo.receivingDistance,photo.distance)*photo.cosine-photo.targetLux)<1e-8);assert.ok(Math.abs(blenderSpotWatts(photo)/(4*Math.PI*photo.receivingDistance**2)*photo.cosine-photo.targetLux)<1e-8);assert.ok(photo.distance>photo.receivingDistance);assert.ok(normal.y<0);
  }
  kit.root.traverse(node=>{if(!(node instanceof InstancedMesh))return;assert.equal(node.count,node.name.includes('foundations')?kit.layout.filter(l=>!l.venuePlatform).length:8);assert.ok(node.userData.environmentRole);for(let i=0;i<node.count;i++){const m=new Matrix4();node.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite));const scale=new Vector3().setFromMatrixScale(m);if(!node.name.includes('pole')&&!node.name.includes('foundations'))assert.ok(scale.distanceTo(new Vector3(1,1,1))<1e-6);}});
  kit.setNightFactor(1);assert.equal(kit.lenses.filter(l=>l.material.emissiveIntensity>0).length,1);kit.setNightFactor(0);assert.ok(kit.lenses.every(l=>l.material.emissiveIntensity===0));kit.dispose();kit.dispose();
 }
 assert.equal(cachedDisposals,0);
});
test('one finite interruptible state keeps sky, main illumination and local spots synchronized, including failed load and pause',()=>{
 const state=createVenueLightingState('day');let p=stepVenueLighting(state,'day',false,0);assert.equal(p.nightFactor,0);assert.equal(p.active,false);
 for(let i=0;i<10;i++)p=stepVenueLighting(state,'night',true,.016);const before=structuredClone(state);stepVenueLighting(state,'night',true,1,true);assert.deepEqual(state,before);
 const phase=state.phase;p=stepVenueLighting(state,'day',true,.01);assert.ok(state.phase<phase&&phase-state.phase<.02);
 for(let i=0;i<200;i++)p=stepVenueLighting(state,'night',true,.016);assert.equal(p.active,false);assert.equal(p.nightFactor,1);assert.ok(Math.abs(p.keyPower-.42)<1e-9);assert.deepEqual(p.sky,{from:'dusk',to:'night',mix:1});
 for(let i=0;i<200;i++)p=stepVenueLighting(state,'night',false,.016);assert.equal(p.nightFactor,0);assert.equal(p.keyPower,2);assert.equal(p.active,false);
 for(let i=0;i<200;i++)p=stepVenueLighting(state,'day',false,.016);assert.equal(p.sky.mix,0);assert.equal(p.keyPower,4.1);assert.equal(p.nightFactor,0);
 const component=readFileSync('src/client/scene/environment/VenueLighting.tsx','utf8'),board=readFileSync('src/client/scene/Board3D.tsx','utf8');assert.doesNotMatch(component,/requestAnimationFrame|setInterval|setTimeout|useGLTF\.preload/);assert.match(component,/preset.active&&!paused/);assert.match(component,/gl.toneMappingExposure===lastExposure.current/);assert.match(component,/useGLTF.clear\(URLS\)/);assert.match(board,/<VenueLighting[^>]*fixturesEnabled=\{environmentReady\}/);
});
test('local clearance corrections translate whole podium/support group and only the two named trees',()=>{
 assert.deepEqual(environmentVenueOffset('wild','podium').toArray(),[-1.7,0,1]);assert.deepEqual(environmentVenueOffset('wild','podium_plinth').toArray(),[-1.7,0,1]);assert.deepEqual(environmentVenueOffset('mild','podium').toArray(),[0,0,0]);
 const options={...mechanismLayout('squiggle'),lowQuality:false},offset=ENVIRONMENT_LOCAL_OFFSETS.squiggleTree02,original=[...offset],withOffset=environmentTrees('squiggle',options);try{offset[0]=0;const plain=environmentTrees('squiggle',options);for(let i=0;i<plain.length;i++){const diff=withOffset[i]!.matrix.elements[12]!-plain[i]!.matrix.elements[12]!;assert.equal(diff,plain[i]!.name==='REFINED_TREE_02'?1:0);}}finally{offset.splice(0,offset.length,...original);}
});

test('fully extinguished local lights are excluded while fixture and main shadows remain independent',()=>{
 const light={intensity:0,visible:true};applyVenueSpotState(light,70,0);assert.equal(light.visible,false);assert.equal(light.intensity,0);
 applyVenueSpotState(light,70,.001);assert.equal(light.visible,true);assert.equal(light.intensity,.07);applyVenueSpotState(light,70,1);assert.equal(light.intensity,70);
 applyVenueSpotState(light,70,0);assert.equal(light.visible,false);
 const source=readFileSync('src/client/scene/environment/VenueLighting.tsx','utf8');assert.match(source,/light.visible=false/);assert.match(source,/applyVenueSpotState\(spot.light,spot.intensity,factor.current.nightFactor\)/);assert.doesNotMatch(source,/shadowMap.autoUpdate\s*=\s*false/);
});

function nodeIlluminance(track:TrackId,lowQuality:boolean,raised:boolean){
 const options={...(raised?mechanismLayout(track):{scale:1,lift:0}),lowQuality};
 const lamps=floodlightLayout(track,options).filter(l=>l.active);
 const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 return trackNodeIds(track).map(node=>{
  const point=environmentPoint(track,node,options);
  const zones=lamps.map(lamp=>{const p=venueSpotPhotometry(lamp.receiver,lamp.target,lowQuality),v=point.clone().sub(lamp.receiver),r=v.length();v.normalize();return p.intensity*spotDistanceAttenuation(r,p.distance)*Math.max(0,-v.y)*smooth(Math.cos(p.angle),Math.cos(p.angle*(1-p.penumbra)),v.dot(lamp.direction));});
  return {node,total:zones.reduce((a,b)=>a+b,0),contributing:zones.filter(n=>n>.03).length};
 });
}
test('historical broad-flood calibration retains route coverage; current local pools are tested separately',()=>{
 for(const track of Object.keys(TRACKS) as TrackId[])for(const lowQuality of [false,true])for(const raised of [false,true]){
  const nodes=nodeIlluminance(track,lowQuality,raised);
  // Analytic Three r186 direct receiver response, before occlusion/tone mapping.
  // This is not a WebGL pixel or device performance assertion.
  for(const n of nodes){assert.ok(Number.isFinite(n.total)&&n.total>.35,`${track}/${lowQuality}/${raised}/${n.node}: ${n.total}`);if(!lowQuality)assert.ok(n.contributing>=2,`${track}/${n.node}: only one full-quality lighting zone`);}
 }
});
test('quality preserves all eight fixed fixtures and caps direct-light and shadow budgets',()=>{
 assert.deepEqual(VENUE_LIGHT_BUDGET,{full:{fixtures:8,spots:6,shadows:1},economy:{fixtures:8,spots:4,shadows:0}});
 for(const track of Object.keys(TRACKS) as TrackId[]){
  const a=floodlightLayout(track,{...mechanismLayout(track),lowQuality:false}),b=floodlightLayout(track,{...mechanismLayout(track),lowQuality:true});
  for(let i=0;i<a.length;i++)for(const field of ['base','head','receiver','target','plinth'] as const)assert.deepEqual(a[i]![field].toArray(),b[i]![field].toArray());
  assert.deepEqual(a.map(l=>l.row),[0,0,0,0,1,1,1,1]);
 }
 const source=readFileSync('src/client/scene/environment/VenueLighting.tsx','utf8');
 assert.doesNotMatch(source,/compact\s*\?[^;]*filter/);
 assert.match(source,/light.shadow.mapSize.set\(compact\?512:1024,compact\?512:1024\)/);
 assert.doesNotMatch(source,/\[track,models,options,compact/);
 assert.match(source,/VENUE_POOL_BUDGET\[lowQuality\?'economy':'full'\]\.shadows/);
});
