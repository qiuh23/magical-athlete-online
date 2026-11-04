import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const {validationSuite}=await import(new URL('../scripts/ci-validation-scope.mjs',import.meta.url).href);

test('automatic releases cannot select gameplay or browser suites through trailers or inputs',()=>{
  for(const event of ['push','pull_request']) for(const requested of [undefined,'release','all','deployment','eight-only','ability-interactions']) {
    assert.equal(validationSuite(requested,'Validation-Scope: deployment',['src/engine/runtime.ts'],event),'release');
  }
  assert.equal(validationSuite(undefined,'ordinary change',[]),'release');
});

test('explicit manual suites preserve opt-in paths and the deployment rule-change guard',()=>{
  for(const suite of ['release','all','eight-only','ability-interactions','deployment'])assert.equal(validationSuite(suite,'',[],'workflow_dispatch'),suite);
  assert.equal(validationSuite(undefined,'Validation-Scope: deployment',[],'workflow_dispatch'),'release');
  for(const path of ['src/engine/runtime.ts','src/shared/tracks.ts'])assert.equal(validationSuite('deployment','',[path],'workflow_dispatch'),'eight-only');
  assert.throws(()=>validationSuite('unknown','',[],'workflow_dispatch'));
});

test('release workflow keeps artifact contracts and makes every browser or full gameplay step manual',()=>{
  const workflow=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
  assert.match(workflow,/^name: Checks$/m);
  assert.match(workflow,/default: release/);
  for(const file of ['deployment-workflow','ci-installer','build-info'])assert.ok(workflow.includes(`tests/${file}.test.ts`));
  assert.match(workflow,/scripts\/deploy\/ci-artifacts\.sh/);
  assert.match(workflow,/node-version: 24/);
  assert.match(workflow,/pnpm install --frozen-lockfile/);
  const steps=workflow.split(/(?=^      - )/m);
  for(const step of steps.filter(step=>/pnpm (?:exec playwright|test\s*$)/m.test(step)))assert.match(step,/if:.*github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow,/Validate release, entry, protocol and artifact contracts\s+if: steps\.validation\.outputs\.suite == 'release'/);
  assert.match(workflow,/Install browsers only for explicit manual browser suites\s+if:.*suite != 'release'/);
  assert.doesNotMatch(workflow,/matrix:/);
});

test('production typechecking retains strict source and Worker coverage without browser test roots',()=>{
  const config=JSON.parse(readFileSync(new URL('../tsconfig.release.json',import.meta.url),'utf8'));
  assert.equal(config.extends,'./tsconfig.json');
  assert.deepEqual(config.include,['src','vite.config.ts']);
  assert.equal(config.compilerOptions,undefined);
  const scripts=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).scripts;
  assert.match(scripts['typecheck:release'],/tsconfig\.release\.json/);
  assert.match(scripts['typecheck:release'],/tsconfig\.worker\.json/);
  assert.match(scripts.typecheck,/tsc --noEmit/);
});
