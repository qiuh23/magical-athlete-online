import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { syncBackends } from './deploy/sync-backends.mjs';
import { writeBuildInfo } from './build-info.mjs';
import './review-build-guard.mjs';
const run=(script,args,siteEdition)=>{
 const result=spawnSync(process.execPath,[resolve(script),...args],{env:{...process.env,SITE_EDITION:siteEdition},stdio:'inherit',windowsHide:true});
 if(result.error)throw result.error;if(result.status!==0)throw Error(`Build failed: ${script}`);
};
await syncBackends(false,'cn');
run('node_modules/vite/bin/vite.js',['build'],'cn');
await writeFile('dist/client/site-edition.json',JSON.stringify({siteEdition:'cn'}));
await writeBuildInfo('dist/client');
run('node_modules/typescript/bin/tsc',['-p','tsconfig.server.json'],'cn');
run('scripts/build-browser.mjs',[],'global');
// Keep the tracked development registry deterministic after both products.
await syncBackends(false,'global');
