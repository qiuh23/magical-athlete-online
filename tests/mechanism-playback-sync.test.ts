import test from 'node:test';
import assert from 'node:assert/strict';
import { PresentationClock } from '../src/client/presentation-clock.js';
import { MechanismPlayback } from '../src/client/scene/mechanisms/playback.js';

const close = (actual: number, expected: number) => assert(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('late Suspense and mid-pause remounts join the actual shared phase and cannot admit a late plan at zero', () => {
  let now = 0;
  const clock = new PresentationClock(() => now), live = new MechanismPlayback();
  now = 900; close(live.sample('trip', clock.now(), 0, 2000, false, false), .45);
  now = 1100; clock.setPaused(true);
  close(live.sample('trip', clock.now(), 0, 2000, true, false), .55);
  now += 60000;
  const remounted = new MechanismPlayback(), lateLoaded = new MechanismPlayback();
  for (const playback of [live, remounted, lateLoaded]) {
    const phase = playback.sample('trip', clock.now(), 0, 2000, true, false);
    close(phase, .55);
    assert(phase > .12, 'a first paused frame cannot bypass the deployment deadline');
  }
  clock.setPaused(false);
  for (const playback of [live, remounted, lateLoaded]) close(playback.sample('trip', clock.now(), 0, 2000, false, false), .55);
  now += 300;
  for (const playback of [live, remounted, lateLoaded]) close(playback.sample('trip', clock.now(), 0, 2000, false, false), .7);
});

test('an existing key captures the precise first paused frame, then excludes an advancing external clock once', () => {
  const playback = new MechanismPlayback();
  close(playback.sample('trip', 400, 0, 2000, false, false), .2);
  close(playback.sample('trip', 500, 0, 2000, true, false), .25);
  close(playback.sample('trip', 10500, 0, 2000, true, false), .25);
  close(playback.sample('trip', 20500, 0, 2000, false, false), .25);
  close(playback.sample('trip', 21000, 0, 2000, false, false), .5);
  close(playback.sample('trip', 21200, 0, 2000, true, false), .6);
  close(playback.sample('trip', 31200, 0, 2000, true, false), .6);
  close(playback.sample('trip', 41200, 0, 2000, false, false), .6);
  close(playback.sample('trip', 41600, 0, 2000, false, false), .8);
});

test('a new beat key while paused discards prior beat exclusions and initializes from its own start', () => {
  const playback = new MechanismPlayback();
  close(playback.sample('old', 100, 0, 2000, true, false), .05);
  close(playback.sample('old', 5100, 0, 2000, false, false), .05);
  close(playback.sample('new', 5500, 5000, 2000, true, false), .25);
  close(playback.sample('new', 15500, 5000, 2000, true, false), .25);
  close(playback.sample('new', 25500, 5000, 2000, false, false), .25);
  close(playback.sample('new', 26000, 5000, 2000, false, false), .5);
});

test('paused speed and reduced-motion changes resolve from the same frozen effective time', () => {
  const playback = new MechanismPlayback();
  close(playback.sample('trip', 500, 0, 2000, true, false), .25);
  close(playback.sample('trip', 10500, 0, 1000, true, false), .5);
  assert.equal(playback.sample('trip', 20500, 0, 1000, true, true), 1);
  close(playback.sample('trip', 30500, 0, 2000, true, false), .25);
  close(playback.sample('trip', 40500, 0, 2000, false, false), .25);
  assert.equal(new MechanismPlayback().sample('reduced', 500, 0, 2000, true, true), 1);
});

test('both endpoints remain bounded when a paused mechanism joins before its start or after completion', () => {
  assert.equal(new MechanismPlayback().sample('early', 100, 200, 2000, true, false), 0);
  assert.equal(new MechanismPlayback().sample('complete', 3000, 0, 2000, true, false), 1);
  const playback = new MechanismPlayback();
  close(playback.sample('active', 1000, 0, 2000, true, false), .5);
  assert.equal(playback.sample('replacement', 1000, 1000, 2000, true, false), 0);
});
