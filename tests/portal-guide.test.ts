import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TRACKS, type TrackDefinition, type TrackId } from '../src/shared/tracks.js';
import { portalCaption, portalConnections, portalDescription, portalEndpoints, portalPanelPlacement, PORTAL_COLORS } from '../src/client/portal-guide.js';
import { PortalLegend, PortalMapMarkers, PortalPairList } from '../src/client/PortalGuide.js';
import { TrackThumbnail } from '../src/client/CompetitionFields.js';
import { buildTileFinish, tileCaption, tileTheme } from '../src/client/scene/environment/tile-finish.js';
import { placePortalLabels, portalSignPoint } from '../src/client/scene/portal-labels.js';
import { boardPoint } from '../src/client/scene/math.js';
import { cameraFrame, cameraView } from '../src/client/scene/camera.js';
import { OrthographicCamera, Vector3 } from 'three';
import type { PresentationBeat } from '../src/client/presentation.js';

test('every actual portal destination is projected once; only Whirly currently has six reciprocal pairs', () => {
  const before = JSON.stringify(TRACKS);
  for (const id of Object.keys(TRACKS) as TrackId[]) {
    const expected = Object.entries(TRACKS[id].specials).filter(([, s]) => s.kind === 'warp').map(([from, s]) => [Number(from), s.to]).sort((a,b)=>a[0]!-b[0]!);
    const endpoints = portalEndpoints(id);
    assert.deepEqual(endpoints.map(c => [c.from, c.to]).sort((a,b)=>a[0]!-b[0]!), expected);
    assert.equal(portalConnections(id).length, id === 'whirly-world' ? 6 : 0);
  }
  assert.deepEqual(portalConnections('whirly-world').map(c => [c.from,c.to,c.bidirectional]), [[3,5,true],[7,12,true],[10,15,true],[18,22,true],[20,23,true],[24,27,true]]);
  for (const connection of portalConnections('whirly-world')) {
    const ends = portalEndpoints('whirly-world').filter(p => p.key === connection.key);
    assert.equal(ends.length, 2); assert.equal(ends[0]!.code, ends[1]!.code); assert.equal(ends[0]!.color, ends[1]!.color);
  }
  assert.equal(JSON.stringify(TRACKS), before, 'presentation never mutates authoritative map data');
});

test('direction comes from the current exact reverse edge, not portal appearance or node order', () => {
  const map: TrackDefinition = { ...TRACKS['whirly-world'], specials: { 3:{kind:'warp',to:5},5:{kind:'warp',to:7},7:{kind:'warp',to:5},9:{kind:'warp',to:11} } };
  assert.deepEqual(portalConnections(map).map(c=>[portalCaption(c),c.code]), [['3→5','A'],['5↔7','B'],['9→11','C']]);
  assert.deepEqual(portalEndpoints(map).map(c=>[c.from,c.to]), [[3,5],[5,7],[7,5],[9,11]]);
  assert.match(portalDescription(portalConnections(map)[0]!), /从3格传送到5格/);
  const invalid = { ...map, specials:{3:{kind:'warp' as const,to:99},5:{kind:'warp' as const,to:5},7:{kind:'warp' as const}} };
  assert.deepEqual(portalConnections(invalid), []);
});

test('the inlaid floor, main-board model and small-map key share one pair identity', () => {
  const kit = buildTileFinish('whirly-world');
  for (const c of portalEndpoints('whirly-world')) {
    assert.equal(tileTheme(TRACKS['whirly-world'].specials[c.from],c.from).rim,c.color);
    assert.equal(kit.labels.find(l=>l.node===c.from)!.caption,`↔ ${c.to}`);
  }
  assert.equal(tileCaption({kind:'warp',to:5}), '↔ 5', 'the unchanged floor caption is accurate for all current reciprocal pairs');
  kit.dispose();
  const list = renderToStaticMarkup(createElement(PortalPairList,{track:'whirly-world'}));
  assert.equal((list.match(/data-portal-pair=/g)??[]).length,6);
  for (const c of portalConnections('whirly-world')) { assert(list.includes(portalCaption(c))); assert(list.includes(portalDescription(c))); }
  for (const component of [PortalMapMarkers, TrackThumbnail]) {
    const markup = component === TrackThumbnail ? renderToStaticMarkup(createElement(TrackThumbnail,{id:'whirly-world'})) : renderToStaticMarkup(createElement(PortalMapMarkers,{track:'whirly-world',point:n=>({x:n,y:n})}));
    assert.equal((markup.match(/data-portal-to=/g)??[]).length,12);
    assert(markup.includes('A组，3格与5格双向传送'));
  }
});

