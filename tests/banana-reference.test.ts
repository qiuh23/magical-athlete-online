import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,stat} from 'node:fs/promises';
import test from 'node:test';
import {AnimationMixer,Box3,Mesh,SkinnedMesh,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

test('reference banana ships a smooth volumetric sample and a protected economy mesh',async()=>{
  const folder=new URL('../public/models/banana/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('manifest.json',folder),'utf8'));
  const source=new URL('../assets/blender/banana.blend',import.meta.url);
  assert.ok((await stat(source)).size>100_000);
  const historical=JSON.parse(await readFile(new URL('../docs/evidence/refinement-20261022/banana-face-audit.json',import.meta.url),'utf8'));
  assert.equal(historical.passed,true);assert.equal(historical.mouthSurfaceSamples.length,17);assert.ok(historical.mouthSurfaceSamples.every((sample:{surfaceGap:number})=>sample.surfaceGap>=.003&&sample.surfaceGap<=.006));assert.equal(historical.eyes.length,2);assert.ok(historical.eyes.every((eye:{backGap:number})=>eye.backGap>-.018&&eye.backGap<.003));
  const audit=JSON.parse(await readFile('docs/sculpt-20261024/source-audit.json','utf8')).sources.find((r:{id:string})=>r.id==='banana');
  assert.equal(manifest.sourceSha256,createHash('sha256').update(await readFile(source)).digest('hex'));
  assert.ok(audit.faceAttachment.mouthVertices>=60);assert.ok(audit.faceAttachment.minSurfaceGap>-.012&&audit.faceAttachment.minSurfaceGap<0);assert.ok(audit.faceAttachment.maxSurfaceGap>0&&audit.faceAttachment.maxSurfaceGap<.012);
  assert.ok(manifest.economy.triangles<manifest.high.triangles*.8);
  for(const [name,budget] of [['banana',8000],['banana-economy',4000]] as const){
    const bytes=await readFile(new URL(`${name}.glb`,folder)),record=manifest[name==='banana'?'high':'economy'];
    assert.equal(record.glbSha256,createHash('sha256').update(bytes).digest('hex'));
    assert.equal(record.bytes,bytes.byteLength);assert.ok(bytes.byteLength<100_000);
    const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    const root=gltf.scene.getObjectByName('toy_banana')!;assert.ok(root);
    const box=new Box3().setFromObject(root,true),size=box.getSize(new Vector3());
    assert.ok(Math.abs(box.min.y)<.001);assert.ok(size.y>.75&&size.y<=.981);assert.ok(size.x<=.601&&size.z<=.601&&size.z>.15);
    let triangles=0,skins=0;root.traverse(o=>{if(o instanceof Mesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;if(o instanceof SkinnedMesh){skins++;assert.equal(o.skeleton.bones.length,5);}});
    assert.equal(triangles,record.triangles);assert.ok(triangles<budget);assert.equal(skins,1); // identical-skin vertex-colour batching retains full geometry
    assert.deepEqual(gltf.animations.map(c=>c.name).sort(),['banana-fall','banana-idle','banana-move','banana-recover','banana-skill']);
    const mixer=new AnimationMixer(root);mixer.clipAction(gltf.animations.find(c=>c.name==='banana-move')!).play();mixer.setTime(.3);
    assert.deepEqual(root.position.toArray(),[0,0,0]);assert.deepEqual(root.scale.toArray(),[1,1,1]);
  }
});
