import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function sourceRevision() {
  // Workers Builds and GitHub Checks both check out the source commit. Do not
  // manufacture a release target/run ID when this is only a source build.
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true }).trim();
}

export async function writeBuildInfo(directory, revision = sourceRevision()) {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw Error('Build information requires a full source commit SHA.');
  // deployment.json belongs to the checked-artifact release pipeline. Keeping
  // source identity separate preserves its trusted target/run/PR information.
  await writeFile(resolve(directory, 'build-info.json'), JSON.stringify({ revision }, null, 2) + '\n');
}

export async function verifyBuildInfo(directory, expectedRevision) {
  if (!/^[a-f0-9]{40}$/.test(expectedRevision)) throw Error('Build verification requires a full source commit SHA.');
  const info = JSON.parse(await readFile(resolve(directory, 'build-info.json'), 'utf8'));
  if (info.revision !== expectedRevision) throw Error('Built source revision differs from the checked commit.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--check') {
    if (process.argv.length < 5) throw Error('Provide the expected commit and built public directories.');
    for (const directory of process.argv.slice(4)) await verifyBuildInfo(resolve(directory), process.argv[3]);
  } else {
    if (process.argv.length < 3) throw Error('Provide the built public directory.');
    for (const directory of process.argv.slice(2)) await writeBuildInfo(resolve(directory));
  }
}
