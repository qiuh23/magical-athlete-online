import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { GameAction, PendingChoiceView, RoomView } from '../src/shared/types.js';
import { TRACKS } from '../src/shared/tracks.js';
import { ChoiceDock } from '../src/client/ChoiceDock.js';
import { ChoiceOptions } from '../src/client/ChoiceOptions.js';
import { choiceAction, choiceDockReducer, choicePromptTitle, initialChoiceDockState } from '../src/client/choice-dock.js';
import { routeChoice } from '../src/client/scene/math.js';

const choice: PendingChoiceView = { id: 'choice-1', playerId: 'p0', racerId: 'r0', title: '教练：选择目标', optional: false, kind: 'coach', options: [{ id: '4', label: '支付1分，移动4格' }, { id: 'skip', label: '不使用技能' }] };
function room(pending: PendingChoiceView = choice): RoomView {
  return { code: 'DOCK', version: 1, hostId: 'p0', selfId: 'p0', role: 'player', maxPlayers: 2, timeoutSeconds: 0, deadline: null, phase: 'race', round: 1, track: 'mild', players: [0, 1].map(seat => ({ id: `p${seat}`, name: `选手${seat + 1}`, seat, color: '#456', score: 0, handCount: 0, used: [], selected: false, connected: true, ready: true })), racers: [0, 1].map(index => ({ id: `r${index}`, playerId: `p${index}`, characterId: 'coach', position: 2 + index * 10, tripped: false, finished: false, eliminated: false, flags: {} })), currentRacerId: 'r0', pending, logs: [], results: [], rulesStatus: 'test' };
}
const noop = () => {};
const html = (view = room(), busy = false) => renderToStaticMarkup(createElement(ChoiceDock, { room: view, busy, act: noop, onDetail: noop }));
type Element = ReactElement<Record<string, any>>;
function elements(tree: ReactNode): Element[] {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!isValidElement<Record<string, any>>(tree)) return [];
  return [tree, ...elements(tree.props.children)];
}
function options(view = room(), busy = false, act: (action: GameAction) => void = noop, onDetail: (id: string, racerId?: string) => void = noop, onExplain: (label: string, number: string) => void = noop) {
  return elements(ChoiceOptions({ room: view, busy, duel: false, act, onDetail, onExplain }));
}
const button = (tree: Element[], label: string) => tree.find(node => node.type === 'button' && node.props['aria-label'] === label)!;
const click = { currentTarget: { focus: noop } };

