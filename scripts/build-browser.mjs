import { spawnSync } from 'node:child_process';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import './review-build-guard.mjs';
import { syncBackends } from './deploy/sync-backends.mjs';
import { writeBuildInfo } from './build-info.mjs';
import { buildLobby } from './build-lobby.mjs';
if(process.env.SITE_EDITION && process.env.SITE_EDITION!=='global')throw Error('Worker builds require SITE_EDITION=global.');
process.env.SITE_EDITION='global';
await syncBackends(false,'global');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const r=spawnSync(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'build','--outDir','dist/browser'],{cwd:root,env:{...process.env,VITE_HOST_MODE:'browser'},stdio:'inherit',windowsHide:true});
if(r.error)throw r.error;
if(r.status!==0)process.exitCode=r.status??1;
else {
  await (await import('node:fs/promises')).writeFile(resolve(root,'dist/browser/site-edition.json'),JSON.stringify({siteEdition:'global'}));
  await writeBuildInfo(resolve(root, 'dist/browser'));
  await buildLobby();
}
