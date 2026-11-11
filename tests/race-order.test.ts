import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RaceOrder } from '../src/client/RaceOrder.js';
import type { RoomView } from '../src/shared/types.js';

const fixture = (): RoomView => ({
  code: 'POINTS', version: 1, hostId: 'p0', selfId: 'p0', maxPlayers: 2,
  timeoutSeconds: 0, deadline: null, phase: 'race', round: 2, track: 'mild', rulesStatus: '',
  players: [0, 1].map(i => ({ id: `p${i}`, name: `玩家${i}`, seat: i, color: '#315961', score: i ? 7 : 0, connected: true, ready: true, handCount: 0, used: [], selected: true })),
  racers: ['egg', 'hare', 'coach', 'legs'].map((characterId, i) => ({ id: `r${i}`, playerId: `p${Math.floor(i / 2)}`, characterId, position: 20 - i, tripped: false, finished: false, eliminated: false, flags: {} })),
  // Deliberately different from current totals, which include skill/event scores.
  results: [{ round: 1, placements: [{ racerId: 'old', playerId: 'p0', characterId: 'banana', rank: 1, points: 5 }] }], logs: [],
});
const render = (room: RoomView, racers = room.racers) => renderToStaticMarkup(createElement(RaceOrder, { room, racers, order: ['r2', 'r0', 'r3', 'r1'], activeId: 'r0', onDetail() {} }));
const totals = (html: string) => [...html.matchAll(/<span>(-?\d+)<small>分<\/small><\/span>/g)].map(match => Number(match[1]));

test('zero, bonuses and deductions always read public player totals, shared by both racers', () => {
  const room = fixture();
  assert.deepEqual(totals(render(room)), [7, 0, 7, 0]);
  room.players[0]!.score = 9;
  assert.deepEqual(totals(render(room)), [7, 9, 7, 9]);
  room.players[0]!.score = -2;
  assert.deepEqual(totals(render(room)), [7, -2, 7, -2]);
});

test('confirmed controllers win over stale playback ownership and original identity', () => {
  const room = fixture(), before = structuredClone(room.racers);
  room.racers[0]!.identityPlayerId = 'p0';
  room.racers[0]!.playerId = 'p1';
  room.racers[2]!.playerId = 'p0';
  const html = render(room, before);
  assert.deepEqual(totals(html), [0, 7, 7, 0]);
  assert.match(html, /蛋，基础顺序2，2号玩家1，累计7分/);
  assert.match(html, /data-racer-id="r0"/);
});

test('finishing, elimination, spectating and the next race retain totals and order', () => {
  const room = fixture();
  room.racers[0]!.finished = true; room.racers[0]!.rank = 1;
  room.racers[1]!.eliminated = true; room.racers[2]!.tripped = true;
  room.selfId = 'spectator'; room.role = 'spectator';
  const html = render(room);
  assert.deepEqual(totals(html), [7, 0, 7, 0]);
  assert.match(html, /累计0分，第1名/); assert.match(html, /累计0分，出局/);
  assert.match(html, /累计7分，绊倒/); assert.doesNotMatch(html, /is-self|\d+格/);
  assert.deepEqual([...html.matchAll(/data-racer-id="([^"]+)"/g)].map(match => match[1]), ['r2', 'r0', 'r3', 'r1']);
  room.round++; room.racers.forEach(racer => { racer.position = 0; racer.finished = racer.eliminated = false; });
  assert.deepEqual(totals(render(room)), [7, 0, 7, 0]);
});
