import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, resolveTasks, applyGameAction } from '../src/engine/index.js';
import { projectChoice } from '../src/shared/choice-preview.js';
import { projectRoom } from '../src/shared/room-core.js';
import type { Player, Room } from '../src/shared/types.js';

function fixture(): Room {
  const players: Player[] = ['甲', '乙'].map((name, seat) => ({ id: `p${seat}`, name, seat, color: '#000', ready: true, connected: true, score: 0, hand: [], used: [], selection: [] }));
  const game = createGame(players, 73, 'multiplayer', 'mixed');
  game.phase = 'race'; game.round = 1; game.currentRacerId = 'r0';
  game.racers = ['coach', 'legs', 'blimp', 'banana'].map((characterId, i) => ({ id: `r${i}`, playerId: `p${Math.floor(i / 2)}`, characterId, position: i * 4, tripped: false, finished: false, eliminated: false, flags: {} }));
  game.baseTurnOrder = game.racers.map(racer => racer.id);
  return { code: 'ABC234', hostId: 'p0', version: 1, createdAt: 1, updatedAt: 1, maxPlayers: 2, timeoutSeconds: 0, deadline: null, game, spectators: [{ id: 'spectator', name: '观众', connected: true }] };
}

test('card and racer choices carry explicit hints while numeric and skip choices remain plain', () => {
  const { game } = fixture();
  const choice = { id: 'choice', playerId: 'p0', title: '选择', optional: true, kind: 'target', context: { secret: 'NEVER_PROJECT' }, options: [{ id: 'genius', label: '天才' }, { id: 'r1', label: '大长腿' }, { id: 'skip', label: '放弃' }, { id: '4', label: '4' }] };
  const before = JSON.stringify(choice), projected = projectChoice(game, choice);
  assert.deepEqual(projected.options, [{ id: 'genius', label: '天才', characterId: 'genius' }, { id: 'r1', label: '大长腿', characterId: 'legs', racerId: 'r1' }, { id: 'skip', label: '放弃' }, { id: '4', label: '4' }]);
  assert.equal(JSON.stringify(choice), before);
  assert(!JSON.stringify(projected).includes('NEVER_PROJECT'));
});

test('Swap Meet exposes only the current offer and target hints, including after restore and private commitment', () => {
  const room = fixture(), game = room.game;
  game.flags.twist = { triggered: true, deck: [], drawn: ['swap-meet'], swap: [{ playerId: 'p0', cardId: 'sisyphus', decided: false }, { playerId: 'p1', cardId: 'hypnotist', decided: false }] };
  game.queue = [{ kind: 'twist', step: 'swap-prompt' }]; resolveTasks(game);
  assert.equal(game.pending?.kind, 'twist-swap');
  const view = (id: string, value = room) => projectRoom(value, id, { authorityId: 'p0', authorityOnline: true });
  const before = JSON.stringify(game), owner = view('p0');
  assert.equal(owner.pending?.offeredCharacterId, 'sisyphus');
  assert.deepEqual(owner.pending?.options.map(option => [option.id, option.characterId, option.racerId]), [['keep', undefined, undefined], ['swap:r0', 'coach', 'r0'], ['swap:r1', 'legs', 'r1']]);
  for (const viewer of ['p0', 'p1', 'spectator']) {
    const result = view(viewer); assert(!JSON.stringify(result).includes('hypnotist'));
    if (viewer !== 'p0') { assert.equal(result.pending, undefined); assert(!JSON.stringify(result).includes('sisyphus')); }
  }
  assert.equal(JSON.stringify(game), before);
  assert.deepEqual(view('p0', JSON.parse(JSON.stringify(room))).pending, owner.pending);
  applyGameAction(game, 'p0', { type: 'choose', choiceId: game.pending!.id, optionId: 'swap:r1' });
  assert.equal(game.racers[1]!.characterId, 'legs', 'the committed replacement stays hidden until all players answer');
  assert.equal(view('p1').pending?.offeredCharacterId, 'hypnotist');
  assert.equal(view('p0').pending, undefined);
});

test('Twin previews the actual copied champion power, including repeated historical character IDs', () => {
  const { game } = fixture();
  const choice = { id: 'twin-choice', playerId: 'p0', title: '选择冠军', optional: true, kind: 'twin', context: { champions: { 'egg:race:1:old': { characterId: 'egg', power: 'genius' }, egg: { characterId: 'egg', power: 'legs' } }, secret: ['hypnotist'] }, options: [{ id: 'egg:race:1:old', label: '蛋（第1场：天才）' }, { id: 'egg', label: '蛋' }, { id: 'skip', label: '不复制' }] };
  const projected = projectChoice(game, choice);
  assert.deepEqual(projected.options.map(option => option.characterId), ['genius', 'legs', undefined]);
  assert(!JSON.stringify(projected).includes('hypnotist'));
});
