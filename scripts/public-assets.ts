import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import type { Plugin } from 'vite';

// Public, self-contained media only. Never include configuration, HTML, code,
// room snapshots or credentials. GLB textures are embedded in this project.
const media = new Set(['.glb', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.gif', '.ktx2', '.mp3', '.ogg', '.wav', '.mp4', '.webm', '.woff', '.woff2', '.ttf']);
export function publicAssets(directory: string) {
  const urls: Record<string, string> = {};
  const files = new Map<string, Buffer>();
  function visit(folder: string) {
    for (const entry of readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) visit(path);
      // Do not follow symlinks outside the public directory.
      else if (entry.isFile() && media.has(extname(path).toLowerCase())) {
        const bytes = readFileSync(path);
        const hash = createHash('sha256').update(bytes).digest('hex');
        const output = `game-assets/${hash}${extname(path).toLowerCase()}`;
        urls[`/${relative(directory, path).split('\\').join('/')}`] = `/${output}`;
        files.set(output, bytes);
      }
    }
  }
  visit(directory);
  return { urls, files };
}

export function publicAssetPlugin(): Plugin {
  let assets: ReturnType<typeof publicAssets>;
  return {
    name: 'content-addressed-public-media',
    apply: 'build',
    config(config) {
      assets = publicAssets(resolve(config.root ?? '.', 'public'));
      return { define: { __PUBLIC_ASSET_URLS__: JSON.stringify(assets.urls) } };
    },
    generateBundle() {
      for (const [fileName, source] of assets.files) this.emitFile({ type: 'asset', fileName, source });
      // Diagnostic manifest, not a mutable runtime dependency. Each JS bundle
      // embeds its own map so an old tab cannot select new deployment bytes.
      this.emitFile({ type: 'asset', fileName: 'asset-manifest.json', source: JSON.stringify({ version: 1, urls: assets.urls }, null, 2) + '\n' });
    },
  };
}
