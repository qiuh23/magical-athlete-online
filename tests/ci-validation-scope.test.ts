import test from 'node:test';
import assert from 'node:assert/strict';
const {validationSuite}=await import(new URL('../scripts/ci-validation-scope.mjs',import.meta.url).href);
test('deployment-only final checks can omit a repeated race while defaults stay intact',()=>{
  assert.equal(validationSuite(undefined,'fix\n\nValidation-Scope: deployment',['scripts/deploy/ci-artifacts.sh']),'deployment');
  assert.equal(validationSuite(undefined,'ordinary change',[]),'eight-only');
  assert.equal(validationSuite('all','Validation-Scope: deployment',[]),'all');
  assert.equal(validationSuite(undefined,'Validation-Scope: ability-interactions',[]),'ability-interactions');
});
test('rules changes keep the normal game checks even with a deployment trailer',()=>{
  for(const path of ['src/engine/runtime.ts','src/shared/tracks.ts'])assert.equal(validationSuite(undefined,'Validation-Scope: deployment',[path]),'eight-only');
  assert.throws(()=>validationSuite('unknown','',[]));
});
