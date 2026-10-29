import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, resolveTasks, applyGameAction } from '../src/engine/index.js';
import { projectChoice } from '../src/shared/choice-preview.js';
import { projectRoom } from '../src/shared/room-core.js';
import type { GameState, PendingChoice, Room } from '../src/shared/types.js';

function fixture(ids: string[], positions = ids.map((_, index) => 2 + index * 8)) {
  const players = ids.map((_, seat) => ({ id: `p${seat}`, name: `选手${seat + 1}`, seat, color: '#123', ready: true, connected: true, score: 3, hand: [], used: [], selection: [] }));
  const game = createGame(players, 123, 'multiplayer', 'mixed');
  game.phase = 'race'; game.round = 1; game.currentRacerId = 'r0';
  game.racers = ids.map((characterId, index) => ({ id: `r${index}`, playerId: `p${index}`, characterId, position: positions[index]!, tripped: false, finished: false, eliminated: false, flags: {} }));
  game.baseTurnOrder = game.racers.map(racer => racer.id);
  game.queue = [{ kind: 'beginTurn', racerId: 'r0' }]; resolveTasks(game);
  return game;
}
function roll(game: GameState, ...faces: number[]) { game.flags.testDice = faces; applyGameAction(game, 'p0', { type: 'roll' }); }
function choose(game: GameState, optionId: string) { const choice = game.pending!; applyGameAction(game, choice.playerId, { type: 'choose', choiceId: choice.id, optionId }); }
function projected(game: GameState) {
  assert(game.pending); const before = JSON.stringify(game);
  const result = projectChoice(game, game.pending);
  assert.equal(JSON.stringify(game), before, 'projecting a hint must not advance rules or randomness');
  assert.deepEqual(projectChoice(JSON.parse(before), JSON.parse(before).pending), result, 'refresh restores the same cue');
  return result;
}

test('Critic sees the current target die instead of the previous lastRoll, and the cue remains private', () => {
  const game = fixture(['banana', 'critic', 'critic'], [10, 2, 3]);
  game.lastRoll = { racerId: 'r2', face: 1, distance: 1 }; roll(game, 5, 2);
  assert.equal(game.pending?.kind, 'critic'); assert.deepEqual(projected(game).diceHint, { racerId: 'r0', faces: [5] });
  assert.deepEqual(projected(game).relatedRacerIds, ['r0', 'r1']);
  choose(game, 'use'); assert.equal(game.pending?.kind, 'critic');
  assert.deepEqual(projected(game).diceHint, { racerId: 'r0', faces: [2] });
  const room = { code: 'ABC234', hostId: 'p0', version: 1, createdAt: 1, updatedAt: 1, maxPlayers: 3, timeoutSeconds: 0, deadline: null, game, spectators: [{ id: 'viewer', name: '观众', connected: true }] } as Room;
  const options = { authorityId: 'p0', authorityOnline: true };
  for (const viewer of ['p0', 'p1', 'viewer']) assert.equal(projectRoom(room, viewer, options).pending, undefined);
  assert.deepEqual(projectRoom(room, 'p2', options).pending?.diceHint, { racerId: 'r0', faces: [2] });
  assert.equal(game.randomLog.length, 2);
});

test('Nemesis retains the triggering opponent face even after unrelated ability dice', () => {
  const game = fixture(['banana', 'nemesis', 'banana']); roll(game, 4);
  assert.equal(game.pending?.kind, 'nemesis');
  game.logs.push({ id: game.logs.at(-1)!.id + 1, type: 'ability-dice', source: 'r2', faces: [1], cause: 'the-hose', text: '另一技能骰' });
  assert.deepEqual(projected(game).diceHint, { racerId: 'r0', faces: [4] });
});

