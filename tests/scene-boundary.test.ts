import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SceneBoundary } from '../src/client/scene/SceneBoundary.js';

const props = { children: createElement('span', null, 'healthy canvas'), resetKey: 0, retry() {} };
const render = (boundary: SceneBoundary) => renderToStaticMarkup(createElement('div', null, boundary.render()));

test('main canvas failure keeps one explicit retry and the 2D continuation explanation', () => {
  const boundary = new SceneBoundary(props);
  assert.match(render(boundary), /healthy canvas/);
  boundary.state = SceneBoundary.getDerivedStateFromError();
  const html = render(boundary);
  assert.match(html, /scene-fallback/);
  assert.match(html, /小地图和选手信息/);
  assert.equal(html.match(/<button/g)?.length, 1);
});

test('an inactive or already-covered dice failure does not inherit a full-board retry layer', () => {
  const boundary = new SceneBoundary({ ...props, fallback: null });
  boundary.state = { failed: true };
  assert.equal(render(boundary), '<div></div>');
});

test('an active dice-only failure uses its scoped fallback and reports no main canvas failure', () => {
  let failed = 0;
  const boundary = new SceneBoundary({ ...props, onFailure: () => failed++, fallback: createElement('p', { className: 'dice-fallback' }, '骰子动画暂时无法显示') });
  boundary.state = { failed: true };
  boundary.componentDidCatch();
  assert.equal(failed, 1);
  assert.match(render(boundary), /dice-fallback/);
  assert.doesNotMatch(render(boundary), /scene-fallback|重新载入 3D/);
});
