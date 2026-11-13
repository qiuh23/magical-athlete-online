import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const hash=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
test('integrated release binds actual bootstrap, Board, safety gates and all tracked inputs by content',()=>{
 const manifest=JSON.parse(readFileSync('docs/qa/athlete-release/source-manifest.json','utf8'));
 assert.equal(hash(JSON.stringify(manifest.files)),manifest.aggregateSHA256);
 for(const path of ['src/client/scene-entry.ts','src/client/App.tsx','src/client/scene/Board3D.tsx','src/client/scene/environment/scene-readiness.ts','src/client/scene/mechanisms/runtime-entry-guards.ts','src/client/scene/environment/scene-mechanisms.ts','src/client/scene/environment/VenueLighting.tsx','src/client/scene/mechanisms/punch-r1/motion.ts','src/client/scene/mechanisms/punch-r1/controller.ts','src/client/scene/asset-loading.ts','tests/release-source-identity.test.ts'])assert.ok(manifest.files[path],path);
 for(const[path,info]of Object.entries(manifest.files) as [string,{bytes:number;sha256:string}][]){const bytes=readFileSync(path);assert.equal(bytes.length,info.bytes,path);assert.equal(hash(bytes),info.sha256,path);}
 const board=readFileSync('src/client/scene/Board3D.tsx','utf8');assert.ok(board.startsWith("import './asset-loading.js';"));
 for(const path of ['src/client/scene/environment/scene-mechanisms.ts','src/client/scene/mechanisms/punch-r1/controller.ts'])assert.doesNotMatch(readFileSync(path,'utf8'),/BUILD_COMMIT/);
});
