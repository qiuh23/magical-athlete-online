import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8')),sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const input=read('src/client/scene/environment/floodlight-edge-mounts.json'),record=read('docs/qa/floodlight-rows/edge-mount-inputs.json');
test('natural lamp layout corners retain actual BVH inputs without claiming authorization',()=>{
 assert.equal(input.version,1);assert.deepEqual(Object.keys(input.tracks),['squiggle','boardwalks','bridges']);assert.equal(record.measured.length,96);
 assert.equal(sha(record.output),record.sha256);for(const [p,h] of Object.entries(record.inputs))assert.equal(sha(p),h,p);
 assert.match(record.scope,/layout input only/);assert.match(record.scope,/No new collision/);
 for(const [track,t] of Object.entries(input.tracks) as [string,any][]){assert.equal(t.fixtures.length,8);for(const [i,f] of t.fixtures.entries()){
 assert.equal(f.innerCorners.length,4);const raw=record.measured.filter((m:any)=>m.track===track&&m.fixture===i);assert.equal(raw.length,4);
 const side=i<4?-1:1;for(const [j,c] of f.innerCorners.entries()){const m=raw[j];assert.equal(m.sourceScale,t.referenceScale);assert.equal(m.side,side);assert.equal(m.surface[1],j<2?-.55:-.35);
 assert.ok(Math.abs(c[0]*t.referenceScale-m.inner[0])<1e-10);assert.ok(Math.abs(c[2]*t.referenceScale-m.inner[2])<1e-10);assert.equal(c[1],m.inner[1]);assert.ok(Math.abs(m.inner[2]-m.surface[2]+side*.015)<1e-10);
 assert.ok(Math.abs(m.inner[0]-f.x*t.referenceScale-(j%2===0?-.15:.15))<1e-10);assert.match(m.target,/_base:/);
 }
 }}
});

test('classic connector follows the real rounded sidewall within the bounded 20 mm joint',async()=>{
 const record=read('docs/qa/floodlight-rows/classic-mount-inputs.json');
 assert.equal(sha('src/client/scene/DioramaStadium.tsx'),record.sourceSHA256);
 const {floodlightLayout}=await import('../src/client/scene/environment/floodlights.js');
 for(const track of ['mild','twisty-twirl'] as const){
  const lamps=floodlightLayout(track,{scale:1,lift:0,lowQuality:false});
  for(const lamp of lamps.filter(l=>l.row===1)){
   assert.equal(lamp.base.z,5.9);const points=lamp.connector!.innerCorners;
   assert.deepEqual(points.map(p=>p[1]),[-.66,-.66,-.58,-.58]);
   assert.ok(points.every(p=>Math.abs(p[2]!-5.25827938338963)<1e-10));
  }
 }
 // Recorded endpoint and every intermediate geometric Y segment, not just the ends.
 assert.ok(record.rows.length===4);
 for(const row of record.rows){assert.ok(row.maxDepth<=.020);assert.equal(row.within20mm,true);}
});
