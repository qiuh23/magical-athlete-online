import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {Matrix4} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {mechanismLayout} from '../src/client/scene/mechanisms/layout.js';
import {buildFloodlightGeometry,FLOODLIGHT_ASSETS,floodlightUrl} from '../src/client/scene/environment/floodlights.js';
import {fullCoveragePlacements,createDisplayMechanism,buildDisplayFoundation,disposeDisplayFoundation,DISPLAY_URLS} from '../src/client/scene/environment/full-coverage.js';
import {collect,collision} from '../scripts/recovery/scene-collision.js';
import type {EnvironmentModels} from '../src/client/scene/environment/runtime.js';
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
async function load(url:string){const bytes=readFileSync('public'+url);return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');}
test('Wild light7 clears the actual Wild16 support and tongue without weakening their geometry',async()=>{
 Object.assign(globalThis,{window:{location:{search:'?mechanisms=1&environment=1'}}});
 const models:EnvironmentModels={};for(const name of FLOODLIGHT_ASSETS)models[name]=(await load(floodlightUrl(name))).scene;
 const placement=fullCoveragePlacements('wild').find(p=>p.anchor.node===16)!;
 const asset=await load(DISPLAY_URLS[placement.variant]);
 for(const lowQuality of [false,true]){
  const model=createDisplayMechanism(placement.variant,asset.scene,asset.animations[0],lowQuality,placement.anchor.id);model.sample(0);
  const foundation=buildDisplayFoundation(placement,model.object,false),targets=collect(foundation,'device:');
  const kit=buildFloodlightGeometry('wild',models,{...mechanismLayout('wild'),lowQuality}),lamp=kit.layout[7]!;
  assert.ok(Math.abs(lamp.base.z-6.025)<1e-8);assert.equal(lamp.connector!.innerCorners[0]![2],4.93);
  assert.ok(Math.abs(lamp.connector!.outerZ-5.575)<1e-8);
  const plinth=kit.root.getObjectByName('floodlight-fixed-foundations')!,parts=collect(plinth,'lamp:');
  const index=(plinth.userData.fixtureIndices as number[]).indexOf(7),current=parts.find(c=>c.name===`lamp:floodlight-fixed-foundations:${index}`)!;
  assert.ok(current);assert.ok(targets.some(t=>t.name.endsWith('wild16-ground-extension')));
  for(const target of targets){assert.equal(collision(current,target),undefined,`${lowQuality}: ${target.name}`);assert.ok(current.box.min.z-target.box.max.z>.0499);}
  // The previous position really intersected both triangles, not merely bounds.
  const previous=collect(plinth,'previous:',new Matrix4().makeTranslation(0,0,-.25)).find(c=>c.name.endsWith(`:${index}`))!;
  assert.equal(targets.filter(t=>collision(previous,t)).length,2);
  const beam=collect(kit.root.getObjectByName('floodlight-outrigger:7')!,'beam:')[0]!;
  assert.ok(beam.box.max.y<Math.min(...targets.map(t=>t.box.min.y))-.26);
  for(const target of targets)assert.equal(collision(beam,target),undefined);
  kit.dispose();model.dispose();disposeDisplayFoundation(foundation);
 }
});
