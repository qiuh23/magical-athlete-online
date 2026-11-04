import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { deploymentRegistry, deploymentSettings } from './ci-release.mjs';

export async function syncBackends(check=false) {
  const path=new URL('../../public/backends.json',import.meta.url);
  const registry=deploymentRegistry(deploymentSettings('production'));
  if(check) {
    if(JSON.stringify(JSON.parse(await readFile(path,'utf8')))!==JSON.stringify(registry))throw Error('public/backends.json differs from deploy/entries.json; run node scripts/deploy/sync-backends.mjs.');
  } else await writeFile(path,JSON.stringify(registry)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await syncBackends(process.argv.includes('--check'));
