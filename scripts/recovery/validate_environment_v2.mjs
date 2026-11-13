// Actual Three GLTFLoader import. No browser/WebGL or FPS certificate is implied.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Box3} from 'three';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(repo, 'public/models/environment-rebuilt-v2');
const manifest = JSON.parse(fs.readFileSync(path.join(output, 'asset-manifest.json'), 'utf8'));
const results = [];
for (const entry of manifest.assets) {
  const b = fs.readFileSync(path.join(output, entry.file));
  const gltf = await new Promise((resolve, reject) => new GLTFLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '', resolve, reject));
  let meshes = 0, triangles = 0, colors = 0;
  const materials = new Set();
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    meshes++;
    triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
    if (o.geometry.attributes.color) colors++;
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
      materials.add(m.uuid);
      assert.equal(m.transparent, false);
      assert.equal(m.opacity, 1);
      if (entry.tree_lod2) assert.equal(m.vertexColors, true);
    }
  });
  const bounds = new Box3().setFromObject(gltf.scene, true);
  const bbox = [bounds.min.toArray(), bounds.max.toArray()];
  const error = Math.max(...bbox.flat().map((v, i) => Math.abs(v - entry.bounds_y_up.flat()[i])));
  assert.equal(triangles, entry.triangles);
  assert.equal(meshes, entry.primitives);
  assert.ok(error < 2e-5);
  if (entry.tree_lod2) {
    assert.equal(materials.size, 2);
    assert.equal(colors, 2);
  }
  results.push({name: entry.name, pass: true, meshes, triangles, materials: materials.size, bounds_y_up: bbox, maxBoundsError: error, coloredMeshes: colors});
  console.log('THREE_PASS', entry.name, triangles, meshes);
}
fs.writeFileSync(path.join(output, 'three-parse-validation.json'), JSON.stringify({scope: 'Three GLTFLoader parse only; not browser/WebGL/FPS validation', pass: true, assets: results}, null, 2) + '\n');
