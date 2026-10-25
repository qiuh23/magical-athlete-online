import assert from 'node:assert/strict';
import test from 'node:test';
import { randomId } from '../src/client/random-id.js';

test('request IDs preserve native crypto when available', () => {
  const source = { randomUUID: () => '713f1ab4-2e73-42ea-b381-27fc239df562', getRandomValues: () => { throw Error('Native path should not read bytes.'); } } as unknown as Crypto;
  assert.equal(randomId(source), '713f1ab4-2e73-42ea-b381-27fc239df562');
});

test('public HTTP request IDs use secure bytes and have UUID v4 version and variant', () => {
  const source = { getRandomValues(bytes: Uint8Array) { bytes.set(Array.from({ length: 16 }, (_, index) => index)); return bytes; } } as Crypto;
  assert.equal(randomId(source), '00010203-0405-4607-8809-0a0b0c0d0e0f');
  const httpCrypto = { getRandomValues: crypto.getRandomValues.bind(crypto) } as Crypto;
  const ids = Array.from({ length: 100 }, () => randomId(httpCrypto));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('missing Web Crypto fails explicitly rather than using predictable IDs', () => {
  assert.throws(() => randomId({} as Crypto), /无法生成安全的请求标识/);
});
