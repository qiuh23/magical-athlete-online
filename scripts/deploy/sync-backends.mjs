import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { deploymentRegistry, deploymentSettings, workerVariables } from './ci-release.mjs';

export async function syncBackends(check=false,siteEdition=process.env.SITE_EDITION??'global') {
  const path=new URL('../../public/backends.json',import.meta.url);
  const workerPath=new URL('../../wrangler.jsonc',import.meta.url);
  const settings=deploymentSettings('production');
  const registry=deploymentRegistry(settings,siteEdition);
  const worker=JSON.parse(await readFile(workerPath,'utf8'));
  const variables=workerVariables(settings,worker.vars);
  if(check) {
    if(JSON.stringify(JSON.parse(await readFile(path,'utf8')))!==JSON.stringify(registry))throw Error('public/backends.json differs from deploy/entries.json; run node scripts/deploy/sync-backends.mjs.');
    if(JSON.stringify(worker.vars)!==JSON.stringify(variables))throw Error('wrangler.jsonc variables differ from deploy/entries.json; run node scripts/deploy/sync-backends.mjs.');
  } else {
    await writeFile(path,JSON.stringify(registry)+'\n');
    if(JSON.stringify(worker.vars)!==JSON.stringify(variables))await writeFile(workerPath,JSON.stringify({...worker,vars:variables},null,2)+'\n');
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await syncBackends(process.argv.includes('--check'));
