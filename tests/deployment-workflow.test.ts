import test from 'node:test';
import assert from 'node:assert/strict';
const {deploymentCandidate,selectArtifact}=await import(new URL('../scripts/deploy/ci-gate.mjs',import.meta.url).href);
const {deploymentSettings,validateRelease,validateArtifactUrl}=await import(new URL('../scripts/deploy/ci-release.mjs',import.meta.url).href);
const repository='qiuh23/magical-athlete-online',sha='a'.repeat(40),other='b'.repeat(40);
const run={id:123,name:'Checks',path:'.github/workflows/ci.yml',status:'completed',conclusion:'success',event:'pull_request',head_sha:sha,head_branch:'codex/feature',repository:{full_name:repository},head_repository:{full_name:repository}};
const pull={number:23,state:'open',base:{ref:'main',repo:{full_name:repository}},head:{sha,repo:{full_name:repository}}};

test('only current successful own-repository PR heads can update the shared preview',()=>{
  assert.deepEqual(deploymentCandidate(run,repository,pull,other),{target:'preview',commit:sha,runId:123,prNumber:23});
  for(const invalid of [{...run,conclusion:'failure'},{...run,status:'in_progress'},{...run,path:'.github/workflows/other.yml'},{...run,head_repository:{full_name:'attacker/fork'}},{...run,head_sha:other},{...run,event:'workflow_dispatch'}])assert.equal(deploymentCandidate(invalid,repository,pull,other),null);
  for(const invalid of [{...pull,state:'closed'},{...pull,head:{...pull.head,repo:{full_name:'attacker/fork'}}},{...pull,base:{...pull.base,ref:'release'}}])assert.equal(deploymentCandidate(run,repository,invalid,other),null);
});
test('production is restricted to the current checked main push, without merging a PR',()=>{
  const pushed={...run,event:'push',head_branch:'main'};
  assert.deepEqual(deploymentCandidate(pushed,repository,null,sha),{target:'production',commit:sha,runId:123});
  assert.equal(deploymentCandidate(pushed,repository,null,other),null);
  assert.equal(deploymentCandidate({...pushed,head_branch:'codex/feature'},repository,null,sha),null);
});
test('explicit reviewed fork approval permits only its exact preview, never a production push',()=>{
  const fork={...run,head_repository:{full_name:'classmate/fork'}};
  const forkPull={...pull,head:{...pull.head,repo:{full_name:'classmate/fork'}}};
  assert.equal(deploymentCandidate(fork,repository,forkPull,sha),null);
  assert.deepEqual(deploymentCandidate(fork,repository,forkPull,sha,{allowForkPreview:true}),{target:'preview',commit:sha,runId:123,prNumber:23});
  assert.equal(deploymentCandidate({...fork,event:'push',head_branch:'main'},repository,null,sha,{allowForkPreview:true}),null);
  assert.equal(deploymentCandidate(fork,repository,pull,sha,{allowForkPreview:true}),null);
});
test('artifacts must belong to the exact checked own-repository run and retain a digest',()=>{
  const artifact={id:9,name:`aliyun-${sha}`,expired:false,digest:`sha256:${'c'.repeat(64)}`,workflow_run:{id:123,head_sha:sha,repository_id:7,head_repository_id:7}};
  assert.deepEqual(selectArtifact([artifact],artifact.name,123,sha,7),{id:9,sha256:'c'.repeat(64)});
  for(const invalid of [{...artifact,expired:true},{...artifact,digest:null},{...artifact,workflow_run:{...artifact.workflow_run,id:124}},{...artifact,workflow_run:{...artifact.workflow_run,head_repository_id:8}}])assert.throws(()=>selectArtifact([invalid],artifact.name,123,sha,7));
  assert.throws(()=>selectArtifact([artifact,artifact],artifact.name,123,sha,7));
});
test('release metadata and fixed target settings prevent preview from targeting production',()=>{
  const preview={target:'preview',commit:sha,runId:123,prNumber:23};
  assert.equal(validateRelease({...preview},preview).commit,sha);
  for(const invalid of [{...preview,target:'production'},{...preview,commit:other},{...preview,runId:124},{...preview,prNumber:24}])assert.throws(()=>validateRelease(invalid,preview));
  const prod={target:'production',commit:sha,runId:123};
  assert.throws(()=>validateRelease({...prod,prNumber:23},prod));
  assert.equal(deploymentSettings('preview').quota,1);assert.equal(deploymentSettings('production').quota,14);
  assert.notEqual(deploymentSettings('preview').username,deploymentSettings('production').username);
  assert.notEqual(deploymentSettings('preview').workerName,deploymentSettings('production').workerName);
  assert.throws(()=>deploymentSettings('anything'));
});
test('only GitHub artifact storage HTTPS redirects reach the ECS installer',()=>{
  const url='https://productionresultssa14.blob.core.windows.net/actions-results/file.zip?signature=short-lived';
  assert.equal(validateArtifactUrl(url),url);
  for(const invalid of ['http://productionresultssa14.blob.core.windows.net/file.zip','https://productionresultssa14.blob.core.windows.net:8443/file.zip','https://attacker.blob.core.windows.net/file.zip','https://productionresultssa14.blob.core.windows.net.attacker.example/file.zip','https://user:password@productionresultssa14.blob.core.windows.net/file.zip'])assert.throws(()=>validateArtifactUrl(invalid));
});
