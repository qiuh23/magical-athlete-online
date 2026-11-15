import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from '../lobby/routing.mjs';
import { writeBuildInfo } from './build-info.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The tracked lobby stylesheet contains generated fallback values, not another
// token definition. Updating it explicitly keeps direct/static and built lobbies
// identical while ui-theme.css remains the only maintained token source.
function replaceVariables(text, replace) {
  const variable = /var\(\s*(--[\w-]+)/g;
  let result = '', start = 0, match;
  while ((match = variable.exec(text))) {
    let end = variable.lastIndex, depth = 1, quote = '';
    for (; end < text.length && depth; end++) {
      const character = text[end];
      if (quote) {
        if (character === '\\') end++;
        else if (character === quote) quote = '';
      } else if (character === '"' || character === "'") quote = character;
      else if (character === '(') depth++;
      else if (character === ')') depth--;
    }
    result += text.slice(start, match.index) + replace(match[1], text.slice(match.index, end));
    start = end;
    variable.lastIndex = end;
  }
  return result + text.slice(start);
}

export function renderLobbyStyle(style, theme) {
  const rootTokens = theme.match(/^:root\s*\{([\s\S]*?)^\}/m)[1];
  const tokens = Object.fromEntries([...rootTokens.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map(([, name, value]) => [name, value.trim()]));
  const baseline = JSON.parse(theme.match(/\/\* @lobby-baseline\s*([\s\S]*?)\s*@end-lobby-baseline \*\//)[1]);
  Object.assign(tokens, baseline);
  const value = name => replaceVariables(tokens[name], (nested, original) => tokens[nested] === undefined ? original : value(nested));
  return replaceVariables(style, (name, original) => tokens[name] === undefined ? original : `var(${name}, ${value(name)})`);
}

export async function generateLobbyStyle() {
  const path = resolve(root, 'lobby/style.css');
  const [style, theme] = await Promise.all([readFile(path, 'utf8'), readFile(resolve(root, 'src/client/ui-theme.css'), 'utf8')]);
  const generated = renderLobbyStyle(style, theme);
  if (generated !== style) {
    await writeFile(path, generated);
    console.log('Regenerated lobby/style.css fallbacks from src/client/ui-theme.css.');
  }
  return generated;
}

// The same static files are served at CF /lobby/ and directly at the ECS apex.
export async function buildLobby(targets = ['dist/client/lobby', 'dist/browser/lobby']) {
  await generateLobbyStyle();
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
