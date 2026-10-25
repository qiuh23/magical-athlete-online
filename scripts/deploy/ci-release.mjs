import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function deploymentSettings(target) {
  if(!['preview','production'].includes(target))throw Error('Unknown deployment target.');
  const preview=target==='preview';
  return {workerName:preview?'magical-athlete-preview':'magical-athlete',
    cloudflareOrigin:preview?'https://magical-athlete-preview.qiuh23.workers.dev':'https://magical-athlete.qiuh23.workers.dev',
    aliyunOrigin:preview?'http://115.29.188.62:8080':'http://115.29.188.62',
    quota:preview?1:14,username:preview?'athlete-preview-deploy':'athlete-deploy'};
}
export function validateRelease(value,expected) {
  if(!value||value.target!==expected.target||value.commit!==expected.commit||value.runId!==expected.runId||(expected.target==='preview'?value.prNumber!==expected.prNumber:value.prNumber!==undefined))throw Error('Artifact deployment identity does not match the verified Checks run.');
  return value;
}
export function validateArtifactUrl(value) {
  const url=new URL(value);
  if(url.protocol!=='https:'||url.port||url.username||url.password||url.hash||!/^productionresultssa[a-z0-9]*\.blob\.core\.windows\.net$/.test(url.hostname))throw Error(`Unsupported GitHub artifact delivery host: ${url.hostname}`);
  return url.href;
}
const output=async(name,value)=>{if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`${name}=${value}\n`);};
const mask=value=>{if(process.env.GITHUB_ACTIONS==='true')console.log(`::add-mask::${value}`);};
async function artifactUrl(release) {
  const response=await fetch(`https://api.github.com/repos/${release.repository}/actions/artifacts/${release.aliyun.id}/zip`,{headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},redirect:'manual',signal:AbortSignal.timeout(20_000)});
  if(response.status!==302)throw Error(`Could not obtain temporary artifact URL (${response.status}).`);
  const url=validateArtifactUrl(response.headers.get('location'));
  mask(url);return url;
}
function aliyun(command,args) {
  try{return JSON.parse(execFileSync('aliyun',['ecs',command,'--RegionId',process.env.ALIYUN_REGION_ID,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:45_000,maxBuffer:2*1024*1024}));}
  catch{throw Error(`Aliyun ${command} failed; credentials and command payload were withheld from logs.`);}
}
export async function invokeAliyun(release,action='install') {
  const settings=deploymentSettings(release.target);
  if(!/^cn-[a-z0-9-]+$/.test(process.env.ALIYUN_REGION_ID??'')||!/^i-[a-z0-9]+$/.test(process.env.ALIYUN_INSTANCE_ID??''))throw Error('Missing fixed Alibaba deployment region/instance.');
  const payload={target:release.target,commit:release.commit,runId:release.runId,...(release.prNumber?{prNumber:release.prNumber}:{})};
  if(action==='rollback')payload.action='rollback';
  else{payload.artifactUrl=await artifactUrl(release);payload.artifactSha256=release.aliyun.sha256;}
  const encoded=Buffer.from(JSON.stringify(payload)).toString('base64');mask(encoded);
  const command=Buffer.from(`#!/usr/bin/env bash\nset -euo pipefail\nexec sudo -- /usr/local/sbin/magical-athlete-ci-install '${encoded}'\n`).toString('base64');mask(command);
  const started=aliyun('RunCommand',['--InstanceId.1',process.env.ALIYUN_INSTANCE_ID,'--Name',`athlete-${release.target}-${action}-${release.runId}`,'--Type','RunShellScript','--Username',settings.username,'--WorkingDir','/tmp','--Timeout','900','--KeepCommand','false','--RepeatMode','Once','--ContentEncoding','Base64','--CommandContent',command]);
  if(typeof started.InvokeId!=='string')throw Error('Cloud Assistant did not return an invocation ID.');
  console.log(`Waiting for Alibaba ${release.target} ${action} invocation ${started.InvokeId}.`);
  const expires=Date.now()+920_000;
  while(Date.now()<expires){
    await new Promise(resolve=>setTimeout(resolve,5000));
    const result=aliyun('DescribeInvocationResults',['--InvokeId',started.InvokeId,'--InstanceId',process.env.ALIYUN_INSTANCE_ID]);
    const row=result.Invocation?.InvocationResults?.InvocationResult?.[0]??result.InvocationResults?.InvocationResult?.[0];
    if(!row)continue;
    const status=row.InvocationStatus;
    if(status==='Success'&&row.ExitCode===0){console.log(`Alibaba ${release.target} ${action} completed for ${release.commit}.`);return;}
    if(['Failed','Timeout','Cancelled','Stopped','Terminated','Invalid'].includes(status))throw Error(`Alibaba ${action} failed (${status}, exit ${row.ExitCode??'unknown'}; invocation ${started.InvokeId}).`);
  }
  throw Error(`Alibaba ${action} result timed out; inspect invocation ${started.InvokeId} before retrying the same build.`);
}
async function prepare(release) {
  const directory=resolve(process.env.WORKER_ARTIFACT_DIR),tool=resolve(process.env.WRANGLER_TOOL_DIR);
  validateRelease(JSON.parse(await readFile(resolve(directory,'release.json'),'utf8')),release);
  validateRelease(JSON.parse(await readFile(resolve(directory,'assets/deployment.json'),'utf8')),release);
  const settings=deploymentSettings(release.target),source=JSON.parse(await readFile('wrangler.jsonc','utf8'));
  const registry={backends:[{id:'cloudflare',origin:'',transport:'worker',enabled:true},{id:'aliyun',origin:settings.aliyunOrigin,transport:'socketio',enabled:true,allowInsecureHttp:true}]};
  await writeFile(resolve(directory,'assets/backends.json'),JSON.stringify(registry));
  await writeFile(resolve(directory,'assets/deployment.json'),JSON.stringify({target:release.target,commit:release.commit,runId:release.runId,...(release.prNumber?{prNumber:release.prNumber}:{})}));
  const config={...source,name:settings.workerName,main:resolve(directory,'worker/index.js'),
    assets:{...source.assets,directory:resolve(directory,'assets')},
    vars:{...source.vars,DUAL_BACKEND_ENABLED:'true',MULTIPLAYER_ROOM_LIMIT:String(settings.quota),PUBLIC_ORIGINS:settings.aliyunOrigin,BACKENDS_CONFIG_JSON:JSON.stringify(registry)}};
  delete config.$schema;
  await mkdir(tool,{recursive:true});
  await writeFile(resolve(tool,'package.json'),JSON.stringify({name:'trusted-worker-deployer',private:true}));
  await writeFile(resolve(tool,'wrangler.json'),JSON.stringify(config));
  await output('worker_name',settings.workerName);
}
async function previous(release) {
  const settings=deploymentSettings(release.target),account=process.env.CLOUDFLARE_ACCOUNT_ID;
  if(!/^[0-9a-f]{32}$/i.test(account??'')||!process.env.CLOUDFLARE_API_TOKEN)throw Error('Missing scoped Cloudflare deployment credentials.');
  const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${settings.workerName}/deployments`,{headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`},signal:AbortSignal.timeout(20_000)});
  if(response.status===404&&release.target==='preview'){await output('version','');return;}
  if(!response.ok)throw Error(`Cannot record the previous Cloudflare deployment (${response.status}).`);
  const body=await response.json(),versions=body.result?.deployments?.[0]?.versions;
  if(body.success!==true||!Array.isArray(versions)||versions.length!==1||versions[0].percentage!==100||!/^[0-9a-f-]{36}$/i.test(versions[0].version_id))throw Error('Expected one full-traffic Cloudflare version for bounded automatic rollback.');
  await output('version',versions[0].version_id);
}
async function connectivity(origin,backendId) {
  const response=await fetch(`${origin}/api/connectivity`,{signal:AbortSignal.timeout(15_000)});
  if(!response.ok)throw Error(`Cannot verify ${backendId} HTTP (${response.status}).`);
  const http=await response.json();
  if(http.ok!==true||http.backendId!==backendId||typeof http.protocolVersion!=='string'||typeof http.rulesVersion!=='string')throw Error('Invalid deployed protocol marker.');
  const url=new URL(backendId==='cloudflare'?'/api/connectivity/ws':'/socket.io/?EIO=4&transport=websocket',origin);url.protocol=url.protocol==='https:'?'wss:':'ws:';
  await new Promise((resolve,reject)=>{
    const socket=new WebSocket(url);let complete=false;
    const finish=error=>{if(complete)return;complete=true;clearTimeout(timer);socket.onmessage=null;socket.onerror=null;socket.onclose=null;socket.close();error?reject(error):resolve();};
    const timer=setTimeout(()=>finish(Error(`${backendId} realtime verification timed out.`)),6000);
    socket.onmessage=event=>{
      try{
        const text=String(event.data);
        if(backendId==='aliyun'&&text.startsWith('0')){socket.send('40{"probe":true}');return;}
        if(backendId==='aliyun'&&text==='2'){socket.send('3');return;}
        const value=backendId==='cloudflare'?JSON.parse(text):text.startsWith('42')?JSON.parse(text.slice(2)):null;
        const marker=backendId==='cloudflare'?value:Array.isArray(value)&&value[0]==='connectivity'?value[1]:null;
        if(!marker)return;
        if(marker.ok!==true||marker.backendId!==backendId||marker.protocolVersion!==http.protocolVersion||marker.rulesVersion!==http.rulesVersion)throw Error('HTTP and realtime versions differ.');
        finish();
      }catch(error){finish(error);}
    };
    socket.onerror=()=>finish(Error(`${backendId} realtime connection failed.`));socket.onclose=()=>finish(Error(`${backendId} realtime closed before verification.`));
  });return http;
}
async function verify(release) {
  const settings=deploymentSettings(release.target);
  const check=async(origin,backendId)=>{
    let last;
    for(let attempt=0;attempt<10;attempt++){
      try{
        const response=await fetch(`${origin}/deployment.json?run=${release.runId}`,{cache:'no-store',signal:AbortSignal.timeout(15_000)});
        if(!response.ok)throw Error(`Deployment metadata unavailable (${response.status}).`);
        validateRelease(await response.json(),release);
        return await connectivity(origin,backendId);
      }catch(error){last=error;await new Promise(resolve=>setTimeout(resolve,2000));}
    }throw last;
  };
  const [cf,ali]=await Promise.all([check(settings.cloudflareOrigin,'cloudflare'),check(settings.aliyunOrigin,'aliyun')]);
  if(cf.protocolVersion!==ali.protocolVersion||cf.rulesVersion!==ali.rulesVersion)throw Error('The two deployed protocol/rules versions differ.');
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`### ${release.target==='preview'?`PR #${release.prNumber} shared preview`:'Production'} deployed\n\nCommit: \`${release.commit}\` · Checks run: ${release.runId}\n\n- [Cloudflare](${settings.cloudflareOrigin})\n- [Aliyun](${settings.aliyunOrigin})\n\n${release.target==='preview'?'This shared preview is replaced by the latest successful own-repository PR; production was not changed.':'Both production entries run the same checked commit.'}\n`);
  console.log(`Verified matching HTTP/realtime, rules and deployment identity on both ${release.target} backends.`);
}
async function cleanup(release) {
  // Only delete the two exact source-run artifacts after both live entries
  // passed verification. Failed releases retain their one-day diagnostics.
  for(const artifact of [release.aliyun,release.worker]){
    const response=await fetch(`https://api.github.com/repos/${release.repository}/actions/artifacts/${artifact.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(20_000)});
    if(response.status!==204&&response.status!==404)throw Error(`Could not remove the consumed build artifact (${response.status}).`);
  }
  console.log('Removed the two consumed build artifacts; installed rollback releases remain on ECS.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const release=JSON.parse(await readFile(process.env.RELEASE_RECORD,'utf8'));
  if(process.argv[2]==='prepare')await prepare(release);
  else if(process.argv[2]==='previous')await previous(release);
  else if(process.argv[2]==='install')await invokeAliyun(release);
  else if(process.argv[2]==='rollback')await invokeAliyun(release,'rollback');
  else if(process.argv[2]==='verify')await verify(release);
  else if(process.argv[2]==='cleanup')await cleanup(release);
  else throw Error('Unknown deployment command.');
}
