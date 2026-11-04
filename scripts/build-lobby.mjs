import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from '../lobby/routing.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
validateConfig(JSON.parse(await readFile(resolve(root, 'lobby/config.json'), 'utf8')));
// The same static files are served at CF /lobby/ and directly at the ECS apex.
const targets = process.argv.includes('--browser') ? ['dist/browser/lobby'] : ['dist/client/lobby', 'dist/browser/lobby'];
for (const target of targets) {
  const output = resolve(root, target);
  await mkdir(dirname(output), { recursive: true });
  await rm(output, { recursive: true, force: true });
  await cp(resolve(root, 'lobby'), output, { recursive: true });
}
console.log(`Lobby copied to ${targets.join(', ')} (domestic HTTPS activation is explicit).`);
