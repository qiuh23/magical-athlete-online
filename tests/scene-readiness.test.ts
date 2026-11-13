import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { rebuiltContactSceneReady, sceneAssetState, type SceneAssetState } from '../src/client/scene/environment/scene-readiness.js';

test('rebuilt contact requires both actual environment and approved pads, never pending or failed placeholders', () => {
  for(const environment of ['loading','ready','failed'] as SceneAssetState[])
    for(const pads of ['loading','ready','failed'] as SceneAssetState[])
      for(const mechanisms of [false,true])for(const environmentRequested of [false,true])for(const dependenciesFailed of [false,true])
        assert.equal(rebuiltContactSceneReady({environment,pads,mechanisms,environmentRequested,dependenciesFailed}),environment==='ready'&&pads==='ready'&&mechanisms&&environmentRequested&&!dependenciesFailed);
});

test('track/quality/retry scopes cannot reuse stale pad readiness', () => {
  const state={key:'wild:false:0:0',state:'ready' as const};
  for(const key of ['boardwalks:false:0:0','wild:true:0:0','wild:false:1:0','wild:false:0:1'])
    assert.equal(rebuiltContactSceneReady({mechanisms:true,environmentRequested:true,environment:'ready',pads:sceneAssetState(key,state),dependenciesFailed:false}),false);
});

test('the live pad mount reports readiness and unmount, while Board admission consumes scoped ready state', () => {
  const board=readFileSync('src/client/scene/Board3D.tsx','utf8'),course=readFileSync('src/client/scene/environment/RebuiltMechanismCourse.tsx','utf8');
  assert.match(board,/pads:padLoad/);assert.match(board,/const padLoad=sceneAssetState\(padKey,padStatus\)/);
  assert.match(board,/RebuiltMechanismCourse[^>]*key=\{padKey\}[^>]*onPadReady=\{padOnReady\}/);
  assert.match(course,/onReady\(true\)/);assert.match(course,/onReady\(false\)/);
  assert.doesNotMatch(board,/environment-review-note/);
});
