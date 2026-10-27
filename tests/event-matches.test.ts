import { THIRD_EVENTS } from '../src/shared/special-events.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createGame } from '../src/engine/index.js';
import { decideAI } from '../src/engine/ai.js';
import { roomRules, systemRoomAction } from '../src/engine/runtime.js';
import { presetCompetition, type RaceCount } from '../src/shared/competition.js';
import { legacyRoomConfig, racersPerPlayer, validateRoomConfigForPlayers } from '../src/shared/room-config.js';
import { projectRoom } from '../src/shared/room-core.js';
import type { GameAction, GameState, Player, Room, ScoreBreakdown } from '../src/shared/types.js';

const players = (count: number): Player[] => Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `选手${i + 1}`, seat: i, color: '#315961', isAI: true, ready: true, connected: true, score: 0, hand: [], used: [], selection: [] }));

function configuration(rounds: RaceCount, count: number) {
  const config = legacyRoomConfig();
  config.characterPacks = { original: true, 'second-wind': true, 'extra-mile': true, 'leaf-fan': true, wurstii: true };
  config.competition = { ...presetCompetition(), preset: 'custom', raceCount: rounds, rotation: ['squiggle', 'boardwalks', 'bridges', 'twisty-twirl'], thrillingThirds:{enabled:true,rounds:Array.from({length:rounds},(_,i)=>i+1)} };
  return validateRoomConfigForPlayers(config, count);
}

function publicAction(room: Room): { playerId: string; action: GameAction } | undefined {
  const state = room.game, system = systemRoomAction(state);
  if (system) return system;
  const playerId = state.pending?.playerId ?? (state.phase === 'draft' ? state.draft!.order[state.draft!.cursor] : state.phase === 'selection' ? state.players.find(player => !player.selection.length)?.id : state.phase === 'results' ? room.hostId : state.racers.find(racer => racer.id === state.currentRacerId)?.playerId);
  if (!playerId) return;
  const action = decideAI(projectRoom(room, playerId, { authorityId: room.hostId, authorityOnline: true }));
  return action ? { playerId, action } : undefined;
}

function ledgerBalances(state: GameState) {
  if (!state.scoreLedger) return;
  const initial = state.flags.roundStartScores as Record<string, number>;
  for (const player of state.players) {
    const entry: ScoreBreakdown | undefined = state.scoreLedger.find(score => score.playerId === player.id);
    assert(entry, `missing ledger for ${player.id}`);
    assert.equal(entry.total, entry.placement + entry.map + entry.skill + entry.event);
    assert.equal(entry.total, player.score - initial[player.id]!, `round ${state.round}, ${player.id}: ledger and actual score diverged`);
  }
  if (state.results.at(-1)?.round === state.round) assert.deepEqual(state.results.at(-1)!.scores, state.scoreLedger);
}

for (const rounds of [4, 6, 8] as const) for (const [count,mode] of [[2,'double'],[3,'single'],[3,'double'],[8,'single']] as const) test(`all packs with events: ${count} players ${mode} finish ${rounds} races with public AI, restored rounds and balanced scores`, () => {
  const seed = 61700 + count * 100 + rounds, cardsPerRace = racersPerPlayer(count,{threePlayerMode:mode});
  const room: Room = { code: 'MAP234', hostId: 'p0', createdAt: 1, updatedAt: 1, version: 1, maxPlayers: count, timeoutSeconds: 0, deadline: null, game: createGame(players(count), seed) };
  room.game.config = validateRoomConfigForPlayers({...configuration(rounds, count),threePlayerMode:mode},count);
  roomRules(room.game).startGame(room.game);
  room.game.flags.thirdsDeck=Object.keys(THIRD_EVENTS).slice(((count-2)*8+rounds)%30).concat(Object.keys(THIRD_EVENTS));
  const plan = structuredClone(room.game.matchPlan), restored = new Set<number>();
  let drafted = false, steps = 0, lastAction: ReturnType<typeof publicAction>;
  try {
    while (room.game.phase !== 'finished') {
      const state = room.game;
      assert(++steps < 15000, `seed ${seed}: stalled at ${state.phase}/${state.round}/${state.pending?.kind}`);
      assert.notEqual(state.phase, 'paused', JSON.stringify(state.flags.ruleHold));
      if (state.phase !== 'draft') assert.equal(state.track, (state.flags.thirds as {id:string}|undefined)?.id==='magician'&&state.phase!=='selection'?'wild':plan!.races[state.round - 1]!.map);
      if (state.phase !== 'draft' && !drafted) {
        drafted = true;
        assert(state.players.every(player => player.hand.length === rounds * cardsPerRace));
      }
      if (drafted) {
        const owned = state.players.flatMap(player => [...player.hand, ...player.used]);
        assert.equal(new Set(owned).size, owned.length, 'a drafted card cannot appear twice in player hands/used cards');
        assert(state.players.every(player => player.hand.length + player.used.length === rounds * cardsPerRace));
        assert(state.players.every(player => player.selection.length === 0 || player.selection.length === cardsPerRace));
      }
      if (state.phase === 'race' && !restored.has(state.round)) {
        // Compare the JSON sent over the wire: undefined flag properties disappear in storage and transport.
        const before = JSON.stringify(state.players.map(player => projectRoom(room, player.id, { authorityId: room.hostId, authorityOnline: true })));
        room.game = JSON.parse(JSON.stringify(state)) as GameState;
        assert.deepEqual(room.game.matchPlan, plan);
        assert.equal(JSON.stringify(room.game.players.map(player => projectRoom(room, player.id, { authorityId: room.hostId, authorityOnline: true }))), before);
        roomRules(room.game); // Saved rule/track versions must still select a supported engine.
        restored.add(state.round);
      }
      lastAction = publicAction(room);
      assert(lastAction, `seed ${seed}: no legal public action at ${state.phase}/${state.round}/${state.pending?.kind}`);
      roomRules(room.game).applyGameAction(room.game, lastAction.playerId, lastAction.action);
      room.version++;
      ledgerBalances(room.game);
    }
    const state = room.game;
    assert.equal(state.round, rounds);
    assert.equal(state.results.length, rounds);
    assert.equal(restored.size, rounds);
    assert.deepEqual(state.matchPlan, plan);
    assert(state.players.every(player => player.hand.length === 0 && player.used.length === rounds * cardsPerRace));
    for (const result of state.results) for (const entry of result.scores!) {
      assert.equal(entry.total, entry.placement + entry.map + entry.skill + entry.event);
      assert.equal(entry.placement, result.placements.filter(place => place.playerId === entry.playerId).reduce((sum, place) => sum + place.points, 0));
    }
    const expectedScores = state.players.map(player => ({ id: player.id, score: state.results.reduce((sum, result) => sum + result.scores!.find(entry => entry.playerId === player.id)!.total, 0) }));
    const view = projectRoom(room, 'p0', { authorityId: 'p0', authorityOnline: true });
    assert.deepEqual(view.players.map(player => ({ id: player.id, score: player.score })), expectedScores);
    assert.deepEqual(view.players.toSorted((a, b) => b.score - a.score).map(player => player.id), expectedScores.toSorted((a, b) => b.score - a.score).map(player => player.id));
    const before = JSON.stringify(state.results);
    assert.throws(() => roomRules(state).applyGameAction(state, 'p0', { type: 'next' }));
    assert.equal(JSON.stringify(state.results), before);
  } catch (error) {
    mkdirSync('.local', { recursive: true });
    writeFileSync(`.local/event-match-${count}-${mode}-${rounds}-failure.json`, JSON.stringify({ seed, steps, lastAction, room }, null, 2));
    throw error;
  }
});
