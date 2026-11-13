import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterPresentationPaint } from '../src/client/presentation-completion.js';
import { PresentationClock } from '../src/client/presentation-clock.js';
import { beatCompletionTime, beatDuration, completeBeat, createPlayback, isMechanismBeat, receiveRoom, skipPlayback } from '../src/client/presentation.js';
import { MechanismPlayback } from '../src/client/scene/mechanisms/playback.js';
import type { GameEvent, Racer, RoomView } from '../src/shared/types.js';

const racer = (id = 'a'): Racer => ({ id, playerId: id, characterId: 'banana', position: 5, tripped: false, finished: false, eliminated: false, flags: {} });
const room = (version = 1, logs: GameEvent[] = [], racers = [racer()]): RoomView => ({ code: 'SYNC', version, hostId: 'a', selfId: 'a', maxPlayers: 8, timeoutSeconds: 0, deadline: null, phase: 'race', round: 1, track: 'wild', players: [], racers, currentRacerId: version === 1 ? 'a' : 'next', logs, results: [], rulesStatus: 'test' });
const movement = (id: number, cause?: string, steps = 1): GameEvent => ({ id, type: 'move', source: 'a', targets: ['a'], before: [5], after: [5 + steps], text: '确认移动', ...(cause ? { cause } : {}) });
const mechanismEvents: [string, GameEvent][] = [
  ['trip', { id: 1, type: 'trip', source: 'track', targets: ['a'], text: '赛道绊倒' }],
  ['punch', movement(1, 'track-arrow')],
  ['long punch', movement(1, 'track-arrow', 10)],
  ['gain', { id: 1, type: 'score', source: 'a', cause: 'track-star', scoreDelta: 1, text: '+1分' }],
  ['loss', { id: 1, type: 'score', source: 'a', cause: 'track-star', scoreDelta: -1, text: '-1分' }],
  ['legacy star', { id: 1, type: 'score', source: 'a', scoreDelta: 1, text: '+1分（赛道星格）' }],
  ['warp', { id: 1, type: 'warp', source: 'a', cause: 'track-whirl', targets: ['a'], before: [5], after: [12], text: '赛道传送' }],
];
const queued = (events: GameEvent[]) => receiveRoom(createPlayback(room()), room(2, events));
const singleBeat = (event: GameEvent) => queued([event]).queue[0]!;
const speeds = [.5, 1, 2, 4, 8];
const reducedMs = { trip: 500, move: 400, score: 500, warp: 450 };
const close = (actual: number, expected: number) => assert(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('all fixed mechanism categories slow the shared duration by 25%, preserving fast floors and reduced motion', () => {
  for (const [name, event] of mechanismEvents) {
    const beat = singleBeat(event), natural = name === 'long punch' ? 2200 : 1600;
    assert(isMechanismBeat(beat), name);
    assert.equal(beat.naturalDurationMs, natural, `${name}: queue basis is unchanged`);
    assert.equal(beat.durationMs, natural, `${name}: only resolved playback duration changes`);
    for (const speed of speeds) {
      assert.equal(beatDuration(beat, { speed }), Math.max(1000, Math.round(natural * 1.25 / speed)), `${name} at ${speed}x`);
      assert.equal(beatDuration(beat, { speed, reducedMotion: true }), Math.round(reducedMs[beat.kind as keyof typeof reducedMs] / speed), `${name}: reduced mode at ${speed}x`);
    }
  }
});

test('non-mechanism movement, skill, trip, score, warp, dice and recovery keep their existing duration', () => {
  const cases: [GameEvent, number][] = [
    [movement(1), 800],
    [{ id: 1, type: 'power', source: 'a', text: '普通技能' }, 1800],
    [{ id: 1, type: 'trip', source: 'a', targets: ['a'], text: '角色绊倒' }, 850],
    [{ id: 1, type: 'score', source: 'a', text: '+1分', scoreDelta: 1 }, 850],
    [{ id: 1, type: 'warp', source: 'a', targets: ['a'], before: [5], after: [12], text: '角色传送' }, 1100],
    [{ id: 1, type: 'die', source: 'a', faces: [3], text: '掷出3' }, 2500],
    [{ id: 1, type: 'recover', source: 'a', targets: ['a'], text: '起身' }, 850],
  ];
  for (const [event, natural] of cases) {
    const beat = singleBeat(event);
    assert.equal(isMechanismBeat(beat), false);
    for (const speed of speeds) {
      const floor = beat.kind === 'skill' ? 1500 : beat.kind === 'dice' ? 1000 : 0;
      assert.equal(beatDuration(beat, { speed }), Math.max(floor, Math.round(natural / speed)), `${event.type} at ${speed}x`);
    }
  }
});

function queueNearThreshold(threshold: 12000 | 24000, above: boolean) {
  const events: GameEvent[] = [{ ...mechanismEvents[0]![1], id: 1 }];
  const add = (event: Omit<GameEvent, 'id'>) => events.push({ ...event, id: events.length + 1 });
  for (let i = 0; i < (threshold === 12000 ? 3 : 12); i++) add({ type: 'power', source: 'a', text: '普通技能' });
  if (threshold === 12000) for (let i = 0; i < 3; i++) add({ type: 'score', source: 'a', text: '+1分' });
  for (let i = 0; i < (threshold === 12000 ? 3 : 1); i++) events.push(movement(events.length + 1));
  if (above) add({ type: 'score', source: 'a', text: '+1分' });
  return queued(events);
}

test('slower visible mechanics do not cross queue compression thresholds or retime unrelated beats', () => {
  for (const threshold of [12000, 24000] as const) for (const above of [false, true]) {
    const state = queueNearThreshold(threshold, above), natural = state.queue.reduce((total, beat) => total + beat.naturalDurationMs!, 0);
    assert.equal(natural, threshold === 12000 ? above ? 12800 : 11950 : above ? 24850 : 24000);
    const pace = natural > 24000 ? .7 : natural > 12000 ? .85 : 1;
    for (const beat of state.queue) {
      const minimum = beat.kind === 'skill' ? 1500 : beat.kind === 'move' ? 700 : 650;
      const expected = Math.max(minimum, Math.round(beat.naturalDurationMs! * pace));
      assert.equal(beat.durationMs, expected, `queue duration at ${natural}ms`);
      assert.equal(beatDuration(beat), isMechanismBeat(beat) ? Math.max(1000, Math.round(expected * 1.25)) : expected);
    }
    const durations = state.queue.map(beat => [beat.naturalDurationMs, beat.durationMs, beatDuration(beat)]), active = state.queue[0];
    const updated = receiveRoom(state, { ...state.confirmed, version: 3, logs: [...state.confirmed.logs, { id: state.eventCursor + 1, type: 'power', source: 'a', text: '后续技能' }] });
    assert.equal(updated.queue[0], active, 'an arriving snapshot must not restart or retime an active mechanism');
    assert.deepEqual([active!.naturalDurationMs, active!.durationMs, beatDuration(active!)], durations[0]);
    assert.deepEqual(state.queue.map(beat => [beat.naturalDurationMs, beat.durationMs, beatDuration(beat)]), durations, 'resolving duration never mutates the queued basis');
  }
});

test('model, pawn/FX progress and completion share the slower clock for every mechanism and speed', () => {
  for (const [name, event] of mechanismEvents) for (const speed of speeds) for (const reducedMotion of [false, true]) {
    const beat = singleBeat(event), duration = beatDuration(beat, { speed, reducedMotion }), startedAt = 300;
    const model = new MechanismPlayback(), fx = new MechanismPlayback();
    for (const fraction of [0, .2, .5, .8, .99, 1]) {
      const now = startedAt + duration * fraction;
      // Board3D's pawn and minimap sample this same normalized presentation time.
      const pawn = reducedMotion ? 1 : Math.max(0, Math.min(1, (now - startedAt) / Math.max(1, duration)));
      close(model.sample(beat.key, now, startedAt, duration, false, reducedMotion), pawn);
      close(fx.sample(beat.key, now, startedAt, duration, false, reducedMotion), pawn);
      assert.equal(now >= beatCompletionTime(beat, startedAt, duration)!, fraction === 1, `${name} ${speed}x reduced=${reducedMotion} completion at ${fraction}`);
    }
    if (!reducedMotion && speed === 1) {
      const oldEnd = startedAt + beat.durationMs;
      assert(oldEnd < beatCompletionTime(beat, startedAt, duration)!, 'the old endpoint cannot release the next turn while the slower rig is still active');
      close(model.sample(beat.key, oldEnd, startedAt, duration, false, false), .8);
    }
  }
});

test('the runtime passes the resolved shared duration to mechanics, cues, pawn and terminal completion', () => {
  const board = readFileSync(new URL('../src/client/scene/Board3D.tsx', import.meta.url), 'utf8');
  for (const tag of ['FullCoverageMechanismLayer', 'EnvironmentEventCues', 'Pawn', 'RaceEffects', 'Minimap']) {
    const line = board.split('\n').find(line => line.includes(`<${tag} `));
    assert(line?.includes('durationMs'), `${tag} must receive the shared resolved duration, not a model-only multiplier`);
  }
  const hook = readFileSync(new URL('../src/client/usePresentation.ts', import.meta.url), 'utf8');
  assert.match(hook, /const durationMs = beat \? beatDuration\(beat, options\)/);
  assert.match(hook, /beatCompletionTime\(beat,startedAt,durationMs,diceSettledAt\)/);
  assert.match(hook, /afterPresentationPaint\(/);
});

test('pause freezes the slowed rig and FX together and resume preserves their phase without consuming the remaining handoff', () => {
  let realNow = 0;
  const clock = new PresentationClock(() => realNow), model = new MechanismPlayback(), fx = new MechanismPlayback();
  const beat = singleBeat(mechanismEvents[0]![1]), duration = beatDuration(beat);
  const sample = () => [model, fx].map(consumer => consumer.sample(beat.key, clock.now(), 0, duration, clock.paused, false));
  realNow = duration * .45;
  const before = sample();
  clock.setPaused(true); sample();
  realNow += 60000;
  assert.deepEqual(sample(), before);
  assert(clock.now() < beatCompletionTime(beat, 0, duration)!);
  clock.setPaused(false);
  assert.deepEqual(sample(), before);
  realNow += duration * .25;
  sample().forEach(value => close(value, .7));
  realNow += duration * .3;
  sample().forEach(value => close(value, 1));
  assert.equal(clock.now(), beatCompletionTime(beat, 0, duration));
});

function frames() {
  let serial = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  return { request: (fn: FrameRequestCallback) => { callbacks.set(++serial, fn); return serial; }, cancel: (id: number) => { callbacks.delete(id); }, paint: () => { const batch = [...callbacks.values()]; callbacks.clear(); batch.forEach(fn => fn(0)); } };
}

function tripThenMove() {
  const initial = room(), final = room(2, [mechanismEvents[0]![1], movement(2)], [{ ...racer(), position: 6, tripped: true }]);
  return { state: receiveRoom(createPlayback(initial), final), final };
}

test('the slower terminal frame is painted before handing off to the next movement', () => {
  let { state } = tripThenMove();
  const beat = state.queue[0]!, duration = beatDuration(beat), raf = frames();
  assert.equal(new MechanismPlayback().sample(beat.key, duration, 0, duration, false, false), 1);
  afterPresentationPaint(() => { state = completeBeat(state); }, raf.request, raf.cancel);
  assert.equal(state.queue[0], beat);
  raf.paint(); assert.equal(state.queue[0], beat, 'terminal rig return and pawn pose still own the paint');
  raf.paint(); assert.equal(state.queue[0]?.kind, 'move');
  assert.equal(state.racers[0]!.tripped, true);
  assert.equal(state.racers[0]!.position, 5, 'the following move may only begin after the terminal paint');
});

test('skip and reconnect cancel a pending handoff and restore confirmed endpoints without replaying slow motion', () => {
  for (const interruption of ['skip', 'reconnect'] as const) for (const framesBeforeCancel of [0, 1]) {
    let { state, final } = tripThenMove();
    const before = JSON.stringify(final), raf = frames();
    let staleCompletions = 0;
    const cancel = afterPresentationPaint(() => { staleCompletions++; state = completeBeat(state); }, raf.request, raf.cancel);
    if (framesBeforeCancel) raf.paint();
    cancel();
    state = interruption === 'skip' ? skipPlayback(state, final) : receiveRoom(state, final, { reconnect: true });
    raf.paint(); raf.paint();
    assert.equal(staleCompletions, 0);
    assert.equal(state.queue.length, 0);
    assert.deepEqual(state.racers, final.racers);
    assert.equal(JSON.stringify(final), before, 'visual interruptions never mutate the authoritative state');
  }
});
