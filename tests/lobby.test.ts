import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// Browser-native, dependency-free modules are also exercised by the build.
// @ts-ignore JavaScript module tested directly.
import { games, gameInfo, validateConfig, readInvitation, entryURL, readPreference, savePreference, currentLobby, lobbyURL } from '../lobby/routing.mjs';

const config = JSON.parse(readFileSync(new URL('../lobby/config.json', import.meta.url), 'utf8'));
const active = structuredClone(config);
active.lobbies.aliyun.enabled = true;
for (const game of games) for (const server of ['aliyun', 'cloudflare']) active.entries[game][server].enabled = true;
const blocked = structuredClone(config);
blocked.lobbies.aliyun.enabled = false;
for (const game of games) blocked.entries[game].aliyun.enabled = false;

test('大厅六个受信入口独立，待上线国内HTTPS不会提前开放', () => {
  const trusted = validateConfig(active);
  for (const game of games) for (const server of ['aliyun', 'cloudflare']) {
    const url = new URL(entryURL(trusted, game, server));
    assert.equal(url.origin, active.entries[game][server].origin);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.pathname, '/');
    assert.equal(url.search, '');
  }
  assert.equal(entryURL(validateConfig(blocked), 'athlete', 'aliyun'), null);
  assert.equal(entryURL(validateConfig(blocked), 'wizard', 'aliyun'), null);
  assert.equal(lobbyURL(validateConfig(blocked), 'aliyun'), null);
  const blockedLobby = structuredClone(active);
  blockedLobby.lobbies.aliyun.enabled = false;
  assert.equal(entryURL(validateConfig(blockedLobby), 'athlete', 'aliyun'), null);
});

test('当前大厅由受信网页网址确定，偏好不会把同一网页改成另一个服务器', () => {
  for (const server of ['aliyun', 'cloudflare']) {
    const href = active.lobbies[server].url;
    assert.equal(currentLobby(validateConfig(active), href + '?token=secret#private'), server);
    assert.equal(lobbyURL(validateConfig(active), server), href);
  }
  assert.equal(currentLobby(active, 'https://attacker.example/lobby/'), null);
  assert.equal(currentLobby(active, 'https://magical-athlete.qiuh23.workers.dev/'), null);
  assert.equal(currentLobby(active, 'http://127.0.0.1:9999/'), 'aliyun');
  assert.equal(currentLobby(active, 'http://127.0.0.1:9999/lobby/'), 'cloudflare');
  for (const server of ['aliyun', 'cloudflare']) {
    const other = server === 'aliyun' ? 'cloudflare' : 'aliyun';
    const invite = readInvitation(`?game=wizard&room=${server === 'aliyun' ? 'A' : 'C'}-ABCD2345&watch=1&token=secret&next=https://attacker.example`);
    const target = lobbyURL(active, server, invite);
    assert.equal(currentLobby(active, target), server);
    assert.equal(lobbyURL(active, other, invite), null);
    const url = new URL(target);
    assert.equal(url.origin, new URL(active.lobbies[server].url).origin);
    assert.deepEqual([...url.searchParams.keys()], ['game', 'server', 'room', 'watch', 'lobbyHop']);
    assert.equal(url.searchParams.get('lobbyHop'), '1');
    assert.equal(url.searchParams.get('watch'), '1');
    assert.equal(url.hash, '');
    assert.ok(!target.includes('secret') && !target.includes('attacker'));
  }
});

test('三款游戏/两种服务器邀请保留房间与受支持的观战，丢弃令牌和任意跳转', () => {
  for (const game of games) for (const [server, prefix] of [['aliyun', 'A'], ['cloudflare', 'C']]) {
    const code = game === 'wizard' ? 'ABCD2345' : 'ABC234';
    for (const watch of gameInfo[game].watch ? [false, true] : [false]) {
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
  for (const query of ['?game=wizard&room=ABCD2345', '?game=athlete&room=A-ABC234&server=cloudflare', '?game=athlete&room=A-ABC234&game=wizard', '?room=A-ABC234', '?game=wizard&room=C-ABCD2345&watch=true', '?game=__proto__&room=A-ABC234', '?game=athlete&room=A-ABC234&lobbyHop=2', '?game=athlete&room=A-ABC234&lobbyHop=1&lobbyHop=1']) {
    assert.throws(() => readInvitation(query));
  }
  assert.equal(readInvitation('?redirect=https://evil.test&token=secret'), null);
  for (const origin of ['http://example.com', 'https://example.com/path', 'https://user:pass@example.com', 'https://example.com?next=evil', 'javascript:alert(1)', 'https://example.com/']) {
    const unsafe = structuredClone(active);
    unsafe.entries.athlete.aliyun.origin = origin;
    assert.throws(() => validateConfig(unsafe));
  }
  for (const url of ['http://example.com/', 'https://user:pass@example.com/', 'https://example.com/?next=evil', 'https://example.com/#private', 'https://example.com/untrusted', '//example.com/']) {
    const unsafe = structuredClone(active);
    unsafe.lobbies.aliyun.url = url;
    assert.throws(() => validateConfig(unsafe));
  }
  const sameOrigin = structuredClone(active);
  sameOrigin.lobbies.aliyun.url = sameOrigin.lobbies.cloudflare.url;
  assert.throws(() => validateConfig(sameOrigin));
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


test('卡坦岛关闭时不能进入，拒绝观战与错误长度/易混淆房码，邀请原服封闭失败', () => {
  const closed = structuredClone(config);
  for (const server of ['aliyun','cloudflare']) closed.entries.catan[server].enabled=false;
  const production = validateConfig(closed);
  for (const [server,prefix] of [['aliyun','A'],['cloudflare','C']]) {
    const invite = readInvitation(`?game=catan&room=${prefix}-ABC234&token=secret`);
    assert.equal(entryURL(production, 'catan', server), null);
    assert.equal(entryURL(production, 'catan', server, invite), null);
    assert.equal(lobbyURL(production, server, invite), null);
    const url = new URL(entryURL(active, 'catan', server, invite));
    assert.equal(url.search, `?room=${prefix}-ABC234`);
    assert.equal(url.hash, '');
    assert.equal(entryURL(active, 'catan', server, {...invite,watch:true}), null);
    assert.throws(() => readInvitation(`?game=catan&room=${prefix}-ABC234&watch=1`));
  }
  for (const code of ['ABCDEI','ABCO23','ABC23456']) assert.throws(() => readInvitation(`?game=catan&room=A-${code}`));
  const extra = structuredClone(active); extra.entries.unknown=extra.entries.catan;
  assert.throws(() => validateConfig(extra));
  const aliased = structuredClone(active); aliased.entries.catan.aliyun.origin=aliased.entries.catan.cloudflare.origin;
  assert.throws(() => validateConfig(aliased));
  const missing = structuredClone(active); delete missing.entries.catan;
  assert.throws(() => validateConfig(missing));
});
