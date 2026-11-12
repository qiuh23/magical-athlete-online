import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { once } from 'node:events';
import { createApplication } from '../src/server/index.js';
import { publicAssets } from '../scripts/public-assets.js';
import { resolveAssetUrl } from '../src/client/assets/asset-url.js';

const source = readFileSync('public/asset-cache-sw.js', 'utf8');
const origin = 'https://athlete.example';
const assetPath = (bytes: string) => '/game-assets/' + createHash('sha256').update(bytes).digest('hex') + '.glb';
class MemoryCache {
  entries = new Map<string, Response>();
  puts = 0;
  failPut?: string;
  async keys() { return [...this.entries.keys()].map(key => new Request(key)); }
  async match(key: string | Request) { return this.entries.get(typeof key === 'string' ? key : key.url)?.clone(); }
  async delete(key: string | Request) { return this.entries.delete(typeof key === 'string' ? key : key.url); }
  async put(key: string, response: Response) {
    this.puts++;
    if (this.failPut) { const name = this.failPut; this.failPut = undefined; throw Object.assign(new Error(name), { name }); }
    this.entries.set(key, response.clone());
  }
}
function worker(fetcher: typeof fetch, cache = new MemoryCache(), options: { maxEntries?: number; maxBytes?: number; storageFails?: boolean } = {}) {
  const listeners = new Map<string, (event: any) => void>();
  const code = source.replace('const MAX_ENTRIES = 512;', `const MAX_ENTRIES = ${options.maxEntries ?? 512};`).replace('const MAX_BYTES = 96 * 1024 * 1024;', `const MAX_BYTES = ${options.maxBytes ?? 96 * 1024 * 1024};`);
  runInNewContext(code, {
    self: { location: { origin }, addEventListener: (name: string, cb: (event: any) => void) => listeners.set(name, cb), skipWaiting: async () => {}, clients: { claim: async () => {} } },
    fetch: fetcher, caches: { open: async (name: string) => { assert.equal(name, 'athlete-public-media-v1'); if (options.storageFails) throw Error('Storage disabled'); return cache; } },
    Response, Request, Headers, URL, crypto: webcrypto,
  });
  return {
    cache,
    async get(path: string, init?: RequestInit) {
      let result: Promise<Response> | undefined;
      const waits: Promise<unknown>[] = [];
      listeners.get('fetch')!({ request: new Request(new URL(path, origin), init), respondWith: (value: Promise<Response>) => { result = value; }, waitUntil: (value: Promise<unknown>) => waits.push(value) });
      const response = await result;
      await Promise.all(waits);
      return response;
    },
    async activate() { let result; listeners.get('activate')!({ waitUntil: (value: Promise<unknown>) => { result = value; } }); await result; },
  };
}
const bytesFetcher = (bytes: string, init: ResponseInit = {}): typeof fetch => async (_url, request) => {
  assert.equal(request?.credentials, 'omit');
  assert.equal(request?.redirect, 'error');
  assert.equal(request?.cache, 'no-cache');
  return new Response(bytes, { headers: { 'Content-Type': 'model/gltf-binary' }, ...init });
};

