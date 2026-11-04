// Offline staging only. This never installs configuration, requests a certificate,
// accesses a cloud API, or changes the checked-in activation flags.
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from '../lobby/routing.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, process.argv[2] || '.local/https-lobby');
// Keep generated deployment drafts away from source, secrets, and system paths.
if (!output.startsWith(resolve(root,'.local') + (process.platform === 'win32' ? '\\' : '/'))) throw Error('Output must be a child of this checkout .local/ directory.');
const config = validateConfig(JSON.parse(await readFile(resolve(root,'lobby/config.json'),'utf8')));
if (process.argv.includes('--activate-domestic')) {
  config.lobbies.aliyun.enabled = true;
  for (const game of ['athlete','wizard']) config.entries[game].aliyun.enabled = true;
}
await mkdir(output,{recursive:true});
await cp(resolve(root,'lobby'),resolve(output,'lobby'),{recursive:true});
await writeFile(resolve(output,'lobby/config.json'),JSON.stringify(config,null,2)+'\n');
const template = await readFile(resolve(root,'deploy/nginx-lobby.conf.template'),'utf8');
await writeFile(resolve(output,'nginx-lobby.conf'),template.replaceAll('__APEX_DOMAIN__','magical-athlete-online.cn'));
console.log(`Offline lobby and Nginx drafts: ${output}. Nothing installed or activated online.`);
