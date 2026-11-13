/** Exact runtime-builder budget and deterministic geometry manifest, not WebGL telemetry. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { Box3, InstancedMesh, Matrix4, Mesh, OrthographicCamera } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TRACKS, type TrackId } from '../../src/shared/tracks.js';
import { environmentAssets, environmentUrl, ENVIRONMENT_REVISION } from '../../src/client/scene/environment/layout.js';
import { buildEnvironmentGeometry, setEnvironmentTreeVisibility, type EnvironmentModels } from '../../src/client/scene/environment/runtime.js';
import { environmentTreeVisibility } from '../../src/client/scene/environment/visibility.js';
import { mechanismLayout } from '../../src/client/scene/mechanisms/layout.js';

const models: EnvironmentModels = {}, tracks = Object.keys(TRACKS) as TrackId[];
for (const track of tracks) for (const name of environmentAssets(track)) if (!models[name]) {
  const bytes = readFileSync(`public${environmentUrl(name)}`);
  models[name] = (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
}
function measure(root: import('three').Group) {
  let triangles = 0, draws = 0, shadowTriangles = 0, shadowDraws = 0;
  root.traverse(node => {
    if (!(node instanceof Mesh)) return; const count = node instanceof InstancedMesh ? node.count : 1;
    const tri = (node.geometry.index?.count ?? node.geometry.getAttribute('position').count) / 3 * count;
    const calls = count ? Array.isArray(node.material) ? node.geometry.groups.length || node.material.length : 1 : 0;
    triangles += tri; draws += calls; if (node.castShadow) { shadowTriangles += tri; shadowDraws += calls; }
    assert.ok(node.userData.environmentRole); assert.ok(node.matrixWorld.elements.every(Number.isFinite));
  });
  return { triangles, draws, shadowTriangles, shadowDraws, singleMainShadowDrawUpperBound: draws + shadowDraws };
}
const reports = [];
for (const track of tracks) for (const mechanisms of [false, true]) for (const lowQuality of [false, true]) {
  const options = { ...(mechanisms ? mechanismLayout(track) : { scale: 1, lift: 0 }), lowQuality };
  const kit = buildEnvironmentGeometry(track, models, options), unculled = measure(kit.root), box = new Box3().setFromObject(kit.root, true);
  const probes = [];
  for (const compact of [false, true]) {
    const camera = new OrthographicCamera(-20, 20, 20, -20, .1, 200); camera.position.set(compact ? 0 : 6, 16, 20); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(true);
    const hidden = environmentTreeVisibility(track, options, compact)(camera, kit.trees); setEnvironmentTreeVisibility(kit, hidden);
    probes.push({ compact, hiddenTrees: [...hidden].sort(), submittedAfterTreeCulling: measure(kit.root) });
  }
  setEnvironmentTreeVisibility(kit, new Set());
  const digest = createHash('sha256'), entities: object[] = [];
  kit.root.traverse(node => {
    if (!(node instanceof Mesh)) return; const p = node.geometry.getAttribute('position');
    digest.update(Buffer.from(p.array.buffer, p.array.byteOffset, p.array.byteLength));
    if (node.geometry.index) { const a = node.geometry.index.array; digest.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); }
    digest.update(JSON.stringify(node.matrixWorld.elements));
    const matrices: number[][] = [];
    if (node instanceof InstancedMesh) for (let i = 0; i < node.count; i++) { const matrix = new Matrix4(); node.getMatrixAt(i, matrix); matrices.push(matrix.elements); }
    digest.update(JSON.stringify(matrices)); entities.push({ name: node.name, role: node.userData.environmentRole, worldMatrix: node.matrixWorld.elements, instanceMatrices: matrices });
  });
  reports.push({ track, mechanisms, physicalContacts: false, lowQuality, options, trees: kit.trees.length, bytes: environmentAssets(track).reduce((n, asset) => n + statSync(`public${environmentUrl(asset)}`).size, 0), unculled, bounds: [box.min.toArray(), box.max.toArray()], geometrySha256: digest.digest('hex'), probes, entities });
  kit.dispose();
}
const output = 'docs/qa/map-environment-rebuild'; mkdirSync(output, { recursive: true });
const files = Object.keys(models).map(name => { const bytes = readFileSync(`public${environmentUrl(name)}`); return { name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }; });
writeFileSync(`${output}/runtime-geometry-audit.json`, JSON.stringify({ revision: ENVIRONMENT_REVISION, sourceFiles: files, scope: 'New source-derived runtime geometry. Unculled environment pass plus one directional shadow upper bound; excludes old retained bases/routes/carnival props/sky/actors/HUD. Tree culling lowers instance count, not zero scale. Hidden tree entities remain in the digest. No collision, browser, WebGL, pixel visibility or FPS certificate.', reports }, null, 2));
console.log(JSON.stringify(reports.filter(r => r.mechanisms && !r.lowQuality).map(({ entities, ...report }) => report), null, 2));
