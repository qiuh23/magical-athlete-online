import assert from'node:assert/strict';import{createHash}from'node:crypto';import{readFile}from'node:fs/promises';import test from'node:test';
test('historical mouth repair evidence remains intact and replacement sources have fresh geometric audits',async()=>{
 const historical=JSON.parse(await readFile('docs/evidence/refinement-20261022/mouth-surface-repair.json','utf8'));assert.equal(historical.passed,true);assert.equal(historical.version,'surface-mouth-v2');assert.equal(historical.models.length,46);
 for(const model of historical.models){assert.ok(model.minCentrelineGap>.00399&&model.maxCentrelineGap<.00401,model.id);assert.ok(model.matchedShippingVertices>=8,model.id)}
 assert.equal(historical.models.find((r:{id:string})=>r.id==='extra-mile-thief').eyePairs,1);
 // Every source was deliberately replaced, not just the Revolutionary. Keep
 // historical evidence unchanged and verify current files against the new audit.
 const audit=JSON.parse(await readFile('docs/sculpt-20261024/source-audit.json','utf8'));assert.equal(audit.version,'authored-20261024');assert.equal(audit.passed,true);assert.equal(audit.sources.length,153);const hashes=new Map<string,string>();const hash=async(p:string)=>{if(!hashes.has(p))hashes.set(p,createHash('sha256').update(await readFile(p)).digest('hex'));return hashes.get(p)};
 for(const r of audit.sources){assert.equal(r.reopened,true,r.id);assert.equal(r.boundaryEdges,0,r.id);assert.equal(r.looseEdges,0,r.id);assert.equal(await hash(r.source),r.sourceSha256,r.id);assert.equal(await hash(r.glb),r.glbSha256,r.id)}
 for(const id of['banana','leaf-revolutionary']){const f=audit.sources.find((r:{id:string})=>r.id===id).faceAttachment;assert.ok(f.mouthVertices>=60);assert.ok(f.minSurfaceGap>-.012&&f.minSurfaceGap<0);assert.ok(f.maxSurfaceGap>0&&f.maxSurfaceGap<.012);assert.equal(f.verticesGLTF.length,f.mouthVertices)}
});
