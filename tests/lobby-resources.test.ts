import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { buildLobby } = await import(new URL('../scripts/build-lobby.mjs', import.meta.url).href);
const { verifyBuildInfo, sourceRevision } = await import(new URL('../scripts/build-info.mjs', import.meta.url).href);

test('both lobby artifacts contain every referenced local asset and the domestic vhost permits exactly public files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'athlete-lobby-resources-'));
  try {
    const targets = ['client', 'browser'].map(kind => join(directory, kind, 'lobby'));
    await buildLobby(targets);
    const html = await readFile(new URL('../lobby/index.html', import.meta.url), 'utf8');
    const resourcePaths = [...html.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)="(\.\/[^"?#]+)"/g)].map(match => match[1].slice(2));
    assert.ok(resourcePaths.includes('art/athlete.svg') && resourcePaths.includes('art/wizard.svg'), 'Both original game illustrations must be part of the shipped asset graph.');
    const files = new Set(['index.html', 'config.json', 'routing.mjs', ...resourcePaths]);
    const nginx = await readFile(new URL('../deploy/nginx-lobby.conf.template', import.meta.url), 'utf8');
    const publicLocation = nginx.match(/location ~ (\S+) \{/);
    assert.ok(publicLocation, 'Domestic lobby needs an explicit public-file route.');
    const allowed = new RegExp(publicLocation[1]);
    for (const path of files) {
      assert.ok(allowed.test('/' + path), `Domestic Nginx must serve ${path}.`);
      const source = await readFile(new URL('../lobby/' + path, import.meta.url));
      for (const target of targets) assert.deepEqual(await readFile(join(target, path)), source, `${path} must be identical in both builds.`);
    }
    assert.ok(allowed.test('/build-info.json'));
    for (const target of targets) await verifyBuildInfo(target, sourceRevision());
    for (const path of ['/api/health', '/socket.io/', '/server.env', '/art/other.svg', '/private/config.json', '/config.json/extra', '/art/athlete.svg.bak', '/../server.env']) {
      assert.equal(allowed.test(path), false, `Public-file route must reject ${path}.`);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
