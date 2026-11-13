declare const __PUBLIC_ASSET_URLS__: Record<string, string> | undefined;
const builtUrls = typeof __PUBLIC_ASSET_URLS__ === 'undefined' ? {} : __PUBLIC_ASSET_URLS__;

/** Only known public media are mapped. Blob/data/remote URLs stay untouched. */
export function resolveAssetUrl(path: string, urls: Record<string, string>): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const pathname = path.split(/[?#]/, 1)[0];
  return urls[pathname] ?? path;
}

/** Build-pinned content URL; development and unknown media keep their input URL. */
export function assetUrl(path: string): string { return resolveAssetUrl(path, builtUrls); }
