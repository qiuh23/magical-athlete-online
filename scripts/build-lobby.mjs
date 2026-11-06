import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from '../lobby/routing.mjs';
import { writeBuildInfo } from './build-info.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The same static files are served at CF /lobby/ and directly at the ECS apex.
export async function buildLobby(targets = ['dist/client/lobby', 'dist/browser/lobby']) {
  const source=JSON.parse(await readFile(resolve(root,'lobby/config.json'),'utf8'));
  for (const target of targets) {
    const output = resolve(root, target);
    await mkdir(dirname(output), { recursive: true });
    await rm(output, { recursive: true, force: true });
    await cp(resolve(root, 'lobby'), output, { recursive: true });
    const siteEdition=target.includes('browser')?'global':'cn',server=siteEdition==='cn'?'aliyun':'cloudflare';
    const config=validateConfig({version:2,siteEdition,lobbies:{[server]:source.lobbies[server]},entries:Object.fromEntries(Object.entries(source.entries).map(([game,entries])=>[game,{[server]:entries[server]}]))});
    await (await import('node:fs/promises')).writeFile(resolve(output,'config.json'),JSON.stringify(config)+'\n');
    await writeBuildInfo(output);
  }
  console.log(`Lobby copied to ${targets.join(', ')} (domestic HTTPS activation is explicit).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildLobby(process.argv.includes('--browser') ? ['dist/browser/lobby'] : undefined);
}
