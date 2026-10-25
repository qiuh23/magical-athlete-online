import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Avatar } from '../src/client/avatars.js';
import { SECOND_WIND_CHARACTERS } from '../src/shared/second-wind.js';
import { FAN_CHARACTERS } from '../src/shared/fan-expansions.js';
import { WURSTII_CHARACTERS } from '../src/shared/wurstii.js';

/** Published SVG files and live portraits share the same authored drawing. */
const packs = [
  ['second-wind', SECOND_WIND_CHARACTERS],
  ['extra-mile', FAN_CHARACTERS.filter(c => c.edition === 'extra-mile')],
  ['leaf', FAN_CHARACTERS.filter(c => c.edition === 'leaf')],
  ['wurstii', WURSTII_CHARACTERS],
] as const;
for (const [pack, characters] of packs) {
  const directory = new URL(`../public/avatars/${pack}/`, import.meta.url);
  await mkdir(directory, {recursive:true});
  for (const character of characters) {
    const svg = renderToStaticMarkup(createElement(Avatar, {id:character.id})).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" ');
    await writeFile(new URL(`${character.id}.svg`, directory), svg + '\n');
  }
  const modelManifest = new URL(`../public/models/${pack}/manifest.json`, import.meta.url);
  const manifest = JSON.parse(await readFile(modelManifest,'utf8'));
  const previousManifest = JSON.stringify(manifest);
  for (const model of manifest.models) {
    if (!characters.some(c => c.id === model.id)) continue;
    // Portrait publication must not replace previews from the 3D asset pipeline.
    model.modelPreview ??= pack === 'wurstii' ? model.portrait : `/models/${pack}/avatars/${model.id}.png`;
    model.avatar = `/avatars/${pack}/${model.id}.svg`;
    model.avatarStyle = 'flat-cartoon-svg';
  }
  if (JSON.stringify(manifest) !== previousManifest) {
    await writeFile(modelManifest, JSON.stringify(manifest,null,2)+'\n');
  }
  console.log(`Exported ${characters.length} ${pack} cartoon SVG portraits.`);
}
