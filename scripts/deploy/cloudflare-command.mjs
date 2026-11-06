import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {resolveDeployment} from './ci-gate.mjs';
import {retryCloudflare,transientFailure} from './cloudflare-retry.mjs';

export async function runCloudflareCommand(action,{directory=process.env.WRANGLER_TOOL_DIR,previous=process.env.PREVIOUS_WORKER_VERSION,checkCurrent=async()=>{
  const release=JSON.parse(await readFile(process.env.RELEASE_RECORD,'utf8'));
  const current=await resolveDeployment(release.repository,release.runId,process.env.GITHUB_TOKEN,{allowForkPreview:process.env.ALLOW_FORK_PREVIEW==='true',actor:process.env.GITHUB_ACTOR});
  if(!current||current.commit!==release.commit||current.target!==release.target)throw Error('Deployment was superseded; refusing to publish an old checked build.');
},execute=args=>spawnSync(process.execPath,[resolve(directory,'node_modules/wrangler/bin/wrangler.js'),...args],{cwd:directory,env:process.env,encoding:'utf8',timeout:240000,maxBuffer:4*1024*1024}),sleep}={}){
  if(!['deploy','rollback'].includes(action))throw Error('Unsupported fixed Worker operation.');
  if(action==='rollback'&&!/^[0-9a-f-]{36}$/i.test(previous??''))throw Error('Missing exact previous Worker version.');
  const args=action==='deploy'?['deploy','--no-bundle','--config','wrangler.json']:['rollback',previous,'--yes','--config','wrangler.json','--message','Paired deployment failed'];
  await retryCloudflare(async()=>{
    const result=execute(args),output=String(result.stdout??'')+String(result.stderr??'');
    if(output)process.stdout.write(output);
    if(result.status===0)return {status:200};
    if(!transientFailure(output))throw Error('Fixed Worker command failed; inspect its preceding output.');
    return {status:503};
  },{sleep,beforeAttempt:action==='deploy'?checkCurrent:async()=>{},onRetry:attempt=>console.log(`Cloudflare temporary failure; retry ${attempt}/3 with the same checked artifact.`)}).then(result=>{if(result.status!==200)throw Error('Cloudflare is still unavailable after bounded retries.');});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await runCloudflareCommand(process.argv[2]);
