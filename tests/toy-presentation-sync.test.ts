import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AnimationMixer, Bone, LoopOnce, LoopRepeat, SkinnedMesh, Vector3, type AnimationClip, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { PresentationClock } from '../src/client/presentation-clock.js';
import { punchWindRoute } from '../src/client/scene/environment/force-presentation.js';
import { cloneToyModel } from '../src/client/scene/toy-model-instance.js';
import { ToyPresentationPlayback, toyPresentationProgress, type ToyAnimation, type ToyPresentation } from '../src/client/scene/toy-presentation.js';

const assets = new Map<string, Promise<Awaited<ReturnType<GLTFLoader['parseAsync']>>>>();
function load(path: string) {
  if (!assets.has(path)) {
    const bytes = readFileSync(new URL(`../public/models/${path}.glb`, import.meta.url));
    assets.set(path, new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), ''));
  }
  return assets.get(path)!;
}
async function rig(path: string, id: string, animation: ToyAnimation) {
  const asset = await load(path), source = asset.scene.getObjectByName(`toy_${id}`)!;
  assert(source, `${path}: authored character exists`);
  const clip = asset.animations.find(clip => clip.name === `${id}-${animation}`) ?? asset.animations.find(clip => clip.name === animation);
  assert(clip && clip.duration > 0, `${path}: authored ${animation} clip exists`);
  const model = cloneToyModel(source, true), mixer = new AnimationMixer(model);
  return { source, model, mixer, clip, playback: new ToyPresentationPlayback(mixer, clip, animation) };
}
function pose(model: Object3D) {
  model.updateWorldMatrix(true, true);
  const result: number[] = [], point = new Vector3();
  model.traverse(node => {
    if (node instanceof Bone) result.push(...node.position.toArray(), ...node.quaternion.toArray(), ...node.scale.toArray());
    if (node instanceof SkinnedMesh) {
      node.skeleton.update();
      const count = node.geometry.attributes.position!.count;
      for (const index of [0, Math.floor(count / 3), Math.floor(count * 2 / 3), count - 1]) result.push(...node.getVertexPosition(index, point).applyMatrix4(node.matrixWorld).toArray());
    }
  });
  assert(result.length, 'verify evaluated bones and skinned vertices, not just mixer metadata');
  return result;
}
const close = (actual: number, expected: number) => assert(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
function samePose(actual: number[], expected: number[]) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => close(value, expected[index]!));
}
function referencePose(source: Object3D, clip: AnimationClip, progress: number) {
  const model = cloneToyModel(source, true), mixer = new AnimationMixer(model), action = mixer.clipAction(clip);
  action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play(); mixer.update(clip.duration * progress);
  const result = pose(model); mixer.stopAllAction(); mixer.uncacheRoot(model);
  return result;
}
const shippingActors = [
  ['toy-racers', 'coach'], ['toy-racers-economy', 'coach'],
  ['banana/banana', 'banana'], ['banana/banana-economy', 'banana'],
  ['wurstii/wurstii-magikarp', 'wurstii-magikarp'],
  ['leaf/leaf-triangle-man', 'leaf-triangle-man'],
  ['second-wind/hog-knight', 'hog-knight'], ['second-wind/hog-knight-hog', 'hog-knight-hog'],
  ['second-wind/bite-mark-were', 'bite-mark-were'],
] as const;

for (const [path, id] of shippingActors) test(`${path}: real skill bones use shared absolute phase, including fast playback and seeking after completion`, async () => {
  const { source, model, mixer, clip, playback } = await rig(path, id, 'skill');
  let now = 0;
  for (const durationMs of [4000, 2000, 1000]) {
    const presentation: ToyPresentation = { key: `${id}:${durationMs}`, clock: { now: () => now }, startedAt: 100, durationMs };
    for (const progress of [0, .2, .5, .8, 1, .5, 0]) {
      now = presentation.startedAt + durationMs * progress;
      close(playback.sample(presentation), progress);
      samePose(pose(model), referencePose(source, clip, progress));
      const previous = pose(model); playback.sample(presentation); samePose(pose(model), previous);
    }
    now = presentation.startedAt + durationMs * .8;
    playback.sample(presentation);
    assert.notDeepEqual(pose(model), referencePose(source, clip, 1), 'the old beat endpoint must not finish the slower skill early');
  }
  playback.dispose(); mixer.uncacheRoot(model);
});

