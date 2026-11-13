import test from 'node:test';
import assert from 'node:assert/strict';
import { TripSweepLayout } from '../src/client/scene/mechanisms/trip-sweep-layout.js';
import { Vector3 } from 'three';
import { fullCoveragePlacements } from '../src/client/scene/environment/full-coverage.js';
import { boardPoint } from '../src/client/scene/math.js';
import { pawnOccupancy } from '../src/client/scene/camera.js';
import type { Racer } from '../src/shared/types.js';

test('one active track-trip key retains its initial layout through resize, pause and repeated snapshots', () => {
  const layout = new TripSweepLayout();
  assert.equal(layout.sample('trip:1', false, true), false);
  for (const requested of [true, false, true, true]) assert.equal(layout.sample('trip:1', requested, true), false);
  assert.equal(layout.sample('trip:2', true, true), true);
  for (const requested of [false, true, false]) assert.equal(layout.sample('trip:2', requested, true), true);
});

test('completion, skip and reconnect release the frozen layout immediately, even if a key is later reused', () => {
  const layout = new TripSweepLayout();
  assert.equal(layout.sample('trip', false, true), false);
  assert.equal(layout.sample('', true, false), true);
  assert.equal(layout.sample('trip', true, true), true);
  assert.equal(layout.sample('trip', false, false), false);
  assert.equal(layout.sample('trip', false, true), false);
});

test('ordinary skills, movement and idle layouts continue following the current viewport', () => {
  const layout = new TripSweepLayout();
  for (const key of ['', 'move', 'skill', 'ordinary-trip']) for (const compact of [true, false, true]) assert.equal(layout.sample(key, compact, false), compact);
});

test('an explicitly scoped key acquires the latest size after a restored match or next beat', () => {
  const layout = new TripSweepLayout();
  assert.equal(layout.sample('scope-a:trip-7', false, true), false);
  assert.equal(layout.sample('scope-a:trip-7', true, true), false);
  assert.equal(layout.sample('scope-b:trip-7', true, true), true);
  assert.equal(layout.sample('scope-b:trip-8', false, true), false);
});

test('freezing the real two-person compact layout preserves each target in the mounted sweep coordinate system', () => {
  const racers: Racer[] = ['left', 'right'].map(id => ({ id, playerId: id, characterId: 'banana', position: 5, tripped: false, finished: false, eliminated: false, flags: {} }));
  const coordinates = (compact: boolean) => {
    const mount = fullCoveragePlacements('wild', compact).find(placement => placement.anchor.id === 'wild:5')!.matrix;
    return racers.map(racer => {
      const point = boardPoint(5, compact, 'wild'), offset = pawnOccupancy(racer, racers, 5, compact, 'wild');
      return new Vector3(point[0] + offset.x, point[1], point[2] + offset.z).applyMatrix4(mount.clone().invert()).toArray();
    });
  };
  // Real crowd offsets retain world-axis placement on responsive layouts, so
  // the old frozen contact plan cannot simply reuse a rotated mount.
  assert.notDeepEqual(coordinates(false), coordinates(true));
  for (const initial of [false, true]) {
    const layout = new TripSweepLayout(), first = coordinates(layout.sample('scope:trip', initial, true));
    for (const requested of [!initial, initial, !initial]) assert.deepEqual(coordinates(layout.sample('scope:trip', requested, true)), first);
    assert.deepEqual(coordinates(layout.sample('', !initial, false)), coordinates(!initial));
  }
});
