export const games = ['athlete', 'wizard'];
export const servers = ['aliyun', 'cloudflare'];
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

/** The same-origin deployment file is the only source of navigation origins. */
export function validateConfig(value) {
  if (value?.version !== 1 || !value.entries || Object.keys(value.entries).length !== 2) throw Error('大厅配置无效，请稍后刷新。');
  if (!value.lobbies || Object.keys(value.lobbies).length !== 2) throw Error('大厅网址配置不完整。');
  const lobbies = {};
  for (const server of servers) {
    const item = value.lobbies[server];
    if (!item || typeof item.url !== 'string' || typeof item.enabled !== 'boolean') throw Error('大厅网址配置无效。');
    const url = new URL(item.url);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.href !== item.url || !['/', '/lobby/'].includes(url.pathname)) throw Error('大厅必须使用精确的 HTTPS 网址。');
    lobbies[server] = { url: url.href, enabled: item.enabled };
  }
  if (new URL(lobbies.aliyun.url).origin === new URL(lobbies.cloudflare.url).origin) throw Error('两个大厅必须使用独立来源。');
  const entries = {};
  for (const game of games) {
    if (!own(value.entries, game) || Object.keys(value.entries[game] ?? {}).length !== 2) throw Error('游戏入口配置不完整。');
    entries[game] = {};
    for (const server of servers) {
      const item = value.entries[game][server];
      if (!item || typeof item.origin !== 'string' || typeof item.enabled !== 'boolean') throw Error('游戏入口配置无效。');
      const url = new URL(item.origin);
      if (url.protocol !== 'https:' || url.origin !== item.origin || url.username || url.password) throw Error('游戏入口必须使用精确的 HTTPS 来源。');
      entries[game][server] = { origin: url.origin, enabled: item.enabled };
    }
  }
  return { version: 1, lobbies, entries };
}

/** The page owns the server. A preference must never relabel this deployment. */
export function currentLobby(config, href) {
  const page = new URL(href);
  const path = page.pathname.endsWith('/') ? page.pathname : page.pathname + '/';
  for (const server of servers) {
    const lobby = new URL(config.lobbies[server].url);
    if (page.origin === lobby.origin && path === lobby.pathname) return server;
  }
  // Local static previews keep both layouts testable without real DNS/TLS.
  if (['localhost', '127.0.0.1', '[::1]'].includes(page.hostname)) return path === '/lobby/' ? 'cloudflare' : path === '/' ? 'aliyun' : null;
  return null;
}

export function lobbyURL(config, server, invitation = null) {
  if (!servers.includes(server) || !config.lobbies[server].enabled || (invitation && invitation.server !== server)) return null;
  const url = new URL(config.lobbies[server].url);
  if (invitation) {
    // Reuse the strict room/role checks; never copy query strings or fragments.
    if (!entryURL(config, invitation.game, server, invitation)) return null;
    url.searchParams.set('game', invitation.game);
    url.searchParams.set('server', server);
    url.searchParams.set('room', `${server === 'aliyun' ? 'A' : 'C'}-${invitation.room}`);
    if (invitation.watch) url.searchParams.set('watch', '1');
    url.searchParams.set('lobbyHop', '1');
  }
  return url.href;
}

/** A room prefix outranks browser preferences. Ambiguous/malformed links fail closed. */
export function readInvitation(search) {
  const params = new URLSearchParams(search);
  if (!['game', 'server', 'room', 'watch'].some(key => params.has(key))) return null;
  if (['game', 'server', 'room', 'watch', 'lobbyHop'].some(key => params.getAll(key).length > 1)) throw Error('邀请链接包含重复参数。请使用原始游戏邀请。');
  const game = params.get('game');
  const room = params.get('room')?.toUpperCase();
  if (!games.includes(game) || !room) throw Error('邀请链接缺少游戏或房间信息。请使用原始游戏邀请。');
  const match = (game === 'athlete' ? /^([CA])-([A-Z2-9]{6})$/ : /^([CA])-([A-Z2-9]{8})$/).exec(room);
  if (!match) throw Error('邀请房间码无效。请使用包含服务器前缀的原始邀请。');
  const server = match[1] === 'A' ? 'aliyun' : 'cloudflare';
  if (params.has('server') && params.get('server') !== server) throw Error('邀请链接的服务器与房间码不一致。请使用原始游戏邀请。');
  if (params.has('watch') && !['0', '1'].includes(params.get('watch'))) throw Error('邀请链接的观战标记无效。');
  if (params.has('lobbyHop') && params.get('lobbyHop') !== '1') throw Error('邀请链接的大厅跳转标记无效。');
  return { game, server, room: match[2], watch: params.get('watch') === '1' };
}

export function entryURL(config, game, server, invitation = null) {
  if (!games.includes(game) || !servers.includes(server)) return null;
  const entry = config.entries[game][server];
  if (!config.lobbies[server].enabled || !entry.enabled || (invitation && (invitation.game !== game || invitation.server !== server))) return null;
  const url = new URL('/', entry.origin);
  if (invitation) {
    const prefix = server === 'aliyun' ? 'A' : 'C';
    const pattern = game === 'athlete' ? /^[A-Z2-9]{6}$/ : /^[A-Z2-9]{8}$/;
    if (!pattern.test(invitation.room) || typeof invitation.watch !== 'boolean') return null;
    if (game === 'athlete') {
      url.pathname = `/room/${prefix}-${invitation.room}`;
      if (invitation.watch) url.searchParams.set('spectate', '1');
    } else {
      url.searchParams.set('room', `${prefix}-${invitation.room}`);
      if (invitation.watch) url.searchParams.set('watch', '1');
    }
  }
  return url.href;
}

export function readPreference(storage) {
  try {
    const value = storage.getItem('games-lobby:server:v1');
    return servers.includes(value) ? value : 'aliyun';
  } catch { return 'aliyun'; }
}
export function savePreference(storage, server) {
  if (!servers.includes(server)) return;
  try { storage.setItem('games-lobby:server:v1', server); } catch { /* Optional preference only. */ }
}