test('media manifest is deterministic, individual-content addressed, and excludes non-media', () => {
  const root = mkdtempSync(join(tmpdir(), 'athlete-manifest-'));
  try {
    mkdirSync(join(root, 'models/mechanisms'), { recursive: true });
    writeFileSync(join(root, 'models/a.glb'), 'one');
    writeFileSync(join(root, 'models/mechanisms/new.glb'), 'two');
    writeFileSync(join(root, 'backends.json'), '{"private":"no"}');
    writeFileSync(join(root, 'index.html'), 'no');
    const first = publicAssets(root);
    assert.deepEqual(publicAssets(root).urls, first.urls);
    assert.equal(first.urls['/models/a.glb'], assetPath('one'));
    assert.equal(first.urls['/models/mechanisms/new.glb'], assetPath('two'));
    assert.equal(Object.keys(first.urls).length, 2);
    writeFileSync(join(root, 'models/a.glb'), 'changed');
    const second = publicAssets(root);
    assert.equal(second.urls['/models/mechanisms/new.glb'], first.urls['/models/mechanisms/new.glb']);
    assert.notEqual(second.urls['/models/a.glb'], first.urls['/models/a.glb']);
    assert.equal(second.files.get(second.urls['/models/a.glb'].slice(1))?.toString(), 'changed');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('build-pinned resolver replaces legacy query versions without touching unknown/private/remote URLs', () => {
  const map = { '/models/a.glb': assetPath('a') };
  assert.equal(resolveAssetUrl('/models/a.glb?v=old', map), assetPath('a'));
  for (const path of ['/api/rooms', '/backends.json', '/unknown.glb', 'blob:example', 'data:image/png,test', '//other/models/a.glb', 'https://other/models/a.glb']) assert.equal(resolveAssetUrl(path, map), path);
  assert.equal(resolveAssetUrl('/models/a.glb?v=old', {}), '/models/a.glb?v=old');
});

test('cache survives a worker restart, activation and offline read without another fetch', async () => {
  let downloads = 0;
  const first = worker(async (...args) => { downloads++; return bytesFetcher('asset')(...args); });
  assert.equal(await (await first.get(assetPath('asset')))!.text(), 'asset');
  assert.equal(await (await first.get(assetPath('asset')))!.text(), 'asset');
  const reopened = worker(async () => { throw Error('offline'); }, first.cache);
  await reopened.activate();
  assert.equal(await (await reopened.get(assetPath('asset')))!.text(), 'asset');
  assert.equal(downloads, 1);
});

test('old and new content URLs coexist; rollback reuses old bytes', async () => {
  let downloads = 0;
  const instance = worker(async input => { downloads++; return new Response(String(input).endsWith(assetPath('old')) ? 'old' : 'new'); });
  for (const value of ['old', 'new', 'old', 'new']) assert.equal(await (await instance.get(assetPath(value)))!.text(), value);
  assert.equal(downloads, 2);
  assert.equal(instance.cache.entries.size, 2);
});

test('concurrent identical misses download once and each caller can consume its own response', async () => {
  let downloads = 0;
  const instance = worker(async () => { downloads++; await new Promise(resolve => setTimeout(resolve, 20)); return new Response('shared'); });
  const results = await Promise.all(Array.from({ length: 8 }, () => instance.get(assetPath('shared'))));
  assert.deepEqual(await Promise.all(results.map(response => response!.text())), Array(8).fill('shared'));
  assert.equal(downloads, 1); assert.equal(instance.cache.puts, 1);
});

test('wrong bytes and SPA HTML cannot contaminate an old hash; failure can retry correctly', async () => {
  let calls = 0;
  const instance = worker(async () => new Response(++calls < 3 ? (calls === 1 ? '<html>fallback</html>' : 'new') : 'old'));
  assert.equal((await instance.get(assetPath('old')))!.status, 502);
  assert.equal((await instance.get(assetPath('old')))!.status, 502);
  assert.equal(instance.cache.entries.size, 0);
  assert.equal(await (await instance.get(assetPath('old')))!.text(), 'old');
  assert.equal(instance.cache.entries.size, 1);
});

test('HTTP errors, private/no-store/Vary responses and partial downloads are not persisted', async () => {
  for (const init of [{ status: 404 }, { status: 503 }, { status: 206 }, { headers: { 'Cache-Control': 'private, max-age=100' } }, { headers: { 'Cache-Control': 'no-store' } }, { headers: { Vary: 'Cookie' } }, { headers: { 'Content-Range': 'bytes 0-3/4' } }, { headers: { 'Set-Cookie': 'private=true' } }] as ResponseInit[]) {
    const instance = worker(bytesFetcher('data', init));
    await instance.get(assetPath('data'));
    assert.equal(instance.cache.entries.size, 0);
  }
});

test('only same-origin bare GET media hash URLs qualify; API/auth/socket/range/navigation bypass', async () => {
  const instance = worker(async () => { throw Error('must not fetch'); });
  const paths = ['/api/rooms', '/socket.io/?transport=polling', '/backends.json', '/', '/index.html', '/asset-manifest.json', '/models/a.glb', '/assets/app-hash.js', 'https://elsewhere.example' + assetPath('x'), assetPath('x') + '?room=secret'];
  for (const path of paths) assert.equal(await instance.get(path), undefined);
  for (const init of [{ method: 'POST' }, { headers: { Range: 'bytes=0-4' } }, { headers: { Authorization: 'Bearer test' } }, { cache: 'no-store' }] as RequestInit[]) assert.equal(await instance.get(assetPath('x'), init), undefined);
});

test('storage failure/user clearing are recoverable; quota retry is bounded and leaves unrelated stores alone', async () => {
  const disabled = worker(bytesFetcher('data'), undefined, { storageFails: true });
  assert.equal(await (await disabled.get(assetPath('data')))!.text(), 'data');
  const instance = worker(async input => new Response(String(input).endsWith(assetPath('one')) ? 'one' : 'two'));
  await instance.get(assetPath('one'));
  instance.cache.failPut = 'QuotaExceededError';
  assert.equal(await (await instance.get(assetPath('two')))!.text(), 'two');
  assert.equal(instance.cache.puts, 3);
  assert.equal(instance.cache.entries.size, 1);
  instance.cache.entries.clear();
  assert.equal(await (await instance.get(assetPath('one')))!.text(), 'one');
  const failed = worker(bytesFetcher('data'));
  failed.cache.failPut = 'SecurityError';
  assert.equal(await (await failed.get(assetPath('data')))!.text(), 'data');
  assert.equal(failed.cache.puts, 1);
});

test('serialized FIFO eviction enforces entry/byte budgets across concurrent requests and restarts', async () => {
  const values = ['one', 'two', 'tri', 'for'];
  const fetcher: typeof fetch = async input => new Response(values.find(value => String(input).endsWith(assetPath(value))));
  const first = worker(fetcher, undefined, { maxEntries: 2, maxBytes: 6 });
  await Promise.all(values.map(value => first.get(assetPath(value))));
  assert.equal(first.cache.entries.size, 2);
  assert.equal([...first.cache.entries.values()].reduce((sum, response) => sum + Number(response.headers.get('x-athlete-cache-bytes')), 0), 6);
  const missing = values.find(value => !first.cache.entries.has(origin + assetPath(value)))!;
  const restarted = worker(fetcher, first.cache, { maxEntries: 2, maxBytes: 5 });
  await restarted.get(assetPath(missing));
  assert.equal(restarted.cache.entries.size, 1);
});

test('network rejection does not poison or permanently deduplicate failed requests', async () => {
  let calls = 0;
  const instance = worker(async () => { if (++calls === 1) throw Error('offline'); return new Response('retry'); });
  await assert.rejects(instance.get(assetPath('retry')), /offline/);
  assert.equal(await (await instance.get(assetPath('retry')))!.text(), 'retry');
  assert.equal(calls, 2);
});

test('both delivery variants provide immutable media and revalidated worker/manifest headers', () => {
  const headers = readFileSync('public/_headers', 'utf8');
  assert.match(headers, /\/game-assets\/\*\n  Cache-Control: public, max-age=31536000, immutable/);
  assert.match(headers, /\/asset-cache-sw.js\n  Cache-Control: no-cache/);
  const server = readFileSync('src/server/index.ts', 'utf8');
  assert.match(server, /game-assets.*max-age=31536000, immutable/);
  assert.match(server, /asset-cache-sw.js.*no-cache/);
  assert.match(server, /app.use\('\/game-assets'.*sendStatus\(404\)/);
});


test('Node serves immutable hashed bytes, revalidated metadata and true 404s instead of SPA HTML', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'athlete-cache-http-'));
  const cwd = process.cwd();
  const previousEdition = process.env.SITE_EDITION;
  mkdirSync(join(directory, 'dist/client/game-assets'), { recursive: true });
  writeFileSync(join(directory, 'dist/client/index.html'), '<html>app</html>');
  writeFileSync(join(directory, 'dist/client/site-edition.json'), '{"siteEdition":"cn"}');
  writeFileSync(join(directory, 'dist/client', assetPath('test')), 'test');
  writeFileSync(join(directory, 'dist/client/asset-cache-sw.js'), source);
  writeFileSync(join(directory, 'dist/client/asset-manifest.json'), '{}');
  process.env.SITE_EDITION = 'cn';
  process.chdir(directory);
  const app = createApplication(':memory:');
  try {
    app.http.listen(0, '127.0.0.1');
    await once(app.http, 'listening');
    const url = `http://127.0.0.1:${(app.http.address() as { port: number }).port}`;
    const response = await fetch(url + assetPath('test'));
    assert.equal(await response.text(), 'test');
    assert.equal(response.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
    assert.match(response.headers.get('Content-Type')!, /model\/gltf-binary/);
    for (const path of ['/asset-cache-sw.js', '/asset-manifest.json']) assert.equal((await fetch(url + path)).headers.get('Cache-Control'), 'no-cache');
    const missing = await fetch(url + assetPath('not in this release'));
    assert.equal(missing.status, 404);
    assert.equal(missing.headers.get('Cache-Control'), 'no-store');
    assert.doesNotMatch(await missing.text(), /<html>/);
    assert.equal((await fetch(url + '/api/health')).headers.get('Cache-Control'), 'no-store');
  } finally {
    await app.close();
    process.chdir(cwd);
    if (previousEdition === undefined) delete process.env.SITE_EDITION; else process.env.SITE_EDITION = previousEdition;
    rmSync(directory, { recursive: true, force: true });
  }
});


test('decoded responses tolerate case-insensitive Accept-Encoding Vary without stale compression metadata', async () => {
  const instance = worker(bytesFetcher('decoded', { headers: { Vary: 'accept-encoding', 'Content-Encoding': 'br', 'Content-Length': '123' } }));
  await instance.get(assetPath('decoded'));
  const cached = await instance.get(assetPath('decoded'));
  assert.equal(await cached!.text(), 'decoded');
  assert.equal(cached!.headers.get('Content-Encoding'), null);
  assert.equal(cached!.headers.get('Content-Length'), null);
  assert.equal(instance.cache.puts, 1);
});
