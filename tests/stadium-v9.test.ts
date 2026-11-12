import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STADIUM_ASSET_NAMES, STADIUM_PLACEMENTS, instantiateStadiumModel, isClassicStadium, stadiumTileAsset } from '../src/client/scene/stadium/models.js';
import { TRACKS } from '../src/shared/tracks.js';
import { boardPoint, TILE } from '../src/client/scene/math.js';
import { createSkyEnvironment, SKY_SOURCE_DIRECTIONS } from '../src/client/scene/sky-environment.mjs';
import { ATHLETE_LIGHT_PRESETS } from '../src/client/scene/StudioLightingV7.js';

const directory = new URL('../public/models/stadium-v7/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', directory), 'utf8'));
async function load(name: string) {
  const buffer = await readFile(new URL(`${name}.glb`, directory));
  const manager = new THREE.LoadingManager(); manager.setURLModifier(url => { throw Error(`Unexpected dependency ${url}`); });
  return new GLTFLoader(manager).parseAsync(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset+buffer.byteLength), '');
}

test('all 19 approved stadium GLBs decode with unchanged bytes, PBR and dimensions', async () => {
  assert.equal(STADIUM_ASSET_NAMES.length, 19);
  let bytes = 0, triangles = 0;
  for (const name of STADIUM_ASSET_NAMES) {
    const entry = manifest.assets.find((asset: {id:string}) => asset.id === name);
    const buffer = await readFile(new URL(`${name}.glb`, directory));
    assert.equal(createHash('sha256').update(buffer).digest('hex'), entry.sha256, name);
    const {scene} = await load(name);
    const box = new THREE.Box3().setFromObject(scene), size = box.getSize(new THREE.Vector3());
    size.toArray().forEach((dimension,index)=>assert.ok(Math.abs(dimension-entry.dimensions_xyz_gltf[index])<.002, `${name} axis ${index}`));
    let count = 0;
    scene.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      count += (node.geometry.index?.count ?? node.geometry.attributes.position!.count)/3;
      for (const material of Array.isArray(node.material)?node.material:[node.material]) {
        assert.ok(material instanceof THREE.MeshStandardMaterial);
        const expected = entry.material_factors[material.name];
        assert.ok(expected, `${name}/${material.name}`);
        assert.ok(Math.abs(material.roughness-expected.roughnessFactor)<1e-6);
        assert.ok(Math.abs(material.metalness-expected.metallicFactor)<1e-6);
      }
    });
    assert.equal(count,entry.triangles); bytes+=buffer.length; triangles+=count;
  }
  assert.ok(bytes<2.4*1024*1024); assert.equal(triangles,48260);
});

test('live rules select tiles; classic art never replaces other topologies', () => {
  for (const track of Object.keys(TRACKS) as (keyof typeof TRACKS)[]) assert.equal(isClassicStadium(track), track==='mild'||track==='wild');
  for (const track of ['mild','wild'] as const) for(let index=1;index<30;index++) {
    const special=TRACKS[track].specials[index];
    assert.equal(stadiumTileAsset(index,track),special?.kind==='star'?'athlete_tile_gold':special?.kind==='trip'?'athlete_tile_coral':special?.kind==='arrow'?'athlete_tile_mint':'athlete_tile_neutral');
  }
  assert.equal(stadiumTileAsset(0,'wild'),'athlete_start_platform');
  for(const placement of STADIUM_PLACEMENTS) assert.equal(placement.trackIndex,null);
  assert.equal(STADIUM_PLACEMENTS.find(p=>p.asset==='athlete_infield_plan.glb')!.position[1],.15000000596046448);
});

test('GLB tile anchors preserve the original label and pawn plane including compact/start', async () => {
  for (const [index,name] of [[1,'athlete_tile_neutral'],[0,'athlete_start_platform']] as const) {
    const {scene}=await load(name); const point=boardPoint(index,false);
    scene.position.set(point[0]-(index===0?TILE*1.5:0),point[1]-.195,point[2]);
    const bounds=new THREE.Box3().setFromObject(scene);
    assert.ok(bounds.max.y<point[1]+.012, 'original printed label remains above all moulded detail');
    assert.ok(Math.abs(bounds.max.y-point[1])<.004);
    const center=bounds.getCenter(new THREE.Vector3());
    assert.ok(Math.abs(center.x-(point[0]-(index===0?TILE*1.5:0)))<.002);
    const rotated=new THREE.Vector3(...point).applyAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);
    assert.ok(rotated.distanceTo(new THREE.Vector3(...boardPoint(index,true)))<1e-6);
  }
});

test('per-tile colors/emission do not mutate cache or another instance; only owned materials dispose', async () => {
  const {scene}=await load('athlete_tile_mint');
  const first=instantiateStadiumModel(scene,'#b69bd1'),second=instantiateStadiumModel(scene);
  assert.equal(first.owned.length,1); assert.equal(second.owned.length,1);
  assert.notEqual(first.owned[0],second.owned[0]); first.owned[0]!.emissiveIntensity=.5;
  assert.equal(second.owned[0]!.emissiveIntensity,0);
  assert.equal(first.owned[0]!.color.getHexString(),'b69bd1');
  let cachedDisposals=0;
  scene.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.addEventListener('dispose',()=>cachedDisposals++);for(const m of Array.isArray(node.material)?node.material:[node.material]) m.addEventListener('dispose',()=>cachedDisposals++);}});
  first.dispose();second.dispose();assert.equal(cachedDisposals,0);
});

test('one static sky shares day/dusk/night direction, preserves camera, and releases exactly once', () => {
  const scene=new THREE.Scene(), camera=new THREE.OrthographicCamera(-20,20,10,-10,.1,100);
  camera.position.set(3,16,16); camera.lookAt(0,0,0); camera.updateMatrixWorld();
  const before=camera.matrixWorld.clone();
  const sky=createSkyEnvironment({THREE,scene,camera,profile:'athlete',style:'physical',starMode:'diorama'});
  const geometry=sky.mesh.geometry, material=sky.material;
  for(const mode of ['day','dusk','night','day'] as const) {
    sky.update({camera,state:{mode}});
    assert.ok(sky.getLightingState().direction.distanceTo(new THREE.Vector3(...ATHLETE_LIGHT_PRESETS[mode].keyPosition).normalize())<1e-6);
    assert.deepEqual(ATHLETE_LIGHT_PRESETS[mode].keyPosition,SKY_SOURCE_DIRECTIONS.athlete[mode]);
    assert.equal(sky.getLightingState().nightMix,mode==='night'?1:mode==='dusk'?.12:0);
    assert.equal(scene.children.length,1); assert.equal(sky.mesh.geometry,geometry); assert.equal(sky.material,material);
  }
  sky.setQuality(true);sky.setQuality(false);assert.equal(sky.material,material);
  assert.equal(material.depthWrite,false);assert.equal(material.depthTest,false);assert.equal(material.transparent,false);
  assert.equal(material.toneMapped,true);assert.ok(before.equals(camera.matrixWorld));
  assert.equal(sky.getState().starMode,'diorama');
  let disposed=0; geometry.addEventListener('dispose',()=>disposed++);material.addEventListener('dispose',()=>disposed++);
  sky.dispose();sky.dispose();assert.equal(disposed,2);assert.equal(scene.children.length,0);
});