test('real move clip waits for punch route launch, follows route cycles and holds still through rig return', async () => {
  const { model, mixer, clip, playback } = await rig('banana/banana', 'banana', 'move');
  let now = 0;
  const presentation: ToyPresentation = { key: 'punch', clock: { now: () => now }, startedAt: 0, durationMs: 2000, movementProgress: punchWindRoute, movementCycles: 3 };
  playback.sample(presentation);
  const parked = pose(model);
  for (const progress of [.1, .22, .4, .48]) {
    now = presentation.durationMs * progress;
    assert.equal(playback.sample(presentation), 0);
    samePose(pose(model), parked);
  }
  now = 2000 * .64;
  const route = punchWindRoute(.64);
  close(playback.sample(presentation), route);
  close(mixer.clipAction(clip).time, route * clip.duration * 3 % clip.duration);
  assert.notDeepEqual(pose(model), parked, 'actual moving bones start only after the launch');
  now = 2000 * .92; playback.sample(presentation);
  const arrived = pose(model);
  for (const progress of [.96, 1, 1.3]) { now = 2000 * progress; playback.sample(presentation); samePose(pose(model), arrived); }
  // A speed change or backwards seek reconstructs the correct pose, rather than
  // retaining a previous repeat counter or accumulating another wall-clock step.
  now = 1000 * .64;
  playback.sample({ ...presentation, durationMs: 1000 });
  close(mixer.clipAction(clip).time, route * clip.duration * 3 % clip.duration);
  playback.dispose(); mixer.uncacheRoot(model);
});

test('pause, quality remount, repeated skill keys, transformed forms and mount all share the current phase', async () => {
  let now = 0;
  const clock = new PresentationClock(() => now);
  let presentation: ToyPresentation = { key: 'first-score', clock, startedAt: 0, durationMs: 2000 };
  const high = await rig('banana/banana', 'banana', 'skill');
  now = 800; high.playback.sample(presentation);
  const before = pose(high.model);
  clock.setPaused(true); now += 60000; high.playback.sample(presentation); samePose(pose(high.model), before);
  const economy = await rig('banana/banana-economy', 'banana', 'skill');
  const rider = await rig('second-wind/hog-knight', 'hog-knight', 'skill');
  const mount = await rig('second-wind/hog-knight-hog', 'hog-knight-hog', 'skill');
  const transformed = await rig('second-wind/bite-mark-were', 'bite-mark-were', 'skill');
  for (const current of [economy, rider, mount, transformed]) {
    close(current.playback.sample(presentation), .4);
    close(current.mixer.clipAction(current.clip).time / current.clip.duration, .4);
    samePose(pose(current.model), referencePose(current.source, current.clip, .4));
  }
  clock.setPaused(false); now += 1200;
  for (const current of [high, economy, rider, mount, transformed]) { current.playback.sample(presentation); close(current.mixer.clipAction(current.clip).time, current.clip.duration); }
  presentation = { ...presentation, key: 'second-score', startedAt: clock.now() };
  high.playback.dispose();
  const repeated = new ToyPresentationPlayback(high.mixer, high.clip, 'skill');
  repeated.sample(presentation); samePose(pose(high.model), referencePose(high.source, high.clip, 0));
  now += 1000; repeated.sample(presentation); samePose(pose(high.model), referencePose(high.source, high.clip, .5));
  repeated.dispose();
  for (const current of [economy, rider, mount, transformed]) current.playback.dispose();
  for (const current of [high, economy, rider, mount, transformed]) current.mixer.uncacheRoot(current.model);
});

test('ordinary local clip playback is unchanged and remains independent of the optional mechanism timeline', async () => {
  const { source, clip, playback } = await rig('banana/banana', 'banana', 'move'); playback.dispose();
  const model = cloneToyModel(source, true), mixer = new AnimationMixer(model), action = mixer.clipAction(clip);
  action.setLoop(LoopRepeat, Infinity).play(); mixer.update(.1); close(action.time, .1);
  const sourceCode = readFileSync(new URL('../src/client/scene/MechanismToyCharacter.tsx', import.meta.url), 'utf8');
  assert.match(sourceCode, /if \(presentationRef\.current\) \{ synchronized\.current\?\.sample\(presentationRef\.current\); return; \}/);
  assert.match(sourceCode, /if \(!paused && mixer && animations\.length\) mixer\.update\(Math\.min\(delta, \.1\)\)/);
  assert.match(sourceCode, /\[mixer, animations, animation, characterId, presentation\?\.key\]/, 'same-kind new beats restart, object recreation does not');
  const sculptures = sourceCode.split('\n').filter(line => line.includes('<Sculpture ') || line.includes('<CharacterAsset '));
  assert.equal(sculptures.length, 3);
  assert(sculptures.every(line => line.includes('presentation={presentation}')), 'main sculpture, mount and asset all receive the same timeline');
  mixer.stopAllAction(); mixer.uncacheRoot(model);
});

test('normal and delayed movement phases are bounded independently of frame cadence', () => {
  let now = -100;
  const presentation: ToyPresentation = { key: 'bounds', clock: { now: () => now }, startedAt: 0, durationMs: 2000, movementProgress: punchWindRoute };
  assert.equal(toyPresentationProgress(presentation, 'skill'), 0);
  now = 1000;
  close(toyPresentationProgress(presentation, 'skill'), .5);
  close(toyPresentationProgress(presentation, 'move'), punchWindRoute(.5));
  now = 100000;
  assert.equal(toyPresentationProgress(presentation, 'skill'), 1);
  assert.equal(toyPresentationProgress(presentation, 'move'), 1);
});
