/** Analytic r186 photometry and actual fixture geometry budget. Not WebGL/FPS QA. */
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {InstancedMesh,Mesh} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {TRACKS,type TrackId} from '../../src/shared/tracks.js';
import {trackNodeIds} from '../../src/client/scene/math.js';
import {mechanismLayout} from '../../src/client/scene/mechanisms/layout.js';
import {environmentPoint} from '../../src/client/scene/environment/layout.js';
import {buildFloodlightGeometry,FLOODLIGHT_ASSETS,floodlightUrl,venueSpotPhotometry,spotDistanceAttenuation,VENUE_LIGHT_BUDGET,FLOODLIGHT_REVISION} from '../../src/client/scene/environment/floodlights.js';
import type {EnvironmentModels} from '../../src/client/scene/environment/runtime.js';
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const models:EnvironmentModels={},assets=[];
for(const name of FLOODLIGHT_ASSETS){const path='public'+floodlightUrl(name),b=readFileSync(path);models[name]=(await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;assets.push({path,bytes:b.length,sha256:sha(path)});}
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const reports=[];
for(const track of Object.keys(TRACKS) as TrackId[])for(const raised of [false,true])for(const lowQuality of [false,true]){
 const options={...(raised?mechanismLayout(track):{scale:1,lift:0}),lowQuality},kit=buildFloodlightGeometry(track,models,options),spots=kit.layout.filter(l=>l.active),budget=VENUE_LIGHT_BUDGET[lowQuality?'economy':'full'];let draws=0,triangles=0,shadowDraws=0,shadowTriangles=0;
 kit.root.traverse(node=>{if(!(node instanceof Mesh))return;const n=(node.geometry.index?.count??node.geometry.getAttribute('position').count)/3*(node instanceof InstancedMesh?node.count:1);const d=Array.isArray(node.material)?node.material.length:1;draws+=d;triangles+=n;if(node.castShadow){shadowDraws+=d;shadowTriangles+=n;}});
 assert.equal(kit.layout.length,budget.fixtures);assert.equal(spots.length,budget.spots);assert.ok(draws<=20&&triangles<=8200);
 const samples=trackNodeIds(track).map(node=>{const p=environmentPoint(track,node,options);const zones=spots.map(l=>{const photo=venueSpotPhotometry(l.receiver,l.target,lowQuality),v=p.clone().sub(l.receiver),r=v.length();v.normalize();return photo.intensity*spotDistanceAttenuation(r,photo.distance)*Math.max(0,-v.y)*smooth(Math.cos(photo.angle),Math.cos(photo.angle*(1-photo.penumbra)),v.dot(l.direction));});const total=zones.reduce((a,b)=>a+b,0),contributing=zones.filter(l=>l>.03).length;assert.ok(total>.35);if(!lowQuality)assert.ok(contributing>=2);return {node,unoccludedLux:total,contributingZones:contributing};});
 reports.push({track,raised,lowQuality,draws,triangles,shadowDraws,shadowTriangles,mainPlusLocalShadowDrawUpperBound:draws+shadowDraws*(lowQuality?0:1+budget.shadows),budget,minimumUnoccludedLux:Math.min(...samples.map(s=>s.unoccludedLux)),maximumUnoccludedLux:Math.max(...samples.map(s=>s.unoccludedLux)),samples});kit.dispose();
}
const inputs=Object.fromEntries(['src/client/scene/environment/floodlights.ts','src/client/scene/environment/VenueLighting.tsx','src/client/scene/environment/floodlight-edge-mounts.json','scripts/recovery/audit-floodlight-row-lighting.ts'].map(p=>[p,sha(p)]));
mkdirSync('docs/qa/floodlight-rows',{recursive:true});writeFileSync('docs/qa/floodlight-rows/lighting-budget.json',JSON.stringify({revision:FLOODLIGHT_REVISION,scope:'Actual fixture triangles and batch/material count, with analytic Three r186 local-light attenuation on every real track node. Shadow bound counts only these fixtures, not the whole scene. No occlusion, pixel/color agreement, whole-scene draw calls, mobile FPS or joint geometry certificate.',inputs,assets,reports},null,2));
console.log(reports.filter(r=>r.raised).map(({track,lowQuality,draws,triangles,minimumUnoccludedLux,maximumUnoccludedLux})=>({track,lowQuality,draws,triangles,minimumUnoccludedLux,maximumUnoccludedLux})));
