import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const shaPattern=/^[0-9a-f]{40}$/;
export function deploymentCandidate(run, repository, pull, mainSha, {allowForkPreview=false}={}) {
  if (run?.name!=='Checks'||run.path!=='.github/workflows/ci.yml'||run.status!=='completed'||run.conclusion!=='success'||!Number.isSafeInteger(run.id)||run.id<=0||!shaPattern.test(run.head_sha??'')||run.repository?.full_name!==repository) return null;
  const ownHead=run.head_repository?.full_name===repository;
  if(ownHead&&run.event==='push'&&run.head_branch==='main'&&run.head_sha===mainSha)return {target:'production',commit:run.head_sha,runId:run.id};
  if(run.event==='pull_request'&&(ownHead||allowForkPreview)&&pull?.state==='open'&&pull.base?.ref==='main'&&pull.base.repo?.full_name===repository&&pull.head?.repo?.full_name===run.head_repository?.full_name&&pull.head.sha===run.head_sha&&Number.isSafeInteger(pull.number)&&pull.number>0)return {target:'preview',commit:run.head_sha,runId:run.id,prNumber:pull.number};
  return null;
}
export function selectArtifact(artifacts,name,runId,commit,repositoryId,headRepositoryId=repositoryId) {
  const matches=artifacts.filter(item=>item.name===name&&!item.expired&&item.workflow_run?.id===runId&&item.workflow_run?.head_sha===commit&&item.workflow_run?.repository_id===repositoryId&&item.workflow_run?.head_repository_id===headRepositoryId);
  if(matches.length!==1||!Number.isSafeInteger(matches[0].id)||!/^sha256:[0-9a-f]{64}$/.test(matches[0].digest??''))throw Error(`Expected one intact ${name} artifact from the verified own-repository run.`);
  return {id:matches[0].id,sha256:matches[0].digest.slice(7)};
}
export function githubClient(repository,token=process.env.GITHUB_TOKEN) {
  if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)||!token)throw Error('Missing trusted repository identity or GitHub token.');
  return async path=>{
    const response=await fetch(`https://api.github.com/repos/${repository}${path}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(20_000)});
    if(!response.ok)throw Error(`GitHub metadata request failed (${response.status}).`);
    return response.json();
  };
}
async function pullFor(run,get) {
  const numbers=(run.pull_requests??[]).map(p=>p.number).filter(Number.isSafeInteger);
  if(!numbers.length)numbers.push(...(await get(`/commits/${run.head_sha}/pulls`)).map(p=>p.number));
  for(const number of numbers){const pull=await get(`/pulls/${number}`);if(pull.head.sha===run.head_sha&&pull.state==='open')return pull;}
  return null;
}
export async function resolveDeployment(repository,runId,token=process.env.GITHUB_TOKEN,{allowForkPreview=false,actor}={}) {
  const get=githubClient(repository,token),run=await get(`/actions/runs/${runId}`),repo=await get('');
  if(allowForkPreview){
    if(!actor)throw Error('Fork preview requires an explicit maintainer dispatch.');
    const permission=await get(`/collaborators/${encodeURIComponent(actor)}/permission`);
    if(!['admin','maintain','write'].includes(permission.permission))throw Error('Only a repository maintainer may approve a fork preview.');
  }
  const main=(await get('/git/ref/heads/main')).object.sha;
  const pull=run.event==='pull_request'?await pullFor(run,get):null;
  const candidate=deploymentCandidate(run,repository,pull,main,{allowForkPreview});
  if(!candidate)return null;
  if(candidate.target==='preview'){
    const recent=await get('/actions/workflows/ci.yml/runs?event=pull_request&status=success&per_page=50');
    for(const newer of recent.workflow_runs??[]){
      if(newer.id<=run.id||newer.head_repository?.full_name!==repository)continue;
      if(deploymentCandidate(newer,repository,await pullFor(newer,get),main))return null;
    }
  }
  const artifacts=(await get(`/actions/runs/${run.id}/artifacts?per_page=100`)).artifacts??[];
  return {...candidate,repository,repositoryId:repo.id,
    aliyun:selectArtifact(artifacts,`aliyun-${run.head_sha}`,run.id,run.head_sha,repo.id,run.head_repository.id),
    worker:selectArtifact(artifacts,`worker-${run.head_sha}`,run.id,run.head_sha,repo.id,run.head_repository.id)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
  const runId=Number(process.env.CHECKS_RUN_ID||event.workflow_run?.id||event.inputs?.checks_run_id);
  if(!Number.isSafeInteger(runId)||runId<=0)throw Error('Missing verified Checks run ID.');
  const allowForkPreview=process.env.GITHUB_EVENT_NAME==='workflow_dispatch'&&([true,'true'].includes(event.inputs?.allow_fork_preview)||process.env.ALLOW_FORK_PREVIEW==='true');
  const release=await resolveDeployment(process.env.GITHUB_REPOSITORY,runId,process.env.GITHUB_TOKEN,{allowForkPreview,actor:process.env.GITHUB_ACTOR});
  if(release&&process.env.EXPECTED_TARGET&&(release.target!==process.env.EXPECTED_TARGET||release.commit!==process.env.EXPECTED_COMMIT||String(release.prNumber??0)!==process.env.EXPECTED_PR_NUMBER))throw Error('Queued deployment inputs no longer match the trusted release selection.');
  if(!release){
    if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,'deploy=false\n');
    if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'Deployment skipped: the build is failed, stale, closed, superseded, or a fork without explicit maintainer approval. No entry was updated.\n');
    console.log('Skipped: failed, fork, stale, closed or superseded build.');
  }
  else{
    if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`deploy=true\ntarget=${release.target}\ncommit=${release.commit}\nrun_id=${release.runId}\npr_number=${release.prNumber??0}\n`);
    if(process.env.RELEASE_RECORD)await writeFile(process.env.RELEASE_RECORD,JSON.stringify(release));
    console.log(`Verified ${release.target} build ${release.commit} from Checks ${runId}.`);
  }
}
