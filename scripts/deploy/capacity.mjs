import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function validateCapacity(capacity) {
  if (!capacity || !Number.isInteger(capacity.limit) || capacity.limit < 0 || capacity.limit > 15 || !Number.isInteger(capacity.used) || capacity.used < 0 || capacity.used > 15) {
    throw Error('First reduce Cloudflare quota to 15 and wait for occupancy <=15; existing rooms must not be evicted.');
  }
  return capacity;
}

export function validateSnapshot(value, expectedOrigin, now = Date.now()) {
  const capturedAt = typeof value?.capturedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value.capturedAt) ? Date.parse(value.capturedAt) : NaN;
  if (value?.origin !== expectedOrigin || !Number.isFinite(capturedAt) || now - capturedAt > 300_000 || capturedAt - now > 30_000) {
    throw Error('Capacity snapshot must match the exact Cloudflare origin and be captured within five minutes (clock skew <=30 seconds).');
  }
  return validateCapacity(value.capacity);
}

export function validateSnapshotMetadata(metadata) {
  if (!metadata.isFile() || metadata.uid !== 0 || (metadata.mode & 0o7777) !== 0o600) {
    throw Error('Capacity snapshot must be a regular root-owned file with mode 0600.');
  }
}

export async function readSnapshot(path, expectedOrigin) {
  if ((await lstat(path)).isSymbolicLink()) throw Error('Capacity snapshot cannot be a symbolic link.');
  const file = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    validateSnapshotMetadata(await file.stat());
    return validateSnapshot(JSON.parse(await file.readFile('utf8')), expectedOrigin);
  } finally {
    await file.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--snapshot') {
    await readSnapshot(process.argv[3], process.argv[4]);
  } else if (process.argv[2] === '--live') {
    let body = '';
    for await (const chunk of process.stdin) body += chunk;
    validateCapacity(JSON.parse(body).capacity);
  } else {
    throw Error('Use --live with API response on stdin, or --snapshot <root-owned-file> <Cloudflare-origin>.');
  }
}
