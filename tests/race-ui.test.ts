import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { THIRD_EVENTS } from '../src/shared/special-events.js';
import { TWIST_CARDS } from '../src/shared/twists.js';
import type { RoomView } from '../src/shared/types.js';
import type { PresentationBeat } from '../src/client/presentation.js';
import { EventArt } from '../src/client/EventArt.js';
import { TrackInfo } from '../src/client/TrackInfo.js';
import { RaceMoment } from '../src/client/RaceMoment.js';
import { cueArt, raceCue } from '../src/client/race-cue.js';
import { choiceVisual } from '../src/client/choice-visuals.js';

const room: RoomView = { code: 'CUE', version: 1, hostId: 'p0', selfId: 'p0', maxPlayers: 3, timeoutSeconds: 0, deadline: null, phase: 'race', round: 1, track: 'mild', players: [], racers: [{ id: 'r0', playerId: 'p0', characterId: 'banana', position: 1, tripped: false, finished: false, eliminated: false, flags: {} }], currentRacerId: 'r0', logs: [], results: [], rulesStatus: 'test' };
const beat = (patch: Partial<PresentationBeat> = {}): PresentationBeat => ({ key: 'CUE:1:2', kind: 'skill', targets: [], motions: [], events: [{ id: 2, type: 'power', text: '已确认效果' }], durationMs: 1800, ...patch });

test('numeric choices preserve costs, repeat counts and both sides of an allocation', () => {
  assert.deepEqual(choiceVisual({ id: '4', label: '支付1分，移动4格' }), { number: '4', cost: '1' });
  assert.deepEqual(choiceVisual({ id: '4', label: '4（3次）' }), { number: '4', count: '3' });
  assert.deepEqual(choiceVisual({ id: '4', label: '自己前进4，目标后退2' }), { number: '4', retreat: '2' });
  assert.deepEqual(choiceVisual({ id: '12', label: '第12格' }), { number: '12' });
  assert.deepEqual(choiceVisual({ id: 'n', label: '选择第 1 位角色发动技能，查看详细效果' }), { number: '1' });
  assert.equal(choiceVisual({ id: '1', label: '奇数' }), undefined);
  assert.equal(choiceVisual({ id: '4', label: '前进4格并淘汰目标' }), undefined);
  assert.equal(choiceVisual({ id: '4', label: '选择第4位角色，支付2分' }), undefined);
  assert.equal(choiceVisual({ id: '4', label: '选择第4位角色并淘汰目标' }), undefined);
});

test('every implemented special event and twist has a different SVG composition, independent of color', () => {
  const compositions = [...Object.keys(THIRD_EVENTS).map(id => ({ id, family: 'event' as const })), ...TWIST_CARDS.map(card => ({ id: card.id, family: 'twist' as const }))].map(props => {
    const svg = renderToStaticMarkup(createElement(EventArt, props));
    assert.match(svg, /<svg/);
    // Remove labels, colors and IDs: equal shapes must not pass as different art.
    return svg.replace(/ (?:data-event-art|fill|stroke|color)="[^"]*"/g, '');
  });
  assert.equal(new Set(compositions).size, 49);
});

test('event work items use their public event identity, and ordinary skills do not inherit it', () => {
  const showing = { ...room, trackState: { reversed: false, event: { id: 'mastermind' as const, description: THIRD_EVENTS.mastermind, direction: 1, npc: undefined, trampolines: undefined, newStart: undefined } } };
  assert.equal(cueArt(beat({ cause: 'thirds-guess' }), showing)?.id, 'mastermind');
  assert.equal(cueArt(beat({ cause: 'thirds' }), showing)?.id, 'mastermind');
  assert.equal(cueArt(beat({ cause: 'thirds-mouth' }), showing)?.id, 'mouth');
  assert.equal(cueArt(beat({ cause: 'banana' }), showing), undefined);
  assert.equal(cueArt(beat({ cause: 'twist-conveyor' }), showing)?.family, 'twist');
});

test('movement numbers respect race direction and actual paths rather than cell subtraction', () => {
  const moving = beat({ kind: 'move', cause: 'main', motions: [{ racerId: 'r0', from: 8, to: 5, path: [8, 7, 6, 5] }] });
  assert.equal(raceCue(moving, room).amounts.get('r0'), '-3');
  assert.equal(raceCue(moving, { ...room, trackState: { reversed: true } }).amounts.get('r0'), '+3');
  const warped = beat({ kind: 'warp', motions: [{ racerId: 'r0', from: 8, to: 1, path: [8, 1] }] });
  assert.equal(raceCue(warped, room).amounts.get('r0'), '8→1');
  assert.equal(raceCue(warped, room).title, '传送');
});

test('score and finish read confirmed numeric suffixes, while missing amounts are never invented', () => {
  const score = (text: string) => raceCue(beat({ kind: 'score', events: [{ id: 2, type: 'score', text }] }), room).title;
  assert.equal(score('选手 -2分（支付重掷）'), '-2分');
  assert.equal(score('选手 +3分（技能）'), '+3分');
  assert.equal(score('积分已结算'), '积分变化');
  assert.equal(raceCue(beat({ kind: 'finish', events: [{ id: 2, type: 'finish', text: '选手的香蕉获得第2名，+3分' }] }), room).title, '第2名 · +3分');
});

test('immediate recovery does not claim that the main movement is skipped', () => {
  const recover = (text: string) => raceCue(beat({ kind: 'recover', events: [{ id: 2, type: 'recover', text }] }), room).title;
  assert.equal(recover('香蕉立即起身'), '立即起身');
  assert.equal(recover('香蕉起身，代替主移动'), '起身 · 跳过主移动');
});

test('a neutral marker never borrows the current player portrait, and dice have no second banner', () => {
  const marker = beat({ actor: { name: '大嘴', characterId: 'mouth' }, cause: 'thirds-mouth', events: [{ id: 2, type: 'event-marker', text: '大嘴标记到第24格' }] });
  const html = renderToStaticMarkup(createElement(RaceMoment, { room, beat: marker, racers: room.racers, onDetail() {} }));
  assert.match(html, /event:mouth/); assert.match(html, /大嘴/); assert.doesNotMatch(html, /香蕉/);
  assert.equal(renderToStaticMarkup(createElement(RaceMoment, { room, beat: beat({ kind: 'dice' }), racers: room.racers, onDetail() {} })), '');
});

test('compact HUD retains marker positions and all public fixed dice; explanations stay in details', () => {
  const showing: RoomView = { ...room, trackState: { reversed: false, event: { id: 'mouth', description: THIRD_EVENTS.mouth, direction: 1, trampolines: undefined, newStart: undefined, npc: { id: 'mouth', position: 19 } }, twist: { triggered: true, drawn: ['randomness-ceased'], fixedFaces: { p0: 4 } } }, players: [{ id: 'p0', name: '选手', color: '#000', seat: 0, score: 0, hand: [], handCount: 0, selected: false, used: [], connected: true, ready: true }] };
  const html = renderToStaticMarkup(createElement(TrackInfo, { room: showing, onDetails() {} }));
  assert.match(html, /标记 19格/); assert.match(html, /1号 <b>4<\/b>/); assert.doesNotMatch(html, /停在其格子的角色淘汰/);
});
