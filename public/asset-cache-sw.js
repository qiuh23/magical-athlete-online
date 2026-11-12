/* Only immutable public media. No app shell, API, room, session or cross-origin cache. */
const CACHE_NAME = 'athlete-public-media-v1';
const MAX_ENTRIES = 512;
const MAX_BYTES = 96 * 1024 * 1024;
const MAX_FILE_BYTES = 16 * 1024 * 1024;
const PATH = /^\/game-assets\/([a-f0-9]{64})\.(glb|png|jpe?g|webp|avif|svg|gif|ktx2|mp3|ogg|wav|mp4|webm|woff2?|ttf)$/;
const pending = new Map();
let writes = Promise.resolve();
let inventory;

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
// Safe to claim old pages: only self-identifying, verified media are intercepted.
// Cache names never include a release ID; activation must not delete old assets.
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

function eligible(request) {
  const url = new URL(request.url);
  return request.method === 'GET' && url.origin === self.location.origin &&
    !url.search && !url.hash && PATH.test(url.pathname) &&
    !request.headers.has('range') && !request.headers.has('authorization') &&
    request.cache !== 'no-store';
}

async function readInventory(cache) {
  if (inventory) return inventory;
  const entries = new Map();
  for (const key of await cache.keys()) {
    const response = await cache.match(key);
    const size = Number(response?.headers.get('x-athlete-cache-bytes'));
    if (!response || !Number.isSafeInteger(size) || size <= 0 || size > MAX_FILE_BYTES) {
      await cache.delete(key);
    } else entries.set(key.url, size);
  }
  inventory = entries;
  return entries;
}

async function store(cache, url, response, size) {
  // Serialize writes/eviction so concurrent misses cannot overrun the budget.
  const write = writes.then(async () => {
    const entries = await readInventory(cache);
    let total = [...entries.values()].reduce((a, b) => a + b, 0);
    const removeOldest = async () => {
      const oldest = entries.keys().next().value;
      if (!oldest) return false;
      await cache.delete(oldest);
      total -= entries.get(oldest);
      entries.delete(oldest);
      return true;
    };
    while (entries.size >= MAX_ENTRIES || total + size > MAX_BYTES) {
      if (!await removeOldest()) break;
    }
    try { await cache.put(url, response.clone()); }
    catch (error) {
      if (error?.name !== 'QuotaExceededError' || !await removeOldest()) throw error;
      // One bounded retry after freeing an old object. Never clear other stores.
      await cache.put(url, response.clone());
    }
    entries.set(url, size);
  });
  writes = write.catch(() => { inventory = undefined; });
  return writes;
}

async function download(url, cache) {
  // These are build-produced public files, so never send account credentials.
  // Revalidate only on a persistent-cache miss. A static host may previously
  // have returned SPA HTML for a missing old hash; do not let that HTTP-cache
  // entry hide a subsequently restored asset after rollback.
  const response = await fetch(url, { credentials: 'omit', redirect: 'error', cache: 'no-cache' });
  if (response.status !== 200 || response.type === 'opaque' || response.redirected || response.headers.has('content-range')) return response;
  const bytes = await response.clone().arrayBuffer();
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
  if (digest !== PATH.exec(new URL(url).pathname)[1]) {
    // Missing assets may be served SPA HTML by a static host. Never poison an
    // old hash with that HTML or with the new bytes of a fixed-path asset.
    return new Response('Asset integrity check failed', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
  const variesByUser = (response.headers.get('vary') ?? '').split(',').some(value => value.trim() && value.trim().toLowerCase() !== 'accept-encoding');
  const privateResponse = /(?:^|[,\s])(?:no-store|private)(?:[,\s=]|$)/i.test(response.headers.get('cache-control') ?? '') || response.headers.has('set-cookie') || variesByUser;
  if (cache && bytes.byteLength > 0 && bytes.byteLength <= MAX_FILE_BYTES && !privateResponse) {
    const headers = new Headers(response.headers);
    headers.set('x-athlete-cache-bytes', String(bytes.byteLength));
    // Fetch has decoded the body already. Do not persist stale transfer metadata.
    headers.delete('content-encoding');
    headers.delete('content-length');
    await store(cache, url, new Response(bytes, { status: 200, headers }), bytes.byteLength);
  }
  return response;
}

async function asset(request) {
  let cache;
  try {
    cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(request.url);
    if (hit) return hit;
  } catch { /* Unavailable storage falls back to the verified network response. */ }
  if (!pending.has(request.url)) {
    const promise = download(request.url, cache).finally(() => pending.delete(request.url));
    pending.set(request.url, promise);
  }
  return (await pending.get(request.url)).clone();
}

self.addEventListener('fetch', event => {
  if (!eligible(event.request)) return;
  const response = asset(event.request);
  event.respondWith(response);
  event.waitUntil(response.then(() => undefined, () => undefined));
});
