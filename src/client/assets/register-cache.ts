/** Optional acceleration only: never delay starting the game or request storage permission. */
export async function registerAssetCache(): Promise<void> {
  if (!import.meta.env.PROD || !window.isSecureContext || !('serviceWorker' in navigator)) return;
  try {
    // Do not replace another application's worker if the origin is shared later.
    const current = await navigator.serviceWorker.getRegistration('/');
    const worker = current?.active ?? current?.waiting ?? current?.installing;
    if (worker && new URL(worker.scriptURL).pathname !== '/asset-cache-sw.js') return;
    await navigator.serviceWorker.register('/asset-cache-sw.js', { scope: '/', updateViaCache: 'none' });
  } catch { /* Private browsing, policy and storage failures must not block play. */ }
}
