import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {venuePoolPhotometry,poolIrradiance,activeVenuePools,VENUE_POOL_BUDGET} from '../src/client/scene/environment/floodlight-pools.js';
import {floodlightLayout,VENUE_LIGHT_BUDGET} from '../src/client/scene/environment/floodlights.js';
import {mechanismLayout} from '../src/client/scene/mechanisms/layout.js';
import {TRACKS,type TrackId} from '../src/shared/tracks.js';
import {trackNodeIds} from '../src/client/scene/math.js';import {environmentPoint} from '../src/client/scene/environment/layout.js';
import {createVenueLightingState,stepVenueLighting} from '../src/client/scene/environment/venue-lighting-state.js';
test('actual spots and offline receiver calibration consume the same bounded pool profile',()=>{
 for(const path of ['src/client/scene/environment/VenueLighting.tsx','scripts/recovery/export-visible-beam-preview.ts']){const s=readFileSync(path,'utf8');assert.match(s,/venuePoolPhotometry\(/);assert.doesNotMatch(s,/venueSpotPhotometry\(/);}
 for(const low of [false,true]){const pos=new Vector3(0,8,0),target=new Vector3(0,0,0),p=venuePoolPhotometry(pos,target,low);assert.ok(p.angle<.6&&p.angle>.5);assert.ok(p.penumbra>=.4);assert.ok(p.distance<14);assert.equal(p.decay,2);
 assert.ok(Math.abs(poolIrradiance(pos,target,target,low)-p.targetLux)<1e-6);
 const middle=poolIrradiance(pos,target,new Vector3(3,0,0),low),outer=poolIrradiance(pos,target,new Vector3(7,0,0),low);assert.ok(middle>0&&middle<p.targetLux);assert.equal(outer,0);}
});
test('all seven maps preserve budgets and finite variable direct light, not an all-floor coverage claim',()=>{
 for(const track of Object.keys(TRACKS) as TrackId[])for(const lowQuality of [false,true]){
 const options={...mechanismLayout(track),lowQuality},lamps=activeVenuePools(floodlightLayout(track,options),lowQuality);assert.equal(lamps.length,VENUE_POOL_BUDGET[lowQuality?'economy':'full'].spots);
 const values=trackNodeIds(track).map(n=>{const point=environmentPoint(track,n,options);return lamps.reduce((sum,l)=>sum+poolIrradiance(l.receiver,l.target,point,lowQuality),0);});
 assert.ok(values.every(v=>Number.isFinite(v)&&v>=0));assert.ok(Math.max(...values)>Math.min(...values)+.1);assert.ok(Math.max(...values)<6);
 }
});
test('night retains readable nonzero background with daylight and fixture-load failure unchanged',()=>{
 const state=createVenueLightingState('night');let p=stepVenueLighting(state,'night',true,1);for(let i=0;i<30;i++)p=stepVenueLighting(state,'night',true,1);
 assert.ok(p.ambient>.02&&p.hemi>.1&&p.keyPower>.15&&p.fillPower>.05);assert.ok(p.keyPower<.2);assert.ok(p.env<.06);
 const d=createVenueLightingState('day');assert.equal(stepVenueLighting(d,'day',true,1).keyPower,4.1);
 const f=createVenueLightingState('night');assert.equal(stepVenueLighting(f,'night',false,1).keyPower,2);
});

test('default quality illuminates all four lamps on both sides; economy remains explicit and symmetric',()=>{
 for(const track of Object.keys(TRACKS) as TrackId[]){const full=activeVenuePools(floodlightLayout(track,{...mechanismLayout(track),lowQuality:false}));assert.equal(full.length,8);assert.equal(full.filter(l=>l.row===0).length,4);assert.equal(full.filter(l=>l.row===1).length,4);for(const l of full){const p=venuePoolPhotometry(l.receiver,l.target);assert.ok(p.intensity>0);assert.ok(l.direction.dot(l.target.clone().sub(l.receiver).normalize())>.999);}}
 assert.equal(VENUE_POOL_BUDGET.full.shadows,2);
});
