# Persistent public-media cache

## Scope and request path

Production builds scan public media recursively (GLB, images, texture containers,
fonts, audio and video). Each file is emitted as `/game-assets/<SHA256>.<extension>`.
The SHA256 is over the file bytes, not a release ID or timestamp. Source paths
remain in the build for compatibility. No dependency, account permission, storage
permission, room protocol or game-rule change is required.

The Vite build embeds its own logical-path → content-URL map in the client bundle
and emits `asset-manifest.json` for inspection. The live app does not fetch the
mutable manifest. `DefaultLoadingManager` applies `assetUrl()` to Three loaders,
including `useGLTF`. Existing version query strings are replaced by the file's
actual content hash. New files under `public/models/mechanisms/` are picked up
without modifying the cache implementation. New DOM images/audio can call
`assetUrl('/path/file.ext')`; CSS or other loaders must also opt into that resolver.
The currently used avatars are inline SVG, and sound effects are synthesized.
Development keeps original URLs and does not install a worker.

The original 472 public-media files occupy 41,378,572 bytes (largest 1,970,972
bytes) at the initial implementation baseline. The build retains original paths
and adds content-addressed copies. It does not eagerly download all 472 files:
only media a player requests enters the browser cache.

## HTTP and browser storage

Both Node static responses and Cloudflare's generated `_headers` give the content
URLs `public, max-age=31536000, immutable`. The worker and diagnostic manifest use
`no-cache`. This is application/static-header code; no deployment credentials,
Cloudflare permissions, origin routing or deployment workflow is changed.

The one root-scoped `asset-cache-sw.js` worker uses the stable
`athlete-public-media-v1` CacheStorage bucket. It only handles same-origin GETs
matching the full content-hash media path. HTML, JS, APIs, login/room state,
WebSockets, cross-origin requests, Authorization, Range and query-bearing requests
are excluded. Public media network fetches omit credentials. Non-200, partial,
redirected, opaque, private/no-store and personalized Vary responses are not
persisted. A SHA256 mismatch produces an uncached 502, never a wrong-version
object. Thus a missing hashed URL served as SPA HTML cannot poison the cache.

Registration is optional, non-blocking and HTTPS-only (localhost is allowed by
the browser). It does not replace an unrelated root worker. A newly installed
worker claims clients, but media already requested during that first load relies
on normal HTTP caching. Subsequent controlled requests also populate persistent
CacheStorage, revalidating HTTP cache on a persistent-cache miss (an unchanged ETag needs no
new body transfer). This also avoids retaining a cached missing-file SPA fallback
when a rollback restores the old file. No claim
is made that every first-visit request passes through the worker.

There is no deploy-wide cache deletion or prefetch. Concurrent requests for one
URL share a fetch. Serialized insertion-order eviction caps this cache at 512
objects and 96 MiB, with a 16 MiB per-file storage limit. On quota failure, one old
object is removed and one write retry is attempted; other failures fall back to
the verified response. Other caches and the game IndexedDB are untouched. The
cache is best-effort: browser eviction, private browsing and user clearing may
require another download. No persistence permission prompt is shown.

## Updates, old tabs and rollback

Changing one file changes only its content URL. Unchanged files retain their URL
across CN/global builds and deployments, and cached old/new objects can coexist.
A tab uses its bundle's map for its entire lifetime, so it cannot relabel new bytes
as an old hash. Rolling back reuses any retained older cache objects. Eviction is
bounded, so an old object is not guaranteed to remain forever.

The host retains only artifacts from the deployed release. If an old tab needs an
old hash that it never downloaded (or the browser evicted), a later deployment may
not contain that hash. It receives the ordinary asset-load failure, not a newer
asset masquerading as the old one. Existing model fallback/retry behavior remains
in charge; reloading selects the current bundle. Complete offline game startup
and indefinite server-side old-asset retention are outside this change.

Domestic `https://athlete.magical-athlete-online.cn/` and global
`https://magical-athlete.qiuh23.workers.dev/` are distinct origins and keep separate
HTTP/CacheStorage data. Visiting one does not warm the other.

## Verification

`node --import tsx --test tests/asset-cache.test.ts` covers deterministic manifests,
single-file changes, future model subdirectories, resolver exclusions, persistent
storage across worker VM restarts, offline hits, old/new/rollback coexistence,
concurrent fetches, wrong bytes/SPA fallback, errors, private responses, API/auth
exclusions, storage failures, quota retry, clearing and bounded FIFO eviction.
These are Cache API simulations, not measurements from a real browser.

Run normal source/test typechecks, the full unit suite, `pnpm build` (CN + global),
and `pnpm exec wrangler deploy --dry-run` as usual. The focused contract suite also
runs in the existing release CI step. No automatic deployment is added for PRs.

For a real-browser check on a permitted local preview or an authorized deployed
build: load a scene, wait for worker control, then request an exact manifest URL.
Inspect `athlete-public-media-v1` in DevTools and compare repeated requests with
HTTP caching disabled; the second controlled request should come from the worker.
Restart the browser with the same profile and repeat. Test two copies with one
changed media file: unchanged URLs must stay equal, both old/new cached bytes
must match their URL hash, and a never-cached removed old URL must fail rather than
return new bytes. Do not clear the whole site's storage unless intentionally
resetting the game's local state. These steps do not assert an observed hit rate
or bandwidth saving.

## Local verification outcome (2026-11-12)

The focused suite includes an actual loopback Node server check of immutable
headers, worker/manifest revalidation, missing-hash 404s and API no-store. Both
build manifests and all 472 physical files were compared against their SHA256 and
source aliases. All 141 current GLBs were also checked for external buffer/image
URIs: none have them. The normal Chromium launch using the existing installed
binary fails with `socket() failed: Operation not permitted` / SIGABRT in this
executor; browser cold/warm/profile-restart measurements remain unverified. No
public deployment or permission workaround was used for QA.
