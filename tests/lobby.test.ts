import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// Browser-native, dependency-free modules are also exercised by the build.
// @ts-ignore JavaScript module tested directly.
import { validateConfig, readInvitation, entryURL, readPreference, savePreference } from '../lobby/routing.mjs';

const config = JSON.parse(readFileSync(new URL('../lobby/config.json', import.meta.url), 'utf8'));
const active = structuredClone(config);
for (const game of ['athlete', 'wizard']) active.entries[game].aliyun.enabled = true;

test('大厅四个受信入口独立，待上线国内HTTPS不会提前开放', () => {
  const trusted = validateConfig(active);
  for (const game of ['athlete', 'wizard']) for (const server of ['aliyun', 'cloudflare']) {
    const url = new URL(entryURL(trusted, game, server));
    assert.equal(url.origin, active.entries[game][server].origin);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.pathname, '/');
    assert.equal(url.search, '');
  }
  assert.equal(entryURL(validateConfig(config), 'athlete', 'aliyun'), null);
  assert.equal(entryURL(validateConfig(config), 'wizard', 'aliyun'), null);
});

test('四种游戏/服务器邀请保留房间与观战，丢弃令牌和任意跳转', () => {
  for (const game of ['athlete', 'wizard']) for (const [server, prefix] of [['aliyun', 'A'], ['cloudflare', 'C']]) {
    const code = game === 'athlete' ? 'ABC234' : 'ABCD2345';
    for (const watch of [false, true]) {
      const invite = readInvitation(`?game=${game}&room=${prefix}-${code}&watch=${watch ? '1' : '0'}&token=secret&redirect=https://evil.test#private`);
      assert.equal(invite.server, server);
      const href = entryURL(active, game, server, invite);
      const url = new URL(href);
      assert.equal(url.origin, active.entries[game][server].origin);
      assert.ok(!href.includes('secret') && !href.includes('evil') && !href.includes('private'));
      if (game === 'athlete') {
        assert.equal(url.pathname, `/room/${prefix}-${code}`);
        assert.equal(url.searchParams.get('spectate'), watch ? '1' : null);
      } else {
        assert.equal(url.searchParams.get('room'), `${prefix}-${code}`);
        assert.equal(url.searchParams.get('watch'), watch ? '1' : null);
      }
      assert.equal(entryURL(active, game, server === 'aliyun' ? 'cloudflare' : 'aliyun', invite), null);
      assert.equal(entryURL(active, game === 'athlete' ? 'wizard' : 'athlete', server, invite), null);
    }
  }
});

test('不猜旧无前缀邀请码，不接受冲突/重复参数或不安全配置', () => {
  for (const query of ['?game=wizard&room=ABCD2345', '?game=athlete&room=A-ABC234&server=cloudflare', '?game=athlete&room=A-ABC234&game=wizard', '?room=A-ABC234', '?game=wizard&room=C-ABCD2345&watch=true', '?game=__proto__&room=A-ABC234']) {
    assert.throws(() => readInvitation(query));
  }
  assert.equal(readInvitation('?redirect=https://evil.test&token=secret'), null);
  for (const origin of ['http://example.com', 'https://example.com/path', 'https://user:pass@example.com', 'https://example.com?next=evil', 'javascript:alert(1)', 'https://example.com/']) {
    const unsafe = structuredClone(active);
    unsafe.entries.athlete.aliyun.origin = origin;
    assert.throws(() => validateConfig(unsafe));
  }
});

test('偏好只是可选体验，邀请不受偏好影响，存储被禁用时仍可选择', () => {
  const storage = new Map();
  const adapter = { getItem: (key:string) => storage.get(key), setItem: (key:string, value:string) => storage.set(key,value) };
  savePreference(adapter, 'cloudflare');
  assert.equal(readPreference(adapter), 'cloudflare');
  assert.equal(readInvitation('?game=athlete&room=A-ABC234').server, 'aliyun');
  assert.equal(readPreference(undefined), 'aliyun');
  assert.doesNotThrow(() => savePreference(undefined, 'cloudflare'));
});
