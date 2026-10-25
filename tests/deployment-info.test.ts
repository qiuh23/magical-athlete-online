import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeploymentInfo } from '../src/client/deployment-info.js';
const commit='a'.repeat(40);
test('preview metadata names its exact PR, source and run while production stays distinct',()=>{
  assert.deepEqual(parseDeploymentInfo({target:'preview',commit,prNumber:23,runId:123}),{target:'preview',commit,prNumber:23,runId:123});
  assert.deepEqual(parseDeploymentInfo({target:'production',commit,prNumber:23,runId:123}),{target:'production',commit,runId:123});
});
test('invalid or incomplete preview metadata cannot claim a verified deployment',()=>{
  for(const value of [null,{}, {target:'preview',commit,runId:123}, {target:'preview',commit,runId:123,prNumber:0}, {target:'preview',commit:'latest',runId:123,prNumber:23}, {target:'production',commit,runId:NaN}, {target:'other',commit,runId:123}])assert.equal(parseDeploymentInfo(value),null);
});
