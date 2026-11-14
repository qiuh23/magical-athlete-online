import {FLOODLIGHT_COLOR} from '../src/client/scene/environment/floodlight-color.js';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS,type TrackId} from '../src/shared/tracks.js';
import {mechanismLayout} from '../src/client/scene/mechanisms/layout.js';
import {floodlightLayout,VENUE_LIGHT_BUDGET} from '../src/client/scene/environment/floodlights.js';
import {createFloodlightBeams,BEAM_PROFILE} from '../src/client/scene/environment/floodlight-beams.js';
import {createVenueLightingState,stepVenueLighting} from '../src/client/scene/environment/venue-lighting-state.js';
test('all maps retain eight bounded scattering cores in one batch without lights or shadows',()=>{
 for(const track of Object.keys(TRACKS) as TrackId[])for(const lowQuality of [false,true]){
 const layout=floodlightLayout(track,{...mechanismLayout(track),lowQuality}),kit=createFloodlightBeams(layout);
 assert.equal(kit.mesh.geometry.index!.count,8*BEAM_PROFILE.rings*BEAM_PROFILE.segments*6);
 assert.equal(kit.mesh.children.length,0);assert.equal(kit.mesh.castShadow,false);assert.equal(kit.mesh.material.depthWrite,false);
 assert.ok([...kit.mesh.geometry.attributes.position!.array].every(Number.isFinite));
 assert.equal(kit.mesh.visible,false);kit.setNightFactor(1);assert.equal(kit.mesh.visible,true);kit.setNightFactor(0);assert.equal(kit.mesh.visible,false);
 assert.equal(kit.mesh.material.uniforms.nightFactor!.value,0);kit.dispose();kit.dispose();
 }
 assert.equal(VENUE_LIGHT_BUDGET.full.spots,6);assert.equal(VENUE_LIGHT_BUDGET.economy.spots,4);
});
test('night contrast only changes when fixtures are ready; daytime is unaffected',()=>{
 const day=createVenueLightingState('day');let d=stepVenueLighting(day,'day',true,1);for(let i=0;i<30;i++)d=stepVenueLighting(day,'day',true,1);
 assert.equal(d.nightFactor,0);assert.equal(d.keyPower,4.1);
 const n=createVenueLightingState('night');let p=stepVenueLighting(n,'night',true,1);for(let i=0;i<30;i++)p=stepVenueLighting(n,'night',true,1);
 assert.ok(p.keyPower<.4);assert.ok(p.hemi>.1);assert.equal(p.nightFactor,1);
 const unavailable=stepVenueLighting(createVenueLightingState('night'),'night',false,1);assert.equal(unavailable.keyPower,2);
});

test('stadium lamps and scattering volumes use one cool-white profile',()=>{
 assert.equal(FLOODLIGHT_COLOR,'#f2f6ff');assert.ok(BEAM_PROFILE.opacity<.15);
 const layout=floodlightLayout('mild',{...mechanismLayout('mild'),lowQuality:false}),kit=createFloodlightBeams(layout);
 const color=kit.mesh.material.uniforms.beamColor!.value;assert.ok(color.b>=color.g&&color.g>=color.r);
 assert.ok(color.r>.85);kit.dispose();
});

test('stadium ground, turf and course remain light-responsive standard materials',()=>{
 const source=readFileSync('src/client/scene/DioramaStadium.tsx','utf8');
 for(const key of ['plastic','mint','dark','wood','turfShade'])assert.match(source,new RegExp(key+': new THREE\\.MeshStandardMaterial'));
 assert.match(source,/turf: turfTextures \? createStadiumTurfMaterial\(turfTextures,lowQuality\) : new THREE\.MeshStandardMaterial\(\{[^\n]*map:lawn/);
 const turfSource=readFileSync('src/client/scene/environment/stadium-turf.ts','utf8');
 assert.match(turfSource,/new MeshStandardMaterial\(\{[^\n]*map:textures.color/);
 assert.match(readFileSync('src/client/scene/environment/VenueLighting.tsx','utf8'),/new THREE\.SpotLight\(FLOODLIGHT_COLOR/);
 assert.match(readFileSync('src/client/scene/environment/floodlight-color.ts','utf8'),/material\.emissive\.set\(FLOODLIGHT_COLOR\)/);
});

test('scattering perimeter follows the real spot cone bright interior to the central receiver',async()=>{
 const {venuePoolPhotometry}=await import('../src/client/scene/environment/floodlight-pools.js');
 for(const track of Object.keys(TRACKS) as TrackId[]){const lamps=floodlightLayout(track,{...mechanismLayout(track),lowQuality:false}),kit=createFloodlightBeams(lamps),positions=kit.mesh.geometry.attributes.position!;
 for(let lampIndex=0;lampIndex<lamps.length;lampIndex++){const lamp=lamps[lampIndex]!,photo=venuePoolPhotometry(lamp.receiver,lamp.target),axis=lamp.target.clone().sub(lamp.receiver).normalize(),stride=(BEAM_PROFILE.rings+1)*(BEAM_PROFILE.segments+1);
 for(let i=0;i<=BEAM_PROFILE.segments;i++){const a=lampIndex*stride+i,b=lampIndex*stride+BEAM_PROFILE.rings*(BEAM_PROFILE.segments+1)+i;
 const origin=lamp.receiver.clone().set(positions.getX(a),positions.getY(a),positions.getZ(a)),end=origin.clone().set(positions.getX(b),positions.getY(b),positions.getZ(b)),ray=end.clone().sub(origin);
 assert.ok(Math.abs(ray.clone().normalize().dot(axis)-Math.cos(photo.angle*(1-photo.penumbra*.7)))<.00001);
 assert.ok(Math.abs(ray.dot(axis)-photo.receivingDistance)<.00001);assert.ok(ray.length()<photo.distance);
 const radial=end.clone().sub(lamp.receiver).addScaledVector(axis,-photo.receivingDistance);assert.ok(Math.abs(radial.length()-(BEAM_PROFILE.startRadius+photo.receivingDistance*Math.tan(photo.angle*(1-photo.penumbra*.7))))<.00001);
 }}kit.dispose();}
});