test('Fox sees the six being rerolled, but no stale die before a new Stunner or batch throw', () => {
  const game = fixture(['banana', 'party-pooper', 'extra-mile-mr-fox']); roll(game, 6);
  assert.equal(game.pending?.kind, 'em-fox'); assert.deepEqual(projected(game).diceHint, { racerId: 'r0', faces: [6] });
  assert.deepEqual(projected(game).relatedRacerIds, ['r1', 'r0', 'r2']);
  for (const ids of [['banana', 'stunner', 'extra-mile-mr-fox'], ['leaf-philanthropist', 'banana', 'extra-mile-mr-fox']]) {
    const beforeThrow = fixture(ids, [1, 2, 25]); beforeThrow.lastRoll = { racerId: 'r2', face: 6, distance: 6 }; roll(beforeThrow, 5);
    assert.equal(beforeThrow.pending?.kind, 'em-fox'); assert.equal(beforeThrow.randomLog.length, 0);
    assert.equal(projected(beforeThrow).diceHint, undefined);
  }
});

test('Fox and Suckerfish see the raw die while Triangle Man interrupts an unfinished throw', () => {
  const fox = fixture(['banana', 'leaf-triangle-man', 'extra-mile-mr-fox']); roll(fox, 3);
  assert.equal(fox.pending?.kind, 'em-fox'); assert.deepEqual(projected(fox).diceHint, { racerId: 'r0', faces: [3] });
  const fish = fixture(['banana', 'leaf-triangle-man', 'suckerfish'], [2, 10, 10]); roll(fish, 3);
  assert.equal(fish.pending?.kind, 'suckerfish'); assert.deepEqual(projected(fish).diceHint, { racerId: 'r0', faces: [3] });
  assert.equal(fish.lastRoll, undefined); assert.equal(fish.randomLog.length, 1);
});

test('paid event rerolls and Heads use the held current die, and public multi-dice keep every face', () => {
  const paid = fixture(['banana', 'banana', 'banana']); paid.flags.thirds = { id: 'sisyphus', round: 1, held: {}, extraCards: [] }; roll(paid, 5);
  assert.equal(paid.pending?.kind, 'thirds-pay'); assert.deepEqual(projected(paid).diceHint, { racerId: 'r0', faces: [5] });
  const heads = fixture(['extra-mile-heads', 'banana', 'banana']); roll(heads, 2);
  assert.equal(heads.pending?.kind, 'em-heads'); assert.deepEqual(projected(heads).diceHint, { racerId: 'r0', faces: [2] });
  const gift = fixture(['leaf-philanthropist', 'banana', 'banana']); roll(gift, 5, 2);
  assert.deepEqual(projected(gift).diceHint, { racerId: 'r0', faces: [5, 2] });
  choose(gift, '0'); assert.deepEqual(projected(gift).diceHint, { racerId: 'r0', faces: [5, 2] });
});

test('secret guesses, unrevealed contest dice and unrelated choices never gain a dice cue', () => {
  const game = fixture(['banana', 'banana', 'banana']);
  game.logs.push({ id: 100, type: 'die', source: 'r0', faces: [4], text: '公开主骰' });
  for (const kind of ['duel-roll', 'em-cletus-roll', 'cheatah-guess', 'thirds-guess', 'egg', 'hypnotist', 'genius']) {
    const choice: PendingChoice = { id: 'choice', playerId: 'p1', racerId: 'r1', title: '选择', kind, optional: false, options: [], context: { firstFace: 6, secret: 5 } };
    const result = projectChoice(game, choice);
    assert.equal(result.diceHint, undefined); assert(!('context' in result));
  }
  const held = { kind: 'rollBatch', purpose: 'duel', racerId: 'r0', heldFace: 6, dieEventId: 100 };
  for (const kind of ['thirds-pay', 'em-fox']) assert.equal(projectChoice(game, { id: 'choice', playerId: 'p1', title: '选择', kind, optional: false, options: [], context: { task: held } }).diceHint, undefined);
  game.logs.push({ id: 101, type: 'turn', source: 'r1', text: '新回合' });
  assert.equal(projectChoice(game, { id: 'choice', playerId: 'p1', title: '选择', kind: 'em-fox', optional: false, options: [], context: { task: { kind: 'activate' } } }).diceHint, undefined);
});
