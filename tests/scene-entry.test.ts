import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sceneEntryPath, prepareSceneEntry } from '../src/client/scene-entry.js';
import { activeMechanismLayout } from '../src/client/scene/mechanisms/layout.js';
import { environmentEnabled, environmentTrees } from '../src/client/scene/environment/layout.js';
import { boardPoint, trackNodeIds } from '../src/client/scene/math.js';
import { mechanismPlacements } from '../src/client/scene/mechanisms/placements.js';
import { TRACKS, type TrackId } from '../src/shared/tracks.js';

test('normal entry enables presentation, preserves URL details and never overwrites explicit fallback', () => {
  assert.equal(sceneEntryPath('/room/A?note=a%20b&opaque=%2f%2B#scores'), '/room/A?note=a%20b&opaque=%2f%2B&environment=1&mechanisms=1#scores');
  assert.equal(sceneEntryPath('/'), '/?environment=1&mechanisms=1');
  assert.equal(sceneEntryPath('/room/ABCD?spectate=1#scores'), '/room/ABCD?spectate=1&environment=1&mechanisms=1#scores');
  for (const query of ['?environment=0', '?mechanisms=0', '?environment=0&mechanisms=0', '?environment=&mechanisms=unexpected', '?environment=0&environment=1&mechanisms=', '?environment=1&mechanisms=1&mechanismSpacing=2.3']) {
    const path=sceneEntryPath('/room/ABCD'+query),p=new URLSearchParams(path.split('?')[1]);
    for(const k of new Set(new URLSearchParams(query).keys())) assert.deepEqual(p.getAll(k),new URLSearchParams(query).getAll(k));
    assert.equal(sceneEntryPath(path),path);
  }
  assert.equal(sceneEntryPath('/room/NEXT?spectate=1','?environment=0&mechanisms=0&mechanismSpacing=2.3&room=OLD'), '/room/NEXT?spectate=1&environment=0&mechanisms=0&mechanismSpacing=2.3');
  assert.equal(sceneEntryPath('/?environment=1','?environment=0&mechanisms=0'), '/?environment=1&mechanisms=0');
});

test('startup and repeated navigation replace once, preserve history state and fail safely', () => {
  const previous=globalThis.window;
  try {
    const location={pathname:'/room/A',search:'?spectate=1',hash:'#chat'}; const state={navigation:'original'};let calls=0;
    Object.assign(globalThis,{window:{location,history:{state,replaceState(value:unknown,_title:string,path:string){calls++;assert.equal(value,state);const u=new URL(path,'https://test.invalid');Object.assign(location,{pathname:u.pathname,search:u.search,hash:u.hash});}}}});
    prepareSceneEntry(); prepareSceneEntry(); assert.equal(calls,1); assert.equal(location.hash,'#chat');
    location.search='?environment=0&mechanisms=0';prepareSceneEntry();assert.equal(calls,1);
    location.search='';window.history.replaceState=()=>{throw Error('blocked');};assert.doesNotThrow(prepareSceneEntry);
  } finally { if(previous===undefined)delete(globalThis as any).window;else Object.assign(globalThis,{window:previous}); }
});

test('normal entry exactly matches audited opt-in nodes, mounts and tree matrices for all seven maps', () => {
  const previous=globalThis.window;
  const collect=(search:string)=>{Object.assign(globalThis,{window:{location:{search}}});return(Object.keys(TRACKS) as TrackId[]).map(track=>({track,layout:activeMechanismLayout(track),nodes:trackNodeIds(track).map(n=>boardPoint(n,false,track)),compact:trackNodeIds(track).map(n=>boardPoint(n,true,track)),mounts:mechanismPlacements(track).map(p=>p.matrix.elements),trees:environmentTrees(track,{...activeMechanismLayout(track),lowQuality:false}).map(t=>t.matrix.elements)}));};
  try {const explicit=collect('?environment=1&mechanisms=1'),normal=sceneEntryPath('/').split('?')[1]!;assert.equal(environmentEnabled('?'+normal),true);assert.deepEqual(collect('?'+normal),explicit);collect('?environment=0&mechanisms=0');for(const track of Object.keys(TRACKS) as TrackId[])assert.deepEqual(activeMechanismLayout(track),{scale:1,lift:0});}
  finally { if(previous===undefined)delete(globalThis as any).window;else Object.assign(globalThis,{window:previous}); }
  const app=readFileSync('src/client/App.tsx','utf8'),board=readFileSync('src/client/scene/Board3D.tsx','utf8');assert.ok(app.indexOf('prepareSceneEntry();')<app.indexOf('const Board3D = lazy'));assert.ok(board.startsWith("import './asset-loading.js';"));
});
