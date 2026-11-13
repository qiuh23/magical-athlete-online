import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('public source provenance retains content identities without private recovery-service identifiers', () => {
  for(const path of ['public/models/environment-rebuilt-v2/asset-manifest.json','public/models/floodlights-rebuilt-v3/asset-manifest.json','src/client/scene/environment/source-layout.metadata.json']) {
    const text=readFileSync(path,'utf8'),data=JSON.parse(text),script=data.publication_metadata.public_exporter;
    assert.doesNotMatch(text,/libfile_[A-Za-z0-9_-]+|file_00000000[A-Za-z0-9]+/);
    assert.equal(createHash('sha256').update(readFileSync(script.file)).digest('hex'),script.sha256);
  }
  for(const path of ['scripts/recovery/export_environment_v2.py','scripts/recovery/export-floodlights-v3.py'])assert.doesNotMatch(readFileSync(path,'utf8'),/library_file_id|library-source-identities\.json/);
});

test('every new environment and light GLB JSON chunk is free of private identities or transfer URLs', () => {
  for(const folder of ['environment-rebuilt-v2','floodlights-rebuilt-v3']) {
    const data=JSON.parse(readFileSync(`public/models/${folder}/asset-manifest.json`,'utf8'));
    for(const asset of data.assets) {
      const bytes=readFileSync(`public/models/${folder}/${asset.file}`);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
      assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(16),0x4e4f534a);
      const json=bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8');JSON.parse(json);
      assert.doesNotMatch(json,/libfile_[A-Za-z0-9_-]+|file_00000000[A-Za-z0-9]+|X-Amz-Signature|blob\.core\.windows\.net|oaiusercontent/);
    }
  }
});
