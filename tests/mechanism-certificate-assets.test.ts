import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import evidence from '../docs/qa/map-mechanisms/certified-trip-evidence.json' with {type:'json'};
test('certified contact source geometry and placement inputs match the frozen audit',()=>{
 for(const[path,record]of Object.entries(evidence.sources)){if(!path.startsWith('src/')&&!path.startsWith('public/'))continue;assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),record.sha256,`Certificate must be re-audited after ${path} changes`);}
});
