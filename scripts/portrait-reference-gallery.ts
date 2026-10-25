import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Avatar } from '../src/client/avatars.js';
import { CHARACTERS } from '../src/shared/characters.js';

// Visual review pairs the actual SVG component with the shipped model preview.
// A bounding-box test cannot detect a wrong species, costume, or accessory.
const output = resolve(process.argv[2] ?? 'output/playwright/portrait-reference-gallery');
await mkdir(output, { recursive: true });
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const reviewed = new Set<string>();
const pages: string[] = [];
const records: { id: string; name: string; pack: string; preview: string; recognition: string }[] = [];
for (const pack of ['original', 'second-wind', 'extra-mile', 'leaf', 'wurstii']) {
  const path = pack === 'original' ? 'public/models/toy-racers.manifest.json' : `public/models/${pack}/manifest.json`;
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  const models = manifest.models.filter((model: { id: string }) => CHARACTERS.some(character => character.id === model.id));
  for (let start = 0; start < models.length; start += 12) {
    const cards: string[] = [];
    for (const model of models.slice(start, start + 12)) {
      if (reviewed.has(model.id)) throw new Error(`Duplicate model reference: ${model.id}`);
      reviewed.add(model.id);
      const name = CHARACTERS.find(character => character.id === model.id)!.nameZh;
      const recognition = model.recognition ?? model.referenceBasis ?? '';
      const portrait = renderToStaticMarkup(createElement(Avatar, { id: model.id }), { identifierPrefix: `${model.id}-` });
      const preview = (await readFile(`public${model.modelPreview}`)).toString('base64');
      // The rider and mount are separate runtime GLBs. Compare both components.
      const mount = model.id === 'hog-knight'
        ? `<img class="mount" alt="独立野猪坐骑" src="data:image/png;base64,${(await readFile('public/models/second-wind/avatars/hog-knight-hog.png')).toString('base64')}">`
        : '';
      cards.push(`<article data-character="${escape(model.id)}"><h2>${escape(name)} <small>${escape(model.id)}</small></h2><div class="pair"><section>${portrait}<label>SVG 卡面</label></section><section><div class="model"><img alt="${escape(name)}模型" src="data:image/png;base64,${preview}">${mount}</div><label>现有模型${mount ? ' + 独立坐骑' : ''}</label></section></div></article>`);
      records.push({ id: model.id, name, pack, preview: model.modelPreview, recognition });
    }
    const page = `${pack}-${start / 12}.html`;
    pages.push(page);
    await writeFile(resolve(output, page), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>卡面与模型对照 · ${pack}</title><style>
      *{box-sizing:border-box}body{margin:0;padding:12px;background:#dddcd5;color:#293b36;font:13px system-ui,sans-serif}main{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}article{background:#fffaf0;border-radius:8px;padding:8px}h2{font-size:13px;margin:4px 0 8px;text-align:center}small{display:block;font:11px system-ui,sans-serif;margin-top:3px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:4px}section{text-align:center}svg,.model{width:100%;height:180px}img{width:100%;height:100%;object-fit:contain}.model{position:relative}.mount{position:absolute;right:0;bottom:0;width:47%;height:47%;background:#fffaf0;border-radius:8px}label{display:block;color:#536355;font-size:11px}footer{margin-top:14px;font-size:12px}@media(max-width:700px){main{grid-template-columns:repeat(2,minmax(0,1fr))}svg,.model{height:145px}}
      </style><main>${cards.join('')}</main><footer>对照 authored-sculpt-final-20261024 模型预览。骑士含独立野猪；咬痕为默认形态。预览用于核对造型，不代表本次重新渲染或修改了 GLB。</footer></html>`);
  }
}
if (reviewed.size !== CHARACTERS.length) throw new Error(`Expected ${CHARACTERS.length} model references, got ${reviewed.size}`);
await writeFile(resolve(output, 'index.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>角色卡面与模型对照</title><h1>151 名角色对照</h1><ul>${pages.map(page => `<li><a href="${page}">${page}</a></li>`).join('')}</ul></html>`);
await writeFile(resolve(output, 'references.json'), JSON.stringify(records, null, 2) + '\n');
console.log(`Wrote ${reviewed.size} paired references across ${pages.length} pages to ${output}`);
