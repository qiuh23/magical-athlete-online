import test from 'node:test';
import assert from 'node:assert/strict';
const {validateCapacity,validateSnapshot,validateSnapshotMetadata}=await import(new URL('../scripts/deploy/capacity.mjs',import.meta.url).href);
const origin='https://cf.example';
const now=Date.parse('2026-10-25T10:00:00.000Z');
const snapshot={origin,capturedAt:new Date(now).toISOString(),capacity:{used:3,limit:15}};

test('capacity admission rejects excess occupancy or single-backend limits without evicting rooms',()=>{
  assert.equal(validateCapacity(snapshot.capacity),snapshot.capacity);
  for(const capacity of [{used:16,limit:15},{used:0,limit:30},{used:-1,limit:15},{used:0,limit:-1},{used:0.5,limit:15},null])assert.throws(()=>validateCapacity(capacity));
});

test('management snapshots require exact origin, freshness and bounded future clock skew',()=>{
  assert.deepEqual(validateSnapshot(snapshot,origin,now),snapshot.capacity);
  assert.deepEqual(validateSnapshot({...snapshot,capturedAt:new Date(now-300_000).toISOString()},origin,now),snapshot.capacity);
  for(const bad of [
    {...snapshot,origin:'https://other.example'},
    {...snapshot,capturedAt:new Date(now-300_001).toISOString()},
    {...snapshot,capturedAt:new Date(now+30_001).toISOString()},
    {...snapshot,capturedAt:'invalid'},
    {...snapshot,capacity:{used:16,limit:15}},
  ])assert.throws(()=>validateSnapshot(bad,origin,now));
});

test('snapshot metadata refuses non-root owners, permissive modes and non-files',()=>{
  assert.doesNotThrow(()=>validateSnapshotMetadata({isFile:()=>true,uid:0,mode:0o100600}));
  for(const bad of [
    {isFile:()=>true,uid:1000,mode:0o100600},
    {isFile:()=>true,uid:0,mode:0o100644},
    {isFile:()=>true,uid:0,mode:0o100666},
    {isFile:()=>false,uid:0,mode:0o100600},
  ])assert.throws(()=>validateSnapshotMetadata(bad));
});
