import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RaceMenuConfigSummary } from '../src/client/RaceMenuConfigSummary.js';
import { createMatchPlan, presetCompetition } from '../src/shared/competition.js';
import { legacyRoomConfig } from '../src/shared/room-config.js';
import type { RoomView } from '../src/shared/types.js';

const config = {...legacyRoomConfig('original'), competition:presetCompetition('official')};
function html(patch:Partial<RoomView>={}) {
  const room={phase:'race',round:2,configFrozen:true,mode:'multi',players:[{},{},{}],...patch} as RoomView;
  return renderToStaticMarkup(createElement(RaceMenuConfigSummary,{room,config}));
}
test('locked race menu shows a readable schedule instead of disabled editing controls',()=>{
  const markup=html();
  assert.doesNotMatch(markup,/<(?:fieldset|input|select|button)/);
  assert.match(markup,/官方巡回/);assert.match(markup,/4 场 · 已锁定/);
  for(const map of ['Mild Mile','Wild Wilds','Twisty Twirl','Whirly World'])assert.ok(markup.includes(map));
  assert.equal((markup.match(/aria-current="step"/g)??[]).length,1);
  assert.match(markup,/三人单角色/);assert.match(markup,/<dt>角色包<\/dt>/);assert.match(markup,/<dt>特殊赛事<\/dt><dd>关闭<\/dd>/);
});
test('live schedule reads the frozen plan, including special rounds',()=>{
  const c=presetCompetition('extended');c.thrillingThirds={enabled:true,rounds:[3,6]};
  const markup=html({matchPlan:createMatchPlan({competition:c})});
  assert.match(markup,/8 场/);assert.match(markup,/Bridges/);assert.match(markup,/第 3、6 场 · 非官方/);
  assert.equal((markup.match(/<li/g)??[]).length,8);
});
test('finished rooms describe next-game config, never the historical match plan',()=>{
  const markup=html({phase:'finished',round:8,matchPlan:createMatchPlan({competition:presetCompetition('extended')})});
  assert.match(markup,/4 场 · 由房主设置/);assert.equal((markup.match(/<li/g)??[]).length,4);
  assert.doesNotMatch(markup,/Bridges|aria-current|本场|已锁定/);
});
test('practice, two players, three-player double and larger games keep their mode labels',()=>{
  assert.match(html({mode:'practice',players:[{}] as RoomView['players']}),/单人练习 · 每场 1 位角色/);
  assert.match(html({players:[{},{}] as RoomView['players']}),/两人双角色/);
  const room={phase:'race',round:1,players:[{},{},{}]} as RoomView;
  assert.match(renderToStaticMarkup(createElement(RaceMenuConfigSummary,{room,config:{...config,threePlayerMode:'double'}})),/三人双角色 · 非官方/);
  assert.match(html({players:Array.from({length:8},()=>({})) as RoomView['players']}),/8 人 · 每人单角色 · 非官方/);
});
