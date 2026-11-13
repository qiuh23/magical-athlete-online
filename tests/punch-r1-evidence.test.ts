import test from'node:test';import assert from'node:assert/strict';import{readFileSync,existsSync}from'node:fs';import{createHash}from'node:crypto';
import{R1_EVIDENCE,R1_SCENE_HASH}from'../src/client/scene/mechanisms/punch-r1/evidence.js';
const proof=JSON.parse(readFileSync('docs/qa/punch-r1-contact/release-evidence.json','utf8'));
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
test('r1 finite release evidence preserves real actor/scene/self results and precise input identity',()=>{
 assert.equal(R1_EVIDENCE.fixtures.length,12);assert.equal(R1_SCENE_HASH,proof.sceneHash);
 assert.equal(createHash('sha256').update(JSON.stringify(proof.inputs)).digest('hex'),proof.sceneHash);
 const sceneRoot=process.env.R1_SCENE_ROOT??'.';
 for(const [p,expected]of Object.entries(proof.inputs)){const path=p.startsWith('src/client/scene/environment/')?`${sceneRoot}/${p}`:existsSync(p)?p:`${sceneRoot}/${p}`;assert.equal(sha(path),expected,p);}
 for(const[p,expected]of Object.entries(proof.proofSHA256))assert.equal(sha(`docs/qa/punch-r1-contact/${p}`),expected,p);
 for(const[p,expected]of Object.entries(proof.auditScriptSHA256))assert.equal(sha(`scripts/recovery/punch-r1/${p}`),expected,p);
 assert.equal(sha(`${sceneRoot}/scripts/recovery/scene-collision.ts`),proof.collisionKernelSHA256);
 assert.equal(sha('public/models/mechanisms/punch-rebuild-r1.glb'),sha('art/mechanisms/punch-rebuild-r1/punch-rebuild-r1.glb'));
 assert.equal(proof.summary.positiveFixtures,12);assert.equal(proof.summary.actorPoseSamples,4812);assert.equal(proof.summary.unexpectedHardPairs,0);assert.ok(proof.summary.maximumDirectionalSoftClearanceM<=.02);
 assert.deepEqual([...new Set(R1_EVIDENCE.fixtures.map(f=>f.node))],[23,24]);
 for(const f of R1_EVIDENCE.fixtures){assert.equal(f.sceneHash,R1_SCENE_HASH);assert.equal(f.foundationBottom,.10399999672174455);assert.equal(f.solution.rigVersion,'punch-rebuild-r1');}
});
