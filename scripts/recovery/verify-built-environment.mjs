import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const directory='public/models/environment-rebuilt-v2', files=readdirSync(directory).filter(f=>f.endsWith('.glb'));
assert.equal(files.length,22);
const outputs=[];
for(const product of ['client','browser']) {
  const manifest=JSON.parse(readFileSync(`dist/${product}/asset-manifest.json`,'utf8'));
  for(const file of files){
    const logical=`/models/environment-rebuilt-v2/${file}`,source=readFileSync(`${directory}/${file}`),hash=createHash('sha256').update(source).digest('hex'),url=manifest.urls[logical];
    assert.equal(url,`/game-assets/${hash}.glb`);assert.deepEqual(readFileSync(`dist/${product}${url}`),source);
    outputs.push({product,logical,url,bytes:source.length,sha256:hash});
  }
}
writeFileSync('docs/qa/map-environment-rebuild/built-asset-verification.json',JSON.stringify({scope:'Both build products retain every exact new GLB through unchanged content-hash asset pipeline. Not a live network/cache or browser check.',outputs},null,2));
console.log(`${outputs.length} exact content-hash outputs verified (${files.length} GLBs x 2 products)`);