test('a decision is a nonmodal, independently labelled dock with separate 44px control roles', () => {
  const markup = html();
  assert.match(markup, /class="floating-choice race-choice-dock/);
  assert.match(markup, /role="region" aria-labelledby=/);
  assert.match(markup, /data-testid="skill-choice" data-choice-id="choice-1"/);
  assert.match(markup, /aria-label="查看完整技能说明：教练：选择目标"/);
  assert.match(markup, /aria-label="收起选项"[^>]*aria-expanded="true"/);
  assert.doesNotMatch(markup, /modal-backdrop|aria-modal|role="dialog"|class="choice-panel/);
  assert.equal(html({ ...room(), pending: undefined }), '');
});

test('numeric summaries retain payment, repetitions, allocation losses, and cell units', () => {
  const view = room({ ...choice, options: [{ id: '4', label: '支付1分，移动4格' }, { id: 'count', label: '4（3次）' }, { id: 'split', label: '自己前进4，目标后退2' }, { id: '12', label: '第12格' }, { id: 'unknown', label: '前进4格并淘汰目标' }] });
  const markup = html(view);
  for (const option of view.pending!.options) assert(markup.includes(`aria-label="${option.label}"`), option.label);
  assert.match(markup, /支付1分/); assert.match(markup, /−1分/); assert.match(markup, /×3/); assert.match(markup, /目标 −2/); assert.match(markup, /12<small>格<\/small>/);
  assert.match(markup, /<strong>前进4格并淘汰目标<\/strong>/, 'unknown consequences stay visible rather than being silently shortened');
});

test('inspecting never chooses, and choosing submits only the authority-provided option id', () => {
  const submitted: GameAction[] = [], explained: string[] = [];
  const tree = options(room(), false, action => submitted.push(action), noop, (label, number) => explained.push(`${number}:${label}`));
  button(tree, '查看选项4详情').props.onClick(click);
  assert.deepEqual(explained, ['4:支付1分，移动4格']); assert.deepEqual(submitted, []);
  button(tree, '支付1分，移动4格').props.onClick();
  assert.deepEqual(submitted, [{ type: 'choose', choiceId: 'choice-1', optionId: '4' }]);
});

test('busy, pause, wrong player and spectator cannot choose even if a stale handler is invoked', () => {
  const blocked: [RoomView, boolean][] = [[room(), true], [{ ...room(), pause: { at: 1, playerId: 'p0', remainingMs: null } }, false], [{ ...room(), selfId: 'p1' }, false], [{ ...room(), role: 'spectator' }, false]];
  for (const [view, busy] of blocked) {
    const actions: GameAction[] = [], tree = options(view, busy, action => actions.push(action));
    const target = button(tree, '支付1分，移动4格'); assert.equal(target.props.disabled, true); target.props.onClick(); assert.deepEqual(actions, []);
    assert.notEqual(button(tree, '查看选项4详情').props.disabled, true);
    assert.equal(choiceAction(view, busy, '4'), undefined);
  }
  assert.equal(choiceAction(room(), false, 'not-offered'), undefined);
  assert.equal(choiceAction({ ...room(), pending: undefined }, false, '4'), undefined);
});

test('character targets keep controller, position and public acquired powers, and detail never submits', () => {
  const view = room({ ...choice, options: [{ id: 'r0', label: '第一位教练', characterId: 'coach', racerId: 'r0' }, { id: 'r1', label: '第二位教练', characterId: 'coach', racerId: 'r1' }] });
  view.racers[0]!.flags.publicAbilities = { powers: ['coach', 'genius'], acquired: ['genius'] };
  const markup = html(view);
  assert.match(markup, /1号 · 2格/); assert.match(markup, /2号 · 12格/); assert.match(markup, /data-choice-power="genius"/);
  const details: string[] = [], actions: GameAction[] = [];
  const tree = options(view, false, action => actions.push(action), (id, racerId) => details.push(`${id}:${racerId}`));
  const inspect = tree.filter(node => node.type === 'button' && node.props['aria-label'] === '查看教练详情');
  assert.equal(inspect.length, 2); inspect[1]!.props.onClick(click);
  assert.deepEqual(details, ['coach:r1']); assert.deepEqual(actions, []);
});

test('offered characters remain private and character choices retain inspection affordances', () => {
  const view = room({ ...choice, offeredCharacterId: 'genius' });
  assert.match(html(view), /data-testid="offered-character" data-choice-character="genius"/);
  const spectator = html({ ...view, role: 'spectator' });
  assert.doesNotMatch(spectator, /data-testid="offered-character"/); assert.match(spectator, /等待选手选择/);
});

test('route choices stay explicit and visible without an extra disclosure, and preserve roll context', () => {
  const view = room(); view.track = 'boardwalks';
  const branch = Object.entries(TRACKS.boardwalks.edges!).find(([from, targets]) => {
    if (targets.length < 2) return false;
    const candidate = { ...choice, kind: 'track-branch', options: targets.map(to => ({ id: String(to), label: `前往第${to}格` })) };
    return routeChoice({ ...view, pending: candidate })?.from === Number(from);
  });
  assert(branch);
  view.pending = { ...choice, kind: 'track-branch', options: branch[1].map(to => ({ id: String(to), label: `前往第${to}格` })) };
  view.lastRoll = { racerId: 'r0', face: 5, distance: 7 };
  const markup = html(view);
  for (const option of view.pending.options) { assert(markup.includes(`aria-label="${option.label}"`)); assert(markup.includes(`去 ${option.id} 格`)); }
  assert.match(markup, /上次骰面 5，主移动 7 格/); assert.doesNotMatch(markup, /<details/);
});

test('duels keep the exact action and do not reveal hidden faces', () => {
  const view = room({ ...choice, kind: 'duel-roll', title: '双方决斗掷骰', options: [{ id: 'roll', label: '掷决斗骰' }] });
  const markup = html(view);
  assert.match(markup, /aria-label="掷决斗骰"/); assert.doesNotMatch(markup, /choice-dice-hint|last-roll/);
});

test('collapse, reopen, details, escape and a fresh choice have independent state', () => {
  let state = choiceDockReducer(initialChoiceDockState, { type: 'explain', detail: { label: '费用与效果', number: '4' } });
  assert.equal(state.collapsed, false); assert.equal(state.detail?.number, '4');
  state = choiceDockReducer(state, { type: 'escape' }); assert.deepEqual(state, { collapsed: false });
  state = choiceDockReducer(state, { type: 'toggle' }); assert.deepEqual(state, { collapsed: true });
  state = choiceDockReducer(state, { type: 'toggle' }); assert.deepEqual(state, { collapsed: false });
  state = choiceDockReducer(state, { type: 'escape' }); assert.deepEqual(state, { collapsed: true });
  state = choiceDockReducer(state, { type: 'explain', detail: { label: '完整技能' } }); assert.equal(state.collapsed, false);
  state = choiceDockReducer(state, { type: 'toggle' }); assert.deepEqual(state, { collapsed: true });
  assert.deepEqual(initialChoiceDockState, { collapsed: false }, 'the initial state is not mutated');
  const source = readFileSync(new URL('../src/client/ChoiceDock.tsx', import.meta.url), 'utf8');
  assert(source.includes('key={`${props.room.code}:${props.room.round}:${choice.id}`}'), 'new decisions cannot inherit a prior collapsed/detail state');
  assert.doesNotMatch(source, /document\.addEventListener|document\.body\.style|aria-modal|modal-backdrop/, 'no focus trap, body lock or map-covering backdrop');
});

test('only the actor prefix is shortened; unknown prompt consequences remain complete', () => {
  assert.equal(choicePromptTitle(room(), '教练'), '选择目标');
  assert.equal(choicePromptTitle(room({ ...choice, title: '支付2分并淘汰一名选手' }), '教练'), '支付2分并淘汰一名选手');
});

test('layout contract caps the dock and keeps action and inspect targets finger-sized', () => {
  const css = readFileSync(new URL('../src/client/choice-dock.css', import.meta.url), 'utf8');
  assert.match(css, /max-height: min\(30dvh, 220px\)/);
  assert.match(css, /max-height: min\(40dvh, 170px\)/);
  assert.match(css, /\.is-collapsed \{ height: 44px; max-height: 44px; \}/);
  assert.match(css, /min-height: 44px;\s*min-width: 44px;/);
  assert.match(css, /\.choice-dock-inspect[^}]*width: 44px/);
  assert.match(css, /\.choice-dock-options[^}]*flex-wrap: nowrap[^}]*overflow-x: auto/s);
  assert.doesNotMatch(css, /backdrop-filter|filter:\s*blur|position:\s*fixed|inset:\s*0/);
  // These are declarative cap calculations, not measured browser layout.
  for (const height of [667, 844, 1024]) assert(Math.min(height * .3, 220) / height <= .3);
  for (const height of [320, 390, 500]) assert(Math.min(height * .4, 170) / height <= .4);
});
