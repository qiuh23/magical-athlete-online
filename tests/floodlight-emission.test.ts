import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { InstancedMesh, Mesh, MeshStandardMaterial, Raycaster, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FLOODLIGHT_ASSETS, floodlightUrl, buildFloodlightGeometry } from '../src/client/scene/environment/floodlights.js';
import { FLOODLIGHT_COLOR } from '../src/client/scene/environment/floodlight-color.js';
import { activeVenuePools } from '../src/client/scene/environment/floodlight-pools.js';
import { applyVenueSpotState } from '../src/client/scene/environment/venue-lighting-state.js';
import { TRACKS, type TrackId } from '../src/shared/tracks.js';
import type { EnvironmentModels } from '../src/client/scene/environment/runtime.js';
const models: EnvironmentModels = {};
async function load() {
  for (const name of FLOODLIGHT_ASSETS) {
    const bytes = readFileSync(`public${floodlightUrl(name)}`);
    models[name] = (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
  }
}
test('lamp diffuser emission follows the same day/night factor and enabled fixtures as the real spotlights', async () => {
  await load();
  for (const track of Object.keys(TRACKS) as TrackId[]) for (const lowQuality of [false, true]) {
    const kit = buildFloodlightGeometry(track, models, { scale: 1, lift: 0, lowQuality });
    const activeCount = activeVenuePools(kit.layout, lowQuality).length;
    for (const factor of [0, .12, .5, 1, .5, 0]) {
      kit.setNightFactor(factor);
      let litFixtures = 0;
      kit.root.traverse(object => {
        if (!(object instanceof InstancedMesh) || !object.name.startsWith('floodlight:lenses:')) return;
        const material = object.material as MeshStandardMaterial;
        assert.equal(material.emissive.getHexString(), FLOODLIGHT_COLOR.slice(1));
        assert.equal(material.toneMapped, false);
        assert.equal(material.transparent, false);
        assert.equal(material.depthTest, true);
        if (material.emissiveIntensity > 0) { litFixtures += object.count; assert.equal(material.emissiveIntensity, 6 * factor); }
      });
      const spot = { intensity: 0, visible: false };
      applyVenueSpotState(spot, 100, factor);
      assert.equal(litFixtures, spot.visible ? activeCount : 0);
    }
    kit.dispose();
  }
  models.lenses!.traverse(object => {
    if (object instanceof Mesh) assert.equal((object.material as MeshStandardMaterial).emissiveIntensity, 1);
  });
});
test('existing diffuser is visible through the housing opening without moving geometry or bypassing depth', async () => {
  await load();
  const ray = new Raycaster(new Vector3(.33,.14,-1), new Vector3(0,0,1));
  models.lenses!.updateMatrixWorld(true); models.housing!.updateMatrixWorld(true);
  const lens = ray.intersectObject(models.lenses!,true)[0]!;
  const housing = ray.intersectObject(models.housing!,true)[0]!;
  assert.ok(lens && housing && lens.distance < housing.distance);
});
