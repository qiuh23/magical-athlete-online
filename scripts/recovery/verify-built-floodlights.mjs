import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
const outputs=[];
for(const product of ['client','browser']){
 const manifest=JSON.parse(readFileSync(`dist/${product}/asset-manifest.json`,'utf8'));
 for(const name of ['base','pole','yoke','housing','lenses']){const logical=`/models/floodlights-rebuilt-v3/${name}.glb`,bytes=readFileSync(`public${logical}`),sha256=createHash('sha256').update(bytes).digest('hex'),url=manifest.urls[logical];assert.equal(url,`/game-assets/${sha256}.glb`);assert.deepEqual(readFileSync(`dist/${product}${url}`),bytes);outputs.push({product,logical,url,bytes:bytes.length,sha256});}
}
writeFileSync('docs/qa/floodlights-rebuild-v3/built-asset-verification.json',JSON.stringify({scope:'10 byte-exact production build mappings, not browser cache telemetry',outputs},null,2));console.log('10 floodlight GLB output mappings passed');
