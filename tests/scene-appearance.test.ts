import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCENE_APPEARANCES, sceneAppearance } from '../src/client/scene-appearance.js';

test('local scene selection exposes auto plus fixed real light modes; missing/invalid preferences default to auto', () => {
  assert.deepEqual(SCENE_APPEARANCES.map(option=>option.value),['auto','day','dusk','night']);
  for(const value of ['auto','day','dusk','night'])assert.equal(sceneAppearance(value),value);
  for(const value of [null,'','noon','Night'])assert.equal(sceneAppearance(value),'auto');
});
test('existing race menu passes local appearance to the real scene without a new overlay or room action', () => {
  const app=readFileSync('src/client/App.tsx','utf8');
  assert.match(app, /<Board3D[^>]*appearanceMode=\{appearanceMode\}/);
  assert.match(app, /<div className="presentation-settings"><label>场景光照<select[^>]*aria-label="场景光照"/);
  assert.match(app, /localStorage.setItem\('magical-athlete:scene-appearance', appearanceMode\)/);
  assert.doesNotMatch(app, /act\(\{[^}]*appearanceMode/);
});