test('the compact key is present before activation; active route uses only the current confirmed warp beat', () => {
  const initial = renderToStaticMarkup(createElement(PortalLegend,{track:'whirly-world'}));
  assert(initial.includes('<summary>')); assert(initial.includes('传送配对')); assert(initial.includes('24↔27')); assert(!initial.includes('portal-active-route'));
  assert.equal(renderToStaticMarkup(createElement(PortalLegend,{track:'mild'})), '');
  const beat: PresentationBeat = {key:'portal',kind:'warp',cause:'track-whirl',targets:['r0'],motions:[{racerId:'r0',from:3,to:5,path:[3,5]}],events:[],durationMs:2000};
  const active=renderToStaticMarkup(createElement(PortalLegend,{track:'whirly-world',beat}));
  assert.match(active, /<\/details><span class="portal-active-route" role="status">传送 3→5/);
  for (const altered of [{...beat,cause:'character-ability'},{...beat,motions:[{...beat.motions[0]!,to:12}]}]) assert(!renderToStaticMarkup(createElement(PortalLegend,{track:'whirly-world',beat:altered})).includes('portal-active-route'));
  const source=readFileSync('src/client/PortalGuide.tsx','utf8'); assert.doesNotMatch(source,/setTimeout|requestAnimationFrame|performance\.now/);
});

test('label layout stays anchored and avoids UI, neighbors, invalid depths and screen edges', () => {
  const candidates=[{node:3,x:120,y:150,depth:0,width:80,height:26},{node:5,x:124,y:150,depth:0,width:80,height:26},{node:7,x:220,y:250,depth:0,width:80,height:26},{node:10,x:10,y:400,depth:0,width:80,height:26},{node:12,x:240,y:400,depth:2,width:80,height:26}];
  const result=placePortalLabels(candidates,390,844,[{left:175,right:270,top:225,bottom:280}]);
  assert.equal(result.length,1); assert([3,5].includes(result[0]!.node));
  const original=candidates.find(c=>c.node===result[0]!.node)!;assert.equal(result[0]!.x,original.x);assert.equal(result[0]!.y,original.y);
});

test('all twelve actual portal anchors rotate with the compact map and fit focused camera math',()=>{
  for(const endpoint of portalEndpoints('whirly-world')){
    const wide=portalSignPoint('whirly-world',endpoint.from,false),phone=portalSignPoint('whirly-world',endpoint.from,true),cell=boardPoint(endpoint.from,false,'whirly-world');
    assert.equal(phone[0],-wide[2]);assert.equal(phone[1],wide[1]);assert.equal(phone[2],wide[0]);
    assert(Math.abs(Math.hypot(wide[0]-cell[0],wide[2]-cell[2])-.88)<1e-9);
    for(const [width,height,compact] of [[1280,900,false],[390,844,true],[844,390,false]] as const){
      const frame=cameraFrame([endpoint.from],compact,width,height,false,undefined,false,'whirly-world'),view=cameraView(compact),camera=new OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,1000);
      camera.position.set(frame.x+view.offset[0]*3,frame.y+view.offset[1]*3,frame.z+view.offset[2]*3);camera.lookAt(frame.x,frame.y,frame.z);camera.zoom=frame.zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();
      const p=new Vector3(...portalSignPoint('whirly-world',endpoint.from,compact)).project(camera),placed=placePortalLabels([{node:endpoint.from,x:(p.x+1)*width/2,y:(1-p.y)*height/2,depth:p.z,width:84,height:26}],width,height,[]);
      assert.equal(placed.length,1,`${endpoint.from} at ${width}×${height}`);
    }
  }
});

test('the expanded key fits below a tall view or above the summary on a short landscape',()=>{
  assert.deepEqual(portalPanelPlacement(180,224,0,844,218),{upward:false,maxHeight:240});
  assert.deepEqual(portalPanelPlacement(230,274,0,390,218),{upward:true,maxHeight:222});
  assert.deepEqual(portalPanelPlacement(180,224,100,390,218),{upward:false,maxHeight:158});
  for(const [top,bottom]of[[180,224],[230,274]]){
    const p=portalPanelPlacement(top!,bottom!,0,390,218);
    assert(p.upward?top!-p.maxHeight>=8:bottom!+p.maxHeight<=382);
  }
});

function luminance(hex:string){const rgb=hex.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]!+.7152*rgb[1]!+.0722*rgb[2]!;}
test('pair letters and labels retain AA text contrast without relying on color or hover', () => {
  for(const background of [...PORTAL_COLORS,'#fff6d9']) assert((luminance(background)+.05)/(luminance('#071b17')+.05)>=4.5,background);
  assert((luminance('#fff6d9')+.05)/(luminance('#173f37')+.05)>=7);
  const css=readFileSync('src/client/portal-guide.css','utf8');assert.match(css,/min-height:44px/);assert.match(css,/touch-action:pan-y/);assert.match(css,/forced-colors:active/);
});
