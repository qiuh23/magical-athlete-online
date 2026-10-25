import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function validateCapacity(capacity,maximum=15) {
  if (!Number.isInteger(maximum)||maximum<0||maximum>15||!capacity || !Number.isInteger(capacity.limit) || capacity.limit < 0 || capacity.limit > maximum || !Number.isInteger(capacity.used) || capacity.used < 0 || capacity.used > maximum) {
    throw Error(`First reduce the backend quota to ${maximum} and wait for occupancy <=${maximum}; existing rooms must not be evicted.`);
  }
  return capacity;
}

export function validateSnapshot(value, expectedOrigin, now = Date.now(),maximum=15) {
  const capturedAt = typeof value?.capturedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value.capturedAt) ? Date.parse(value.capturedAt) : NaN;
  if (value?.origin !== expectedOrigin || !Number.isFinite(capturedAt) || now - capturedAt > 300_000 || capturedAt - now > 30_000) {
    throw Error('Capacity snapshot must match the exact Cloudflare origin and be captured within five minutes (clock skew <=30 seconds).');
  }
  return validateCapacity(value.capacity,maximum);
}

export function validateSnapshotMetadata(metadata) {
  if (!metadata.isFile() || metadata.uid !== 0 || (metadata.mode & 0o7777) !== 0o600) {
    throw Error('Capacity snapshot must be a regular root-owned file with mode 0600.');
  }
}

export async function readSnapshot(path, expectedOrigin,maximum=15) {
  if ((await lstat(path)).isSymbolicLink()) throw Error('Capacity snapshot cannot be a symbolic link.');
  const file = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    validateSnapshotMetadata(await file.stat());
    return validateSnapshot(JSON.parse(await file.readFile('utf8')), expectedOrigin,Date.now(),maximum);
  } finally {
    await file.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--snapshot') {
    await readSnapshot(process.argv[3], process.argv[4],process.argv[5]===undefined?15:Number(process.argv[5]));
  } else if (process.argv[2] === '--live') {
    let body = '';
    for await (const chunk of process.stdin) body += chunk;
    validateCapacity(JSON.parse(body).capacity,process.argv[3]===undefined?15:Number(process.argv[3]));
  } else {
    throw Error('Use --live with API response on stdin, or --snapshot <root-owned-file> <Cloudflare-origin>.');
  }
}
