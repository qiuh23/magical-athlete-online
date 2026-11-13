import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { Box3, InstancedMesh, Matrix4, Mesh, OrthographicCamera, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TRACKS, type TrackId } from '../src/shared/tracks.js';
import { boardPoint, trackConnections, trackNodeIds } from '../src/client/scene/math.js';
import { mechanismLayout } from '../src/client/scene/mechanisms/layout.js';
import { COMMON_ASSETS, environmentAllowsPhysicalContact, environmentAssets, environmentEnabled, environmentPoint, environmentTrees, environmentUrl, gatePlacements, mapEnvironmentAssets, venuePlacements } from '../src/client/scene/environment/layout.js';
import { buildEnvironmentGeometry, geometryIslands, remapEnvironmentGeometry, setEnvironmentTreeVisibility, type EnvironmentModels } from '../src/client/scene/environment/runtime.js';
import { environmentTreeVisibility } from '../src/client/scene/environment/visibility.js';

import { sceneryGeometry } from '../src/client/scene/ExpansionScenery.js';
import { rebuiltSceneryGeometry } from '../src/client/scene/environment/RebuiltScenery.js';

const tracks = Object.keys(TRACKS) as TrackId[], models: EnvironmentModels = {};
async function sources(track: TrackId) {
  for (const name of environmentAssets(track)) if (!models[name]) {
    const bytes = readFileSync(`public${environmentUrl(name)}`);
    models[name] = (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
  }
  return models;
}

test('environment is explicit default-off, only current map and rebuilt LOD2 are requested', () => {
  assert.equal(environmentEnabled(''), false); assert.equal(environmentEnabled('?mechanisms=1'), false); assert.equal(environmentEnabled('?environment=1'), true);
  assert.equal(COMMON_ASSETS.length, 8);
  for (const track of tracks) {
    const names = environmentAssets(track); assert.equal(new Set(names).size, names.length);
    assert.equal(names.filter(n => n.startsWith('tree_')).length, 3);
    assert.ok(names.every(n => !/lod[01]|fl_/.test(n)));
    assert.ok(mapEnvironmentAssets(track).filter(n => /_base|_furniture|_landscape/.test(n)).every(n => n.startsWith(track)));
  }
  const component = readFileSync('src/client/scene/environment/ApprovedEnvironment.tsx', 'utf8'), board = readFileSync('src/client/scene/Board3D.tsx', 'utf8');
  assert.doesNotMatch(component, /useGLTF\.preload|requestAnimationFrame|setInterval/);
  assert.match(board, /environmentCandidate&&<ApprovedEnvironment/);
  assert.match(component, /useGLTF\.clear\(COMMON_URLS\)/); assert.match(component, /useGLTF\.clear\(mapEnvironmentAssets\(track\)\.map\(environmentUrl\)\)/);
  assert.match(readFileSync('src/client/scene/asset-loading.ts', 'utf8'), /setURLModifier\(assetUrl\)/);
});

test('new environment cannot consume old contact certificates while loading, ready, or failed', () => {
  assert.equal(environmentAllowsPhysicalContact(true), false); assert.equal(environmentAllowsPhysicalContact(false), true);
  const board = readFileSync('src/client/scene/Board3D.tsx', 'utf8');
  for (const name of ['certified', 'trip', 'punch']) assert.match(board, new RegExp(`${name}\\.enter\\([^;]*physicalContacts`));
  assert.match(board, /physicalContacts && <MechanismLayer/); assert.match(board, /physicalContacts&&<CertifiedTripLayer/);
  assert.match(board, /if\(!environmentCandidate\)controller.restore/); assert.match(board, /const certifiedBind=certified instanceof SceneMechanismController\|\|physicalContacts&&/);
  assert.match(board, /sceneMechanisms&&certified instanceof SceneMechanismController/);
  assert.match(board, /environmentCandidate&&mechanismCandidate\?new SceneMechanismController\(contactScope\):new GuardedCertifiedTripController/);
  assert.match(board, /environmentReady = environmentCandidate && environmentLoad === 'ready'/);
});

test('source anchors retain real seven-map topology and crown geometry across layout similarities', () => {
  const counts: Record<TrackId, number> = { mild: 6, wild: 6, 'twisty-twirl': 6, 'whirly-world': 6, squiggle: 14, boardwalks: 10, bridges: 27 };
  for (const track of tracks) {
    const options = { ...mechanismLayout(track), lowQuality: false }, raw = { scale: 1, lift: 0, lowQuality: false };
    const a = environmentTrees(track, raw), b = environmentTrees(track, options); assert.equal(a.length, counts[track]);
    for (let i = 0; i < a.length; i++) for (const j of [0, 1, 2, 4, 5, 6, 8, 9, 10]) assert.equal(a[i]!.matrix.elements[j], b[i]!.matrix.elements[j]);
    for (const node of trackNodeIds(track)) { const p = boardPoint(node, false, track), q = environmentPoint(track, node, options); assert.ok(q.distanceTo(new Vector3(p[0] * options.scale, p[1] + options.lift, p[2] * options.scale)) < 1e-9); }
    assert.equal(gatePlacements(track, options)[0]!.position[1], .22 + options.lift);
  }
  assert.equal(trackNodeIds('boardwalks').length, 59); assert.equal(trackConnections('boardwalks').length, 61);
  assert.deepEqual(TRACKS['twisty-twirl'].twistBoundary, { before: 13, after: 14 });
  assert.deepEqual(venuePlacements(1.43).map(p=>p.asset),['podium','officials_kiosk','scoreboard']);
  assert.ok(venuePlacements(0).every(p => p.position[1]! >= .15));
});

test('furniture and foliage remaps keep each rigid component dimensions, not per-vertex pocket selection', async () => {
  const m = await sources('boardwalks');
  for (const part of ['furniture', 'landscape'] as const) {
    const model = m[`boardwalks_${part === 'landscape' ? 'landscape_reexport_v1' : part}`]!; model.updateMatrixWorld(true);
    model.traverse(node => {
      if (!(node instanceof Mesh)) return;
      const raw = node.geometry.clone().applyMatrix4(node.matrixWorld), mapped = remapEnvironmentGeometry(node, 'boardwalks', part, 2), a = raw.getAttribute('position'), b = mapped.getAttribute('position');
      for (const island of geometryIslands(raw)) {
        const box = new Box3(); for (const i of island) box.expandByPoint(new Vector3().fromBufferAttribute(a, i)); const size = box.getSize(new Vector3());
        if (part === 'landscape' && size.y < .125 && Math.max(size.x, size.z) > .8) continue;
        const first = island[0]!, delta = new Vector3(b.getX(first) - a.getX(first), b.getY(first) - a.getY(first), b.getZ(first) - a.getZ(first));
        for (const i of island) assert.ok(new Vector3(b.getX(i) - a.getX(i), b.getY(i) - a.getY(i), b.getZ(i) - a.getZ(i)).distanceTo(delta) < 1e-5);
      }
      raw.dispose(); mapped.dispose();
    });
  }
});

test('seven actual scenes share cached trees and materials, own remapped geometry, and dispose only owned resources', async () => {
  for (const track of tracks) for (const lowQuality of [false, true]) {
    const m = await sources(track), options = { ...mechanismLayout(track), lowQuality }, kit = buildEnvironmentGeometry(track, m, options);
    assert.ok(kit.trees.length >= 6); assert.ok(kit.batches.length <= 10);
    const shadows = new Set(kit.batches.filter(b => b.mesh.castShadow).flatMap(b => b.entries.map(e => e.name))); assert.equal(shadows.size, lowQuality ? 0 : 2);
    let sourceDisposed = false; const observed = new Set<object>();
    for (const { mesh } of kit.batches) {
      assert.ok(Object.values(m).some(model => model.getObjectByProperty('geometry', mesh.geometry)));
      if (!observed.has(mesh.geometry)) { mesh.geometry.addEventListener('dispose', () => { sourceDisposed = true; }); observed.add(mesh.geometry); }
    }
    kit.root.traverse(node => { if (node instanceof Mesh) { assert.ok(node.userData.environmentRole); if (lowQuality) assert.equal(node.castShadow, false); } });
    const full = kit.batches.map(b => b.mesh.count); setEnvironmentTreeVisibility(kit, new Set(kit.trees.map(t => t.name))); assert.ok(kit.batches.every(b => b.mesh.count === 0));
    setEnvironmentTreeVisibility(kit, new Set()); assert.deepEqual(kit.batches.map(b => b.mesh.count), full);
    kit.dispose(); kit.dispose(); assert.equal(sourceDisposed, false);
  }
});

test('desktop and compact camera probes hide rather than move blocking trees and lower actual instance count', async () => {
  for (const track of tracks) for (const compact of [false, true]) {
    const options = { ...mechanismLayout(track), lowQuality: true }, kit = buildEnvironmentGeometry(track, await sources(track), options);
    const camera = new OrthographicCamera(-20, 20, 20, -20, .1, 200); camera.position.set(compact ? 0 : 6, 16, 20); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(true);
    const hidden = environmentTreeVisibility(track, options, compact)(camera, kit.trees), original = kit.trees.map(t => t.matrix.clone());
    setEnvironmentTreeVisibility(kit, hidden);
    kit.batches.forEach(({ mesh, entries }) => assert.equal(mesh.count, entries.filter(e => !hidden.has(e.name)).length));
    kit.trees.forEach((tree, i) => assert.ok(tree.matrix.equals(original[i]!)));
    const rootRotation = new Matrix4().makeRotationY(compact ? -Math.PI / 2 : 0); kit.root.applyMatrix4(rootRotation); kit.root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(kit.root, true); assert.ok(Number.isFinite(box.max.y)); kit.dispose();
  }
});

test('reversed Twisty gates swap labels and owned colors without moving the source openings', async () => {
  const m=await sources('twisty-twirl'),options={scale:1,lift:0,lowQuality:false};
  const normal=buildEnvironmentGeometry('twisty-twirl',m,options),reversed=buildEnvironmentGeometry('twisty-twirl',m,{...options,reversed:true});
  assert.deepEqual(normal.signs.map(s=>s.finish),[false,true]);assert.deepEqual(reversed.signs.map(s=>s.finish),[true,false]);
  for(const name of ['start_gate','finish_gate']) {
    assert.ok(normal.root.getObjectByName(name)!.matrix.equals(reversed.root.getObjectByName(name)!.matrix));
    const materialsBefore:object[]=[];m[name]!.traverse(n=>{if(n instanceof Mesh)materialsBefore.push(n.material);});
    const owned:object[]=[];reversed.root.getObjectByName(name)!.traverse(n=>{if(n instanceof Mesh&&!materialsBefore.includes(n.material))owned.push(n.material);});
    assert.ok(owned.length>0);
  }
  normal.dispose();reversed.dispose();
});

// The unchanged legacy file remains the certified input. This comparison is separate evidence,
// not permission to attach its certificate to candidate geometry or contact controllers.
test('candidate all partition matches frozen default scenery byte for byte', () => {
  for (const track of tracks) for (const low of [false, true]) {
    const a = sceneryGeometry(track, low), b = rebuiltSceneryGeometry(track, low, 'all');
    assert.equal(a.length, b.length);
    for (let i = 0; i < a.length; i++) {
      assert.equal(a[i]!.paint, b[i]!.paint);
      const ag = a[i]!.geometry, bg = b[i]!.geometry;
      assert.deepEqual(ag.groups, bg.groups); assert.deepEqual(ag.index, bg.index);
      assert.deepEqual(Object.keys(ag.attributes), Object.keys(bg.attributes));
      for (const key of Object.keys(ag.attributes)) {
        assert.deepEqual(ag.getAttribute(key).array, bg.getAttribute(key).array);
        assert.equal(ag.getAttribute(key).itemSize, bg.getAttribute(key).itemSize);
      }
      ag.dispose(); bg.dispose();
    }
  }
});
