import {createHash} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {mkdir,mkdtemp,readFile,realpath,rename,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,basename} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const directory=dirname(fileURLToPath(import.meta.url));
const allowedUsers={'athlete-deploy':'production','athlete-preview-deploy':'preview'};
export function releaseName(commit,buildId){
  if(!/^[a-f0-9]{40}$/.test(commit))throw Error('Invalid release commit.');
  if(buildId===undefined||buildId==='')return commit;
  if(!/^[1-9][0-9]*$/.test(String(buildId))||!Number.isSafeInteger(Number(buildId)))throw Error('Invalid release build ID.');
  return `${commit}-${buildId}`;
}
export function rollbackDestinationCommit(active,base){
  if(typeof active!=='string'||active!==join(base,'releases',basename(active))||!/^[a-f0-9]{40}(?:-[1-9][0-9]*)?$/.test(basename(active)))throw Error('Unexpected rollback destination.');
  const [commit,buildId]=basename(active).split('-');
  releaseName(commit,buildId);
  return commit;
}
export function validateRequest(encoded,sudoUser){
  if(typeof encoded!=='string'||encoded.length>32_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw Error('Invalid deployment request encoding.');
  const value=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
  if(!value||Object.keys(value).some(key=>!['action','target','commit','runId','artifactUrl','artifactSha256','prNumber'].includes(key)))throw Error('Unexpected deployment request fields.');
  if(!Object.hasOwn(allowedUsers,sudoUser)||value.target!==allowedUsers[sudoUser])throw Error('Deployment target is not permitted for this operating-system user.');
  if(!/^[a-f0-9]{40}$/.test(value.commit)||!Number.isSafeInteger(value.runId)||value.runId<=0)throw Error('Invalid commit or workflow run.');
  if(value.action!==undefined&&!['install','rollback'].includes(value.action))throw Error('Invalid deployment action.');
  if(value.action==='rollback'){
    if(value.artifactUrl!==undefined||value.artifactSha256!==undefined||(value.prNumber!==undefined&&(!Number.isSafeInteger(value.prNumber)||value.prNumber<=0)))throw Error('Invalid rollback metadata.');
    return value;
  }
  if(!/^[a-f0-9]{64}$/.test(value.artifactSha256))throw Error('Invalid artifact hash.');
  if(value.target==='preview'?(!Number.isSafeInteger(value.prNumber)||value.prNumber<=0):(value.prNumber!==undefined&&value.prNumber!==0))throw Error('Invalid deployment pull-request metadata.');
  const url=new URL(value.artifactUrl);
  if(url.protocol!=='https:'||url.username||url.password||url.hash||(url.port&&url.port!=='443')||!/^productionresultssa[a-z0-9]*\.blob\.core\.windows\.net$/.test(url.hostname))throw Error('Artifact URL is not a trusted GitHub Actions result-storage origin.');
  return value;
}

async function run(command,args,env){
  await new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:'inherit',env});
    child.once('error',reject);
    child.once('exit',code=>code===0?resolve():reject(Error(`Deployment operation failed (${code}).`)));
  });
}

export async function install(encoded,sudoUser,locked=false){
  if(process.getuid?.()!==0)throw Error('The deployment installer must be run through its constrained sudo entrypoint.');
  const request=validateRequest(encoded,sudoUser);
  const environment={PATH:'/opt/node/bin:/usr/sbin:/usr/bin:/sbin:/bin',HOME:'/root',LANG:'C.UTF-8',DEPLOY_TARGET:request.target,DEPLOY_BUILD_ID:String(request.runId),DEPLOY_LOCK_HELD:'true',SUDO_USER:sudoUser};
  if(!locked){
    await run('/usr/bin/flock',['--wait','900',`/run/lock/magical-athlete-${request.target}.deploy.lock`,'/opt/node/bin/node',fileURLToPath(import.meta.url),'--locked',encoded],environment);
    return;
  }
  const stateDirectory='/var/lib/magical-athlete-deploy-state';
  await mkdir(stateDirectory,{recursive:true,mode:0o700});
  const statePath=join(stateDirectory,`${request.target}.json`);
  let previous;
  try{previous=JSON.parse(await readFile(statePath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(previous&&(previous.runId>request.runId||(previous.runId===request.runId&&previous.commit!==request.commit)))throw Error('A newer workflow deployment is already active; refusing this stale artifact.');
  if(request.action==='rollback'){
    const base=request.target==='production'?'/opt/magical-athlete':'/opt/magical-athlete-preview';
    const current=await realpath(join(base,'current'));
    if(current!==join(base,'releases',releaseName(request.commit,request.runId))){console.log(`No rollback needed for ${request.target}; this attempt is not active.`);return;}
    if(previous?.runId!==request.runId||previous.commit!==request.commit)throw Error('Rollback requires the current successful deployment to belong to this exact workflow attempt.');
    await run('/bin/bash',[join(directory,'rollback.sh')],environment);
    const active=await realpath(join(base,'current'));
    const activeCommit=rollbackDestinationCommit(active,base);
    const nextState=`${statePath}.next-${process.pid}`;
    await writeFile(nextState,JSON.stringify({...previous,rolledBack:true,activeCommit,rolledBackAt:new Date().toISOString()}),{mode:0o600});
    await rename(nextState,statePath);
    console.log(`Rolled back ${request.target} workflow run ${request.runId} to ${basename(active)}.`);
    return;
  }
  const work=await mkdtemp(join(tmpdir(),'magical-athlete-deploy-'));
  try{
    const response=await fetch(request.artifactUrl,{redirect:'error',signal:AbortSignal.timeout(900_000)});
    if(!response.ok||!response.body)throw Error('Unable to download the GitHub Actions artifact.');
    const maximum=512*1024*1024;
    if(Number(response.headers.get('content-length'))>maximum)throw Error('Artifact exceeds the deployment size limit.');
    let bytes=0;
    const digest=createHash('sha256');
    const limit=new Transform({transform(chunk,_encoding,callback){bytes+=chunk.length;if(bytes>maximum){callback(Error('Artifact exceeds the deployment size limit.'));return;}digest.update(chunk);callback(null,chunk);}});
    const zip=join(work,'artifact.zip');
    await pipeline(response.body,limit,createWriteStream(zip,{mode:0o600}));
    if(digest.digest('hex')!==request.artifactSha256)throw Error('GitHub artifact ZIP SHA256 mismatch.');
    await run('/usr/bin/python3',[join(directory,'unpack-ci-artifact.py'),zip,work,Buffer.from(JSON.stringify(request)).toString('base64')],environment);
    await run('/bin/bash',[join(directory,'update.sh'),request.commit,join(work,'aliyun.tar.gz')],environment);
    const nextState=`${statePath}.next-${process.pid}`;
    await writeFile(nextState,JSON.stringify({target:request.target,commit:request.commit,runId:request.runId,...(request.prNumber?{prNumber:request.prNumber}:{}),deployedAt:new Date().toISOString()}),{mode:0o600});
    await rename(nextState,statePath);
    console.log(`Deployed ${request.target} ${request.commit} from workflow run ${request.runId}.`);
  }finally{await rm(work,{recursive:true,force:true});}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{await install(process.argv[2]==='--locked'?process.argv[3]:process.argv[2],process.env.SUDO_USER,process.argv[2]==='--locked');}
  catch(error){console.error(error instanceof Error?error.message:'Deployment failed.');process.exitCode=1;}
}
