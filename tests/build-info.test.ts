import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { sourceRevision, writeBuildInfo, verifyBuildInfo } = await import(new URL('../scripts/build-info.mjs', import.meta.url).href);

test('both public build roots and lobby can expose source SHA without replacing checked release identity', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'athlete-build-info-'));
  try {
    const release = JSON.stringify({ target: 'preview', commit: 'a'.repeat(40), runId: 123, prNumber: 40 });
    await writeFile(join(directory, 'deployment.json'), release);
    await writeBuildInfo(directory, 'b'.repeat(40));
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'build-info.json'), 'utf8')), { revision: 'b'.repeat(40) });
    await verifyBuildInfo(directory, 'b'.repeat(40));
    await assert.rejects(verifyBuildInfo(directory, 'a'.repeat(40)), /differs from the checked commit/);
    await assert.rejects(verifyBuildInfo(directory, 'unknown'), /full source commit SHA/);
    assert.equal(await readFile(join(directory, 'deployment.json'), 'utf8'), release);
    assert.match(sourceRevision(), /^[a-f0-9]{40}$/);
    for (const invalid of ['main', 'unknown', 'b'.repeat(7), '', 'b'.repeat(40) + '\n']) {
      await assert.rejects(writeBuildInfo(directory, invalid), /full source commit SHA/);
    }
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'build-info.json'), 'utf8')), { revision: 'b'.repeat(40) });
    await writeFile(join(directory, 'build-info.json'), '<!doctype html>fallback');
    await assert.rejects(verifyBuildInfo(directory, 'b'.repeat(40)));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
